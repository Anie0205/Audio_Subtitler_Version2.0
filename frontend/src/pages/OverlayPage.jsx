import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import StyleSidebar from "../components/StyleSidebar";
import VideoPlayer from "../components/VideoPlayer";
import { buildApiUrl, ENDPOINTS } from "../config/api.js";

const OverlayPage = () => {
  const [videoUrl, setVideoUrl] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [videoFileName, setVideoFileName] = useState("");
  const [srtData, setSrtData] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [styleConfig, setStyleConfig] = useState({
    font: "Arial",
    font_size: 28,
    bold: false,
    italic: false,
    font_color: "#FFFFFF",
    outline_color: "#000000",
    outline_thickness: 2,
    shadow_offset: 0,
    alignment: 2,
    margin_v: 30,
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Get data from sessionStorage
    const originalVideo = sessionStorage.getItem("originalVideo");
    const srtContent = sessionStorage.getItem("srtContent");
    const language = sessionStorage.getItem("targetLanguage");
    const fileName = sessionStorage.getItem("videoFileName");
    const subtitleCount = sessionStorage.getItem("subtitleCount");

    if (!originalVideo) {
      // Redirect back to home if no video data
      navigate("/");
      return;
    }

    setVideoUrl(originalVideo);
    setTargetLanguage(language || "en");
    setVideoFileName(fileName || "video.mp4");

    // Parse SRT content if available
    if (srtContent) {
      try {
        const parsedSrt = parseSRTContent(srtContent);
        setSrtData(parsedSrt);
        console.log(`Loaded ${parsedSrt.length} subtitles`);
      } catch (error) {
        console.error("Error parsing SRT content:", error);
        // Fallback to sample data
        setSrtData(generateSampleSrt());
      }
    } else {
      // Fallback to sample data
      setSrtData(generateSampleSrt());
    }
  }, [navigate]);

  const parseSRTContent = (srtContent) => {
    const subtitles = [];
    const blocks = srtContent.trim().split("\n\n");

    for (const block of blocks) {
      const lines = block.split("\n");
      if (lines.length >= 3) {
        const index = parseInt(lines[0]);
        const timeLine = lines[1];
        const text = lines.slice(2).join("\n");

        const timeMatch = timeLine.match(
          /(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/
        );
        if (timeMatch) {
          const startTime = parseSRTTime(timeMatch[1]);
          const endTime = parseSRTTime(timeMatch[2]);

          subtitles.push({
            start: startTime,
            end: endTime,
            text: text,
          });
        }
      }
    }

    return subtitles;
  };

  const parseSRTTime = (timeStr) => {
    const [time, ms] = timeStr.split(",");
    const [hours, minutes, seconds] = time.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds + ms / 1000;
  };

  const generateSampleSrt = () => {
    return [
      { start: 0, end: 3, text: "Welcome to our video subtitle editor" },
      { start: 3.5, end: 6, text: "This is a sample subtitle" },
      { start: 6.5, end: 9, text: "You can customize the appearance" },
      { start: 9.5, end: 12, text: "And see changes in real-time" },
      { start: 12.5, end: 15, text: "Try changing the style controls" },
    ];
  };

  const handleStyleChange = (newStyle) => {
    setStyleConfig((prev) => ({ ...prev, ...newStyle }));
  };

  const handlePresetApply = (preset) => {
    setStyleConfig(preset);
  };

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      // Create SRT file content from current subtitle data
      const srtContent = srtData
        .map((subtitle, index) => {
          const startTime = formatSRTTime(subtitle.start);
          const endTime = formatSRTTime(subtitle.end);
          return `${index + 1}\n${startTime} --> ${endTime}\n${
            subtitle.text
          }\n`;
        })
        .join("\n");

      const srtBlob = new Blob([srtContent], { type: "text/plain" });

      // Get the original video file from the URL
      const videoResponse = await fetch(videoUrl);
      const videoBlob = await videoResponse.blob();

      // Send to backend overlay service
      const formData = new FormData();
      formData.append("video", videoBlob, videoFileName);
      formData.append("srt", srtBlob, "subtitles.srt");
      formData.append("style_json", JSON.stringify(styleConfig));

      const response = await fetch(buildApiUrl(ENDPOINTS.OVERLAY_OVERLAY), {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const finalVideoBlob = await response.blob();
        const downloadUrl = URL.createObjectURL(finalVideoBlob);

        // Trigger download
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${videoFileName.replace(
          /\.[^/.]+$/,
          ""
        )}_with_subtitles.mp4`;
        a.click();

        URL.revokeObjectURL(downloadUrl);
      } else {
        const errorText = await response.text();
        console.error("Download failed:", errorText);
        alert(`Download failed: ${errorText}`);
      }
    } catch (error) {
      console.error("Error downloading video:", error);
      alert(`Error downloading video: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatSRTTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms
      .toString()
      .padStart(3, "0")}`;
  };

  const handleBackToHome = () => {
    // Clean up URLs
    if (videoUrl) URL.revokeObjectURL(videoUrl);

    // Clear sessionStorage
    sessionStorage.removeItem("originalVideo");
    sessionStorage.removeItem("srtContent");
    sessionStorage.removeItem("targetLanguage");
    sessionStorage.removeItem("videoFileName");
    sessionStorage.removeItem("subtitleCount");

    navigate("/");
  };

  if (!videoUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-80 bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <StyleSidebar
          styleConfig={styleConfig}
          onStyleChange={handleStyleChange}
          onPresetApply={handlePresetApply}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToHome}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">Subtitle Editor</h1>
              <p className="text-sm text-muted-foreground">{videoFileName}</p>
              <p className="text-xs text-muted-foreground">
                {srtData.length} subtitles loaded
              </p>
            </div>
          </div>

          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Video
              </>
            )}
          </Button>
        </div>

        {/* Video Player */}
        <div className="flex-1 p-6">
          <VideoPlayer
            videoUrl={videoUrl}
            srtData={srtData}
            styleConfig={styleConfig}
          />
        </div>
      </div>
    </div>
  );
};

export default OverlayPage;

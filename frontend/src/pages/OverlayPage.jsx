import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import StyleSidebar from '../components/StyleSidebar'
import VideoPlayer from '../components/VideoPlayer'
import { buildApiUrl, ENDPOINTS } from '../config/api.js'

const OverlayPage = () => {
  const [videoUrl, setVideoUrl] = useState(null)
  const [processedVideoUrl, setProcessedVideoUrl] = useState(null)
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [videoFileName, setVideoFileName] = useState('')
  const [srtData, setSrtData] = useState([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [styleConfig, setStyleConfig] = useState({
    font: 'Arial',
    font_size: 28,
    bold: false,
    italic: false,
    font_color: '#FFFFFF',
    outline_color: '#000000',
    outline_thickness: 2,
    shadow_offset: 0,
    alignment: 2,
    margin_v: 30
  })
  
  const navigate = useNavigate()

  useEffect(() => {
    // Get data from sessionStorage
    const originalVideo = sessionStorage.getItem('originalVideo')
    const processedVideo = sessionStorage.getItem('processedVideo')
    const language = sessionStorage.getItem('targetLanguage')
    const fileName = sessionStorage.getItem('videoFileName')
    
    if (!originalVideo) {
      // Redirect back to home if no video data
      navigate('/')
      return
    }
    
    setVideoUrl(originalVideo)
    setProcessedVideoUrl(processedVideo)
    setTargetLanguage(language || 'en')
    setVideoFileName(fileName || 'video.mp4')
    
    // Generate sample SRT data for demo purposes
    // In a real app, this would come from the backend
    const sampleSrt = [
      { start: 0, end: 3, text: "Welcome to our video subtitle editor" },
      { start: 3.5, end: 6, text: "This is a sample subtitle" },
      { start: 6.5, end: 9, text: "You can customize the appearance" },
      { start: 9.5, end: 12, text: "And see changes in real-time" },
      { start: 12.5, end: 15, text: "Try changing the style controls" }
    ]
    setSrtData(sampleSrt)
  }, [navigate])

  const handleStyleChange = (newStyle) => {
    setStyleConfig(prev => ({ ...prev, ...newStyle }))
  }

  const handlePresetApply = (preset) => {
    setStyleConfig(preset)
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    
    try {
      // Create a temporary SRT file content
      const srtContent = srtData.map((subtitle, index) => {
        const startTime = formatSRTTime(subtitle.start)
        const endTime = formatSRTTime(subtitle.end)
        return `${index + 1}\n${startTime} --> ${endTime}\n${subtitle.text}\n`
      }).join('\n')
      
      const srtBlob = new Blob([srtContent], { type: 'text/plain' })
      
      // Get the original video file from the URL
      const videoResponse = await fetch(videoUrl)
      const videoBlob = await videoResponse.blob()
      
      // Send to backend for final processing
      const formData = new FormData()
      formData.append('video', videoBlob, videoFileName)
      formData.append('srt', srtBlob, 'subtitles.srt')
      formData.append('style_json', JSON.stringify(styleConfig))
      
      const response = await fetch(buildApiUrl(ENDPOINTS.OVERLAY_OVERLAY), {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const finalVideoBlob = await response.blob()
        const downloadUrl = URL.createObjectURL(finalVideoBlob)
        
        // Trigger download
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `${videoFileName.replace(/\.[^/.]+$/, '')}_with_subtitles.mp4`
        a.click()
        
        URL.revokeObjectURL(downloadUrl)
      } else {
        console.error('Download failed:', await response.text())
        // Fallback: download the processed video if available
        if (processedVideoUrl) {
          const a = document.createElement('a')
          a.href = processedVideoUrl
          a.download = `${videoFileName.replace(/\.[^/.]+$/, '')}_processed.mp4`
          a.click()
        }
      }
    } catch (error) {
      console.error('Error downloading video:', error)
      // Fallback: download the processed video if available
      if (processedVideoUrl) {
        const a = document.createElement('a')
        a.href = processedVideoUrl
        a.download = `${videoFileName.replace(/\.[^/.]+$/, '')}_processed.mp4`
        a.click()
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const formatSRTTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
  }

  const handleBackToHome = () => {
    // Clean up URLs
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    if (processedVideoUrl) URL.revokeObjectURL(processedVideoUrl)
    
    // Clear sessionStorage
    sessionStorage.removeItem('originalVideo')
    sessionStorage.removeItem('processedVideo')
    sessionStorage.removeItem('targetLanguage')
    sessionStorage.removeItem('videoFileName')
    
    navigate('/')
  }

  if (!videoUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading video...</p>
        </div>
      </div>
    )
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
  )
}

export default OverlayPage


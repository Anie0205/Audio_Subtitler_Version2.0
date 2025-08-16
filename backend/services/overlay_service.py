import requests
import tempfile
import os
from config import OVERLAY_SERVICE_URL, ENDPOINTS, OVERLAY_TIMEOUT

class OverlayService:
    def __init__(self):
        self.base_url = OVERLAY_SERVICE_URL
        self.overlay_endpoint = ENDPOINTS["overlay"]["overlay"]
    
    def overlay_subtitles(self, video_path, srt_path, style_json):
        """Send video, SRT, and style to external overlay service"""
        try:
            with open(video_path, "rb") as video_file, open(srt_path, "rb") as srt_file:
                files = {
                    "video": ("video.mp4", video_file, "video/mp4"),
                    "srt": ("subtitles.srt", srt_file, "text/plain")
                }
                data = {"style_json": style_json}
                
                response = requests.post(
                    f"{self.base_url}{self.overlay_endpoint}",
                    files=files,
                    data=data,
                    timeout=OVERLAY_TIMEOUT
                )
                
                if response.status_code == 200:
                    # Save the response video to a temporary file
                    output_path = tempfile.mktemp(suffix=".mp4")
                    with open(output_path, "wb") as f:
                        f.write(response.content)
                    
                    return output_path
                else:
                    raise Exception(f"Overlay API failed with status {response.status_code}: {response.text}")
                    
        except Exception as e:
            raise Exception(f"Overlay service failed: {e}")
    
    def overlay_subtitles_with_blobs(self, video_blob, srt_content, style_json):
        """Send video blob and SRT content to external overlay service"""
        try:
            # Create temporary files
            video_path = tempfile.mktemp(suffix=".mp4")
            srt_path = tempfile.mktemp(suffix=".srt")
            
            # Write video blob to file
            with open(video_path, "wb") as f:
                f.write(video_blob)
            
            # Write SRT content to file
            with open(srt_path, "w", encoding="utf-8") as f:
                f.write(srt_content)
            
            # Send to overlay service
            result_path = self.overlay_subtitles(video_path, srt_path, style_json)
            
            # Clean up temporary files
            if os.path.exists(video_path):
                os.remove(video_path)
            if os.path.exists(srt_path):
                os.remove(srt_path)
            
            return result_path
            
        except Exception as e:
            # Clean up temporary files on error
            if os.path.exists(video_path):
                os.remove(video_path)
            if os.path.exists(srt_path):
                os.remove(srt_path)
            raise Exception(f"Overlay service failed: {e}")

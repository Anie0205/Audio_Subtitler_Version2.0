import requests
import tempfile
import os
from config import TRANSLATOR_SERVICE_URL, ENDPOINTS, TRANSLATION_TIMEOUT

class TranslatorService:
    def __init__(self):
        self.base_url = TRANSLATOR_SERVICE_URL
        self.translate_endpoint = ENDPOINTS["translator"]["translate"]
    
    def translate_srt(self, srt_content, target_language, source_language="en"):
        """Send SRT content to external translator service"""
        try:
            # Create temporary SRT file
            srt_path = tempfile.mktemp(suffix=".srt")
            with open(srt_path, "w", encoding="utf-8") as f:
                f.write(srt_content)
            
            # Send to translator service
            with open(srt_path, "rb") as srt_file:
                files = {"srt": ("subtitles.srt", srt_file, "text/plain")}
                data = {
                    "target_language": target_language,
                    "source_language": source_language
                }
                
                response = requests.post(
                    f"{self.base_url}{self.translate_endpoint}",
                    files=files,
                    data=data,
                    timeout=TRANSLATION_TIMEOUT
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Clean up temporary file
                    if os.path.exists(srt_path):
                        os.remove(srt_path)
                    
                    return result.get("translated_srt", "")
                else:
                    raise Exception(f"Translation API failed with status {response.status_code}: {response.text}")
                    
        except Exception as e:
            # Clean up temporary file on error
            if os.path.exists(srt_path):
                os.remove(srt_path)
            raise Exception(f"Translation service failed: {e}")
    
    def translate_dialogue(self, dialogue_text, target_language, source_language="en"):
        """Send dialogue text to external translator service"""
        try:
            data = {
                "dialogue": dialogue_text,
                "target_language": target_language,
                "source_language": source_language
            }
            
            response = requests.post(
                f"{self.base_url}{self.translate_endpoint}",
                json=data,
                timeout=TRANSLATION_TIMEOUT
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("translated_dialogue", "")
            else:
                raise Exception(f"Translation API failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            raise Exception(f"Translation service failed: {e}")

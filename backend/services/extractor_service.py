import requests
import tempfile
import os
from moviepy import VideoFileClip
from config import EXTRACTOR_SERVICE_URL, ENDPOINTS, TRANSCRIPTION_TIMEOUT

class ExtractorService:
    def __init__(self):
        self.base_url = EXTRACTOR_SERVICE_URL
        self.transcribe_endpoint = ENDPOINTS["extractor"]["transcribe"]
    
    def extract_audio_from_video(self, video_path):
        """Extract audio from video file"""
        try:
            video = VideoFileClip(video_path)
            if video.audio is None:
                raise Exception("No audio track found in video")
            
            # Create temporary audio file
            audio_path = tempfile.mktemp(suffix=".wav")
            video.audio.write_audiofile(audio_path, codec="pcm_s16le")
            video.close()
            
            return audio_path
        except Exception as e:
            raise Exception(f"Audio extraction failed: {e}")
    
    def transcribe_audio(self, audio_path):
        """Send audio to external extractor service for transcription"""
        try:
            print(f"🔄 Sending audio to transcription service: {self.base_url}{self.transcribe_endpoint}")
            
            with open(audio_path, "rb") as audio_file:
                files = {"file": ("audio.wav", audio_file, "audio/wav")}
                
                response = requests.post(
                    f"{self.base_url}{self.transcribe_endpoint}",
                    files=files,
                    timeout=TRANSCRIPTION_TIMEOUT
                )
                
                print(f"📡 Transcription API response status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Handle different response formats
                    if "word_segments" in result:
                        return result
                    elif "segments" in result:
                        # Convert segments to word_segments format
                        word_segments = []
                        for segment in result.get("segments", []):
                            words = segment.get("words", [])
                            for word in words:
                                word_segments.append({
                                    "start": word.get("start", 0),
                                    "end": word.get("end", 0),
                                    "word": word.get("word", ""),
                                    "speaker": word.get("speaker", "Speaker_0")
                                })
                        return {"word_segments": word_segments, "language": result.get("language", "en")}
                    else:
                        raise Exception("Unexpected API response format")
                else:
                    print(f"❌ Transcription API failed with status {response.status_code}")
                    print(f"Response content: {response.text[:500]}...")
                    raise Exception(f"Transcription API failed with status {response.status_code}: {response.text}")
                    
        except requests.exceptions.Timeout:
            raise Exception(f"Transcription API request timed out after {TRANSCRIPTION_TIMEOUT} seconds")
        except requests.exceptions.ConnectionError:
            raise Exception(f"Failed to connect to transcription service at {self.base_url}")
        except Exception as e:
            raise Exception(f"Transcription service failed: {e}")
    
    def process_video(self, video_path):
        """Complete video processing: extract audio and transcribe"""
        try:
            # Step 1: Extract audio
            print("🔄 Extracting audio from video...")
            audio_path = self.extract_audio_from_video(video_path)
            
            # Step 2: Transcribe audio
            print("🔄 Transcribing audio...")
            transcription_result = self.transcribe_audio(audio_path)
            
            # Clean up temporary audio file
            if os.path.exists(audio_path):
                os.remove(audio_path)
            
            return transcription_result
            
        except Exception as e:
            raise Exception(f"Video processing failed: {e}")

import os
import tempfile
import shutil
import json
import sys
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from moviepy import VideoFileClip
from dotenv import load_dotenv
from typing import Optional

# Add the backend directory to Python path for proper imports
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Import services
try:
    from services.extractor_service import ExtractorService
    from services.translator_service import TranslatorService
    from services.overlay_service import OverlayService
    from Extractor.script_generator import group_into_sentences, save_srt, save_dialogue_txt, PAUSE_THRESHOLD, MAX_SUBTITLE_DURATION
    print("✅ All modules imported successfully")
except ImportError as e:
    print(f"❌ Module import failed: {e}")
    raise ImportError(f"Failed to import required modules: {e}")

load_dotenv()

# Initialize services
extractor_service = ExtractorService()
translator_service = TranslatorService()
overlay_service = OverlayService()

app = FastAPI()

@app.post("/process")
async def process_video(
    video: UploadFile = File(...),
    target_language: str = Form(...),
    style_json: str = Form(...)
):
    """
    Main pipeline endpoint that orchestrates the distributed processing:
    1. Extract audio and transcribe using external extractor service
    2. Translate using external translator service (if needed)
    3. Return SRT data for frontend customization
    """
    tmpdir = tempfile.mkdtemp()
    try:
        # Save uploaded video
        video_path = os.path.join(tmpdir, video.filename)
        with open(video_path, "wb") as f:
            shutil.copyfileobj(video.file, f)

        # Step 1: Extract audio and transcribe using external extractor service
        try:
            print("🔄 Starting transcription with external extractor service...")
            transcription_result = extractor_service.process_video(video_path)
            
            # Generate SRT from transcription result
            subtitles = group_into_sentences(
                transcription_result["word_segments"],
                pause_threshold=PAUSE_THRESHOLD,
                max_duration=MAX_SUBTITLE_DURATION
            )
            
            # Save SRT file
            srt_path = os.path.join(tmpdir, "subtitles.srt")
            save_srt(subtitles, srt_path)
            
            # Read SRT content
            with open(srt_path, "r", encoding="utf-8") as f:
                srt_content = f.read()
            
            print("✅ Transcription completed successfully")
            
        except Exception as e:
            raise Exception(f"Extractor service failed: {e}")

        # Step 2: Translation (if needed)
        detected_lang = transcription_result.get("language", "en")
        
        if target_language.lower() != detected_lang.lower():
            try:
                print(f"🔄 Translating from {detected_lang} to {target_language}...")
                translated_srt = translator_service.translate_srt(
                    srt_content, 
                    target_language, 
                    detected_lang
                )
                
                # Save translated SRT
                translated_srt_path = os.path.join(tmpdir, f"translated_{target_language}.srt")
                with open(translated_srt_path, "w", encoding="utf-8") as f:
                    f.write(translated_srt)
                
                srt_content = translated_srt
                srt_path = translated_srt_path
                
                print("✅ Translation completed successfully")
                
            except Exception as e:
                print(f"⚠️ Translation failed: {e}, using original subtitles")
                # Continue with original subtitles if translation fails

        # Step 3: Return SRT data for frontend customization
        # Read the final SRT content
        with open(srt_path, "r", encoding="utf-8") as f:
            final_srt_content = f.read()
        
        # Return SRT data as JSON response
        return JSONResponse({
            "status": "success",
            "message": "Video processed successfully",
            "srt_content": final_srt_content,
            "target_language": target_language,
            "subtitle_count": len(subtitles)
        })

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

@app.post("/overlay")
async def overlay_subtitles(
    video: UploadFile = File(...),
    srt: UploadFile = File(...),
    style_json: str = Form(...)
):
    """
    Overlay endpoint that sends video, SRT, and style to external overlay service
    """
    tmpdir = tempfile.mkdtemp()
    try:
        # Save uploaded files
        video_path = os.path.join(tmpdir, video.filename)
        srt_path = os.path.join(tmpdir, srt.filename)
        
        with open(video_path, "wb") as f:
            shutil.copyfileobj(video.file, f)
        with open(srt_path, "wb") as f:
            shutil.copyfileobj(srt.file, f)

        # Send to external overlay service
        try:
            print("🔄 Sending to external overlay service...")
            output_path = overlay_service.overlay_subtitles(video_path, srt_path, style_json)
            
            print("✅ Overlay completed successfully")
            return FileResponse(output_path, filename="output_with_subs.mp4", media_type="video/mp4")
            
        except Exception as e:
            raise Exception(f"Overlay service failed: {e}")

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

@app.get("/")
async def root():
    return {"message": "Audio-Subtitle Pipeline API is running"}

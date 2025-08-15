import os
import tempfile
import shutil
import subprocess
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from moviepy.editor import VideoFileClip
from dotenv import load_dotenv
from pathlib import Path
from typing import Optional

# Import your modules with absolute imports for deployment compatibility
try:
    from Extractor.script_generator import group_into_sentences, save_srt, save_dialogue_txt, PAUSE_THRESHOLD, MAX_SUBTITLE_DURATION, process_video_pipeline
    from translator.translation import parse_script_file, parse_srt_file, translate_scene, parse_translated_dialogue, align_translations_to_srt, write_srt_file
    from overlay.overlay import burn_subtitles_from_paths
    print("✅ All modules imported successfully")
except ImportError as e:
    print(f"❌ Module import failed: {e}")
    raise ImportError(f"Failed to import required modules: {e}")

load_dotenv()

# Validate environment variables
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in environment variables. Please set it in your .env file.")

# Check if FFmpeg is available
def check_ffmpeg():
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

if not check_ffmpeg():
    raise RuntimeError("FFmpeg not found. Please install FFmpeg and ensure it's in your PATH.")

app = FastAPI()

@app.post("/process")
async def process_video(
    video: UploadFile = File(...),
    target_language: str = Form(...),
    style_json: str = Form(...)
):
    tmpdir = tempfile.mkdtemp()
    try:
        # Save uploaded video
        video_path = os.path.join(tmpdir, video.filename)
        with open(video_path, "wb") as f:
            shutil.copyfileobj(video.file, f)

        # Step 1: Extract audio
        audio_path = os.path.join(tmpdir, "audio.wav")
        video_clip = VideoFileClip(video_path)
        if video_clip.audio is not None:
            video_clip.audio.write_audiofile(audio_path, codec="pcm_s16le")
        else:
            raise Exception("No audio track found in video")
        video_clip.close()

        # Step 2: Use the external API pipeline (no local ML models!)
        try:
            print("🔄 Starting transcription with external WhisperX API...")
            result = process_video_pipeline(
                video_path=video_path,
                audio_path=audio_path,
                output_srt_path=os.path.join(tmpdir, "subtitles.srt"),
                output_txt_path=os.path.join(tmpdir, "dialogue.txt")
            )
            
            # Get the SRT path from the pipeline output
            srt_path = os.path.join(tmpdir, "subtitles.srt")
            txt_path = os.path.join(tmpdir, "dialogue.txt")
            
            print("✅ Transcription completed successfully")
            
        except Exception as e:
            raise Exception(f"External API transcription failed: {e}")

        # Step 3: Translation (if needed)
        # Note: We'll use the detected language from the API response
        detected_lang = "en"  # Default, you can extract this from API response if needed
        
        if target_language.lower() != detected_lang.lower():
            try:
                dialogue = parse_script_file(txt_path)
                srt_subtitles = parse_srt_file(srt_path)
                translated_text = translate_scene(dialogue, target_language)
                translated_dialogue = parse_translated_dialogue(translated_text)
                aligned_subtitles = align_translations_to_srt(srt_subtitles, translated_dialogue, target_language)
                srt_path = os.path.join(tmpdir, f"translated_{target_language}.srt")
                write_srt_file(aligned_subtitles, srt_path)
            except Exception as e:
                raise Exception(f"Translation failed: {e}")

        # Step 4: Overlay
        output_video_path = os.path.join(tmpdir, "final_output.mp4")
        try:
            burn_subtitles_from_paths(video_path, srt_path, style_json, output_video_path)
        except Exception as e:
            raise Exception(f"Subtitle overlay failed: {e}")

        return FileResponse(output_video_path, filename="final_output.mp4", media_type="video/mp4")

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

@app.get("/")
async def root():
    return {"message": "Audio-Subtitle Pipeline API is running"}

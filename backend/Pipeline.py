import os
import sys
import tempfile
import shutil
import subprocess
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from moviepy.editor import VideoFileClip
import torch
import whisperx
from whisperx.diarize import DiarizationPipeline
from dotenv import load_dotenv
from pathlib import Path
from typing import Optional
import uvicorn

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Import your modules with fallback handling
try:
    # Try relative imports first
    from .Extractor import group_into_sentences, save_srt, save_dialogue_txt, PAUSE_THRESHOLD, MAX_SUBTITLE_DURATION
    from .translator import parse_script_file, parse_srt_file, translate_scene, parse_translated_dialogue, align_translations_to_srt, write_srt_file
    from .overlay import burn_subtitles_from_paths
    print("✅ All modules imported successfully (relative)")
except ImportError as e:
    print(f"⚠️ Relative imports failed: {e}")
    try:
        # Fallback to absolute imports
        from Extractor import group_into_sentences, save_srt, save_dialogue_txt, PAUSE_THRESHOLD, MAX_SUBTITLE_DURATION
        from translator import parse_script_file, parse_srt_file, translate_scene, parse_translated_dialogue, align_translations_to_srt, write_srt_file
        from overlay import burn_subtitles_from_paths
        print("✅ All modules imported successfully (absolute)")
    except ImportError as e2:
        print(f"❌ All imports failed: {e2}")
        raise ImportError(f"Failed to import required modules: {e2}")

load_dotenv()

# Validate environment variables
HF_AUTH_TOKEN = os.getenv("HF_AUTH_TOKEN")
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")

if not HF_AUTH_TOKEN:
    raise ValueError("HF_AUTH_TOKEN not found in environment variables. Please set it in your .env file.")
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

        # Step 2: Transcription with script_generator pipeline
        device = "cuda" if torch.cuda.is_available() else "cpu"
        try:
            model = whisperx.load_model("base", device)
        except Exception as e:
            raise Exception(f"Failed to load WhisperX model: {e}")
            
        audio = whisperx.load_audio(audio_path)
        result = model.transcribe(audio)
        detected_lang = result["language"]

        try:
            align_model, metadata = whisperx.load_align_model(
                language_code=detected_lang, device=device
            )
            result_aligned = whisperx.align(result["segments"], align_model, metadata, audio, device)
        except Exception as e:
            raise Exception(f"Failed to align audio: {e}")

        try:
            diarize_model = DiarizationPipeline(use_auth_token=HF_AUTH_TOKEN, device=device)
            diarize_segments = diarize_model(audio_path)
            result_with_speakers = whisperx.assign_word_speakers(diarize_segments, result_aligned)
        except Exception as e:
            raise Exception(f"Failed to perform speaker diarization: {e}")

        # Save original subs
        srt_path = os.path.join(tmpdir, "subtitles.srt")
        txt_path = os.path.join(tmpdir, "dialogue.txt")
        subtitles = group_into_sentences(
            result_with_speakers["word_segments"],
            pause_threshold=PAUSE_THRESHOLD,
            max_duration=MAX_SUBTITLE_DURATION
        )
        save_srt(subtitles, srt_path)
        save_dialogue_txt(subtitles, txt_path)

        # Step 3: Translation (if needed)
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

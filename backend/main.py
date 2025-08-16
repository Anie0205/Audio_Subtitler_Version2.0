#!/usr/bin/env python3
"""
Audio-Subtitle Pipeline API - Unified Script
Combines pipeline processing, translation, overlay, and health monitoring
with comprehensive error handling and debugging
"""

import os
import sys
import tempfile
import shutil
import json
import uvicorn
import requests
import traceback
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from moviepy import VideoFileClip
from dotenv import load_dotenv
from typing import Optional
from datetime import datetime

# Add the backend directory to Python path for proper imports
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Load environment variables
load_dotenv()

# Create main app
app = FastAPI(
    title="Audio-Subtitle Pipeline API",
    description="Complete pipeline for video transcription, translation, and subtitle overlay",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error tracking
error_log = []

def log_error(context: str, error: Exception, details: str = ""):
    """Log errors with context and stack trace"""
    error_entry = {
        "timestamp": datetime.now().isoformat(),
        "context": context,
        "error_type": type(error).__name__,
        "error_message": str(error),
        "details": details,
        "stack_trace": traceback.format_exc()
    }
    error_log.append(error_entry)
    print(f"❌ ERROR in {context}: {error}")
    if details:
        print(f"   Details: {details}")
    print(f"   Stack trace: {error_entry['stack_trace']}")

def log_info(message: str):
    """Log informational messages with timestamp"""
    timestamp = datetime.now().isoformat()
    print(f"ℹ️ [{timestamp}] {message}")

def log_success(message: str):
    """Log success messages with timestamp"""
    timestamp = datetime.now().isoformat()
    print(f"✅ [{timestamp}] {message}")

def log_warning(message: str):
    """Log warning messages with timestamp"""
    timestamp = datetime.now().isoformat()
    print(f"⚠️ [{timestamp}] {message}")

# Import and initialize services with comprehensive error handling
log_info("Starting service initialization...")

# Initialize services dictionary
services = {}
service_status = {}

try:
    # Import extractor service
    log_info("Importing extractor service...")
    from services.extractor_service import ExtractorService
    services['extractor'] = ExtractorService()
    service_status['extractor'] = "loaded"
    log_success("Extractor service loaded successfully")
except ImportError as e:
    log_error("Extractor service import", e, "Failed to import ExtractorService")
    service_status['extractor'] = "failed"
    services['extractor'] = None
except Exception as e:
    log_error("Extractor service initialization", e, "Unexpected error during initialization")
    service_status['extractor'] = "failed"
    services['extractor'] = None

try:
    # Import translator service
    log_info("Importing translator service...")
    from services.translator_service import TranslatorService
    services['translator'] = TranslatorService()
    service_status['translator'] = "loaded"
    log_success("Translator service loaded successfully")
except ImportError as e:
    log_error("Translator service import", e, "Failed to import TranslatorService")
    service_status['translator'] = "failed"
    services['translator'] = None
except Exception as e:
    log_error("Translator service initialization", e, "Unexpected error during initialization")
    service_status['translator'] = "failed"
    services['translator'] = None

try:
    # Import overlay service
    log_info("Importing overlay service...")
    from services.overlay_service import OverlayService
    services['overlay'] = OverlayService()
    service_status['overlay'] = "loaded"
    log_success("Overlay service loaded successfully")
except ImportError as e:
    log_error("Overlay service import", e, "Failed to import OverlayService")
    service_status['overlay'] = "failed"
    services['overlay'] = None
except Exception as e:
    log_error("Overlay service initialization", e, "Unexpected error during initialization")
    service_status['overlay'] = "failed"
    services['overlay'] = None

try:
    # Import script generator functions
    log_info("Importing script generator functions...")
    from Extractor.script_generator import group_into_sentences, save_srt, save_dialogue_txt, PAUSE_THRESHOLD, MAX_SUBTITLE_DURATION
    service_status['script_generator'] = "loaded"
    log_success("Script generator functions loaded successfully")
except ImportError as e:
    log_error("Script generator import", e, "Failed to import script generator functions")
    service_status['script_generator'] = "failed"
    # Set fallback values
    PAUSE_THRESHOLD = 1.0
    MAX_SUBTITLE_DURATION = 8.0
except Exception as e:
    log_error("Script generator initialization", e, "Unexpected error during initialization")
    service_status['script_generator'] = "failed"
    # Set fallback values
    PAUSE_THRESHOLD = 1.0
    MAX_SUBTITLE_DURATION = 8.0

# Import and include the translator routes
try:
    log_info("Importing translator API routes...")
    from translator.translator_api import app as translator_app
    app.mount("/translator", translator_app)
    log_success("Translator API routes mounted successfully")
except ImportError as e:
    log_error("Translator API import", e, "Failed to import translator API")
    # Create a minimal translator app to prevent crashes
    from fastapi import APIRouter
    translator_app = FastAPI(title="Translator (Fallback)")
    translator_app.router = APIRouter()
    
    @translator_app.get("/")
    async def translator_fallback():
        return {"error": "Translator module failed to load", "details": str(e)}
    
    app.mount("/translator", translator_app)
    log_warning("Translator API fallback created")

# Import and include the overlay routes
try:
    log_info("Importing overlay API routes...")
    from overlay.overlay import router as overlay_router
    app.include_router(overlay_router, prefix="/overlay", tags=["overlay"])
    log_success("Overlay API routes included successfully")
except ImportError as e:
    log_error("Overlay API import", e, "Failed to import overlay API")
    # Create a minimal overlay router to prevent crashes
    from fastapi import APIRouter
    overlay_router = APIRouter()
    
    @overlay_router.get("/")
    async def overlay_fallback():
        return {"error": "Overlay module failed to load", "details": str(e)}
    
    app.include_router(overlay_router, prefix="/overlay", tags=["overlay"])
    log_warning("Overlay API fallback created")

# Main pipeline endpoint
@app.post("/pipeline/process")
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
    log_info(f"Starting video processing: {video.filename}, target_lang: {target_language}")
    
    tmpdir = tempfile.mkdtemp()
    try:
        # Save uploaded video
        video_path = os.path.join(tmpdir, video.filename)
        log_info(f"Saving uploaded video to: {video_path}")
        
        with open(video_path, "wb") as f:
            shutil.copyfileobj(video.file, f)
        
        log_success(f"Video saved successfully: {os.path.getsize(video_path)} bytes")

        # Step 1: Extract audio and transcribe using external extractor service
        if not services.get('extractor'):
            raise Exception("Extractor service not available")
            
        try:
            log_info("Starting transcription with external extractor service...")
            transcription_result = services['extractor'].process_video(video_path)
            
            # Generate SRT from transcription result
            if not service_status.get('script_generator') == "loaded":
                raise Exception("Script generator functions not available")
                
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
            
            log_success(f"Transcription completed successfully: {len(subtitles)} subtitles generated")
            
        except Exception as e:
            log_error("Transcription step", e, f"Video: {video.filename}")
            raise Exception(f"Extractor service failed: {e}")

        # Step 2: Translation (if needed)
        detected_lang = transcription_result.get("language", "en")
        log_info(f"Detected language: {detected_lang}, target language: {target_language}")
        
        if target_language.lower() != detected_lang.lower():
            if not services.get('translator'):
                log_warning("Translation service not available, using original subtitles")
            else:
                try:
                    log_info(f"Translating from {detected_lang} to {target_language}...")
                    translated_srt = services['translator'].translate_srt(
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
                    
                    log_success("Translation completed successfully")
                    
                except Exception as e:
                    log_error("Translation step", e, f"Target language: {target_language}")
                    log_warning(f"Translation failed: {e}, using original subtitles")
                    # Continue with original subtitles if translation fails

        # Step 3: Return SRT data for frontend customization
        # Read the final SRT content
        with open(srt_path, "r", encoding="utf-8") as f:
            final_srt_content = f.read()
        
        log_success(f"Video processing completed successfully: {len(subtitles)} subtitles")
        
        # Return SRT data as JSON response
        return JSONResponse({
            "status": "success",
            "message": "Video processed successfully",
            "srt_content": final_srt_content,
            "target_language": target_language,
            "subtitle_count": len(subtitles)
        })

    except Exception as e:
        log_error("Video processing pipeline", e, f"Video: {video.filename}")
        return JSONResponse({"error": str(e)}, status_code=500)
    finally:
        # Clean up temporary files
        try:
            shutil.rmtree(tmpdir, ignore_errors=True)
            log_info(f"Cleaned up temporary directory: {tmpdir}")
        except Exception as e:
            log_error("Cleanup", e, f"Failed to clean up: {tmpdir}")

@app.post("/pipeline/overlay")
async def overlay_subtitles(
    video: UploadFile = File(...),
    srt: UploadFile = File(...),
    style_json: str = Form(...)
):
    """
    Overlay endpoint that sends video, SRT, and style to external overlay service
    """
    log_info(f"Starting subtitle overlay: video={video.filename}, srt={srt.filename}")
    
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
        if not services.get('overlay'):
            raise Exception("Overlay service not available")
            
        try:
            log_info("Sending to external overlay service...")
            output_path = services['overlay'].overlay_subtitles(video_path, srt_path, style_json)
            
            log_success("Overlay completed successfully")
            return FileResponse(output_path, filename="output_with_subs.mp4", media_type="video/mp4")
            
        except Exception as e:
            log_error("Overlay service", e, f"Video: {video.filename}, SRT: {srt.filename}")
            raise Exception(f"Overlay service failed: {e}")

    except Exception as e:
        log_error("Subtitle overlay", e, f"Video: {video.filename}, SRT: {srt.filename}")
        return JSONResponse({"error": str(e)}, status_code=500)
    finally:
        # Clean up temporary files
        try:
            shutil.rmtree(tmpdir, ignore_errors=True)
            log_info(f"Cleaned up temporary directory: {tmpdir}")
        except Exception as e:
            log_error("Cleanup", e, f"Failed to clean up: {tmpdir}")

# Health check endpoints
@app.get("/")
async def root():
    return {
        "message": "Audio-Subtitle Pipeline API is running",
        "endpoints": {
            "pipeline": "/pipeline/process",
            "pipeline_overlay": "/pipeline/overlay",
            "translator": "/translator/translate",
            "overlay": "/overlay/overlay",
            "health": "/health",
            "health_external": "/health/external",
            "errors": "/errors",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy", 
        "service": "audio-subtitle-pipeline",
        "timestamp": datetime.now().isoformat(),
        "services": service_status
    }

@app.get("/health/external")
async def external_health_check():
    """Check connectivity to external services"""
    log_info("Starting external service health check...")
    
    try:
        from config import EXTRACTOR_SERVICE_URL, TRANSLATOR_SERVICE_URL, OVERLAY_SERVICE_URL
    except ImportError as e:
        log_error("Config import", e, "Failed to import configuration")
        return {"error": "Configuration not available"}
    
    health_status = {
        "status": "checking",
        "timestamp": datetime.now().isoformat(),
        "services": {}
    }
    
    # Check extractor service
    try:
        log_info(f"Checking extractor service: {EXTRACTOR_SERVICE_URL}")
        response = requests.get(f"{EXTRACTOR_SERVICE_URL}/", timeout=5)
        health_status["services"]["extractor"] = {
            "status": "healthy" if response.status_code == 200 else "unhealthy",
            "status_code": response.status_code,
            "url": EXTRACTOR_SERVICE_URL
        }
        log_success(f"Extractor service: {response.status_code}")
    except Exception as e:
        log_error("Extractor health check", e, f"URL: {EXTRACTOR_SERVICE_URL}")
        health_status["services"]["extractor"] = {
            "status": "unreachable",
            "error": str(e),
            "url": EXTRACTOR_SERVICE_URL
        }
    
    # Check translator service
    try:
        log_info(f"Checking translator service: {TRANSLATOR_SERVICE_URL}")
        response = requests.get(f"{TRANSLATOR_SERVICE_URL}/", timeout=5)
        health_status["services"]["translator"] = {
            "status": "healthy" if response.status_code == 200 else "unhealthy",
            "status_code": response.status_code,
            "url": TRANSLATOR_SERVICE_URL
        }
        log_success(f"Translator service: {response.status_code}")
    except Exception as e:
        log_error("Translator health check", e, f"URL: {TRANSLATOR_SERVICE_URL}")
        health_status["services"]["translator"] = {
            "status": "unreachable",
            "error": str(e),
            "url": TRANSLATOR_SERVICE_URL
        }
    
    # Check overlay service
    try:
        log_info(f"Checking overlay service: {OVERLAY_SERVICE_URL}")
        response = requests.get(f"{OVERLAY_SERVICE_URL}/", timeout=5)
        health_status["services"]["overlay"] = {
            "status": "healthy" if response.status_code == 200 else "unhealthy",
            "status_code": response.status_code,
            "url": OVERLAY_SERVICE_URL
        }
        log_success(f"Overlay service: {response.status_code}")
    except Exception as e:
        log_error("Overlay health check", e, f"URL: {OVERLAY_SERVICE_URL}")
        health_status["services"]["overlay"] = {
            "status": "unreachable",
            "error": str(e),
            "url": OVERLAY_SERVICE_URL
        }
    
    # Overall status
    all_healthy = all(
        service["status"] == "healthy" 
        for service in health_status["services"].values()
    )
    health_status["status"] = "healthy" if all_healthy else "degraded"
    
    log_success(f"External health check completed: {health_status['status']}")
    return health_status

@app.get("/errors")
async def get_error_log():
    """Get the error log for debugging"""
    return {
        "error_count": len(error_log),
        "errors": error_log[-50:],  # Last 50 errors
        "timestamp": datetime.now().isoformat()
    }

# Main entry point
if __name__ == "__main__":
    # Get port from environment variable (Render sets PORT)
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    log_info(f"🚀 Starting Audio-Subtitle Pipeline API")
    log_info(f"📁 Working directory: {os.getcwd()}")
    log_info(f"🌐 Server will run on {host}:{port}")
    log_info(f"🔧 Service status: {service_status}")
    
    try:
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            reload=False,  # Disable reload in production
            log_level="info"
        )
    except Exception as e:
        log_error("Server startup", e, "Failed to start uvicorn server")
        sys.exit(1)

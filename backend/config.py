import os
from dotenv import load_dotenv

load_dotenv()

# Service URLs - these should be configured via environment variables
# IMPORTANT: Update EXTRACTOR_SERVICE_URL when your ngrok tunnel changes
EXTRACTOR_SERVICE_URL = os.getenv("EXTRACTOR_SERVICE_URL", "https://fbec50a7a6c4.ngrok-free.app")
TRANSLATOR_SERVICE_URL = os.getenv("TRANSLATOR_SERVICE_URL", "https://audio-subtitler-version2-0.onrender.com")
OVERLAY_SERVICE_URL = os.getenv("OVERLAY_SERVICE_URL", "https://audio-subtitler-version2-0.onrender.com")

# API Endpoints
ENDPOINTS = {
    "extractor": {
        "transcribe": "/transcribe"
    },
    "translator": {
        "translate": "/translator/translate"
    },
    "overlay": {
        "overlay": "/overlay/overlay"
    }
}

# Environment configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = ENVIRONMENT == "development"

# File upload settings
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/avi", "video/mov", "video/mkv", "video/wmv"]

# Processing settings
AUDIO_EXTRACTION_TIMEOUT = 300  # 5 minutes
TRANSCRIPTION_TIMEOUT = 600     # 10 minutes
TRANSLATION_TIMEOUT = 300       # 5 minutes
OVERLAY_TIMEOUT = 600           # 10 minutes

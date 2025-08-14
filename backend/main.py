import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add the current directory to Python path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

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

# Import and include the pipeline routes
try:
    # Try relative import first (for package structure)
    from .Pipeline import app as pipeline_app
    app.mount("/pipeline", pipeline_app)
    print("✅ Pipeline module loaded successfully (relative)")
except ImportError as e:
    print(f"⚠️ Relative import failed: {e}")
    try:
        # Fallback to absolute import (for direct execution)
        from Pipeline import app as pipeline_app
        app.mount("/pipeline", pipeline_app)
        print("✅ Pipeline module loaded (absolute)")
    except ImportError as e2:
        print(f"❌ Pipeline import failed completely: {e2}")
        # Create a minimal pipeline app to prevent crashes
        from fastapi import APIRouter
        pipeline_app = FastAPI(title="Pipeline (Fallback)")
        pipeline_app.router = APIRouter()
        app.mount("/pipeline", pipeline_app)

# Import and include the overlay routes
try:
    # Try relative import first
    from .overlay.overlay import router as overlay_router
    app.include_router(overlay_router, prefix="/overlay", tags=["overlay"])
    print("✅ Overlay module loaded successfully (relative)")
except ImportError as e:
    print(f"⚠️ Overlay relative import failed: {e}")
    try:
        # Fallback to absolute import
        from overlay.overlay import router as overlay_router
        app.include_router(overlay_router, prefix="/overlay", tags=["overlay"])
        print("✅ Overlay module loaded (absolute)")
    except ImportError as e2:
        print(f"❌ Overlay import failed completely: {e2}")

@app.get("/")
async def root():
    return {
        "message": "Audio-Subtitle Pipeline API is running",
        "endpoints": {
            "pipeline": "/pipeline/process",
            "overlay": "/overlay/overlay",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "audio-subtitle-pipeline"}

if __name__ == "__main__":
<<<<<<< HEAD
    # Get port from environment variable (Render sets PORT)
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"🚀 Starting server on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,  # Disable reload in production
=======
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
>>>>>>> cc028dc0ebb435719e1410fa1131181e5eecb42d
        log_level="info"
    )

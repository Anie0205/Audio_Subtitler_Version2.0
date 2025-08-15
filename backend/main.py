import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    # Import directly from Pipeline.py
    from Pipeline import app as pipeline_app
    app.mount("/pipeline", pipeline_app)
    print("✅ Pipeline module loaded successfully")
except ImportError as e:
    print(f"❌ Pipeline import failed: {e}")
    # Create a minimal pipeline app to prevent crashes
    from fastapi import APIRouter
    pipeline_app = FastAPI(title="Pipeline (Fallback)")
    pipeline_app.router = APIRouter()
    
    @pipeline_app.get("/")
    async def pipeline_fallback():
        return {"error": "Pipeline module failed to load", "details": str(e)}
    
    app.mount("/pipeline", pipeline_app)

# Import and include the overlay routes
try:
    # Import directly from overlay.py
    from overlay.overlay import router as overlay_router
    app.include_router(overlay_router, prefix="/overlay", tags=["overlay"])
    print("✅ Overlay module loaded successfully")
except ImportError as e:
    print(f"❌ Overlay import failed: {e}")
    # Create a minimal overlay router to prevent crashes
    from fastapi import APIRouter
    overlay_router = APIRouter()
    
    @overlay_router.get("/")
    async def overlay_fallback():
        return {"error": "Overlay module failed to load", "details": str(e)}
    
    app.include_router(overlay_router, prefix="/overlay", tags=["overlay"])

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
    # Get port from environment variable (Render sets PORT)
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"🚀 Starting server on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,  # Disable reload in production
        log_level="info"
    )

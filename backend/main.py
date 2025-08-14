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
    from .Pipeline import app as pipeline_app
    app.mount("/pipeline", pipeline_app)
except ImportError:
    # Fallback for direct execution
    from Pipeline import app as pipeline_app
    app.mount("/pipeline", pipeline_app)

# Import and include the overlay routes
try:
    from .overlay.overlay import router as overlay_router
    app.include_router(overlay_router, prefix="/overlay", tags=["overlay"])
except ImportError:
    # Fallback for direct execution
    from overlay.overlay import router as overlay_router
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
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )

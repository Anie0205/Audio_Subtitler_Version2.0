#!/usr/bin/env python3
"""
Deployment entry point for the Audio-Subtitle Pipeline API
This script ensures proper execution context and imports
"""

import os
import sys
import uvicorn
from pathlib import Path

def main():
    """Main entry point for deployment"""
    # Get port from environment variable (Render sets PORT)
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"🚀 Starting Audio-Subtitle Pipeline API")
    print(f"📁 Working directory: {os.getcwd()}")
    print(f"🌐 Server will run on {host}:{port}")
    
    # Run the FastAPI app using the main module
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,  # Disable reload in production
        log_level="info"
    )

if __name__ == "__main__":
    main()

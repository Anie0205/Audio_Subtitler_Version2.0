#!/usr/bin/env python3
"""
Test script to verify deployment readiness
Run this before deploying to catch any remaining issues
"""

import os
import sys
from pathlib import Path

def test_imports():
    """Test all critical imports"""
    print("🧪 Testing deployment imports...")
    
    # Test basic FastAPI imports
    try:
        from fastapi import FastAPI
        print("✅ FastAPI import successful")
    except ImportError as e:
        print(f"❌ FastAPI import failed: {e}")
        return False
    
    # Test Extractor module
    try:
        from Extractor.script_generator import group_into_sentences, save_srt, save_dialogue_txt
        print("✅ Extractor module import successful")
    except ImportError as e:
        print(f"❌ Extractor import failed: {e}")
        return False
    
    # Test translator module
    try:
        from translator.translation import parse_script_file, translate_scene
        print("✅ Translator module import successful")
    except ImportError as e:
        print(f"❌ Translator import failed: {e}")
        return False
    
    # Test overlay module
    try:
        from overlay.overlay import burn_subtitles_from_paths, router
        print("✅ Overlay module import successful")
    except ImportError as e:
        print(f"❌ Overlay import failed: {e}")
        return False
    
    # Test Pipeline module
    try:
        from Pipeline import app as pipeline_app
        print("✅ Pipeline module import successful")
    except ImportError as e:
        print(f"❌ Pipeline import failed: {e}")
        return False
    
    # Test main app
    try:
        from main import app
        print("✅ Main app import successful")
    except ImportError as e:
        print(f"❌ Main app import failed: {e}")
        return False
    
    print("🎉 All imports successful!")
    return True

def test_app_creation():
    """Test that the FastAPI app can be created"""
    print("\n🔧 Testing app creation...")
    
    try:
        from main import app
        print("✅ Main app created successfully")
        print(f"📋 Available routes: {len(app.routes)}")
        
        # Check if pipeline is mounted
        pipeline_mounted = any(route.path.startswith("/pipeline") for route in app.routes)
        if pipeline_mounted:
            print("✅ Pipeline routes mounted")
        else:
            print("⚠️ Pipeline routes not mounted")
            
        # Check if overlay is included
        overlay_included = any(route.path.startswith("/overlay") for route in app.routes)
        if overlay_included:
            print("✅ Overlay routes included")
        else:
            print("⚠️ Overlay routes not included")
            
        return True
    except Exception as e:
        print(f"❌ App creation failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Audio-Subtitle Pipeline - Deployment Test")
    print("=" * 50)
    
    # Test imports
    imports_ok = test_imports()
    
    if imports_ok:
        # Test app creation
        app_ok = test_app_creation()
        
        if app_ok:
            print("\n🎉 All tests passed! Ready for deployment!")
            sys.exit(0)
        else:
            print("\n❌ App creation test failed!")
            sys.exit(1)
    else:
        print("\n❌ Import tests failed!")
        sys.exit(1)

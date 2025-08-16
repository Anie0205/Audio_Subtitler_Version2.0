import os
import tempfile
import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Import translation functions
try:
    from .translation import parse_srt_file, translate_scene, parse_translated_dialogue, align_translations_to_srt, write_srt_file
    print("✅ Translation module imported successfully")
except ImportError as e:
    print(f"❌ Translation module import failed: {e}")
    raise ImportError(f"Failed to import translation module: {e}")

load_dotenv()

app = FastAPI(title="Translator Service API")

@app.post("/translate")
async def translate_srt(
    srt: UploadFile = File(...),
    target_language: str = Form(...),
    source_language: str = Form("en")
):
    """
    Translate SRT file content to target language
    """
    try:
        # Save uploaded SRT file
        tmpdir = tempfile.mkdtemp()
        srt_path = os.path.join(tmpdir, "input.srt")
        
        with open(srt_path, "wb") as f:
            content = await srt.read()
            f.write(content)
        
        # Parse SRT file
        srt_subtitles = parse_srt_file(srt_path)
        
        # Extract dialogue text for translation
        dialogue_text = "\n".join([sub['text'] for sub in srt_subtitles])
        
        # Translate dialogue
        translated_text = translate_scene(
            [{'speaker': 'Speaker', 'text': dialogue_text}], 
            target_language
        )
        
        # Parse translated dialogue
        translated_dialogue = parse_translated_dialogue(translated_text)
        
        # Align translations to SRT
        aligned_subtitles = align_translations_to_srt(srt_subtitles, translated_dialogue, target_language)
        
        # Generate translated SRT content
        output_path = os.path.join(tmpdir, "translated.srt")
        write_srt_file(aligned_subtitles, output_path)
        
        # Read translated SRT content
        with open(output_path, "r", encoding="utf-8") as f:
            translated_srt_content = f.read()
        
        # Clean up
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)
        
        return JSONResponse({
            "status": "success",
            "translated_srt": translated_srt_content,
            "target_language": target_language,
            "source_language": source_language,
            "subtitle_count": len(aligned_subtitles)
        })
        
    except Exception as e:
        return JSONResponse(
            {"error": f"Translation failed: {str(e)}"}, 
            status_code=500
        )

@app.post("/translate-dialogue")
async def translate_dialogue(
    dialogue: str = Form(...),
    target_language: str = Form(...),
    source_language: str = Form("en")
):
    """
    Translate dialogue text to target language
    """
    try:
        # Parse dialogue into format expected by translation function
        dialogue_lines = []
        for line in dialogue.split('\n'):
            line = line.strip()
            if line:
                if ':' in line:
                    speaker, text = line.split(':', 1)
                    dialogue_lines.append({'speaker': speaker.strip(), 'text': text.strip()})
                else:
                    dialogue_lines.append({'speaker': 'Speaker', 'text': line})
        
        # Translate dialogue
        translated_text = translate_scene(dialogue_lines, target_language)
        
        return JSONResponse({
            "status": "success",
            "translated_dialogue": translated_text,
            "target_language": target_language,
            "source_language": source_language
        })
        
    except Exception as e:
        return JSONResponse(
            {"error": f"Translation failed: {str(e)}"}, 
            status_code=500
        )

@app.get("/")
async def root():
    return {
        "message": "Translator Service API is running",
        "endpoints": {
            "translate_srt": "/translate",
            "translate_dialogue": "/translate-dialogue"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "translator"}

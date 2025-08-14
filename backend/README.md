# Audio-Subtitle Backend

A complete backend pipeline for video transcription, translation, and subtitle overlay using FastAPI, WhisperX, and Google Gemini AI.

## Features

- **Audio Extraction**: Extract audio from video files
- **Speech Recognition**: Transcribe audio using WhisperX with speaker diarization
- **Translation**: Translate subtitles using Google Gemini AI
- **Subtitle Overlay**: Burn subtitles directly into videos using FFmpeg
- **RESTful API**: FastAPI endpoints for all operations

## Architecture

```
backend/
├── Extractor/           # Audio extraction and transcription
├── translator/          # AI-powered translation
├── overlay/            # Subtitle overlay and video processing
├── Pipeline.py         # Main pipeline orchestration
├── main.py            # FastAPI server entry point
├── run_pipeline.py    # Direct testing script
└── requirements.txt    # Python dependencies
```

## Prerequisites

- Python 3.8+
- FFmpeg installed on your system
- Hugging Face token for speaker diarization
- Google Gemini API key for translation

## Installation

1. **Clone the repository and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   HF_AUTH_TOKEN=your_huggingface_token_here
   GOOGLE_API_KEY=your_gemini_api_key_here
   ```

## Testing & Validation

### Quick Test
Before running the full server, test the pipeline components:
```bash
python run_pipeline.py
```

This will verify:
- ✅ All modules can be imported
- ✅ Environment variables are set
- ✅ FFmpeg is available
- ✅ Dependencies are working

### Troubleshooting Common Issues

If you encounter import errors:
1. **Check directory structure**: Ensure all `__init__.py` files exist
2. **Verify Python path**: Make sure you're running from the backend directory
3. **Check dependencies**: Run `pip install -r requirements.txt`

## Usage

### Running the Server

```bash
python main.py
```

The server will start on `http://localhost:8000`

### API Endpoints

#### 1. Complete Pipeline (`POST /pipeline/process`)
Process a video through the entire pipeline: transcription → translation → overlay

**Parameters:**
- `video`: Video file (MP4, AVI, etc.)
- `target_language`: Target language for translation
- `style_json`: JSON string with subtitle styling options

**Example:**
```bash
curl -X POST "http://localhost:8000/pipeline/process" \
  -F "video=@sample.mp4" \
  -F "target_language=Spanish" \
  -F 'style_json={"font": "Arial", "font_size": 28, "font_color": "#FFFFFF"}'
```

#### 2. Standalone Overlay (`POST /overlay/overlay`)
Overlay subtitles onto a video without going through the full pipeline

**Parameters:**
- `video`: Video file
- `srt`: SRT subtitle file
- `style_json`: JSON string with styling options

### Subtitle Styling Options

The `style_json` parameter accepts these options:

```json
{
  "font": "Arial",
  "font_size": 28,
  "bold": false,
  "italic": false,
  "font_color": "#FFFFFF",
  "outline_color": "#000000",
  "outline_thickness": 2,
  "shadow_offset": 0,
  "alignment": 2,
  "margin_v": 30
}
```

## Configuration

### WhisperX Model
- Default: "base" model
- Change in `Pipeline.py` line 47: `whisperx.load_model("base", device)`
- Options: "tiny", "base", "small", "medium", "large"

### Subtitle Parameters
- `PAUSE_THRESHOLD`: 1.0 seconds (time between words to split)
- `MAX_SUBTITLE_DURATION`: 8.0 seconds (max subtitle length)

## Recent Fixes Applied

### ✅ **Import Path Issues Resolved**
- Fixed relative import paths in Pipeline.py
- Added proper `__init__.py` files for all modules
- Created fallback import handling in main.py

### ✅ **Error Handling Improved**
- Added comprehensive error handling for each pipeline step
- Added validation for environment variables
- Added FFmpeg availability check
- Added specific error messages for each failure point

### ✅ **Testing & Validation**
- Created `run_pipeline.py` for direct testing
- Added environment variable validation
- Added dependency checking

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Install FFmpeg and ensure it's in your PATH
2. **CUDA not available**: The system will automatically fall back to CPU
3. **Memory issues**: Reduce WhisperX model size or use CPU
4. **API key errors**: Check your `.env` file and API key validity
5. **Import errors**: Run `python run_pipeline.py` to test imports first

### Performance Tips

- Use GPU if available (CUDA)
- Smaller WhisperX models for faster processing
- Optimize video resolution before processing
- Use SSD storage for temporary files

## Development

### Adding New Features

1. **New Transcription Models**: Extend the `Extractor` module
2. **Translation Services**: Add new providers to the `translator` module
3. **Video Effects**: Extend the `overlay` module with new filters

### Testing

```bash
# Test pipeline components
python run_pipeline.py

# Test individual components
python -m pytest tests/

# Test API endpoints
python -m pytest tests/test_api.py
```

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please check the troubleshooting section or create an issue in the repository.

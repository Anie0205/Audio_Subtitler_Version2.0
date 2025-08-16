# Audio-Subtitle Pipeline Architecture Analysis & Corrections

## Overview

This document analyzes the current pipeline architecture and provides corrections to ensure proper endpoint calls and data flow between the distributed services.

## Corrected Architecture Flow

### 1. Service Distribution

The application now follows a proper distributed architecture with separate services:

- **Extractor Service**: Hosted on ngrok (WhisperX transcription)
- **Translator Service**: Hosted on Render (Google Gemini translation)
- **Overlay Service**: Hosted on Render (FFmpeg subtitle burning)
- **Frontend**: Hosted on Netlify (React UI)

### 2. Corrected Endpoint Flow

#### Step 1: Video Upload & Processing

```
Frontend (Netlify) → Backend (Render) /pipeline/process
```

**Request:**

- Video file (multipart/form-data)
- Target language (form data)
- Style JSON (form data)

**Response:**

- SRT content (JSON response)
- Target language
- Subtitle count

#### Step 2: Translation (if needed)

```
Backend (Render) → Translator Service (Render) /translator/translate
```

**Request:**

- SRT file (multipart/form-data)
- Target language (form data)
- Source language (form data)

**Response:**

- Translated SRT content (JSON response)

#### Step 3: Subtitle Overlay

```
Frontend (Netlify) → Backend (Render) /overlay/overlay
```

**Request:**

- Video file (multipart/form-data)
- SRT file (multipart/form-data)
- Style JSON (form data)

**Response:**

- Final video with burned subtitles (file download)

## Key Corrections Made

### 1. Fixed Pipeline Flow

**Before:** Monolithic approach trying to do everything in one endpoint
**After:** Proper distributed flow with separate service calls

### 2. Corrected Data Flow

**Before:** Incorrect SRT data handling
**After:** Proper SRT content parsing and transmission between services

### 3. Fixed Endpoint Structure

**Before:** Mismatched endpoints between frontend and backend
**After:** Consistent endpoint naming and proper API structure

### 4. Added Service Abstraction

**Before:** Direct API calls in pipeline
**After:** Service classes for clean separation of concerns

## Service URLs Configuration

### Environment Variables

```bash
# Extractor Service (ngrok)
EXTRACTOR_SERVICE_URL=https://3039ca98d568.ngrok-free.app

# Translator Service (Render)
TRANSLATOR_SERVICE_URL=https://audio-subtitler-version2-0.onrender.com

# Overlay Service (Render)
OVERLAY_SERVICE_URL=https://audio-subtitler-version2-0.onrender.com
```

### API Endpoints

```javascript
// Frontend API Configuration
ENDPOINTS = {
  PIPELINE_PROCESS: "/pipeline/process",
  PIPELINE_OVERLAY: "/pipeline/overlay",
  OVERLAY_OVERLAY: "/overlay/overlay",
  HEALTH: "/health",
};
```

## Backend API Endpoints

### Main API (Render)

```
GET  /                    # API info
GET  /health             # Health check
GET  /docs               # API documentation
```

### Pipeline Module

```
POST /pipeline/process   # Process video → return SRT
POST /pipeline/overlay   # Overlay subtitles → return video
```

### Translator Module

```
POST /translator/translate      # Translate SRT file
POST /translator/translate-dialogue  # Translate dialogue text
GET  /translator/              # Translator info
GET  /translator/health        # Translator health
```

### Overlay Module

```
POST /overlay/overlay    # Burn subtitles onto video
```

## Frontend Flow

### 1. HomePage (Video Upload)

- User uploads video and selects target language
- Calls `/pipeline/process` endpoint
- Receives SRT content and navigates to overlay page

### 2. OverlayPage (Subtitle Customization)

- Displays video with parsed SRT subtitles
- User customizes subtitle styles
- Calls `/overlay/overlay` endpoint for final video download

## Error Handling

### Service Failures

- Extractor service failure: Fallback to sample data
- Translator service failure: Continue with original subtitles
- Overlay service failure: Show error message to user

### Network Issues

- Timeout handling for long-running operations
- Retry logic for transient failures
- Graceful degradation when services are unavailable

## Deployment Considerations

### Environment Configuration

- Use environment variables for service URLs
- Configure timeouts appropriately for each service
- Set up proper CORS for cross-origin requests

### Service Dependencies

- Extractor service must be running for transcription
- Translator service requires Google API key
- Overlay service requires FFmpeg installation

### Monitoring

- Health check endpoints for each service
- Logging for debugging and monitoring
- Error tracking for service failures

## Testing the Pipeline

### 1. Test Extractor Service

```bash
curl -X POST "https://3039ca98d568.ngrok-free.app/transcribe" \
  -F "file=@audio.wav"
```

### 2. Test Translator Service

```bash
curl -X POST "https://audio-subtitler-version2-0.onrender.com/translator/translate" \
  -F "srt=@subtitles.srt" \
  -F "target_language=es"
```

### 3. Test Overlay Service

```bash
curl -X POST "https://audio-subtitler-version2-0.onrender.com/overlay/overlay" \
  -F "video=@video.mp4" \
  -F "srt=@subtitles.srt" \
  -F "style_json='{\"font\":\"Arial\",\"font_size\":28}'"
```

## Summary

The corrected architecture now properly implements the distributed pipeline flow:

1. **Video Upload** → Frontend sends video to backend
2. **Transcription** → Backend calls external extractor service
3. **Translation** → Backend calls external translator service (if needed)
4. **SRT Return** → Backend returns SRT data to frontend
5. **Customization** → User customizes subtitle styles in frontend
6. **Overlay** → Frontend sends video + SRT + styles to overlay service
7. **Download** → User receives final video with burned subtitles

This architecture ensures proper separation of concerns, scalability, and maintainability while following the described flow requirements.

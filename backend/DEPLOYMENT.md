# 🚀 Audio-Subtitle Pipeline - Deployment Guide

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Environment Variables Set:**
   - `HF_AUTH_TOKEN` - Hugging Face authentication token for WhisperX
   - `GOOGLE_API_KEY` - Google Gemini AI API key for translation

2. **FFmpeg Installed:**
   - Required for video processing and subtitle burning
   - Render will install this automatically via build scripts

## 🔧 Local Testing

Before deployment, test locally:

```bash
cd backend

# Install dependencies
pip install -r requirements-deploy.txt

# Test imports and app creation
python test_deployment.py

# Test the server locally
python run.py
```

## 🌐 Render Deployment

### 1. **Push to Git Repository**
```bash
git add .
git commit -m "Fix deployment issues and restructure imports"
git push origin main
```

### 2. **Connect to Render**
- Go to [Render Dashboard](https://dashboard.render.com)
- Create new Web Service
- Connect your Git repository
- Select the `backend` directory

### 3. **Environment Configuration**
- **Build Command:** `pip install -r requirements-deploy.txt`
- **Start Command:** `python run.py`
- **Python Version:** 3.9.16

### 4. **Environment Variables**
Set these in Render dashboard:
- `HF_AUTH_TOKEN` - Your Hugging Face token
- `GOOGLE_API_KEY` - Your Google API key

## 📁 Project Structure

```
backend/
├── main.py                 # Main FastAPI application
├── Pipeline.py            # Core pipeline logic
├── run.py                 # Deployment entry point
├── requirements-deploy.txt # Deployment dependencies
├── render.yaml            # Render configuration
├── test_deployment.py     # Pre-deployment test
├── Extractor/             # Audio extraction module
├── translator/            # Translation module
└── overlay/               # Subtitle overlay module
```

## 🔍 Troubleshooting

### Import Errors
If you see import errors:
1. Check that all `__init__.py` files exist
2. Verify module names match exactly
3. Run `python test_deployment.py` to identify issues

### FFmpeg Issues
If FFmpeg is not found:
1. Ensure it's installed in the deployment environment
2. Check PATH environment variable
3. Render should install it automatically

### Environment Variables
If environment variables are missing:
1. Check Render dashboard settings
2. Verify variable names match exactly
3. Restart the service after changes

## 📊 Monitoring

After deployment:
1. Check Render logs for any startup errors
2. Test the health endpoint: `/health`
3. Verify API documentation at `/docs`
4. Test the pipeline endpoint: `/pipeline/process`

## 🚨 Common Issues

1. **Relative Import Errors:** Fixed by using absolute imports
2. **Path Issues:** Fixed by proper execution context in `run.py`
3. **Module Not Found:** Fixed by proper `__init__.py` files
4. **Dependency Conflicts:** Fixed by `requirements-deploy.txt`

## ✅ Success Indicators

Your deployment is successful when:
- ✅ Service starts without errors
- ✅ Health check returns `{"status": "healthy"}`
- ✅ API documentation loads at `/docs`
- ✅ Pipeline endpoint responds to requests
- ✅ Overlay endpoint responds to requests

## 🔄 Updates

To update the deployment:
1. Make changes locally
2. Test with `python test_deployment.py`
3. Commit and push to Git
4. Render will automatically redeploy

---

**Need Help?** Check the logs in Render dashboard or run the test script locally to identify issues.

# 🚀 Vercel Deployment Guide

## Prerequisites
- ✅ Backend deployed on Render: `https://audio-subtitler-version2-0.onrender.com`
- ✅ Frontend code updated with API configuration
- ✅ Vercel account (free tier available)

## Deployment Steps

### 1. Prepare Your Repository
```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts to configure
```

### 3. Environment Variables (Optional)
In Vercel dashboard, add environment variable:
- **Key**: `VITE_API_URL`
- **Value**: `https://audio-subtitler-version2-0.onrender.com`

### 4. Verify Deployment
- ✅ Frontend loads on Vercel domain
- ✅ API calls go to Render backend
- ✅ Video processing works
- ✅ Subtitle overlay works

## Architecture
```
Frontend (Vercel) ←→ Backend (Render)
     ↓                    ↓
  React App         FastAPI + ML
  - Video Upload    - Transcription
  - Style Editor    - Translation  
  - Download        - Subtitle Burn
```

## Troubleshooting

### CORS Issues
- Backend already has CORS configured for `*`
- Vercel handles routing automatically

### API Timeouts
- Frontend configured with 60s timeout for production
- Render may have cold start delays

### Build Issues
- Ensure `pnpm` is used (not npm)
- Check Vite build output in `dist/` folder

## Cost
- **Vercel**: Free tier (100GB bandwidth/month)
- **Render**: Free tier (750 hours/month)
- **Total**: $0/month for development use

## Next Steps
1. Test all functionality on Vercel
2. Set up custom domain (optional)
3. Configure monitoring and analytics
4. Set up CI/CD for automatic deployments

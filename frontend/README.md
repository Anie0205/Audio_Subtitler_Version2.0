# Video Subtitle Editor Frontend

A modern React frontend for video subtitle processing with AI-powered transcription, translation, and live preview capabilities.

## ✨ Features

### 🎯 Two-Page Architecture
- **Home Page**: Clean video upload interface with language selection
- **Overlay Page**: Professional subtitle editor with live preview

### 🎨 Beautiful Design
- Modern color palette inspired by natural tones (Dusky Rose, Thistle, Hawthorne Green, Royal Scepter, Blue Noir)
- Soft gradients and shadows for depth
- Responsive design for desktop and mobile
- Smooth animations and hover effects

### 🎬 Video & Canvas Setup
- HTML5 video player with custom controls
- Transparent canvas overlay for real-time subtitle rendering
- Dynamic canvas resizing to match video dimensions
- Frame-by-frame subtitle drawing synchronized with video playback
- Instant style updates on canvas

### 🎛️ Comprehensive Style Controls
- **Font & Text**: Family, size (10-72px), bold, italic
- **Colors**: Text color and outline color with visual pickers
- **Outline & Shadow**: Thickness (0-5px) and shadow offset (0-5px)
- **Position**: 9-point alignment system and vertical offset (-100 to +100px)

### 🎨 Presets Gallery
- 5 built-in professional presets:
  - Classic White: Clean white text with black outline
  - Bold Yellow: High-visibility yellow text
  - Elegant Script: Stylish italic text with subtle shadow
  - Gaming Style: Bold impact font for gaming videos
  - Minimal Clean: Simple text without outline or shadow
- Visual preview cards with style badges
- One-click preset application

### ⚡ Live Preview
- Real-time canvas updates as you adjust controls
- Proper subtitle rendering with fillText, strokeText, and shadow
- Synchronized with video playback time
- Current subtitle display for reference

### 🔄 Backend Integration
- `/pipeline/process` endpoint for transcription + translation + overlay
- `/overlay/overlay` endpoint for SRT overlay only
- Proper FormData handling for file uploads
- Progress indicators and error handling
- Final video download functionality

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build
```

### Development
```bash
# Start with host access (for testing across devices)
pnpm run dev --host

# Test overlay page directly (bypasses upload)
# Navigate to http://localhost:5173/test
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── StyleSidebar.jsx    # Style controls and presets
│   └── VideoPlayer.jsx     # Video player with canvas overlay
├── pages/
│   ├── HomePage.jsx        # Video upload and language selection
│   ├── OverlayPage.jsx     # Subtitle editor interface
│   └── TestOverlayPage.jsx # Test route for development
├── App.jsx                 # Main app with routing
└── App.css                 # Custom styles and color palette
```

## 🎨 Color Palette

| Color Name      | HEX     | Usage                    |
|-----------------|---------|--------------------------|
| Dusky Rose      | #D9BCAF | Secondary, accents       |
| Thistle         | #8A9688 | Muted elements           |
| Hawthorne Green | #283D3B | Primary, buttons         |
| Royal Scepter   | #795663 | Muted foreground         |
| Blue Noir       | #011627 | Dark text, backgrounds   |

## 🔧 Backend Integration

The frontend expects a FastAPI backend with these endpoints:

### POST `/pipeline/process`
- **Purpose**: Full pipeline (transcription + translation + overlay)
- **Input**: FormData with `video`, `target_language`, `style_json`
- **Output**: Processed video with burned-in subtitles

### POST `/overlay/overlay`
- **Purpose**: Overlay existing SRT onto video
- **Input**: FormData with `video`, `srt`, `style_json`
- **Output**: Video with burned-in subtitles

## 📱 Usage Flow

1. **Upload**: User uploads video and selects target language on Home page
2. **Process**: Video is sent to backend for transcription/translation
3. **Edit**: User customizes subtitle appearance on Overlay page with live preview
4. **Download**: Final video with burned-in subtitles is generated and downloaded

## 🛠️ Technologies Used

- **React 19** with modern hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Lucide React** for icons
- **Canvas API** for subtitle rendering
- **HTML5 Video API** for video playback

## 🎯 Key Features Implementation

### Live Preview System
- Canvas element overlaid on video
- Real-time subtitle rendering using Canvas 2D API
- Synchronized with video `timeupdate` events
- Instant updates when style changes

### Style JSON Format
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

### Alignment System
- 1-3: Bottom (Left, Center, Right)
- 4-6: Middle (Left, Center, Right)  
- 7-9: Top (Left, Center, Right)

## 🚀 Deployment Ready

The frontend is production-ready with:
- Optimized build process
- Error boundaries and fallbacks
- Responsive design
- Cross-browser compatibility
- Clean code architecture

## 📄 License

This project is part of a video subtitle processing system.


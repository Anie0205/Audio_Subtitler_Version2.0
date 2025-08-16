import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'

const VideoPlayer = ({ videoUrl, srtData, styleConfig }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Update canvas when video loads or style changes
  useEffect(() => {
    if (videoRef.current && canvasRef.current) {
      updateCanvas()
    }
  }, [styleConfig, currentTime, srtData])

  // Set up video event listeners
  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      updateCanvas()
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('volumechange', handleVolumeChange)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('volumechange', handleVolumeChange)
    }
  }, [videoUrl])

  const updateCanvas = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Find current subtitle
    const currentSubtitle = srtData.find(sub => 
      currentTime >= sub.start && currentTime <= sub.end
    )
    
    if (currentSubtitle) {
      drawSubtitle(ctx, currentSubtitle.text, canvas.width, canvas.height, styleConfig)
    }
  }

  const drawSubtitle = (ctx, text, canvasWidth, canvasHeight, style) => {
    const fontSize = style.font_size || 28
    const fontFamily = style.font || 'Arial'
    const bold = style.bold ? 'bold' : 'normal'
    const italic = style.italic ? 'italic' : 'normal'
    
    ctx.font = `${italic} ${bold} ${fontSize}px ${fontFamily}`
    ctx.textAlign = getAlignment(style.alignment)
    ctx.textBaseline = 'bottom'
    
    // Calculate position
    let x = canvasWidth / 2
    if (style.alignment === 1 || style.alignment === 4 || style.alignment === 7) {
      x = 50 // left
    } else if (style.alignment === 3 || style.alignment === 6 || style.alignment === 9) {
      x = canvasWidth - 50 // right
    }
    
    const marginV = style.margin_v || 30
    let y = canvasHeight - marginV
    
    // Adjust y position based on vertical alignment
    if (style.alignment >= 4 && style.alignment <= 6) {
      y = canvasHeight / 2 // middle
    } else if (style.alignment >= 7 && style.alignment <= 9) {
      y = marginV + fontSize // top
    }
    
    // Split text into lines if needed
    const lines = text.split('\n')
    const lineHeight = fontSize * 1.2
    
    lines.forEach((line, index) => {
      const lineY = y + (index * lineHeight)
      
      // Draw shadow if enabled
      if (style.shadow_offset > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.fillText(line, x + style.shadow_offset, lineY + style.shadow_offset)
      }
      
      // Draw outline
      if (style.outline_thickness > 0) {
        ctx.strokeStyle = style.outline_color || '#000000'
        ctx.lineWidth = style.outline_thickness * 2
        ctx.strokeText(line, x, lineY)
      }
      
      // Draw main text
      ctx.fillStyle = style.font_color || '#FFFFFF'
      ctx.fillText(line, x, lineY)
    })
  }

  const getAlignment = (alignment) => {
    switch (alignment) {
      case 1: case 4: case 7: return 'left'
      case 3: case 6: case 9: return 'right'
      default: return 'center'
    }
  }

  const togglePlayPause = () => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  const handleSeek = (e) => {
    if (!videoRef.current) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = (clickX / rect.width) * duration
    
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    
    videoRef.current.muted = !videoRef.current.muted
  }

  const handleVolumeChange = (e) => {
    if (!videoRef.current) return
    
    const newVolume = parseFloat(e.target.value)
    videoRef.current.volume = newVolume
    setVolume(newVolume)
    
    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div 
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden soft-shadow-lg"
      >
        {/* Video and Canvas */}
        <div className="relative aspect-video">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            playsInline
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ mixBlendMode: 'normal' }}
          />
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar */}
          <div 
            className="w-full h-2 bg-white/20 rounded-full cursor-pointer mb-4"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayPause}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted || volume === 0 ? 
                    <VolumeX className="w-4 h-4" /> : 
                    <Volume2 className="w-4 h-4" />
                  }
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Current Subtitle Display (for reference) */}
      {srtData.find(sub => currentTime >= sub.start && currentTime <= sub.end) && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Current Subtitle:</p>
          <p className="text-foreground">
            {srtData.find(sub => currentTime >= sub.start && currentTime <= sub.end)?.text}
          </p>
        </div>
      )}
    </div>
  )
}

export default VideoPlayer


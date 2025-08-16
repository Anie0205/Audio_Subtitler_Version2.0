import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Play, Pause, Download, Upload, Loader2 } from 'lucide-react'
import { buildApiUrl } from '../config/api.js'

const VideoPreview = ({ 
  videoFile, 
  srtFile, 
  styleConfig, 
  isProcessing, 
  onProcessingChange,
  targetLanguage 
}) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [subtitles, setSubtitles] = useState([])
  const [videoUrl, setVideoUrl] = useState(null)
  const [processedVideoUrl, setProcessedVideoUrl] = useState(null)

  // Parse SRT file
  useEffect(() => {
    if (srtFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const srtContent = e.target.result
        const parsedSubtitles = parseSRT(srtContent)
        setSubtitles(parsedSubtitles)
      }
      reader.readAsText(srtFile)
    } else {
      setSubtitles([])
    }
  }, [srtFile])

  // Create video URL
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile)
      setVideoUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setVideoUrl(null)
    }
  }, [videoFile])

  // Canvas drawing
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const updateCanvas = () => {
      if (video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Find current subtitle
        const currentSubtitle = subtitles.find(sub => 
          currentTime >= sub.start && currentTime <= sub.end
        )
        
        if (currentSubtitle) {
          drawSubtitle(ctx, currentSubtitle.text, canvas.width, canvas.height, styleConfig)
        }
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      updateCanvas()
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      updateCanvas()
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('loadeddata', updateCanvas)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('loadeddata', updateCanvas)
    }
  }, [subtitles, currentTime, styleConfig])

  const parseSRT = (srtContent) => {
    const blocks = srtContent.trim().split('\n\n')
    return blocks.map(block => {
      const lines = block.split('\n')
      if (lines.length >= 3) {
        const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/)
        if (timeMatch) {
          return {
            start: timeToSeconds(timeMatch[1]),
            end: timeToSeconds(timeMatch[2]),
            text: lines.slice(2).join('\n')
          }
        }
      }
      return null
    }).filter(Boolean)
  }

  const timeToSeconds = (timeStr) => {
    const [time, ms] = timeStr.split(',')
    const [hours, minutes, seconds] = time.split(':').map(Number)
    return hours * 3600 + minutes * 60 + seconds + ms / 1000
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
    const y = canvasHeight - marginV
    
    // Draw shadow if enabled
    if (style.shadow_offset > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillText(text, x + style.shadow_offset, y + style.shadow_offset)
    }
    
    // Draw outline
    if (style.outline_thickness > 0) {
      ctx.strokeStyle = style.outline_color || '#000000'
      ctx.lineWidth = style.outline_thickness * 2
      ctx.strokeText(text, x, y)
    }
    
    // Draw main text
    ctx.fillStyle = style.font_color || '#FFFFFF'
    ctx.fillText(text, x, y)
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
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e) => {
    if (!videoRef.current) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = (clickX / rect.width) * duration
    
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const processVideo = async () => {
    if (!videoFile) return
    
    onProcessingChange(true)
    
    try {
      const formData = new FormData()
      formData.append('video', videoFile)
      formData.append('target_language', targetLanguage)
      formData.append('style_json', JSON.stringify(styleConfig))
      
      const endpoint = srtFile ? ENDPOINTS.OVERLAY_OVERLAY : ENDPOINTS.PIPELINE_PROCESS
      if (srtFile) {
        formData.append('srt', srtFile)
      }
      
      const response = await fetch(`${buildApiUrl(endpoint)}`, {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setProcessedVideoUrl(url)
      } else {
        console.error('Processing failed:', await response.text())
      }
    } catch (error) {
      console.error('Error processing video:', error)
    } finally {
      onProcessingChange(false)
    }
  }

  const downloadProcessedVideo = () => {
    if (processedVideoUrl) {
      const a = document.createElement('a')
      a.href = processedVideoUrl
      a.download = 'processed_video.mp4'
      a.click()
    }
  }

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{ mixBlendMode: 'normal' }}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Upload a video to see preview</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {videoUrl && (
        <div className="space-y-3">
          {/* Play/Pause and Progress */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayPause}
              className="flex-shrink-0"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <div className="flex-1 space-y-1">
              <div 
                className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Process Button */}
          <div className="flex gap-2">
            <Button 
              onClick={processVideo}
              disabled={isProcessing || !videoFile}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Video'
              )}
            </Button>
            
            {processedVideoUrl && (
              <Button
                variant="outline"
                onClick={downloadProcessedVideo}
                className="flex-shrink-0"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default VideoPreview


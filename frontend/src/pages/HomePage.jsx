import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Upload, Video, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import { buildApiUrl, ENDPOINTS } from '../config/api.js'

const HomePage = () => {
  const [videoFile, setVideoFile] = useState(null)
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' }
  ]

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0] && files[0].type.startsWith('video/')) {
      setVideoFile(files[0])
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file)
    }
  }

  const handleGoClick = async () => {
    if (!videoFile) return

    setIsProcessing(true)

    try {
      // Send video to backend for initial processing (transcription/translation)
      const formData = new FormData()
      formData.append('video', videoFile)
      formData.append('target_language', targetLanguage)
      formData.append('style_json', JSON.stringify({
        font: 'Arial',
        font_size: 28,
        bold: false,
        italic: false,
        font_color: '#FFFFFF',
        outline_color: '#000000',
        outline_thickness: 2,
        shadow_offset: 0,
        alignment: 2,
        margin_v: 30
      }))

      const response = await fetch(buildApiUrl(ENDPOINTS.PIPELINE_PROCESS), {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        // Get the processed video blob and SRT data
        const processedVideoBlob = await response.blob()
        
        // Store video and SRT data in sessionStorage for the overlay page
        const videoUrl = URL.createObjectURL(videoFile)
        const processedVideoUrl = URL.createObjectURL(processedVideoBlob)
        
        sessionStorage.setItem('originalVideo', videoUrl)
        sessionStorage.setItem('processedVideo', processedVideoUrl)
        sessionStorage.setItem('targetLanguage', targetLanguage)
        sessionStorage.setItem('videoFileName', videoFile.name)
        
        // Navigate to overlay page
        navigate('/overlay')
      } else {
        console.error('Processing failed:', await response.text())
        // For demo purposes, still navigate to overlay page with original video
        const videoUrl = URL.createObjectURL(videoFile)
        sessionStorage.setItem('originalVideo', videoUrl)
        sessionStorage.setItem('targetLanguage', targetLanguage)
        sessionStorage.setItem('videoFileName', videoFile.name)
        navigate('/overlay')
      }
    } catch (error) {
      console.error('Error processing video:', error)
      // For demo purposes, still navigate to overlay page with original video
      const videoUrl = URL.createObjectURL(videoFile)
      sessionStorage.setItem('originalVideo', videoUrl)
      sessionStorage.setItem('targetLanguage', targetLanguage)
      sessionStorage.setItem('videoFileName', videoFile.name)
      navigate('/overlay')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen gradient-bg-alt flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Video Subtitle Editor
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Transform your videos with AI-powered subtitles. Upload, customize, and download in minutes.
          </p>
        </div>

        {/* Main Card */}
        <Card className="soft-shadow-lg border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-card-foreground">
              Get Started
            </CardTitle>
            <p className="text-muted-foreground">
              Upload your video and select your preferred subtitle language
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Video Upload Area */}
            <div className="space-y-4">
              <Label className="text-base font-medium text-card-foreground">
                Upload Video File
              </Label>
              
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer ${
                  dragActive
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : videoFile
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {videoFile ? (
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Video className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">{videoFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(videoFile.size)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setVideoFile(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                    >
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center">
                      <div className="p-4 rounded-full bg-muted/50">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-card-foreground">
                        Drop your video here
                      </p>
                      <p className="text-muted-foreground">
                        or click to browse files
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Supports MP4, MOV, AVI, and other video formats
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium text-card-foreground">
                Target Subtitle Language
              </Label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Go Button */}
            <Button
              onClick={handleGoClick}
              disabled={!videoFile || isProcessing}
              className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Processing Video...
                </>
              ) : (
                <>
                  Continue to Editor
                  <ArrowRight className="w-5 h-5 ml-3" />
                </>
              )}
            </Button>

            {videoFile && (
              <p className="text-center text-sm text-muted-foreground">
                Your video will be processed and you'll be taken to the subtitle editor
              </p>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Easy Upload</h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop or click to upload your video files
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Automatic transcription and translation using advanced AI
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Live Preview</h3>
            <p className="text-sm text-muted-foreground">
              See your subtitle changes in real-time as you customize
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage


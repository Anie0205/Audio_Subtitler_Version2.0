import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Upload, Video, FileText, X } from 'lucide-react'

const VideoUpload = ({ 
  onVideoUpload, 
  onSRTUpload, 
  targetLanguage, 
  onTargetLanguageChange 
}) => {
  const [videoFile, setVideoFile] = useState(null)
  const [srtFile, setSrtFile] = useState(null)
  const videoInputRef = useRef(null)
  const srtInputRef = useRef(null)

  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file)
      onVideoUpload(file)
    }
  }

  const handleSRTChange = (e) => {
    const file = e.target.files[0]
    if (file && (file.name.endsWith('.srt') || file.type === 'text/plain')) {
      setSrtFile(file)
      onSRTUpload(file)
    }
  }

  const removeVideo = () => {
    setVideoFile(null)
    onVideoUpload(null)
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }

  const removeSRT = () => {
    setSrtFile(null)
    onSRTUpload(null)
    if (srtInputRef.current) {
      srtInputRef.current.value = ''
    }
  }

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

  return (
    <div className="space-y-6">
      {/* Video Upload */}
      <div className="space-y-2">
        <Label htmlFor="video-upload" className="text-sm font-medium">
          Video File
        </Label>
        <div className="space-y-2">
          <Input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            ref={videoInputRef}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          {videoFile && (
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">{videoFile.name}</span>
                <span className="text-xs text-slate-500">
                  ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeVideo}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* SRT Upload (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="srt-upload" className="text-sm font-medium">
          SRT File (Optional)
        </Label>
        <p className="text-xs text-slate-500">
          Upload an existing SRT file, or leave empty to generate subtitles automatically
        </p>
        <div className="space-y-2">
          <Input
            id="srt-upload"
            type="file"
            accept=".srt,text/plain"
            onChange={handleSRTChange}
            ref={srtInputRef}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/90"
          />
          {srtFile && (
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">{srtFile.name}</span>
                <span className="text-xs text-slate-500">
                  ({(srtFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeSRT}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Target Language */}
      <div className="space-y-2">
        <Label htmlFor="target-language" className="text-sm font-medium">
          Target Language
        </Label>
        <Select value={targetLanguage} onValueChange={onTargetLanguageChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select target language" />
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
    </div>
  )
}

export default VideoUpload


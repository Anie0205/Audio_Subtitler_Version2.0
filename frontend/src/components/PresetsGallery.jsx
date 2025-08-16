import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Save, Trash2, Download, Upload } from 'lucide-react'

const PresetsGallery = ({ onPresetApply, currentStyle }) => {
  const [presets, setPresets] = useState([
    {
      id: 1,
      name: 'Classic White',
      description: 'Clean white text with black outline',
      style: {
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
      }
    },
    {
      id: 2,
      name: 'Bold Yellow',
      description: 'Bold yellow text for high visibility',
      style: {
        font: 'Arial',
        font_size: 32,
        bold: true,
        italic: false,
        font_color: '#FFD700',
        outline_color: '#000000',
        outline_thickness: 3,
        shadow_offset: 2,
        alignment: 2,
        margin_v: 40
      }
    },
    {
      id: 3,
      name: 'Elegant Script',
      description: 'Stylish italic text with subtle shadow',
      style: {
        font: 'Georgia',
        font_size: 30,
        bold: false,
        italic: true,
        font_color: '#F0F0F0',
        outline_color: '#333333',
        outline_thickness: 1,
        shadow_offset: 3,
        alignment: 2,
        margin_v: 35
      }
    },
    {
      id: 4,
      name: 'Gaming Style',
      description: 'Bold impact font for gaming videos',
      style: {
        font: 'Impact',
        font_size: 36,
        bold: true,
        italic: false,
        font_color: '#00FF00',
        outline_color: '#000000',
        outline_thickness: 4,
        shadow_offset: 2,
        alignment: 2,
        margin_v: 25
      }
    },
    {
      id: 5,
      name: 'Minimal Clean',
      description: 'Simple text without outline or shadow',
      style: {
        font: 'Helvetica',
        font_size: 26,
        bold: false,
        italic: false,
        font_color: '#FFFFFF',
        outline_color: '#000000',
        outline_thickness: 0,
        shadow_offset: 0,
        alignment: 2,
        margin_v: 30
      }
    },
    {
      id: 6,
      name: 'Retro Neon',
      description: 'Bright cyan with strong outline',
      style: {
        font: 'Trebuchet MS',
        font_size: 34,
        bold: true,
        italic: false,
        font_color: '#00FFFF',
        outline_color: '#FF00FF',
        outline_thickness: 3,
        shadow_offset: 4,
        alignment: 2,
        margin_v: 35
      }
    }
  ])

  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetDescription, setNewPresetDescription] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const saveCurrentAsPreset = () => {
    if (!newPresetName.trim()) return

    const newPreset = {
      id: Date.now(),
      name: newPresetName.trim(),
      description: newPresetDescription.trim() || 'Custom preset',
      style: { ...currentStyle }
    }

    setPresets(prev => [...prev, newPreset])
    setNewPresetName('')
    setNewPresetDescription('')
    setIsDialogOpen(false)
  }

  const deletePreset = (id) => {
    setPresets(prev => prev.filter(preset => preset.id !== id))
  }

  const exportPresets = () => {
    const dataStr = JSON.stringify(presets, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'subtitle-presets.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const importPresets = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedPresets = JSON.parse(e.target.result)
        if (Array.isArray(importedPresets)) {
          setPresets(prev => [...prev, ...importedPresets.map(preset => ({
            ...preset,
            id: Date.now() + Math.random() // Ensure unique IDs
          }))])
        }
      } catch (error) {
        console.error('Failed to import presets:', error)
      }
    }
    reader.readAsText(file)
    event.target.value = '' // Reset input
  }

  const PresetCard = ({ preset }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow group">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Preview */}
          <div 
            className="h-16 bg-gradient-to-r from-slate-800 to-slate-600 rounded flex items-center justify-center relative overflow-hidden"
          >
            <div
              style={{
                fontFamily: preset.style.font,
                fontSize: `${Math.min(preset.style.font_size * 0.4, 16)}px`,
                fontWeight: preset.style.bold ? 'bold' : 'normal',
                fontStyle: preset.style.italic ? 'italic' : 'normal',
                color: preset.style.font_color,
                textShadow: preset.style.outline_thickness > 0 
                  ? `0 0 ${preset.style.outline_thickness}px ${preset.style.outline_color}` 
                  : 'none'
              }}
            >
              Sample Text
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-sm">{preset.name}</h4>
              {preset.id > 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    deletePreset(preset.id)
                  }}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-2">{preset.description}</p>
            
            {/* Style badges */}
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">
                {preset.style.font}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {preset.style.font_size}px
              </Badge>
              {preset.style.bold && (
                <Badge variant="secondary" className="text-xs">Bold</Badge>
              )}
              {preset.style.italic && (
                <Badge variant="secondary" className="text-xs">Italic</Badge>
              )}
            </div>
          </div>

          {/* Apply button */}
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => onPresetApply(preset.style)}
          >
            Apply Preset
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Current
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Current Style as Preset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="preset-name">Preset Name</Label>
                <Input
                  id="preset-name"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Enter preset name"
                />
              </div>
              <div>
                <Label htmlFor="preset-description">Description (Optional)</Label>
                <Input
                  id="preset-description"
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveCurrentAsPreset} disabled={!newPresetName.trim()}>
                  Save Preset
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" size="sm" onClick={exportPresets}>
          <Download className="w-4 h-4" />
        </Button>

        <Button variant="outline" size="sm" asChild>
          <label className="cursor-pointer">
            <Upload className="w-4 h-4" />
            <input
              type="file"
              accept=".json"
              onChange={importPresets}
              className="sr-only"
            />
          </label>
        </Button>
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {presets.map(preset => (
          <PresetCard key={preset.id} preset={preset} />
        ))}
      </div>
    </div>
  )
}

export default PresetsGallery


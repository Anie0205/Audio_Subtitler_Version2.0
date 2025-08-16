import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Type, Palette, Move, Eye } from 'lucide-react'

const StyleControls = ({ styleConfig, onStyleChange }) => {
  const [colorInputs, setColorInputs] = useState({
    font_color: styleConfig.font_color,
    outline_color: styleConfig.outline_color
  })

  const fonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 
    'Tahoma', 'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Courier New'
  ]

  const alignmentOptions = [
    { value: 1, label: 'Bottom Left' },
    { value: 2, label: 'Bottom Center' },
    { value: 3, label: 'Bottom Right' },
    { value: 4, label: 'Middle Left' },
    { value: 5, label: 'Middle Center' },
    { value: 6, label: 'Middle Right' },
    { value: 7, label: 'Top Left' },
    { value: 8, label: 'Top Center' },
    { value: 9, label: 'Top Right' }
  ]

  const handleColorChange = (colorType, value) => {
    setColorInputs(prev => ({ ...prev, [colorType]: value }))
    onStyleChange({ [colorType]: value })
  }

  const handleSliderChange = (key, value) => {
    onStyleChange({ [key]: value[0] })
  }

  const handleSwitchChange = (key, checked) => {
    onStyleChange({ [key]: checked })
  }

  const handleSelectChange = (key, value) => {
    onStyleChange({ [key]: value })
  }

  return (
    <div className="space-y-6">
      {/* Font & Text */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Type className="w-4 h-4" />
            Font & Text
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Font Family */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Font Family</Label>
            <Select 
              value={styleConfig.font} 
              onValueChange={(value) => handleSelectChange('font', value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fonts.map(font => (
                  <SelectItem key={font} value={font}>{font}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Font Size</Label>
              <span className="text-xs text-slate-500">{styleConfig.font_size}px</span>
            </div>
            <Slider
              value={[styleConfig.font_size]}
              onValueChange={(value) => handleSliderChange('font_size', value)}
              min={10}
              max={72}
              step={1}
              className="w-full"
            />
          </div>

          {/* Bold & Italic */}
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="bold"
                checked={styleConfig.bold}
                onCheckedChange={(checked) => handleSwitchChange('bold', checked)}
              />
              <Label htmlFor="bold" className="text-xs font-medium">Bold</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="italic"
                checked={styleConfig.italic}
                onCheckedChange={(checked) => handleSwitchChange('italic', checked)}
              />
              <Label htmlFor="italic" className="text-xs font-medium">Italic</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Text Color */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Text Color</Label>
            <div className="flex gap-2">
              <div 
                className="w-8 h-8 rounded border-2 border-slate-200 cursor-pointer"
                style={{ backgroundColor: colorInputs.font_color }}
                onClick={() => document.getElementById('font-color-input').click()}
              />
              <Input
                id="font-color-input"
                type="color"
                value={colorInputs.font_color}
                onChange={(e) => handleColorChange('font_color', e.target.value)}
                className="sr-only"
              />
              <Input
                value={colorInputs.font_color}
                onChange={(e) => handleColorChange('font_color', e.target.value)}
                placeholder="#FFFFFF"
                className="flex-1 h-8 text-xs"
              />
            </div>
          </div>

          {/* Outline Color */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Outline Color</Label>
            <div className="flex gap-2">
              <div 
                className="w-8 h-8 rounded border-2 border-slate-200 cursor-pointer"
                style={{ backgroundColor: colorInputs.outline_color }}
                onClick={() => document.getElementById('outline-color-input').click()}
              />
              <Input
                id="outline-color-input"
                type="color"
                value={colorInputs.outline_color}
                onChange={(e) => handleColorChange('outline_color', e.target.value)}
                className="sr-only"
              />
              <Input
                value={colorInputs.outline_color}
                onChange={(e) => handleColorChange('outline_color', e.target.value)}
                placeholder="#000000"
                className="flex-1 h-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Outline & Shadow */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Outline & Shadow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Outline Thickness */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Outline Thickness</Label>
              <span className="text-xs text-slate-500">{styleConfig.outline_thickness}px</span>
            </div>
            <Slider
              value={[styleConfig.outline_thickness]}
              onValueChange={(value) => handleSliderChange('outline_thickness', value)}
              min={0}
              max={5}
              step={1}
              className="w-full"
            />
          </div>

          {/* Shadow Offset */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Shadow Offset</Label>
              <span className="text-xs text-slate-500">{styleConfig.shadow_offset}px</span>
            </div>
            <Slider
              value={[styleConfig.shadow_offset]}
              onValueChange={(value) => handleSliderChange('shadow_offset', value)}
              min={0}
              max={5}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Position */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Move className="w-4 h-4" />
            Position
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alignment */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Alignment</Label>
            <Select 
              value={styleConfig.alignment.toString()} 
              onValueChange={(value) => handleSelectChange('alignment', parseInt(value))}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {alignmentOptions.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vertical Offset */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Vertical Offset</Label>
              <span className="text-xs text-slate-500">{styleConfig.margin_v}px</span>
            </div>
            <Slider
              value={[styleConfig.margin_v]}
              onValueChange={(value) => handleSliderChange('margin_v', value)}
              min={-100}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => {
          const defaultStyle = {
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
          onStyleChange(defaultStyle)
          setColorInputs({
            font_color: defaultStyle.font_color,
            outline_color: defaultStyle.outline_color
          })
        }}
      >
        Reset to Defaults
      </Button>
    </div>
  )
}

export default StyleControls


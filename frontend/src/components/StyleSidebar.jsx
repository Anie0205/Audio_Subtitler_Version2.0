import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { Type, Palette, Eye, Move, Settings, Sparkles, RotateCcw } from 'lucide-react'

const StyleSidebar = ({ styleConfig, onStyleChange, onPresetApply }) => {
  const [colorInputs, setColorInputs] = useState({
    font_color: styleConfig.font_color,
    outline_color: styleConfig.outline_color
  })

  const [presets] = useState([
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
    }
  ])

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

  const resetToDefaults = () => {
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
  }

  const PresetCard = ({ preset }) => (
    <Card className="cursor-pointer hover:shadow-md transition-all duration-200 group border-border/50">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Preview */}
          <div className="h-12 bg-gradient-to-r from-slate-800 to-slate-600 rounded flex items-center justify-center relative overflow-hidden">
            <div
              style={{
                fontFamily: preset.style.font,
                fontSize: `${Math.min(preset.style.font_size * 0.3, 12)}px`,
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
            <h4 className="font-medium text-sm text-sidebar-foreground mb-1">{preset.name}</h4>
            <p className="text-xs text-muted-foreground mb-2">{preset.description}</p>
            
            {/* Style badges */}
            <div className="flex flex-wrap gap-1 mb-3">
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
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => onPresetApply(preset.style)}
          >
            Apply Preset
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="h-full bg-sidebar">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-5 h-5 text-sidebar-primary" />
          <h2 className="font-semibold text-sidebar-foreground">Style Controls</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Customize subtitle appearance and preview changes live
        </p>
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="p-4">
          <Tabs defaultValue="customize" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="customize" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Customize
              </TabsTrigger>
              <TabsTrigger value="presets" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Presets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customize" className="space-y-6">
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
                      <span className="text-xs text-muted-foreground">{styleConfig.font_size}px</span>
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
                        className="w-8 h-8 rounded border-2 border-border cursor-pointer"
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
                        className="w-8 h-8 rounded border-2 border-border cursor-pointer"
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
                      <span className="text-xs text-muted-foreground">{styleConfig.outline_thickness}px</span>
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
                      <span className="text-xs text-muted-foreground">{styleConfig.shadow_offset}px</span>
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
                      <span className="text-xs text-muted-foreground">{styleConfig.margin_v}px</span>
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
                onClick={resetToDefaults}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
            </TabsContent>

            <TabsContent value="presets" className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {presets.map(preset => (
                  <PresetCard key={preset.id} preset={preset} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}

export default StyleSidebar


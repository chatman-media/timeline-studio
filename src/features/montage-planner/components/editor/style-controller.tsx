/**
 * Style controller component for Smart Montage Planner
 * Manages montage style settings and visual preferences
 */

import { Camera, Film, Music, Palette, Sparkles, Zap } from "lucide-react"
import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { MontagePreferences, StyleParameters, VisualParameters } from "../../types"
import { MONTAGE_STYLES } from "../../types"

interface StyleControllerProps {
  preferences: MontagePreferences
  onPreferencesChange: (preferences: Partial<MontagePreferences>) => void
  className?: string
}

export function StyleController({ preferences, onPreferencesChange, className }: StyleControllerProps) {
  const getStyleIcon = (styleName: string) => {
    const icons: Record<string, React.ReactNode> = {
      "Dynamic Action": <Zap className="h-5 w-5" />,
      "Cinematic Drama": <Film className="h-5 w-5" />,
      "Music Video": <Music className="h-5 w-5" />,
      Documentary: <Camera className="h-5 w-5" />,
      Corporate: <Sparkles className="h-5 w-5" />,
      "Social Media": <Palette className="h-5 w-5" />,
    }
    return icons[styleName] || <Film className="h-5 w-5" />
  }

  const updateStyleParameters = (updates: Partial<StyleParameters>) => {
    onPreferencesChange({
      styleParameters: {
        ...preferences.styleParameters,
        ...updates,
      },
    })
  }

  const updateVisualParameters = (updates: Partial<VisualParameters>) => {
    onPreferencesChange({
      visualParameters: {
        ...preferences.visualParameters,
        ...updates,
      },
    })
  }

  const id = "style-controller"

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Style & Visual Settings</CardTitle>
        <CardDescription>Control the creative direction and visual style of your montage</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="style" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="visual">Visual</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Style Tab */}
          <TabsContent value="style" className="space-y-4">
            {/* Style Selection */}
            <div className="space-y-3">
              <Label>Montage Style</Label>
              <RadioGroup
                value={preferences.style}
                onValueChange={(value: string) => onPreferencesChange({ style: value })}
              >
                <div className="grid gap-3">
                  {Object.entries(MONTAGE_STYLES).map(([styleId, config]) => (
                    <div key={styleId} className="relative">
                      <RadioGroupItem value={styleId} id={styleId} className="peer sr-only" />
                      <Label
                        htmlFor={styleId}
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                          "hover:bg-accent",
                          "peer-checked:border-primary peer-checked:bg-accent",
                        )}
                      >
                        <div className="mt-0.5">{getStyleIcon(config.name)}</div>
                        <div className="flex-1 space-y-1">
                          <div className="font-medium">{config.name}</div>
                          <div className="text-sm text-muted-foreground">{config.description}</div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant="outline" className="text-xs">
                              Pace: {config.params?.pacePreference || "medium"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Energy: {config.params?.energyRange?.[0] || 0}-{config.params?.energyRange?.[1] || 100}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Cuts: {config.params?.cutFrequency || "medium"}
                            </Badge>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Style Parameters */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium">Style Customization</h4>

              {/* Energy Range */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Energy Range</Label>
                  <span className="text-sm text-muted-foreground">
                    {preferences.styleParameters.energyRange[0]}-{preferences.styleParameters.energyRange[1]}%
                  </span>
                </div>
                <div className="px-2">
                  <Slider
                    value={preferences.styleParameters.energyRange}
                    onValueChange={(value) => updateStyleParameters({ energyRange: value as [number, number] })}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Cut Frequency */}
              <div className="space-y-2">
                <Label>Cut Frequency</Label>
                <RadioGroup
                  value={preferences.styleParameters.cutFrequency}
                  onValueChange={(value) => updateStyleParameters({ cutFrequency: value as any })}
                >
                  <div className="grid grid-cols-4 gap-2">
                    {["slow", "medium", "fast", "mixed"].map((freq) => (
                      <div key={freq} className="flex items-center">
                        <RadioGroupItem value={freq} id={`freq-${freq}`} />
                        <Label htmlFor={`freq-${freq}`} className="ml-2 text-sm capitalize cursor-pointer">
                          {freq}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Emotion Focus */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Emotion Focus</Label>
                  <span className="text-sm text-muted-foreground">{preferences.styleParameters.emotionFocus}%</span>
                </div>
                <Slider
                  value={[preferences.styleParameters.emotionFocus]}
                  onValueChange={([value]) => updateStyleParameters({ emotionFocus: value })}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </TabsContent>

          {/* Visual Tab */}
          <TabsContent value="visual" className="space-y-4">
            {/* Color Grading */}
            <div className="space-y-2">
              <Label>Color Grading Preference</Label>
              <RadioGroup
                value={preferences.visualParameters.colorGrading}
                onValueChange={(value) =>
                  updateVisualParameters({ colorGrading: value as VisualParameters["colorGrading"] })
                }
              >
                <div className="grid grid-cols-2 gap-3">
                  {["neutral", "warm", "cool", "vibrant", "muted", "cinematic"].map((grade) => (
                    <div key={grade} className="flex items-center">
                      <RadioGroupItem value={grade} id={`grade-${grade}`} />
                      <Label htmlFor={`grade-${grade}`} className="ml-2 text-sm capitalize cursor-pointer">
                        {grade}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Contrast Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Contrast Level</Label>
                <span className="text-sm text-muted-foreground">{preferences.visualParameters.contrastLevel}%</span>
              </div>
              <Slider
                value={[preferences.visualParameters.contrastLevel]}
                onValueChange={([value]) => updateVisualParameters({ contrastLevel: value })}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Saturation Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Saturation Level</Label>
                <span className="text-sm text-muted-foreground">{preferences.visualParameters.saturationLevel}%</span>
              </div>
              <Slider
                value={[preferences.visualParameters.saturationLevel]}
                onValueChange={([value]) => updateVisualParameters({ saturationLevel: value })}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Visual Preferences */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">Visual Preferences</h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${id}-stabilization`}>Apply Stabilization</Label>
                  <Switch
                    id={`${id}-stabilization`}
                    checked={preferences.visualParameters.stabilization}
                    onCheckedChange={(checked) => updateVisualParameters({ stabilization: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor={`${id}-grain`}>Add Film Grain</Label>
                  <Switch
                    id={`${id}-grain`}
                    checked={preferences.visualParameters.grainIntensity > 0}
                    onCheckedChange={(checked) => updateVisualParameters({ grainIntensity: checked ? 20 : 0 })}
                  />
                </div>

                {preferences.visualParameters.grainIntensity > 0 && (
                  <div className="ml-8 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Grain Intensity</Label>
                      <span className="text-xs text-muted-foreground">
                        {preferences.visualParameters.grainIntensity}%
                      </span>
                    </div>
                    <Slider
                      value={[preferences.visualParameters.grainIntensity]}
                      onValueChange={([value]) => updateVisualParameters({ grainIntensity: value })}
                      min={5}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4">
            {/* Quality Settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Quality Thresholds</h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Minimum Fragment Quality</Label>
                  <span className="text-sm text-muted-foreground">{preferences.qualityThreshold}%</span>
                </div>
                <Slider
                  value={[preferences.qualityThreshold]}
                  onValueChange={([value]) => onPreferencesChange({ qualityThreshold: value })}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Target Duration</Label>
                  <span className="text-sm text-muted-foreground">{preferences.targetDuration}s</span>
                </div>
                <Slider
                  value={[preferences.targetDuration]}
                  onValueChange={([value]) => onPreferencesChange({ targetDuration: value })}
                  min={10}
                  max={600}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>

            {/* Optimization Preferences */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">Optimization</h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${id}-auto-balance`}>Auto-balance Sequences</Label>
                  <Switch
                    id={`${id}-auto-balance`}
                    checked={preferences.autoBalance ?? true}
                    onCheckedChange={(checked) => onPreferencesChange({ autoBalance: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor={`${id}-diversity`}>Maximize Fragment Diversity</Label>
                  <Switch
                    id={`${id}-diversity`}
                    checked={preferences.diversityBoost ?? false}
                    onCheckedChange={(checked) => onPreferencesChange({ diversityBoost: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor={`${id}-coherence`}>Prioritize Narrative Coherence</Label>
                  <Switch
                    id={`${id}-coherence`}
                    checked={preferences.narrativeCoherence ?? true}
                    onCheckedChange={(checked) => onPreferencesChange({ narrativeCoherence: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Reset to Style Defaults */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const defaultStyle = MONTAGE_STYLES[preferences.style]
                  if (defaultStyle?.params && defaultStyle?.visual) {
                    onPreferencesChange({
                      styleParameters: defaultStyle.params,
                      visualParameters: defaultStyle.visual,
                    })
                  }
                }}
              >
                Reset to {MONTAGE_STYLES[preferences.style]?.name || preferences.style} Defaults
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

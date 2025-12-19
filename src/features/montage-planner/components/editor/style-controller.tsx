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
      "Dynamic Action": <Zap className="h-5 w-5" data-oid="rrbv829" />,
      "Cinematic Drama": <Film className="h-5 w-5" data-oid="als7zh5" />,
      "Music Video": <Music className="h-5 w-5" data-oid="ln4n5ut" />,
      Documentary: <Camera className="h-5 w-5" data-oid="j5ncduk" />,
      Corporate: <Sparkles className="h-5 w-5" data-oid="450r4ar" />,
      "Social Media": <Palette className="h-5 w-5" data-oid="y.x8_e5" />,
    }
    return icons[styleName] || <Film className="h-5 w-5" data-oid="_rtkfqq" />
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
    <Card className={cn("", className)} data-oid="zfbtt90">
      <CardHeader data-oid="2zlvb80">
        <CardTitle data-oid="bsp:ytx">Style & Visual Settings</CardTitle>
        <CardDescription data-oid="z1sbd42">
          Control the creative direction and visual style of your montage
        </CardDescription>
      </CardHeader>
      <CardContent data-oid=":.o_hw7">
        <Tabs defaultValue="style" className="w-full" data-oid="y5v-c93">
          <TabsList className="grid w-full grid-cols-3" data-oid="ipek4yk">
            <TabsTrigger value="style" data-oid="z0f6ca0">
              Style
            </TabsTrigger>
            <TabsTrigger value="visual" data-oid="dz_twwf">
              Visual
            </TabsTrigger>
            <TabsTrigger value="advanced" data-oid=":j0vhhx">
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Style Tab */}
          <TabsContent value="style" className="space-y-4" data-oid="juq-7r6">
            {/* Style Selection */}
            <div className="space-y-3" data-oid="r04e2e7">
              <Label data-oid="_xp8lj_">Montage Style</Label>
              <RadioGroup
                value={preferences.style}
                onValueChange={(value: string) => onPreferencesChange({ style: value })}
                data-oid=".qd25om"
              >
                <div className="grid gap-3" data-oid="b_cscuo">
                  {Object.entries(MONTAGE_STYLES).map(([styleId, config]) => (
                    <div key={styleId} className="relative" data-oid="ahie-ks">
                      <RadioGroupItem value={styleId} id={styleId} className="peer sr-only" data-oid="qh9d:iy" />
                      <Label
                        htmlFor={styleId}
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                          "hover:bg-accent",
                          "peer-checked:border-primary peer-checked:bg-accent",
                        )}
                        data-oid="4o0yq37"
                      >
                        <div className="mt-0.5" data-oid="n-95f8:">
                          {getStyleIcon(config.name)}
                        </div>
                        <div className="flex-1 space-y-1" data-oid="60pl77r">
                          <div className="font-medium" data-oid="yl0-zbi">
                            {config.name}
                          </div>
                          <div className="text-sm text-muted-foreground" data-oid="-gsb9ih">
                            {config.description}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2" data-oid="eweg383">
                            <Badge variant="outline" className="text-xs" data-oid="ppdoe6y">
                              Pace: {config.params?.pacePreference || "medium"}
                            </Badge>
                            <Badge variant="outline" className="text-xs" data-oid="hrmezg-">
                              Energy: {config.params?.energyRange?.[0] || 0}-{config.params?.energyRange?.[1] || 100}
                            </Badge>
                            <Badge variant="outline" className="text-xs" data-oid="hrg-hi1">
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
            <div className="space-y-4 pt-4 border-t" data-oid="nkx7r2:">
              <h4 className="text-sm font-medium" data-oid="u.p.5y4">
                Style Customization
              </h4>

              {/* Energy Range */}
              <div className="space-y-2" data-oid="pydxd5f">
                <div className="flex items-center justify-between" data-oid="ij8c-de">
                  <Label data-oid="s2sq57l">Energy Range</Label>
                  <span className="text-sm text-muted-foreground" data-oid="-az4zv4">
                    {preferences.styleParameters.energyRange[0]}-{preferences.styleParameters.energyRange[1]}%
                  </span>
                </div>
                <div className="px-2" data-oid="vz7dbxq">
                  <Slider
                    value={preferences.styleParameters.energyRange}
                    onValueChange={(value) =>
                      updateStyleParameters({
                        energyRange: value as [number, number],
                      })
                    }
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                    data-oid="x2q23mm"
                  />
                </div>
              </div>

              {/* Cut Frequency */}
              <div className="space-y-2" data-oid="2xv..hj">
                <Label data-oid="n64b-j5">Cut Frequency</Label>
                <RadioGroup
                  value={preferences.styleParameters.cutFrequency}
                  onValueChange={(value) => updateStyleParameters({ cutFrequency: value as any })}
                  data-oid="o:1ijnm"
                >
                  <div className="grid grid-cols-4 gap-2" data-oid="qx-_5g-">
                    {["slow", "medium", "fast", "mixed"].map((freq) => (
                      <div key={freq} className="flex items-center" data-oid="vl.a9lo">
                        <RadioGroupItem value={freq} id={`freq-${freq}`} data-oid="diitzas" />
                        <Label
                          htmlFor={`freq-${freq}`}
                          className="ml-2 text-sm capitalize cursor-pointer"
                          data-oid="x5jwmhe"
                        >
                          {freq}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Emotion Focus */}
              <div className="space-y-2" data-oid="xzp0m82">
                <div className="flex items-center justify-between" data-oid="tz52-:5">
                  <Label data-oid="3jqc47r">Emotion Focus</Label>
                  <span className="text-sm text-muted-foreground" data-oid="1lyxo4t">
                    {preferences.styleParameters.emotionFocus}%
                  </span>
                </div>
                <Slider
                  value={[preferences.styleParameters.emotionFocus]}
                  onValueChange={([value]) => updateStyleParameters({ emotionFocus: value })}
                  max={100}
                  step={5}
                  className="w-full"
                  data-oid="kbbhjve"
                />
              </div>
            </div>
          </TabsContent>

          {/* Visual Tab */}
          <TabsContent value="visual" className="space-y-4" data-oid="bw2_545">
            {/* Color Grading */}
            <div className="space-y-2" data-oid="qhbpv0w">
              <Label data-oid="gs-_gks">Color Grading Preference</Label>
              <RadioGroup
                value={preferences.visualParameters.colorGrading}
                onValueChange={(value) =>
                  updateVisualParameters({
                    colorGrading: value as VisualParameters["colorGrading"],
                  })
                }
                data-oid="r6rd3sn"
              >
                <div className="grid grid-cols-2 gap-3" data-oid="_yy64wo">
                  {["neutral", "warm", "cool", "vibrant", "muted", "cinematic"].map((grade) => (
                    <div key={grade} className="flex items-center" data-oid="kpg00bk">
                      <RadioGroupItem value={grade} id={`grade-${grade}`} data-oid="h6.djqg" />
                      <Label
                        htmlFor={`grade-${grade}`}
                        className="ml-2 text-sm capitalize cursor-pointer"
                        data-oid="5j1f:2h"
                      >
                        {grade}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Contrast Level */}
            <div className="space-y-2" data-oid="x47rvxz">
              <div className="flex items-center justify-between" data-oid="sucvt-7">
                <Label data-oid="9iu5:gz">Contrast Level</Label>
                <span className="text-sm text-muted-foreground" data-oid="la4873t">
                  {preferences.visualParameters.contrastLevel}%
                </span>
              </div>
              <Slider
                value={[preferences.visualParameters.contrastLevel]}
                onValueChange={([value]) => updateVisualParameters({ contrastLevel: value })}
                max={100}
                step={5}
                className="w-full"
                data-oid="z8qgv0d"
              />
            </div>

            {/* Saturation Level */}
            <div className="space-y-2" data-oid="e:98ioe">
              <div className="flex items-center justify-between" data-oid="2or0-i-">
                <Label data-oid="ctpma9m">Saturation Level</Label>
                <span className="text-sm text-muted-foreground" data-oid="q0h61y5">
                  {preferences.visualParameters.saturationLevel}%
                </span>
              </div>
              <Slider
                value={[preferences.visualParameters.saturationLevel]}
                onValueChange={([value]) => updateVisualParameters({ saturationLevel: value })}
                max={100}
                step={5}
                className="w-full"
                data-oid="h5rcx9j"
              />
            </div>

            {/* Visual Preferences */}
            <div className="space-y-3 pt-4 border-t" data-oid="f939nts">
              <h4 className="text-sm font-medium" data-oid="hglbc._">
                Visual Preferences
              </h4>

              <div className="space-y-2" data-oid="bm.b83d">
                <div className="flex items-center justify-between" data-oid="suonq7a">
                  <Label htmlFor={`${id}-stabilization`} data-oid="kgdnds0">
                    Apply Stabilization
                  </Label>
                  <Switch
                    id={`${id}-stabilization`}
                    checked={preferences.visualParameters.stabilization}
                    onCheckedChange={(checked) => updateVisualParameters({ stabilization: checked })}
                    data-oid="mp:-ike"
                  />
                </div>

                <div className="flex items-center justify-between" data-oid="8kop73w">
                  <Label htmlFor={`${id}-grain`} data-oid="040cyag">
                    Add Film Grain
                  </Label>
                  <Switch
                    id={`${id}-grain`}
                    checked={preferences.visualParameters.grainIntensity > 0}
                    onCheckedChange={(checked) =>
                      updateVisualParameters({
                        grainIntensity: checked ? 20 : 0,
                      })
                    }
                    data-oid="_n6_lps"
                  />
                </div>

                {preferences.visualParameters.grainIntensity > 0 && (
                  <div className="ml-8 space-y-2" data-oid="uuk8ndd">
                    <div className="flex items-center justify-between" data-oid="3jz_w7j">
                      <Label className="text-xs" data-oid="9e_1q8k">
                        Grain Intensity
                      </Label>
                      <span className="text-xs text-muted-foreground" data-oid="sjdb57l">
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
                      data-oid="mxdej6n"
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4" data-oid="seu9-gb">
            {/* Quality Settings */}
            <div className="space-y-3" data-oid="_ted6-3">
              <h4 className="text-sm font-medium" data-oid="fbetlgu">
                Quality Thresholds
              </h4>

              <div className="space-y-2" data-oid="mj-4dr.">
                <div className="flex items-center justify-between" data-oid="n_9eluz">
                  <Label data-oid="x87eamp">Minimum Fragment Quality</Label>
                  <span className="text-sm text-muted-foreground" data-oid="4u6ofsu">
                    {preferences.qualityThreshold}%
                  </span>
                </div>
                <Slider
                  value={[preferences.qualityThreshold]}
                  onValueChange={([value]) => onPreferencesChange({ qualityThreshold: value })}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                  data-oid="04xo22b"
                />
              </div>

              <div className="space-y-2" data-oid="sqwx4cl">
                <div className="flex items-center justify-between" data-oid="qqeup_3">
                  <Label data-oid="6vrgngq">Target Duration</Label>
                  <span className="text-sm text-muted-foreground" data-oid="8:5tut3">
                    {preferences.targetDuration}s
                  </span>
                </div>
                <Slider
                  value={[preferences.targetDuration]}
                  onValueChange={([value]) => onPreferencesChange({ targetDuration: value })}
                  min={10}
                  max={600}
                  step={10}
                  className="w-full"
                  data-oid="9gczcfr"
                />
              </div>
            </div>

            {/* Optimization Preferences */}
            <div className="space-y-3 pt-4 border-t" data-oid="avj452r">
              <h4 className="text-sm font-medium" data-oid=":x_n4yn">
                Optimization
              </h4>

              <div className="space-y-2" data-oid="u73:ss-">
                <div className="flex items-center justify-between" data-oid="8r6hu5j">
                  <Label htmlFor={`${id}-auto-balance`} data-oid="fuc9377">
                    Auto-balance Sequences
                  </Label>
                  <Switch
                    id={`${id}-auto-balance`}
                    checked={preferences.autoBalance ?? true}
                    onCheckedChange={(checked) => onPreferencesChange({ autoBalance: checked })}
                    data-oid="qj0tnbu"
                  />
                </div>

                <div className="flex items-center justify-between" data-oid="plsbv2p">
                  <Label htmlFor={`${id}-diversity`} data-oid="eiafro8">
                    Maximize Fragment Diversity
                  </Label>
                  <Switch
                    id={`${id}-diversity`}
                    checked={preferences.diversityBoost ?? false}
                    onCheckedChange={(checked) => onPreferencesChange({ diversityBoost: checked })}
                    data-oid="fb:xk:."
                  />
                </div>

                <div className="flex items-center justify-between" data-oid="3gh42hx">
                  <Label htmlFor={`${id}-coherence`} data-oid="gf.l._j">
                    Prioritize Narrative Coherence
                  </Label>
                  <Switch
                    id={`${id}-coherence`}
                    checked={preferences.narrativeCoherence ?? true}
                    onCheckedChange={(checked) => onPreferencesChange({ narrativeCoherence: checked })}
                    data-oid="rjyzdti"
                  />
                </div>
              </div>
            </div>

            {/* Reset to Style Defaults */}
            <div className="pt-4 border-t" data-oid="ra04-uw">
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
                data-oid="0jxmvps"
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

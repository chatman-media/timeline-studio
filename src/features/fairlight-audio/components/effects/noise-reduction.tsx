/**
 * Noise Reduction UI Component
 * Professional noise reduction interface with multiple algorithms
 */

import { Activity, AlertCircle, Brain, Mic, MicOff, Volume2, Waves, Zap } from "lucide-react"
import { useCallback, useId, useState } from "react"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type {
  AnalysisResult,
  NoiseProfile,
  NoiseReductionConfig,
} from "../../services/noise-reduction/noise-reduction-engine"

export interface NoiseReductionSettings {
  enabled: boolean
  config: NoiseReductionConfig
  profileId?: string
}

interface NoiseReductionProps {
  settings: NoiseReductionSettings
  onChange: (settings: NoiseReductionSettings) => void
  onAnalyze?: () => void
  isProcessing?: boolean
  analysisResult?: AnalysisResult
  noiseProfiles?: NoiseProfile[]
}

export function NoiseReduction({
  settings,
  onChange,
  onAnalyze,
  isProcessing = false,
  analysisResult,
  noiseProfiles = [],
}: NoiseReductionProps) {
  const { t } = useTranslation()
  const [isLearning, setIsLearning] = useState(false)
  const [previewEnabled, setPreviewEnabled] = useState(false)

  const handleConfigChange = useCallback(
    (updates: Partial<NoiseReductionConfig>) => {
      onChange({
        ...settings,
        config: {
          ...settings.config,
          ...updates,
        },
      })
    },
    [settings, onChange],
  )

  const handleAlgorithmChange = useCallback(
    (algorithm: NoiseReductionConfig["algorithm"]) => {
      // Set default values for different algorithms
      const defaults: Partial<NoiseReductionConfig> = {
        algorithm,
        strength: algorithm === "ai" ? 80 : 50,
        preserveVoice: algorithm === "ai" || algorithm === "adaptive",
        attackTime: 10,
        releaseTime: 100,
        frequencySmoothing: 0.5,
        noiseFloor: -60,
        gateThreshold: -40,
      }

      onChange({
        ...settings,
        config: {
          ...settings.config,
          ...defaults,
        },
      })
    },
    [settings, onChange],
  )

  const getAlgorithmInfo = (algorithm: string) => {
    switch (algorithm) {
      case "spectral":
        return {
          icon: <Waves className="w-4 h-4" />,
          name: t("fairlightAudio.effects.noiseReduction.algorithms.spectralGate.name"),
          description: t("fairlightAudio.effects.noiseReduction.algorithms.spectralGate.description"),
        }
      case "wiener":
        return {
          icon: <Activity className="w-4 h-4" />,
          name: t("fairlightAudio.effects.noiseReduction.algorithms.wienerFilter.name"),
          description: t("fairlightAudio.effects.noiseReduction.algorithms.wienerFilter.description"),
        }
      case "ai":
        return {
          icon: <Brain className="w-4 h-4" />,
          name: t("fairlightAudio.effects.noiseReduction.algorithms.aiDenoising.name"),
          description: t("fairlightAudio.effects.noiseReduction.algorithms.aiDenoising.description"),
        }
      case "adaptive":
        return {
          icon: <Zap className="w-4 h-4" />,
          name: t("fairlightAudio.effects.noiseReduction.algorithms.adaptive.name"),
          description: t("fairlightAudio.effects.noiseReduction.algorithms.adaptive.description"),
        }
      default:
        return null
    }
  }

  const algorithmInfo = getAlgorithmInfo(settings.config.algorithm)
  const id = useId()

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {settings.enabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            Noise Reduction
          </CardTitle>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => onChange({ ...settings, enabled })}
            aria-label="Enable noise reduction"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Algorithm Selection */}
        <div className="space-y-2">
          <Label htmlFor={`${id}-algorithm`} className="text-xs">
            Algorithm
          </Label>
          <Select value={settings.config.algorithm} onValueChange={handleAlgorithmChange} disabled={!settings.enabled}>
            <SelectTrigger id={`${id}-algorithm`} className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spectral">
                <div className="flex items-center gap-2">
                  <Waves className="w-4 h-4" />
                  <span>Spectral Gate</span>
                </div>
              </SelectItem>
              <SelectItem value="wiener">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>Wiener Filter</span>
                </div>
              </SelectItem>
              <SelectItem value="ai">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span>AI Denoising</span>
                </div>
              </SelectItem>
              <SelectItem value="adaptive">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Adaptive</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {algorithmInfo && <p className="text-xs text-muted-foreground">{algorithmInfo.description}</p>}
        </div>

        {/* Main Controls */}
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="basic" className="text-xs">
              Basic
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs">
              Advanced
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs">
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            {/* Strength Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${id}-strength`} className="text-xs">
                  Reduction Strength
                </Label>
                <span className="text-xs text-muted-foreground">{settings.config.strength}%</span>
              </div>
              <Slider
                id={`${id}-strength`}
                min={0}
                max={100}
                step={1}
                value={[settings.config.strength]}
                onValueChange={([value]) => handleConfigChange({ strength: value })}
                disabled={!settings.enabled}
                className="w-full"
              />
            </div>

            {/* Voice Preservation */}
            {(settings.config.algorithm === "ai" || settings.config.algorithm === "adaptive") && (
              <div className="flex items-center justify-between">
                <Label htmlFor={`${id}-preserve-voice`} className="text-xs">
                  Preserve Voice
                </Label>
                <Switch
                  id={`${id}-preserve-voice`}
                  checked={settings.config.preserveVoice}
                  onCheckedChange={(preserveVoice) => handleConfigChange({ preserveVoice })}
                  disabled={!settings.enabled}
                />
              </div>
            )}

            {/* Noise Profile Selection */}
            {noiseProfiles.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor={`${id}-profile`} className="text-xs">
                  Noise Profile
                </Label>
                <Select value={settings.profileId} onValueChange={(profileId) => onChange({ ...settings, profileId })}>
                  <SelectTrigger id={`${id}-profile`} className="h-8">
                    <SelectValue placeholder="Select profile..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (Auto-detect)</SelectItem>
                    {noiseProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Learn Noise Button */}
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setIsLearning(!isLearning)}
              disabled={!settings.enabled || isProcessing}
            >
              {isLearning ? (
                <>
                  <MicOff className="w-3 h-3 mr-1" />
                  Stop Learning
                </>
              ) : (
                <>
                  <Mic className="w-3 h-3 mr-1" />
                  Learn Noise Profile
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            {/* Attack Time */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${id}-attack`} className="text-xs">
                  Attack Time
                </Label>
                <span className="text-xs text-muted-foreground">{settings.config.attackTime}ms</span>
              </div>
              <Slider
                id={`${id}-attack`}
                min={1}
                max={100}
                step={1}
                value={[settings.config.attackTime]}
                onValueChange={([value]) => handleConfigChange({ attackTime: value })}
                disabled={!settings.enabled}
              />
            </div>

            {/* Release Time */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${id}-release`} className="text-xs">
                  Release Time
                </Label>
                <span className="text-xs text-muted-foreground">{settings.config.releaseTime}ms</span>
              </div>
              <Slider
                id={`${id}-release`}
                min={10}
                max={1000}
                step={10}
                value={[settings.config.releaseTime]}
                onValueChange={([value]) => handleConfigChange({ releaseTime: value })}
                disabled={!settings.enabled}
              />
            </div>

            {/* Frequency Smoothing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${id}-smoothing`} className="text-xs">
                  Frequency Smoothing
                </Label>
                <span className="text-xs text-muted-foreground">
                  {Math.round(settings.config.frequencySmoothing * 100)}%
                </span>
              </div>
              <Slider
                id={`${id}-smoothing`}
                min={0}
                max={1}
                step={0.01}
                value={[settings.config.frequencySmoothing]}
                onValueChange={([value]) => handleConfigChange({ frequencySmoothing: value })}
                disabled={!settings.enabled}
              />
            </div>

            {/* Noise Floor */}
            {(settings.config.algorithm === "spectral" || settings.config.algorithm === "wiener") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${id}-floor`} className="text-xs">
                    {t("fairlightAudio.effects.noiseReduction.parameters.noiseFloor")}
                  </Label>
                  <span className="text-xs text-muted-foreground">{settings.config.noiseFloor}dB</span>
                </div>
                <Slider
                  id={`${id}-floor`}
                  min={-80}
                  max={-20}
                  step={1}
                  value={[settings.config.noiseFloor]}
                  onValueChange={([value]) => handleConfigChange({ noiseFloor: value })}
                  disabled={!settings.enabled}
                />
              </div>
            )}

            {/* Gate Threshold */}
            {settings.config.algorithm === "spectral" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${id}-threshold`} className="text-xs">
                    {t("fairlightAudio.effects.noiseReduction.parameters.gateThreshold")}
                  </Label>
                  <span className="text-xs text-muted-foreground">{settings.config.gateThreshold}dB</span>
                </div>
                <Slider
                  id={`${id}-threshold`}
                  min={-60}
                  max={0}
                  step={1}
                  value={[settings.config.gateThreshold]}
                  onValueChange={([value]) => handleConfigChange({ gateThreshold: value })}
                  disabled={!settings.enabled}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 mt-4">
            {/* Analysis Button */}
            <Button size="sm" className="w-full" onClick={onAnalyze} disabled={!settings.enabled || isProcessing}>
              {isProcessing ? (
                <>
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Activity className="w-3 h-3 mr-1" />
                  Analyze Audio
                </>
              )}
            </Button>

            {/* Analysis Results */}
            {analysisResult && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">SNR</p>
                    <p className="text-sm font-medium">{analysisResult.snr.toFixed(1)} dB</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Noise Level</p>
                    <p className="text-sm font-medium">{analysisResult.noiseLevel.toFixed(1)} dB</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Voice Detection</p>
                    <Badge variant={analysisResult.voiceDetected ? "default" : "secondary"}>
                      {analysisResult.voiceDetected ? "Detected" : "Not Detected"}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <p className="text-xs">{Math.round(analysisResult.confidence * 100)}%</p>
                    </div>
                    <Progress value={analysisResult.confidence * 100} className="h-1" />
                  </div>
                </div>

                {analysisResult.dominantFrequencies.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Dominant Frequencies</p>
                    <div className="flex flex-wrap gap-1">
                      {analysisResult.dominantFrequencies.map((freq, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {freq} Hz
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <Alert className="py-2">
                  <AlertCircle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    {analysisResult.snr < 10
                      ? t("fairlightAudio.effects.noiseReduction.recommendations.highNoise")
                      : analysisResult.voiceDetected
                        ? t("fairlightAudio.effects.noiseReduction.recommendations.voiceDetected")
                        : t("fairlightAudio.effects.noiseReduction.recommendations.noVoice")}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Preview Toggle */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Label htmlFor={`${id}-preview`} className="text-xs">
            {t("fairlightAudio.effects.noiseReduction.preview")}
          </Label>
          <div className="flex items-center gap-2">
            <Switch
              id={`${id}-preview`}
              checked={previewEnabled}
              onCheckedChange={setPreviewEnabled}
              disabled={!settings.enabled}
            />
            {previewEnabled && <Volume2 className="w-3 h-3 text-green-500 animate-pulse" />}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

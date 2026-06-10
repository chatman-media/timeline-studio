/**
 * Noise Reduction UI Component
 * Professional noise reduction interface with multiple algorithms
 */

import { Activity, AlertCircle, Brain, Mic, MicOff, Volume2, Waves, Zap } from "lucide-react"
import { useCallback, useId, useState } from "react"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription } from "@timeline-studio/ui/components/alert"
import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Label } from "@timeline-studio/ui/components/label"
import { Progress } from "@timeline-studio/ui/components/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Slider } from "@timeline-studio/ui/components/slider"
import { Switch } from "@timeline-studio/ui/components/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"

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
          icon: <Waves className="w-4 h-4" data-oid="7-p:wyh" />,
          name: t("fairlightAudio.effects.noiseReduction.algorithms.spectralGate.name"),
          description: t("fairlightAudio.effects.noiseReduction.algorithms.spectralGate.description"),
        }
      case "wiener":
        return {
          icon: <Activity className="w-4 h-4" data-oid="59c-clz" />,
          name: t("fairlightAudio.effects.noiseReduction.algorithms.wienerFilter.name"),
          description: t("fairlightAudio.effects.noiseReduction.algorithms.wienerFilter.description"),
        }
      case "ai":
        return {
          icon: <Brain className="w-4 h-4" data-oid="8e_r7pj" />,
          name: t("fairlightAudio.effects.noiseReduction.algorithms.aiDenoising.name"),
          description: t("fairlightAudio.effects.noiseReduction.algorithms.aiDenoising.description"),
        }
      case "adaptive":
        return {
          icon: <Zap className="w-4 h-4" data-oid="heud1h0" />,
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
    <Card className="h-full" data-oid="y5j1x4a">
      <CardHeader className="pb-3" data-oid="yb1snrv">
        <div className="flex items-center justify-between" data-oid="i2chlip">
          <CardTitle className="text-base flex items-center gap-2" data-oid="6e7qz:-">
            {settings.enabled ? (
              <Mic className="w-4 h-4" data-oid="osvi.em" />
            ) : (
              <MicOff className="w-4 h-4" data-oid="9ew9:5r" />
            )}
            Noise Reduction
          </CardTitle>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => onChange({ ...settings, enabled })}
            aria-label="Enable noise reduction"
            data-oid="gf4zpti"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4" data-oid="auelaeg">
        {/* Algorithm Selection */}
        <div className="space-y-2" data-oid="8y1r-90">
          <Label htmlFor={`${id}-algorithm`} className="text-xs" data-oid="umd8x_-">
            Algorithm
          </Label>
          <Select
            value={settings.config.algorithm}
            onValueChange={handleAlgorithmChange}
            disabled={!settings.enabled}
            data-oid="p:4m7_c"
          >
            <SelectTrigger id={`${id}-algorithm`} className="h-9" data-oid="9kzw90d">
              <SelectValue data-oid="rmarqyp" />
            </SelectTrigger>
            <SelectContent data-oid="_8j2.m9">
              <SelectItem value="spectral" data-oid="fmxcrbw">
                <div className="flex items-center gap-2" data-oid="wovugit">
                  <Waves className="w-4 h-4" data-oid="9v2xdet" />
                  <span data-oid="nm_to.6">Spectral Gate</span>
                </div>
              </SelectItem>
              <SelectItem value="wiener" data-oid="q__g-b7">
                <div className="flex items-center gap-2" data-oid="..iifxp">
                  <Activity className="w-4 h-4" data-oid="wljnut5" />
                  <span data-oid="su7-ex7">Wiener Filter</span>
                </div>
              </SelectItem>
              <SelectItem value="ai" data-oid="kzpx7cx">
                <div className="flex items-center gap-2" data-oid="emur07c">
                  <Brain className="w-4 h-4" data-oid="1wa9nzh" />
                  <span data-oid="drdci9y">AI Denoising</span>
                </div>
              </SelectItem>
              <SelectItem value="adaptive" data-oid="v7lqlxr">
                <div className="flex items-center gap-2" data-oid="a409fzo">
                  <Zap className="w-4 h-4" data-oid="phm1vw2" />
                  <span data-oid="ddlvxwc">Adaptive</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {algorithmInfo && (
            <p className="text-xs text-muted-foreground" data-oid="z7a:x-:">
              {algorithmInfo.description}
            </p>
          )}
        </div>

        {/* Main Controls */}
        <Tabs defaultValue="basic" className="w-full" data-oid="ld36x2z">
          <TabsList className="grid w-full grid-cols-3 h-8" data-oid="wh7:-:y">
            <TabsTrigger value="basic" className="text-xs" data-oid="wlixn_0">
              Basic
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs" data-oid="64jtyj7">
              Advanced
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs" data-oid="zt48x76">
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4" data-oid="v-x9mid">
            {/* Strength Control */}
            <div className="space-y-2" data-oid="npa05n7">
              <div className="flex items-center justify-between" data-oid="vg:43j3">
                <Label htmlFor={`${id}-strength`} className="text-xs" data-oid="t_-prvn">
                  Reduction Strength
                </Label>
                <span className="text-xs text-muted-foreground" data-oid="v4227vu">
                  {settings.config.strength}%
                </span>
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
                data-oid="da8bn79"
              />
            </div>

            {/* Voice Preservation */}
            {(settings.config.algorithm === "ai" || settings.config.algorithm === "adaptive") && (
              <div className="flex items-center justify-between" data-oid="3w1ppl4">
                <Label htmlFor={`${id}-preserve-voice`} className="text-xs" data-oid="2rsd8ef">
                  Preserve Voice
                </Label>
                <Switch
                  id={`${id}-preserve-voice`}
                  checked={settings.config.preserveVoice}
                  onCheckedChange={(preserveVoice) => handleConfigChange({ preserveVoice })}
                  disabled={!settings.enabled}
                  data-oid="xl45bs2"
                />
              </div>
            )}

            {/* Noise Profile Selection */}
            {noiseProfiles.length > 0 && (
              <div className="space-y-2" data-oid="i30i6r2">
                <Label htmlFor={`${id}-profile`} className="text-xs" data-oid="85a5k2t">
                  Noise Profile
                </Label>
                <Select
                  value={settings.profileId}
                  onValueChange={(profileId) => onChange({ ...settings, profileId })}
                  data-oid="436sn30"
                >
                  <SelectTrigger id={`${id}-profile`} className="h-8" data-oid="_-q54cw">
                    <SelectValue placeholder="Select profile..." data-oid="_gwliab" />
                  </SelectTrigger>
                  <SelectContent data-oid="v3loiq6">
                    <SelectItem value="" data-oid="zc0kg7u">
                      None (Auto-detect)
                    </SelectItem>
                    {noiseProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id} data-oid=".bu9gqt">
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
              data-oid="in6q1we"
            >
              {isLearning ? (
                <>
                  <MicOff className="w-3 h-3 mr-1" data-oid="zw0hhaw" />
                  Stop Learning
                </>
              ) : (
                <>
                  <Mic className="w-3 h-3 mr-1" data-oid="b5vzief" />
                  Learn Noise Profile
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4" data-oid="7-q5ui9">
            {/* Attack Time */}
            <div className="space-y-2" data-oid="akdt2ai">
              <div className="flex items-center justify-between" data-oid="nuo3hn2">
                <Label htmlFor={`${id}-attack`} className="text-xs" data-oid="gbmobz_">
                  Attack Time
                </Label>
                <span className="text-xs text-muted-foreground" data-oid="opx7zkl">
                  {settings.config.attackTime}ms
                </span>
              </div>
              <Slider
                id={`${id}-attack`}
                min={1}
                max={100}
                step={1}
                value={[settings.config.attackTime]}
                onValueChange={([value]) => handleConfigChange({ attackTime: value })}
                disabled={!settings.enabled}
                data-oid="0i89ur3"
              />
            </div>

            {/* Release Time */}
            <div className="space-y-2" data-oid="4ng9i0.">
              <div className="flex items-center justify-between" data-oid="u24qdk0">
                <Label htmlFor={`${id}-release`} className="text-xs" data-oid="hi9qp8r">
                  Release Time
                </Label>
                <span className="text-xs text-muted-foreground" data-oid="jb1jk8n">
                  {settings.config.releaseTime}ms
                </span>
              </div>
              <Slider
                id={`${id}-release`}
                min={10}
                max={1000}
                step={10}
                value={[settings.config.releaseTime]}
                onValueChange={([value]) => handleConfigChange({ releaseTime: value })}
                disabled={!settings.enabled}
                data-oid="xx8cgg:"
              />
            </div>

            {/* Frequency Smoothing */}
            <div className="space-y-2" data-oid="a07:89r">
              <div className="flex items-center justify-between" data-oid="adracb:">
                <Label htmlFor={`${id}-smoothing`} className="text-xs" data-oid="pa6zfdi">
                  Frequency Smoothing
                </Label>
                <span className="text-xs text-muted-foreground" data-oid="4cepyxo">
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
                data-oid="e4qno8u"
              />
            </div>

            {/* Noise Floor */}
            {(settings.config.algorithm === "spectral" || settings.config.algorithm === "wiener") && (
              <div className="space-y-2" data-oid="ss0d.0n">
                <div className="flex items-center justify-between" data-oid="vhypeg-">
                  <Label htmlFor={`${id}-floor`} className="text-xs" data-oid="c0v8d35">
                    {t("fairlightAudio.effects.noiseReduction.parameters.noiseFloor")}
                  </Label>
                  <span className="text-xs text-muted-foreground" data-oid="dtz9cgq">
                    {settings.config.noiseFloor}dB
                  </span>
                </div>
                <Slider
                  id={`${id}-floor`}
                  min={-80}
                  max={-20}
                  step={1}
                  value={[settings.config.noiseFloor]}
                  onValueChange={([value]) => handleConfigChange({ noiseFloor: value })}
                  disabled={!settings.enabled}
                  data-oid="tonxyip"
                />
              </div>
            )}

            {/* Gate Threshold */}
            {settings.config.algorithm === "spectral" && (
              <div className="space-y-2" data-oid="v:-7k-0">
                <div className="flex items-center justify-between" data-oid="e_fvga3">
                  <Label htmlFor={`${id}-threshold`} className="text-xs" data-oid="ah916h5">
                    {t("fairlightAudio.effects.noiseReduction.parameters.gateThreshold")}
                  </Label>
                  <span className="text-xs text-muted-foreground" data-oid=".yzeq_c">
                    {settings.config.gateThreshold}dB
                  </span>
                </div>
                <Slider
                  id={`${id}-threshold`}
                  min={-60}
                  max={0}
                  step={1}
                  value={[settings.config.gateThreshold]}
                  onValueChange={([value]) => handleConfigChange({ gateThreshold: value })}
                  disabled={!settings.enabled}
                  data-oid="pk20e3t"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 mt-4" data-oid="mhuheu-">
            {/* Analysis Button */}
            <Button
              size="sm"
              className="w-full"
              onClick={onAnalyze}
              disabled={!settings.enabled || isProcessing}
              data-oid="yo0oacj"
            >
              {isProcessing ? (
                <>
                  <Activity className="w-3 h-3 mr-1 animate-pulse" data-oid="t.40h62" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Activity className="w-3 h-3 mr-1" data-oid="t_3uvtc" />
                  Analyze Audio
                </>
              )}
            </Button>

            {/* Analysis Results */}
            {analysisResult && (
              <div className="space-y-3" data-oid="m7h_w61">
                <div className="grid grid-cols-2 gap-3" data-oid="xtauw2d">
                  <div className="space-y-1" data-oid="u8z2xl1">
                    <p className="text-xs text-muted-foreground" data-oid="-_48nmi">
                      SNR
                    </p>
                    <p className="text-sm font-medium" data-oid="6h208w6">
                      {analysisResult.snr.toFixed(1)} dB
                    </p>
                  </div>
                  <div className="space-y-1" data-oid="yim1_o3">
                    <p className="text-xs text-muted-foreground" data-oid="kxa-mk0">
                      Noise Level
                    </p>
                    <p className="text-sm font-medium" data-oid="aohsz_1">
                      {analysisResult.noiseLevel.toFixed(1)} dB
                    </p>
                  </div>
                </div>

                <div className="space-y-2" data-oid="b5p6jif">
                  <div className="flex items-center justify-between" data-oid="581jcj9">
                    <p className="text-xs text-muted-foreground" data-oid="64468dv">
                      Voice Detection
                    </p>
                    <Badge variant={analysisResult.voiceDetected ? "default" : "secondary"} data-oid="f4qnthz">
                      {analysisResult.voiceDetected ? "Detected" : "Not Detected"}
                    </Badge>
                  </div>

                  <div className="space-y-1" data-oid="9rhi6u:">
                    <div className="flex items-center justify-between" data-oid="w:kh4dp">
                      <p className="text-xs text-muted-foreground" data-oid="rswme5z">
                        Confidence
                      </p>
                      <p className="text-xs" data-oid=":c6t0w0">
                        {Math.round(analysisResult.confidence * 100)}%
                      </p>
                    </div>
                    <Progress value={analysisResult.confidence * 100} className="h-1" data-oid="ns1j75l" />
                  </div>
                </div>

                {analysisResult.dominantFrequencies.length > 0 && (
                  <div className="space-y-1" data-oid="tb1w3.7">
                    <p className="text-xs text-muted-foreground" data-oid="n5dm1mx">
                      Dominant Frequencies
                    </p>
                    <div className="flex flex-wrap gap-1" data-oid="i3fpk3t">
                      {analysisResult.dominantFrequencies.map((freq, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs" data-oid="b0zcqi_">
                          {freq} Hz
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <Alert className="py-2" data-oid="izma2_-">
                  <AlertCircle className="h-3 w-3" data-oid="zjqn6qz" />
                  <AlertDescription className="text-xs" data-oid="hug0ss3">
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
        <div className="flex items-center justify-between pt-2 border-t" data-oid="-w9ydxi">
          <Label htmlFor={`${id}-preview`} className="text-xs" data-oid="4q-rprj">
            {t("fairlightAudio.effects.noiseReduction.preview")}
          </Label>
          <div className="flex items-center gap-2" data-oid="e44xsf0">
            <Switch
              id={`${id}-preview`}
              checked={previewEnabled}
              onCheckedChange={setPreviewEnabled}
              disabled={!settings.enabled}
              data-oid="ss81-k9"
            />

            {previewEnabled && <Volume2 className="w-3 h-3 text-green-500 animate-pulse" data-oid="vdn5qh-" />}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

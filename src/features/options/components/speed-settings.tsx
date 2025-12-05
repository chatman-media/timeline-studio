import { ChevronDown, Gauge, Play, Settings, Zap } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "SpeedSettings" })

import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useTimeline } from "@/features/timeline"

interface SpeedSettingsState {
  basicSpeed: boolean
  speedRamping: boolean
  interpolation: boolean
  advanced: boolean
}

export function SpeedSettings() {
  const { t } = useTranslation()

  // Безопасно получаем timeline data
  let selectedClips: any[] = []
  try {
    const timeline = useTimeline()
    const selectedClipIds = timeline.selectedClipIds || []
    // Получаем клипы по их ID
    selectedClips = selectedClipIds
      .map((clipId: string) => timeline.clips?.find((clip: any) => clip.id === clipId))
      .filter(Boolean)
  } catch {
    // TimelineProvider не доступен (например, в тестах)
    selectedClips = []
  }

  // Получаем первый выбранный клип для демонстрации
  const currentClip = selectedClips?.[0] || null

  // Состояние открытых секций
  const [openSections, setOpenSections] = useState<SpeedSettingsState>({
    basicSpeed: true, // Первая секция открыта по умолчанию
    speedRamping: false,
    interpolation: false,
    advanced: false,
  })

  // Локальное состояние настроек
  const [settings, setSettings] = useState({
    defaultSpeed: 1.0,
    customSpeed: 1.0,
    interpolationType: "cubic",
    motionBlur: "medium",
    smoothPlayback: true,
    smoothnessLevel: 50,
    preservePitch: true,
    autoKeyframes: false,
    maxSpeed: 10.0,
  })

  const toggleSection = (section: keyof SpeedSettingsState) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Предустановленные скорости
  const SPEED_PRESETS = [
    {
      value: "0.25",
      label: "0.25x",
      description: t("options.speed.speeds.0_25", "Very slow"),
    },
    {
      value: "0.5",
      label: "0.5x",
      description: t("options.speed.speeds.0_5", "Slow"),
    },
    {
      value: "0.75",
      label: "0.75x",
      description: t("options.speed.speeds.0_75", "Slightly slow"),
    },
    {
      value: "1",
      label: "1x",
      description: t("options.speed.speeds.1", "Normal"),
    },
    {
      value: "1.25",
      label: "1.25x",
      description: t("options.speed.speeds.1_25", "Slightly fast"),
    },
    {
      value: "1.5",
      label: "1.5x",
      description: t("options.speed.speeds.1_5", "Fast"),
    },
    {
      value: "2",
      label: "2x",
      description: t("options.speed.speeds.2", "Very fast"),
    },
  ]

  const INTERPOLATION_OPTIONS = [
    {
      value: "none",
      label: t("options.speed.interpolation.none", "No interpolation"),
    },
    {
      value: "linear",
      label: t("options.speed.interpolation.linear", "Linear"),
    },
    { value: "cubic", label: t("options.speed.interpolation.cubic", "Cubic") },
    {
      value: "lanczos",
      label: t("options.speed.interpolation.lanczos", "Lanczos"),
    },
  ]

  const MOTION_BLUR_OPTIONS = [
    { value: "none", label: t("options.speed.motionBlur.none", "Off") },
    { value: "low", label: t("options.speed.motionBlur.low", "Low") },
    { value: "medium", label: t("options.speed.motionBlur.medium", "Medium") },
    { value: "high", label: t("options.speed.motionBlur.high", "High") },
  ]

  const SPEED_RAMPING_PRESETS = [
    {
      id: "slow-motion",
      name: t("options.speed.presets.slowMotion", "Slow Motion"),
    },
    {
      id: "fast-forward",
      name: t("options.speed.presets.fastForward", "Fast Forward"),
    },
    {
      id: "freeze-frame",
      name: t("options.speed.presets.freezeFrame", "Freeze Frame"),
    },
    {
      id: "bullet-time",
      name: t("options.speed.presets.bulletTime", "Bullet Time"),
    },
    {
      id: "ramp-to-slow",
      name: t("options.speed.presets.rampToSlow", "Ramp to Slow"),
    },
    {
      id: "speed-burst",
      name: t("options.speed.presets.speedBurst", "Speed Burst"),
    },
  ]

  const handleSpeedPresetSelect = (speed: string) => {
    const numericSpeed = Number.parseFloat(speed)
    setSettings((prev) => ({
      ...prev,
      defaultSpeed: numericSpeed,
      customSpeed: numericSpeed,
    }))
  }

  const handleApplySpeedRampingPreset = (presetId: string) => {
    // Применение пресета к выбранным клипам
    logger.info("Applying speed ramping preset", { presetId })
  }

  const handleReset = () => {
    setSettings({
      defaultSpeed: 1.0,
      customSpeed: 1.0,
      interpolationType: "cubic",
      motionBlur: "medium",
      smoothPlayback: true,
      smoothnessLevel: 50,
      preservePitch: true,
      autoKeyframes: false,
      maxSpeed: 10.0,
    })
  }

  const handleApply = () => {
    // Применить настройки к выбранным клипам
    logger.info("Applying speed settings", { settings })
  }

  return (
    <div className="flex flex-col h-full" data-testid="speed-settings">
      {/* Основной контент с прокруткой */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground/50 hover:scrollbar-thumb-muted-foreground">
        <div className="p-4 space-y-4">
          {/* Базовые настройки скорости */}
          <Collapsible open={openSections.basicSpeed} onOpenChange={() => toggleSection("basicSpeed")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <Play className="h-4 w-4 text-blue-400" />
                <h3 className="font-medium text-foreground">{t("options.speed.basicSpeed", "Basic Speed")}</h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.basicSpeed ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3">
              <div className="bg-card rounded-lg border border-border p-4 space-y-4">
                {/* Быстрые пресеты */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground/90">
                    {t("options.speed.quickPresets", "Quick Presets")}
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {SPEED_PRESETS.map((preset) => (
                      <Button
                        key={preset.value}
                        variant={settings.defaultSpeed === Number.parseFloat(preset.value) ? "default" : "outline"}
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleSpeedPresetSelect(preset.value)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Пользовательская скорость */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/90">
                    {t("options.speed.customSpeed", "Custom Speed")}
                  </Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="number"
                      value={settings.customSpeed}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          customSpeed: Number.parseFloat(e.target.value) || 1.0,
                        }))
                      }
                      min="0.1"
                      max="10"
                      step="0.1"
                      className="w-20 h-8"
                    />
                    <span className="text-sm text-muted-foreground">x</span>
                    <Slider
                      value={[settings.customSpeed]}
                      onValueChange={([value]) => setSettings((prev) => ({ ...prev, customSpeed: value }))}
                      max={10}
                      min={0.1}
                      step={0.1}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Сохранять тональность */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserve-pitch-basic"
                    checked={settings.preservePitch}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        preservePitch: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="preserve-pitch-basic" className="text-sm text-foreground/90">
                    {t("options.speed.preservePitch", "Preserve pitch when changing speed")}
                  </Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Speed Ramping */}
          <Collapsible open={openSections.speedRamping} onOpenChange={() => toggleSection("speedRamping")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <Zap className="h-4 w-4 text-green-400" />
                <h3 className="font-medium text-foreground">{t("options.speed.speedRamping", "Speed Ramping")}</h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.speedRamping ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3">
              <div className="bg-card rounded-lg border border-border p-4 space-y-4">
                {/* Speed Ramping пресеты */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground/90">
                    {t("options.speed.rampingPresets", "Ramping Presets")}
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SPEED_RAMPING_PRESETS.map((preset) => (
                      <Button
                        key={preset.id}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs justify-start"
                        onClick={() => handleApplySpeedRampingPreset(preset.id)}
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Визуальный редактор кривой скорости */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/90">
                    {t("options.speed.speedCurve", "Speed Curve")}
                  </Label>
                  <div className="bg-background rounded border border-border p-2 h-32 flex items-center justify-center">
                    {currentClip ? (
                      <div className="text-center text-muted-foreground">
                        <div className="text-sm">Speed Curve Editor</div>
                        <div className="text-xs mt-1">Clip: {currentClip.name}</div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground/70">
                        <div className="text-sm">Select a clip to edit speed curve</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Настройки Speed Ramping */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="maintain-duration"
                    checked={settings.autoKeyframes}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        autoKeyframes: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="maintain-duration" className="text-sm text-foreground/90">
                    {t("options.speed.maintainDuration", "Maintain clip duration")}
                  </Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Интерполяция кадров */}
          <Collapsible open={openSections.interpolation} onOpenChange={() => toggleSection("interpolation")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <Gauge className="h-4 w-4 text-yellow-400" />
                <h3 className="font-medium text-foreground">
                  {t("options.speed.frameInterpolation", "Frame Interpolation")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.interpolation ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3">
              <div className="bg-card rounded-lg border border-border p-4 space-y-4">
                {/* Метод интерполяции */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/90">
                    {t("options.speed.interpolationMethod", "Interpolation Method")}
                  </Label>
                  <Select
                    value={settings.interpolationType}
                    onValueChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        interpolationType: value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERPOLATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Motion Blur */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/90">
                    {t("options.speed.motionBlurTitle", "Motion Blur")}
                  </Label>
                  <Select
                    value={settings.motionBlur}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, motionBlur: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOTION_BLUR_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Плавное воспроизведение */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="smooth-playback"
                      checked={settings.smoothPlayback}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          smoothPlayback: !!checked,
                        }))
                      }
                    />
                    <Label htmlFor="smooth-playback" className="text-sm text-foreground/90">
                      {t("options.speed.smoothPlayback", "Smooth Playback")}
                    </Label>
                  </div>

                  {settings.smoothPlayback && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground/90">
                        {t("options.speed.smoothnessLevel", "Smoothness Level")}
                      </Label>
                      <div className="space-y-2">
                        <Slider
                          value={[settings.smoothnessLevel]}
                          onValueChange={([value]) =>
                            setSettings((prev) => ({
                              ...prev,
                              smoothnessLevel: value,
                            }))
                          }
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{t("options.speed.performance", "Performance")}</span>
                          <span>{settings.smoothnessLevel}%</span>
                          <span>{t("options.speed.quality", "Quality")}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Дополнительные настройки */}
          <Collapsible open={openSections.advanced} onOpenChange={() => toggleSection("advanced")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <Settings className="h-4 w-4 text-purple-400" />
                <h3 className="font-medium text-foreground">{t("options.speed.advanced", "Advanced Settings")}</h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.advanced ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3">
              <div className="bg-card rounded-lg border border-border p-4 space-y-4">
                {/* Автоматические ключевые кадры */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-keyframes"
                    checked={settings.autoKeyframes}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        autoKeyframes: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="auto-keyframes" className="text-sm text-foreground/90">
                    {t("options.speed.autoKeyframes", "Auto keyframes")}
                  </Label>
                </div>

                {/* Максимальная скорость */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/90">
                    {t("options.speed.maxSpeed", "Maximum Speed")}
                  </Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="number"
                      value={settings.maxSpeed}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          maxSpeed: Number.parseFloat(e.target.value) || 10.0,
                        }))
                      }
                      min="1"
                      max="100"
                      step="1"
                      className="w-20 h-8"
                    />
                    <span className="text-sm text-muted-foreground">x</span>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Нижняя панель с кнопками */}
      <div className="shrink-0 bg-card border-t border-border p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Пресеты */}
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
              {t("options.speed.presetsButton", "Presets")}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={handleReset}>
              {t("common.reset", "Reset")}
            </Button>
            <Button size="sm" className="h-8 px-3 text-xs" onClick={handleApply}>
              {t("common.apply", "Apply")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

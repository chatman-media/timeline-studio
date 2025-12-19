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
    <div className="flex flex-col h-full" data-testid="speed-settings" data-oid="_ba9_.6">
      {/* Основной контент с прокруткой */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground/50 hover:scrollbar-thumb-muted-foreground"
        data-oid="1fker-m"
      >
        <div className="p-4 space-y-4" data-oid="h-s:es-">
          {/* Базовые настройки скорости */}
          <Collapsible
            open={openSections.basicSpeed}
            onOpenChange={() => toggleSection("basicSpeed")}
            data-oid="hnrn3qd"
          >
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors"
              data-oid="z6j_5kh"
            >
              <div className="flex items-center gap-2" data-oid="dx.t2u5">
                <div className="w-2 h-2 rounded-full bg-blue-400" data-oid="1nvhpj8" />
                <Play className="h-4 w-4 text-blue-400" data-oid="914o4.v" />
                <h3 className="font-medium text-foreground" data-oid="gi2a385">
                  {t("options.speed.basicSpeed", "Basic Speed")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.basicSpeed ? "rotate-180" : ""}`}
                data-oid="pj:ia4q"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3" data-oid="b4mytb5">
              <div className="bg-card rounded-lg border border-border p-4 space-y-4" data-oid="-u.5iiq">
                {/* Быстрые пресеты */}
                <div className="space-y-3" data-oid="u7d8wzk">
                  <Label className="text-sm font-medium text-foreground/90" data-oid="35d2ad.">
                    {t("options.speed.quickPresets", "Quick Presets")}
                  </Label>
                  <div className="grid grid-cols-4 gap-2" data-oid="xv5j33k">
                    {SPEED_PRESETS.map((preset) => (
                      <Button
                        key={preset.value}
                        variant={settings.defaultSpeed === Number.parseFloat(preset.value) ? "default" : "outline"}
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleSpeedPresetSelect(preset.value)}
                        data-oid="ygv-cku"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Пользовательская скорость */}
                <div className="space-y-2" data-oid="aoivnk7">
                  <Label className="text-sm font-medium text-foreground/90" data-oid="p3_0vja">
                    {t("options.speed.customSpeed", "Custom Speed")}
                  </Label>
                  <div className="flex items-center space-x-3" data-oid="__nev.v">
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
                      data-oid="oe-p-0d"
                    />

                    <span className="text-sm text-muted-foreground" data-oid="_exfnh_">
                      x
                    </span>
                    <Slider
                      value={[settings.customSpeed]}
                      onValueChange={([value]) => setSettings((prev) => ({ ...prev, customSpeed: value }))}
                      max={10}
                      min={0.1}
                      step={0.1}
                      className="flex-1"
                      data-oid="4:s6.k0"
                    />
                  </div>
                </div>

                {/* Сохранять тональность */}
                <div className="flex items-center space-x-2" data-oid="9fd28lq">
                  <Checkbox
                    id="preserve-pitch-basic"
                    checked={settings.preservePitch}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        preservePitch: !!checked,
                      }))
                    }
                    data-oid="08-6m_z"
                  />

                  <Label htmlFor="preserve-pitch-basic" className="text-sm text-foreground/90" data-oid="iw.n8s3">
                    {t("options.speed.preservePitch", "Preserve pitch when changing speed")}
                  </Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Speed Ramping */}
          <Collapsible
            open={openSections.speedRamping}
            onOpenChange={() => toggleSection("speedRamping")}
            data-oid="w:zaouq"
          >
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors"
              data-oid="hfv4mk6"
            >
              <div className="flex items-center gap-2" data-oid="lxivojv">
                <div className="w-2 h-2 rounded-full bg-green-400" data-oid="pv7qxui" />
                <Zap className="h-4 w-4 text-green-400" data-oid="n2ldo_0" />
                <h3 className="font-medium text-foreground" data-oid="7998j1i">
                  {t("options.speed.speedRamping", "Speed Ramping")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.speedRamping ? "rotate-180" : ""}`}
                data-oid="tp03iq9"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3" data-oid="uc0lax7">
              <div className="bg-card rounded-lg border border-border p-4 space-y-4" data-oid="-t7871b">
                {/* Speed Ramping пресеты */}
                <div className="space-y-3" data-oid="ooj-uc9">
                  <Label className="text-sm font-medium text-foreground/90" data-oid="r185h3j">
                    {t("options.speed.rampingPresets", "Ramping Presets")}
                  </Label>
                  <div className="grid grid-cols-2 gap-2" data-oid="q4okfzh">
                    {SPEED_RAMPING_PRESETS.map((preset) => (
                      <Button
                        key={preset.id}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs justify-start"
                        onClick={() => handleApplySpeedRampingPreset(preset.id)}
                        data-oid="zc-5ags"
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Визуальный редактор кривой скорости */}
                <div className="space-y-2" data-oid="h11o40e">
                  <Label className="text-sm font-medium text-foreground/90" data-oid="rm:popl">
                    {t("options.speed.speedCurve", "Speed Curve")}
                  </Label>
                  <div
                    className="bg-background rounded border border-border p-2 h-32 flex items-center justify-center"
                    data-oid="urro-as"
                  >
                    {currentClip ? (
                      <div className="text-center text-muted-foreground" data-oid="okym_ec">
                        <div className="text-sm" data-oid="-nc4exl">
                          Speed Curve Editor
                        </div>
                        <div className="text-xs mt-1" data-oid="jzljxgu">
                          Clip: {currentClip.name}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground/70" data-oid="qpzqh5_">
                        <div className="text-sm" data-oid="4ld.c5w">
                          Select a clip to edit speed curve
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Настройки Speed Ramping */}
                <div className="flex items-center space-x-2" data-oid="d9x5ihe">
                  <Checkbox
                    id="maintain-duration"
                    checked={settings.autoKeyframes}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        autoKeyframes: !!checked,
                      }))
                    }
                    data-oid="x_nh5w1"
                  />

                  <Label htmlFor="maintain-duration" className="text-sm text-foreground/90" data-oid="-tj5yef">
                    {t("options.speed.maintainDuration", "Maintain clip duration")}
                  </Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Интерполяция кадров */}
          <Collapsible
            open={openSections.interpolation}
            onOpenChange={() => toggleSection("interpolation")}
            data-oid="9edzy4e"
          >
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors"
              data-oid="4x0eit0"
            >
              <div className="flex items-center gap-2" data-oid="5oqrwb4">
                <div className="w-2 h-2 rounded-full bg-yellow-400" data-oid="ku9eoxh" />
                <Gauge className="h-4 w-4 text-yellow-400" data-oid="5qnuf98" />
                <h3 className="font-medium text-foreground" data-oid="j_:g3_w">
                  {t("options.speed.frameInterpolation", "Frame Interpolation")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.interpolation ? "rotate-180" : ""}`}
                data-oid="wqv0fil"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3" data-oid="y7z8_o.">
              <div className="bg-card rounded-lg border border-border p-4 space-y-4" data-oid="8q_drxe">
                {/* Метод интерполяции */}
                <div className="space-y-2" data-oid="5tm23o:">
                  <Label className="text-sm font-medium text-foreground/90" data-oid="-1ev8xb">
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
                    data-oid="5gb_17y"
                  >
                    <SelectTrigger className="h-8" data-oid="adj8psl">
                      <SelectValue data-oid="q5x-ma7" />
                    </SelectTrigger>
                    <SelectContent data-oid="x19h4oj">
                      {INTERPOLATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} data-oid="y7vs7n-">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Motion Blur */}
                <div className="space-y-2" data-oid="-98zhdg">
                  <Label className="text-sm font-medium text-foreground/90" data-oid="889utb2">
                    {t("options.speed.motionBlurTitle", "Motion Blur")}
                  </Label>
                  <Select
                    value={settings.motionBlur}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, motionBlur: value }))}
                    data-oid="vxuwgq4"
                  >
                    <SelectTrigger className="h-8" data-oid="kyc7ztf">
                      <SelectValue data-oid="93knakp" />
                    </SelectTrigger>
                    <SelectContent data-oid="zghgncr">
                      {MOTION_BLUR_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} data-oid="zejdpsc">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Плавное воспроизведение */}
                <div className="space-y-3" data-oid="3gbsq8a">
                  <div className="flex items-center space-x-2" data-oid="cvxe_mz">
                    <Checkbox
                      id="smooth-playback"
                      checked={settings.smoothPlayback}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          smoothPlayback: !!checked,
                        }))
                      }
                      data-oid="jaf4r58"
                    />

                    <Label htmlFor="smooth-playback" className="text-sm text-foreground/90" data-oid="tp7bg7t">
                      {t("options.speed.smoothPlayback", "Smooth Playback")}
                    </Label>
                  </div>

                  {settings.smoothPlayback && (
                    <div className="space-y-2" data-oid="gcice-i">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="09of06_">
                        {t("options.speed.smoothnessLevel", "Smoothness Level")}
                      </Label>
                      <div className="space-y-2" data-oid="av2j1ex">
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
                          data-oid="ybhfvca"
                        />

                        <div className="flex justify-between text-xs text-muted-foreground" data-oid="kpycot9">
                          <span data-oid="uv4dr0x">{t("options.speed.performance", "Performance")}</span>
                          <span data-oid="x83ux5:">{settings.smoothnessLevel}%</span>
                          <span data-oid="do_:b_p">{t("options.speed.quality", "Quality")}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Дополнительные настройки */}
          <Collapsible open={openSections.advanced} onOpenChange={() => toggleSection("advanced")} data-oid="7spwpgw">
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors"
              data-oid="nuk.gsp"
            >
              <div className="flex items-center gap-2" data-oid="f-:31oa">
                <div className="w-2 h-2 rounded-full bg-purple-400" data-oid="clauqu2" />
                <Settings className="h-4 w-4 text-purple-400" data-oid=".k3:t5v" />
                <h3 className="font-medium text-foreground" data-oid="sj:g.h4">
                  {t("options.speed.advanced", "Advanced Settings")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.advanced ? "rotate-180" : ""}`}
                data-oid=":0ikday"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3" data-oid="cmyh.oj">
              <div className="bg-card rounded-lg border border-border p-4 space-y-4" data-oid="_z_i27p">
                {/* Автоматические ключевые кадры */}
                <div className="flex items-center space-x-2" data-oid="j89uws5">
                  <Checkbox
                    id="auto-keyframes"
                    checked={settings.autoKeyframes}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        autoKeyframes: !!checked,
                      }))
                    }
                    data-oid="c8h_7-u"
                  />

                  <Label htmlFor="auto-keyframes" className="text-sm text-foreground/90" data-oid="x9xobpl">
                    {t("options.speed.autoKeyframes", "Auto keyframes")}
                  </Label>
                </div>

                {/* Максимальная скорость */}
                <div className="space-y-2" data-oid="4ctuucs">
                  <Label className="text-sm font-medium text-foreground/90" data-oid="zuzma1v">
                    {t("options.speed.maxSpeed", "Maximum Speed")}
                  </Label>
                  <div className="flex items-center space-x-3" data-oid="02z1t4t">
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
                      data-oid="isnu2ju"
                    />

                    <span className="text-sm text-muted-foreground" data-oid="fi8tx-h">
                      x
                    </span>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Нижняя панель с кнопками */}
      <div className="shrink-0 bg-card border-t border-border p-3" data-oid="g8fd9uq">
        <div className="flex items-center justify-between" data-oid="t_zov65">
          <div className="flex items-center gap-2" data-oid="t6.nqwh">
            {/* Пресеты */}
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" data-oid="3qa7f_8">
              {t("options.speed.presetsButton", "Presets")}
            </Button>
          </div>
          <div className="flex items-center gap-2" data-oid="4.db3uz">
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={handleReset} data-oid="4avuo1h">
              {t("common.reset", "Reset")}
            </Button>
            <Button size="sm" className="h-8 px-3 text-xs" onClick={handleApply} data-oid="dwstsf3">
              {t("common.apply", "Apply")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useId, useState } from "react"

import { useTranslation } from "react-i18next"

import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface ReverbProps {
  onParameterChange?: (param: keyof ReverbSettings, value: number) => void
  className?: string
}

export interface ReverbSettings {
  roomSize: number // 0 to 100 (small to large)
  decay: number // 0.1 to 10 seconds
  damping: number // 0 to 100 (bright to dark)
  predelay: number // 0 to 200 ms
  wetLevel: number // 0 to 100 %
  dryLevel: number // 0 to 100 %
  earlyLevel: number // 0 to 100 %
  lateLevel: number // 0 to 100 %
}

const DEFAULT_SETTINGS: ReverbSettings = {
  roomSize: 50,
  decay: 2,
  damping: 50,
  predelay: 20,
  wetLevel: 30,
  dryLevel: 70,
  earlyLevel: 80,
  lateLevel: 80,
}

export function Reverb({ onParameterChange, className }: ReverbProps) {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<ReverbSettings>(DEFAULT_SETTINGS)

  const handleParameterChange = (param: keyof ReverbSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [param]: value }))
    onParameterChange?.(param, value)
  }

  const reset = () => {
    setSettings(DEFAULT_SETTINGS)
    Object.entries(DEFAULT_SETTINGS).forEach(([param, value]) => {
      onParameterChange?.(param as keyof ReverbSettings, value)
    })
  }

  const id = useId()

  return (
    <div className={cn("bg-zinc-900 rounded-lg p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-300">{t("fairlightAudio.effects.reverb.title")}</h3>
        <button onClick={reset} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          {t("fairlightAudio.effects.reverb.reset")}
        </button>
      </div>

      {/* Visual Display */}
      <div className="relative h-24 bg-zinc-950 rounded p-2">
        <svg className="w-full h-full" viewBox="0 0 200 80">
          {/* Early reflections */}
          <g className="text-blue-400" opacity={settings.earlyLevel / 100}>
            <line x1="10" y1="40" x2="10" y2={40 - settings.earlyLevel * 0.3} stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="40" x2="20" y2={40 - settings.earlyLevel * 0.25} stroke="currentColor" strokeWidth="2" />
            <line x1="28" y1="40" x2="28" y2={40 - settings.earlyLevel * 0.2} stroke="currentColor" strokeWidth="2" />
            <line x1="34" y1="40" x2="34" y2={40 - settings.earlyLevel * 0.15} stroke="currentColor" strokeWidth="2" />
          </g>

          {/* Late reflections (tail) */}
          <path d={generateReverbTail(settings)} fill="url(#reverbGradient)" opacity={settings.lateLevel / 100} />

          {/* Gradient definition */}
          <defs>
            <linearGradient id={`${id}-reverbGradient`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset={`${Math.min(95, settings.decay * 20)}%`} stopColor="#3b82f6" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Time markers */}
          <g className="text-zinc-700 text-xs">
            <text x="10" y="75" fill="currentColor" fontSize="8">
              0
            </text>
            <text x="50" y="75" fill="currentColor" fontSize="8">
              {settings.predelay.toFixed(0)}ms
            </text>
            <text x="150" y="75" fill="currentColor" fontSize="8">
              {(settings.decay * 1000).toFixed(0)}ms
            </text>
          </g>
        </svg>
      </div>

      {/* Main Controls */}
      <div className="grid grid-cols-2 gap-4">
        {/* Room Size */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">{t("fairlightAudio.effects.reverb.roomSize")}</span>
            <span className="text-zinc-500">{settings.roomSize.toFixed(0)}%</span>
          </div>
          <Slider
            value={[settings.roomSize]}
            onValueChange={([value]) => handleParameterChange("roomSize", value)}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Decay Time */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">{t("fairlightAudio.effects.reverb.decay")}</span>
            <span className="text-zinc-500">{settings.decay.toFixed(1)}s</span>
          </div>
          <Slider
            value={[settings.decay]}
            onValueChange={([value]) => handleParameterChange("decay", value)}
            min={0.1}
            max={10}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Damping */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">{t("fairlightAudio.effects.reverb.damping")}</span>
            <span className="text-zinc-500">{settings.damping.toFixed(0)}%</span>
          </div>
          <Slider
            value={[settings.damping]}
            onValueChange={([value]) => handleParameterChange("damping", value)}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Pre-delay */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">{t("fairlightAudio.effects.reverb.preDelay")}</span>
            <span className="text-zinc-500">{settings.predelay.toFixed(0)}ms</span>
          </div>
          <Slider
            value={[settings.predelay]}
            onValueChange={([value]) => handleParameterChange("predelay", value)}
            min={0}
            max={200}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Mix Controls */}
      <div className="space-y-2 pt-2 border-t border-zinc-800">
        <div className="text-xs text-zinc-400 mb-2">{t("fairlightAudio.effects.reverb.mixLevels")}</div>

        <div className="grid grid-cols-2 gap-4">
          {/* Dry Level */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{t("fairlightAudio.effects.reverb.dry")}</span>
              <span className="text-zinc-500">{settings.dryLevel.toFixed(0)}%</span>
            </div>
            <Slider
              value={[settings.dryLevel]}
              onValueChange={([value]) => handleParameterChange("dryLevel", value)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Wet Level */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{t("fairlightAudio.effects.reverb.wet")}</span>
              <span className="text-zinc-500">{settings.wetLevel.toFixed(0)}%</span>
            </div>
            <Slider
              value={[settings.wetLevel]}
              onValueChange={([value]) => handleParameterChange("wetLevel", value)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Early Reflections */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{t("fairlightAudio.effects.reverb.early")}</span>
              <span className="text-zinc-500">{settings.earlyLevel.toFixed(0)}%</span>
            </div>
            <Slider
              value={[settings.earlyLevel]}
              onValueChange={([value]) => handleParameterChange("earlyLevel", value)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Late Reflections */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{t("fairlightAudio.effects.reverb.late")}</span>
              <span className="text-zinc-500">{settings.lateLevel.toFixed(0)}%</span>
            </div>
            <Slider
              value={[settings.lateLevel]}
              onValueChange={([value]) => handleParameterChange("lateLevel", value)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => applyPreset("room")}
          className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
        >
          {t("fairlightAudio.effects.reverb.presets.room")}
        </button>
        <button
          onClick={() => applyPreset("hall")}
          className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
        >
          {t("fairlightAudio.effects.reverb.presets.hall")}
        </button>
        <button
          onClick={() => applyPreset("plate")}
          className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
        >
          {t("fairlightAudio.effects.reverb.presets.plate")}
        </button>
        <button
          onClick={() => applyPreset("spring")}
          className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
        >
          {t("fairlightAudio.effects.reverb.presets.spring")}
        </button>
        <button
          onClick={() => applyPreset("cathedral")}
          className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
        >
          {t("fairlightAudio.effects.reverb.presets.cathedral")}
        </button>
      </div>
    </div>
  )

  function applyPreset(preset: string) {
    let newSettings: ReverbSettings

    switch (preset) {
      case "room":
        newSettings = {
          roomSize: 30,
          decay: 0.8,
          damping: 70,
          predelay: 10,
          wetLevel: 20,
          dryLevel: 80,
          earlyLevel: 90,
          lateLevel: 60,
        }
        break
      case "hall":
        newSettings = {
          roomSize: 70,
          decay: 2.5,
          damping: 50,
          predelay: 25,
          wetLevel: 35,
          dryLevel: 65,
          earlyLevel: 70,
          lateLevel: 90,
        }
        break
      case "plate":
        newSettings = {
          roomSize: 50,
          decay: 1.5,
          damping: 80,
          predelay: 0,
          wetLevel: 40,
          dryLevel: 60,
          earlyLevel: 50,
          lateLevel: 100,
        }
        break
      case "spring":
        newSettings = {
          roomSize: 20,
          decay: 2,
          damping: 30,
          predelay: 0,
          wetLevel: 30,
          dryLevel: 70,
          earlyLevel: 100,
          lateLevel: 80,
        }
        break
      case "cathedral":
        newSettings = {
          roomSize: 100,
          decay: 6,
          damping: 40,
          predelay: 50,
          wetLevel: 45,
          dryLevel: 55,
          earlyLevel: 60,
          lateLevel: 100,
        }
        break
      default:
        newSettings = DEFAULT_SETTINGS
    }

    setSettings(newSettings)
    Object.entries(newSettings).forEach(([param, value]) => {
      onParameterChange?.(param as keyof ReverbSettings, value)
    })
  }
}

function generateReverbTail(settings: ReverbSettings): string {
  const startX = 40 + settings.predelay * 0.5
  const width = Math.min(150, settings.decay * 30)
  const height = 30

  return `
    M ${startX} 40
    L ${startX} ${40 - height}
    Q ${startX + width * 0.2} ${40 - height * 0.8} ${startX + width * 0.5} ${40 - height * 0.4}
    Q ${startX + width * 0.8} ${40 - height * 0.1} ${startX + width} 40
    Z
  `
}

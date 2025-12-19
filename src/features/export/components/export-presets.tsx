/**
 * ExportPresets Component
 *
 * Компонент для выбора пресетов экспорта видео.
 * Предоставляет готовые настройки для популярных платформ и форматов.
 */

import { Cpu, FileVideo, Film, HardDrive, Play, Settings2 } from "lucide-react"
import type React from "react"

import { cn } from "@/lib/utils"

// Иконка TikTok
const TikTokIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" data-oid="v6v6hge">
    <path
      d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.37 6.37 0 0 0-1-.09A6.35 6.35 0 0 0 3 15.64 6.35 6.35 0 0 0 9.37 22a6.35 6.35 0 0 0 6.35-6.35V8.44a8.28 8.28 0 0 0 4.83 1.52V6.69h-.96z"
      data-oid="8uwvrev"
    />
  </svg>
)

// Иконка Vimeo
const VimeoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" data-oid="-_8ucdy">
    <path
      d="M22.875 10.063c-.102 2.236-1.666 5.299-4.693 9.188C15.078 23.25 12.484 24 10.451 24c-1.254 0-2.313-.665-3.174-1.996l-1.738-6.373c-.644-2.343-1.336-3.514-2.074-3.514-.161 0-.725.339-1.693 1.016L0 11.004c1.065-.937 2.115-1.873 3.15-2.81C4.589 6.86 5.653 6.162 6.34 6.1c1.76-.17 2.844.704 3.252 2.622.44 2.071.745 3.36.915 3.867.509 2.31 1.067 3.464 1.675 3.464.473 0 1.184-.748 2.133-2.244.947-1.495 1.455-2.633 1.522-3.414.135-1.291-.372-1.937-1.522-1.937-.542 0-1.101.124-1.676.371 1.113-3.645 3.239-5.415 6.378-5.309 2.327.07 3.425 1.576 3.294 4.518z"
      data-oid="9rtrjra"
    />
  </svg>
)

export interface ExportPreset {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  settings: {
    format: "mp4" | "mov" | "webm" | "quicktime"
    codec: "h264" | "h265" | "prores" | "vp8" | "vp9"
    codecProfile?: "main" | "main10" | "high"
    resolution: "720" | "1080" | "1440" | "2160" | "timeline"
    fps: "24" | "25" | "30" | "60" | "timeline"
    bitrate?: number
    bitrateMode?: "auto" | "cbr" | "vbr"
    useVerticalResolution?: boolean
    normalizeAudio?: boolean
    audioTarget?: number // LKFS
    uploadDirectly?: boolean
    optimizeForSpeed?: boolean
    useHardwareAcceleration?: boolean
  }
}

const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: "custom",
    name: "Custom Export",
    icon: <Settings2 className="h-4 w-4" data-oid="gdol20v" />,
    description: "Настройте параметры экспорта вручную",
    settings: {
      format: "mp4",
      codec: "h264",
      resolution: "timeline",
      fps: "timeline",
    },
  },
  {
    id: "h264-master",
    name: "H.264 Master",
    icon: <FileVideo className="h-4 w-4" data-oid="yp-64z4" />,
    description: "Высокое качество H.264 для архива",
    settings: {
      format: "mp4",
      codec: "h264",
      codecProfile: "high",
      resolution: "timeline",
      fps: "timeline",
      bitrateMode: "cbr",
      bitrate: 80000,
      useHardwareAcceleration: true,
    },
  },
  {
    id: "hyperdeck",
    name: "HyperDeck",
    icon: <HardDrive className="h-4 w-4" data-oid=":6h5fe2" />,
    description: "Формат для Blackmagic HyperDeck",
    settings: {
      format: "mov",
      codec: "h264",
      codecProfile: "main",
      resolution: "timeline",
      fps: "timeline",
      bitrateMode: "cbr",
      bitrate: 50000,
    },
  },
  {
    id: "h265-master",
    name: "H.265 Master",
    icon: <Cpu className="h-4 w-4" data-oid="-y8vbak" />,
    description: "Высокое качество H.265/HEVC",
    settings: {
      format: "mp4",
      codec: "h265",
      codecProfile: "main10",
      resolution: "timeline",
      fps: "timeline",
      bitrateMode: "vbr",
      bitrate: 60000,
      optimizeForSpeed: true,
      useHardwareAcceleration: true,
    },
  },
  {
    id: "prores",
    name: "ProRes 422 HQ",
    icon: <Film className="h-4 w-4" data-oid="wuwve_5" />,
    description: "Apple ProRes для профессионального монтажа",
    settings: {
      format: "quicktime",
      codec: "prores",
      resolution: "timeline",
      fps: "timeline",
    },
  },
  {
    id: "youtube",
    name: "YouTube 1080p",
    icon: <Play className="h-4 w-4" data-oid="n6lffyi" />,
    description: "Оптимизировано для YouTube",
    settings: {
      format: "mp4",
      codec: "h264",
      codecProfile: "high",
      resolution: "1080",
      fps: "timeline",
      bitrateMode: "vbr",
      bitrate: 12000,
      normalizeAudio: true,
      audioTarget: -14, // YouTube рекомендует -14 LKFS
      uploadDirectly: true,
    },
  },
  {
    id: "vimeo",
    name: "Vimeo 1080p",
    icon: <VimeoIcon data-oid="a7q0b_6" />,
    description: "Высокое качество для Vimeo",
    settings: {
      format: "mp4",
      codec: "h264",
      codecProfile: "high",
      resolution: "1080",
      fps: "timeline",
      bitrateMode: "vbr",
      bitrate: 20000,
      useHardwareAcceleration: true,
    },
  },
  {
    id: "tiktok",
    name: "TikTok 1080p",
    icon: <TikTokIcon data-oid="ru5gygl" />,
    description: "Вертикальное видео для TikTok",
    settings: {
      format: "mp4",
      codec: "h264",
      codecProfile: "main",
      resolution: "1080",
      fps: "30",
      bitrateMode: "auto",
      useVerticalResolution: true,
      uploadDirectly: true,
    },
  },
]

interface ExportPresetsProps {
  selectedPresetId: string
  onSelectPreset: (preset: ExportPreset) => void
  className?: string
}

export function ExportPresets({ selectedPresetId, onSelectPreset, className }: ExportPresetsProps) {
  return (
    <div className={cn("flex gap-2 p-4 border-b overflow-x-auto", className)} data-oid="o.1adj1">
      {EXPORT_PRESETS.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onSelectPreset(preset)}
          className={cn(
            "flex flex-col items-center gap-2 px-4 py-3 rounded-lg",
            "border transition-all duration-200",
            "hover:bg-accent hover:border-accent-foreground/20",
            "focus:outline-none focus:ring-2 focus:ring-primary",
            "min-w-[100px]",
            selectedPresetId === preset.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border",
          )}
          data-oid="57hjv76"
        >
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full",
              selectedPresetId === preset.id ? "bg-primary-foreground/20" : "bg-muted",
            )}
            data-oid="onnbbgv"
          >
            {preset.icon}
          </div>
          <span className="text-xs font-medium whitespace-nowrap" data-oid="kgx.i5t">
            {preset.name}
          </span>
        </button>
      ))}
    </div>
  )
}

// Экспортируем пресеты для использования в других компонентах
export { EXPORT_PRESETS }

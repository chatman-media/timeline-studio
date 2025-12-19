import { Gauge } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { usePlayerSpeedRamping } from "../hooks/use-player-speed-ramping"

// Предустановленные значения скорости для быстрого доступа во время воспроизведения
const PLAYBACK_SPEEDS = [
  { label: "0.25x", value: 0.25 },
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "1x", value: 1.0 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
  { label: "2x", value: 2.0 },
]

/**
 * Компонент для управления скоростью воспроизведения в реальном времени
 * Для расширенных настроек скорости используйте панель Options
 */
export function PlaybackSpeedControl() {
  const { t } = useTranslation()
  const { currentPlaybackRate, updatePlaybackRate } = usePlayerSpeedRamping()

  const handleSpeedChange = (speed: number) => {
    updatePlaybackRate(speed)
  }

  // Форматирование отображения скорости
  const formatSpeed = (speed: number) => {
    if (speed === 1) return t("timeline.speed.normal", "Normal")
    return `${speed}x`
  }

  return (
    <DropdownMenu data-oid="n361k8:">
      <DropdownMenuTrigger asChild data-oid="jqf5cb7">
        <Button
          className="h-8 cursor-pointer gap-1 min-w-[60px]"
          variant="ghost"
          size="sm"
          title={t("timeline.controls.playbackSpeed", "Playback speed")}
          data-oid="avf.ncd"
        >
          <Gauge className="h-4 w-4" data-oid="nq0a.cj" />
          <span className="text-xs" data-oid="k:nq4ee">
            {formatSpeed(currentPlaybackRate)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-[120px]" data-oid="z0ost75">
        {PLAYBACK_SPEEDS.map((speed) => (
          <DropdownMenuItem
            key={speed.value}
            onClick={() => handleSpeedChange(speed.value)}
            className={currentPlaybackRate === speed.value ? "bg-accent" : ""}
            data-oid="xfke8m5"
          >
            <span className="text-sm" data-oid="-xhm0g8">
              {speed.label}
            </span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator data-oid="v:myeg2" />

        <DropdownMenuItem className="text-xs text-muted-foreground" disabled data-oid="mzsj2on">
          {t("timeline.speed.advancedOptions", "For advanced options use Options panel")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

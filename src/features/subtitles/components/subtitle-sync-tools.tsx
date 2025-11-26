import { Clock, Minus, Plus, RotateCcw } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useNotifications } from "@/domains/system-integration"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { useTracks } from "@/features/timeline/hooks/use-tracks"
import type { TrackType } from "@/features/timeline/types"
import { createLogger } from "@/lib/tauri-logger"
import type { SubtitleClip } from "../types/subtitles"

const logger = createLogger("SubtitleSyncTools")

/**
 * Инструменты синхронизации субтитров
 * Позволяет сдвигать время субтитров и выполнять массовые операции
 */
export function SubtitleSyncTools() {
  const { t } = useTranslation()
  const { tracks } = useTracks()
  const { updateClip } = useTimeline()
  const { showSuccess, showError } = useNotifications()

  const [timeOffset, setTimeOffset] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  /**
   * Проверяет, является ли клип субтитром
   */
  const isSubtitleClip = (clip: any): clip is SubtitleClip => {
    return (
      clip.type === "subtitle" &&
      typeof clip.text === "string" &&
      typeof clip.startTime === "number" &&
      typeof clip.duration === "number"
    )
  }

  /**
   * Получает все субтитры из таймлайна
   */
  const getSubtitlesFromTimeline = (): SubtitleClip[] => {
    const subtitles: SubtitleClip[] = []
    const subtitleType: TrackType = "subtitle"

    for (const track of tracks) {
      if (track.type === subtitleType) {
        for (const clip of track.clips) {
          if (isSubtitleClip(clip)) {
            subtitles.push(clip)
          }
        }
      }
    }

    return subtitles
  }

  /**
   * Применяет временной сдвиг ко всем субтитрам
   */
  const applyTimeOffset = async () => {
    if (timeOffset === 0) return

    const subtitles = getSubtitlesFromTimeline()
    if (subtitles.length === 0) {
      showError(
        t("subtitles.sync.noSubtitles", "Нет субтитров"),
        t("subtitles.sync.noSubtitlesDesc", "На таймлайне нет субтитров для синхронизации"),
      )
      return
    }

    try {
      let updatedCount = 0

      for (const subtitle of subtitles) {
        const newStartTime = Math.max(0, Number(subtitle.startTime || 0) + Number(timeOffset || 0))

        void updateClip(subtitle.id, {
          startTime: newStartTime,
        })

        updatedCount++
      }

      showSuccess(
        t("subtitles.sync.success", "Синхронизация выполнена"),
        t("subtitles.sync.successDesc", "Обновлено {{count}} субтитров", { count: updatedCount }),
      )

      setIsOpen(false)
      setTimeOffset(0)
    } catch (error) {
      logger.error("Ошибка при синхронизации субтитров:", { error })
      showError(
        t("subtitles.sync.error", "Ошибка синхронизации"),
        t("subtitles.sync.errorDesc", "Не удалось синхронизировать субтитры"),
      )
    }
  }

  /**
   * Сбрасывает временной сдвиг
   */
  const resetOffset = () => {
    setTimeOffset(0)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="mr-2 h-4 w-4" />
          {t("subtitles.sync.title", "Синхронизация")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-medium">{t("subtitles.sync.adjustTiming", "Настройка времени")}</h4>
            <p className="text-sm text-muted-foreground">
              {t("subtitles.sync.adjustDesc", "Сдвинуть все субтитры на указанное время")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time-offset">{t("subtitles.sync.timeOffset", "Временной сдвиг (секунды)")}</Label>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={() => setTimeOffset((prev) => prev - 0.1)}>
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="time-offset"
                type="number"
                value={timeOffset}
                onChange={(e) => setTimeOffset(Number.parseFloat(e.target.value) || 0)}
                step={0.1}
                className="text-center"
              />
              <Button size="icon" variant="outline" onClick={() => setTimeOffset((prev) => prev + 0.1)}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={resetOffset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {timeOffset > 0 &&
              t("subtitles.sync.shiftForward", "Субтитры будут сдвинуты вперед на {{time}}с", {
                time: timeOffset.toFixed(1),
              })}
            {timeOffset < 0 &&
              t("subtitles.sync.shiftBackward", "Субтитры будут сдвинуты назад на {{time}}с", {
                time: Math.abs(timeOffset).toFixed(1),
              })}
            {timeOffset === 0 && t("subtitles.sync.noShift", "Субтитры не будут сдвинуты")}
          </div>

          <Button onClick={applyTimeOffset} disabled={timeOffset === 0} className="w-full">
            {t("subtitles.sync.apply", "Применить")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

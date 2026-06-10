import { Clock, Minus, Plus, RotateCcw } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@timeline-studio/ui/components/button"
import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { Popover, PopoverContent, PopoverTrigger } from "@timeline-studio/ui/components/popover"
import { useNotifications } from "@timeline-studio/core/hooks"
import { useTimeline } from "@/features/timeline/hooks/state/use-timeline"
import { useTracks } from "@/features/timeline/hooks/state/use-tracks"
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
        t("subtitles.sync.successDesc", "Обновлено {{count}} субтитров", {
          count: updatedCount,
        }),
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
    <Popover open={isOpen} onOpenChange={setIsOpen} data-oid="05mmbfm">
      <PopoverTrigger asChild data-oid="n80x6yu">
        <Button variant="outline" size="sm" data-oid=".q7ts3f">
          <Clock className="mr-2 h-4 w-4" data-oid="7db:.yq" />
          {t("subtitles.sync.title", "Синхронизация")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" data-oid="5kpe8o0">
        <div className="space-y-4" data-oid="d59.s:v">
          <div data-oid=".0yiiw0">
            <h4 className="mb-2 font-medium" data-oid="ls:fsh6">
              {t("subtitles.sync.adjustTiming", "Настройка времени")}
            </h4>
            <p className="text-sm text-muted-foreground" data-oid="r0q2g4m">
              {t("subtitles.sync.adjustDesc", "Сдвинуть все субтитры на указанное время")}
            </p>
          </div>

          <div className="space-y-2" data-oid="qv_igo7">
            <Label htmlFor="time-offset" data-oid="w2lv78e">
              {t("subtitles.sync.timeOffset", "Временной сдвиг (секунды)")}
            </Label>
            <div className="flex items-center gap-2" data-oid="j_:5j:k">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setTimeOffset((prev) => prev - 0.1)}
                data-oid="ev-ytno"
              >
                <Minus className="h-4 w-4" data-oid="9iqec:k" />
              </Button>
              <Input
                id="time-offset"
                type="number"
                value={timeOffset}
                onChange={(e) => setTimeOffset(Number.parseFloat(e.target.value) || 0)}
                step={0.1}
                className="text-center"
                data-oid="f_z--79"
              />

              <Button
                size="icon"
                variant="outline"
                onClick={() => setTimeOffset((prev) => prev + 0.1)}
                data-oid="hkjlan4"
              >
                <Plus className="h-4 w-4" data-oid="1xq060r" />
              </Button>
              <Button size="icon" variant="ghost" onClick={resetOffset} data-oid="2jarp8n">
                <RotateCcw className="h-4 w-4" data-oid="00h..:d" />
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground" data-oid="9m6fuxq">
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

          <Button onClick={applyTimeOffset} disabled={timeOffset === 0} className="w-full" data-oid="hlewt_y">
            {t("subtitles.sync.apply", "Применить")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

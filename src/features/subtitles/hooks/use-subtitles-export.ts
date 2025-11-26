import { save } from "@tauri-apps/plugin-dialog"
import { useCallback, useState } from "react"
import { toast } from "sonner"

import { SubtitlesService } from "@/domains/video-editing/services/subtitles"
import { useTracks } from "@/features/timeline/hooks/use-tracks"
import type { TrackType } from "@/features/timeline/types"
import { createLogger } from "@/lib/tauri-logger"
import type { SubtitleClip } from "../types/subtitles"
import { exportSubtitles, getSubtitleFileExtension } from "../utils/subtitle-exporters"

const logger = createLogger("UseSubtitlesExport")

/**
 * Хук для экспорта субтитров в различные форматы
 */
export function useSubtitlesExport() {
  const [isExporting, setIsExporting] = useState(false)
  const { tracks } = useTracks()
  // toast импортирован напрямую из sonner

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
  const getSubtitlesFromTimeline = useCallback((): SubtitleClip[] => {
    const subtitles: SubtitleClip[] = []

    // Проходим по всем трекам и собираем субтитры
    for (const track of tracks) {
      const subtitleType: TrackType = "subtitle"
      if (track.type === subtitleType) {
        for (const clip of track.clips) {
          if (isSubtitleClip(clip)) {
            subtitles.push(clip)
          }
        }
      }
    }

    // Сортируем по времени начала
    return subtitles.sort((a, b) => a.startTime - b.startTime)
  }, [tracks])

  /**
   * Экспортирует субтитры в выбранный формат
   */
  const exportSubtitleFile = useCallback(
    async (format: "srt" | "vtt" | "ass" = "srt", subtitles?: SubtitleClip[]) => {
      if (isExporting) return

      setIsExporting(true)
      try {
        // Получаем субтитры если не переданы
        const subtitlesToExport = subtitles || getSubtitlesFromTimeline()

        if (subtitlesToExport.length === 0) {
          toast.error("Нет субтитров", {
            description: "На таймлайне нет субтитров для экспорта",
          })
          return
        }

        // Выбираем путь для сохранения
        const extension = getSubtitleFileExtension(format)
        const filePath = await save({
          filters: [
            {
              name: `${format.toUpperCase()} Subtitles`,
              extensions: [extension],
            },
          ],
          defaultPath: `subtitles.${extension}`,
        })

        if (!filePath) return

        // Экспортируем субтитры
        const content = exportSubtitles(subtitlesToExport, format)

        // Сохраняем файл через сервис
        await SubtitlesService.saveSubtitleFile({
          format,
          content,
          output_path: filePath,
        })

        toast.success("Субтитры экспортированы", {
          description: `Экспортировано ${subtitlesToExport.length} субтитров в формате ${format.toUpperCase()}`,
        })
      } catch (error) {
        logger.error("Ошибка при экспорте субтитров:", { error })
        toast.error("Ошибка экспорта", {
          description: "Не удалось экспортировать субтитры",
        })
      } finally {
        setIsExporting(false)
      }
    },
    [isExporting, getSubtitlesFromTimeline],
  )

  /**
   * Экспортирует выбранные субтитры
   */
  const exportSelectedSubtitles = useCallback(
    async (selectedIds: string[], format: "srt" | "vtt" | "ass" = "srt") => {
      const allSubtitles = getSubtitlesFromTimeline()
      const selectedSubtitles = allSubtitles.filter((sub) => selectedIds.includes(sub.id))

      if (selectedSubtitles.length === 0) {
        toast.error("Нет выбранных субтитров", {
          description: "Выберите субтитры для экспорта",
        })
        return
      }

      await exportSubtitleFile(format, selectedSubtitles)
    },
    [getSubtitlesFromTimeline, exportSubtitleFile],
  )

  /**
   * Экспортирует субтитры из диапазона времени
   */
  const exportSubtitlesByTimeRange = useCallback(
    async (startTime: number, endTime: number, format: "srt" | "vtt" | "ass" = "srt") => {
      const allSubtitles = getSubtitlesFromTimeline()
      const rangeSubtitles = allSubtitles.filter((sub) => sub.startTime >= startTime && sub.startTime <= endTime)

      if (rangeSubtitles.length === 0) {
        toast.error("Нет субтитров в диапазоне", {
          description: "В указанном временном диапазоне нет субтитров",
        })
        return
      }

      await exportSubtitleFile(format, rangeSubtitles)
    },
    [getSubtitlesFromTimeline, exportSubtitleFile],
  )

  return {
    exportSubtitleFile,
    exportSelectedSubtitles,
    exportSubtitlesByTimeRange,
    getSubtitlesFromTimeline,
    isExporting,
  }
}

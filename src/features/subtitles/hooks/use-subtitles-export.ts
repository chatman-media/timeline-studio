import { useCallback, useMemo, useState } from "react"

import { container } from "@/core"
import { useNotifications } from "@/core/hooks"
import { subtitleService } from "@/domains/subtitles"
import { useTracks } from "@/features/timeline/hooks/state/use-tracks"
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
  const { showSuccess, showError } = useNotifications()
  const platform = useMemo(() => {
    try {
      return container.hasPlatform() ? container.getPlatform() : null
    } catch {
      return null
    }
  }, [])

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
          showError("Нет субтитров", "На таймлайне нет субтитров для экспорта")
          return
        }

        // Выбираем путь для сохранения
        if (!platform) {
          showError("Ошибка", "Platform service недоступен")
          return
        }

        const extension = getSubtitleFileExtension(format)
        const filePath = await platform.showSaveDialog({
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

        // Сохраняем файл через domain service
        await subtitleService.exportSubtitleFile({
          format,
          content,
          output_path: filePath,
        })

        showSuccess(
          "Субтитры экспортированы",
          `Экспортировано ${subtitlesToExport.length} субтитров в формате ${format.toUpperCase()}`,
        )
      } catch (error) {
        logger.error("Ошибка при экспорте субтитров:", { error })
        showError("Ошибка экспорта", "Не удалось экспортировать субтитры")
      } finally {
        setIsExporting(false)
      }
    },
    [isExporting, getSubtitlesFromTimeline, platform, showError],
  )

  /**
   * Экспортирует выбранные субтитры
   */
  const exportSelectedSubtitles = useCallback(
    async (selectedIds: string[], format: "srt" | "vtt" | "ass" = "srt") => {
      const allSubtitles = getSubtitlesFromTimeline()
      const selectedSubtitles = allSubtitles.filter((sub) => selectedIds.includes(sub.id))

      if (selectedSubtitles.length === 0) {
        showError("Нет выбранных субтитров", "Выберите субтитры для экспорта")
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
        showError("Нет субтитров в диапазоне", "В указанном временном диапазоне нет субтитров")
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

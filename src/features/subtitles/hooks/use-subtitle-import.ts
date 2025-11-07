/**
 * Хук для импорта субтитров в Timeline
 */

import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"
import { readTextFile } from "@tauri-apps/plugin-fs"
import { useCallback, useState } from "react"
import { type MediaFile as DomainMediaFile, MediaType } from "@/domains/video-editing/types/media"
import type { MediaFile } from "@/features/media/types/media"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import type { TrackType } from "@/features/timeline/types"
import { useToast } from "@/hooks/use-toast"
import { type LogContext, logError, logInfo } from "@/lib/tauri-logger"
import { generateId } from "@/lib/utils"
import type { SubtitleClip } from "../types/subtitles"
import {
  createSubtitleClip,
  detectSubtitleFormat,
  importSubtitles,
  validateSubtitles,
} from "../utils/subtitle-importers"

export interface UseSubtitleImportProps {
  trackId?: string
  onImportComplete?: (subtitles: SubtitleClip[]) => void
}

export function useSubtitleImport({ trackId, onImportComplete }: UseSubtitleImportProps = {}) {
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

  const { toast } = useToast()
  const { project, addTrack, addClip } = useTimeline()

  /**
   * Открывает диалог выбора файла и импортирует субтитры
   */
  const importFromFile = useCallback(async () => {
    logInfo("[useSubtitleImport] Начало импорта субтитров из файла")
    try {
      setIsImporting(true)
      setImportProgress(0)

      // Открываем диалог выбора файла
      const filePath = await open({
        multiple: false,
        filters: [
          {
            name: "Subtitle Files",
            extensions: ["srt", "vtt", "ass", "ssa"],
          },
          {
            name: "All Files",
            extensions: ["*"],
          },
        ],
      })

      if (!filePath) {
        setIsImporting(false)
        return
      }

      setImportProgress(10)

      // Читаем содержимое файла
      const content = await readTextFile(filePath)
      setImportProgress(30)

      // Определяем формат
      const format = detectSubtitleFormat(content)
      if (!format) {
        throw new Error("Не удалось определить формат файла субтитров")
      }

      setImportProgress(40)

      // Импортируем субтитры
      const subtitles = importSubtitles(content, format)
      setImportProgress(60)

      // Валидируем
      const validation = validateSubtitles(subtitles)
      if (!validation.valid) {
        const errorMessage = validation.errors.join("\n")
        throw new Error(`Ошибки валидации:\n${errorMessage}`)
      }

      setImportProgress(70)

      // Определяем трек для добавления
      let targetTrackId = trackId

      if (!targetTrackId) {
        // Ищем существующий трек субтитров
        const subtitleType: TrackType = "subtitle"
        const subtitleTrack = project?.globalTracks.find((track) => track.type === ("subtitle" as TrackType))

        if (subtitleTrack) {
          targetTrackId = subtitleTrack.id
        } else {
          // Создаем новый трек субтитров
          await addTrack("subtitle", "Субтитры")
          // После создания трека ищем его в обновленном проекте
          // Это упрощенное решение - в реальности нужно получить ID созданного трека
          const newTrackId = generateId()
          targetTrackId = newTrackId
        }
      }

      setImportProgress(80)

      if (!targetTrackId) {
        throw new Error("Не удалось определить трек для добавления субтитров")
      }

      // Добавляем субтитры на трек
      const clipsToAdd = subtitles.map((subtitle) => ({
        ...subtitle,
        trackId: targetTrackId,
      }))

      // Добавляем клипы на timeline
      // Для субтитров создаем псевдо MediaFile или используем другой подход
      for (const clip of clipsToAdd) {
        // Создаем MediaFile для субтитра (совместимый с обоими типами)
        const subtitleMediaFile = {
          id: clip.id,
          name: `${clip.text.substring(0, 50)}...`,
          path: "", // Субтитры не имеют файла
          type: MediaType.Subtitle,
          duration: clip.duration || 0,
        }

        await addClip(targetTrackId, subtitleMediaFile as any, clip.startTime)
      }

      setImportProgress(100)

      // Успешное завершение
      await logInfo("[useSubtitleImport] Субтитры успешно импортированы", {
        count: subtitles.length,
        format,
      } as LogContext)
      toast({
        title: "Субтитры импортированы",
        description: `Импортировано ${subtitles.length} субтитров из файла ${format.toUpperCase()}`,
      })

      // Вызываем callback если есть
      if (onImportComplete) {
        onImportComplete(clipsToAdd)
      }

      // Сохраняем изменения в backend
      await invoke("update_timeline_subtitles", {
        trackId: targetTrackId,
        subtitles: clipsToAdd,
      })
    } catch (error) {
      await logError("[useSubtitleImport] Ошибка импорта субтитров", { error } as LogContext)
      toast({
        title: "Ошибка импорта",
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      setImportProgress(0)
    }
  }, [trackId, addTrack, addClip, project, toast, onImportComplete])

  /**
   * Импортирует субтитры из строки
   */
  const importFromString = useCallback(
    async (
      content: string,
      format: "srt" | "vtt" | "ass",
      options?: {
        trackId?: string
        validateOnly?: boolean
      },
    ) => {
      try {
        // Импортируем субтитры
        const subtitles = importSubtitles(content, format)

        // Валидируем
        const validation = validateSubtitles(subtitles)
        if (!validation.valid) {
          throw new Error(`Ошибки валидации:\n${validation.errors.join("\n")}`)
        }

        // Если только валидация - возвращаем результат
        if (options?.validateOnly) {
          return { success: true, subtitles }
        }

        // Определяем трек
        const targetTrackId = options?.trackId || trackId
        if (!targetTrackId) {
          throw new Error("Не указан трек для добавления субтитров")
        }

        // Добавляем на timeline
        const clipsToAdd = subtitles.map((subtitle) => ({
          ...subtitle,
          trackId: targetTrackId,
        }))

        for (const clip of clipsToAdd) {
          // Создаем MediaFile для субтитра (совместимый с обоими типами)
          const subtitleMediaFile = {
            id: clip.id,
            name: `${clip.text.substring(0, 50)}...`,
            path: "", // Субтитры не имеют файла
            type: MediaType.Subtitle,
            duration: clip.duration || 0,
          }

          await addClip(targetTrackId, subtitleMediaFile as any, clip.startTime)
        }

        return { success: true, subtitles: clipsToAdd }
      } catch (error) {
        await logError("[useSubtitleImport] Ошибка импорта субтитров из строки", { error } as LogContext)
        return {
          success: false,
          error: error instanceof Error ? error.message : "Неизвестная ошибка",
        }
      }
    },
    [trackId, addClip],
  )

  /**
   * Импортирует субтитры из Whisper транскрипции
   */
  const importFromWhisper = useCallback(
    async (
      segments: Array<{
        start: number
        end: number
        text: string
      }>,
      options?: {
        trackId?: string
        language?: string
      },
    ) => {
      await logInfo("[useSubtitleImport] Импорт субтитров из Whisper транскрипции", {
        segmentsCount: segments.length,
      } as LogContext)
      try {
        // Конвертируем сегменты Whisper в субтитры
        const subtitles: SubtitleClip[] = segments.map((segment) =>
          createSubtitleClip({
            id: generateId(),
            trackId: options?.trackId || trackId || "",
            startTime: segment.start,
            duration: segment.end - segment.start,
            text: segment.text.trim(),
          }),
        )

        // Валидируем
        const validation = validateSubtitles(subtitles)
        if (!validation.valid) {
          throw new Error(`Ошибки валидации:\n${validation.errors.join("\n")}`)
        }

        // Определяем трек
        const targetTrackId = options?.trackId || trackId
        if (!targetTrackId) {
          throw new Error("Не указан трек для добавления субтитров")
        }

        // Добавляем на timeline
        for (const subtitle of subtitles) {
          subtitle.trackId = targetTrackId

          // Создаем MediaFile для субтитра (совместимый с обоими типами)
          const subtitleMediaFile = {
            id: subtitle.id,
            name: `${subtitle.text.substring(0, 50)}...`,
            path: "", // Субтитры не имеют файла
            type: MediaType.Subtitle,
            duration: subtitle.duration || 0,
          }

          await addClip(targetTrackId, subtitleMediaFile as any, subtitle.startTime)
        }

        await logInfo("[useSubtitleImport] Whisper транскрипция успешно импортирована", {
          count: subtitles.length,
        } as LogContext)
        toast({
          title: "Транскрипция импортирована",
          description: `Добавлено ${subtitles.length} субтитров из транскрипции`,
        })

        return { success: true, subtitles }
      } catch (error) {
        await logError("[useSubtitleImport] Ошибка импорта Whisper транскрипции", { error } as LogContext)
        toast({
          title: "Ошибка импорта",
          description: error instanceof Error ? error.message : "Неизвестная ошибка",
          variant: "destructive",
        })
        return {
          success: false,
          error: error instanceof Error ? error.message : "Неизвестная ошибка",
        }
      }
    },
    [trackId, addClip, toast],
  )

  return {
    importFromFile,
    importFromString,
    importFromWhisper,
    isImporting,
    importProgress,
  }
}

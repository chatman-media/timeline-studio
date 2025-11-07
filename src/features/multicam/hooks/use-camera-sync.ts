/**
 * Хук для управления синхронизацией камер
 * Предоставляет унифицированный интерфейс для всех методов синхронизации
 */

import { useCallback, useRef, useState } from "react"

import { useMediaFiles } from "@/features/app-state/hooks/use-media-files"
import { useLinkedClips } from "@/features/timeline/hooks/use-linked-clips"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import type { TimelineClip } from "@/features/timeline/types/timeline"
import { createLogger } from "@/lib/tauri-logger"
import { syncByAudio as syncByAudioService } from "../services/audio-sync-adapter"
import { syncByTimecode as syncByTimecodeService } from "../services/timecode-sync"
import type { SyncMethod, SyncResult, SyncStatus } from "../types/multicam"
import { mediaItemsToMediaFiles } from "../utils/media-mapper"

const logger = createLogger({ module: "UseCameraSync" })

export interface UseCameraSyncProps {
  baseClipId: string
}

export interface UseCameraSyncReturn {
  // Состояние синхронизации
  syncStatus: SyncStatus
  syncResults: SyncResult[]
  syncProgress: number
  syncError: string | null

  // Методы синхронизации
  syncByTimecode: () => Promise<void>
  syncByAudio: () => Promise<void>
  syncManual: (clipId: string, offset: number) => void

  // Управление синхронизацией
  applySyncResults: () => void
  clearSyncResults: () => void
  cancelSync: () => void

  // Утилиты
  getSyncOffset: (clipId: string) => number
  isSynced: (clipId: string) => boolean
  getSyncMethod: (clipId: string) => SyncMethod | null
}

export function useCameraSync({ baseClipId }: UseCameraSyncProps): UseCameraSyncReturn {
  const { getMulticamGroup, moveLinkedClips } = useLinkedClips()
  const { mediaFiles } = useMediaFiles()
  const { clips: allClips } = useTimeline()

  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle")
  const [syncResults, setSyncResults] = useState<SyncResult[]>([])
  const [syncProgress, setSyncProgress] = useState(0)
  const [syncError, setSyncError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Синхронизация по таймкоду
   */
  const handleSyncByTimecode = useCallback(async () => {
    try {
      setSyncStatus("syncing")
      setSyncError(null)
      setSyncProgress(0)

      // allClips уже доступен из useTimeline
      const baseClip = allClips.find((c: any) => c.id === baseClipId) as TimelineClip
      if (!baseClip) {
        throw new Error("Базовый клип не найден")
      }

      // Получаем все клипы группы
      const multicamGroup = getMulticamGroup(baseClipId)
      if (!multicamGroup.length) {
        throw new Error("Нет связанных клипов для синхронизации")
      }

      const clips = multicamGroup

      setSyncProgress(50)

      // Выполняем синхронизацию
      const mappedMediaFiles = mediaItemsToMediaFiles(mediaFiles)
      const results = syncByTimecodeService(baseClip as any, clips as any, mappedMediaFiles)

      // Преобразуем результаты в нужный формат
      const mappedResults: SyncResult[] = results.map((r) => ({
        clipId: r.clipId,
        offset: r.offset,
        confidence: r.confidence,
        method:
          r.method === "timecode" ? "timecode" : r.method === "creation_time" ? "manual" : ("manual" as SyncMethod),
      }))

      setSyncResults(mappedResults)
      setSyncProgress(100)
      setSyncStatus("success")

      logger.info("[useCameraSync] Timecode sync completed:", mappedResults)
    } catch (error) {
      logger.error("[useCameraSync] Timecode sync failed:", error)
      setSyncError(error instanceof Error ? error.message : "Ошибка синхронизации")
      setSyncStatus("error")
    }
  }, [baseClipId, allClips, getMulticamGroup, mediaFiles])

  /**
   * Синхронизация по аудио
   */
  const handleSyncByAudio = useCallback(async () => {
    try {
      setSyncStatus("syncing")
      setSyncError(null)
      setSyncProgress(0)

      // Создаем новый AbortController
      abortControllerRef.current = new AbortController()

      // allClips уже доступен из useTimeline
      const baseClip = allClips.find((c: any) => c.id === baseClipId) as TimelineClip
      if (!baseClip) {
        throw new Error("Базовый клип не найден")
      }

      const baseMedia = mediaFiles.find((m) => m.id === baseClip.mediaId)
      if (!baseMedia) {
        throw new Error("Медиафайл базового клипа не найден")
      }

      // Получаем все клипы группы
      const multicamGroup = getMulticamGroup(baseClipId)
      if (!multicamGroup.length) {
        throw new Error("Нет связанных клипов для синхронизации")
      }

      const otherClips = multicamGroup.filter((clip: any) => clip.id !== baseClipId)

      const results: SyncResult[] = []

      // Синхронизируем каждый клип с базовым
      for (let i = 0; i < otherClips.length; i++) {
        if (abortControllerRef.current.signal.aborted) {
          throw new Error("Синхронизация отменена")
        }

        const clip = otherClips[i]
        const media = mediaFiles.find((m) => m.id === clip.mediaId)

        if (!media) {
          logger.warn(`[useCameraSync] Media not found for clip ${clip.id}`)
          continue
        }

        // Обновляем прогресс
        const progress = ((i + 1) / otherClips.length) * 100
        setSyncProgress(progress)

        try {
          // Вызываем функцию синхронизации по аудио
          const result = await syncByAudioService(baseMedia.path, media.path, {
            onProgress: (audioProgress: number) => {
              // Комбинируем общий прогресс и прогресс текущего файла
              const totalProgress = (i / otherClips.length + audioProgress / otherClips.length) * 100
              setSyncProgress(totalProgress)
            },
            signal: abortControllerRef.current.signal,
          })

          // Приводим результат к нужному формату
          if (Array.isArray(result)) {
            // Если вернулся массив результатов
            results.push(
              ...result.map((r) => ({
                clipId: r.clipId,
                offset: r.offset,
                confidence: r.confidence,
                method: "audio" as SyncMethod,
              })),
            )
          } else {
            // Если вернулся один результат
            results.push({
              clipId: clip.id,
              offset: result.offset,
              confidence: result.confidence,
              method: "audio" as SyncMethod,
            })
          }
        } catch (audioError) {
          logger.error(`[useCameraSync] Audio sync failed for clip ${clip.id}:`, audioError)
          // Продолжаем с другими клипами
        }
      }

      setSyncResults(results)
      setSyncProgress(100)
      setSyncStatus("success")

      logger.info("[useCameraSync] Audio sync completed:", results)
    } catch (error) {
      logger.error("[useCameraSync] Audio sync failed:", error)
      setSyncError(error instanceof Error ? error.message : "Ошибка синхронизации")
      setSyncStatus("error")
    } finally {
      abortControllerRef.current = null
    }
  }, [baseClipId, allClips, getMulticamGroup, mediaFiles])

  /**
   * Ручная синхронизация
   */
  const syncManual = useCallback((clipId: string, offset: number) => {
    setSyncResults((prev) => {
      const existing = prev.find((r) => r.clipId === clipId)
      if (existing) {
        return prev.map((r) => (r.clipId === clipId ? { ...r, offset, method: "manual" as SyncMethod } : r))
      }
      return [
        ...prev,
        {
          clipId,
          offset,
          confidence: 1.0,
          method: "manual" as SyncMethod,
        },
      ]
    })
    setSyncStatus("success")
  }, [])

  /**
   * Применение результатов синхронизации
   */
  const applySyncResults = useCallback(() => {
    // allClips уже доступен из useTimeline
    syncResults.forEach((result) => {
      const clip = allClips.find((c: any) => c.id === result.clipId) as TimelineClip
      if (clip) {
        // Применяем смещение к startTime клипа
        const newStartTime = clip.startTime + result.offset
        moveLinkedClips(result.clipId, newStartTime)
      }
    })

    logger.info("[useCameraSync] Sync results applied")
  }, [syncResults, allClips, moveLinkedClips])

  /**
   * Очистка результатов синхронизации
   */
  const clearSyncResults = useCallback(() => {
    setSyncResults([])
    setSyncStatus("idle")
    setSyncProgress(0)
    setSyncError(null)
  }, [])

  /**
   * Отмена синхронизации
   */
  const cancelSync = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setSyncStatus("idle")
    setSyncProgress(0)
  }, [])

  /**
   * Получение смещения для клипа
   */
  const getSyncOffset = useCallback(
    (clipId: string): number => {
      const result = syncResults.find((r) => r.clipId === clipId)
      return result?.offset ?? 0
    },
    [syncResults],
  )

  /**
   * Проверка синхронизации клипа
   */
  const isSynced = useCallback(
    (clipId: string): boolean => {
      return syncResults.some((r) => r.clipId === clipId)
    },
    [syncResults],
  )

  /**
   * Получение метода синхронизации для клипа
   */
  const getSyncMethod = useCallback(
    (clipId: string): SyncMethod | null => {
      const result = syncResults.find((r) => r.clipId === clipId)
      return result?.method ?? null
    },
    [syncResults],
  )

  return {
    // Состояние
    syncStatus,
    syncResults,
    syncProgress,
    syncError,

    // Методы
    syncByTimecode: handleSyncByTimecode,
    syncByAudio: handleSyncByAudio,
    syncManual,

    // Управление
    applySyncResults,
    clearSyncResults,
    cancelSync,

    // Утилиты
    getSyncOffset,
    isSynced,
    getSyncMethod,
  }
}

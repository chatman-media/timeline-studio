/**
 * Hook for Timeline actions - добавление медиафайлов на таймлайн
 */

import { useCallback } from "react"

import { MediaType, type MediaFile } from "@/domains/media-management"
import { useResources } from "@/features/resources"
import { createLogger } from "@/lib/tauri-logger"
import { useTimeline } from "../hooks/use-timeline"
import type { TrackType } from "../types"
import { useClips } from "./use-clips"
import { useTracks } from "./use-tracks"

const logger = createLogger("UseTimelineActions")

export interface UseTimelineActionsReturn {
  // Добавление медиафайлов
  addMediaToTimeline: (files: MediaFile[]) => Promise<void>
  addSingleMediaToTimeline: (file: MediaFile, targetTrackId?: string, startTime?: number) => Promise<void>

  // Утилиты
  getTrackTypeForMedia: (file: MediaFile) => TrackType
  findBestTrackForMedia: (file: MediaFile) => string | null
  calculateClipStartTime: (trackId: string) => number
}

/**
 * Определяет тип трека для медиафайла
 */
function getTrackTypeForMediaFile(file: MediaFile): TrackType {
  // Проверяем по типу файла
  if (file.type === MediaType.StillImage || file.type === MediaType.ImageSequence) {
    return "image"
  }

  if (file.type === MediaType.Video || file.type === MediaType.VideoWithAudio) {
    return "video"
  }

  if (
    file.type === MediaType.Audio ||
    file.type === MediaType.Music ||
    file.type === MediaType.Voiceover ||
    file.type === MediaType.SFX ||
    file.type === MediaType.Ambient
  ) {
    return "audio"
  }

  // Проверяем по метаданным, если они доступны
  if (file.probeData?.streams) {
    const hasVideo = file.probeData.streams.some((stream) => stream.codec_type === "video")
    const hasAudio = file.probeData.streams.some((stream) => stream.codec_type === "audio")

    if (hasVideo) {
      return "video"
    }
    if (hasAudio) {
      return "audio"
    }
  }

  // По умолчанию считаем видео
  return "video"
}

export function useTimelineActions(): UseTimelineActionsReturn {
  const { project, addTrack, addClip, createProject } = useTimeline()
  const { tracks, getTracksByType } = useTracks()
  const { getClipsByTrack } = useClips()
  const { addMedia } = useResources()

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getTrackTypeForMedia = useCallback((file: MediaFile): TrackType => {
    return getTrackTypeForMediaFile(file)
  }, [])

  const findBestTrackForMedia = useCallback(
    (file: MediaFile): string | null => {
      const trackType = getTrackTypeForMedia(file)
      const tracksOfType = getTracksByType(trackType)

      if (!tracksOfType || tracksOfType.length === 0) {
        return null // Нет подходящих треков
      }

      // Возвращаем первый трек подходящего типа
      // В будущем можно добавить более сложную логику выбора
      return tracksOfType[0].id
    },
    [getTrackTypeForMedia, getTracksByType],
  )

  const calculateClipStartTime = useCallback(
    (trackId: string): number => {
      const clipsOnTrack = getClipsByTrack(trackId)

      if (!clipsOnTrack || clipsOnTrack.length === 0) {
        return 0 // Начинаем с начала трека
      }

      // Находим последний клип и добавляем новый после него
      const lastClip = clipsOnTrack.reduce((latest, clip) => {
        const clipEndTime = clip.startTime + clip.duration
        const latestEndTime = latest.startTime + latest.duration
        return clipEndTime > latestEndTime ? clip : latest
      })

      return lastClip.startTime + lastClip.duration
    },
    [getClipsByTrack],
  )

  // ============================================================================
  // MAIN ACTIONS
  // ============================================================================

  const addSingleMediaToTimeline = useCallback(
    async (file: MediaFile, customTrackId?: string, customStartTime?: number) => {
      logger.info(`Adding media file to timeline: ${file.name} (type: ${file.type})`)

      // Если нет проекта, создаем новый
      if (!project) {
        logger.info("No timeline project found, creating new project...")
        await createProject("Untitled Project")

        // Ожидаем небольшую задержку для обновления состояния
        await new Promise((resolve) => setTimeout(resolve, 100))
        return addSingleMediaToTimeline(file, customTrackId, customStartTime)
      }

      const trackType = getTrackTypeForMedia(file)
      const targetTrackId = customTrackId || findBestTrackForMedia(file)

      logger.info(`Track type: ${trackType}, Target track ID: ${targetTrackId || "none - will create new"}`)

      // Если нет подходящего трека, создаем новый
      if (!targetTrackId) {
        const trackName = `${trackType.charAt(0).toUpperCase() + trackType.slice(1)} Track`

        logger.info(`Creating new ${trackType} track for file: ${file.name}`)

        try {
          // Ожидаем создание трека
          await addTrack(trackType, trackName, undefined)

          // Ожидаем небольшую задержку для обновления состояния
          await new Promise((resolve) => setTimeout(resolve, 150))

          // Пытаемся найти созданный трек
          const newTargetTrackId = findBestTrackForMedia(file)

          if (!newTargetTrackId) {
            logger.error(
              `Track was created but not found in state for media file: ${file.name}. Please try again or create track manually.`,
            )
            return
          }

          logger.info(`Track created successfully for file: ${file.name}`)
          return addSingleMediaToTimeline(file, newTargetTrackId, customStartTime)
        } catch (error) {
          logger.error(`Failed to create ${trackType} track for media file: ${file.name}`, { error })
          return
        }
      }

      // Если трек уже существует, добавляем клип сразу
      const startTime = customStartTime !== undefined ? customStartTime : calculateClipStartTime(targetTrackId)
      const duration =
        file.duration ||
        (file.type === MediaType.StillImage || file.type === MediaType.ImageSequence ? 5 : 10) // 5 секунд для изображений, 10 для видео/аудио без duration

      // Автоматически добавляем медиа на панель ресурсов (для работы с ИИ)
      await addMedia(file)

      await addClip(targetTrackId, file as any, startTime)
      logger.info(`Added ${file.name} to track ${targetTrackId} at time ${startTime} with duration ${duration}`)
    },
    [
      project,
      getTrackTypeForMedia,
      findBestTrackForMedia,
      addTrack,
      calculateClipStartTime,
      addClip,
      createProject,
      addMedia,
    ],
  )

  const addMediaToTimeline = useCallback(
    async (files: MediaFile[]) => {
      if (!files || files.length === 0) {
        return
      }

      logger.info(`Adding ${files.length} files to timeline`)

      // Добавляем файлы последовательно, ожидая завершения каждого
      for (const file of files) {
        await addSingleMediaToTimeline(file)
        // Небольшая задержка между добавлениями для лучшего UX
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    },
    [addSingleMediaToTimeline],
  )

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Основные действия
    addMediaToTimeline,
    addSingleMediaToTimeline,

    // Утилиты
    getTrackTypeForMedia,
    findBestTrackForMedia,
    calculateClipStartTime,
  }
}

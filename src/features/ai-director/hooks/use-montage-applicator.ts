/**
 * Hook для применения плана монтажа к timeline
 * Конвертирует MontagePlan в timeline структуру с клипами, переходами и ресурсами
 */

import { useCallback } from "react"

import type { MediaFile } from "@/domains/video-editing/types"
import { MediaType } from "@/domains/video-editing/types"
import { useResources } from "@/features/resources"
import { useClips } from "@/features/timeline/hooks/use-clips"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { useTimelineActions } from "@/features/timeline/hooks/use-timeline-actions"
import { useTracks } from "@/features/timeline/hooks/use-tracks"
import type { TrackType } from "@/features/timeline/types/timeline"
import { createLogger } from "@/lib/tauri-logger"

import type { MontageClip, MontagePlan } from "../types/montage-plan"

const logger = createLogger("useMontageApplicator")

export interface MontageApplicationOptions {
  /** Создавать новый проект или добавлять в текущий */
  createNewProject?: boolean
  /** Использовать существующие треки или создавать новые */
  useExistingTracks?: boolean
  /** ID секции для добавления клипов */
  sectionId?: string
  /** Callback при завершении */
  onComplete?: () => void
  /** Callback при ошибке */
  onError?: (error: Error) => void
}

export function useMontageApplicator() {
  const { project, createProject } = useTimeline()
  const { addSingleMediaToTimeline } = useTimelineActions()
  const { addClip } = useClips()
  const { addTrack } = useTracks()
  const { addMedia } = useResources()

  /**
   * Применить план монтажа к timeline
   */
  const applyMontagePlan = useCallback(
    async (plan: MontagePlan, options: MontageApplicationOptions = {}) => {
      try {
        logger.infoSync("[useMontageApplicator] Applying montage plan", {
          planId: plan.id,
          clipsCount: plan.clips.length,
        })

        // Если нужен новый проект, создаем
        if (options.createNewProject && !project) {
          await createProject(plan.name || "AI Generated Montage")
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        if (!project) {
          throw new Error("No timeline project available")
        }

        // Группируем клипы по типу для создания треков
        const clipsByType = groupClipsByType(plan.clips)

        // Применяем клипы для каждого типа трека
        let currentTime = 0

        for (const [trackType, clips] of Object.entries(clipsByType)) {
          logger.infoSync(`[useMontageApplicator] Processing ${clips.length} ${trackType} clips`)

          // Создаем трек если нужно
          let trackId: string | undefined

          if (!options.useExistingTracks) {
            const trackName = `${plan.name || "Montage"} - ${trackType}`
            await addTrack(trackType as TrackType, trackName, options.sectionId)
            await new Promise((resolve) => setTimeout(resolve, 150))
          }

          // Добавляем клипы последовательно
          currentTime = 0

          for (const montageClip of clips) {
            await applyMontageClip(montageClip, trackId, currentTime, plan)
            currentTime += montageClip.duration

            // Применяем переход после клипа если есть
            const transition = plan.transitions.find((t) => t.afterClipIndex === clips.indexOf(montageClip))
            if (transition) {
              // Переход перекрывает конец предыдущего и начало следующего клипа
              currentTime -= transition.duration / 2
            }

            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        }

        // Добавляем музыку если есть
        if (plan.music) {
          await applyMusicTrack(plan)
        }

        // Добавляем титры если есть
        if (plan.texts && plan.texts.length > 0) {
          await applyTextTracks(plan)
        }

        logger.infoSync("[useMontageApplicator] Montage plan applied successfully")

        if (options.onComplete) {
          options.onComplete()
        }
      } catch (error) {
        logger.errorSync("[useMontageApplicator] Failed to apply montage plan", error as Record<string, unknown>)

        if (options.onError) {
          options.onError(error as Error)
        }

        throw error
      }
    },
    [project, createProject, addTrack, addSingleMediaToTimeline, addClip, addMedia],
  )

  /**
   * Применить один клип из плана монтажа
   */
  const applyMontageClip = useCallback(
    async (montageClip: MontageClip, trackId: string | undefined, startTime: number, _plan: MontagePlan) => {
      // Создаем MediaFile из MontageClip
      const mediaFile: Partial<MediaFile> = {
        id: montageClip.fileId,
        name: montageClip.filePath.split("/").pop() || "Untitled",
        path: montageClip.filePath,
        type: getMediaTypeFromPath(montageClip.filePath),
        duration: montageClip.endTime - montageClip.startTime,
        size: 0,
        createdAt: new Date(),
      }

      // Добавляем в ресурсы проекта
      await addMedia(mediaFile as MediaFile)

      // Создаем клип на треке
      if (trackId) {
        await addClip(trackId, mediaFile as any, startTime)
      } else {
        await addSingleMediaToTimeline(mediaFile as MediaFile, undefined, startTime)
      }

      logger.infoSync(`[useMontageApplicator] Applied clip ${montageClip.fileId} at ${startTime}s`)
    },
    [addMedia, addClip, addSingleMediaToTimeline],
  )

  /**
   * Добавить музыкальный трек
   */
  const applyMusicTrack = useCallback(
    async (plan: MontagePlan) => {
      if (!plan.music) return

      logger.infoSync("[useMontageApplicator] Applying music track", {
        style: plan.music.style,
        volume: plan.music.volume,
      })

      // TODO: интеграция с библиотекой музыки
      // Здесь будет логика добавления музыкального трека
      // На данный момент это placeholder

      const musicTrackName = `Music - ${plan.music.style || "Background"}`
      await addTrack("music", musicTrackName)
      await new Promise((resolve) => setTimeout(resolve, 100))
    },
    [addTrack],
  )

  /**
   * Добавить текстовые треки
   */
  const applyTextTracks = useCallback(
    async (plan: MontagePlan) => {
      if (!plan.texts || plan.texts.length === 0) return

      logger.infoSync("[useMontageApplicator] Applying text tracks", {
        textsCount: plan.texts.length,
      })

      // Создаем трек для титров
      const titleTrackName = `${plan.name || "Montage"} - Titles`
      await addTrack("title", titleTrackName)
      await new Promise((resolve) => setTimeout(resolve, 100))

      // TODO: Добавить логику создания текстовых клипов
      // На данный момент это placeholder
    },
    [addTrack],
  )

  return {
    applyMontagePlan,
    applyMontageClip,
  }
}

/**
 * Группирует клипы по типу трека
 */
function groupClipsByType(clips: MontageClip[]): Record<string, MontageClip[]> {
  const groups: Record<string, MontageClip[]> = {
    video: [],
    audio: [],
    image: [],
  }

  for (const clip of clips) {
    // Определяем тип по расширению файла
    const ext = clip.filePath.split(".").pop()?.toLowerCase()

    if (ext === "mp4" || ext === "mov" || ext === "avi" || ext === "webm") {
      groups.video.push(clip)
    } else if (ext === "mp3" || ext === "wav" || ext === "m4a" || ext === "ogg") {
      groups.audio.push(clip)
    } else if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp") {
      groups.image.push(clip)
    } else {
      // По умолчанию считаем видео
      groups.video.push(clip)
    }
  }

  return groups
}

/**
 * Определяет MediaType по пути к файлу
 */
function getMediaTypeFromPath(filePath: string): MediaType {
  const ext = filePath.split(".").pop()?.toLowerCase()

  if (ext === "mp4" || ext === "mov" || ext === "avi" || ext === "webm" || ext === "mkv") {
    return MediaType.Video
  }

  if (ext === "mp3" || ext === "wav" || ext === "m4a" || ext === "ogg" || ext === "flac") {
    return MediaType.Audio
  }

  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp" || ext === "gif") {
    return MediaType.StillImage
  }

  return MediaType.Unknown
}

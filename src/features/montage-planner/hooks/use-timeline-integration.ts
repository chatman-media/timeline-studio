/**
 * Hook для интеграции Montage Planner с Timeline
 */

import type { MediaFile } from "@timeline-studio/core/types"
import { useCallback, useState } from "react"
import { useTimelineMarkers } from "@/features/timeline/hooks/markers/use-timeline-markers"
import { useTimeline } from "@/features/timeline/hooks/state/use-timeline"
import { createLogger } from "@/lib/tauri-logger"
import {
  createMarkersFromPlan as createMarkersFromPlanService,
  type TimelineIntegrationOptions,
} from "../services/domain-adapters"
import type { MontagePlan, PlannedClip, Sequence } from "../types"

const logger = createLogger({ module: "UseTimelineIntegration" })

export interface UseTimelineIntegrationReturn {
  // Основные действия
  applyPlanToTimeline: (
    plan: MontagePlan,
    mediaFiles: MediaFile[],
    options?: TimelineIntegrationOptions,
  ) => Promise<void>

  createMarkersFromPlan: (plan: MontagePlan, timeOffset?: number) => void

  // Состояние
  isApplying: boolean
  error: string | null

  // Утилиты
  canApplyPlan: (plan: MontagePlan) => boolean
  getRequiredMediaFiles: (plan: MontagePlan) => string[]
}

export function useTimelineIntegration(): UseTimelineIntegrationReturn {
  const { project, saveProject, addTrack, addClip, updateClip } = useTimeline()
  const { addMarker } = useTimelineMarkers()

  // Функция для добавления маркеров
  const addMarkers = useCallback(
    (markers: any[]) => {
      markers.forEach((marker) => {
        addMarker({
          name: marker.name,
          time: marker.time,
          type: marker.type || "comment",
          color: marker.color,
          description: marker.description || "",
        })
      })
    },
    [addMarker],
  )

  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Применить монтажный план к Timeline
   */
  const applyPlanToTimeline = useCallback(
    async (plan: MontagePlan, mediaFiles: MediaFile[], options: TimelineIntegrationOptions = {}) => {
      if (!project) {
        setError("No timeline project loaded")
        return
      }

      setIsApplying(true)
      setError(null)

      try {
        // Проверяем наличие всех необходимых медиафайлов
        const requiredFiles = getRequiredMediaFiles(plan)
        const availableFiles = new Set(mediaFiles.map((f) => f.id))

        const missingFiles = requiredFiles.filter((id) => !availableFiles.has(id))
        if (missingFiles.length > 0) {
          throw new Error(`Missing media files: ${missingFiles.join(", ")}`)
        }

        const mediaById = new Map(mediaFiles.map((file) => [file.id, file]))
        const sequenceTrackIds = new Map<string, string>()
        let currentTime = options.timeOffset ?? 0

        const getTrackTypeForClip = (clip: PlannedClip): "audio" | "image" | "video" => {
          const mediaType = String(clip.fragment?.sourceFile?.type ?? "").toLowerCase()
          if (["audio", "music", "voiceover", "sfx", "ambient"].some((type) => mediaType.includes(type))) {
            return "audio"
          }
          if (["image", "stillimage", "imagesequence"].some((type) => mediaType.includes(type))) {
            return "image"
          }
          return "video"
        }

        const getTrackForClip = async (sequence: Sequence, clip: PlannedClip) => {
          const trackType = getTrackTypeForClip(clip)
          const targetTrack =
            options.useExistingTracks && trackType === "audio" ? options.targetAudioTrack : options.targetVideoTrack

          if (options.useExistingTracks && targetTrack) {
            return targetTrack
          }

          const trackKey = `${sequence.id}:${trackType}`
          const existingTrackId = sequenceTrackIds.get(trackKey)
          if (existingTrackId) {
            return existingTrackId
          }

          const trackName = `${sequence.type} ${trackType} - ${sequence.purpose}`
          const createdTrackId = await addTrack(trackType, trackName)
          if (!createdTrackId) {
            throw new Error(`Backend did not return track_id for sequence ${sequence.id}`)
          }

          sequenceTrackIds.set(trackKey, createdTrackId)
          return createdTrackId
        }

        for (const sequence of plan.sequences) {
          const sortedClips = [...sequence.clips].sort((a, b) => a.sequenceOrder - b.sequenceOrder)

          for (const plannedClip of sortedClips) {
            const fragment = plannedClip.fragment
            const sourceFile = fragment?.sourceFile
            if (!fragment || !sourceFile) {
              throw new Error(`Fragment or source file not found for clip ${plannedClip.fragmentId}`)
            }

            const mediaFile = mediaById.get(sourceFile.id) ?? (sourceFile as any)
            const trackId = await getTrackForClip(sequence, plannedClip)
            const clipId = await addClip(trackId, mediaFile as any, currentTime)

            if (!clipId) {
              throw new Error(`Backend did not return clip_id for fragment ${fragment.id}`)
            }

            const updates: Record<string, unknown> = {}
            if (plannedClip.adjustments?.speedMultiplier && plannedClip.adjustments.speedMultiplier !== 1) {
              updates.speed = plannedClip.adjustments.speedMultiplier
              updates.playbackRate = plannedClip.adjustments.speedMultiplier
            }

            if (plannedClip.adjustments?.crop) {
              updates.position = {
                x: plannedClip.adjustments.crop.x,
                y: plannedClip.adjustments.crop.y,
                width: plannedClip.adjustments.crop.width,
                height: plannedClip.adjustments.crop.height,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
              }
            }

            if (Object.keys(updates).length > 0) {
              await updateClip(clipId, updates as any)
            }

            const duration = fragment.duration || mediaFile.duration || 0
            currentTime += plannedClip.adjustments?.speedMultiplier
              ? duration / plannedClip.adjustments.speedMultiplier
              : duration
          }

          currentTime += 0.5
        }

        await saveProject()

        // Добавляем маркеры если нужно
        if (options.createNewSection) {
          const markers = createMarkersFromPlanService(plan, options.timeOffset || 0)
          addMarkers(markers)
        }

        logger.info(`Successfully applied montage plan: ${plan.name}`)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to apply montage plan"
        setError(errorMessage)
        logger.error("Failed to apply montage plan:", { error: err })
      } finally {
        setIsApplying(false)
      }
    },
    [project, addTrack, addClip, updateClip, saveProject, addMarkers],
  )

  /**
   * Создать маркеры из монтажного плана
   */
  const createMarkers = useCallback(
    (plan: MontagePlan, timeOffset = 0) => {
      if (!project) {
        setError("No timeline project loaded")
        return
      }

      try {
        const markers = createMarkersFromPlanService(plan, timeOffset)
        addMarkers(markers)
        logger.info(`Added ${markers.length} markers from montage plan`)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create markers"
        setError(errorMessage)
        logger.error("Failed to create markers:", { error: err })
      }
    },
    [project, addMarkers],
  )

  /**
   * Проверить возможность применения плана
   */
  const canApplyPlan = useCallback(
    (plan: MontagePlan): boolean => {
      if (!project) return false
      if (!plan.sequences || plan.sequences.length === 0) return false
      if (plan.totalDuration <= 0) return false

      return true
    },
    [project],
  )

  /**
   * Получить список необходимых медиафайлов
   */
  const getRequiredMediaFiles = useCallback((plan: MontagePlan): string[] => {
    const files = new Set<string>()

    // Extract files from all sequences and clips
    plan.sequences.forEach((sequence: Sequence) => {
      sequence.clips.forEach((clip: PlannedClip) => {
        if (clip.fragment?.sourceFile?.id) {
          files.add(clip.fragment.sourceFile.id)
        }
      })
    })

    return Array.from(files)
  }, [])

  return {
    applyPlanToTimeline,
    createMarkersFromPlan: createMarkers,
    isApplying,
    error,
    canApplyPlan,
    getRequiredMediaFiles,
  }
}

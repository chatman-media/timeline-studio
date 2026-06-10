/**
 * Hook для интеграции Montage Planner с Timeline
 */

import { useCallback, useState } from "react"
import {
  applyPlanToTimeline as applyPlanToTimelineService,
  createMarkersFromPlan as createMarkersFromPlanService,
  type TimelineIntegrationOptions,
} from "@/domains/ai-services/services/montage-planning/timeline-integration-service"
import type { MediaFile } from "@/core/types"
import { useTimelineMarkers } from "@/features/timeline/hooks/markers/use-timeline-markers"
import { useTimeline } from "@/features/timeline/hooks/state/use-timeline"
import { useTimelineActions } from "@/features/timeline/hooks/state/use-timeline-actions"
import { createLogger } from "@/lib/tauri-logger"
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
  const { project, saveProject } = useTimeline()
  const { addMediaToTimeline } = useTimelineActions()
  const { addMarker } = useTimelineMarkers()

  // Функция для обновления проекта
  const updateProject = useCallback(
    async (_updatedProject: any) => {
      // Сохраняем проект в timeline
      await saveProject()
    },
    [saveProject],
  )

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

        // Применяем план к Timeline
        const updatedProject = applyPlanToTimelineService(plan, project as any, mediaFiles, options)

        // Обновляем проект
        await updateProject(updatedProject)

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
    [project, updateProject, addMarkers],
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

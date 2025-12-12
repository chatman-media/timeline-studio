import { useCallback, useMemo } from "react"
import type { Transition } from "@/domains/video-editing/types"
import { useAdvancedTransitions } from "@/features/transitions/hooks/use-advanced-transitions"
import { useTransitions } from "@/features/transitions/hooks/use-transitions"

import {
  addKeyframeToTimelineTransition,
  cloneTimelineTransition,
  createTimelineTransition,
  getTimelineTransitionById,
  removeKeyframeFromTimelineTransition,
  updateTimelineTransitionParameters,
} from "../services/resource-manager"
import { getTrackTransitions as getTrackTransitionsService } from "../services/timeline-transition-manager"
import type { TimelineProject } from "@/features/timeline/types"
import type { TimelineTransition } from "../types/timeline-transition"

/**
 * Hook для работы с переходами на таймлайне
 */
export function useTimelineTransitions(project: TimelineProject) {
  const { transitions, loading: transitionsLoading } = useTransitions()
  const {
    advancedTransitions,
    isWebGLInitialized,
    initializeWebGL,
    previewTransition,
    getTransitionPerformanceInfo,
    createDefaultParameters,
  } = useAdvancedTransitions()

  // Получение всех TimelineTransition из проекта
  const timelineTransitions = useMemo(() => {
    return project.resources?.timelineTransitions || []
  }, [project.resources?.timelineTransitions])

  // Получение базовых переходов из ресурсов проекта
  const availableTransitions = useMemo(() => {
    return project.resources?.transitions || []
  }, [project.resources?.transitions])

  /**
   * Создание нового перехода на таймлайне
   */
  const createTransition = useCallback(
    (
      transitionResource: Transition,
      options: {
        trackId: string
        position: number
        duration: number
        type: "between" | "in" | "out" | "adjustment"
        startClipId?: string
        endClipId?: string
        parameters?: TimelineTransition["parameters"]
        keyframes?: TimelineTransition["keyframes"]
      },
    ) => {
      const result = createTimelineTransition(project, transitionResource, options)
      return result
    },
    [project],
  )

  /**
   * Обновление параметров перехода
   */
  const updateTransitionParameters = useCallback(
    (transitionId: string, newParameters: Partial<TimelineTransition["parameters"]>) => {
      return updateTimelineTransitionParameters(project, transitionId, newParameters)
    },
    [project],
  )

  /**
   * Добавление keyframe к переходу
   */
  const addKeyframe = useCallback(
    (transitionId: string, keyframe: TimelineTransition["keyframes"][0]) => {
      return addKeyframeToTimelineTransition(project, transitionId, keyframe)
    },
    [project],
  )

  /**
   * Удаление keyframe из перехода
   */
  const removeKeyframe = useCallback(
    (transitionId: string, keyframeId: string) => {
      return removeKeyframeFromTimelineTransition(project, transitionId, keyframeId)
    },
    [project],
  )

  /**
   * Получение перехода по ID
   */
  const getTransitionById = useCallback(
    (transitionId: string) => {
      return getTimelineTransitionById(project, transitionId)
    },
    [project],
  )

  /**
   * Клонирование перехода
   */
  const cloneTransition = useCallback(
    (sourceTransitionId: string, overrides?: Partial<TimelineTransition>) => {
      return cloneTimelineTransition(project, sourceTransitionId, overrides)
    },
    [project],
  )

  /**
   * Получение базового перехода по ID
   */
  const getTransitionResource = useCallback(
    (transitionId: string): Transition | undefined => {
      return transitions.find((t) => t.id === transitionId) || availableTransitions.find((t) => t.id === transitionId)
    },
    [transitions, availableTransitions],
  )

  /**
   * Создание параметров по умолчанию для перехода
   */
  const createDefaultTransitionParameters = useCallback(
    (transitionResource: Transition) => {
      return createDefaultParameters(transitionResource)
    },
    [createDefaultParameters],
  )

  /**
   * Фильтрация переходов по типу
   */
  const getTransitionsByType = useCallback(
    (type: TimelineTransition["type"]) => {
      return timelineTransitions.filter((t) => t.type === type)
    },
    [timelineTransitions],
  )

  /**
   * Фильтрация переходов по диапазону времени
   */
  const getTransitionsInRange = useCallback(
    (startTime: number, endTime: number) => {
      return timelineTransitions.filter((t) => {
        const transitionStart = t.position
        const transitionEnd = t.position + t.duration
        return transitionStart < endTime && transitionEnd > startTime
      })
    },
    [timelineTransitions],
  )

  /**
   * Получение переходов с GPU ускорением
   */
  const getGpuAcceleratedTransitions = useCallback(() => {
    return timelineTransitions.filter((t) => {
      const resource = getTransitionResource(t.transitionId)
      return resource?.gpuAccelerated
    })
  }, [timelineTransitions, getTransitionResource])

  /**
   * Получение переходов с расширенными параметрами
   */
  const getAdvancedTransitions = useCallback(() => {
    return timelineTransitions.filter((t) => {
      return t.parameters?.blur || t.parameters?.color || t.keyframes.length > 0
    })
  }, [timelineTransitions])

  /**
   * Проверка совместимости перехода с WebGL
   */
  const isTransitionWebGLCompatible = useCallback(
    (transitionId: string) => {
      const resource = getTransitionResource(transitionId)
      return resource?.gpuAccelerated && isWebGLInitialized
    },
    [getTransitionResource, isWebGLInitialized],
  )

  /**
   * Получение статистики переходов
   */
  const getTransitionsStats = useMemo(() => {
    const stats = {
      total: timelineTransitions.length,
      byType: {} as Record<string, number>,
      withBlur: 0,
      withColor: 0,
      withKeyframes: 0,
      gpuAccelerated: 0,
      averageDuration: 0,
    }

    timelineTransitions.forEach((t) => {
      // Подсчет по типам
      stats.byType[t.type] = (stats.byType[t.type] || 0) + 1

      // Подсчет эффектов
      if (t.parameters?.blur) stats.withBlur++
      if (t.parameters?.color) stats.withColor++
      if (t.keyframes.length > 0) stats.withKeyframes++

      // GPU ускорение
      const resource = getTransitionResource(t.transitionId)
      if (resource?.gpuAccelerated) stats.gpuAccelerated++

      // Средняя длительность
      stats.averageDuration += t.duration
    })

    if (stats.total > 0) {
      stats.averageDuration /= stats.total
    }

    return stats
  }, [timelineTransitions, getTransitionResource])

  /**
   * Получение всех переходов для конкретного трека
   */
  const getTrackTransitions = useCallback(
    (trackId: string) => {
      return getTrackTransitionsService(project, trackId)
    },
    [project],
  )

  return {
    // Данные
    timelineTransitions,
    availableTransitions,
    transitions,
    advancedTransitions,

    // Состояние
    loading: transitionsLoading,
    isWebGLInitialized,

    // Методы создания и управления
    createTransition,
    updateTransitionParameters,
    addKeyframe,
    removeKeyframe,
    getTransitionById,
    cloneTransition,

    // Получение ресурсов
    getTransitionResource,
    createDefaultTransitionParameters,

    // Фильтрация и поиск
    getTransitionsByType,
    getTransitionsInRange,
    getGpuAcceleratedTransitions,
    getAdvancedTransitions,
    getTrackTransitions,

    // WebGL интеграция
    initializeWebGL,
    previewTransition,
    isTransitionWebGLCompatible,
    getTransitionPerformanceInfo,

    // Статистика
    getTransitionsStats,

    // Утилиты
    hasActiveTransitions: timelineTransitions.length > 0,
    canCreateTransition: !transitionsLoading && transitions.length > 0,
  }
}

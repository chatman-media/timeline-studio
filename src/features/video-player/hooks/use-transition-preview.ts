/**
 * Hook для управления предпросмотром переходов в видеоплеере
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { TimelineTransition } from "@/domains/video-editing/types/timeline"
import { useTimeline } from "@/features/timeline/hooks/state/use-timeline"
import { logError, logInfo } from "@/lib/tauri-logger"

import { getTransitionsPreviewService, type TransitionParams } from "../services/transitions-preview"

interface TransitionPreviewState {
  activeTransition: TimelineTransition | null
  progress: number
  isPlaying: boolean
  startTime: number
  endTime: number
}

interface UseTransitionPreviewOptions {
  enablePreview?: boolean
  autoPlay?: boolean
  loop?: boolean
}

interface UseTransitionPreviewReturn {
  // Состояние
  state: TransitionPreviewState

  // Методы управления
  startPreview: () => void
  stopPreview: () => void
  seekToTime: (time: number) => void

  // Rendering
  renderTransition: (videoA: HTMLVideoElement, videoB: HTMLVideoElement, canvas: HTMLCanvasElement) => boolean

  // Утилиты
  isTransitionActive: (time?: number) => boolean
  getTransitionAtTime: (time: number) => { transition: TimelineTransition; progress: number } | null
}

export function useTransitionPreview(options: UseTransitionPreviewOptions = {}): UseTransitionPreviewReturn {
  logInfo("[useTransitionPreview] Инициализация хука", { options })

  const { enablePreview = true, autoPlay = false, loop = false } = options
  const { project, currentTime, isPlaying } = useTimeline()
  const [transitionService] = useState(() => getTransitionsPreviewService())

  // Состояние предпросмотра
  const [state, setState] = useState<TransitionPreviewState>({
    activeTransition: null,
    progress: 0,
    isPlaying: false,
    startTime: 0,
    endTime: 0,
  })

  // Ref для анимации
  const animationRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(0)

  // Получить все переходы в проекте
  const allTransitions = useMemo(() => {
    if (!project || !project.resources.timelineTransitions) return []

    const transitions: Array<{
      transition: TimelineTransition
      trackId: string
    }> = []

    // Собираем переходы из всех треков
    const sectionTracks = project.sections.flatMap((s) => s.tracks)
    const allTracks = [...sectionTracks, ...project.globalTracks]

    for (const track of allTracks) {
      // Skip tracks without clips
      if (!track.clips || track.clips.length === 0) continue

      // Collect transitions from all clips in this track
      const trackTransitionIds = track.clips.flatMap((clip) => clip.transitions.map((t) => t.id))

      const validTransitions = trackTransitionIds
        .map((id) => project.resources.timelineTransitions?.find((t) => t.id === id))
        .filter((t): t is TimelineTransition => t !== undefined && t !== null)

      const trackTransitions = validTransitions.map((transition) => ({ transition, trackId: track.id }))

      transitions.push(...trackTransitions)
    }

    // Сортируем по position (или startTime для обратной совместимости)
    return transitions.sort((a, b) => {
      const timeA = a.transition.startTime ?? a.transition.position
      const timeB = b.transition.startTime ?? b.transition.position
      return timeA - timeB
    })
  }, [project])

  // Найти переход на определённом времени
  const getTransitionAtTime = useCallback(
    (time: number) => {
      for (const { transition } of allTransitions) {
        const transitionStart = transition.startTime ?? transition.position
        const transitionEnd = transitionStart + transition.duration
        if (time >= transitionStart && time <= transitionEnd) {
          const progress = (time - transitionStart) / transition.duration
          return { transition, progress }
        }
      }
      return null
    },
    [allTransitions],
  )

  // Проверить, активен ли переход
  const isTransitionActive = useCallback(
    (time?: number) => {
      const checkTime = time ?? currentTime
      return getTransitionAtTime(checkTime) !== null
    },
    [currentTime, getTransitionAtTime],
  )

  // Обновить состояние на основе текущего времени
  const updateState = useCallback(() => {
    const transitionData = getTransitionAtTime(currentTime)

    if (transitionData) {
      const { transition, progress } = transitionData
      const transitionStart = transition.startTime ?? transition.position
      setState((prev) => ({
        ...prev,
        activeTransition: transition,
        progress,
        startTime: transitionStart,
        endTime: transitionStart + transition.duration,
      }))
    } else {
      setState((prev) => ({
        ...prev,
        activeTransition: null,
        progress: 0,
        startTime: 0,
        endTime: 0,
      }))
    }
  }, [currentTime, getTransitionAtTime])

  // Рендеринг перехода
  const renderTransition = useCallback(
    (videoA: HTMLVideoElement, videoB: HTMLVideoElement, canvas: HTMLCanvasElement): boolean => {
      if (!state.activeTransition || !enablePreview) return false

      try {
        const params: TransitionParams = {
          duration: state.activeTransition.duration,
          progress: state.progress,
          easingFunction: "easeInOut", // TODO: Использовать кривую из transition.curve
          direction: "forward",
          customParams: state.activeTransition.parameters || {},
        }

        // Используем синхронную версию applyTransition
        transitionService.applyTransition(videoA, videoB, state.activeTransition.transitionId, params, canvas)
        return true
      } catch (error) {
        logError("[useTransitionPreview] Ошибка рендеринга перехода", { error })
        return false
      }
    },
    [state.activeTransition, state.progress, enablePreview, transitionService],
  )

  // Анимация предпросмотра
  const animate = useCallback(
    (timestamp: number) => {
      if (!state.isPlaying || !state.activeTransition) return

      const deltaTime = timestamp - lastUpdateRef.current
      lastUpdateRef.current = timestamp

      // Вычисляем новый прогресс
      const progressDelta = deltaTime / 1000 / state.activeTransition.duration
      const newProgress = Math.min(state.progress + progressDelta, 1)

      setState((prev) => ({
        ...prev,
        progress: newProgress,
      }))

      // Продолжаем анимацию или зацикливаем
      if (newProgress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else if (loop) {
        setState((prev) => ({ ...prev, progress: 0 }))
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setState((prev) => ({ ...prev, isPlaying: false }))
      }
    },
    [state.activeTransition, state.isPlaying, state.progress, loop],
  )

  // Управление предпросмотром
  const startPreview = useCallback(() => {
    if (!state.activeTransition) return

    setState((prev) => ({ ...prev, isPlaying: true }))

    if (!animationRef.current) {
      lastUpdateRef.current = performance.now()
      animationRef.current = requestAnimationFrame(animate)
    }
  }, [state.activeTransition, animate])

  const stopPreview = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: false }))

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  const seekToTime = useCallback(
    (time: number) => {
      const transitionData = getTransitionAtTime(time)

      if (transitionData) {
        const transitionStart = transitionData.transition.startTime ?? transitionData.transition.position
        setState((prev) => ({
          ...prev,
          activeTransition: transitionData.transition,
          progress: transitionData.progress,
          startTime: transitionStart,
          endTime: transitionStart + transitionData.transition.duration,
        }))
      }
    },
    [getTransitionAtTime],
  )

  // Обновление состояния при изменении времени или проекта
  useEffect(() => {
    updateState()
  }, [updateState])

  // Автозапуск предпросмотра
  useEffect(() => {
    if (autoPlay && state.activeTransition && !state.isPlaying) {
      startPreview()
    }
  }, [autoPlay, state.activeTransition, state.isPlaying, startPreview])

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return {
    state,
    startPreview,
    stopPreview,
    seekToTime,
    renderTransition,
    isTransitionActive,
    getTransitionAtTime,
  }
}

/**
 * Упрощённый хук для проверки активных переходов
 */
export function useActiveTransition() {
  const { project, currentTime } = useTimeline()

  return useMemo(() => {
    if (!project || !project.resources.timelineTransitions) return null

    // Ищем активный переход
    const sectionTracks = project.sections.flatMap((s) => s.tracks)
    const allTracks = [...sectionTracks, ...project.globalTracks]

    for (const track of allTracks) {
      // Skip tracks without clips
      if (!track.clips || track.clips.length === 0) continue

      // Collect transitions from all clips in this track
      const trackTransitionIds = track.clips.flatMap((clip) => clip.transitions.map((t) => t.id))

      const validTransitions = trackTransitionIds
        .map((id) => project.resources.timelineTransitions?.find((t) => t.id === id))
        .filter((t): t is TimelineTransition => t !== undefined && t !== null)

      for (const transition of validTransitions) {
        const transitionStart = transition.startTime ?? transition.position
        const transitionEnd = transitionStart + transition.duration
        if (currentTime >= transitionStart && currentTime <= transitionEnd) {
          const progress = (currentTime - transitionStart) / transition.duration
          return { transition, progress, trackId: track.id }
        }
      }
    }

    return null
  }, [project, currentTime])
}

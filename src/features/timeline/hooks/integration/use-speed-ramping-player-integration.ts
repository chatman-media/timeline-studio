/**
 * Хук для интеграции Speed Ramping с плеером
 */

import { useCallback, useEffect, useRef } from "react"

// import { usePlayer } from "@/features/video-player/hooks/use-player"

import type { TimelineClip, TimelineProject } from "../../types"
import { getSpeedAtTime } from "../../types/speed-ramping"
import { useTimeline } from "../state/use-timeline"

export interface SpeedRampingPlayerIntegration {
  /**
   * Обновить скорость воспроизведения на основе текущего времени
   */
  updatePlaybackRateForTime: (time: number) => void

  /**
   * Получить текущую скорость воспроизведения
   */
  getCurrentPlaybackRate: () => number

  /**
   * Сбросить скорость воспроизведения к нормальной
   */
  resetPlaybackRate: () => void

  /**
   * Проверить, активен ли speed ramping для текущего клипа
   */
  isSpeedRampingActive: (clipId: string) => boolean

  /**
   * Включить/выключить автоматическое обновление скорости
   */
  setAutoUpdateEnabled: (enabled: boolean) => void
}

export function useSpeedRampingPlayerIntegration(): SpeedRampingPlayerIntegration {
  // const { send: sendPlayer } = usePlayer()
  const sendPlayer = () => {} // Мок для отправки команд плееру
  const timeline = useTimeline()

  const autoUpdateEnabledRef = useRef(true)
  const lastPlaybackRateRef = useRef(1.0) // Исправлено: храним скорость воспроизведения
  const updateIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)

  /**
   * Проверяет, включен ли speed ramping для клипа
   */
  const isSpeedRampingEnabled = useCallback(
    (clipId: string): boolean => {
      if (!timeline.project?.speedRampingConfigs) return false

      const config = timeline.project.speedRampingConfigs[clipId]
      return config?.enabled ?? false
    },
    [timeline.project?.speedRampingConfigs],
  )

  /**
   * Получает скорость воспроизведения для времени в клипе
   */
  const getPlaybackRateForTime = useCallback(
    (clipId: string, clipTime: number): number => {
      if (!timeline.project?.speedRampingConfigs) return 1.0

      const config = timeline.project.speedRampingConfigs[clipId]
      if (!config?.enabled || !config.keyframes || config.keyframes.length === 0) {
        return 1.0
      }

      const clip = findClipById(timeline.project, clipId)
      const clipDuration = clip?.duration ?? 0

      return getSpeedAtTime(config.keyframes, clipTime, clipDuration)
    },
    [timeline.project?.speedRampingConfigs, timeline.project],
  )

  // Функция для обновления скорости воспроизведения
  const updatePlaybackRateForTime = useCallback(
    (time: number) => {
      if (!timeline.project || !autoUpdateEnabledRef.current) {
        return
      }

      // Находим активный клип на текущем времени
      const activeClip = findActiveClipAtTime(timeline.project, time)
      if (!activeClip) {
        resetPlaybackRate()
        return
      }

      // Проверяем, активен ли speed ramping для этого клипа
      if (!isSpeedRampingEnabled(activeClip.id)) {
        resetPlaybackRate()
        return
      }

      // Вычисляем время внутри клипа
      const clipTime = time - activeClip.startTime + activeClip.offset

      // Получаем скорость для этого времени
      const playbackRate = getPlaybackRateForTime(activeClip.id, clipTime)

      // Обновляем плеер только если скорость изменилась
      if (Math.abs(playbackRate - lastPlaybackRateRef.current) > 0.001) {
        sendPlayer()
        lastPlaybackRateRef.current = playbackRate
      }
    },
    [timeline.project, isSpeedRampingEnabled, getPlaybackRateForTime, sendPlayer],
  )

  // Получить текущую скорость воспроизведения
  const getCurrentPlaybackRate = useCallback(() => {
    return lastPlaybackRateRef.current
  }, [])

  // Сбросить скорость воспроизведения
  const resetPlaybackRate = useCallback(() => {
    sendPlayer()
    lastPlaybackRateRef.current = 1.0
  }, [sendPlayer])

  // Проверить, активен ли speed ramping для клипа
  const isSpeedRampingActive = useCallback(
    (clipId: string) => {
      return isSpeedRampingEnabled(clipId)
    },
    [isSpeedRampingEnabled],
  )

  // Включить/выключить автоматическое обновление
  const setAutoUpdateEnabled = useCallback(
    (enabled: boolean) => {
      autoUpdateEnabledRef.current = enabled

      if (enabled) {
        // Начинаем интервал обновления
        updateIntervalRef.current = setInterval(() => {
          const currentTime = timeline.currentTime
          updatePlaybackRateForTime(currentTime)
        }, 100) // Обновляем каждые 100ms
      } else {
        // Останавливаем интервал
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current)
          updateIntervalRef.current = undefined
        }
        resetPlaybackRate()
      }
    },
    [timeline.currentTime, updatePlaybackRateForTime, resetPlaybackRate],
  )

  // Автоматически обновляем скорость при изменении времени
  useEffect(() => {
    if (autoUpdateEnabledRef.current) {
      updatePlaybackRateForTime(timeline.currentTime)
    }
  }, [timeline.currentTime, updatePlaybackRateForTime])

  // Очищаем интервал при размонтировании
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [])

  return {
    updatePlaybackRateForTime,
    getCurrentPlaybackRate,
    resetPlaybackRate,
    isSpeedRampingActive,
    setAutoUpdateEnabled,
  }
}

// Утилита для поиска клипа по ID
function findClipById(project: TimelineProject, clipId: string): TimelineClip | null {
  // Ищем в глобальных треках
  if (project.globalTracks) {
    for (const track of project.globalTracks) {
      if (track.clips) {
        for (const clip of track.clips) {
          if (clip.id === clipId) {
            return clip
          }
        }
      }
    }
  }

  // Ищем в секциях
  if (project.sections) {
    for (const section of project.sections) {
      if (section.tracks) {
        for (const track of section.tracks) {
          if (track.clips) {
            for (const clip of track.clips) {
              if (clip.id === clipId) {
                return clip
              }
            }
          }
        }
      }
    }
  }

  return null
}

// Утилита для поиска активного клипа на определенном времени
function findActiveClipAtTime(project: TimelineProject, time: number): TimelineClip | null {
  // Ищем в глобальных треках
  if (project.globalTracks) {
    for (const track of project.globalTracks) {
      if (track.clips) {
        for (const clip of track.clips) {
          if (time >= clip.startTime && time < clip.startTime + clip.duration) {
            return clip
          }
        }
      }
    }
  }

  // Ищем в секциях
  if (project.sections) {
    for (const section of project.sections) {
      if (section.tracks) {
        for (const track of section.tracks) {
          if (track.clips) {
            for (const clip of track.clips) {
              if (time >= clip.startTime && time < clip.startTime + clip.duration) {
                return clip
              }
            }
          }
        }
      }
    }
  }

  return null
}

/**
 * Компонент для интеграции Speed Ramping с Timeline UI
 */

import { useEffect } from "react"

import { useSpeedRampingPlayerIntegration } from "../hooks/integration/use-speed-ramping-player-integration"
import { useTimeline } from "../hooks/state/use-timeline"

export function TimelineSpeedRampingIntegration() {
  const { isPlaying, currentTime } = useTimeline()
  const { updatePlaybackRateForTime, setAutoUpdateEnabled, resetPlaybackRate } = useSpeedRampingPlayerIntegration()

  // Автоматически включаем интеграцию при монтировании
  useEffect(() => {
    setAutoUpdateEnabled(true)

    return () => {
      setAutoUpdateEnabled(false)
    }
  }, [setAutoUpdateEnabled])

  // Обновляем скорость при изменении времени воспроизведения
  useEffect(() => {
    if (isPlaying) {
      updatePlaybackRateForTime(currentTime)
    }
  }, [currentTime, isPlaying, updatePlaybackRateForTime])

  // Сбрасываем скорость при паузе
  useEffect(() => {
    if (!isPlaying) {
      resetPlaybackRate()
    }
  }, [isPlaying, resetPlaybackRate])

  // Этот компонент не рендерит UI, только обрабатывает логику
  return null
}

/**
 * Индикатор текущей скорости воспроизведения
 */
export function SpeedRampingIndicator() {
  const { getCurrentPlaybackRate, isSpeedRampingActive } = useSpeedRampingPlayerIntegration()
  const { project } = useTimeline()

  const currentRate = getCurrentPlaybackRate()
  const hasActiveSpeedRamping = project
    ? project.globalTracks?.some((track) => track.clips?.some((clip) => isSpeedRampingActive(clip.id))) ||
      project.sections?.some((section) =>
        section.tracks?.some((track) => track.clips?.some((clip) => isSpeedRampingActive(clip.id))),
      )
    : false

  if (!hasActiveSpeedRamping || currentRate === 1.0) {
    return null
  }

  return (
    <div
      className="fixed top-4 right-4 bg-black/80 text-white px-3 py-1 rounded-md text-sm font-mono z-50"
      data-oid="_det_22"
    >
      <div className="flex items-center gap-2" data-oid="vpszwv-">
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" data-oid="a4a11ng" />
        <span data-oid="v56m5.3">Speed: {currentRate.toFixed(2)}x</span>
      </div>
    </div>
  )
}

/**
 * Компонент для отображения Speed Ramping статуса в Timeline
 */
export function TimelineSpeedRampingStatus() {
  const { project } = useTimeline()
  const { isSpeedRampingActive } = useSpeedRampingPlayerIntegration()

  const activeSpeedRampingClips = project
    ? [
        ...(project.globalTracks?.flatMap(
          (track) => track.clips?.filter((clip) => isSpeedRampingActive(clip.id)).map((clip) => clip.id) || [],
        ) || []),
        ...(project.sections?.flatMap(
          (section) =>
            section.tracks?.flatMap(
              (track) => track.clips?.filter((clip) => isSpeedRampingActive(clip.id)).map((clip) => clip.id) || [],
            ) || [],
        ) || []),
      ]
    : []

  if (activeSpeedRampingClips.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs" data-oid="6t:xrle">
      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" data-oid="m-asfpj" />
      <span data-oid="_zpku9c">
        Speed Ramping: {activeSpeedRampingClips.length} clip
        {activeSpeedRampingClips.length > 1 ? "s" : ""}
      </span>
    </div>
  )
}

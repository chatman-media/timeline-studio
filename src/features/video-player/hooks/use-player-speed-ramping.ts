import { useCallback } from "react"
import { usePlayer } from "@/domains/video-editing/providers"
import { logInfo } from "@/lib/tauri-logger"

export interface UsePlayerSpeedRampingReturn {
  // Состояние
  speedRampingEnabled: boolean
  currentPlaybackRate: number
  basePlaybackRate: number

  // Действия
  setSpeedRampingEnabled: (enabled: boolean) => void
  updatePlaybackRate: (rate: number) => void
  setBasePlaybackRate: (rate: number) => void
  resetToBaseRate: () => void
}

/**
 * Хук для управления speed ramping в video player
 */
export function usePlayerSpeedRamping(): UsePlayerSpeedRampingReturn {
  logInfo("[usePlayerSpeedRamping] Инициализация хука")

  const player = usePlayer()
  const { speedRampingEnabled, currentPlaybackRate, basePlaybackRate } = player

  const setSpeedRampingEnabled = useCallback(
    (enabled: boolean) => {
      player.setSpeedRampingEnabled(enabled)
    },
    [player],
  )

  const updatePlaybackRate = useCallback(
    (rate: number) => {
      player.updatePlaybackRate(rate)
    },
    [player],
  )

  const setBasePlaybackRate = useCallback(
    (rate: number) => {
      player.setBasePlaybackRate(rate)
    },
    [player],
  )

  const resetToBaseRate = useCallback(() => {
    player.updatePlaybackRate(basePlaybackRate)
  }, [player, basePlaybackRate])

  logInfo("[usePlayerSpeedRamping] Хук готов", {
    speedRampingEnabled,
    currentPlaybackRate,
    basePlaybackRate,
  })

  return {
    // Состояние
    speedRampingEnabled,
    currentPlaybackRate,
    basePlaybackRate,

    // Действия
    setSpeedRampingEnabled,
    updatePlaybackRate,
    setBasePlaybackRate,
    resetToBaseRate,
  }
}

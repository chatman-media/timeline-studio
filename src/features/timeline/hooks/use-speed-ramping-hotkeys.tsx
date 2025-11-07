import { useEffect } from "react"

import { shortcutsRegistry } from "@/features/keyboard-shortcuts"
import { createLogger } from "@/lib/tauri-logger"
import { useSpeedRamping } from "./use-speed-ramping"
import { useTimeline } from "./use-timeline"

const logger = createLogger({ module: "UseSpeedRampingHotkeys" })

export function useSpeedRampingHotkeys() {
  const { send, selectedClipIds } = useTimeline()
  const { resetToConstantSpeed } = useSpeedRamping()

  // Register keyboard shortcuts for speed ramping operations
  useEffect(() => {
    const shortcuts = [
      {
        id: "enable-speed-ramping",
        action: () => {
          const clipIds = selectedClipIds || []
          clipIds.forEach((clipId: string) => {
            send({ type: "ENABLE_SPEED_RAMPING", clipId })
          })
        },
      },
      {
        id: "reset-speed",
        action: () => {
          const clipIds = selectedClipIds || []
          clipIds.forEach((clipId: string) => {
            resetToConstantSpeed(clipId, 1.0)
          })
        },
      },
      {
        id: "speed-half",
        action: () => {
          const clipIds = selectedClipIds || []
          clipIds.forEach((clipId: string) => {
            resetToConstantSpeed(clipId, 0.5)
          })
        },
      },
      {
        id: "speed-double",
        action: () => {
          const clipIds = selectedClipIds || []
          clipIds.forEach((clipId: string) => {
            resetToConstantSpeed(clipId, 2.0)
          })
        },
      },
      {
        id: "speed-quad",
        action: () => {
          const clipIds = selectedClipIds || []
          clipIds.forEach((clipId: string) => {
            resetToConstantSpeed(clipId, 4.0)
          })
        },
      },
      {
        id: "reverse-speed",
        action: () => {
          const clipIds = selectedClipIds || []
          clipIds.forEach((clipId: string) => {
            // TODO: Implement reverse speed
            logger.info("Reverse speed for clip:", clipId)
          })
        },
      },
    ]

    // Регистрируем все shortcuts
    shortcuts.forEach(({ id, action }) => {
      shortcutsRegistry.updateAction(id, action)
    })

    // Очищаем actions при размонтировании
    return () => {
      shortcuts.forEach(({ id }) => {
        shortcutsRegistry.updateAction(id, undefined)
      })
    }
  }, [send, selectedClipIds, resetToConstantSpeed])

  return null
}

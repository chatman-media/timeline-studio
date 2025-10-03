import { useEffect } from "react"

import { useMidi } from "./use-midi"
import { useMixerState } from "./use-mixer-state"

/**
 * Hook that integrates MIDI with the mixer
 * Automatically applies MIDI parameter changes to mixer channels
 */
export function useMidiIntegration() {
  const { onParameterChange } = useMidi()
  const { setChannelVolume, setChannelPan, setMasterVolume, setMasterLimiterThreshold } = useMixerState()

  useEffect(() => {
    const unsubscribe = onParameterChange(({ parameter, value }) => {
      // Parse parameter path (e.g., "channel.1.volume")
      const parts = parameter.split(".")

      if (parts.length < 2) return

      const target = parts[0]

      if (target === "channel" && parts.length >= 3) {
        const channelIndex = Number.parseInt(parts[1], 10) - 1 // Convert to 0-based index
        const param = parts[2]

        if (Number.isNaN(channelIndex)) return

        switch (param) {
          case "volume":
            setChannelVolume(channelIndex, value)
            break
          case "pan":
            // Convert 0-1 to -1 to 1
            setChannelPan(channelIndex, value * 2 - 1)
            break
          default:
            // Ignore unknown parameters
            break
        }
      } else if (target === "master") {
        const param = parts.slice(1).join(".")

        switch (param) {
          case "volume":
            setMasterVolume(value)
            break
          case "limiter.threshold":
            // Convert 0-1 to dB range (-20 to 0)
            setMasterLimiterThreshold(-20 + value * 20)
            break
          default:
            // Ignore unknown parameters
            break
        }
      }
    })

    return unsubscribe
  }, [onParameterChange, setChannelVolume, setChannelPan, setMasterVolume, setMasterLimiterThreshold])
}

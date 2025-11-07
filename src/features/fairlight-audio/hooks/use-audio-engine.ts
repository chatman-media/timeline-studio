import { useCallback, useEffect, useRef, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { AudioEngine } from "../services/audio-engine"

const logger = createLogger({ module: "UseAudioEngine" })

export function useAudioEngine() {
  const engineRef = useRef<AudioEngine | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize engine on mount
  useEffect(() => {
    const engine = new AudioEngine()
    engineRef.current = engine

    void engine
      .initialize()
      .then(() => {
        setIsInitialized(true)
      })
      .catch((error: unknown) => {
        logger.error("Failed to initialize audio engine:", error)
      })

    return () => {
      engine.dispose()
      engineRef.current = null
      setIsInitialized(false)
    }
  }, [])

  const connectMediaElement = useCallback(
    (channelId: string, mediaElement: HTMLAudioElement) => {
      if (!engineRef.current || !isInitialized) return
      engineRef.current.connectMediaElement(channelId, mediaElement)
    },
    [isInitialized],
  )

  const updateChannelVolume = useCallback(
    (channelId: string, volume: number) => {
      if (!engineRef.current || !isInitialized) return
      engineRef.current.updateChannelVolume(channelId, volume)
    },
    [isInitialized],
  )

  const updateChannelPan = useCallback(
    (channelId: string, pan: number) => {
      if (!engineRef.current || !isInitialized) return
      engineRef.current.updateChannelPan(channelId, pan)
    },
    [isInitialized],
  )

  const muteChannel = useCallback(
    (channelId: string, muted: boolean) => {
      if (!engineRef.current || !isInitialized) return
      engineRef.current.muteChannel(channelId, muted)
    },
    [isInitialized],
  )

  const soloChannel = useCallback(
    (channelId: string, solo: boolean) => {
      if (!engineRef.current || !isInitialized) return
      engineRef.current.soloChannel(channelId, solo)
    },
    [isInitialized],
  )

  const updateMasterVolume = useCallback(
    (volume: number) => {
      if (!engineRef.current || !isInitialized) return
      engineRef.current.updateMasterVolume(volume)
    },
    [isInitialized],
  )

  const enableLimiter = useCallback(
    (enabled: boolean) => {
      if (!engineRef.current || !isInitialized) return
      engineRef.current.enableLimiter(enabled)
    },
    [isInitialized],
  )

  const setLimiterThreshold = useCallback(
    (threshold: number) => {
      if (!engineRef.current || !isInitialized) return
      engineRef.current.setLimiterThreshold(threshold)
    },
    [isInitialized],
  )

  const createChannel = useCallback(
    (channelId: string) => {
      if (!engineRef.current || !isInitialized) return null
      return engineRef.current.createChannel(channelId)
    },
    [isInitialized],
  )

  const getChannelAnalyser = useCallback(
    (channelId: string) => {
      if (!engineRef.current || !isInitialized) return null
      return engineRef.current.getChannelAnalyser(channelId)
    },
    [isInitialized],
  )

  const getMasterAnalyser = useCallback(() => {
    if (!engineRef.current || !isInitialized) return null
    return engineRef.current.getMasterAnalyser()
  }, [isInitialized])

  return {
    engine: engineRef.current,
    isInitialized,
    connectMediaElement,
    updateChannelVolume,
    updateChannelPan,
    muteChannel,
    soloChannel,
    updateMasterVolume,
    enableLimiter,
    setLimiterThreshold,
    createChannel,
    getChannelAnalyser,
    getMasterAnalyser,
  }
}

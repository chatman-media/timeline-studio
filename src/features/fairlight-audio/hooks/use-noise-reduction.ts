/**
 * Hook for noise reduction functionality
 * Manages noise reduction engine and processing
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import {
  type AnalysisResult,
  type NoiseProfile,
  type NoiseReductionConfig,
  NoiseReductionEngine,
} from "../services/noise-reduction/noise-reduction-engine"

const logger = createLogger("UseNoiseReduction")

interface UseNoiseReductionProps {
  audioContext?: AudioContext
  enabled?: boolean
}

interface UseNoiseReductionReturn {
  engine: NoiseReductionEngine | null
  profiles: NoiseProfile[]
  isProcessing: boolean
  analysisResult: AnalysisResult | null
  createProcessor: (config: NoiseReductionConfig) => AudioNode | null
  analyzeNoise: (audioBuffer: AudioBuffer) => Promise<NoiseProfile>
  analyzeAudio: (audioBuffer: AudioBuffer) => Promise<AnalysisResult>
  processFile: (audioBuffer: AudioBuffer, config: NoiseReductionConfig, profileId?: string) => Promise<AudioBuffer>
  deleteProfile: (profileId: string) => void
}

export function useNoiseReduction({
  audioContext,
  enabled = true,
}: UseNoiseReductionProps = {}): UseNoiseReductionReturn {
  const [engine, setEngine] = useState<NoiseReductionEngine | null>(null)
  const [profiles, setProfiles] = useState<NoiseProfile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const engineRef = useRef<NoiseReductionEngine | null>(null)

  // Initialize engine
  useEffect(() => {
    if (!enabled || !audioContext) {
      return
    }

    const noiseEngine = new NoiseReductionEngine(audioContext)
    engineRef.current = noiseEngine
    setEngine(noiseEngine)

    // Setup event listeners
    noiseEngine.on("profileCreated", (profile: NoiseProfile) => {
      setProfiles((prev) => [...prev, profile])
    })

    noiseEngine.on("processingStarted", () => {
      setIsProcessing(true)
    })

    noiseEngine.on("processingCompleted", () => {
      setIsProcessing(false)
    })

    noiseEngine.on("processingError", (error) => {
      logger.error("Noise reduction error:", { error })
      setIsProcessing(false)
    })

    return () => {
      noiseEngine.dispose()
      engineRef.current = null
      setEngine(null)
    }
  }, [audioContext, enabled])

  // Create processor
  const createProcessor = useCallback(
    (config: NoiseReductionConfig): AudioNode | null => {
      if (!engine) return null

      try {
        return engine.createProcessor(config)
      } catch (error) {
        logger.error("Failed to create noise processor:", { error })
        return null
      }
    },
    [engine],
  )

  // Analyze noise profile
  const analyzeNoise = useCallback(
    async (audioBuffer: AudioBuffer): Promise<NoiseProfile> => {
      if (!engine) {
        throw new Error("Noise reduction engine not initialized")
      }

      return engine.analyzeNoise(audioBuffer)
    },
    [engine],
  )

  // Analyze audio
  const analyzeAudio = useCallback(
    async (audioBuffer: AudioBuffer): Promise<AnalysisResult> => {
      if (!engine) {
        throw new Error("Noise reduction engine not initialized")
      }

      const result = await engine.analyzeAudio(audioBuffer)
      setAnalysisResult(result)
      return result
    },
    [engine],
  )

  // Process file
  const processFile = useCallback(
    async (audioBuffer: AudioBuffer, config: NoiseReductionConfig, profileId?: string): Promise<AudioBuffer> => {
      if (!engine) {
        throw new Error("Noise reduction engine not initialized")
      }

      return engine.processFile(audioBuffer, config, profileId)
    },
    [engine],
  )

  // Delete profile
  const deleteProfile = useCallback((profileId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId))
  }, [])

  return {
    engine,
    profiles,
    isProcessing,
    analysisResult,
    createProcessor,
    analyzeNoise,
    analyzeAudio,
    processFile,
    deleteProfile,
  }
}

/**
 * Hook for channel-specific noise reduction
 */
export function useChannelNoiseReduction(_channelId: string, audioContext?: AudioContext) {
  const noiseReduction = useNoiseReduction({ audioContext })
  const [processor, setProcessor] = useState<AudioNode | null>(null)
  const [config, setConfig] = useState<NoiseReductionConfig>({
    algorithm: "spectral",
    strength: 50,
    preserveVoice: true,
    attackTime: 10,
    releaseTime: 100,
    frequencySmoothing: 0.5,
    noiseFloor: -60,
    gateThreshold: -40,
  })

  // Create/update processor when config changes
  useEffect(() => {
    if (!noiseReduction.engine || !config) {
      return
    }

    const newProcessor = noiseReduction.createProcessor(config)
    setProcessor(newProcessor)

    return () => {
      // Cleanup old processor if needed
      if (processor && "disconnect" in processor) {
        processor.disconnect()
      }
    }
  }, [noiseReduction.engine, config])

  return {
    ...noiseReduction,
    processor,
    config,
    setConfig,
  }
}

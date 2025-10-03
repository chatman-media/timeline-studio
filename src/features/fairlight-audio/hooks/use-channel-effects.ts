import { useCallback, useEffect, useRef } from "react"
import type { Effect, EffectType } from "../components/effects/effects-rack"
import type { AudioEngine } from "../services/audio-engine"
import { CompressorProcessor } from "../services/effects/compressor-processor"
import { EqualizerProcessor } from "../services/effects/equalizer-processor"
import { ReverbProcessor } from "../services/effects/reverb-processor"

interface EffectProcessor {
  processor: EqualizerProcessor | CompressorProcessor | ReverbProcessor
  type: EffectType
}

export function useChannelEffects(engine: AudioEngine | null, channelId: string) {
  const effectsRef = useRef<Map<string, EffectProcessor>>(new Map())

  const addEffect = useCallback(
    (effect: Effect) => {
      if (!engine) return

      const context = engine.audioContext
      let processor: EqualizerProcessor | CompressorProcessor | ReverbProcessor

      switch (effect.type) {
        case "equalizer":
          processor = new EqualizerProcessor(context, [
            { frequency: 60, gain: 0, q: 0.7, type: "highshelf" },
            { frequency: 150, gain: 0, q: 0.7, type: "peaking" },
            { frequency: 400, gain: 0, q: 0.7, type: "peaking" },
            { frequency: 1000, gain: 0, q: 0.7, type: "peaking" },
            { frequency: 3000, gain: 0, q: 0.7, type: "peaking" },
            { frequency: 8000, gain: 0, q: 0.7, type: "peaking" },
            { frequency: 12000, gain: 0, q: 0.7, type: "lowshelf" },
          ])
          break

        case "compressor":
          processor = new CompressorProcessor(context, {
            threshold: -24,
            ratio: 4,
            attack: 10,
            release: 100,
            knee: 2.5,
            makeup: 0,
          })
          break

        case "reverb":
          processor = new ReverbProcessor(context, {
            roomSize: 50,
            decay: 2,
            damping: 50,
            predelay: 20,
            wetLevel: 30,
            dryLevel: 70,
            earlyLevel: 80,
            lateLevel: 80,
          })
          break

        default:
          throw new Error(`Unknown effect type: ${effect.type}`)
      }

      effectsRef.current.set(effect.id, { processor, type: effect.type })

      // Add to audio engine
      const effectIndex = effectsRef.current.size - 1
      engine.addEffect(channelId, processor.getInputNode(), effectIndex)
    },
    [engine, channelId],
  )

  const removeEffect = useCallback(
    (effectId: string) => {
      if (!engine) return

      const effectData = effectsRef.current.get(effectId)
      if (!effectData) return

      // Find effect index
      const effectIds = Array.from(effectsRef.current.keys())
      const index = effectIds.indexOf(effectId)

      if (index !== -1) {
        engine.removeEffect(channelId, index)
        effectData.processor.disconnect()
        effectsRef.current.delete(effectId)
      }
    },
    [engine, channelId],
  )

  const toggleEffect = useCallback((effectId: string, enabled: boolean) => {
    const effectData = effectsRef.current.get(effectId)
    if (!effectData) return

    effectData.processor.bypass(!enabled)
  }, [])

  const updateEffectParameter = useCallback((effectId: string, param: string, value: number) => {
    const effectData = effectsRef.current.get(effectId)
    if (!effectData) return

    switch (effectData.type) {
      case "equalizer":
        if (param.startsWith("band-")) {
          const bandIndex = Number.parseInt(param.replace("band-", ""), 10)
          const processor = effectData.processor as EqualizerProcessor
          processor.updateBand(bandIndex, { gain: value })
        }
        break

      case "compressor": {
        const compressor = effectData.processor as CompressorProcessor
        compressor.updateParameter(param as any, value)
        break
      }

      case "reverb": {
        const reverb = effectData.processor as ReverbProcessor
        reverb.updateParameter(param as any, value)
        break
      }

      default:
        // No action needed for unknown types
        break
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      effectsRef.current.forEach(({ processor }) => {
        processor.disconnect()
      })
      effectsRef.current.clear()
    }
  }, [])

  const getCompressorGainReduction = useCallback((effectId: string): number => {
    const effectData = effectsRef.current.get(effectId)
    if (!effectData || effectData.type !== "compressor") return 0

    const compressor = effectData.processor as CompressorProcessor
    return compressor.getGainReduction()
  }, [])

  return {
    addEffect,
    removeEffect,
    toggleEffect,
    updateEffectParameter,
    getCompressorGainReduction,
  }
}

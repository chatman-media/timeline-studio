import { Button } from "@/components/ui/button"
import { useModals } from "@/domains/system-integration"

import type { AppliedEffect } from "../types"

interface AudioEffectsEditorProps {
  clip?: any // TimelineClip
  track?: any // TimelineTrack
  onApplyEffects: (effects: AppliedEffect[]) => void
}

// Предустановленные аудио эффекты
const audioEffectPresets = {
  fadeIn: {
    id: "fade-in",
    name: "Fade In",
    type: "AudioFadeIn",
    enabled: true,
    params: { duration: 1.0 },
  },
  fadeOut: {
    id: "fade-out",
    name: "Fade Out",
    type: "AudioFadeOut",
    enabled: true,
    params: { duration: 1.0 },
  },
  equalizer: {
    id: "equalizer",
    name: "Equalizer",
    type: "AudioEqualizer",
    enabled: true,
    params: { gain_low: 0, gain_mid: 0, gain_high: 0 },
  },
  compressor: {
    id: "compressor",
    name: "Compressor",
    type: "AudioCompressor",
    enabled: true,
    params: { threshold: -20, ratio: 4, attack: 5, release: 50 },
  },
  reverb: {
    id: "reverb",
    name: "Reverb",
    type: "AudioReverb",
    enabled: true,
    params: { room_size: 0.5, damping: 0.5, wet: 0.3 },
  },
  delay: {
    id: "delay",
    name: "Delay",
    type: "AudioDelay",
    enabled: true,
    params: { delay: 0.5, decay: 0.3 },
  },
  normalize: {
    id: "normalize",
    name: "Normalize",
    type: "AudioNormalize",
    enabled: true,
    params: { target: -23 },
  },
  denoise: {
    id: "denoise",
    name: "Denoise",
    type: "AudioDenoise",
    enabled: true,
    params: { amount: 0.5 },
  },
}

export function AudioEffectsEditor({ clip, onApplyEffects }: AudioEffectsEditorProps) {
  const { openModal } = useModals()

  const handleOpen = () => {
    openModal("audio-effects", {
      clip,
      onApplyEffects,
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleOpen}>
      Аудио эффекты
    </Button>
  )
}

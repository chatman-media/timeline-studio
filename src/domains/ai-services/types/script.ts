/**
 * Script generation types
 */

// Script generation parameters
export interface ScriptGenerationParams {
  topic: string
  style: ScriptStyle
  duration: number // in seconds
  tone: "casual" | "professional" | "educational" | "entertaining"
  targetAudience: string
  language: string
  includeHooks: boolean
  includeCTA: boolean
  keywords?: string[]
  avoidTopics?: string[]
  references?: string[]
}

// Script style configuration
export interface ScriptStyle {
  format: ScriptFormat
  pacing: "slow" | "moderate" | "fast"
  structure: "linear" | "non-linear" | "episodic"
  narrativeStyle: "first-person" | "second-person" | "third-person" | "documentary"
  visualStyle?: "minimal" | "dynamic" | "cinematic"
  musicStyle?: "upbeat" | "calm" | "dramatic" | "none"
}

export type ScriptFormat = 
  | "video-essay"
  | "tutorial"
  | "vlog"
  | "documentary"
  | "commercial"
  | "story"
  | "news"
  | "review"

// Generated script output
export interface GeneratedScript {
  id: string
  title: string
  synopsis: string
  duration: number
  scenes: ScriptScene[]
  voiceover?: VoiceoverScript
  visuals: VisualGuide[]
  music: MusicGuide[]
  metadata: {
    generatedAt: Date
    model: string
    params: ScriptGenerationParams
  }
}

export interface ScriptScene {
  id: string
  number: number
  title: string
  duration: number
  description: string
  dialogue?: Dialogue[]
  actions: string[]
  visualNotes: string[]
  audioNotes: string[]
}

export interface Dialogue {
  speaker: string
  text: string
  emotion?: string
  timing?: {
    start: number
    end: number
  }
}

export interface VoiceoverScript {
  text: string
  segments: VoiceoverSegment[]
  totalWords: number
  estimatedDuration: number
}

export interface VoiceoverSegment {
  id: string
  text: string
  sceneId: string
  timing: {
    start: number
    end: number
  }
  emphasis?: string[]
  pace?: "slow" | "normal" | "fast"
}

export interface VisualGuide {
  sceneId: string
  shots: Shot[]
  transitions: Transition[]
  effects?: VisualEffect[]
}

export interface Shot {
  type: "wide" | "medium" | "close-up" | "extreme-close-up" | "aerial" | "pov"
  description: string
  duration: number
  movement?: "static" | "pan" | "tilt" | "dolly" | "zoom" | "tracking"
}

export interface Transition {
  type: "cut" | "fade" | "dissolve" | "wipe" | "match-cut"
  duration: number
  toScene: string
}

export interface VisualEffect {
  type: string
  description: string
  intensity: number
  timing: {
    start: number
    end: number
  }
}

export interface MusicGuide {
  sceneId: string
  mood: string
  genre?: string
  intensity: number
  timing: {
    start: number
    end: number
  }
}
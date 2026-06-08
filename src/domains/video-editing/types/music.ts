import type { TimelineClip } from "./timeline"

export interface MusicClip extends TimelineClip {
  bpm?: number
  key?: string
  genre?: string
  mood?: string
  energy?: number
  markers?: MusicMarker[]
  fadeIn?: {
    duration: number
    curve?: "linear" | "exponential" | "logarithmic"
  }
  fadeOut?: {
    duration: number
    curve?: "linear" | "exponential" | "logarithmic"
  }
  equalizer?: {
    bass: number
    mid: number
    treble: number
  }
  reverb?: number
  compression?: number
  syncToVideo?: boolean
  beatSync?: boolean
}

export interface MusicMarker {
  id: string
  time: number
  type: "intro" | "verse" | "chorus" | "bridge" | "outro" | "drop" | "break" | "custom"
  name?: string
  intensity?: number
}

export interface MusicFile {
  id: string
  name: string
  filePath: string
  duration: number
  sampleRate: number
  channels: number
  bitrate?: number
  format: string
  artist?: string
  album?: string
  bpm?: number
  key?: string
  genre?: string
  mood?: string
  energy?: number
  license?: "royalty-free" | "copyright" | "creative-commons" | "custom"
  licenseDetails?: string
  copyright?: string
  tags: string[]
  category?: string
  waveformData?: number[]
  spectrogramData?: number[][]
  analysisComplete?: boolean
  fileSize: number
  createdAt: Date
  updatedAt: Date
  lastUsed?: Date
}

export function isMusicClip(clip: TimelineClip): clip is MusicClip {
  return "bpm" in clip || "fadeIn" in clip || "fadeOut" in clip
}

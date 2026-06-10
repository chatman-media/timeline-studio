import type { VideoEffect } from "./effects"
import type { VideoFilter } from "./filters"
import type { TimelineClip, Track } from "./timeline"
import type { Transition } from "./transitions"

export type SequenceType = "main" | "nested" | "multicam" | "vr360"

export interface SequenceSettings {
  resolution: {
    width: number
    height: number
  }
  frameRate: number
  aspectRatio: string
  duration: number
  timebase?: {
    numerator: number
    denominator: number
  }
  audio: {
    sampleRate: number
    bitDepth: number
    channels: number
  }
  colorSpace?: "rec709" | "rec2020" | "p3" | "srgb"
  hdr?: {
    enabled: boolean
    type: "hlg" | "pq" | "dolby"
    maxLuminance?: number
  }
}

export interface SequenceMarker {
  id: string
  name: string
  time: number
  duration?: number
  color: string
  type: "standard" | "chapter" | "todo" | "comment"
  comment?: string
}

export interface HistoryState {
  id: string
  timestamp: Date
  action: string
  snapshot: any
  size: number
}

export interface MasterClip {
  id: string
  sequenceId: string
  name: string
  inPoint: number
  outPoint: number
  speed: number
}

export interface SequenceResources {
  effects: Map<string, VideoEffect>
  filters: Map<string, VideoFilter>
  transitions: Map<string, Transition>
  colorGrades: Map<string, ColorGrade>
  titles: Map<string, Title>
  generators: Map<string, Generator>
}

export interface ColorGrade {
  id: string
  name: string
  type: "basic" | "curves" | "wheels" | "lut"
  settings: any
  lutPath?: string
}

export interface Title {
  id: string
  type: "simple" | "lower-third" | "credits" | "animated"
  text: string
  style: {
    fontFamily: string
    fontSize: number
    fontWeight: string
    color: string
    backgroundColor?: string
    outline?: {
      width: number
      color: string
    }
    shadow?: {
      x: number
      y: number
      blur: number
      color: string
    }
  }
  animation?: {
    in: "fade" | "slide" | "typewriter" | "custom"
    out: "fade" | "slide" | "custom"
    duration: number
  }
  position: {
    x: number
    y: number
    anchor: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
  }
}

export interface Generator {
  id: string
  type: "solid" | "gradient" | "noise" | "bars" | "countdown"
  name: string
  settings: any
}

export interface SequenceComposition {
  tracks: Track[]
  masterClips: MasterClip[]
  automation?: AutomationRegion[]
}

export interface AutomationRegion {
  id: string
  parameter: string
  startTime: number
  endTime: number
  keyframes: Array<{
    time: number
    value: number
    curve: "linear" | "bezier" | "step"
  }>
}

export interface Sequence {
  id: string
  name: string
  type: SequenceType
  settings: SequenceSettings
  composition: SequenceComposition
  resources: SequenceResources
  markers: SequenceMarker[]
  history: HistoryState[]
  historyPosition: number
  metadata: {
    created: Date
    modified: Date
    thumbnail?: string
    notes?: string
    tags?: string[]
  }
  renderSettings?: {
    inPoint?: number
    outPoint?: number
    selectedTracks?: string[]
    useProxy?: boolean
  }
}

export interface SequenceOperations {
  createSequence(name: string, settings: SequenceSettings): Sequence
  duplicateSequence(sequence: Sequence): Sequence
  createNestedSequence(clips: TimelineClip[], name: string): Sequence
  exportToXML(sequence: Sequence): string
  importFromXML(xml: string): Sequence
  optimizeSequence(sequence: Sequence): Sequence
  analyzeSequence(sequence: Sequence): {
    duration: number
    clipCount: number
    trackCount: number
    effectCount: number
    issues: string[]
  }
}

import type { SubtitleAnimation, SubtitleInlineStyle, SubtitlePosition } from "./templates"

export interface Subtitle {
  id: string
  startTime: number
  endTime: number
  text: string
  style?: any
  speaker?: string
  confidence?: number
  language?: string
}

export interface SubtitleClip {
  id: string
  name: string
  type: "subtitle"
  mediaId: string
  mediaFile?: any
  trackId: string
  startTime: number
  duration: number
  mediaStartTime: number
  mediaEndTime: number
  offset: number
  mediaDuration?: number
  audioOffset?: number
  linkedClipId?: string
  isLinked?: boolean
  volume: number
  speed: number
  playbackRate?: number
  maintainPitch?: boolean
  isReversed: boolean
  speedRamping?: any
  position?: {
    x: number
    y: number
    width: number
    height: number
    rotation: number
    scaleX: number
    scaleY: number
  }
  opacity: number
  fadeIn?: {
    duration: number
    type?: "linear" | "exponential" | "logarithmic" | "cosine" | "ease-in" | "ease-out" | "ease-in-out"
    keyframes?: any[]
  }
  fadeOut?: {
    duration: number
    type?: "linear" | "exponential" | "logarithmic" | "cosine" | "ease-in" | "ease-out" | "ease-in-out"
    keyframes?: any[]
  }
  opacityKeyframes?: any[]
  templateId?: string
  templateCell?: number
  effects: any[]
  filters: any[]
  transitions: any[]
  styleTemplate?: any
  colorGrading?: any
  keyframes?: any[]
  isSelected: boolean
  isLocked: boolean
  createdAt: Date
  updatedAt: Date
  text: string
  subtitleStyleId?: string
  style?: SubtitleInlineStyle
  formatting?: SubtitleInlineStyle
  subtitlePosition?: SubtitlePosition
  animationIn?: SubtitleAnimation
  animationOut?: SubtitleAnimation
  wordWrap?: boolean
  maxWidth?: number
  enabled?: boolean
  sourceId?: string
  metadata?: Record<string, any>
}

export interface SubtitleImportResult {
  content: string
  format: string
  file_name: string
}

export interface SubtitleExportOptions {
  format: "srt" | "vtt" | "ass"
  content: string
  output_path: string
}

export interface SubtitleStyle {
  id: string
  name: string
  description?: string
  fontFamily: string
  fontSize: number
  fontWeight: "normal" | "bold" | "lighter" | "bolder" | number
  fontStyle: "normal" | "italic" | "oblique"
  textAlign: "left" | "center" | "right" | "justify"
  color: string
  backgroundColor?: string
  strokeColor?: string
  strokeWidth?: number
  textShadow?: {
    offsetX: number
    offsetY: number
    blur: number
    color: string
  }
  defaultPosition: {
    alignment:
      | "top-left"
      | "top-center"
      | "top-right"
      | "middle-left"
      | "middle-center"
      | "middle-right"
      | "bottom-left"
      | "bottom-center"
      | "bottom-right"
    marginX: number
    marginY: number
  }
  padding: {
    top: number
    right: number
    bottom: number
    left: number
  }
  borderRadius?: number
  maxWidth?: number
  wordWrap: boolean
  letterSpacing?: number
  lineHeight?: number
  defaultAnimationIn?: {
    type: "fade" | "slide" | "typewriter" | "scale" | "wave"
    duration: number
    easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"
  }
  defaultAnimationOut?: {
    type: "fade" | "slide" | "scale"
    duration: number
    easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"
  }
  isBuiltIn: boolean
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

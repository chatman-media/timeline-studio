export type SubtitleCategory = "basic" | "cinematic" | "stylized" | "minimal" | "animated" | "modern"

export type SubtitleComplexity = "basic" | "intermediate" | "advanced"

export type SubtitleTag =
  | "simple"
  | "clean"
  | "readable"
  | "elegant"
  | "professional"
  | "movie"
  | "bold"
  | "dramatic"
  | "neon"
  | "glow"
  | "futuristic"
  | "retro"
  | "vintage"
  | "minimal"
  | "modern"
  | "animated"
  | "typewriter"
  | "fade"
  | "gradient"
  | "colorful"
  | "fallback"

export interface SubtitleStyleTemplate {
  id: string
  name: string
  category: SubtitleCategory
  complexity: SubtitleComplexity
  tags: SubtitleTag[]
  description: {
    ru: string
    en: string
  }
  labels: {
    ru: string
    en: string
    es?: string
    fr?: string
    de?: string
  }
  style: {
    fontFamily?: string
    fontSize?: number
    fontWeight?: string | number
    fontStyle?: string
    color?: string
    backgroundColor?: string
    textShadow?: string
    letterSpacing?: number
    lineHeight?: number
    textAlign?: string
    padding?: string | number
    borderRadius?: string | number
    animation?: string
    textTransform?: string
    opacity?: number
    border?: string
    background?: string
    WebkitBackgroundClip?: string
    WebkitTextFillColor?: string
  }
}

export interface SubtitleCategoryInfo {
  id: string
  name: string
  description?: string
  styles: SubtitleStyleTemplate[]
}

export type SubtitleAnimationType =
  | "fade"
  | "slide"
  | "scale"
  | "typewriter"
  | "wave"
  | "bounce"
  | "shake"
  | "blink"
  | "dissolve"

export type SubtitleEasing = "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "elastic" | "bounce"

export type SubtitleDirection = "top" | "bottom" | "left" | "right" | "center"

export type SubtitleAlignment =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"

export interface SubtitleAnimation {
  type: SubtitleAnimationType
  duration: number
  delay?: number
  easing?: SubtitleEasing
  direction?: SubtitleDirection
}

export interface SubtitlePosition {
  alignment: SubtitleAlignment
  marginX?: number
  marginY?: number
}

export interface SubtitleInlineStyle {
  fontFamily?: string
  fontSize?: number
  fontWeight?: string | number
  fontStyle?: string
  color?: string
  backgroundColor?: string
  textShadow?: string
  textAlign?: string
  lineHeight?: number
  letterSpacing?: number
  textTransform?: string
  animation?: string
  background?: string
  WebkitBackgroundClip?: string
  WebkitTextFillColor?: string
  padding?: string
  borderRadius?: string
  strokeColor?: string
  strokeWidth?: number
  shadowColor?: string
  shadowX?: number
  shadowY?: number
  shadowBlur?: number
  backgroundOpacity?: number
  maxWidth?: number
}

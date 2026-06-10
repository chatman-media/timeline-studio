/**
 * Core-facing style template types used by UI slices.
 * Keep this file independent from domain packages so style-template UI can be
 * extracted without depending on video-editing domain type barrels.
 */

export interface StyleTemplate {
  id: string
  name: {
    ru: string
    en: string
  }
  category: "intro" | "outro" | "lower-third" | "title" | "transition" | "overlay"
  style: "modern" | "vintage" | "minimal" | "corporate" | "creative" | "cinematic"
  aspectRatio: "16:9" | "9:16" | "1:1"
  duration: number
  hasText: boolean
  hasAnimation: boolean
  thumbnail?: string
  previewVideo?: string
  tags?: {
    ru: string[]
    en: string[]
  }
  elements: TemplateElement[]
  description?: {
    ru: string
    en: string
  }
}

export interface TemplateElement {
  id: string
  type: "text" | "shape" | "image" | "video" | "animation" | "particle"
  name: {
    ru: string
    en: string
  }
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  timing: {
    start: number
    end: number
  }
  properties: ElementProperties
  animations?: Animation[]
}

export interface ElementProperties {
  opacity?: number
  rotation?: number
  scale?: number
  text?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  textAlign?: "left" | "center" | "right"
  fontWeight?: "normal" | "bold" | "light"
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  src?: string
  objectFit?: "contain" | "cover" | "fill"
  [key: string]: any
}

export interface Animation {
  id: string
  type: "fadeIn" | "fadeOut" | "slideIn" | "slideOut" | "scaleIn" | "scaleOut" | "bounce" | "shake"
  duration: number
  delay?: number
  easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"
  direction?: "left" | "right" | "up" | "down"
  properties?: Record<string, any>
}

export interface StyleTemplateCategory {
  id: string
  name: {
    ru: string
    en: string
  }
  description: {
    ru: string
    en: string
  }
  icon?: string
  templates: StyleTemplate[]
}

export interface StyleTemplateFilter {
  category?: string
  style?: string
  aspectRatio?: string
  hasText?: boolean
  hasAnimation?: boolean
  duration?: {
    min?: number
    max?: number
  }
}

export type StyleTemplateSortBy = "name" | "duration" | "category" | "style" | "recent"
export type StyleTemplateSortField = "name" | "duration" | "category" | "style"
export type StyleTemplateSortOrder = "asc" | "desc"

export type FilterCategory =
  | "color-correction"
  | "technical"
  | "cinematic"
  | "artistic"
  | "creative"
  | "vintage"

export type FilterComplexity = "basic" | "intermediate" | "advanced"

export type FilterTag =
  | "log"
  | "professional"
  | "standard"
  | "neutral"
  | "cinematic"
  | "portrait"
  | "landscape"
  | "vintage"
  | "warm"
  | "cold"
  | "dramatic"
  | "soft"
  | "vibrant"
  | "fallback"

export interface VideoFilter {
  id: string
  name: string
  category: FilterCategory
  complexity: FilterComplexity
  tags: FilterTag[]
  description: {
    en: string
    ru?: string
    es?: string
    fr?: string
    de?: string
  }
  labels: {
    en: string
    ru?: string
    es?: string
    fr?: string
    de?: string
  }
  params: {
    brightness?: number
    contrast?: number
    saturation?: number
    gamma?: number
    temperature?: number
    tint?: number
    hue?: number
    vibrance?: number
    shadows?: number
    highlights?: number
    blacks?: number
    whites?: number
    clarity?: number
    dehaze?: number
    vignette?: number
    grain?: number
  }
}

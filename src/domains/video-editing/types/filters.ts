// Категории фильтров
export type FilterCategory =
  | "color-correction" // Цветокоррекция
  | "technical" // Технические
  | "cinematic" // Кинематографические
  | "artistic" // Художественные
  | "creative" // Креативные
  | "vintage" // Винтажные

// Сложность фильтра
export type FilterComplexity = "basic" | "intermediate" | "advanced"

// Теги для фильтров
export type FilterTag =
  | "log" // Логарифмический
  | "professional" // Профессиональный
  | "standard" // Стандартный
  | "neutral" // Нейтральный
  | "cinematic" // Кинематографический
  | "portrait" // Портрет
  | "landscape" // Пейзаж
  | "vintage" // Винтажный
  | "warm" // Теплый
  | "cold" // Холодный
  | "dramatic" // Драматический
  | "soft" // Мягкий
  | "vibrant" // Яркий
  | "fallback" // Резервный

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

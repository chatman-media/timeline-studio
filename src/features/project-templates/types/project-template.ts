/**
 * Типы для шаблонов проектов
 */

/**
 * Базовый интерфейс шаблона проекта
 */
export interface ProjectTemplate {
  id: string
  name: {
    ru: string
    en: string
  }
  description?: {
    ru: string
    en: string
  }
  category: "youtube" | "social" | "podcast" | "tutorial" | "commercial" | "presentation"
  targetPlatform?: "youtube" | "instagram" | "tiktok" | "facebook" | "twitter" | "custom"
  thumbnail?: string
  previewVideo?: string
  tags?: {
    ru: string[]
    en: string[]
  }

  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3"
  estimatedDuration: number // в секундах

  structure: ProjectStructure
  placeholders: ProjectPlaceholders
  settings: ProjectSettings
}

/**
 * Структура проекта
 */
export interface ProjectStructure {
  sections: Section[]
  tracks: TrackConfig[]

  // Ссылки на шаблоны (ID шаблонов)
  multiCameraTemplates?: string[] // ID многокамерных шаблонов
  graphicsTemplates?: string[] // ID графических шаблонов (intro/outro/etc)
}

/**
 * Секция проекта (часть таймлайна)
 */
export interface Section {
  id: string
  type: "intro" | "content" | "outro" | "transition" | "chapter"
  name: {
    ru: string
    en: string
  }
  duration: number // в секундах
  templateId?: string // ID шаблона для этой секции
  position: number // позиция на таймлайне в секундах
  locked?: boolean // секция не может быть удалена
}

/**
 * Конфигурация трека
 */
export interface TrackConfig {
  id: string
  type: "video" | "audio" | "text" | "graphics"
  name: string
  locked?: boolean
  visible?: boolean
  height?: number
}

/**
 * Плейсхолдеры для заполнения проекта
 */
export interface ProjectPlaceholders {
  intro?: {
    duration: number
    templateId: string
    required?: boolean
  }
  outro?: {
    duration: number
    templateId: string
    required?: boolean
  }
  mainContent?: {
    minDuration: number
    maxDuration?: number
  }
  cuts?: {
    type: "manual" | "auto" | "beat-sync"
    positions?: number[] // позиции вырезок в секундах
  }
  music?: {
    required?: boolean
    loop?: boolean
  }
  chapters?: {
    auto?: boolean
    interval?: number // интервал между главами в секундах
  }
}

/**
 * Настройки проекта
 */
export interface ProjectSettings {
  resolution: {
    width: number
    height: number
  }
  frameRate: number
  aspectRatio: string
  audioSampleRate?: number
  audioChannels?: number
}

/**
 * Фильтры для шаблонов проектов
 */
export interface ProjectTemplateFilter {
  category?: string
  platform?: string
  aspectRatio?: string
  duration?: {
    min?: number
    max?: number
  }
}

/**
 * Сортировка шаблонов проектов
 */
export type ProjectTemplateSortBy = "name" | "duration" | "category" | "platform"
export type ProjectTemplateSortOrder = "asc" | "desc"

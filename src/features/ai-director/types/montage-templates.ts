/**
 * Шаблоны планов монтажа
 * Предопределенные паттерны для быстрого создания монтажа
 */

import type { MontageStyle, TransitionType } from "./montage-plan"

/**
 * Шаблон плана монтажа
 */
export interface MontageTemplate {
  id: string
  name: string
  description: string
  style: MontageStyle
  icon: string

  // Параметры шаблона
  parameters: MontageTemplateParameters

  // Правила для генерации клипов
  clipRules: ClipSelectionRules

  // Настройки переходов
  transitionRules: TransitionRules

  // Музыкальные настройки
  musicSettings?: {
    style: string
    volume: number
    fadeIn: number
    fadeOut: number
  }

  // Категория шаблона
  category: "social" | "promo" | "cinematic" | "tutorial" | "highlights" | "vlog" | "custom"

  // Теги для поиска
  tags: string[]

  isBuiltIn: boolean
  createdAt: Date
}

/**
 * Параметры шаблона
 */
export interface MontageTemplateParameters {
  // Целевая длительность
  targetDuration: number

  // Длительность клипа
  clipDuration: {
    min: number
    max: number
    preferred: number
  }

  // Количество клипов
  clipCount: {
    min: number
    max: number
    preferred: number
  }

  // Соотношение сторон
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:5"

  // FPS
  fps?: number
}

/**
 * Правила выбора клипов
 */
export interface ClipSelectionRules {
  // Приоритет качества (0-1, где 1 - только высокое качество)
  qualityThreshold: number

  // Требования к контенту
  contentRequirements: {
    faces?: boolean // Требуются лица
    movement?: boolean // Требуется движение
    audio?: boolean // Требуется аудио
    landscape?: boolean // Требуется альбомная ориентация
  }

  // Приоритет сцен
  scenePriority: {
    action: number // 0-1
    static: number // 0-1
    closeup: number // 0-1
    wide: number // 0-1
  }

  // Разнообразие
  diversity: {
    avoidRepetition: boolean // Избегать повторов одного файла
    mixSceneTypes: boolean // Смешивать типы сцен
  }
}

/**
 * Правила для переходов
 */
export interface TransitionRules {
  // Тип переходов по умолчанию
  defaultType: TransitionType

  // Длительность переходов
  duration: number

  // Вариативность переходов
  variety: {
    enabled: boolean // Использовать разные типы
    types: TransitionType[] // Допустимые типы
  }

  // Частота переходов (0-1, где 1 - между каждым клипом)
  frequency: number
}

/**
 * Встроенные шаблоны
 */
export const BUILT_IN_TEMPLATES: MontageTemplate[] = [
  {
    id: "instagram-reel",
    name: "Instagram Reel",
    description: "Быстрый динамичный ролик для Instagram с короткими клипами и быстрыми переходами",
    style: "dynamic",
    icon: "📱",
    category: "social",
    tags: ["instagram", "reel", "social", "short", "vertical"],
    parameters: {
      targetDuration: 30,
      clipDuration: { min: 1, max: 3, preferred: 2 },
      clipCount: { min: 10, max: 20, preferred: 15 },
      aspectRatio: "9:16",
      fps: 30,
    },
    clipRules: {
      qualityThreshold: 0.7,
      contentRequirements: {
        movement: true,
      },
      scenePriority: {
        action: 0.8,
        static: 0.2,
        closeup: 0.6,
        wide: 0.4,
      },
      diversity: {
        avoidRepetition: true,
        mixSceneTypes: true,
      },
    },
    transitionRules: {
      defaultType: "cut",
      duration: 0.3,
      variety: {
        enabled: true,
        types: ["cut", "wipe", "slide"],
      },
      frequency: 1.0,
    },
    musicSettings: {
      style: "upbeat",
      volume: 0.3,
      fadeIn: 1,
      fadeOut: 2,
    },
    isBuiltIn: true,
    createdAt: new Date(),
  },
  {
    id: "youtube-intro",
    name: "YouTube Intro",
    description: "Захватывающее интро для YouTube видео с кинематографичными переходами",
    style: "cinematic",
    icon: "🎬",
    category: "promo",
    tags: ["youtube", "intro", "cinematic", "professional"],
    parameters: {
      targetDuration: 15,
      clipDuration: { min: 2, max: 4, preferred: 3 },
      clipCount: { min: 4, max: 6, preferred: 5 },
      aspectRatio: "16:9",
      fps: 24,
    },
    clipRules: {
      qualityThreshold: 0.8,
      contentRequirements: {
        landscape: true,
      },
      scenePriority: {
        action: 0.7,
        static: 0.3,
        closeup: 0.4,
        wide: 0.6,
      },
      diversity: {
        avoidRepetition: true,
        mixSceneTypes: true,
      },
    },
    transitionRules: {
      defaultType: "cross_dissolve",
      duration: 0.8,
      variety: {
        enabled: true,
        types: ["cross_dissolve", "fade_to_black", "wipe"],
      },
      frequency: 1.0,
    },
    musicSettings: {
      style: "epic",
      volume: 0.4,
      fadeIn: 2,
      fadeOut: 3,
    },
    isBuiltIn: true,
    createdAt: new Date(),
  },
  {
    id: "highlight-reel",
    name: "Highlight Reel",
    description: "Нарезка лучших моментов с высокой энергией",
    style: "highlights",
    icon: "⭐",
    category: "highlights",
    tags: ["highlights", "best moments", "energetic"],
    parameters: {
      targetDuration: 60,
      clipDuration: { min: 3, max: 7, preferred: 5 },
      clipCount: { min: 8, max: 15, preferred: 12 },
      aspectRatio: "16:9",
      fps: 30,
    },
    clipRules: {
      qualityThreshold: 0.85,
      contentRequirements: {
        movement: true,
        audio: true,
      },
      scenePriority: {
        action: 0.9,
        static: 0.1,
        closeup: 0.5,
        wide: 0.5,
      },
      diversity: {
        avoidRepetition: true,
        mixSceneTypes: true,
      },
    },
    transitionRules: {
      defaultType: "cut",
      duration: 0.2,
      variety: {
        enabled: false,
        types: ["cut"],
      },
      frequency: 1.0,
    },
    musicSettings: {
      style: "energetic",
      volume: 0.35,
      fadeIn: 1,
      fadeOut: 2,
    },
    isBuiltIn: true,
    createdAt: new Date(),
  },
  {
    id: "vlog-summary",
    name: "Vlog Summary",
    description: "Сбалансированная нарезка для vlog с естественными переходами",
    style: "vlog",
    icon: "📹",
    category: "vlog",
    tags: ["vlog", "summary", "casual", "natural"],
    parameters: {
      targetDuration: 90,
      clipDuration: { min: 5, max: 12, preferred: 8 },
      clipCount: { min: 8, max: 12, preferred: 10 },
      aspectRatio: "16:9",
      fps: 30,
    },
    clipRules: {
      qualityThreshold: 0.6,
      contentRequirements: {
        faces: true,
        audio: true,
      },
      scenePriority: {
        action: 0.5,
        static: 0.5,
        closeup: 0.7,
        wide: 0.3,
      },
      diversity: {
        avoidRepetition: false,
        mixSceneTypes: true,
      },
    },
    transitionRules: {
      defaultType: "cross_dissolve",
      duration: 0.5,
      variety: {
        enabled: false,
        types: ["cross_dissolve"],
      },
      frequency: 0.8,
    },
    musicSettings: {
      style: "ambient",
      volume: 0.2,
      fadeIn: 3,
      fadeOut: 3,
    },
    isBuiltIn: true,
    createdAt: new Date(),
  },
  {
    id: "calm-montage",
    name: "Calm Montage",
    description: "Спокойный монтаж с длинными клипами и плавными переходами",
    style: "calm",
    icon: "🌊",
    category: "cinematic",
    tags: ["calm", "slow", "peaceful", "meditative"],
    parameters: {
      targetDuration: 120,
      clipDuration: { min: 8, max: 20, preferred: 12 },
      clipCount: { min: 6, max: 10, preferred: 8 },
      aspectRatio: "16:9",
      fps: 24,
    },
    clipRules: {
      qualityThreshold: 0.75,
      contentRequirements: {
        landscape: true,
      },
      scenePriority: {
        action: 0.2,
        static: 0.8,
        closeup: 0.3,
        wide: 0.7,
      },
      diversity: {
        avoidRepetition: true,
        mixSceneTypes: false,
      },
    },
    transitionRules: {
      defaultType: "cross_dissolve",
      duration: 1.5,
      variety: {
        enabled: false,
        types: ["cross_dissolve"],
      },
      frequency: 1.0,
    },
    musicSettings: {
      style: "ambient",
      volume: 0.25,
      fadeIn: 4,
      fadeOut: 5,
    },
    isBuiltIn: true,
    createdAt: new Date(),
  },
  {
    id: "tutorial-demo",
    name: "Tutorial Demo",
    description: "Четкая демонстрация для обучающих видео",
    style: "tutorial",
    icon: "📚",
    category: "tutorial",
    tags: ["tutorial", "educational", "clear", "step-by-step"],
    parameters: {
      targetDuration: 180,
      clipDuration: { min: 10, max: 30, preferred: 15 },
      clipCount: { min: 6, max: 12, preferred: 8 },
      aspectRatio: "16:9",
      fps: 30,
    },
    clipRules: {
      qualityThreshold: 0.7,
      contentRequirements: {
        audio: true,
      },
      scenePriority: {
        action: 0.6,
        static: 0.4,
        closeup: 0.8,
        wide: 0.2,
      },
      diversity: {
        avoidRepetition: false,
        mixSceneTypes: false,
      },
    },
    transitionRules: {
      defaultType: "cut",
      duration: 0,
      variety: {
        enabled: false,
        types: ["cut"],
      },
      frequency: 1.0,
    },
    isBuiltIn: true,
    createdAt: new Date(),
  },
]

/**
 * Получить шаблон по ID
 */
export function getTemplateById(id: string): MontageTemplate | null {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id) || null
}

/**
 * Получить шаблоны по категории
 */
export function getTemplatesByCategory(category: MontageTemplate["category"]): MontageTemplate[] {
  return BUILT_IN_TEMPLATES.filter((t) => t.category === category)
}

/**
 * Получить шаблоны по тегам
 */
export function searchTemplatesByTags(tags: string[]): MontageTemplate[] {
  return BUILT_IN_TEMPLATES.filter((template) => tags.some((tag) => template.tags.includes(tag.toLowerCase())))
}

/**
 * Получить все категории
 */
export function getAllCategories(): MontageTemplate["category"][] {
  return ["social", "promo", "cinematic", "tutorial", "highlights", "vlog", "custom"]
}

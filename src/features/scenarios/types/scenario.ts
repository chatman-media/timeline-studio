/**
 * Типы для сценариев монтажа
 */

/**
 * Базовый интерфейс сценария монтажа
 */
export interface Scenario {
  id: string
  name: {
    ru: string
    en: string
  }
  description: {
    ru: string
    en: string
  }
  category: "automation" | "structure" | "effects" | "workflow"
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedTime: number // в минутах
  thumbnail?: string
  icon?: string
  tags?: {
    ru: string[]
    en: string[]
  }

  requirements: ScenarioRequirements
  steps: ScenarioStep[]
  settings: ScenarioSettings
}

/**
 * Требования для выполнения сценария
 */
export interface ScenarioRequirements {
  minClips?: number
  maxClips?: number
  requiresIntro?: boolean
  requiresOutro?: boolean
  requiresMusic?: boolean
  requiresCuts?: boolean
  requiresMultiCamera?: boolean
  aiAssisted?: boolean
}

/**
 * Шаг сценария
 */
export interface ScenarioStep {
  id: string
  type: ScenarioStepType
  name: {
    ru: string
    en: string
  }
  description?: {
    ru: string
    en: string
  }
  config: StepConfig
  automation?: AutomationConfig
  validation?: StepValidation
  optional?: boolean
}

/**
 * Типы шагов сценария
 */
export type ScenarioStepType =
  | "select-clips" // Выбор клипов
  | "add-template" // Добавление шаблона
  | "add-intro" // Добавление интро
  | "add-outro" // Добавление аутро
  | "add-cuts" // Добавление вырезок
  | "add-music" // Добавление музыки
  | "analyze-audio" // Анализ аудио
  | "analyze-video" // Анализ видео
  | "apply-transitions" // Применение переходов
  | "apply-effects" // Применение эффектов
  | "sync-beats" // Синхронизация с битами
  | "auto-montage" // Автомонтаж
  | "add-chapters" // Добавление глав
  | "preview" // Предпросмотр

/**
 * Конфигурация шага
 */
export interface StepConfig {
  // Базовые настройки
  [key: string]: unknown

  // Для select-clips
  minClips?: number
  maxClips?: number
  allowedTypes?: Array<"video" | "audio" | "image">
  suggestedClips?: boolean

  // Для add-template
  templateType?: "graphics" | "multi-camera"
  category?: string
  position?: "start" | "end" | "after-cuts" | "custom"

  // Для add-cuts
  cutType?: "manual" | "auto" | "beat-sync"
  minCutDuration?: number
  maxCutDuration?: number
  transitionType?: "cut" | "fade" | "wipe" | "dissolve"

  // Для add-music
  required?: boolean
  style?: string
  analyzeBeats?: boolean

  // Для sync-beats
  cutOnBeat?: boolean
  randomize?: boolean

  // Для preview
  showTimeline?: boolean
  showWaveform?: boolean
  allowEdit?: boolean
}

/**
 * Настройки автоматизации шага
 */
export interface AutomationConfig {
  canAutomate: boolean
  aiAssisted?: boolean
  engine?: "ai-director" | "beat-detector" | "moment-analyzer" | "auto-cutter"
  params?: Record<string, unknown>
}

/**
 * Валидация шага
 */
export interface StepValidation {
  required: boolean
  validator?: (data: unknown) => boolean | string
  errorMessage?: {
    ru: string
    en: string
  }
}

/**
 * Настройки сценария
 */
export interface ScenarioSettings {
  allowSkipSteps?: boolean
  showPreview?: boolean
  saveProgress?: boolean
  undoSupport?: boolean
}

/**
 * Результат выполнения сценария
 */
export interface ScenarioResult {
  scenarioId: string
  status: "success" | "partial" | "failed" | "cancelled"
  completedSteps: string[]
  skippedSteps?: string[]
  failedSteps?: string[]
  output?: {
    projectData?: unknown
    timeline?: unknown
    metadata?: Record<string, unknown>
  }
  errors?: Array<{
    stepId: string
    message: string
  }>
  executionTime: number // в секундах
}

/**
 * Фильтры для сценариев
 */
export interface ScenarioFilter {
  category?: string
  difficulty?: string
  aiAssisted?: boolean
  estimatedTime?: {
    min?: number
    max?: number
  }
}

/**
 * Сортировка сценариев
 */
export type ScenarioSortBy = "name" | "difficulty" | "category" | "time"
export type ScenarioSortOrder = "asc" | "desc"

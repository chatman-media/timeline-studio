/**
 * AI Director Dashboard Types
 * Типы для центральной панели управления AI функциями
 */

export type AgentType =
  | "analysis" // Анализ видео/аудио
  | "montage" // Создание монтажа
  | "recognition" // Распознавание объектов/лиц
  | "transcription" // Транскрипция речи
  | "color" // Цветокоррекция
  | "export" // Экспорт и оптимизация

export type AgentStatus = "idle" | "running" | "completed" | "error" | "paused"

/**
 * Агент AI Director
 */
export interface AIAgent {
  id: string
  type: AgentType
  name: string
  description: string
  status: AgentStatus
  progress?: number // 0-100
  startedAt?: Date
  completedAt?: Date
  error?: string

  // Метаданные задачи
  task?: {
    type: string
    filesCount?: number
    currentFile?: string
    processedFiles?: number
  }

  // Результаты
  results?: {
    filesAnalyzed?: number
    montagesCreated?: number
    objectsDetected?: number
    duration?: number
  }
}

/**
 * Workflow шаблон
 */
export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: "social" | "professional" | "cinematic" | "tutorial"
  icon: string

  // Требуемые агенты
  agents: AgentType[]

  // Параметры
  parameters: {
    targetDuration?: number
    format?: "vertical" | "horizontal" | "square"
    platform?: "tiktok" | "youtube" | "instagram" | "universal"
  }

  // Теги
  tags: string[]
  isBuiltIn: boolean
}

/**
 * Статистика AI Director
 */
export interface DashboardStats {
  totalAnalysis: number
  totalMontages: number
  totalRecognitions: number
  totalExports: number

  // Время
  totalProcessingTime: number // В секундах
  averageProcessingTime: number

  // Сегодня
  todayAnalysis: number
  todayMontages: number
}

/**
 * Quick Action для быстрого запуска
 */
export interface QuickAction {
  id: string
  name: string
  description: string
  icon: string
  agentType: AgentType
  category: "analysis" | "creation" | "optimization"
  requiresFiles: boolean
  onClick: () => void
}

/**
 * Состояние Dashboard
 */
export interface DashboardState {
  agents: AIAgent[]
  activeWorkflow?: WorkflowTemplate
  stats: DashboardStats
  isLoading: boolean
  error?: string
}

/**
 * Встроенные workflow шаблоны
 */
export const BUILT_IN_WORKFLOWS: WorkflowTemplate[] = [
  {
    id: "tiktok-vertical",
    name: "TikTok/Reels",
    description: "Быстрый вертикальный контент для TikTok и Instagram Reels",
    category: "social",
    icon: "📱",
    agents: ["analysis", "montage", "export"],
    parameters: {
      targetDuration: 30,
      format: "vertical",
      platform: "tiktok",
    },
    tags: ["social", "vertical", "short-form"],
    isBuiltIn: true,
  },
  {
    id: "youtube-shorts",
    name: "YouTube Shorts",
    description: "Короткие вертикальные видео для YouTube",
    category: "social",
    icon: "🎬",
    agents: ["analysis", "montage", "transcription", "export"],
    parameters: {
      targetDuration: 60,
      format: "vertical",
      platform: "youtube",
    },
    tags: ["youtube", "vertical", "short-form"],
    isBuiltIn: true,
  },
  {
    id: "youtube-standard",
    name: "YouTube Video",
    description: "Полноформатное видео для YouTube с интро и титрами",
    category: "professional",
    icon: "📺",
    agents: ["analysis", "montage", "transcription", "color", "export"],
    parameters: {
      targetDuration: 600,
      format: "horizontal",
      platform: "youtube",
    },
    tags: ["youtube", "horizontal", "long-form"],
    isBuiltIn: true,
  },
  {
    id: "highlights-reel",
    name: "Highlights Reel",
    description: "Нарезка лучших моментов",
    category: "professional",
    icon: "⭐",
    agents: ["analysis", "recognition", "montage"],
    parameters: {
      targetDuration: 90,
      format: "horizontal",
    },
    tags: ["highlights", "best-moments"],
    isBuiltIn: true,
  },
  {
    id: "cinematic-montage",
    name: "Cinematic Edit",
    description: "Кинематографичный монтаж с цветокоррекцией",
    category: "cinematic",
    icon: "🎥",
    agents: ["analysis", "montage", "color"],
    parameters: {
      targetDuration: 180,
      format: "horizontal",
    },
    tags: ["cinematic", "color-grading", "professional"],
    isBuiltIn: true,
  },
  {
    id: "tutorial-edit",
    name: "Tutorial Video",
    description: "Обучающее видео с титрами и четкой структурой",
    category: "tutorial",
    icon: "📚",
    agents: ["analysis", "transcription", "montage"],
    parameters: {
      targetDuration: 300,
      format: "horizontal",
    },
    tags: ["tutorial", "educational", "subtitles"],
    isBuiltIn: true,
  },
]

/**
 * Иконки для типов агентов
 */
export const AGENT_TYPE_ICONS: Record<AgentType, string> = {
  analysis: "🔍",
  montage: "✂️",
  recognition: "👁️",
  transcription: "💬",
  color: "🎨",
  export: "📤",
}

/**
 * Названия агентов
 */
export const AGENT_TYPE_NAMES: Record<AgentType, string> = {
  analysis: "Video Analysis",
  montage: "Smart Montage",
  recognition: "Object Recognition",
  transcription: "Speech-to-Text",
  color: "Color Grading",
  export: "Export Optimizer",
}

/**
 * Описания агентов
 */
export const AGENT_TYPE_DESCRIPTIONS: Record<AgentType, string> = {
  analysis: "Анализ сцен, качества и содержания видео",
  montage: "Автоматическое создание монтажа из материалов",
  recognition: "Распознавание объектов, лиц и действий",
  transcription: "Преобразование речи в текст с таймкодами",
  color: "Автоматическая цветокоррекция и стилизация",
  export: "Оптимизация и экспорт для платформ",
}

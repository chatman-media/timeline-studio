/**
 * AI Montage Plan Types
 * Структура плана монтажа, создаваемого AI Director
 */

/**
 * Стиль монтажа
 */
export type MontageStyle =
  | "dynamic" // Быстрый, энергичный
  | "calm" // Спокойный, медленный
  | "balanced" // Сбалансированный
  | "cinematic" // Кинематографический
  | "vlog" // Vlog стиль
  | "highlights" // Подборка лучших моментов
  | "tutorial" // Обучающий

/**
 * Тип перехода между клипами
 */
export type TransitionType =
  | "cut" // Прямая склейка
  | "cross_dissolve" // Затухание/появление
  | "fade_to_black" // Затухание в черный
  | "wipe" // Вытеснение
  | "slide" // Слайд

/**
 * Один клип в монтажном плане
 */
export interface MontageClip {
  /** ID файла из анализа */
  fileId: string
  /** Путь к файлу */
  filePath: string
  /** Начало фрагмента (секунды) */
  startTime: number
  /** Конец фрагмента (секунды) */
  endTime: number
  /** Длительность клипа (секунды) */
  duration: number
  /** Причина выбора этого фрагмента */
  reason: string
  /** Оценка качества (0-1) */
  qualityScore?: number
  /** Метаданные из анализа */
  metadata?: {
    hasAudio?: boolean
    hasFaces?: boolean
    hasObjects?: boolean
    mood?: string
    sceneType?: string
  }
}

/**
 * Переход между клипами
 */
export interface MontageTransition {
  /** Тип перехода */
  type: TransitionType
  /** Длительность перехода (секунды) */
  duration: number
  /** Позиция после какого клипа (индекс) */
  afterClipIndex?: number
  /** Время применения перехода (секунды в общем монтаже) */
  atTime?: number
}

/**
 * Настройки музыки
 */
export interface MontageMusicSettings {
  /** Стиль музыки */
  style?: string
  /** Громкость (0-1) */
  volume?: number
  /** Начало музыки (секунды) */
  startTime?: number
  /** Fade in длительность (секунды) */
  fadeIn?: number
  /** Fade out длительность (секунды) */
  fadeOut?: number
}

/**
 * Настройки текста/титров
 */
export interface MontageTextSettings {
  /** Текст */
  content: string
  /** Время начала (секунды в итоговом монтаже) */
  startTime: number
  /** Длительность показа (секунды) */
  duration: number
  /** Стиль текста */
  style?: "title" | "subtitle" | "caption" | "credit"
  /** Позиция */
  position?: "top" | "center" | "bottom"
}

/**
 * План монтажа, создаваемый AI
 */
export interface MontagePlan {
  /** ID плана */
  id: string
  /** Название/описание плана */
  name: string
  /** Стиль монтажа */
  style: MontageStyle
  /** Целевая длительность (секунды) */
  targetDuration: number
  /** Фактическая длительность (секунды) */
  actualDuration?: number
  /** Список клипов в порядке монтажа */
  clips: MontageClip[]
  /** Переходы между клипами */
  transitions: MontageTransition[]
  /** Настройки музыки (если нужна) */
  music?: MontageMusicSettings
  /** Настройки музыки (alias для совместимости) */
  musicSettings?: MontageMusicSettings
  /** Текстовые элементы */
  texts?: MontageTextSettings[]
  /** Настройки текста (alias для совместимости) */
  textSettings?: MontageTextSettings
  /** Общее описание плана */
  description?: string
  /** Дата создания */
  createdAt: Date
  /** Метаданные */
  metadata?: {
    /** Кол-во проанализированных файлов */
    sourceFilesCount: number
    /** Кол-во использованных файлов */
    usedFilesCount: number
    /** Процент использованного материала */
    usagePercentage?: number
  }
  /** Общая длительность (alias) */
  totalDuration?: number
}

/**
 * Запрос на создание монтажа от пользователя
 */
export interface MontageRequest {
  /** Текст запроса пользователя */
  userMessage: string
  /** Целевая длительность (если указана) */
  targetDuration?: number
  /** Предпочитаемый стиль */
  style?: MontageStyle
  /** Дополнительные параметры */
  parameters?: {
    /** Добавить музыку */
    addMusic?: boolean
    /** Стиль музыки */
    musicStyle?: string
    /** Добавить переходы */
    addTransitions?: boolean
    /** Добавить титры */
    addTitles?: boolean
    /** Минимальная длина клипа (секунды) */
    minClipDuration?: number
    /** Максимальная длина клипа (секунды) */
    maxClipDuration?: number
  }
}

/**
 * Статус создания монтажа
 */
export type MontageCreationStatus =
  | "idle"
  | "analyzing_request"
  | "selecting_clips"
  | "arranging_clips"
  | "adding_transitions"
  | "adding_music"
  | "completed"
  | "error"

/**
 * Состояние процесса создания монтажа
 */
export interface MontageCreationState {
  /** Текущий статус */
  status: MontageCreationStatus
  /** Прогресс (0-100) */
  progress: number
  /** Текущая операция */
  currentOperation?: string
  /** План монтажа (когда готов) */
  plan?: MontagePlan
  /** Ошибка (если есть) */
  error?: string
}

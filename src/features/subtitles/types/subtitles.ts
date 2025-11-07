// Категории стилей субтитров
export type SubtitleCategory =
  | "basic" // Базовые
  | "cinematic" // Кинематографические
  | "stylized" // Стилизованные
  | "minimal" // Минималистичные
  | "animated" // Анимированные
  | "modern" // Современные

// Сложность стиля субтитров
export type SubtitleComplexity = "basic" | "intermediate" | "advanced"

// Теги для стилей субтитров
export type SubtitleTag =
  | "simple" // Простой
  | "clean" // Чистый
  | "readable" // Читаемый
  | "elegant" // Элегантный
  | "professional" // Профессиональный
  | "movie" // Кинематографический
  | "bold" // Жирный
  | "dramatic" // Драматический
  | "neon" // Неоновый
  | "glow" // Свечение
  | "futuristic" // Футуристический
  | "retro" // Ретро
  | "vintage" // Винтажный
  | "minimal" // Минималистичный
  | "modern" // Современный
  | "animated" // Анимированный
  | "typewriter" // Печатная машинка
  | "fade" // Затухание
  | "gradient" // Градиент
  | "colorful" // Цветной
  | "fallback" // Резервный

/**
 * Интерфейс, описывающий стиль субтитров
 */
export interface SubtitleStyleTemplate {
  id: string // Уникальный идентификатор стиля
  name: string // Название стиля
  category: SubtitleCategory // Категория стиля
  complexity: SubtitleComplexity // Сложность стиля
  tags: SubtitleTag[] // Теги стиля
  description: {
    ru: string
    en: string
  } // Описание стиля
  labels: {
    ru: string
    en: string
    es?: string
    fr?: string
    de?: string
  } // Локализованные названия
  style: {
    fontFamily?: string // Семейство шрифта
    fontSize?: number // Размер шрифта
    fontWeight?: string | number // Жирность шрифта
    fontStyle?: string // Стиль шрифта (normal, italic)
    color?: string // Цвет текста
    backgroundColor?: string // Цвет фона
    textShadow?: string // Тень текста
    letterSpacing?: number // Межбуквенное расстояние
    lineHeight?: number // Высота строки
    textAlign?: string // Выравнивание текста
    padding?: string | number // Отступы
    borderRadius?: string | number // Скругление углов фона
    animation?: string // Анимация появления/исчезновения
    textTransform?: string // Трансформация текста (uppercase, lowercase, capitalize)
    opacity?: number // Прозрачность
    border?: string // Граница
    background?: string // Градиентный фон
    WebkitBackgroundClip?: string // Клип фона для градиентного текста
    WebkitTextFillColor?: string // Цвет заливки текста для градиентов
  } // CSS стили
}

/**
 * Интерфейс, описывающий объект категории стилей субтитров
 */
export interface SubtitleCategoryInfo {
  id: string // Уникальный идентификатор категории
  name: string // Название категории
  description?: string // Описание категории
  styles: SubtitleStyleTemplate[] // Список стилей в категории
}

/**
 * Интерфейс для субтитра с временными метками
 */
export interface Subtitle {
  id: string // Уникальный ID субтитра
  startTime: number // Время начала (в секундах)
  endTime: number // Время окончания (в секундах)
  text: string // Текст субтитра
  style?: SubtitleStyleTemplate // Стиль субтитра
  speaker?: string // Говорящий (если известно)
  confidence?: number // Уверенность распознавания (0-1)
  language?: string // Язык субтитра
}

/**
 * Типы анимаций субтитров (синхронизировано с Backend)
 */
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

/**
 * Функции сглаживания анимации
 */
export type SubtitleEasing = "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "elastic" | "bounce"

/**
 * Направление анимации
 */
export type SubtitleDirection = "top" | "bottom" | "left" | "right" | "center"

/**
 * Выравнивание субтитров
 */
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

/**
 * Интерфейс анимации субтитра
 */
export interface SubtitleAnimation {
  type: SubtitleAnimationType
  duration: number // В секундах
  delay?: number // Задержка перед началом
  easing?: SubtitleEasing
  direction?: SubtitleDirection // Для slide анимаций
}

/**
 * Интерфейс позиционирования субтитра
 */
export interface SubtitlePosition {
  alignment: SubtitleAlignment
  marginX?: number // Отступ по горизонтали в пикселях
  marginY?: number // Отступ по вертикали в пикселях
}

/**
 * Интерфейс стиля субтитра (inline переопределения)
 */
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
  // Дополнительные стили из Backend
  strokeColor?: string
  strokeWidth?: number
  shadowColor?: string
  shadowX?: number
  shadowY?: number
  shadowBlur?: number
  backgroundOpacity?: number
  maxWidth?: number // В процентах
}

/**
 * Унифицированный интерфейс для клипа субтитров на таймлайне
 * Объединяет функциональность из subtitles и timeline модулей
 * Расширяет базовый TimelineClip всеми необходимыми полями
 */
export interface SubtitleClip {
  // ============= БАЗОВЫЕ ПОЛЯ TIMELINECLIP =============
  id: string
  name: string
  type: "subtitle"

  // Связь с медиафайлом (для субтитров может быть пустым)
  mediaId: string
  mediaFile?: any // MediaFile для совместимости

  // Позиция на треке
  trackId: string
  startTime: number
  duration: number

  // Обрезка исходного медиа (для субтитров используем startTime и duration)
  mediaStartTime: number
  mediaEndTime: number
  offset: number
  mediaDuration?: number

  // J-Cut / L-Cut support (не применимо к субтитрам, но нужно для совместимости)
  audioOffset?: number
  linkedClipId?: string
  isLinked?: boolean

  // Настройки клипа (со значениями по умолчанию для субтитров)
  volume: number // 0-1 (не применимо к субтитрам, но нужно для совместимости)
  speed: number // Скорость воспроизведения
  playbackRate?: number
  maintainPitch?: boolean
  isReversed: boolean

  // Speed ramping (не применимо к субтитрам, но нужно для совместимости)
  speedRamping?: any

  // Визуальные настройки
  position?: {
    x: number
    y: number
    width: number
    height: number
    rotation: number
    scaleX: number
    scaleY: number
  }
  opacity: number // 0-1

  // Video fade эффекты (не применимо к субтитрам, но нужно для совместимости)
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

  // Keyframes для анимации opacity
  opacityKeyframes?: any[]

  // Шаблоны (не применимо к субтитрам, но нужно для совместимости)
  templateId?: string
  templateCell?: number

  // Применяемые ресурсы (пустые массивы для субтитров)
  effects: any[]
  filters: any[]
  transitions: any[]
  styleTemplate?: any
  colorGrading?: any

  // Keyframe анимации
  keyframes?: any[]

  // Состояние
  isSelected: boolean
  isLocked: boolean

  // Метаданные
  createdAt: Date
  updatedAt: Date

  // ============= СПЕЦИФИЧНЫЕ ПОЛЯ СУБТИТРОВ =============

  // Содержание субтитра
  text: string

  // Стиль субтитра
  subtitleStyleId?: string // Ссылка на стиль из ресурсов
  style?: SubtitleInlineStyle // Inline переопределения стиля
  formatting?: SubtitleInlineStyle // Альтернативное название для совместимости

  // Позиционирование субтитра
  subtitlePosition?: SubtitlePosition

  // Анимации
  animationIn?: SubtitleAnimation
  animationOut?: SubtitleAnimation

  // Дополнительные настройки субтитров
  wordWrap?: boolean
  maxWidth?: number // Максимальная ширина в процентах
  enabled?: boolean // Включен ли субтитр

  // Дополнительные поля для совместимости
  sourceId?: string
  metadata?: Record<string, any>
}

/**
 * Результат импорта файла субтитров
 */
export interface SubtitleImportResult {
  content: string
  format: string
  file_name: string
}

/**
 * Опции экспорта субтитров
 */
export interface SubtitleExportOptions {
  format: "srt" | "vtt" | "ass"
  content: string
  output_path: string
}

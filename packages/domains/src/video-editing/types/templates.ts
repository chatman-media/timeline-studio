/**
 * Типы для всех видов шаблонов (стили, медиа, субтитры)
 * Canonical source - domains/video-editing/types
 */

import type { JSX } from "react"

// ============================================================================
// STYLE TEMPLATES (из features/style-templates/types)
// ============================================================================

export interface StyleTemplate {
  id: string
  name: {
    ru: string
    en: string
  }
  category: "intro" | "outro" | "lower-third" | "title" | "transition" | "overlay"
  style: "modern" | "vintage" | "minimal" | "corporate" | "creative" | "cinematic"
  aspectRatio: "16:9" | "9:16" | "1:1"
  duration: number // Длительность в секундах
  hasText: boolean // Есть ли текстовые элементы
  hasAnimation: boolean // Есть ли анимация
  thumbnail?: string // Превью изображение
  previewVideo?: string // Превью видео
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
    x: number // В процентах от 0 до 100
    y: number // В процентах от 0 до 100
  }
  size: {
    width: number // В процентах от 0 до 100
    height: number // В процентах от 0 до 100
  }
  timing: {
    start: number // Время начала в секундах
    end: number // Время окончания в секундах
  }
  properties: ElementProperties
  animations?: Animation[]
}

export interface ElementProperties {
  // Общие свойства
  opacity?: number
  rotation?: number
  scale?: number

  // Для текста
  text?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  textAlign?: "left" | "center" | "right"
  fontWeight?: "normal" | "bold" | "light"

  // Для фигур
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number

  // Для изображений/видео
  src?: string
  objectFit?: "contain" | "cover" | "fill"

  // Дополнительные свойства
  [key: string]: any
}

export interface Animation {
  id: string
  type: "fadeIn" | "fadeOut" | "slideIn" | "slideOut" | "scaleIn" | "scaleOut" | "bounce" | "shake"
  duration: number // Длительность анимации в секундах
  delay?: number // Задержка перед началом
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

// Типы для фильтрации и сортировки
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

// ============================================================================
// MEDIA TEMPLATES (из features/templates/lib/template-config)
// ============================================================================

// Существующие интерфейсы
export interface SplitPoint {
  x: number // Координата X точки разделения (в процентах от 0 до 100)
  y: number // Координата Y точки разделения (в процентах от 0 до 100)
}

// Типы анимаций для панелей
export type AnimationType =
  | "fade" // Появление/исчезновение через прозрачность
  | "slide-left" // Слайд слева
  | "slide-right" // Слайд справа
  | "slide-up" // Слайд снизу вверх
  | "slide-down" // Слайд сверху вниз
  | "zoom-in" // Увеличение от центра
  | "zoom-out" // Уменьшение к центру
  | "flip-horizontal" // Переворот по горизонтали
  | "flip-vertical" // Переворот по вертикали
  | "none" // Без анимации

// Конфигурация анимации
export interface AnimationConfig {
  type: AnimationType
  duration?: number // Длительность в миллисекундах (по умолчанию 300ms)
  delay?: number // Задержка перед началом (по умолчанию 0ms)
  easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "cubic-bezier"
  cubicBezier?: [number, number, number, number] // Параметры для cubic-bezier
}

// Расширенная конфигурация ячейки
export interface CellConfiguration {
  // Существующие настройки
  fitMode?: "contain" | "cover" | "fill" // Режим масштабирования видео в ячейке
  alignX?: "left" | "center" | "right" // Горизонтальное выравнивание
  alignY?: "top" | "center" | "bottom" // Вертикальное выравнивание
  initialScale?: number // Начальный масштаб (1.0 = 100%)
  initialPosition?: { x: number; y: number } // Начальная позиция (в процентах от размера ячейки)

  // Настройки анимации
  animation?: {
    enter?: AnimationConfig // Анимация появления
    exit?: AnimationConfig // Анимация исчезновения
    transition?: AnimationConfig // Анимация при переключении между камерами
  }

  // Новые настройки для заголовка/номера ячейки
  title?: {
    show: boolean
    text?: string // Если не указан, используется номер
    position?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
    style?: {
      fontSize?: string
      color?: string
      fontWeight?: string
      opacity?: number
      fontFamily?: string
      transform?: string // Для трансформаций, включая смещения
      margin?: string // Для отступов
      padding?: string // Для внутренних отступов
    }
  }

  // Настройки фона
  background?: {
    color?: string
    gradient?: string
    image?: string
    opacity?: number
  }

  // Настройки границ
  border?: {
    width?: string
    color?: string
    style?: "solid" | "dashed" | "dotted"
    radius?: string
  }

  // Отступы
  padding?: string
  margin?: string
}

// Конфигурация разделительных линий
export interface DividerConfig {
  show?: boolean
  width?: string
  color?: string
  style?: "solid" | "dashed" | "dotted"
  dashArray?: string // Для более сложных паттернов (например, "5,10,5")
  opacity?: number
  shadow?: boolean
  shadowColor?: string
  shadowBlur?: string
}

// Глобальные настройки макета
export interface LayoutConfig {
  gap?: string // Расстояние между ячейками
  padding?: string // Внутренние отступы контейнера
  backgroundColor?: string
  borderRadius?: string
  containerStyle?: React.CSSProperties // Дополнительные стили контейнера

  // Настройки анимации при переключении layout
  layoutTransition?: {
    duration?: number // Длительность в миллисекундах (по умолчанию 500ms)
    easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"
  }
}

// Расширенная конфигурация расположения ячейки
export interface CellLayout {
  position?: "absolute" | "relative"
  top?: string
  left?: string
  right?: string
  bottom?: string
  width?: string
  height?: string
  flex?: string
  gridColumn?: string
  gridRow?: string
  zIndex?: number
}

// Новый интерфейс шаблона без метода render
export interface MediaTemplateConfig {
  id: string
  split: "vertical" | "horizontal" | "diagonal" | "custom" | "grid"
  resizable?: boolean // Флаг, указывающий, что шаблон поддерживает изменение размеров
  screens: number // Количество экранов в шаблоне
  splitPoints?: SplitPoint[] // Координаты точек разделения (для нестандартных разделений)
  splitPosition?: number // Позиция разделения в процентах (от 0 до 100)

  // Конфигурация ячеек
  cells?: CellConfiguration[] // Массив конфигураций для каждой ячейки

  // Расположение ячеек (для custom шаблонов)
  cellLayouts?: CellLayout[] // Массив расположений для каждой ячейки

  // Стили разделительных линий
  dividers?: DividerConfig

  // Глобальные настройки шаблона
  layout?: LayoutConfig

  // Настройки сетки (для grid шаблонов)
  gridConfig?: {
    columns: number
    rows: number
    columnGap?: string
    rowGap?: string
  }
}

// Интерфейс для обратной совместимости (временный)
export interface MediaTemplate extends MediaTemplateConfig {
  cellConfig?: CellConfiguration | CellConfiguration[] // Старое поле для совместимости
  render: () => JSX.Element // Временно оставляем для постепенной миграции
}

// Вспомогательные типы
export type TemplateAspectRatio = "landscape" | "portrait" | "square"

// ============================================================================
// SUBTITLE TEMPLATES (из features/subtitles/types)
// ============================================================================

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

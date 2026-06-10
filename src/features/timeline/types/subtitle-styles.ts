/**
 * Subtitle Styling types for Timeline
 * TODO: Consider migrating to @timeline-studio/domains/video-editing/types or @/features/subtitles/types
 */

/**
 * Стиль субтитров - определяет внешний вид и поведение субтитров
 */
export interface SubtitleStyle {
  id: string
  name: string
  description?: string

  // Шрифт и текст
  fontFamily: string
  fontSize: number // В пикселях
  fontWeight: "normal" | "bold" | "lighter" | "bolder" | number
  fontStyle: "normal" | "italic" | "oblique"
  textAlign: "left" | "center" | "right" | "justify"

  // Цвета
  color: string // Основной цвет текста
  backgroundColor?: string // Фон текста
  strokeColor?: string // Цвет обводки
  strokeWidth?: number // Толщина обводки

  // Тени и эффекты
  textShadow?: {
    offsetX: number
    offsetY: number
    blur: number
    color: string
  }

  // Позиционирование по умолчанию
  defaultPosition: {
    alignment:
      | "top-left"
      | "top-center"
      | "top-right"
      | "middle-left"
      | "middle-center"
      | "middle-right"
      | "bottom-left"
      | "bottom-center"
      | "bottom-right"
    marginX: number // Отступ по горизонтали в пикселях
    marginY: number // Отступ по вертикали в пикселях
  }

  // Размеры и отступы
  padding: {
    top: number
    right: number
    bottom: number
    left: number
  }
  borderRadius?: number
  maxWidth?: number // В процентах от ширины экрана

  // Поведение
  wordWrap: boolean
  letterSpacing?: number
  lineHeight?: number // Множитель (1.0 = нормальная высота)

  // Анимации по умолчанию
  defaultAnimationIn?: {
    type: "fade" | "slide" | "typewriter" | "scale" | "wave"
    duration: number
    easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"
  }

  defaultAnimationOut?: {
    type: "fade" | "slide" | "scale"
    duration: number
    easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"
  }

  // Метаданные
  isBuiltIn: boolean // Встроенный стиль (нельзя удалить)
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

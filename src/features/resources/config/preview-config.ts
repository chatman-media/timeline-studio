/**
 * Preview Configuration
 *
 * Централизованная конфигурация для размеров и настроек preview компонентов
 */

/**
 * Размеры preview элементов в ResourcesPanel
 */
export const PREVIEW_SIZES = {
  /** Ширина preview карточки */
  CARD_WIDTH: 110,
  /** Высота preview области (для медиа и эффектов) */
  PREVIEW_HEIGHT: 62,
  /** Высота компактного элемента (deprecated, теперь все используют preview стиль) */
  COMPACT_HEIGHT: 26,
} as const

/**
 * Размеры иконок в preview
 */
export const ICON_SIZES = {
  /** Большая иконка для preview области */
  LARGE: 32, // h-8 w-8
  /** Средняя иконка */
  MEDIUM: 16, // h-4 w-4
  /** Маленькая иконка для кнопок */
  SMALL: 12, // h-3 w-3
} as const

/**
 * Размеры шрифтов
 */
export const FONT_SIZES = {
  /** Название под preview */
  CARD_TITLE: 9, // text-[9px]
  /** Компактный текст */
  COMPACT_TEXT: 10, // text-[10px]
} as const

/**
 * Spacing и отступы
 */
export const SPACING = {
  /** Отступ между карточками */
  CARD_MARGIN_BOTTOM: 8, // mb-2
  /** Padding внутри названия */
  TITLE_PADDING_X: 6, // px-1.5
  TITLE_PADDING_Y: 4, // py-1
  /** Позиция кнопки удаления */
  DELETE_BUTTON_OFFSET: 4, // right-1 top-1
} as const

/**
 * Цветовые схемы для типов ресурсов
 */
export const RESOURCE_COLORS = {
  effect: {
    gradient: "from-purple-500/20 to-purple-700/20",
    border: "border-purple-500/30",
  },
  filter: {
    gradient: "from-blue-500/20 to-blue-700/20",
    border: "border-blue-500/30",
  },
  transition: {
    gradient: "from-green-500/20 to-green-700/20",
    border: "border-green-500/30",
  },
  template: {
    gradient: "from-orange-500/20 to-orange-700/20",
    border: "border-orange-500/30",
  },
  styleTemplate: {
    gradient: "from-pink-500/20 to-pink-700/20",
    border: "border-pink-500/30",
  },
  subtitle: {
    gradient: "from-yellow-500/20 to-yellow-700/20",
    border: "border-yellow-500/30",
  },
  default: {
    gradient: "from-gray-500/20 to-gray-700/20",
    border: "border-gray-500/30",
  },
} as const

/**
 * Transitions и анимации
 */
export const TRANSITIONS = {
  /** Длительность hover эффекта */
  HOVER_DURATION: 150, // duration-150
  /** Длительность fade анимации */
  FADE_DURATION: 150, // duration-150
} as const

/**
 * Z-index слои
 */
export const Z_INDEX = {
  /** Z-index для кнопки удаления */
  DELETE_BUTTON: 10,
} as const

/**
 * Preview Configuration для упрощенной архитектуры Resources
 *
 * Минималистичная конфигурация для горизонтального скролла превьюшек
 */

/**
 * Размеры thumbnail превьюшки
 */
export const THUMBNAIL_SIZES = {
  /** Размер превью */
  PREVIEW: 80, // 80x80px
  /** Общая ширина карточки (превью + padding) */
  CARD_WIDTH: 96, // 80px + 8px padding на стороны
  /** Высота карточки (превью + имя + отступы) */
  CARD_HEIGHT: 120, // 80px + 24px имя + 16px spacing
} as const

/**
 * Размеры иконок
 */
export const ICON_SIZES = {
  /** Иконка типа ресурса в превью */
  RESOURCE_ICON: 32, // 32x32px
  /** Иконка кнопки удаления */
  REMOVE_BUTTON: 12, // 12x12px
} as const

/**
 * Размеры шрифтов
 */
export const FONT_SIZES = {
  /** Имя ресурса под превью */
  NAME: 11, // 11px
  /** Badge типа ресурса */
  BADGE: 10, // 10px
} as const

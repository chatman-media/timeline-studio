/**
 * Единые константы размеров превью для всего приложения
 * Базовый размер: 200px
 */

/**
 * Допустимые размеры превью для всех типов контента
 * Начинаем со 125px и заканчиваем на 500px
 */
export const PREVIEW_SIZES = [125, 150, 200, 250, 300, 400, 500] as const

/**
 * Размер превью по умолчанию
 */
export const DEFAULT_SIZE = 200

/**
 * Минимальный размер превью
 */
export const MIN_SIZE = 125

/**
 * Максимальный размер превью
 */
export const MAX_SIZE = 500

/**
 * Индекс размера по умолчанию в массиве PREVIEW_SIZES
 */
export const DEFAULT_PREVIEW_SIZE_INDEX = 3 // 250px

/**
 * Тип для размеров превью
 */
export type PreviewSize = (typeof PREVIEW_SIZES)[number]

/**
 * Ключи для разных типов контента
 */
export type PreviewSizeKey =
  | "MEDIA"
  | "TRANSITIONS"
  | "TEMPLATES"
  | "EFFECTS"
  | "FILTERS"
  | "SUBTITLES"
  | "STYLE_TEMPLATES"
  | "MUSIC"

/**
 * Настройки размеров по умолчанию для разных типов контента
 */
export const DEFAULT_CONTENT_SIZES: Record<PreviewSizeKey, PreviewSize> = {
  MEDIA: 250, // Базовый размер для медиа
  TEMPLATES: 250, // Больше для шаблонов, чтобы лучше видеть детали
  STYLE_TEMPLATES: 250, // Средний размер для стилевых шаблонов
  EFFECTS: 250, // Базовый размер для эффектов
  FILTERS: 250, // Базовый размер для фильтров
  TRANSITIONS: 250, // Базовый размер для переходов
  SUBTITLES: 250, // Чуть больше для субтитров
  MUSIC: 250, // Базовый размер для музыки
}

/**
 * Получить индекс размера в массиве PREVIEW_SIZES
 */
export function getPreviewSizeIndex(size: PreviewSize): number {
  return PREVIEW_SIZES.indexOf(size)
}

/**
 * Получить размер по индексу
 */
export function getPreviewSizeByIndex(index: number): PreviewSize {
  return PREVIEW_SIZES[Math.max(0, Math.min(index, PREVIEW_SIZES.length - 1))]
}

/**
 * Получить следующий размер (больше)
 */
export function getNextPreviewSize(currentSize: PreviewSize): PreviewSize {
  const currentIndex = getPreviewSizeIndex(currentSize)
  const nextIndex = Math.min(currentIndex + 1, PREVIEW_SIZES.length - 1)
  return PREVIEW_SIZES[nextIndex]
}

/**
 * Получить предыдущий размер (меньше)
 */
export function getPreviousPreviewSize(currentSize: PreviewSize): PreviewSize {
  const currentIndex = getPreviewSizeIndex(currentSize)
  const prevIndex = Math.max(currentIndex - 1, 0)
  return PREVIEW_SIZES[prevIndex]
}

/**
 * Проверить, является ли размер валидным
 */
export function isValidPreviewSize(size: number): size is PreviewSize {
  return PREVIEW_SIZES.includes(size as PreviewSize)
}

/**
 * Найти ближайший валидный размер
 */
export function getClosestPreviewSize(targetSize: number): PreviewSize {
  if (targetSize <= MIN_SIZE) return MIN_SIZE as PreviewSize
  if (targetSize >= MAX_SIZE) return MAX_SIZE as PreviewSize

  let closest: PreviewSize = PREVIEW_SIZES[0]
  let minDiff = Math.abs(targetSize - closest)

  for (const size of PREVIEW_SIZES) {
    const diff = Math.abs(targetSize - size)
    if (diff < minDiff) {
      minDiff = diff
      closest = size
    }
  }

  return closest
}

/**
 * Вычислить размеры с учетом соотношения сторон
 * Для шаблонов минимум 150px по длинному краю
 */
export function calculateDimensionsWithAspectRatio(
  baseSize: number,
  aspectRatio: { width: number; height: number },
  isTemplate = false,
): { width: number; height: number } {
  const ratio = aspectRatio.width / aspectRatio.height

  let width: number
  let height: number

  // Для шаблонов устанавливаем минимум 150px по длинному краю
  const minTemplateSize = isTemplate ? 150 : 0
  const effectiveSize = isTemplate ? Math.max(baseSize, minTemplateSize) : baseSize

  if (ratio >= 1) {
    // Горизонтальное или квадратное - длинный край это ширина
    width = effectiveSize
    height = Math.round(effectiveSize / ratio)
  } else {
    // Вертикальное - длинный край это высота
    height = effectiveSize
    width = Math.round(effectiveSize * ratio)
  }

  return { width, height }
}

/**
 * Получить оптимальный размер для шаблонов в зависимости от количества экранов
 */
export function getOptimalTemplateSize(userPreferredSize: PreviewSize, screenCount: number): PreviewSize {
  // Для шаблонов с большим количеством экранов увеличиваем размер
  let multiplier = 1.0

  if (screenCount >= 25)
    multiplier = 1.5 // 5x5 сетка
  else if (screenCount >= 16)
    multiplier = 1.4 // 4x4 сетка
  else if (screenCount >= 9)
    multiplier = 1.3 // 3x3 сетка
  else if (screenCount >= 4) multiplier = 1.2 // 2x2 сетка

  const targetSize = Math.round(userPreferredSize * multiplier)
  return getClosestPreviewSize(targetSize)
}

/**
 * Вычислить количество колонок для сетки
 */
export function calculateGridColumns(containerWidth: number, previewSize: PreviewSize, gap = 16): number {
  const itemWidth = previewSize + gap
  return Math.max(1, Math.floor(containerWidth / itemWidth))
}

/**
 * Получить адаптивный размер в зависимости от ширины контейнера
 */
export function getResponsivePreviewSize(
  containerWidth: number,
  preferredSize: PreviewSize,
  minColumns = 2,
): PreviewSize {
  const gap = 16
  const availableWidth = containerWidth - gap * (minColumns - 1)
  const maxItemWidth = Math.floor(availableWidth / minColumns)

  if (preferredSize <= maxItemWidth) {
    return preferredSize
  }

  return getClosestPreviewSize(maxItemWidth)
}

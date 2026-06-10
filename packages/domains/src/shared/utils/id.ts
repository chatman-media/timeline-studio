/**
 * ID Generation Utilities
 *
 * Утилиты для генерации уникальных идентификаторов
 */

/**
 * Генерирует уникальный ID на основе timestamp и случайных чисел
 * @returns Уникальный строковый идентификатор
 *
 * @example
 * const id = generateId()
 * // => "1699876543210-a3f2c1"
 */
export function generateId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}`
}

/**
 * Генерирует UUID v4 (RFC 4122)
 * @returns UUID v4 строка
 *
 * @example
 * const uuid = generateUUID()
 * // => "550e8400-e29b-41d4-a716-446655440000"
 */
export function generateUUID(): string {
  // Используем crypto.randomUUID если доступен (современные браузеры и Node 16+)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback для старых окружений
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Генерирует короткий ID (8 символов)
 * Полезен для UI-элементов и временных идентификаторов
 *
 * @returns Короткий строковый идентификатор
 *
 * @example
 * const shortId = generateShortId()
 * // => "a3f2c1b4"
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10)
}

/**
 * Генерирует ID с префиксом
 * @param prefix - Префикс для идентификатора
 * @returns ID с префиксом
 *
 * @example
 * const clipId = generatePrefixedId('clip')
 * // => "clip-1699876543210-a3f2c1"
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}-${generateId()}`
}

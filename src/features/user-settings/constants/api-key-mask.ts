/**
 * Константы и утилиты для маскирования API ключей
 */

/**
 * Длина маски API ключа (количество символов)
 */
export const API_KEY_MASK_LENGTH = 54

/**
 * Символ, используемый для маскирования
 */
export const MASK_CHARACTER = "•"

/**
 * Предварительно созданная маска API ключа
 * Используется для отображения сохраненных ключей в UI
 */
export const API_KEY_MASK = MASK_CHARACTER.repeat(API_KEY_MASK_LENGTH)

/**
 * Создать маску API ключа заданной длины
 *
 * @param length - Длина маски (по умолчанию API_KEY_MASK_LENGTH)
 * @returns Строка маски
 *
 * @example
 * ```typescript
 * const mask = createApiKeyMask(32) // "••••••••••••••••••••••••••••••••"
 * ```
 */
export function createApiKeyMask(length: number = API_KEY_MASK_LENGTH): string {
  return MASK_CHARACTER.repeat(length)
}

/**
 * Проверить, является ли строка маской API ключа
 *
 * @param value - Проверяемая строка
 * @returns true если строка является маской
 *
 * @example
 * ```typescript
 * isApiKeyMask("••••••••") // true
 * isApiKeyMask("sk-abc123") // false
 * ```
 */
export function isApiKeyMask(value: string): boolean {
  if (!value) return false
  // Проверяем, что строка состоит только из символов маски
  return value.length > 0 && value.split("").every((char) => char === MASK_CHARACTER)
}

/**
 * Получить стандартную маску для отображения сохраненного ключа
 *
 * @returns Маска API ключа
 */
export function getApiKeyMask(): string {
  return API_KEY_MASK
}

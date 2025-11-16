/**
 * Validation Utilities
 *
 * Утилиты для валидации различных типов данных
 */

/**
 * Проверяет, является ли путь валидным
 * @param path - Путь для проверки
 * @returns true если путь валиден
 *
 * @example
 * isValidPath("/path/to/file.mp4") // => true
 * isValidPath("C:\\Users\\file.txt") // => true
 * isValidPath("") // => false
 * isValidPath("file?.txt") // => false (недопустимый символ)
 */
export function isValidPath(path: string): boolean {
  if (!path || typeof path !== "string") {
    return false
  }

  // Проверяем длину пути
  if (path.length === 0 || path.length > 4096) {
    return false
  }

  // Проверяем на недопустимые символы в имени файла
  // Разрешены: буквы, цифры, пробелы, точки, тире, подчёркивания, слеши, двоеточие (для Windows дисков)
  const invalidCharsRegex = /[<>"|?*\x00-\x1F]/

  // Разделяем путь на сегменты для проверки каждого
  const segments = path.split(/[/\\]/)

  for (const segment of segments) {
    // Пропускаем пустые сегменты (например, начальный / или \\)
    if (segment.length === 0) {
      continue
    }

    // Проверяем на недопустимые символы
    if (invalidCharsRegex.test(segment)) {
      return false
    }

    // Проверяем, что сегмент не является только точками
    if (/^\.+$/.test(segment) && segment.length > 2) {
      return false
    }
  }

  // Проверка для Windows путей (буква диска)
  const windowsDriveRegex = /^[A-Za-z]:[/\\]/
  if (windowsDriveRegex.test(path)) {
    return true
  }

  // Проверка для Unix путей (начинается с /)
  if (path.startsWith("/")) {
    return true
  }

  // Относительные пути
  return true
}

/**
 * Проверяет, является ли строка валидным URL
 * @param url - URL для проверки
 * @returns true если URL валиден
 *
 * @example
 * isValidUrl("https://example.com") // => true
 * isValidUrl("http://localhost:3000") // => true
 * isValidUrl("not-a-url") // => false
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false
  }

  try {
    const parsedUrl = new URL(url)
    // Проверяем, что протокол http или https
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Проверяет, является ли строка валидным email
 * @param email - Email для проверки
 * @returns true если email валиден
 *
 * @example
 * isValidEmail("user@example.com") // => true
 * isValidEmail("invalid.email") // => false
 * isValidEmail("@example.com") // => false
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false
  }

  // RFC 5322 упрощённая версия
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  return emailRegex.test(email)
}

/**
 * Проверяет, является ли строка валидным цветом
 * Поддерживает форматы: hex (#RGB, #RRGGBB, #RRGGBBAA), rgb(), rgba(), hsl(), hsla(), именованные цвета
 *
 * @param color - Цвет для проверки
 * @returns true если цвет валиден
 *
 * @example
 * isValidColor("#FF0000") // => true
 * isValidColor("#F00") // => true
 * isValidColor("rgb(255, 0, 0)") // => true
 * isValidColor("red") // => true
 * isValidColor("invalid") // => false
 */
export function isValidColor(color: string): boolean {
  if (!color || typeof color !== "string") {
    return false
  }

  const trimmed = color.trim().toLowerCase()

  // Проверка hex формата
  const hexRegex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/
  if (hexRegex.test(trimmed)) {
    return true
  }

  // Проверка rgb/rgba формата
  const rgbRegex = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*([0-9.]+)\s*)?\)$/
  const rgbMatch = trimmed.match(rgbRegex)
  if (rgbMatch) {
    const [, r, g, b, , a] = rgbMatch
    const rNum = Number.parseInt(r, 10)
    const gNum = Number.parseInt(g, 10)
    const bNum = Number.parseInt(b, 10)

    if (rNum > 255 || gNum > 255 || bNum > 255) {
      return false
    }

    if (a !== undefined) {
      const aNum = Number.parseFloat(a)
      if (aNum < 0 || aNum > 1) {
        return false
      }
    }

    return true
  }

  // Проверка hsl/hsla формата
  const hslRegex = /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*(,\s*([0-9.]+)\s*)?\)$/
  const hslMatch = trimmed.match(hslRegex)
  if (hslMatch) {
    const [, h, s, l, , a] = hslMatch
    const hNum = Number.parseInt(h, 10)
    const sNum = Number.parseInt(s, 10)
    const lNum = Number.parseInt(l, 10)

    if (hNum > 360 || sNum > 100 || lNum > 100) {
      return false
    }

    if (a !== undefined) {
      const aNum = Number.parseFloat(a)
      if (aNum < 0 || aNum > 1) {
        return false
      }
    }

    return true
  }

  // Проверка именованных цветов (основные CSS цвета)
  const namedColors = [
    "transparent",
    "black",
    "white",
    "red",
    "green",
    "blue",
    "yellow",
    "cyan",
    "magenta",
    "gray",
    "grey",
    "orange",
    "purple",
    "pink",
    "brown",
    "lime",
    "navy",
    "teal",
    "olive",
    "maroon",
    "silver",
    "gold",
  ]

  return namedColors.includes(trimmed)
}

/**
 * Проверяет, является ли число в заданном диапазоне
 * @param value - Число для проверки
 * @param min - Минимальное значение (включительно)
 * @param max - Максимальное значение (включительно)
 * @returns true если число в диапазоне
 *
 * @example
 * isInRange(5, 0, 10) // => true
 * isInRange(15, 0, 10) // => false
 * isInRange(-5, 0, 10) // => false
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return typeof value === "number" && !isNaN(value) && value >= min && value <= max
}

/**
 * Проверяет, является ли строка валидным JSON
 * @param json - Строка для проверки
 * @returns true если строка является валидным JSON
 */
export function isValidJson(json: string): boolean {
  if (!json || typeof json !== "string") {
    return false
  }

  try {
    JSON.parse(json)
    return true
  } catch {
    return false
  }
}

/**
 * Проверяет, является ли значение непустой строкой
 * @param value - Значение для проверки
 * @returns true если значение непустая строка
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

/**
 * Проверяет, является ли значение положительным числом
 * @param value - Значение для проверки
 * @returns true если значение положительное число
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && value > 0
}

/**
 * Проверяет, является ли значение неотрицательным числом
 * @param value - Значение для проверки
 * @returns true если значение неотрицательное число
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && value >= 0
}

/**
 * Проверяет, является ли файл по размеру допустимым
 * @param sizeInBytes - Размер файла в байтах
 * @param maxSizeInMB - Максимальный размер в мегабайтах
 * @returns true если размер файла допустим
 */
export function isValidFileSize(sizeInBytes: number, maxSizeInMB: number): boolean {
  if (!isNonNegativeNumber(sizeInBytes) || !isPositiveNumber(maxSizeInMB)) {
    return false
  }

  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return sizeInBytes <= maxSizeInBytes
}

/**
 * Проверяет, является ли строка валидным именем файла
 * @param fileName - Имя файла для проверки
 * @returns true если имя файла валидно
 */
export function isValidFileName(fileName: string): boolean {
  if (!isNonEmptyString(fileName)) {
    return false
  }

  // Проверяем длину
  if (fileName.length > 255) {
    return false
  }

  // Проверяем на недопустимые символы
  const invalidCharsRegex = /[<>:"/\\|?*\x00-\x1F]/
  if (invalidCharsRegex.test(fileName)) {
    return false
  }

  // Проверяем, что имя не является только точками
  if (/^\.+$/.test(fileName)) {
    return false
  }

  return true
}

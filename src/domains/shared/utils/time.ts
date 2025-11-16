/**
 * Time Formatting Utilities
 *
 * Утилиты для работы с временем и форматирования
 */

/**
 * Форматирует время из миллисекунд в строку формата HH:MM:SS или MM:SS
 * @param ms - Время в миллисекундах
 * @param options - Опции форматирования
 * @returns Отформатированная строка времени
 *
 * @example
 * formatTime(125000) // => "02:05"
 * formatTime(3725000) // => "01:02:05"
 * formatTime(125000, { showMilliseconds: true }) // => "02:05.000"
 * formatTime(125000, { alwaysShowHours: true }) // => "00:02:05"
 */
export function formatTime(
  ms: number,
  options: {
    showMilliseconds?: boolean
    alwaysShowHours?: boolean
    compact?: boolean
  } = {},
): string {
  const { showMilliseconds = false, alwaysShowHours = false, compact = false } = options

  // Защита от отрицательных значений
  const absMs = Math.abs(ms)
  const sign = ms < 0 ? "-" : ""

  const totalSeconds = Math.floor(absMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const milliseconds = Math.floor(absMs % 1000)

  const pad = (num: number, size = 2): string => num.toString().padStart(size, "0")

  let result = ""

  if (hours > 0 || alwaysShowHours) {
    result = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  } else {
    result = compact ? `${minutes}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
  }

  if (showMilliseconds) {
    result += `.${pad(milliseconds, 3)}`
  }

  return sign + result
}

/**
 * Парсит строку времени в миллисекунды
 * Поддерживает форматы: HH:MM:SS, MM:SS, SS, HH:MM:SS.mmm
 *
 * @param timeString - Строка времени для парсинга
 * @returns Время в миллисекундах или null если формат некорректный
 *
 * @example
 * parseTime("02:05") // => 125000
 * parseTime("01:02:05") // => 3725000
 * parseTime("02:05.500") // => 125500
 * parseTime("invalid") // => null
 */
export function parseTime(timeString: string): number | null {
  if (!timeString || typeof timeString !== "string") {
    return null
  }

  const trimmed = timeString.trim()

  // Проверка на отрицательное значение
  const isNegative = trimmed.startsWith("-")
  const cleaned = isNegative ? trimmed.substring(1) : trimmed

  // Разделяем основную часть и миллисекунды
  const [mainPart, msPart] = cleaned.split(".")
  const parts = mainPart.split(":").map((p) => Number.parseInt(p, 10))

  // Проверка корректности частей
  if (parts.some((p) => isNaN(p) || p < 0)) {
    return null
  }

  let totalMs = 0

  if (parts.length === 3) {
    // HH:MM:SS
    const [hours, minutes, seconds] = parts
    totalMs = hours * 3600000 + minutes * 60000 + seconds * 1000
  } else if (parts.length === 2) {
    // MM:SS
    const [minutes, seconds] = parts
    totalMs = minutes * 60000 + seconds * 1000
  } else if (parts.length === 1) {
    // SS
    totalMs = parts[0] * 1000
  } else {
    return null
  }

  // Добавляем миллисекунды если есть
  if (msPart) {
    const ms = Number.parseInt(msPart.padEnd(3, "0").substring(0, 3), 10)
    if (!isNaN(ms)) {
      totalMs += ms
    }
  }

  return isNegative ? -totalMs : totalMs
}

/**
 * Конвертирует секунды в миллисекунды
 * @param seconds - Время в секундах
 * @returns Время в миллисекундах
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000
}

/**
 * Конвертирует миллисекунды в секунды
 * @param ms - Время в миллисекундах
 * @returns Время в секундах
 */
export function msToSeconds(ms: number): number {
  return ms / 1000
}

/**
 * Форматирует длительность в человекочитаемую строку
 * @param ms - Время в миллисекундах
 * @returns Человекочитаемая строка (например, "2h 5m 30s")
 *
 * @example
 * formatDuration(125000) // => "2m 5s"
 * formatDuration(3725000) // => "1h 2m 5s"
 */
export function formatDuration(ms: number): string {
  const absMs = Math.abs(ms)
  const sign = ms < 0 ? "-" : ""

  const totalSeconds = Math.floor(absMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours}h`)
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`)
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}s`)
  }

  return sign + parts.join(" ")
}

/**
 * Проверяет, является ли строка валидным временным форматом
 * @param timeString - Строка для проверки
 * @returns true если формат валиден
 */
export function isValidTimeFormat(timeString: string): boolean {
  return parseTime(timeString) !== null
}

/**
 * Округляет время до ближайшего кадра
 * @param ms - Время в миллисекундах
 * @param fps - Количество кадров в секунду
 * @returns Округленное время в миллисекундах
 *
 * @example
 * roundToFrame(125, 30) // => 133 (ближайший кадр при 30fps)
 */
export function roundToFrame(ms: number, fps: number): number {
  if (fps <= 0) {
    return ms
  }

  const frameDuration = 1000 / fps
  return Math.round(ms / frameDuration) * frameDuration
}

/**
 * Конвертирует номер кадра в миллисекунды
 * @param frame - Номер кадра
 * @param fps - Количество кадров в секунду
 * @returns Время в миллисекундах
 */
export function frameToMs(frame: number, fps: number): number {
  if (fps <= 0) {
    return 0
  }
  return (frame / fps) * 1000
}

/**
 * Конвертирует миллисекунды в номер кадра
 * @param ms - Время в миллисекундах
 * @param fps - Количество кадров в секунду
 * @returns Номер кадра
 */
export function msToFrame(ms: number, fps: number): number {
  if (fps <= 0) {
    return 0
  }
  return Math.floor((ms / 1000) * fps)
}

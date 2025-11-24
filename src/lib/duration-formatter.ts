/**
 * Duration Formatting Utilities
 *
 * Стандартизированные функции для работы с длительностью (в секундах)
 * Duration всегда хранится как number (секунды) в приложении
 * Форматирование в строку используется только для отображения
 */

/**
 * Форматирует длительность из секунд в строку "HH:MM:SS" или "MM:SS"
 * Используется ТОЛЬКО для отображения в UI
 *
 * @param seconds - Длительность в секундах
 * @param showHours - Показывать ли часы (по умолчанию показывает если > 0)
 * @param padMinutes - Добавлять ли ведущий ноль для минут (по умолчанию false)
 * @returns Отформатированная строка времени (HH:MM:SS или MM:SS)
 *
 * @example
 * formatDurationSeconds(65) // => "1:05"
 * formatDurationSeconds(65, false, true) // => "01:05"
 * formatDurationSeconds(3665) // => "1:01:05"
 * formatDurationSeconds(0, false, true) // => "00:00"
 * formatDurationSeconds(3665, true) // => "01:01:05" (с паддингом)
 */
export function formatDurationSeconds(seconds: number, showHours?: boolean, padMinutes = false): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return padMinutes ? "00:00" : "0:00"
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  // Если showHours === true, всегда показываем часы
  if (showHours === true) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Если showHours === false, НИКОГДА не показываем часы (даже если > 0)
  if (showHours === false) {
    const totalMinutes = Math.floor(seconds / 60)
    const minutesStr = padMinutes ? totalMinutes.toString().padStart(2, "0") : totalMinutes.toString()
    return `${minutesStr}:${secs.toString().padStart(2, "0")}`
  }

  // Если showHours === undefined, показываем часы только если они есть (без leading zero для часов)
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Иначе только минуты и секунды
  const minutesStr = padMinutes ? minutes.toString().padStart(2, "0") : minutes.toString()
  return `${minutesStr}:${secs.toString().padStart(2, "0")}`
}

/**
 * Форматирует длительность из миллисекунд в строку "HH:MM:SS" или "MM:SS"
 * Используется ТОЛЬКО для отображения в UI
 *
 * @param ms - Длительность в миллисекундах
 * @param showHours - Показывать ли часы (по умолчанию показывает если > 0)
 * @param padMinutes - Добавлять ли ведущий ноль для минут (по умолчанию false)
 * @returns Отформатированная строка времени
 *
 * @example
 * formatDurationMs(65000) // => "1:05"
 * formatDurationMs(65000, false, true) // => "01:05"
 * formatDurationMs(3665000) // => "1:01:05"
 */
export function formatDurationMs(ms: number, showHours?: boolean, padMinutes = false): string {
  return formatDurationSeconds(Math.floor(ms / 1000), showHours, padMinutes)
}

/**
 * Форматирует длительность в человекочитаемый формат "2h 5m 30s"
 * Для использования в логах, описаниях и других текстовых местах
 *
 * @param seconds - Длительность в секундах
 * @returns Человекочитаемая строка (например, "2h 5m 30s")
 *
 * @example
 * formatDurationHuman(125) // => "2m 5s"
 * formatDurationHuman(3725) // => "1h 2m 5s"
 * formatDurationHuman(0) // => "0s"
 */
export function formatDurationHuman(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0s"
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours}h`)
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`)
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`)
  }

  return parts.join(" ")
}

/**
 * Парсит строку длительности в секунды
 * Поддерживает форматы: "01:23:45", "01:23", "123" (секунды)
 * Используется для конвертации сохраненных значений или импорта данных
 *
 * @param durationStr - Строка с длительностью или number
 * @returns Количество секунд или null если формат некорректный
 *
 * @example
 * parseDurationString("01:23:45") // => 5025
 * parseDurationString("01:23") // => 83
 * parseDurationString(65) // => 65
 * parseDurationString("invalid") // => null
 */
export function parseDurationString(durationStr: unknown): number | null {
  if (typeof durationStr === "number") {
    return Number.isFinite(durationStr) && durationStr >= 0 ? durationStr : null
  }

  if (!durationStr || typeof durationStr !== "string") {
    return null
  }

  const trimmed = durationStr.trim()
  if (!trimmed) {
    return null
  }

  // Разделяем на части по двоеточию
  const parts = trimmed.split(":").map((p) => Number.parseInt(p, 10))

  // Проверка корректности частей
  if (parts.some((p) => Number.isNaN(p) || p < 0)) {
    return null
  }

  if (parts.length === 3) {
    // HH:MM:SS
    const [hours, minutes, seconds] = parts
    return hours * 3600 + minutes * 60 + seconds
  }

  if (parts.length === 2) {
    // MM:SS
    const [minutes, seconds] = parts
    return minutes * 60 + seconds
  }

  if (parts.length === 1) {
    // SS (может быть строка с числом)
    return parts[0]
  }

  return null
}

import dayjs from "dayjs"

import { DEFAULT_LANGUAGE, formatDateByLanguage, type LanguageCode } from "@/i18n/constants"
import { createLogger } from "./tauri-logger"

const logger = createLogger("DateUtils")

/**
 * Форматирует UNIX-timestamp в строку даты с учетом текущего языка приложения
 *
 * @param timestamp - UNIX-timestamp в секундах
 * @returns Отформатированная строка даты в соответствии с текущим языком
 *
 * @description
 * Функция получает текущий язык из localStorage или использует значение по умолчанию,
 * затем форматирует дату с помощью функции formatDateByLanguage с включенным годом
 * и в длинном формате.
 *
 * @example
 * ```ts
 * formatDate(1631234567) // "10 сентября 2021 г." (для русского языка)
 * ```
 */
export function formatDate(timestamp: number): string {
  // Получаем текущий язык из localStorage или используем значение по умолчанию
  let currentLanguage = DEFAULT_LANGUAGE
  try {
    // Проверяем, что мы на клиенте
    if (typeof window !== "undefined") {
      // Сначала пробуем получить язык из localStorage
      const storedLanguage = localStorage.getItem("app-language")
      if (storedLanguage) {
        currentLanguage = storedLanguage as LanguageCode
      }
    }
  } catch (error) {
    logger.errorSync("Error getting current language", { error })
  }

  // Используем универсальный метод форматирования даты
  return formatDateByLanguage(new Date(timestamp * 1000), currentLanguage, {
    includeYear: true,
    longFormat: true,
  })
}

/**
 * Форматирует длительность в секундах в строку формата "MM:SS" или "HH:MM:SS"
 *
 * @param seconds - Длительность в секундах
 * @param afterComa - Количество знаков после запятой для миллисекунд (по умолчанию 3)
 * @param showHours - Показывать ли часы (по умолчанию false)
 * @returns Отформатированная строка длительности
 *
 * @example
 * ```ts
 * formatDuration(65) // "1:05"
 * formatDuration(65, 2) // "1:05:00"
 * formatDuration(3665, 2, true) // "01:01:05:00"
 * ```
 */
export function formatDuration(seconds: number, afterComa = 3, showHours = false): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  if (showHours) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}${afterComa > 0 ? `:${ms.toString().padStart(3, "0").substring(0, afterComa)}` : ""}`
  }

  const timeString = `${minutes}:${secs.toString().padStart(2, "0")}`

  if (afterComa === 0) {
    return timeString
  }

  return `${timeString}:${ms.toString().padStart(3, "0").substring(0, afterComa)}`
}

/**
 * Форматирует время в секундах в строку формата "HH:MM:SS:MMM" с возможностью отображения даты
 *
 * @param seconds - Время в секундах (UNIX timestamp)
 * @param showDate - Показывать ли дату (по умолчанию false)
 * @param showSeconds - Показывать ли секунды (по умолчанию true)
 * @param showMilliseconds - Показывать ли миллисекунды (по умолчанию true)
 * @returns Отформатированная строка времени
 *
 * @example
 * ```ts
 * formatTimeWithMilliseconds(1631234567) // "12:34:56:789"
 * formatTimeWithMilliseconds(1631234567, true) // "10.09.21 12:34:56:789"
 * formatTimeWithMilliseconds(1631234567, false, false) // "12:34"
 * ```
 */
export function formatTimeWithMilliseconds(
  seconds: number,
  showDate = false,
  showSeconds = true,
  showMilliseconds = true,
): string {
  // Конвертируем секунды в миллисекунды и создаем объект dayjs
  const time = dayjs(seconds * 1000)
    .utc()
    .tz(dayjs.tz.guess())

  const hours = time.hour()
  const minutes = time.minute()
  const secs = time.second()
  const ms = time.millisecond()

  const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}${
    showSeconds ? `:${secs.toString().padStart(2, "0")}` : ""
  }${showMilliseconds ? `:${ms.toString().padStart(3, "0")}` : ""}`

  if (showDate) {
    return `${time.format("DD.MM.YY")} ${timeString}`
  }
  return timeString
}

/**
 * Форматирует время в секундах в строку формата "H:MM:SS" или "MM:SS"
 *
 * @param seconds - Время в секундах
 * @param showMilliseconds - Показывать ли миллисекунды (по умолчанию false)
 * @returns Отформатированная строка времени
 *
 * @description
 * Функция автоматически определяет, нужно ли показывать часы, в зависимости от значения.
 * Если часы равны 0, они не отображаются.
 *
 * @example
 * ```ts
 * formatTime(0) // "0:00:00"
 * formatTime(65) // "1:05"
 * formatTime(3665) // "1:01:05"
 * formatTime(65.789, true) // "1:05:789"
 * ```
 */
export function formatTime(seconds: number, showMilliseconds = false): string {
  if (seconds === 0) return showMilliseconds ? "0:00:00:000" : "0:00:00"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}${
    ms > 0 && showMilliseconds ? `:${ms.toString().padStart(3, "0")}` : ""
  }`
}

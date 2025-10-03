/**
 * Парсеры для различных форматов субтитров
 */

import type { SubtitleClip } from "../types/subtitles"

/**
 * Конвертирует время из формата SRT (00:00:00,000) в секунды
 */
function parseSRTTime(timeStr: string): number {
  // Поддерживаем более гибкий формат
  const match = /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/.exec(timeStr)
  if (!match) throw new Error(`Invalid SRT time format: ${timeStr}`)

  const [, hours, minutes, seconds, milliseconds] = match
  return (
    Number.parseInt(hours, 10) * 3600 +
    Number.parseInt(minutes, 10) * 60 +
    Number.parseInt(seconds, 10) +
    Number.parseInt(milliseconds.padEnd(3, "0"), 10) / 1000
  )
}

/**
 * Конвертирует время из формата VTT (00:00:00.000) в секунды
 */
function parseVTTTime(timeStr: string): number {
  // Поддерживаем различные форматы
  let match = /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/.exec(timeStr)
  if (!match) {
    // Пробуем без часов
    match = /(\d{1,2}):(\d{2})[,.](\d{1,3})/.exec(timeStr)
    if (match) {
      const [, minutes, seconds, milliseconds] = match
      return (
        Number.parseInt(minutes, 10) * 60 +
        Number.parseInt(seconds, 10) +
        Number.parseInt(milliseconds.padEnd(3, "0"), 10) / 1000
      )
    }
    throw new Error(`Invalid VTT time format: ${timeStr}`)
  }

  const [, hours, minutes, seconds, milliseconds] = match
  return (
    Number.parseInt(hours, 10) * 3600 +
    Number.parseInt(minutes, 10) * 60 +
    Number.parseInt(seconds, 10) +
    Number.parseInt(milliseconds.padEnd(3, "0"), 10) / 1000
  )
}

/**
 * Парсит SRT файл и возвращает массив субтитров
 */
export function parseSRT(content: string): Omit<SubtitleClip, "id" | "trackId">[] {
  const subtitles: Omit<SubtitleClip, "id" | "trackId">[] = []

  // Нормализуем переносы строк
  const normalizedContent = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

  // Разбиваем на блоки субтитров по двойным переносам или по номерам субтитров
  const blocks = normalizedContent.trim().split(/\n\s*\n/)

  for (const block of blocks) {
    const lines = block
      .trim()
      .split("\n")
      .filter((line) => line.trim())
    if (lines.length < 2) continue

    // Ищем строку с таймингом (обычно вторая строка в SRT)
    let timingLineIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(" --> ") && /\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}/.test(lines[i])) {
        timingLineIndex = i
        break
      }
    }

    if (timingLineIndex === -1) continue

    const timingMatch = /(.+?) --> (.+)/.exec(lines[timingLineIndex])
    if (!timingMatch) continue

    const [, startTimeStr, endTimeStr] = timingMatch

    try {
      const startTime = parseSRTTime(startTimeStr.trim())
      const endTime = parseSRTTime(endTimeStr.trim())

      // Текст - все строки после тайминга
      const textLines = lines.slice(timingLineIndex + 1)
      const text = textLines.join("\n")

      if (text.trim()) {
        subtitles.push({
          type: "subtitle",
          startTime,
          duration: endTime - startTime,
          text: text.trim(),
          style: {
            fontFamily: "Arial",
            fontSize: 24,
            color: "#FFFFFF",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            textAlign: "center",
          },
          position: {
            x: 0.5,
            y: 0.9,
            width: 1,
            height: 0.1,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
          },
          subtitlePosition: {
            alignment: "bottom-center",
          },
        })
      }
    } catch (e) {
      // Пропускаем неверные блоки
      // console.warn(`Skipping invalid SRT block: ${String(e)}`, { startTimeStr: startTimeStr?.trim(), endTimeStr: endTimeStr?.trim() })
    }
  }

  return subtitles
}

/**
 * Парсит VTT файл и возвращает массив субтитров
 */
export function parseVTT(content: string): Omit<SubtitleClip, "id" | "trackId">[] {
  const subtitles: Omit<SubtitleClip, "id" | "trackId">[] = []

  // Удаляем заголовок WEBVTT
  const contentWithoutHeader = content.replace(/^WEBVTT\s*\n*/, "")

  // Разбиваем на блоки субтитров
  const blocks = contentWithoutHeader.trim().split(/\n\s*\n/)

  for (const block of blocks) {
    const lines = block.trim().split("\n")
    if (lines.length < 2) continue

    // Ищем строку с таймингом
    let timingLineIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(" --> ") && /\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}/.test(lines[i])) {
        timingLineIndex = i
        break
      }
    }

    if (timingLineIndex === -1) continue

    const timingMatch = /(.+?) --> (.+)/.exec(lines[timingLineIndex])
    if (!timingMatch) continue

    const [, startTimeStr, endTimeStr] = timingMatch

    try {
      const startTime = parseVTTTime(startTimeStr.trim())
      const endTime = parseVTTTime(endTimeStr.trim())

      // Текст после строки с таймингом
      const text = lines.slice(timingLineIndex + 1).join("\n")

      if (text.trim()) {
        subtitles.push({
          type: "subtitle",
          startTime,
          duration: endTime - startTime,
          text,
          style: {
            fontFamily: "Arial",
            fontSize: 24,
            color: "#FFFFFF",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            textAlign: "center",
          },
          position: {
            x: 0.5,
            y: 0.9,
            width: 1,
            height: 0.1,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
          },
          subtitlePosition: {
            alignment: "bottom-center",
          },
        })
      }
    } catch (e) {
      // Пропускаем неверные блоки
      console.warn(`Skipping invalid VTT block: ${String(e)}`)
    }
  }

  return subtitles
}

/**
 * Базовый парсер для ASS/SSA файлов (упрощенная версия)
 */
export function parseASS(content: string): Omit<SubtitleClip, "id" | "trackId">[] {
  const subtitles: Omit<SubtitleClip, "id" | "trackId">[] = []

  // Ищем секцию Events
  const eventsMatch = /\[Events\]([\s\S]*?)(?:\[|$)/.exec(content)
  if (!eventsMatch) return subtitles

  const eventsSection = eventsMatch[1]
  const lines = eventsSection.trim().split("\n")

  // Находим формат
  const formatLine = lines.find((line) => line.startsWith("Format:"))
  if (!formatLine) return subtitles

  const format = formatLine
    .substring(7)
    .split(",")
    .map((f) => f.trim())
  const startIndex = format.indexOf("Start")
  const endIndex = format.indexOf("End")
  const textIndex = format.indexOf("Text")

  if (startIndex === -1 || endIndex === -1 || textIndex === -1) return subtitles

  // Парсим диалоги
  for (const line of lines) {
    if (!line.startsWith("Dialogue:")) continue

    const parts = line.substring(9).split(",")
    if (parts.length <= Math.max(startIndex, endIndex, textIndex)) continue

    const startTime = parseASSTime(parts[startIndex].trim())
    const endTime = parseASSTime(parts[endIndex].trim())

    // Собираем текст (может содержать запятые)
    const textParts = parts.slice(textIndex)
    let text = textParts.join(",").trim()

    // Удаляем теги стилей ASS
    text = text.replace(/\{[^}]+\}/g, "")

    subtitles.push({
      type: "subtitle",
      startTime,
      duration: endTime - startTime,
      text,
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        color: "#FFFFFF",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        textAlign: "center",
      },
      position: {
        x: 0.5,
        y: 0.9,
        width: 1,
        height: 0.1,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      subtitlePosition: {
        alignment: "bottom-center",
      },
    })
  }

  return subtitles
}

/**
 * Конвертирует время из формата ASS (0:00:00.00) в секунды
 */
function parseASSTime(timeStr: string): number {
  const match = /(\d+):(\d{2}):(\d{2})\.(\d{2})/.exec(timeStr)
  if (!match) throw new Error(`Invalid ASS time format: ${timeStr}`)

  const [, hours, minutes, seconds, centiseconds] = match
  return (
    Number.parseInt(hours, 10) * 3600 +
    Number.parseInt(minutes, 10) * 60 +
    Number.parseInt(seconds, 10) +
    Number.parseInt(centiseconds, 10) / 100
  )
}

/**
 * Определяет формат файла субтитров по содержимому
 */
export function detectSubtitleFormat(content: string): "srt" | "vtt" | "ass" | "unknown" {
  const trimmedContent = content.trim()

  if (trimmedContent.startsWith("WEBVTT")) {
    return "vtt"
  }

  if (trimmedContent.includes("[Script Info]") || trimmedContent.includes("[Events]")) {
    return "ass"
  }

  // Проверяем формат SRT
  if (/^\d+\s*\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/m.test(trimmedContent)) {
    return "srt"
  }

  return "unknown"
}

/**
 * Парсит файл субтитров любого поддерживаемого формата
 */
export function parseSubtitleFile(
  content: string,
  format?: "srt" | "vtt" | "ass",
): Omit<SubtitleClip, "id" | "trackId">[] {
  const detectedFormat = format || detectSubtitleFormat(content)

  switch (detectedFormat) {
    case "srt":
      return parseSRT(content)
    case "vtt":
      return parseVTT(content)
    case "ass":
      return parseASS(content)
    default:
      throw new Error(`Unsupported subtitle format: ${detectedFormat}`)
  }
}

/**
 * Импортеры для различных форматов субтитров
 */

import type { SubtitleClip } from "../types/subtitles"

/**
 * Создает SubtitleClip с дефолтными значениями
 */
export function createSubtitleClip(
  partial: Pick<SubtitleClip, "startTime" | "duration" | "text"> & Partial<SubtitleClip>,
): SubtitleClip {
  const now = new Date()
  return {
    // Обязательные базовые поля
    id: partial.id || `subtitle-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    name: partial.name || "Subtitle",
    type: "subtitle",
    mediaId: partial.mediaId || "",
    trackId: partial.trackId || "",

    // Временные параметры
    startTime: partial.startTime,
    duration: partial.duration,
    mediaStartTime: partial.mediaStartTime || 0,
    mediaEndTime: partial.mediaEndTime || partial.duration,
    offset: partial.offset || 0,

    // Настройки клипа
    volume: partial.volume ?? 1.0,
    speed: partial.speed ?? 1.0,
    isReversed: partial.isReversed ?? false,
    opacity: partial.opacity ?? 1.0,

    // Ресурсы
    effects: partial.effects || [],
    filters: partial.filters || [],
    transitions: partial.transitions || [],

    // Состояние
    isSelected: partial.isSelected ?? false,
    isLocked: partial.isLocked ?? false,

    // Метаданные
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now,

    // Специфичные поля субтитров
    text: partial.text,
    style: partial.style,
    position: partial.position,
    subtitlePosition: partial.subtitlePosition,
    subtitleStyleId: partial.subtitleStyleId,
    animationIn: partial.animationIn,
    animationOut: partial.animationOut,
  }
}

/**
 * Парсит время из формата SRT (00:00:00,000) в секунды
 */
function parseSRTTime(timeString: string): number {
  const match = /(\d{1,2}):(\d{2}):(\d{2}),(\d{3})/.exec(timeString)
  if (!match) {
    throw new Error(`Invalid SRT time format: ${timeString}`)
  }

  const [, hours, minutes, seconds, milliseconds] = match
  return (
    Number.parseInt(hours, 10) * 3600 +
    Number.parseInt(minutes, 10) * 60 +
    Number.parseInt(seconds, 10) +
    Number.parseInt(milliseconds, 10) / 1000
  )
}

/**
 * Парсит время из формата VTT (00:00:00.000) в секунды
 */
function parseVTTTime(timeString: string): number {
  const match = /(\d{1,2}):(\d{2}):(\d{2})\.(\d{3})/.exec(timeString)
  if (!match) {
    throw new Error(`Invalid VTT time format: ${timeString}`)
  }

  const [, hours, minutes, seconds, milliseconds] = match
  return (
    Number.parseInt(hours, 10) * 3600 +
    Number.parseInt(minutes, 10) * 60 +
    Number.parseInt(seconds, 10) +
    Number.parseInt(milliseconds, 10) / 1000
  )
}

/**
 * Парсит время из формата ASS (0:00:00.00) в секунды
 */
function parseASSTime(timeString: string): number {
  const match = /(\d):(\d{2}):(\d{2})\.(\d{2})/.exec(timeString)
  if (!match) {
    throw new Error(`Invalid ASS time format: ${timeString}`)
  }

  const [, hours, minutes, seconds, centiseconds] = match
  return (
    Number.parseInt(hours, 10) * 3600 +
    Number.parseInt(minutes, 10) * 60 +
    Number.parseInt(seconds, 10) +
    Number.parseInt(centiseconds, 10) / 100
  )
}

/**
 * Импортирует субтитры из формата SRT
 */
export function importFromSRT(content: string): SubtitleClip[] {
  const subtitles: SubtitleClip[] = []

  // Разбиваем на блоки субтитров
  const blocks = content.trim().split(/\n\s*\n/)

  for (const block of blocks) {
    const lines = block.trim().split("\n")
    if (lines.length < 3) continue

    // Первая строка - номер субтитра (игнорируем)
    // Вторая строка - временные метки
    const timeLine = lines[1]
    const timeMatch = /(.+?)\s*-->\s*(.+)/.exec(timeLine)
    if (!timeMatch) continue

    const [, startTimeStr, endTimeStr] = timeMatch
    const startTime = parseSRTTime(startTimeStr.trim())
    const endTime = parseSRTTime(endTimeStr.trim())

    // Остальные строки - текст субтитра
    const text = lines.slice(2).join("\n")

    subtitles.push(
      createSubtitleClip({
        startTime,
        duration: endTime - startTime,
        text: text.trim(),
      }),
    )
  }

  return subtitles
}

/**
 * Импортирует субтитры из формата VTT
 */
export function importFromVTT(content: string): SubtitleClip[] {
  const subtitles: SubtitleClip[] = []

  // Удаляем заголовок WEBVTT
  const cleanContent = content.replace(/^WEBVTT.*\n*/m, "")

  // Разбиваем на блоки субтитров
  const blocks = cleanContent.trim().split(/\n\s*\n/)

  for (const block of blocks) {
    const lines = block.trim().split("\n")
    if (lines.length < 2) continue

    // Находим строку с временными метками
    let timeLineIndex = 0
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("-->")) {
        timeLineIndex = i
        break
      }
    }

    const timeLine = lines[timeLineIndex]
    const timeMatch = /(.+?)\s*-->\s*(.+)/.exec(timeLine)
    if (!timeMatch) continue

    const [, startTimeStr, endTimeStr] = timeMatch

    // VTT может содержать позиционирование после временных меток
    const startTimeParts = startTimeStr.trim().split(" ")
    const startTime = parseVTTTime(startTimeParts[0])
    const endTime = parseVTTTime(endTimeStr.trim().split(" ")[0])

    // Текст субтитра - все строки после временных меток
    const text = lines.slice(timeLineIndex + 1).join("\n")

    // Парсим позиционирование если есть
    let position: SubtitleClip["position"] | undefined
    const positionMatch = /position:(\d+)%/.exec(timeLine)
    if (positionMatch) {
      position = {
        x: Number.parseInt(positionMatch[1], 10) / 100,
        y: 0.9, // По умолчанию внизу
        width: 1.0,
        height: 0.1,
        rotation: 0,
        scaleX: 1.0,
        scaleY: 1.0,
      }
    }

    subtitles.push(
      createSubtitleClip({
        startTime,
        duration: endTime - startTime,
        text: text.trim(),
        position,
      }),
    )
  }

  return subtitles
}

/**
 * Парсит цвет из формата ASS BGR в hex
 */
function parseASSColor(assColor: string): string {
  // ASS цвет в формате &HBBGGRR или &HAABBGGRR (без завершающего &)
  const match = /&H([A-F0-9]{2})?([A-F0-9]{2})([A-F0-9]{2})([A-F0-9]{2})/i.exec(assColor)
  if (!match) return "#FFFFFF"

  if (match[1]) {
    // Формат с альфа-каналом: &HAABBGGRR
    const [, _alpha, blue, green, red] = match
    return `#${red}${green}${blue}`
  }
  // Формат без альфа-канала: &HBBGGRR
  const [, , blue, green, red] = match
  return `#${red}${green}${blue}`
}

/**
 * Импортирует субтитры из формата ASS/SSA
 */
export function importFromASS(content: string): SubtitleClip[] {
  const subtitles: SubtitleClip[] = []

  // Ищем секцию Events
  const eventsMatch = /\[Events\]([\s\S]*?)(?:\[|$)/i.exec(content)
  if (!eventsMatch) return subtitles

  const eventsSection = eventsMatch[1]
  const lines = eventsSection.trim().split("\n")

  // Находим формат событий
  const formatLine = lines.find((line) => line.startsWith("Format:"))
  if (!formatLine) return subtitles

  const formatFields = formatLine
    .substring(7)
    .split(",")
    .map((f) => f.trim())

  const startIndex = formatFields.indexOf("Start")
  const endIndex = formatFields.indexOf("End")
  const textIndex = formatFields.indexOf("Text")
  const styleIndex = formatFields.indexOf("Style")

  // Парсим стили если есть
  const styles = parseASSStyles(content)

  // Обрабатываем диалоги
  for (const line of lines) {
    if (!line.startsWith("Dialogue:")) continue

    const dialogueParts = line.substring(9).split(",")

    // ASS формат может содержать запятые в тексте, поэтому
    // объединяем все части после индекса текста
    const textParts = dialogueParts.slice(textIndex)
    const text = textParts.join(",").trim()

    const startTime = parseASSTime(dialogueParts[startIndex].trim())
    const endTime = parseASSTime(dialogueParts[endIndex].trim())
    const styleName = dialogueParts[styleIndex]?.trim()

    // Очищаем текст от ASS тегов форматирования
    const cleanText = text
      .replace(/\{[^}]*\}/g, "") // Удаляем {\\tag} теги
      .replace(/\\N/g, "\n") // Заменяем \N на переносы строк
      .replace(/\\n/g, "\n") // Заменяем \n на переносы строк

    // Применяем стиль если найден
    let style: SubtitleClip["style"] | undefined
    if (styleName && styles[styleName]) {
      style = styles[styleName]
    }

    subtitles.push(
      createSubtitleClip({
        startTime,
        duration: endTime - startTime,
        text: cleanText,
        style,
      }),
    )
  }

  return subtitles
}

/**
 * Парсит стили из ASS файла
 */
function parseASSStyles(content: string): Record<string, SubtitleClip["style"]> {
  const styles: Record<string, SubtitleClip["style"]> = {}

  // Ищем секцию стилей
  const stylesMatch = /\[V4\+ Styles\]([\s\S]*?)(?:\[|$)/i.exec(content)
  if (!stylesMatch) return styles

  const stylesSection = stylesMatch[1]
  const lines = stylesSection.trim().split("\n")

  // Находим формат стилей
  const formatLine = lines.find((line) => line.startsWith("Format:"))
  if (!formatLine) return styles

  const formatFields = formatLine
    .substring(7)
    .split(",")
    .map((f) => f.trim())

  // Индексы важных полей
  const nameIndex = formatFields.indexOf("Name")
  const fontNameIndex = formatFields.indexOf("Fontname")
  const fontSizeIndex = formatFields.indexOf("Fontsize")
  const primaryColorIndex = formatFields.indexOf("PrimaryColour")
  const boldIndex = formatFields.indexOf("Bold")
  const italicIndex = formatFields.indexOf("Italic")
  const alignmentIndex = formatFields.indexOf("Alignment")

  // Парсим стили
  for (const line of lines) {
    if (!line.startsWith("Style:")) continue

    const styleParts = line
      .substring(6)
      .split(",")
      .map((p) => p.trim())
    const styleName = styleParts[nameIndex]

    const style: SubtitleClip["style"] = {}

    if (fontNameIndex >= 0) {
      style.fontFamily = styleParts[fontNameIndex]
    }

    if (fontSizeIndex >= 0) {
      style.fontSize = Number.parseInt(styleParts[fontSizeIndex], 10)
    }

    if (primaryColorIndex >= 0) {
      style.color = parseASSColor(styleParts[primaryColorIndex])
    }

    if (boldIndex >= 0 && styleParts[boldIndex] === "-1") {
      style.fontWeight = "bold"
    }

    if (italicIndex >= 0 && styleParts[italicIndex] === "-1") {
      style.fontStyle = "italic"
    }

    if (alignmentIndex >= 0) {
      const alignment = Number.parseInt(styleParts[alignmentIndex], 10)
      // ASS alignment: 1-3 bottom, 4-6 middle, 7-9 top
      // 1,4,7 - left, 2,5,8 - center, 3,6,9 - right
      if ([1, 4, 7].includes(alignment)) {
        style.textAlign = "left"
      } else if ([3, 6, 9].includes(alignment)) {
        style.textAlign = "right"
      } else {
        style.textAlign = "center"
      }
    }

    styles[styleName] = style
  }

  return styles
}

/**
 * Импортирует субтитры из указанного формата
 */
export function importSubtitles(content: string, format: "srt" | "vtt" | "ass"): SubtitleClip[] {
  switch (format) {
    case "srt":
      return importFromSRT(content)
    case "vtt":
      return importFromVTT(content)
    case "ass":
      return importFromASS(content)
    default:
      throw new Error(`Unsupported import format: ${format}`)
  }
}

/**
 * Определяет формат файла субтитров по содержимому
 */
export function detectSubtitleFormat(content: string): "srt" | "vtt" | "ass" | null {
  const trimmedContent = content.trim()

  // VTT файлы начинаются с WEBVTT
  if (trimmedContent.startsWith("WEBVTT")) {
    return "vtt"
  }

  // ASS/SSA файлы содержат [Script Info]
  if (trimmedContent.includes("[Script Info]") || trimmedContent.includes("[V4+ Styles]")) {
    return "ass"
  }

  // SRT файлы обычно начинаются с номера (1, 2, etc.) и содержат -->
  if (/^\d+\s*\n/.test(trimmedContent) && trimmedContent.includes("-->")) {
    return "srt"
  }

  // Дополнительная проверка для SRT по временным меткам
  if (/\d{1,2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2},\d{3}/.test(trimmedContent)) {
    return "srt"
  }

  return null
}

/**
 * Валидирует импортированные субтитры
 */
export function validateSubtitles(subtitles: SubtitleClip[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (subtitles.length === 0) {
    errors.push("Не найдено субтитров для импорта")
  }

  for (let i = 0; i < subtitles.length; i++) {
    const subtitle = subtitles[i]

    if (!subtitle.text || subtitle.text.trim().length === 0) {
      errors.push(`Субтитр ${i + 1}: пустой текст`)
    }

    if (subtitle.startTime < 0) {
      errors.push(`Субтитр ${i + 1}: отрицательное время начала`)
    }

    if (subtitle.duration <= 0) {
      errors.push(`Субтитр ${i + 1}: недопустимая длительность`)
    }

    // Проверка перекрытий
    if (i > 0) {
      const prevSubtitle = subtitles[i - 1]
      const prevEnd = prevSubtitle.startTime + prevSubtitle.duration
      if (subtitle.startTime < prevEnd) {
        errors.push(`Субтитр ${i + 1}: перекрывается с предыдущим субтитром`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

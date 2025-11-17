/**
 * File Utilities
 *
 * Утилиты для работы с файлами и путями
 */

/**
 * Извлекает расширение файла из пути
 * @param filePath - Путь к файлу
 * @returns Расширение файла (без точки) или пустая строка
 *
 * @example
 * getFileExtension("/path/to/video.mp4") // => "mp4"
 * getFileExtension("document.tar.gz") // => "gz"
 * getFileExtension("no-extension") // => ""
 */
export function getFileExtension(filePath: string): string {
  if (!filePath || typeof filePath !== "string") {
    return ""
  }

  const lastDot = filePath.lastIndexOf(".")
  const lastSlash = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"))

  // Точка должна быть после последнего слеша и не в начале имени файла
  if (lastDot > lastSlash && lastDot > 0) {
    return filePath.substring(lastDot + 1).toLowerCase()
  }

  return ""
}

/**
 * Извлекает имя файла из пути (с расширением)
 * @param filePath - Путь к файлу
 * @param withExtension - Включать ли расширение (по умолчанию true)
 * @returns Имя файла
 *
 * @example
 * getFileName("/path/to/video.mp4") // => "video.mp4"
 * getFileName("/path/to/video.mp4", false) // => "video"
 * getFileName("C:\\Users\\file.txt") // => "file.txt"
 */
export function getFileName(filePath: string, withExtension = true): string {
  if (!filePath || typeof filePath !== "string") {
    return ""
  }

  const lastSlash = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"))
  const fileName = lastSlash >= 0 ? filePath.substring(lastSlash + 1) : filePath

  if (!withExtension) {
    const lastDot = fileName.lastIndexOf(".")
    return lastDot > 0 ? fileName.substring(0, lastDot) : fileName
  }

  return fileName
}

/**
 * Форматирует размер файла в человекочитаемую строку
 * @param bytes - Размер в байтах
 * @param decimals - Количество знаков после запятой (по умолчанию 2)
 * @returns Отформатированная строка размера
 *
 * @example
 * formatFileSize(1024) // => "1.00 KB"
 * formatFileSize(1536000) // => "1.46 MB"
 * formatFileSize(1536000000) // => "1.43 GB"
 * formatFileSize(1024, 0) // => "1 KB"
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) {
    return "0 Bytes"
  }

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / k ** i

  return `${value.toFixed(dm)} ${sizes[i]}`
}

/**
 * Извлекает директорию из пути к файлу
 * @param filePath - Путь к файлу
 * @returns Путь к директории
 *
 * @example
 * getDirectory("/path/to/video.mp4") // => "/path/to"
 * getDirectory("C:\\Users\\file.txt") // => "C:\\Users"
 */
export function getDirectory(filePath: string): string {
  if (!filePath || typeof filePath !== "string") {
    return ""
  }

  const lastSlash = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"))
  return lastSlash >= 0 ? filePath.substring(0, lastSlash) : ""
}

/**
 * Проверяет, является ли файл видео по расширению
 * @param filePath - Путь к файлу
 * @returns true если файл является видео
 */
export function isVideoFile(filePath: string): boolean {
  const videoExtensions = ["mp4", "mov", "avi", "mkv", "webm", "m4v", "flv", "wmv", "mpg", "mpeg"]
  const ext = getFileExtension(filePath)
  return videoExtensions.includes(ext)
}

/**
 * Проверяет, является ли файл аудио по расширению
 * @param filePath - Путь к файлу
 * @returns true если файл является аудио
 */
export function isAudioFile(filePath: string): boolean {
  const audioExtensions = ["mp3", "wav", "aac", "m4a", "flac", "ogg", "wma", "aiff", "opus"]
  const ext = getFileExtension(filePath)
  return audioExtensions.includes(ext)
}

/**
 * Проверяет, является ли файл изображением по расширению
 * @param filePath - Путь к файлу
 * @returns true если файл является изображением
 */
export function isImageFile(filePath: string): boolean {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "tiff", "ico"]
  const ext = getFileExtension(filePath)
  return imageExtensions.includes(ext)
}

/**
 * Проверяет, является ли файл медиа-файлом (видео, аудио или изображение)
 * @param filePath - Путь к файлу
 * @returns true если файл является медиа-файлом
 */
export function isMediaFile(filePath: string): boolean {
  return isVideoFile(filePath) || isAudioFile(filePath) || isImageFile(filePath)
}

/**
 * Нормализует путь к файлу (заменяет обратные слеши на прямые)
 * @param filePath - Путь к файлу
 * @returns Нормализованный путь
 */
export function normalizePath(filePath: string): string {
  if (!filePath || typeof filePath !== "string") {
    return ""
  }
  return filePath.replace(/\\/g, "/")
}

/**
 * Парсит размер файла из строки (например, "1.5 MB")
 * @param sizeString - Строка с размером файла
 * @returns Размер в байтах или null если формат некорректный
 *
 * @example
 * parseFileSize("1.5 MB") // => 1572864
 * parseFileSize("2 GB") // => 2147483648
 * parseFileSize("invalid") // => null
 */
export function parseFileSize(sizeString: string): number | null {
  if (!sizeString || typeof sizeString !== "string") {
    return null
  }

  const match = sizeString.trim().match(/^([\d.]+)\s*([A-Za-z]+)$/)
  if (!match) {
    return null
  }

  const value = Number.parseFloat(match[1])
  const unit = match[2].toUpperCase()

  if (Number.isNaN(value) || value < 0) {
    return null
  }

  const units: Record<string, number> = {
    B: 1,
    BYTES: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
    PB: 1024 * 1024 * 1024 * 1024 * 1024,
  }

  const multiplier = units[unit]
  return multiplier ? Math.floor(value * multiplier) : null
}

/**
 * Создает безопасное имя файла (удаляет недопустимые символы)
 * @param fileName - Исходное имя файла
 * @returns Безопасное имя файла
 *
 * @example
 * sanitizeFileName("my file: test.mp4") // => "my file test.mp4"
 * sanitizeFileName("file/with\\slashes.txt") // => "file-with-slashes.txt"
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== "string") {
    return ""
  }

  // Удаляем недопустимые символы для имен файлов
  return (
    fileName
      // biome-ignore lint/suspicious/noControlCharactersInRegex: Control characters (0x00-0x1F) are intentionally filtered for file name safety
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
  )
}

/**
 * Добавляет суффикс к имени файла перед расширением
 * @param filePath - Путь к файлу
 * @param suffix - Суффикс для добавления
 * @returns Путь с добавленным суффиксом
 *
 * @example
 * addFileNameSuffix("/path/to/video.mp4", "_edited") // => "/path/to/video_edited.mp4"
 */
export function addFileNameSuffix(filePath: string, suffix: string): string {
  const dir = getDirectory(filePath)
  const name = getFileName(filePath, false)
  const ext = getFileExtension(filePath)

  const newName = `${name}${suffix}${ext ? `.${ext}` : ""}`
  return dir ? `${dir}/${newName}` : newName
}

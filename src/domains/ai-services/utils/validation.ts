/**
 * AI Services Input Validation Utilities
 *
 * Валидация входных данных для предотвращения security issues и ошибок:
 * - File paths validation
 * - Input size limits
 * - User input sanitization
 *
 * NOTE: File validation functions use Node.js APIs and should only be called server-side (Tauri).
 * Text sanitization functions are safe for both client and server.
 */

// Conditional check for server-side execution
const isServer = typeof window === "undefined"

// Server-side file operations are delegated to Tauri backend
// These validation functions should only be used from Tauri commands

// ============================================================================
// Constants
// ============================================================================

/** Максимальный размер файла для анализа (5GB) */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024

/** Максимальная длина текста в сообщениях (1MB) */
export const MAX_MESSAGE_LENGTH = 1024 * 1024

/** Максимальное количество сообщений в одном запросе */
export const MAX_MESSAGES_COUNT = 100

/** Поддерживаемые видео форматы */
export const SUPPORTED_VIDEO_FORMATS = [
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".webm",
  ".flv",
  ".wmv",
  ".m4v",
  ".mpg",
  ".mpeg",
]

/** Поддерживаемые аудио форматы */
export const SUPPORTED_AUDIO_FORMATS = [".mp3", ".wav", ".aac", ".m4a", ".ogg", ".flac", ".wma"]

// ============================================================================
// Error Classes
// ============================================================================

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

export class FileSizeError extends ValidationError {
  constructor(filePath: string, actualSize: number, maxSize: number) {
    super(`File size exceeds limit: ${filePath} (${actualSize} bytes > ${maxSize} bytes)`)
    this.name = "FileSizeError"
  }
}

export class FileNotFoundError extends ValidationError {
  constructor(filePath: string) {
    super(`File not found: ${filePath}`)
    this.name = "FileNotFoundError"
  }
}

export class InvalidFormatError extends ValidationError {
  constructor(filePath: string, supportedFormats: string[]) {
    super(`Unsupported file format: ${filePath}. Supported formats: ${supportedFormats.join(", ")}`)
    this.name = "InvalidFormatError"
  }
}

export class InputTooLargeError extends ValidationError {
  constructor(inputType: string, actualSize: number, maxSize: number) {
    super(`${inputType} exceeds size limit: ${actualSize} > ${maxSize}`)
    this.name = "InputTooLargeError"
  }
}

// ============================================================================
// File Path Validation
// ============================================================================

/**
 * Валидация пути к файлу
 *
 * ⚠️ ВАЖНО: Эта функция использует Node.js API и должна вызываться только на backend (Tauri).
 * На клиенте функция выбрасывает ошибку.
 * Валидация файлов должна происходить в Tauri commands.
 *
 * @param filePath - Путь к файлу
 * @throws {ValidationError} Если путь невалиден или вызов на клиенте
 */
export function validateFilePath(filePath: string): void {
  // Client-side guard
  if (!isServer) {
    throw new ValidationError(
      "File validation must be performed server-side (Tauri). Use Tauri commands for file operations.",
    )
  }

  // Basic validation without Node.js APIs
  if (!filePath || filePath.trim() === "") {
    throw new ValidationError("File path cannot be empty")
  }

  // Note: Full validation (file existence, permissions) should be done in Rust/Tauri backend
  // This is just a basic sanity check
  if (filePath.includes("..")) {
    throw new ValidationError(`File path contains suspicious elements: ${filePath}`)
  }
}

/**
 * Валидация видео файла
 *
 * ⚠️ ВАЖНО: Используйте эту функцию только на backend (Tauri commands).
 * Полная валидация файлов должна выполняться в Rust коде.
 */
export function validateVideoFile(filePath: string, _maxSizeBytes: number = MAX_FILE_SIZE_BYTES): void {
  if (!isServer) {
    throw new ValidationError("File validation must be performed server-side (Tauri)")
  }

  validateFilePath(filePath)

  // Check extension only (size check должен быть в Rust)
  const extension = filePath.toLowerCase().substring(filePath.lastIndexOf("."))
  if (!SUPPORTED_VIDEO_FORMATS.includes(extension)) {
    throw new InvalidFormatError(filePath, SUPPORTED_VIDEO_FORMATS)
  }
}

/**
 * Валидация аудио файла
 *
 * ⚠️ ВАЖНО: Используйте эту функцию только на backend (Tauri commands).
 */
export function validateAudioFile(filePath: string, _maxSizeBytes: number = MAX_FILE_SIZE_BYTES): void {
  if (!isServer) {
    throw new ValidationError("File validation must be performed server-side (Tauri)")
  }

  validateFilePath(filePath)

  const extension = filePath.toLowerCase().substring(filePath.lastIndexOf("."))
  if (!SUPPORTED_AUDIO_FORMATS.includes(extension)) {
    throw new InvalidFormatError(filePath, SUPPORTED_AUDIO_FORMATS)
  }
}

/**
 * Валидация медиа файла (видео или аудио)
 *
 * ⚠️ ВАЖНО: Используйте эту функцию только на backend (Tauri commands).
 */
export function validateMediaFile(filePath: string, _maxSizeBytes: number = MAX_FILE_SIZE_BYTES): void {
  if (!isServer) {
    throw new ValidationError("File validation must be performed server-side (Tauri)")
  }

  validateFilePath(filePath)

  const extension = filePath.toLowerCase().substring(filePath.lastIndexOf("."))
  const isVideo = SUPPORTED_VIDEO_FORMATS.includes(extension)
  const isAudio = SUPPORTED_AUDIO_FORMATS.includes(extension)

  if (!isVideo && !isAudio) {
    throw new InvalidFormatError(filePath, [...SUPPORTED_VIDEO_FORMATS, ...SUPPORTED_AUDIO_FORMATS])
  }
}

/**
 * Валидация массива путей к файлам
 *
 * @param filePaths - Массив путей к файлам
 * @param validator - Функция валидации для каждого файла
 * @returns Массив результатов валидации с ошибками
 */
export function validateFilePaths(
  filePaths: string[],
  validator: (path: string) => void = validateFilePath,
): Array<{ path: string; valid: boolean; error?: string }> {
  return filePaths.map((path) => {
    try {
      validator(path)
      return { path, valid: true }
    } catch (error) {
      return {
        path,
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })
}

// ============================================================================
// Input Sanitization
// ============================================================================

/**
 * Sanitize text input для AI запросов
 *
 * Удаляет:
 * - Управляющие символы (кроме \n, \r, \t)
 * - Нулевые байты
 * - Excessive whitespace
 *
 * @param input - Входной текст
 * @param maxLength - Максимальная длина (default: 1MB)
 * @returns Sanitized текст
 * @throws {InputTooLargeError} Если текст слишком большой
 */
export function sanitizeTextInput(input: string, maxLength: number = MAX_MESSAGE_LENGTH): string {
  if (input.length > maxLength) {
    throw new InputTooLargeError("Text input", input.length, maxLength)
  }

  // Удаляем нулевые байты и опасные управляющие символы
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Security feature - intentionally removing control characters
  let sanitized = input.replace(/\u0000/g, "")

  // biome-ignore lint/suspicious/noControlCharactersInRegex: Security feature - intentionally removing control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")

  // Нормализуем whitespace (но сохраняем переносы строк)
  sanitized = sanitized.replace(/[ \t]+/g, " ")

  return sanitized.trim()
}

/**
 * Валидация AI сообщений
 *
 * @param messages - Массив сообщений
 * @param maxMessages - Максимальное количество сообщений
 * @param maxMessageLength - Максимальная длина одного сообщения
 * @throws {ValidationError} Если сообщения невалидны
 */
export function validateAIMessages(
  messages: Array<{ role: string; content: string }>,
  maxMessages: number = MAX_MESSAGES_COUNT,
  maxMessageLength: number = MAX_MESSAGE_LENGTH,
): void {
  if (!messages || messages.length === 0) {
    throw new ValidationError("Messages array cannot be empty")
  }

  if (messages.length > maxMessages) {
    throw new InputTooLargeError("Messages count", messages.length, maxMessages)
  }

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]

    if (!message.role || !message.content) {
      throw new ValidationError(`Message at index ${i} must have role and content`)
    }

    if (message.content.length > maxMessageLength) {
      throw new InputTooLargeError(`Message at index ${i}`, message.content.length, maxMessageLength)
    }

    // Валидируем role
    const validRoles = ["user", "assistant", "system"]
    if (!validRoles.includes(message.role)) {
      throw new ValidationError(`Invalid role at index ${i}: ${message.role}. Must be one of: ${validRoles.join(", ")}`)
    }
  }
}

// ============================================================================
// Batch Validation
// ============================================================================

/**
 * Валидация batch операций
 *
 * @param items - Массив элементов для batch обработки
 * @param maxBatchSize - Максимальный размер batch
 * @throws {ValidationError} Если batch невалиден
 */
export function validateBatchSize(items: unknown[], maxBatchSize: number = 100): void {
  if (!items || items.length === 0) {
    throw new ValidationError("Batch cannot be empty")
  }

  if (items.length > maxBatchSize) {
    throw new InputTooLargeError("Batch size", items.length, maxBatchSize)
  }
}

/**
 * Валидация video paths для batch анализа
 *
 * @param videoPaths - Массив путей к видео
 * @param maxBatchSize - Максимальный размер batch
 * @returns Результаты валидации
 */
export function validateVideoBatch(
  videoPaths: string[],
  maxBatchSize: number = 50,
): {
  valid: string[]
  invalid: Array<{ path: string; error: string }>
} {
  validateBatchSize(videoPaths, maxBatchSize)

  const results = validateFilePaths(videoPaths, validateVideoFile)

  return {
    valid: results.filter((r) => r.valid).map((r) => r.path),
    invalid: results.filter((r) => !r.valid).map((r) => ({ path: r.path, error: r.error || "Unknown error" })),
  }
}

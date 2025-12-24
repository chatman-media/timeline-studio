/**
 * Base error class for media service errors
 */
export class MediaServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = "MediaServiceError"
  }
}

/**
 * Error thrown when FFmpeg operation fails
 */
export class FFmpegError extends MediaServiceError {
  constructor(message: string, details?: unknown) {
    super(message, "FFMPEG_ERROR", details)
    this.name = "FFmpegError"
  }
}

/**
 * Error thrown when file is not found
 */
export class FileNotFoundError extends MediaServiceError {
  constructor(filePath: string) {
    super(`File not found: ${filePath}`, "FILE_NOT_FOUND", { filePath })
    this.name = "FileNotFoundError"
  }
}

/**
 * Error thrown when file format is not supported
 */
export class UnsupportedFormatError extends MediaServiceError {
  constructor(filePath: string, format?: string) {
    super(
      `Unsupported file format: ${filePath}`,
      "UNSUPPORTED_FORMAT",
      { filePath, format }
    )
    this.name = "UnsupportedFormatError"
  }
}

/**
 * Error thrown when cache operation fails
 */
export class CacheError extends MediaServiceError {
  constructor(message: string, details?: unknown) {
    super(message, "CACHE_ERROR", details)
    this.name = "CacheError"
  }
}

/**
 * Error thrown when queue operation fails
 */
export class QueueError extends MediaServiceError {
  constructor(message: string, details?: unknown) {
    super(message, "QUEUE_ERROR", details)
    this.name = "QueueError"
  }
}

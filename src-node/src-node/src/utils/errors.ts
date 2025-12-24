export class MediaServiceError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = "MediaServiceError"
  }
}

export class FFmpegError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = "FFmpegError"
  }
}

export class FileNotFoundError extends Error {
  constructor(filePath: string) {
    super(`File not found: ${filePath}`)
    this.name = "FileNotFoundError"
  }
}

export class CacheError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = "CacheError"
  }
}

export class QueueError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = "QueueError"
  }
}

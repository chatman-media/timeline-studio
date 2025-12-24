import { config } from "../config"

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error"

export interface LogContext {
  [key: string]: unknown
}

/**
 * Structured logger using Bun console API
 */
export class Logger {
  private readonly name: string
  private readonly level: LogLevel
  private readonly levelPriority: Record<LogLevel, number> = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
  }

  constructor(name: string, level: LogLevel = "info") {
    this.name = name
    this.level = level
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.level]
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return
    }

    // Structured JSON output
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      name: this.name,
      message,
      ...context,
    }

    // Use console with colors (Bun supports ANSI colors)
    const jsonString = JSON.stringify(logData)

    if (level === "error") {
      console.error(jsonString)
    } else if (level === "warn") {
      console.warn(jsonString)
    } else {
      console.log(jsonString)
    }
  }

  trace(message: string, context?: LogContext): void {
    this.log("trace", message, context)
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context)
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context)
  }

  error(message: string, context?: LogContext): void {
    this.log("error", message, context)
  }
}

/**
 * Create a named logger instance
 */
export function createLogger(name: string): Logger {
  return new Logger(name, config.LOG_LEVEL)
}

import { config } from "../config"

type LogLevel = "trace" | "debug" | "info" | "warn" | "error"

interface LogContext {
  [key: string]: unknown
}

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
}

export class Logger {
  constructor(
    private name: string,
    private level: LogLevel = config.LOG_LEVEL
  ) {}

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level]
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return
    }

    const logData = {
      timestamp: new Date().toISOString(),
      level,
      name: this.name,
      message,
      ...context,
    }

    const output = JSON.stringify(logData)

    if (level === "error") {
      console.error(output)
    } else if (level === "warn") {
      console.warn(output)
    } else {
      console.log(output)
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

export function createLogger(name: string): Logger {
  return new Logger(name, config.LOG_LEVEL)
}

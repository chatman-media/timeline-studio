/**
 * Unified logging utility using Tauri plugin-log
 * Logs to both console and Tauri backend for comprehensive debugging
 */

import { debug, error, info, trace, warn } from "@tauri-apps/plugin-log"

type LogLevel = "trace" | "debug" | "info" | "warn" | "error"

interface LogContext {
  [key: string]: unknown
}

/**
 * Форматирует контекст в читаемую строку
 */
function formatContext(context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) return ""
  try {
    return ` ${JSON.stringify(context, null, 2)}`
  } catch (err) {
    return ` [Context serialization error: ${String(err)}]`
  }
}

/**
 * Базовая функция логирования
 */
async function log(level: LogLevel, module: string, message: string, context?: LogContext) {
  const prefix = `[${module}]`
  const fullMessage = `${prefix} ${message}${formatContext(context)}`

  // Log to console for browser debugging
  const consoleLog = {
    trace: console.debug,
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  }[level]

  consoleLog(fullMessage)

  // Log to Tauri backend
  try {
    const tauriLog = { trace, debug, info, warn, error }[level]
    await tauriLog(fullMessage)
  } catch (err) {
    console.error("[TauriLogger] Failed to log to backend:", err)
  }
}

/**
 * Logger instance with module context
 */
export class TauriLogger {
  constructor(private module: string) {}

  async trace(message: string, context?: LogContext) {
    await log("trace", this.module, message, context)
  }

  async debug(message: string, context?: LogContext) {
    await log("debug", this.module, message, context)
  }

  async info(message: string, context?: LogContext) {
    await log("info", this.module, message, context)
  }

  async warn(message: string, context?: LogContext) {
    await log("warn", this.module, message, context)
  }

  async error(message: string, context?: LogContext) {
    await log("error", this.module, message, context)
  }

  /**
   * Synchronous logging (для случаев где нельзя использовать async)
   */
  traceSync(message: string, context?: LogContext) {
    const prefix = `[${this.module}]`
    const fullMessage = `${prefix} ${message}${formatContext(context)}`
    console.debug(fullMessage)
    void trace(fullMessage).catch((err) => console.error("[TauriLogger] Failed to log to backend:", err))
  }

  debugSync(message: string, context?: LogContext) {
    const prefix = `[${this.module}]`
    const fullMessage = `${prefix} ${message}${formatContext(context)}`
    console.debug(fullMessage)
    void debug(fullMessage).catch((err) => console.error("[TauriLogger] Failed to log to backend:", err))
  }

  infoSync(message: string, context?: LogContext) {
    const prefix = `[${this.module}]`
    const fullMessage = `${prefix} ${message}${formatContext(context)}`
    console.info(fullMessage)
    void info(fullMessage).catch((err) => console.error("[TauriLogger] Failed to log to backend:", err))
  }

  warnSync(message: string, context?: LogContext) {
    const prefix = `[${this.module}]`
    const fullMessage = `${prefix} ${message}${formatContext(context)}`
    console.warn(fullMessage)
    void warn(fullMessage).catch((err) => console.error("[TauriLogger] Failed to log to backend:", err))
  }

  errorSync(message: string, context?: LogContext) {
    const prefix = `[${this.module}]`
    const fullMessage = `${prefix} ${message}${formatContext(context)}`
    console.error(fullMessage)
    void error(fullMessage).catch((err) => console.error("[TauriLogger] Failed to log to backend:", err))
  }
}

/**
 * Create logger instance for a module
 */
export function createLogger(module: string): TauriLogger {
  return new TauriLogger(module)
}

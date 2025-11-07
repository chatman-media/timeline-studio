/**
 * Unified logging utility using Tauri plugin-log
 * Logs to both console and Tauri backend for comprehensive debugging
 * Falls back to console-only in non-Tauri environments (e.g., e2e tests)
 */

type LogLevel = "trace" | "debug" | "info" | "warn" | "error"

// Check if we're in Tauri environment
const isTauriEnv = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window

// Lazy load Tauri plugin only in Tauri environment
let tauriLog: {
  trace: (message: string) => Promise<void>
  debug: (message: string) => Promise<void>
  info: (message: string) => Promise<void>
  warn: (message: string) => Promise<void>
  error: (message: string) => Promise<void>
} | null = null

if (isTauriEnv) {
  import("@tauri-apps/plugin-log")
    .then((module) => {
      tauriLog = {
        trace: module.trace,
        debug: module.debug,
        info: module.info,
        warn: module.warn,
        error: module.error,
      }
    })
    .catch((err) => {
      console.warn("[TauriLogger] Failed to load Tauri plugin-log:", err)
    })
}

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

  // Log to Tauri backend if available
  if (tauriLog) {
    try {
      await tauriLog[level](fullMessage)
    } catch (err) {
      console.error("[TauriLogger] Failed to log to backend:", err)
    }
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
    if (tauriLog) {
      void tauriLog.trace(fullMessage).catch((err) => console.error("[TauriLogger] Failed to log to backend:", err))
    }
  }

  debugSync(message: string, context?: LogContext) {
    const prefix = `[${this.module}]`
    const fullMessage = `${prefix} ${message}${formatContext(context)}`
    console.debug(fullMessage)
    if (tauriLog) {
      void tauriLog.debug(fullMessage).catch((err) => console.error("[TauriLogger] Failed to log to backend:", err))
    }
  }

  infoSync(message: string, context?: LogContext) {
    const prefix = `[${this.module}]`
    const fullMessage = `${prefix} ${message}${formatContext(context)}`
    console.info(fullMessage)
    if (tauriLog) {
      void tauriLog.info(fullMessage).catch((err) => console.error("[TauriLogger] Failed to log to backend:", err))
    }
  }

  warnSync(message: string, context?: LogContext) {
    const prefix = `[${this.module}]`
    const fullMessage = `${prefix} ${message}${formatContext(context)}`
    console.warn(fullMessage)
    if (tauriLog) {
      void tauriLog.warn(fullMessage).catch((err) => console.error("[TauriLogger] Failed to log to backend:", err))
    }
  }

  errorSync(message: string, context?: LogContext) {
    const prefix = `[${this.module}]`
    const fullMessage = `${prefix} ${message}${formatContext(context)}`
    console.error(fullMessage)
    if (tauriLog) {
      void tauriLog.error(fullMessage).catch((err) => console.error("[TauriLogger] Failed to log to backend:", err))
    }
  }
}

/**
 * Create logger instance for a module
 */
export function createLogger(module: string): TauriLogger {
  return new TauriLogger(module)
}

/**
 * Legacy exports for backward compatibility
 * These are deprecated - use createLogger() instead
 */
const defaultLogger = new TauriLogger("App")

export async function logTrace(message: string, context?: LogContext) {
  await defaultLogger.trace(message, context)
}

export async function logDebug(message: string, context?: LogContext) {
  await defaultLogger.debug(message, context)
}

export async function logInfo(message: string, context?: LogContext) {
  await defaultLogger.info(message, context)
}

export async function logWarn(message: string, context?: LogContext) {
  await defaultLogger.warn(message, context)
}

export async function logError(message: string, context?: LogContext) {
  await defaultLogger.error(message, context)
}

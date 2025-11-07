/**
 * Инициализация Tauri API
 */

import { createLogger } from "./tauri-logger"

const logger = createLogger("TauriInit")

// Проверяем и ждем загрузки Tauri
export async function waitForTauri(maxAttempts = 50): Promise<boolean> {
  logger.infoSync("Waiting for Tauri API...")
  logger.debugSync("Current URL:", { url: typeof window !== "undefined" ? window.location.href : "SSR" })
  logger.debugSync("User Agent:", { userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "SSR" })

  // В Tauri v2, проверяем также window.__TAURI_INTERNALS__
  for (let i = 0; i < maxAttempts; i++) {
    if (typeof window !== "undefined") {
      // Логируем все свойства window для диагностики
      if (i === 0) {
        logger.debugSync("Window properties:", {
          tauriProps: Object.keys(window).filter((k) => k.includes("TAURI") || k.includes("tauri")),
        })
      }

      const windowWithTauri = window as any
      if (windowWithTauri.__TAURI__ || windowWithTauri.__TAURI_INTERNALS__) {
        logger.infoSync("Tauri API loaded!", {
          hasTauri: !!windowWithTauri.__TAURI__,
          hasTauriInternals: !!windowWithTauri.__TAURI_INTERNALS__,
        })
        return true
      }
    }

    // Ждем 100ms перед следующей попыткой
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  logger.errorSync("Tauri API not loaded", { timeoutMs: maxAttempts * 100 })
  logger.errorSync("This usually means the app is not running in Tauri context")
  return false
}

// Форсируем загрузку Tauri модулей
export async function initializeTauri() {
  try {
    // Пробуем импортировать основные модули Tauri v2
    const windowModule = await import("@tauri-apps/plugin-window")
    logger.debugSync("Tauri window module imported")

    // В Tauri v2 проверяем доступные методы
    if ((windowModule as any).getCurrentWindow) {
      const currentWindow = (windowModule as any).getCurrentWindow()
      logger.debugSync("Current window obtained")
    }

    // Проверяем, что мы в Tauri окружении
    const isInTauri = await waitForTauri()
    return isInTauri
  } catch (error) {
    logger.errorSync("Failed to import Tauri modules", { error })
    return false
  }
}

// Автоматически инициализируем при загрузке модуля
if (typeof window !== "undefined") {
  // Проверяем сразу
  const windowWithTauri = window as any
  if (windowWithTauri.__TAURI__) {
    logger.infoSync("Tauri already loaded!")
  } else {
    logger.infoSync("Tauri not loaded yet, initializing...")
    void initializeTauri()
      .then((loaded) => {
        if (loaded) {
          logger.infoSync("Tauri initialization complete!")
        } else {
          logger.errorSync("Failed to initialize Tauri")
        }
      })
      .catch(() => {})
  }
}

/**
 * Environment Detection Utilities
 *
 * Функции для определения среды выполнения приложения
 */

/**
 * Проверяет, выполняется ли код в desktop приложении (Tauri)
 *
 * В Tauri v2 проверяем либо __TAURI__ (старое API), либо __TAURI_INTERNALS__ (новое API)
 */
export function isDesktop(): boolean {
  if (typeof window === "undefined") return false

  const windowWithTauri = window as any
  return windowWithTauri.__TAURI__ !== undefined || windowWithTauri.__TAURI_INTERNALS__ !== undefined
}

/**
 * Проверяет, выполняется ли код в браузере
 */
export function isBrowser(): boolean {
  if (typeof window === "undefined") return false

  const windowWithTauri = window as any
  return windowWithTauri.__TAURI__ === undefined && windowWithTauri.__TAURI_INTERNALS__ === undefined
}

/**
 * Проверяет, выполняется ли код на сервере (SSR)
 */
export function isServer(): boolean {
  return typeof window === "undefined"
}

/**
 * Проверяет, в режиме разработки ли приложение
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development"
}

/**
 * Проверяет, в продакшен режиме ли приложение
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production"
}

/**
 * Получает версию Tauri (если доступна)
 */
export async function getTauriVersion(): Promise<string | null> {
  if (!isDesktop()) {
    return null
  }

  try {
    const { getVersion } = await import("@tauri-apps/api/app")
    return await getVersion()
  } catch {
    return null
  }
}

/**
 * Проверяет доступность Web Crypto API
 */
export function hasWebCrypto(): boolean {
  return (
    typeof window !== "undefined" && typeof window.crypto !== "undefined" && typeof window.crypto.subtle !== "undefined"
  )
}

/**
 * Проверяет поддержку Service Workers
 */
export function hasServiceWorkers(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator
}

/**
 * Получает информацию о платформе
 */
export async function getPlatformInfo(): Promise<{
  type: "desktop" | "browser"
  platform?: string
  version?: string
}> {
  if (isDesktop()) {
    try {
      // В Tauri v2 используется plugin-os, но для веб-сборки возвращаем fallback
      const version = await getTauriVersion()

      return {
        type: "desktop",
        platform: "unknown", // Будет определено в рантайме в desktop версии
        version: version || undefined,
      }
    } catch {
      return { type: "desktop" }
    }
  }

  return { type: "browser" }
}

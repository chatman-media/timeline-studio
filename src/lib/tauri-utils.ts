/**
 * Утилиты для работы с Tauri
 * ✅ ОБНОВЛЕНО: Использует IPlatformService через container (FEOD архитектура)
 */

import { exists } from "@tauri-apps/plugin-fs"

import { getPlatform as getPlatformService } from "@timeline-studio/core/container"
import { createLogger } from "./tauri-logger"

const logger = createLogger("TauriUtils")

// Попробуем статический импорт для Tauri v2

/**
 * Преобразует локальный файловый путь в asset URL для Tauri v2
 * Использует встроенную функцию, но декодирует кириллические символы перед этим
 *
 * @param filePath - Локальный путь к файлу
 * @returns Asset URL для использования в HTML элементах
 */
export function convertToAssetUrl(filePath: string): string {
  // Проверяем Tauri окружение
  if (!isTauriEnvironment()) {
    logger.warnSync("Not in Tauri environment")
    return filePath
  }

  // Если путь уже является URL, возвращаем как есть
  if (filePath.startsWith("asset://") || filePath.startsWith("https://") || filePath.startsWith("http://")) {
    return filePath
  }

  // Декодируем путь, если он уже закодирован
  let cleanPath = filePath
  try {
    cleanPath = decodeURIComponent(filePath)
  } catch {
    // Если декодирование не удалось, используем исходный путь
  }

  // Используем Platform адаптер для конверсии
  try {
    const platform = getPlatformService()
    const assetUrl = platform.convertFileSrc(cleanPath)
    logger.debugSync("convertFileSrc result", { assetUrl })
    return assetUrl
  } catch (error) {
    logger.errorSync("Error with convertFileSrc", { error })
    // Fallback - возвращаем путь как есть
    return cleanPath
  }
}

/**
 * Преобразует путь к видео файлу для использования в Tauri v2
 * Использует convertFileSrc для создания безопасного URL
 *
 * @param filePath - Локальный путь к видео файлу
 * @returns URL для использования в video элементах
 */
export function convertVideoSrc(filePath: string): string {
  // Проверяем, работаем ли мы в Tauri окружении
  if (!isTauriEnvironment()) {
    logger.warnSync("Not in Tauri environment, returning original path")

    // В development режиме пробуем использовать asset URL напрямую
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      // Создаем asset URL для development
      const encodedPath = encodeURIComponent(filePath)
      const devAssetUrl = `http://asset.localhost/${encodedPath}`
      logger.debugSync("Dev mode asset URL", { devAssetUrl })
      return devAssetUrl
    }

    return filePath
  }

  // Если путь уже является URL, возвращаем как есть
  if (filePath.startsWith("asset://") || filePath.startsWith("https://") || filePath.startsWith("http://")) {
    return filePath
  }

  // Декодируем путь, если он уже закодирован
  let cleanPath = filePath
  try {
    cleanPath = decodeURIComponent(filePath)
  } catch {
    // Используем исходный путь
  }

  logger.debugSync("Converting video src", {
    original: filePath,
    cleaned: cleanPath,
    isTauri: isTauriEnvironment(),
  })

  // Используем Platform адаптер для конверсии
  try {
    const platform = getPlatformService()
    const assetUrl = platform.convertFileSrc(cleanPath)
    logger.debugSync("convertFileSrc result", { assetUrl })

    // Если URL начинается с asset://, http://asset.localhost или file://, возвращаем как есть
    if (
      assetUrl &&
      (assetUrl.startsWith("asset://") ||
        assetUrl.startsWith("http://asset.localhost") ||
        assetUrl.startsWith("file://"))
    ) {
      return assetUrl
    }

    return assetUrl
  } catch (error) {
    logger.errorSync("Error with convertFileSrc", { error })
    // Fallback - возвращаем путь как есть
    return cleanPath
  }
}

/**
 * Проверяет доступность файла через Tauri API
 * @param filePath - Путь к файлу
 * @returns Promise<boolean> - true если файл доступен
 */
export async function checkFileAccess(filePath: string): Promise<boolean> {
  try {
    const fileExists = await exists(filePath)
    logger.debugSync("File exists check", { filePath, fileExists })
    return fileExists
  } catch (error) {
    logger.errorSync("Error checking file access", { filePath, error })
    return false
  }
}

/**
 * Проверяет, работает ли приложение в Tauri окружении
 * @returns true если приложение запущено в Tauri
 */
export function isTauriEnvironment(): boolean {
  if (typeof window === "undefined") return false

  // В Tauri v2 также проверяем __TAURI_INTERNALS__
  const windowWithTauri = window as any
  const hasTauri = windowWithTauri.__TAURI__ !== undefined
  const hasTauriInternals = windowWithTauri.__TAURI_INTERNALS__ !== undefined

  const isTauri = hasTauri || hasTauriInternals

  if (isTauri) {
    logger.debugSync("Tauri detected", { hasTauri, hasTauriInternals })
  }

  return isTauri
}

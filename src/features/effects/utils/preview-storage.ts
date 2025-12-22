/**
 * Утилита для сохранения и загрузки превью эффектов в localStorage
 */

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("PreviewStorage")
const STORAGE_KEY = "effect-previews"

export interface PreviewPathMap {
  [effectId: string]: string
}

/**
 * Сохранить пути к превью в localStorage
 */
export function savePreviewPaths(previewPaths: Map<string, string>): void {
  try {
    const pathsObject: PreviewPathMap = {}
    previewPaths.forEach((path, effectId) => {
      pathsObject[effectId] = path
    })

    localStorage.setItem(STORAGE_KEY, JSON.stringify(pathsObject))
    void logger.info("Preview paths saved to localStorage", {
      count: previewPaths.size,
    })
  } catch (error) {
    void logger.error("Failed to save preview paths", { error })
  }
}

/**
 * Загрузить пути к превью из localStorage
 */
export function loadPreviewPaths(): Map<string, string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return new Map()
    }

    const pathsObject: PreviewPathMap = JSON.parse(stored)
    const previewPaths = new Map<string, string>()

    Object.entries(pathsObject).forEach(([effectId, path]) => {
      previewPaths.set(effectId, path)
    })

    void logger.info("Preview paths loaded from localStorage", {
      count: previewPaths.size,
    })

    return previewPaths
  } catch (error) {
    void logger.error("Failed to load preview paths", { error })
    return new Map()
  }
}

/**
 * Очистить все сохраненные превью
 */
export function clearPreviewPaths(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    void logger.info("Preview paths cleared from localStorage")
  } catch (error) {
    void logger.error("Failed to clear preview paths", { error })
  }
}

/**
 * Получить путь к превью для конкретного эффекта
 */
export function getPreviewPath(effectId: string): string | undefined {
  const paths = loadPreviewPaths()
  return paths.get(effectId)
}

/**
 * Сохранить путь к превью для одного эффекта
 */
export function savePreviewPath(effectId: string, path: string): void {
  const paths = loadPreviewPaths()
  paths.set(effectId, path)
  savePreviewPaths(paths)
}

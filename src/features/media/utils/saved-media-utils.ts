import { invoke } from "@tauri-apps/api/core"
import { basename, dirname, join } from "@tauri-apps/api/path"

import type { MediaFile } from "@/features/media/types/media"
import type { FileStatus, MusicMetadata, SavedMediaFile, SavedMusicFile } from "@/features/media/types/saved-media"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("SavedMediaUtils")

/**
 * Генерирует уникальный ID для медиафайла
 * Основан на пути к файлу, размере и времени модификации
 */
export function generateFileId(filePath: string, metadata: any): string {
  try {
    const data = `${filePath}:${metadata.size || 0}:${metadata.lastModified || Date.now()}`
    // Создаем простой hash и конвертируем в base64, затем очищаем от специальных символов
    const hash = btoa(data).replace(/[^a-zA-Z0-9]/g, "")
    // Берем больше символов для уникальности, но ограничиваем разумным размером
    return hash.substring(0, 24) || `fallback_${Date.now()}`
  } catch (error) {
    logger.warnSync("Error generating file ID", { error })
    // Fallback: используем timestamp + случайное число
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }
}

/**
 * Вычисляет относительный путь от файла проекта к медиафайлу
 * Возвращает относительный путь только если файл находится в поддиректории проекта
 */
export async function calculateRelativePath(filePath: string, projectPath: string | null): Promise<string | undefined> {
  if (!projectPath) return undefined

  try {
    const projectDir = await dirname(projectPath)

    // Простая проверка: если файл начинается с директории проекта
    if (filePath.startsWith(projectDir)) {
      // Убираем путь к директории проекта и начальный слеш
      const relativePath = filePath.substring(projectDir.length).replace(/^[/\\]/, "")
      return relativePath || undefined
    }
  } catch (error) {
    logger.warnSync("Could not calculate relative path", { error })
  }

  return undefined
}

/**
 * Проверяет существование файла
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const result = await invoke<boolean>("file_exists", { path: filePath })
    return result
  } catch (error) {
    logger.warnSync("Error checking file existence", { filePath, error })
    return false
  }
}

/**
 * Получает статистику файла (размер, время модификации)
 */
export async function getFileStats(filePath: string): Promise<{
  size: number
  lastModified: number
} | null> {
  try {
    const stats = await invoke<{ size: number; lastModified: number }>("get_file_stats", {
      path: filePath,
    })
    return stats
  } catch (error) {
    logger.warnSync("Error getting file stats", { filePath, error })
    return null
  }
}

/**
 * Получает платформу операционной системы
 */
export async function getPlatform(): Promise<string> {
  try {
    const platform = await invoke<string>("get_platform")
    return platform
  } catch (error) {
    logger.warnSync("Error getting platform", { error })
    return "unknown"
  }
}

/**
 * Конвертирует MediaFile в SavedMediaFile для сохранения в проект
 */
export async function convertToSavedMediaFile(file: MediaFile, projectPath?: string): Promise<SavedMediaFile> {
  const relativePath = projectPath ? await calculateRelativePath(file.path, projectPath) : undefined

  return {
    id: file.id,
    originalPath: file.path,
    relativePath,
    name: file.name,
    size: file.size || 0,
    lastModified: Date.now(), // Используем текущее время, так как lastModified может отсутствовать
    isVideo: file.isVideo || false,
    isAudio: file.isAudio || false,
    isImage: file.isImage || false,
    metadata: {
      duration: file.duration,
      startTime: file.startTime,
      createdAt: file.createdAt,
      probeData: file.probeData,
    },
    status: "available" as FileStatus,
    lastChecked: Date.now(),
  }
}

/**
 * Конвертирует MediaFile в SavedMusicFile для сохранения в проект
 */
export async function convertToSavedMusicFile(file: MediaFile, projectPath?: string): Promise<SavedMusicFile> {
  const savedFile = await convertToSavedMediaFile(file, projectPath)

  // Извлекаем музыкальные метаданные из probeData, если они есть
  const musicMetadata: MusicMetadata = {}

  if (file.probeData?.format?.tags) {
    const tags = file.probeData.format.tags
    musicMetadata.artist =
      typeof tags.artist === "string" ? tags.artist : typeof tags.ARTIST === "string" ? tags.ARTIST : undefined
    musicMetadata.album =
      typeof tags.album === "string" ? tags.album : typeof tags.ALBUM === "string" ? tags.ALBUM : undefined
    musicMetadata.genre =
      typeof tags.genre === "string" ? tags.genre : typeof tags.GENRE === "string" ? tags.GENRE : undefined
    musicMetadata.title =
      typeof tags.title === "string" ? tags.title : typeof tags.TITLE === "string" ? tags.TITLE : undefined
    musicMetadata.year = tags.date ? Number.parseInt(String(tags.date), 10) : undefined
    musicMetadata.track = tags.track ? Number.parseInt(String(tags.track), 10) : undefined
  }

  return {
    ...savedFile,
    musicMetadata,
  }
}

/**
 * Конвертирует SavedMediaFile обратно в MediaFile
 */
export function convertFromSavedMediaFile(saved: SavedMediaFile): MediaFile {
  return {
    id: saved.id,
    name: saved.name,
    path: saved.originalPath,
    isVideo: saved.isVideo,
    isAudio: saved.isAudio,
    isImage: saved.isImage,
    size: saved.size,
    duration: saved.metadata.duration,
    startTime: saved.metadata.startTime,
    createdAt: saved.metadata.createdAt,
    probeData: saved.metadata.probeData,
    // Добавляем флаг, что файл загружен из проекта
    isLoadingMetadata: false,
    // Добавляем информацию о статусе для UI (расширяем тип)
    lastCheckedAt: saved.lastChecked,
  } as MediaFile & {
    _savedFileStatus?: typeof saved.status
    _lastChecked?: number
  }
}

/**
 * Получает расширения файлов для фильтра диалога на основе SavedMediaFile
 */
export function getExtensionsForFile(file: SavedMediaFile): string[] {
  const extension = file.name.split(".").pop()?.toLowerCase()

  if (!extension) return ["*"]

  if (file.isVideo) {
    return ["mp4", "avi", "mkv", "mov", "webm", extension]
  }

  if (file.isAudio) {
    return ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma", extension]
  }

  if (file.isImage) {
    return ["jpg", "jpeg", "png", "gif", "webp", "heic", extension]
  }

  return [extension]
}

/**
 * Создает список альтернативных путей для поиска файла
 */
export async function generateAlternativePaths(originalPath: string, projectDir: string): Promise<string[]> {
  const alternatives: string[] = []
  const fileName = await basename(originalPath)

  try {
    // Добавляем путь в директории проекта
    alternatives.push(await join(projectDir, fileName))

    // Добавляем путь в поддиректории 'media' проекта
    alternatives.push(await join(projectDir, "media", fileName))

    // Добавляем путь в поддиректории 'assets' проекта
    alternatives.push(await join(projectDir, "assets", fileName))

    // Добавляем путь в поддиректории 'files' проекта
    alternatives.push(await join(projectDir, "files", fileName))

    // Используем системный поиск для более глубокого поиска
    try {
      const foundPaths = await searchFilesByName(projectDir, fileName, 3) // Максимум 3 уровня
      alternatives.push(...foundPaths)
    } catch (searchError) {
      logger.warnSync("System search failed", { searchError })
    }
  } catch (error) {
    logger.warnSync("Error generating alternative paths", { error })
  }

  // Убираем дубликаты
  return [...new Set(alternatives)]
}

/**
 * Ищет файлы по имени в директории (используя системный поиск)
 */
export async function searchFilesByName(directory: string, filename: string, maxDepth = 3): Promise<string[]> {
  try {
    const result = await invoke<string[]>("search_files_by_name", {
      directory,
      filename,
      maxDepth,
    })
    return result
  } catch (error) {
    logger.warnSync("Error searching for files", { filename, error })
    return []
  }
}

/**
 * Получает абсолютный путь к файлу
 */
export async function getAbsolutePath(path: string): Promise<string | null> {
  try {
    const result = await invoke<string>("get_absolute_path", { path })
    return result
  } catch (error) {
    logger.warnSync("Error getting absolute path", { path, error })
    return null
  }
}

/**
 * Проверяет, соответствует ли файл сохраненным метаданным
 */
export async function validateFileIntegrity(
  filePath: string,
  saved: SavedMediaFile,
): Promise<{
  isValid: boolean
  confidence: number
  issues: string[]
}> {
  const issues: string[] = []
  let confidence = 1.0

  try {
    // Проверяем существование файла
    const exists = await fileExists(filePath)
    if (!exists) {
      return {
        isValid: false,
        confidence: 0,
        issues: ["File does not exist"],
      }
    }

    // Проверяем размер и дату модификации
    const stats = await getFileStats(filePath)
    if (stats) {
      if (stats.size !== saved.size) {
        issues.push(`File size mismatch: expected ${saved.size}, got ${stats.size}`)
        confidence -= 0.3
      }

      if (Math.abs(stats.lastModified - saved.lastModified) > 1000) {
        // 1 секунда погрешности
        issues.push("Modification date mismatch")
        confidence -= 0.2
      }
    } else {
      issues.push("Could not get file stats")
      confidence -= 0.1
    }

    // Проверяем имя файла
    const currentName = await basename(filePath)
    if (currentName !== saved.name) {
      issues.push(`Filename mismatch: expected ${saved.name}, got ${currentName}`)
      confidence -= 0.1
    }
  } catch (error) {
    issues.push(`Error validating file: ${String(error)}`)
    confidence = 0
  }

  return {
    isValid: confidence > 0.5,
    confidence: Math.max(0, confidence),
    issues,
  }
}

/**
 * Создает время создания проекта по умолчанию
 */
export function getDefaultProjectCreationTime(): number {
  return Date.now()
}

/**
 * Получает время создания существующего проекта из файла
 */
export async function getProjectCreationTime(projectPath: string): Promise<number> {
  try {
    const stats = await getFileStats(projectPath)
    return stats?.lastModified || getDefaultProjectCreationTime()
  } catch (error) {
    logger.warnSync("Error getting project creation time", { error })
    return getDefaultProjectCreationTime()
  }
}

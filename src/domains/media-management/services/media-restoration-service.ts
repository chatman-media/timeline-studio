import { dirname } from "@tauri-apps/api/path"
import { open } from "@tauri-apps/plugin-dialog"
import { createLogger } from "@/lib/tauri-logger"
import type { MediaFile, SavedMediaFile, SavedMusicFile } from "../types"
import {
  convertFromSavedMediaFile,
  fileExists,
  generateAlternativePaths,
  getExtensionsForFile,
  validateFileIntegrity,
} from "../utils/saved-media-utils"

const logger = createLogger("MediaRestoration")

/**
 * Результат попытки восстановления файла
 */
export interface FileRestorationResult {
  /** Исходный сохраненный файл */
  originalFile: SavedMediaFile
  /** Восстановленный MediaFile (если найден) */
  restoredFile?: MediaFile
  /** Новый путь к файлу (если найден) */
  newPath?: string
  /** Статус восстановления */
  status: "found" | "missing" | "relocated" | "corrupted" | "user_skipped"
  /** Сообщение об ошибке или статусе */
  message?: string
}

/**
 * Результат восстановления всех медиафайлов проекта
 */
export interface ProjectRestorationResult {
  /** Успешно восстановленные медиафайлы */
  restoredMedia: MediaFile[]
  /** Успешно восстановленные музыкальные файлы */
  restoredMusic: MediaFile[]
  /** Файлы, которые не удалось найти */
  missingFiles: SavedMediaFile[]
  /** Файлы, которые были перемещены и найдены */
  relocatedFiles: Array<{ original: SavedMediaFile; newPath: string }>
  /** Поврежденные файлы */
  corruptedFiles: SavedMediaFile[]
  /** Общая статистика */
  stats: {
    total: number
    restored: number
    missing: number
    relocated: number
    corrupted: number
  }
}

/**
 * Восстанавливает все медиафайлы проекта
 */
export async function restoreProjectMedia(
  mediaFiles: SavedMediaFile[],
  musicFiles: SavedMusicFile[],
  projectPath: string,
): Promise<ProjectRestorationResult> {
  const allFiles = [...mediaFiles, ...musicFiles]
  const projectDir = await dirname(projectPath)

  const restoredMedia: MediaFile[] = []
  const restoredMusic: MediaFile[] = []
  const missingFiles: SavedMediaFile[] = []
  const relocatedFiles: Array<{ original: SavedMediaFile; newPath: string }> = []
  const corruptedFiles: SavedMediaFile[] = []

  logger.infoSync("Starting project media restoration", { totalFiles: allFiles.length })

  // Восстанавливаем файлы по одному
  for (const savedFile of allFiles) {
    try {
      const result = await restoreFile(savedFile, projectDir)

      switch (result.status) {
        case "found":
          if (result.restoredFile) {
            if (musicFiles.some((f) => f.id === savedFile.id)) {
              restoredMusic.push(result.restoredFile)
            } else {
              restoredMedia.push(result.restoredFile)
            }
          }
          break

        case "relocated":
          if (result.restoredFile && result.newPath) {
            relocatedFiles.push({
              original: savedFile,
              newPath: result.newPath,
            })
            if (musicFiles.some((f) => f.id === savedFile.id)) {
              restoredMusic.push(result.restoredFile)
            } else {
              restoredMedia.push(result.restoredFile)
            }
          }
          break

        case "missing":
          missingFiles.push(savedFile)
          break

        case "corrupted":
          corruptedFiles.push(savedFile)
          break
        default:
          // Неожиданный статус, добавляем в список отсутствующих
          missingFiles.push(savedFile)
          break
      }
    } catch (error) {
      logger.errorSync("Failed to restore file", { fileName: savedFile.name, error })
      missingFiles.push(savedFile)
    }
  }

  const stats = {
    total: allFiles.length,
    restored: restoredMedia.length + restoredMusic.length,
    missing: missingFiles.length,
    relocated: relocatedFiles.length,
    corrupted: corruptedFiles.length,
  }

  logger.infoSync("Media restoration completed", { stats })

  return {
    restoredMedia,
    restoredMusic,
    missingFiles,
    relocatedFiles,
    corruptedFiles,
    stats,
  }
}

/**
 * Восстанавливает один файл
 */
export async function restoreFile(savedFile: SavedMediaFile, projectDir: string): Promise<FileRestorationResult> {
  // 1. Проверяем файл по оригинальному пути
  const originalExists = await fileExists(savedFile.originalPath)

  if (originalExists) {
    const validation = await validateFileIntegrity(savedFile.originalPath, savedFile)

    if (validation.isValid) {
      // Файл найден и валиден
      const restoredFile = convertFromSavedMediaFile(savedFile)
      return {
        originalFile: savedFile,
        restoredFile,
        status: "found",
        message: "Файл найден по оригинальному пути",
      }
    }
    // Файл найден, но поврежден
    return {
      originalFile: savedFile,
      status: "corrupted",
      message: `Файл поврежден: ${validation.issues.join(", ")}`,
    }
  }

  // 2. Проверяем относительный путь (если есть)
  if (savedFile.relativePath) {
    try {
      const relativePath = await import("@tauri-apps/api/path").then((p) => p.join(projectDir, savedFile.relativePath!))
      const relativeExists = await fileExists(relativePath)

      if (relativeExists) {
        const validation = await validateFileIntegrity(relativePath, savedFile)

        if (validation.isValid) {
          // Файл найден по относительному пути
          const restoredFile = convertFromSavedMediaFile({
            ...savedFile,
            originalPath: relativePath,
          })

          return {
            originalFile: savedFile,
            restoredFile,
            newPath: relativePath,
            status: "relocated",
            message: "Файл найден по относительному пути",
          }
        }
      }
    } catch (error) {
      logger.warnSync("Failed to check relative path", { error })
    }
  }

  // 3. Ищем файл в альтернативных местах
  const alternativePaths = await generateAlternativePaths(savedFile.originalPath, projectDir)

  for (const altPath of alternativePaths) {
    const altExists = await fileExists(altPath)

    if (altExists) {
      const validation = await validateFileIntegrity(altPath, savedFile)

      if (validation.isValid) {
        // Файл найден в альтернативном месте
        const restoredFile = convertFromSavedMediaFile({
          ...savedFile,
          originalPath: altPath,
        })

        return {
          originalFile: savedFile,
          restoredFile,
          newPath: altPath,
          status: "relocated",
          message: `Файл найден в альтернативном месте: ${altPath}`,
        }
      }
    }
  }

  // 4. Файл не найден
  return {
    originalFile: savedFile,
    status: "missing",
    message: "Файл не найден ни по одному из путей",
  }
}

/**
 * Предлагает пользователю найти отсутствующий файл
 */
export async function promptUserToFindFile(savedFile: SavedMediaFile): Promise<string | null> {
  try {
    const extensions = getExtensionsForFile(savedFile)

    const selectedPath = await open({
      title: `Найти файл: ${savedFile.name}`,
      multiple: false,
      filters: [
        {
          name: `${savedFile.name} (${extensions.join(", ")})`,
          extensions,
        },
        {
          name: "Все файлы",
          extensions: ["*"],
        },
      ],
    })

    if (typeof selectedPath === "string") {
      // Валидируем выбранный файл
      const validation = await validateFileIntegrity(selectedPath, savedFile)

      if (validation.confidence > 0.3) {
        // Минимальная уверенность 30%
        return selectedPath
      }
      logger.warnSync("Selected file does not match expected", { issues: validation.issues })
      return null
    }

    return null
  } catch (error) {
    logger.errorSync("Failed to prompt user for file", { error })
    return null
  }
}

/**
 * Обрабатывает отсутствующие файлы с участием пользователя
 */
export async function handleMissingFiles(
  missingFiles: SavedMediaFile[],
  onProgress?: (current: number, total: number, fileName: string) => void,
): Promise<{
  found: Array<{
    original: SavedMediaFile
    newPath: string
    restoredFile: MediaFile
  }>
  stillMissing: SavedMediaFile[]
  userCancelled: SavedMediaFile[]
}> {
  const found: Array<{
    original: SavedMediaFile
    newPath: string
    restoredFile: MediaFile
  }> = []
  const stillMissing: SavedMediaFile[] = []
  const userCancelled: SavedMediaFile[] = []

  for (let i = 0; i < missingFiles.length; i++) {
    const savedFile = missingFiles[i]

    if (onProgress) {
      onProgress(i + 1, missingFiles.length, savedFile.name)
    }

    const newPath = await promptUserToFindFile(savedFile)

    if (newPath) {
      // Пользователь нашел файл
      const restoredFile = convertFromSavedMediaFile({
        ...savedFile,
        originalPath: newPath,
      })

      found.push({
        original: savedFile,
        newPath,
        restoredFile,
      })
    } else {
      // Пользователь отменил или файл не подходит
      userCancelled.push(savedFile)
    }
  }

  return { found, stillMissing, userCancelled }
}

/**
 * Создает отчет о восстановлении для пользователя
 */
export function generateRestorationReport(result: ProjectRestorationResult): string {
  const { stats } = result

  let report = "Восстановление медиафайлов завершено:\n\n"
  report += "📊 Общая статистика:\n"
  report += `• Всего файлов: ${stats.total}\n`
  report += `• Восстановлено: ${stats.restored}\n`
  report += `• Перемещено: ${stats.relocated}\n`
  report += `• Отсутствует: ${stats.missing}\n`
  report += `• Повреждено: ${stats.corrupted}\n\n`

  if (result.relocatedFiles.length > 0) {
    report += "📁 Перемещенные файлы:\n"
    result.relocatedFiles.forEach(({ original, newPath }) => {
      report += `• ${original.name}: ${newPath}\n`
    })
    report += "\n"
  }

  if (result.missingFiles.length > 0) {
    report += "❌ Отсутствующие файлы:\n"
    result.missingFiles.forEach((file) => {
      report += `• ${file.name} (${file.originalPath})\n`
    })
    report += "\n"
  }

  if (result.corruptedFiles.length > 0) {
    report += "⚠️ Поврежденные файлы:\n"
    result.corruptedFiles.forEach((file) => {
      report += `• ${file.name}\n`
    })
  }

  return report
}

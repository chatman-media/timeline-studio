import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs"

import type { SavedMediaFile, SavedMusicFile } from "@/features/media/types/saved-media"
import type { ProjectFile } from "@/features/project-settings/types/project"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("ProjectFileService")

/**
 * Сервис для работы с файлами проектов (.tls)
 * Обеспечивает сохранение и загрузку проектов с медиабиблиотекой
 */

/**
 * Загружает проект из файла
 */
export async function loadProject(projectPath: string): Promise<ProjectFile> {
  try {
    const content = await readTextFile(projectPath)

    let projectData: any
    try {
      projectData = JSON.parse(content)
    } catch (parseError) {
      throw new Error(`Failed to parse project file: ${String(parseError)}`)
    }

    // Валидируем структуру проекта
    validateProjectStructure(projectData)

    return projectData as ProjectFile
  } catch (error) {
    logger.error(`Error loading project from ${projectPath}:`, { error })

    // Если это уже наша ошибка валидации, пробрасываем её как есть
    if (
      error instanceof Error &&
      (error.message.startsWith("Invalid project structure") ||
        error.message.startsWith("Unsupported project version") ||
        error.message.startsWith("Invalid media library") ||
        error.message.startsWith("Invalid saved media file") ||
        error.message.startsWith("Failed to parse project file"))
    ) {
      throw error
    }

    // Иначе оборачиваем в общую ошибку
    throw new Error(`Failed to load project: ${String(error)}`)
  }
}

/**
 * Сохраняет проект в файл
 */
export async function saveProject(projectPath: string, projectData: ProjectFile): Promise<void> {
  try {
    // Обновляем метаданные перед сохранением
    const updatedProject: ProjectFile = {
      ...projectData,
      meta: {
        ...projectData.meta,
        lastModified: Date.now(),
      },
    }

    const content = JSON.stringify(updatedProject, null, 2)
    await writeTextFile(projectPath, content)

    logger.info(`Project saved to ${projectPath}`)
  } catch (error) {
    logger.error(`Error saving project to ${projectPath}:`, { error })
    throw new Error(`Failed to save project: ${String(error)}`)
  }
}

/**
 * Создает новый проект с базовой структурой
 */
export function createNewProject(_name: string): ProjectFile {
  return {
    settings: {
      aspectRatio: {
        label: "16:9",
        textLabel: "Широкоэкранный",
        description: "YouTube",
        value: {
          width: 1920,
          height: 1080,
          name: "16:9",
        },
      },
      resolution: "1920x1080",
      frameRate: "30",
      colorSpace: "sdr",
    },
    mediaPool: {
      mediaFiles: [],
      musicFiles: [],
      lastUpdated: Date.now(),
      version: "1.0.0",
    },
    workspaceSettings: {
      media: {
        viewMode: "grid",
        sortBy: "name",
        sortOrder: "asc",
        searchQuery: "",
        filterType: "all",
        groupBy: "none",
      },
      music: {
        viewMode: "list",
        sortBy: "name",
        sortOrder: "asc",
        searchQuery: "",
        filterType: "all",
        groupBy: "none",
        showFavoritesOnly: false,
      },
    },
    favoriteFiles: {
      mediaFiles: [],
      musicFiles: [],
    },
    meta: {
      version: "1.0.0",
      createdAt: Date.now(),
      lastModified: Date.now(),
      originalPlatform: "unknown",
    },
  } as ProjectFile
}

/**
 * Обновляет медиабиблиотеку в проекте
 */
export function updateMediaLibrary(
  project: ProjectFile,
  mediaFiles: SavedMediaFile[],
  musicFiles: SavedMusicFile[],
): ProjectFile {
  return {
    ...project,
    mediaPool: {
      mediaFiles,
      musicFiles,
      lastUpdated: Date.now(),
      version: (project as any).mediaPool?.version || "1.0.0",
    },
  } as ProjectFile
}

/**
 * Обновляет состояние браузера в проекте
 */
export function updateBrowserState(project: ProjectFile, workspaceSettings: any): ProjectFile {
  return {
    ...project,
    workspaceSettings,
  } as ProjectFile
}

/**
 * Обновляет избранные файлы в проекте
 */
export function updateProjectFavorites(project: ProjectFile, favorites: any): ProjectFile {
  return {
    ...project,
    favoriteFiles: favorites,
  } as ProjectFile
}

/**
 * Валидирует структуру загруженного проекта
 */
function validateProjectStructure(project: any): void {
  if (!project || typeof project !== "object") {
    throw new Error("Invalid project structure: not an object")
  }

  // Проверяем обязательные поля
  if (!project.settings) {
    throw new Error("Invalid project structure: missing settings")
  }

  if (!project.meta) {
    throw new Error("Invalid project structure: missing meta")
  }

  // Проверяем версию проекта
  if (project.meta.version && !isVersionSupported(project.meta.version)) {
    throw new Error(`Unsupported project version: ${project.meta.version}`)
  }

  // Если есть медиабиблиотека, валидируем её
  if (project.mediaPool) {
    validateMediaLibrary(project.mediaPool)
  }
}

/**
 * Проверяет, поддерживается ли версия проекта
 */
function isVersionSupported(version: string): boolean {
  const supportedVersions = ["1.0.0"]
  return supportedVersions.includes(version)
}

/**
 * Валидирует структуру медиабиблиотеки
 */
function validateMediaLibrary(mediaPool: any): void {
  if (!Array.isArray(mediaPool.mediaFiles)) {
    throw new Error("Invalid media library: mediaFiles must be an array")
  }

  if (!Array.isArray(mediaPool.musicFiles)) {
    throw new Error("Invalid media library: musicFiles must be an array")
  }

  // Валидируем каждый медиафайл
  for (const file of mediaPool.mediaFiles) {
    validateSavedMediaFile(file)
  }

  for (const file of mediaPool.musicFiles) {
    validateSavedMediaFile(file)
  }
}

/**
 * Валидирует структуру сохраненного медиафайла
 */
function validateSavedMediaFile(file: any): void {
  const requiredFields = ["id", "originalPath", "name", "size", "isVideo", "isAudio", "isImage"]

  for (const field of requiredFields) {
    if (!(field in file)) {
      throw new Error(`Invalid saved media file: missing field ${field}`)
    }
  }

  if (typeof file.id !== "string" || file.id.length === 0) {
    throw new Error("Invalid saved media file: id must be a non-empty string")
  }

  if (typeof file.originalPath !== "string" || file.originalPath.length === 0) {
    throw new Error("Invalid saved media file: originalPath must be a non-empty string")
  }
}

/**
 * Мигрирует проект к новой версии (если необходимо)
 */
export function migrateProject(project: ProjectFile): ProjectFile {
  // В будущем здесь будет логика миграции между версиями
  return project
}

/**
 * Получает статистику проекта
 */
export function getProjectStats(project: ProjectFile): {
  totalMediaFiles: number
  totalMusicFiles: number
  totalSize: number
  lastModified: number
} {
  const mediaFiles = (project as any).mediaPool?.mediaFiles || []
  const musicFiles = (project as any).mediaPool?.musicFiles || []

  const totalSize = [...mediaFiles, ...musicFiles].reduce((sum: number, file) => {
    const fileSize = Number(file?.size) || 0
    return sum + fileSize
  }, 0)

  return {
    totalMediaFiles: mediaFiles.length,
    totalMusicFiles: musicFiles.length,
    totalSize,
    lastModified: project.meta.lastModified,
  }
}

/**
 * Проверяет, есть ли несохраненные изменения в проекте
 */
export function hasUnsavedChanges(
  project: ProjectFile,
  currentMediaFiles: SavedMediaFile[],
  currentMusicFiles: SavedMusicFile[],
): boolean {
  const savedMediaFiles = (project as any).mediaPool?.mediaFiles || []
  const savedMusicFiles = (project as any).mediaPool?.musicFiles || []

  // Сравниваем количество файлов
  if (savedMediaFiles.length !== currentMediaFiles.length || savedMusicFiles.length !== currentMusicFiles.length) {
    return true
  }

  // Сравниваем ID файлов
  const savedMediaIds = new Set(savedMediaFiles.map((f: any) => f.id))
  const currentMediaIds = new Set(currentMediaFiles.map((f: any) => f.id))

  const savedMusicIds = new Set(savedMusicFiles.map((f: any) => f.id))
  const currentMusicIds = new Set(currentMusicFiles.map((f: any) => f.id))

  // Проверяем, есть ли различия в наборах ID
  for (const id of currentMediaIds) {
    if (!savedMediaIds.has(id)) return true
  }

  for (const id of currentMusicIds) {
    if (!savedMusicIds.has(id)) return true
  }

  return false
}

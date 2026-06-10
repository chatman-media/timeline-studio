import { container } from "@timeline-studio/core/container"
import type { MediaFile, SavedMediaFile } from "@timeline-studio/core/types"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("MediaRestorationService")

export interface FileRestorationResult {
  originalFile: SavedMediaFile
  restoredFile?: MediaFile
  newPath?: string
  status: "found" | "missing" | "relocated" | "corrupted" | "user_skipped"
  message?: string
}

export interface ProjectRestorationResult {
  restoredMedia: MediaFile[]
  restoredMusic: MediaFile[]
  missingFiles: SavedMediaFile[]
  relocatedFiles: Array<{ original: SavedMediaFile; newPath: string }>
  corruptedFiles: SavedMediaFile[]
  stats: {
    total: number
    restored: number
    missing: number
    relocated: number
    corrupted: number
  }
}

function getExtensionsForFile(savedFile: SavedMediaFile): string[] {
  const extension = savedFile.name.split(".").pop()?.toLowerCase()
  const extensions = new Set<string>()

  if (extension && extension !== savedFile.name.toLowerCase()) {
    extensions.add(extension)
  }

  if (savedFile.isVideo) {
    for (const ext of ["mp4", "mov", "avi", "mkv", "webm", "m4v"]) extensions.add(ext)
  }
  if (savedFile.isAudio) {
    for (const ext of ["mp3", "wav", "aac", "flac", "ogg", "m4a"]) extensions.add(ext)
  }
  if (savedFile.isImage) {
    for (const ext of ["jpg", "jpeg", "png", "gif", "webp", "bmp"]) extensions.add(ext)
  }

  return Array.from(extensions)
}

export async function promptUserToFindFile(savedFile: SavedMediaFile): Promise<string | null> {
  try {
    if (!container.hasPlatform()) {
      return null
    }

    const extensions = getExtensionsForFile(savedFile)
    const selectedPath = await container.getPlatform().showOpenDialog({
      title: `Найти файл: ${savedFile.name}`,
      multiple: false,
      filters: [
        {
          name: `${savedFile.name}${extensions.length > 0 ? ` (${extensions.join(", ")})` : ""}`,
          extensions: extensions.length > 0 ? extensions : ["*"],
        },
        {
          name: "Все файлы",
          extensions: ["*"],
        },
      ],
    })

    return selectedPath?.[0] ?? null
  } catch (error) {
    logger.errorSync("Failed to prompt user for file", { error })
    return null
  }
}

export function generateRestorationReport(result: ProjectRestorationResult): string {
  const { stats } = result

  return [
    "Восстановление медиафайлов завершено:",
    "",
    "Общая статистика:",
    `Всего файлов: ${stats.total}`,
    `Восстановлено: ${stats.restored}`,
    `Перемещено: ${stats.relocated}`,
    `Отсутствует: ${stats.missing}`,
    `Повреждено: ${stats.corrupted}`,
  ].join("\n")
}

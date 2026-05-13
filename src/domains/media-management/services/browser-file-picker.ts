/**
 * Browser File Picker Service
 *
 * Использует File System Access API для выбора файлов в браузере
 * Требует Chrome 86+, Edge 86+ или другой Chromium-based браузер
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 */

/**
 * Опции для выбора файлов
 */
export interface BrowserFilePickerOptions {
  multiple?: boolean
  accept?: Record<string, string[] | readonly string[]>
  excludeAcceptAllOption?: boolean
}

/**
 * Результат выбора файлов
 */
export interface BrowserFilePickerResult {
  handles: FileSystemFileHandle[]
  files: File[]
}

/**
 * Проверка поддержки File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "showOpenFilePicker" in window &&
    "showDirectoryPicker" in window
  )
}

/**
 * Открывает нативный file picker используя File System Access API
 *
 * @param options Опции выбора файлов
 * @returns Promise с FileSystemFileHandle[] или null если отменено
 *
 * @example
 * ```typescript
 * const handles = await openBrowserFilePicker({
 *   multiple: true,
 *   accept: {
 *     'video/*': ['.mp4', '.mov'],
 *     'audio/*': ['.mp3', '.wav']
 *   }
 * })
 * ```
 */
export async function openBrowserFilePicker(
  options: BrowserFilePickerOptions = {},
): Promise<FileSystemFileHandle[] | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error("File System Access API is not supported in this browser")
  }

  try {
    const handles = await (window as typeof window & { showOpenFilePicker: (options?: object) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker({
      multiple: options.multiple ?? false,
      excludeAcceptAllOption: options.excludeAcceptAllOption ?? false,
      types: options.accept
        ? [
            {
              description: "Media Files",
              accept: options.accept,
            },
          ]
        : undefined,
    })

    return handles
  } catch (error) {
    // Пользователь отменил выбор
    if ((error as Error).name === "AbortError") {
      return null
    }

    // Другие ошибки пробрасываем дальше
    throw error
  }
}

/**
 * Открывает нативный directory picker используя File System Access API
 *
 * @returns Promise с FileSystemDirectoryHandle или null если отменено
 *
 * @example
 * ```typescript
 * const dirHandle = await openBrowserDirectoryPicker()
 * if (dirHandle) {
 *   console.log('Selected directory:', dirHandle.name)
 * }
 * ```
 */
export async function openBrowserDirectoryPicker(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error("File System Access API is not supported in this browser")
  }

  try {
    const dirHandle = await (window as typeof window & { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker()
    return dirHandle
  } catch (error) {
    // Пользователь отменил выбор
    if ((error as Error).name === "AbortError") {
      return null
    }

    // Другие ошибки пробрасываем дальше
    throw error
  }
}

/**
 * Получает File objects из FileSystemFileHandle[]
 *
 * @param handles Массив file handles
 * @returns Promise с массивом File objects
 */
export async function getFilesFromHandles(handles: FileSystemFileHandle[]): Promise<File[]> {
  return await Promise.all(handles.map((handle) => handle.getFile()))
}

/**
 * Получает все файлы из директории (рекурсивно опционально)
 *
 * @param dirHandle Directory handle
 * @param recursive Сканировать рекурсивно
 * @returns Promise с массивом File objects
 */
export async function getFilesFromDirectory(
  dirHandle: FileSystemDirectoryHandle,
  recursive: boolean = false,
): Promise<File[]> {
  const files: File[] = []

  for await (const entry of dirHandle.values()) {
    if (entry.kind === "file") {
      const file = await (entry as FileSystemFileHandle).getFile()
      files.push(file)
    } else if (entry.kind === "directory" && recursive) {
      const subFiles = await getFilesFromDirectory(entry as FileSystemDirectoryHandle, recursive)
      files.push(...subFiles)
    }
  }

  return files
}

/**
 * Типы MIME для распространенных медиа форматов
 */
export const MEDIA_MIME_TYPES = {
  video: {
    "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v", ".wmv", ".flv"],
  },
  audio: {
    "audio/*": [".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a", ".wma"],
  },
  image: {
    "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".svg"],
  },
  all: {
    "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v", ".wmv", ".flv"],
    "audio/*": [".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a", ".wma"],
    "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".svg"],
  },
} as const

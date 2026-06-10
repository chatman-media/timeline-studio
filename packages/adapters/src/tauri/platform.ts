/**
 * Tauri Platform Adapter
 *
 * Реализация IPlatformService для Tauri.
 * Использует Tauri плагины для платформо-зависимых операций.
 */

import { invoke } from "@tauri-apps/api/core"

import type {
  FileStats,
  IPlatformService,
  NotificationOptions,
  OpenDialogOptions,
  SaveDialogOptions,
} from "@timeline-studio/core/ports"

export class TauriPlatformService implements IPlatformService {
  // === File Dialogs ===

  async showOpenDialog(options?: OpenDialogOptions): Promise<string[] | null> {
    const { open } = await import("@tauri-apps/plugin-dialog")

    const result = await open({
      title: options?.title,
      defaultPath: options?.defaultPath,
      filters: options?.filters,
      multiple: options?.multiple ?? false,
      directory: options?.directory ?? false,
    })

    if (result === null) {
      return null
    }

    // Normalize to array
    return Array.isArray(result) ? result : [result]
  }

  async showSaveDialog(options?: SaveDialogOptions): Promise<string | null> {
    const { save } = await import("@tauri-apps/plugin-dialog")

    return save({
      title: options?.title,
      defaultPath: options?.defaultPath,
      filters: options?.filters,
    })
  }

  // === File System ===

  async readFile(path: string): Promise<Uint8Array> {
    const { readFile } = await import("@tauri-apps/plugin-fs")
    return readFile(path)
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    const { writeFile } = await import("@tauri-apps/plugin-fs")
    await writeFile(path, data)
  }

  async readTextFile(path: string): Promise<string> {
    const { readTextFile } = await import("@tauri-apps/plugin-fs")
    return readTextFile(path)
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    const { writeTextFile } = await import("@tauri-apps/plugin-fs")
    await writeTextFile(path, content)
  }

  async exists(path: string): Promise<boolean> {
    const { exists } = await import("@tauri-apps/plugin-fs")
    return exists(path)
  }

  // === Clipboard ===
  // Note: Uses browser Clipboard API as Tauri clipboard plugin is not installed

  async readClipboard(): Promise<string> {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        return await navigator.clipboard.readText()
      } catch {
        return ""
      }
    }
    return ""
  }

  async writeClipboard(text: string): Promise<void> {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    }
  }

  // === Notifications ===

  async showNotification(options: NotificationOptions): Promise<void> {
    const { sendNotification, isPermissionGranted, requestPermission } = await import("@tauri-apps/plugin-notification")

    // Check and request permission if needed
    let permissionGranted = await isPermissionGranted()
    if (!permissionGranted) {
      const permission = await requestPermission()
      permissionGranted = permission === "granted"
    }

    if (permissionGranted) {
      sendNotification({
        title: options.title,
        body: options.body,
        icon: options.icon,
      })
    }
  }

  // === Shell Operations ===

  async openPath(path: string): Promise<void> {
    const { openPath } = await import("@tauri-apps/plugin-opener")
    await openPath(path)
  }

  async openUrl(url: string): Promise<void> {
    const { openUrl } = await import("@tauri-apps/plugin-opener")
    await openUrl(url)
  }

  // === App Info ===

  async getVersion(): Promise<string> {
    const { getVersion } = await import("@tauri-apps/api/app")
    return getVersion()
  }

  // === File Conversion ===

  convertFileSrc(path: string): string {
    // Используем синхронный импорт для convertFileSrc так как это синхронная функция
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { convertFileSrc } = require("@tauri-apps/api/core")
    return convertFileSrc(path)
  }

  // === Path Utilities ===

  async basename(path: string): Promise<string> {
    const { basename } = await import("@tauri-apps/api/path")
    return basename(path)
  }

  async dirname(path: string): Promise<string> {
    const { dirname } = await import("@tauri-apps/api/path")
    return dirname(path)
  }

  async join(...paths: string[]): Promise<string> {
    const { join } = await import("@tauri-apps/api/path")
    return join(...paths)
  }

  // === Extended File System Operations ===

  async getFileStats(path: string): Promise<FileStats | null> {
    try {
      const stats = await invoke<FileStats>("get_file_stats", { path })
      return stats
    } catch {
      return null
    }
  }

  async getPlatform(): Promise<string> {
    try {
      return await invoke<string>("get_platform")
    } catch {
      return "unknown"
    }
  }

  async searchFilesByName(directory: string, filename: string, maxDepth = 3): Promise<string[]> {
    try {
      return await invoke<string[]>("search_files_by_name", {
        directory,
        filename,
        maxDepth,
      })
    } catch {
      return []
    }
  }

  async getAbsolutePath(path: string): Promise<string | null> {
    try {
      return await invoke<string>("get_absolute_path", { path })
    } catch {
      return null
    }
  }
}

/**
 * Node.js Platform Adapter
 *
 * Реализация IPlatformService для Node.js.
 * Использует стандартные Node.js модули: fs, path, child_process.
 */

import { exec } from "node:child_process"
import fsPromises from "node:fs/promises"
import os from "node:os"
import nodePath from "node:path"
import { promisify } from "node:util"

import type {
  FileStats,
  IPlatformService,
  NotificationOptions,
  OpenDialogOptions,
  SaveDialogOptions,
} from "@/core/ports"

const execAsync = promisify(exec)

export interface NodePlatformOptions {
  /** Версия приложения */
  version?: string
  /** Функция для показа диалогов (для CLI можно использовать inquirer) */
  dialogHandler?: {
    showOpen?: (options: OpenDialogOptions) => Promise<string[] | null>
    showSave?: (options: SaveDialogOptions) => Promise<string | null>
  }
  /** Функция для показа нотификаций */
  notificationHandler?: (options: NotificationOptions) => Promise<void>
}

export class NodePlatformService implements IPlatformService {
  private version: string
  private dialogHandler: NodePlatformOptions["dialogHandler"]
  private notificationHandler: NodePlatformOptions["notificationHandler"]

  constructor(options: NodePlatformOptions = {}) {
    this.version = options.version || "1.0.0"
    this.dialogHandler = options.dialogHandler
    this.notificationHandler = options.notificationHandler
  }

  // ============================================================================
  // File Dialogs
  // ============================================================================

  async showOpenDialog(options?: OpenDialogOptions): Promise<string[] | null> {
    if (this.dialogHandler?.showOpen) {
      return this.dialogHandler.showOpen(options || {})
    }
    // В headless режиме возвращаем null
    console.warn("NodePlatformService: showOpenDialog not available in headless mode")
    return null
  }

  async showSaveDialog(options?: SaveDialogOptions): Promise<string | null> {
    if (this.dialogHandler?.showSave) {
      return this.dialogHandler.showSave(options || {})
    }
    // В headless режиме возвращаем null
    console.warn("NodePlatformService: showSaveDialog not available in headless mode")
    return null
  }

  // ============================================================================
  // File System
  // ============================================================================

  async readFile(path: string): Promise<Uint8Array> {
    const buffer = await fsPromises.readFile(path)
    return new Uint8Array(buffer)
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    await fsPromises.writeFile(path, data)
  }

  async readTextFile(path: string): Promise<string> {
    return fsPromises.readFile(path, "utf-8")
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    await fsPromises.writeFile(path, content, "utf-8")
  }

  async exists(path: string): Promise<boolean> {
    try {
      await fsPromises.access(path)
      return true
    } catch {
      return false
    }
  }

  // ============================================================================
  // Clipboard
  // ============================================================================

  async readClipboard(): Promise<string> {
    const platform = os.platform()

    try {
      if (platform === "darwin") {
        const { stdout } = await execAsync("pbpaste")
        return stdout
      }
      if (platform === "linux") {
        const { stdout } = await execAsync("xclip -selection clipboard -o")
        return stdout
      }
      if (platform === "win32") {
        const { stdout } = await execAsync("powershell -command Get-Clipboard")
        return stdout.trim()
      }
    } catch {
      console.warn("NodePlatformService: Failed to read clipboard")
    }

    return ""
  }

  async writeClipboard(text: string): Promise<void> {
    const platform = os.platform()

    try {
      if (platform === "darwin") {
        await execAsync(`echo "${text.replace(/"/g, '\\"')}" | pbcopy`)
      } else if (platform === "linux") {
        await execAsync(`echo "${text.replace(/"/g, '\\"')}" | xclip -selection clipboard`)
      } else if (platform === "win32") {
        await execAsync(`echo ${text} | clip`)
      }
    } catch {
      console.warn("NodePlatformService: Failed to write to clipboard")
    }
  }

  // ============================================================================
  // Notifications
  // ============================================================================

  async showNotification(options: NotificationOptions): Promise<void> {
    if (this.notificationHandler) {
      return this.notificationHandler(options)
    }

    // Fallback: используем системные команды
    const platform = os.platform()

    try {
      if (platform === "darwin") {
        await execAsync(`osascript -e 'display notification "${options.body}" with title "${options.title}"'`)
      } else if (platform === "linux") {
        await execAsync(`notify-send "${options.title}" "${options.body}"`)
      } else if (platform === "win32") {
        // Windows notification через PowerShell
        await execAsync(
          `powershell -command "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null; $template = [Windows.UI.Notifications.ToastTemplateType]::ToastText02; $xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent($template); $xml.GetElementsByTagName('text')[0].AppendChild($xml.CreateTextNode('${options.title}')); $xml.GetElementsByTagName('text')[1].AppendChild($xml.CreateTextNode('${options.body}')); $toast = [Windows.UI.Notifications.ToastNotification]::new($xml); [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Timeline Studio').Show($toast)"`,
        )
      }
    } catch {
      // Fallback: просто выводим в консоль
      console.log(`[Notification] ${options.title}: ${options.body}`)
    }
  }

  // ============================================================================
  // Shell Operations
  // ============================================================================

  async openPath(path: string): Promise<void> {
    const platform = os.platform()

    if (platform === "darwin") {
      await execAsync(`open "${path}"`)
    } else if (platform === "linux") {
      await execAsync(`xdg-open "${path}"`)
    } else if (platform === "win32") {
      await execAsync(`start "" "${path}"`)
    }
  }

  async openUrl(url: string): Promise<void> {
    const platform = os.platform()

    if (platform === "darwin") {
      await execAsync(`open "${url}"`)
    } else if (platform === "linux") {
      await execAsync(`xdg-open "${url}"`)
    } else if (platform === "win32") {
      await execAsync(`start "" "${url}"`)
    }
  }

  // ============================================================================
  // App Info
  // ============================================================================

  async getVersion(): Promise<string> {
    return this.version
  }

  // ============================================================================
  // File Path Utilities
  // ============================================================================

  convertFileSrc(path: string): string {
    // В Node.js/browser окружении для медиа элементов (<img>, <video>, <audio>)
    // нужен file:// протокол для локальных файлов

    // Если путь уже является URL, возвращаем как есть
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("file://") ||
      path.startsWith("blob:")
    ) {
      return path
    }

    // Для локальных путей добавляем file:// протокол
    return `file://${path}`
  }

  async basename(path: string): Promise<string> {
    return nodePath.basename(path)
  }

  async dirname(path: string): Promise<string> {
    return nodePath.dirname(path)
  }

  async join(...paths: string[]): Promise<string> {
    return nodePath.join(...paths)
  }

  // ============================================================================
  // Extended File System
  // ============================================================================

  async getFileStats(path: string): Promise<FileStats | null> {
    try {
      const stats = await fsPromises.stat(path)
      return {
        size: stats.size,
        lastModified: stats.mtimeMs,
      }
    } catch {
      return null
    }
  }

  async getPlatform(): Promise<string> {
    return os.platform()
  }

  async searchFilesByName(directory: string, filename: string, maxDepth = 5): Promise<string[]> {
    const results: string[] = []
    const searchLower = filename.toLowerCase()

    async function walk(dir: string, depth: number): Promise<void> {
      if (depth > maxDepth) return

      try {
        const entries = await fsPromises.readdir(dir, { withFileTypes: true })

        for (const entry of entries) {
          const fullPath = nodePath.join(dir, entry.name)

          if (entry.isDirectory()) {
            await walk(fullPath, depth + 1)
          } else if (entry.name.toLowerCase().includes(searchLower)) {
            results.push(fullPath)
          }
        }
      } catch {
        // Игнорируем недоступные директории
      }
    }

    await walk(directory, 0)
    return results
  }

  async getAbsolutePath(path: string): Promise<string | null> {
    try {
      return nodePath.resolve(path)
    } catch {
      return null
    }
  }
}

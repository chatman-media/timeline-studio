/**
 * Mock Platform Adapter
 *
 * Реализация IPlatformService для тестов и разработки в браузере.
 * Использует browser APIs или in-memory заглушки.
 */

import type {
  FileStats,
  IPlatformService,
  NotificationOptions,
  OpenDialogOptions,
  SaveDialogOptions,
} from "@/core/ports"

export class MockPlatformService implements IPlatformService {
  // Mock storage for file system simulation
  private _files = new Map<string, Uint8Array>()
  private _clipboard = ""
  private _notifications: NotificationOptions[] = []

  // Configurable responses for dialogs
  private _openDialogResponse: string[] | null = null
  private _saveDialogResponse: string | null = null

  // === File Dialogs ===

  async showOpenDialog(_options?: OpenDialogOptions): Promise<string[] | null> {
    return this._openDialogResponse
  }

  async showSaveDialog(_options?: SaveDialogOptions): Promise<string | null> {
    return this._saveDialogResponse
  }

  // === File System ===

  async readFile(path: string): Promise<Uint8Array> {
    const data = this._files.get(path)
    if (!data) {
      throw new Error(`File not found: ${path}`)
    }
    return data
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    this._files.set(path, data)
  }

  async readTextFile(path: string): Promise<string> {
    const data = await this.readFile(path)
    return new TextDecoder().decode(data)
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    const data = new TextEncoder().encode(content)
    await this.writeFile(path, data)
  }

  async exists(path: string): Promise<boolean> {
    return this._files.has(path)
  }

  // === Clipboard ===

  async readClipboard(): Promise<string> {
    return this._clipboard
  }

  async writeClipboard(text: string): Promise<void> {
    this._clipboard = text
  }

  // === Notifications ===

  async showNotification(options: NotificationOptions): Promise<void> {
    this._notifications.push(options)
    // In browser, could use Notification API if available
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        new Notification(options.title, { body: options.body, icon: options.icon })
      } catch {
        // Ignore notification errors in mock
      }
    }
  }

  // === Shell Operations ===

  async openPath(path: string): Promise<void> {
    // In browser, just log
    console.log(`[MockPlatform] openPath: ${path}`)
  }

  async openUrl(url: string): Promise<void> {
    // In browser, open in new tab
    if (typeof window !== "undefined") {
      window.open(url, "_blank")
    }
  }

  // === App Info ===

  async getVersion(): Promise<string> {
    return "1.0.0-mock"
  }

  // === File Conversion ===

  convertFileSrc(path: string): string {
    // In mock/browser environment, return as is or use file:// protocol
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:")) {
      return path
    }
    // For mock file paths, create a blob URL would be more realistic
    // but for simplicity we just prefix with file://
    return `file://${path}`
  }

  // === Path Utilities ===

  async basename(path: string): Promise<string> {
    // Handle both Unix and Windows paths
    const parts = path.split(/[/\\]/)
    return parts[parts.length - 1] || ""
  }

  async dirname(path: string): Promise<string> {
    // Handle both Unix and Windows paths
    const parts = path.split(/[/\\]/)
    parts.pop()
    if (parts.length === 0) return "."
    // Preserve leading slash for Unix absolute paths
    if (parts.length === 1 && parts[0] === "") return "/"
    return parts.join("/")
  }

  async join(...paths: string[]): Promise<string> {
    // Simple path join - normalize slashes
    return paths.filter(Boolean).join("/").replace(/\/+/g, "/")
  }

  // === Extended File System Operations ===

  async getFileStats(path: string): Promise<FileStats | null> {
    const data = this._files.get(path)
    if (!data) return null
    return {
      size: data.length,
      lastModified: Date.now(),
    }
  }

  async getPlatform(): Promise<string> {
    // Detect platform from browser userAgent
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent.toLowerCase()
      if (ua.includes("mac")) return "macos"
      if (ua.includes("win")) return "windows"
      if (ua.includes("linux")) return "linux"
    }
    return "unknown"
  }

  async searchFilesByName(directory: string, filename: string, _maxDepth?: number): Promise<string[]> {
    // Search in mock files
    const results: string[] = []
    for (const path of this._files.keys()) {
      if (path.startsWith(directory) && path.includes(filename)) {
        results.push(path)
      }
    }
    return results
  }

  async getAbsolutePath(path: string): Promise<string | null> {
    // In mock, just return the path as is
    if (path.startsWith("/") || path.match(/^[A-Za-z]:/)) {
      return path
    }
    return `/mock/${path}`
  }

  // === Test Helpers ===

  /**
   * Set the open dialog response (for testing)
   */
  setOpenDialogResponse(paths: string[] | null): void {
    this._openDialogResponse = paths
  }

  /**
   * Set the save dialog response (for testing)
   */
  setSaveDialogResponse(path: string | null): void {
    this._saveDialogResponse = path
  }

  /**
   * Get all notifications (for testing)
   */
  getNotifications(): NotificationOptions[] {
    return [...this._notifications]
  }

  /**
   * Get clipboard content (for testing)
   */
  getClipboard(): string {
    return this._clipboard
  }

  /**
   * Set a file in the mock file system (for testing)
   */
  setFile(path: string, content: string | Uint8Array): void {
    const data = typeof content === "string" ? new TextEncoder().encode(content) : content
    this._files.set(path, data)
  }

  /**
   * Get all files (for testing)
   */
  getFiles(): Map<string, Uint8Array> {
    return new Map(this._files)
  }

  /**
   * Reset all state (for testing)
   */
  reset(): void {
    this._files.clear()
    this._clipboard = ""
    this._notifications = []
    this._openDialogResponse = null
    this._saveDialogResponse = null
  }
}

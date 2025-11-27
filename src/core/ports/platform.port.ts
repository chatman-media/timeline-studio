/**
 * Platform Port Interface
 *
 * Определяет контракт для платформо-зависимых операций.
 * Реализации: TauriPlatform, BrowserPlatform, MockPlatform
 */

export interface OpenDialogOptions {
  title?: string
  defaultPath?: string
  filters?: Array<{
    name: string
    extensions: string[]
  }>
  multiple?: boolean
  directory?: boolean
}

export interface SaveDialogOptions {
  title?: string
  defaultPath?: string
  filters?: Array<{
    name: string
    extensions: string[]
  }>
}

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
}

export interface IPlatformService {
  /**
   * File Dialogs
   */
  showOpenDialog(options?: OpenDialogOptions): Promise<string[] | null>
  showSaveDialog(options?: SaveDialogOptions): Promise<string | null>

  /**
   * File System (минимальный набор для работы с медиа)
   */
  readFile(path: string): Promise<Uint8Array>
  writeFile(path: string, data: Uint8Array): Promise<void>
  readTextFile(path: string): Promise<string>
  writeTextFile(path: string, content: string): Promise<void>
  exists(path: string): Promise<boolean>

  /**
   * Clipboard
   */
  readClipboard(): Promise<string>
  writeClipboard(text: string): Promise<void>

  /**
   * Notifications
   */
  showNotification(options: NotificationOptions): Promise<void>

  /**
   * Shell operations
   */
  openPath(path: string): Promise<void>
  openUrl(url: string): Promise<void>
}

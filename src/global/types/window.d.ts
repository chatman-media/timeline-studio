// Global Window and Environment type declarations

declare global {
  /**
   * App Environment variables
   * Загружаются из .env.local при сборке
   */
  const APP_ENV: {
    openaiApiKey?: string
    ffmpegPath?: string
    onnxPath?: string
  }

  interface Window {
    /**
     * Tauri v2 internal API
     * Доступен только в desktop версии приложения
     */
    __TAURI_INTERNALS__?: any

    /**
     * Legacy Tauri v1 API (deprecated, use @tauri-apps/api instead)
     * @deprecated
     */
    __TAURI__?: {
      core: {
        invoke: (cmd: string, args?: any) => Promise<any>
        convertFileSrc: (src: string) => string
      }
      event: {
        listen: (event: string, handler: (event: any) => void) => Promise<() => void>
        once: (event: string, handler: (event: any) => void) => Promise<() => void>
        emit: (event: string, payload?: any) => Promise<void>
      }
      dialog: {
        open: (options?: any) => Promise<string | string[] | null>
        save: (options?: any) => Promise<string | null>
        message: (message: string, options?: any) => Promise<void>
        ask: (message: string, options?: any) => Promise<boolean>
        confirm: (message: string, options?: any) => Promise<boolean>
      }
      fs: {
        readTextFile: (path: string) => Promise<string>
        writeTextFile: (path: string, content: string) => Promise<void>
        exists: (path: string) => Promise<boolean>
        readDir: (path: string) => Promise<any[]>
        createDir: (path: string, options?: { recursive?: boolean }) => Promise<void>
        removeFile: (path: string) => Promise<void>
        removeDir: (path: string, options?: { recursive?: boolean }) => Promise<void>
      }
      path: {
        homeDir: () => Promise<string>
        appDataDir: () => Promise<string>
        appConfigDir: () => Promise<string>
        appLocalDataDir: () => Promise<string>
        join: (...paths: string[]) => Promise<string>
        dirname: (path: string) => Promise<string>
        basename: (path: string) => Promise<string>
        extname: (path: string) => Promise<string>
      }
      notification: {
        sendNotification: (options: string | { title: string; body?: string }) => Promise<void>
      }
      tauri: any
    }
  }
}

export {}

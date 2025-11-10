import type { InvokeArgs } from "@tauri-apps/api/core"
import { vi } from "vitest"

export const mockInvoke = vi.fn()
export const mockConvertFileSrc = vi.fn((src: string) => src)

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
  convertFileSrc: mockConvertFileSrc,
  mockInvoke, // Экспортируем мок для тестов
}))

// Mock Tauri OS plugin
vi.mock("@tauri-apps/plugin-os", () => ({
  platform: vi.fn().mockResolvedValue("darwin"),
  version: vi.fn().mockResolvedValue("14.0.0"),
  family: vi.fn().mockResolvedValue("unix"),
  type: vi.fn().mockResolvedValue("macos"),
  arch: vi.fn().mockResolvedValue("x86_64"),
  locale: vi.fn().mockResolvedValue("en-US"),
}))

// Mock Tauri app API
vi.mock("@tauri-apps/api/app", () => ({
  getName: vi.fn().mockResolvedValue("Timeline Studio"),
  getVersion: vi.fn().mockResolvedValue("0.49.0"),
  getTauriVersion: vi.fn().mockResolvedValue("2.0.0"),
}))

// Mock generated Tauri bindings
vi.mock("@/types/generated/tauri-bindings", () => ({
  commands: {
    greet: vi.fn().mockResolvedValue("Hello from Tauri!"),
    getActiveJobs: vi.fn().mockResolvedValue([]),
    compileVideo: vi.fn().mockResolvedValue(null),
    cancelRender: vi.fn().mockResolvedValue(true),
    // Browser commands
    browserSwitchTab: vi.fn().mockResolvedValue({ status: "ok", data: { success: true } }),
    // Add other commands as needed
  },
  events: {
    onProgressUpdate: vi.fn(),
    onJobComplete: vi.fn(),
    // Add other events as needed
  },
}))

// Helper for setting up command responses
export function setupTauriCommand(command: string, response: unknown) {
  mockInvoke.mockImplementation((cmd: string, _args?: InvokeArgs) => {
    if (cmd === command) {
      return response instanceof Error ? Promise.reject(response) : Promise.resolve(response)
    }
    return Promise.reject(new Error(`Unknown command: ${cmd}`))
  })
}

// Type-safe command handlers
export interface TauriCommands {
  // Language commands (Tauri v2 proper state management)
  get_app_language_tauri: () => Promise<{ language: string; system_language: string }>
  set_app_language_tauri: (args: { lang: string }) => Promise<{ language: string; system_language: string }>

  // File system commands
  file_exists: (args: { path: string }) => Promise<boolean>
  get_file_stats: (args: { path: string }) => Promise<{ size: number; lastModified: number }>
  read_text_file: (args: { path: string }) => Promise<string>
  write_text_file: (args: { path: string; content: string }) => Promise<void>
  search_files_by_name: (args: { query: string; directory?: string }) => Promise<string[]>
  get_absolute_path: (args: { path: string }) => Promise<string>

  // Media commands
  get_media_files: (args: { path: string }) => Promise<any[]>
  get_media_metadata: (args: { path: string }) => Promise<any>

  // Project commands
  save_project: (args: { project: any; path: string }) => Promise<void>
  load_project: (args: { path: string }) => Promise<any>

  // Export commands
  export_video: (args: {
    projectId: string
    outputPath: string
    format: string
  }) => Promise<{ success: boolean; path?: string; error?: string }>

  // API Keys commands
  save_simple_api_key: (args: {
    params: { key_type: string; value: string }
  }) => Promise<{ success: boolean; message: string }>
  save_oauth_credentials: (args: {
    params: {
      key_type: string
      client_id: string
      client_secret: string
      access_token?: string
      refresh_token?: string
    }
  }) => Promise<{ success: boolean; message: string }>
  get_api_key_info: (args: { keyType: string }) => Promise<{
    key_type: string
    has_value: boolean
    is_oauth: boolean
    has_access_token: boolean
    is_valid?: boolean
  } | null>
  list_api_keys: () => Promise<
    Array<{
      key_type: string
      has_value: boolean
      is_oauth: boolean
      has_access_token: boolean
      is_valid?: boolean
    }>
  >
  delete_api_key: (args: { keyType: string }) => Promise<{ success: boolean; message: string }>
  validate_api_key: (args: { keyType: string }) => Promise<{
    is_valid: boolean
    error_message?: string
    service_info?: string
  }>
  generate_oauth_url: (args: { keyType: string; clientId: string; state?: string }) => Promise<string>
  exchange_oauth_code: (args: {
    keyType: string
    clientId: string
    clientSecret: string
    code: string
  }) => Promise<{ success: boolean; message: string }>
  refresh_oauth_token: (args: { keyType: string }) => Promise<{ success: boolean; message: string }>
  get_oauth_user_info: (args: { keyType: string }) => Promise<Record<string, unknown>>
  parse_oauth_callback_url: (args: { url: string }) => Promise<{
    code?: string
    state?: string
    error?: string
    all_params: Record<string, string>
  }>
  import_from_env: (args: { envFilePath?: string }) => Promise<{ success: boolean; message: string }>
  export_to_env_format: () => Promise<string>
}

// Type-safe mock factory
export function createTauriMock() {
  const handlers = new Map<keyof TauriCommands, (...args: any[]) => any>()

  const mock = {
    invoke: vi.fn(async (cmd: keyof TauriCommands, args?: InvokeArgs) => {
      const handler = handlers.get(cmd)
      if (handler) {
        return handler(args)
      }
      throw new Error(`No mock handler for command: ${cmd}`)
    }),

    // Helper to register command handlers
    on<K extends keyof TauriCommands>(command: K, handler: TauriCommands[K]) {
      handlers.set(command, handler)
      return this
    },

    // Preset handlers for common scenarios
    usePreset(preset: "default" | "empty" | "with-media" | "with-project") {
      switch (preset) {
        case "default":
          // Команды языка Tauri v2
          this.on("get_app_language_tauri", async () => ({
            language: "ru",
            system_language: "ru",
          }))
          this.on("set_app_language_tauri", async (args) => ({
            language: args?.lang || "ru",
            system_language: "ru",
          }))
          this.on("file_exists", async () => true)
          this.on("get_file_stats", async () => ({
            size: 1024,
            lastModified: Date.now(),
          }))
          this.on("read_text_file", async () => '{"test": "data"}')
          this.on("write_text_file", async () => undefined)
          this.on("search_files_by_name", async () => [])
          this.on("get_absolute_path", async (args) => `/absolute${args?.path || ""}`)

          // API Keys mock handlers
          this.on("save_simple_api_key", async () => ({ success: true, message: "API key saved" }))
          this.on("save_oauth_credentials", async () => ({ success: true, message: "OAuth credentials saved" }))
          this.on("get_api_key_info", async () => null)
          this.on("list_api_keys", async () => [])
          this.on("delete_api_key", async () => ({ success: true, message: "API key deleted" }))
          this.on("validate_api_key", async () => ({ is_valid: true, service_info: "Mock validation" }))
          this.on("generate_oauth_url", async () => "https://example.com/oauth")
          this.on("exchange_oauth_code", async () => ({ success: true, message: "Token exchanged" }))
          this.on("refresh_oauth_token", async () => ({ success: true, message: "Token refreshed" }))
          this.on("get_oauth_user_info", async () => ({
            id: "123",
            name: "Mock User",
            email: "mock@example.com",
          }))
          this.on("parse_oauth_callback_url", async (_args) => ({
            code: "mock_auth_code",
            state: "mock_state",
            all_params: { code: "mock_auth_code", state: "mock_state" },
          }))
          this.on("import_from_env", async () => ({ success: true, message: "Imported from .env" }))
          this.on("export_to_env_format", async () => "# Mock .env content")
          break

        case "empty":
          this.on("get_media_files", async () => [])
          this.on("load_project", async () => {
            throw new Error("No project")
          })
          break

        case "with-media":
          this.on("get_media_files", async () => [
            { id: "1", path: "/video1.mp4", type: "video", duration: 10 },
            { id: "2", path: "/video2.mp4", type: "video", duration: 20 },
          ])
          break

        case "with-project":
          this.on("load_project", async () => ({
            id: "test-project",
            name: "Test Project",
            tracks: [],
            settings: {},
          }))
          break
        default:
          // Неизвестная предустановка, не делаем ничего
          break
      }
      return this
    },

    // Reset all handlers
    reset() {
      handlers.clear()
      mockInvoke.mockReset()
    },
  }

  // Replace the global mock
  mockInvoke.mockImplementation(mock.invoke)

  return mock
}

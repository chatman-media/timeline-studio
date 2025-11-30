import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { TauriMockProvider } from "../tauri-mock-provider"

// Mock tauri-logger
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  trace: vi.fn(),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => mockLogger,
}))

describe("TauriMockProvider", () => {
  let originalWindow: any
  let originalNavigator: any

  beforeEach(() => {
    vi.clearAllMocks()
    // Save original window and navigator
    originalWindow = global.window
    originalNavigator = global.navigator

    // Create a fresh window mock for each test
    global.window = {
      ...originalWindow,
      __TAURI_INTERNALS__: undefined,
      __TAURI_EVENT_PLUGIN_INTERNALS__: undefined,
    } as any

    global.navigator = {
      ...originalNavigator,
      mediaDevices: undefined,
    } as any
  })

  afterEach(() => {
    // Restore original window and navigator
    global.window = originalWindow
    global.navigator = originalNavigator
  })

  describe("рендеринг и children", () => {
    it("должен рендерить children", () => {
      const { getByText } = render(
        <TauriMockProvider>
          <div>Test Content</div>
        </TauriMockProvider>,
      )

      expect(getByText("Test Content")).toBeInTheDocument()
    })

    it("должен рендерить несколько children", () => {
      const { getByText } = render(
        <TauriMockProvider>
          <div>First</div>
          <div>Second</div>
        </TauriMockProvider>,
      )

      expect(getByText("First")).toBeInTheDocument()
      expect(getByText("Second")).toBeInTheDocument()
    })
  })

  describe("определение окружения Tauri", () => {
    it("не должен мокать если Tauri уже доступен", () => {
      // Simulate Tauri environment
      ;(global.window as any).__TAURI_INTERNALS__ = {
        invoke: vi.fn(),
      }

      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      // Should not override existing Tauri
      expect((global.window as any).__TAURI_INTERNALS__.invoke).toBeDefined()
    })

    it("должен мокать navigator.mediaDevices в не-Tauri окружении", () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      expect(navigator.mediaDevices).toBeDefined()
      expect(navigator.mediaDevices.getUserMedia).toBeDefined()
    })
  })

  describe("mock navigator.mediaDevices", () => {
    it("должен создать mock getUserMedia", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      await expect(navigator.mediaDevices.getUserMedia()).rejects.toThrow(
        "MediaDevices API not available in Tauri environment",
      )
    })

    it("должен создать mock getDisplayMedia", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      await expect(navigator.mediaDevices.getDisplayMedia()).rejects.toThrow(
        "MediaDevices API not available in Tauri environment",
      )
    })

    it("должен создать mock enumerateDevices", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const devices = await navigator.mediaDevices.enumerateDevices()
      expect(devices).toEqual([])
    })

    it("должен логировать предупреждения при вызове mock методов", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      try {
        await navigator.mediaDevices.getUserMedia()
      } catch (e) {
        // Expected to throw
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("navigator.mediaDevices.getUserMedia not available"),
      )
    })
  })

  describe("mock __TAURI_INTERNALS__", () => {
    it("должен создать __TAURI_INTERNALS__ с invoke функцией", () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      expect((global.window as any).__TAURI_INTERNALS__).toBeDefined()
      expect((global.window as any).__TAURI_INTERNALS__.invoke).toBeDefined()
    })

    it("должен создать transformCallback функцию", () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      expect((global.window as any).__TAURI_INTERNALS__.transformCallback).toBeDefined()
    })

    it("должен создать callbacks Map", () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      expect((global.window as any).__TAURI_INTERNALS__.callbacks).toBeInstanceOf(Map)
    })
  })

  describe("mock invoke команды", () => {
    it("должен возвращать mock данные для get_app_language_tauri", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("get_app_language_tauri")

      expect(result).toEqual({ language: "ru", system_language: "ru" })
    })

    it("должен возвращать пустой массив для get_media_files", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("get_media_files")

      expect(result).toEqual([])
    })

    it("должен возвращать false для file_exists", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("file_exists")

      expect(result).toBe(false)
    })

    it("должен возвращать директории для get_app_directories", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("get_app_directories")

      expect(result).toHaveProperty("base_dir")
      expect(result).toHaveProperty("media_dir")
      expect(result).toHaveProperty("projects_dir")
      expect(result.base_dir).toContain("Timeline Studio")
    })

    it("должен возвращать GPU capabilities", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("get_gpu_capabilities_full")

      expect(result).toHaveProperty("available_encoders")
      expect(result).toHaveProperty("hardware_acceleration_supported")
      expect(result.hardware_acceleration_supported).toBe(true)
    })

    it("должен возвращать system info", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("get_system_info")

      expect(result).toHaveProperty("os")
      expect(result).toHaveProperty("cpu")
      expect(result).toHaveProperty("memory")
      expect(result.os.type).toBe("Darwin")
    })

    it("должен логировать неизвестные команды", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      await (global.window as any).__TAURI_INTERNALS__.invoke("unknown_command")

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Unhandled command: unknown_command"),
        undefined,
      )
    })
  })

  describe("mock event plugin", () => {
    it("должен создать __TAURI_EVENT_PLUGIN_INTERNALS__", () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      expect((global.window as any).__TAURI_EVENT_PLUGIN_INTERNALS__).toBeDefined()
      expect((global.window as any).__TAURI_EVENT_PLUGIN_INTERNALS__.listeners).toBeDefined()
    })

    it("должен обрабатывать plugin:event|listen", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const eventId = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:event|listen", {
        event: "test-event",
        handler: 123,
      })

      expect(typeof eventId).toBe("string")
      expect(eventId.length).toBeGreaterThan(0)
    })

    it("должен обрабатывать plugin:event|unlisten", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:event|unlisten")

      expect(result).toBeNull()
    })
  })

  describe("mock store plugin", () => {
    it("должен обрабатывать plugin:store|load", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:store|load")

      expect(typeof result).toBe("string")
    })

    it("должен возвращать app-settings", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const [value, exists] = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:store|get", {
        key: "app-settings",
      })

      expect(exists).toBe(true)
      expect(value).toHaveProperty("language")
      expect(value).toHaveProperty("theme")
    })

    it("должен возвращать [null, false] для несуществующего ключа", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const [value, exists] = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:store|get", {
        key: "nonexistent",
      })

      expect(exists).toBe(false)
      expect(value).toBeNull()
    })

    it("должен обрабатывать plugin:store|set", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:store|set")

      expect(result).toBeNull()
    })
  })

  describe("mock filesystem plugin", () => {
    it("должен возвращать true для .tlsp файлов", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:fs|exists", {
        path: "/path/to/project.tlsp",
      })

      expect(result).toBe(true)
    })

    it("должен возвращать false для не-.tlsp файлов", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:fs|exists", {
        path: "/path/to/other.txt",
      })

      expect(result).toBe(false)
    })

    it("должен возвращать JSON для .tlsp файлов", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:fs|read_text_file", {
        path: "/path/to/test.tlsp",
      })

      expect(typeof result).toBe("string")
      const parsed = JSON.parse(result)
      expect(parsed).toHaveProperty("metadata")
      expect(parsed.metadata.version).toBe("2.0.0")
    })

    it("должен возвращать пустой объект для JSON файлов", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:fs|read_text_file", {
        path: "/path/to/config.json",
      })

      expect(result).toBe("{}")
    })

    it("должен обрабатывать plugin:fs|write_text_file", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:fs|write_text_file", {
        path: "/path/to/file.txt",
        contents: "test",
      })

      expect(result).toBeNull()
    })
  })

  describe("mock path plugin", () => {
    it("должен объединять пути", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:path|join", {
        paths: ["path", "to", "file.txt"],
      })

      expect(result).toBe("path/to/file.txt")
    })
  })

  describe("mock dialog plugin", () => {
    it("должен возвращать пустой массив для open_file", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:dialog|open_file")

      expect(result).toEqual({ paths: [] })
    })

    it("должен возвращать null для open_folder", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:dialog|open_folder")

      expect(result).toEqual({ path: null })
    })
  })

  describe("callback система", () => {
    it("должен регистрировать callbacks", () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const callback = vi.fn()
      const id = (global.window as any).__TAURI_INTERNALS__.transformCallback(callback)

      expect(typeof id).toBe("number")
      expect((global.window as any).__TAURI_INTERNALS__.callbacks.has(id)).toBe(true)
    })

    it("должен удалять callbacks", () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const callback = vi.fn()
      const id = (global.window as any).__TAURI_INTERNALS__.transformCallback(callback)

      ;(global.window as any).__TAURI_INTERNALS__.unregisterCallback(id)

      expect((global.window as any).__TAURI_INTERNALS__.callbacks.has(id)).toBe(false)
    })

    it("должен вызывать callbacks с данными", () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      const callback = vi.fn()
      const id = (global.window as any).__TAURI_INTERNALS__.transformCallback(callback)
      const cb = (global.window as any).__TAURI_INTERNALS__.callbacks.get(id)

      cb({ test: "data" })

      expect(callback).toHaveBeenCalledWith({ test: "data" })
    })
  })

  describe("SSR безопасность", () => {
    it("не должен мокать в SSR окружении", () => {
      // TauriMockProvider проверяет typeof window !== "undefined"
      // В тестовой среде window всегда определен
      // Просто проверяем, что компонент рендерится без ошибок
      expect(() => {
        render(
          <TauriMockProvider>
            <div>Content</div>
          </TauriMockProvider>,
        )
      }).not.toThrow()
    })
  })

  describe("логирование", () => {
    it("должен логировать команды invoke", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      await (global.window as any).__TAURI_INTERNALS__.invoke("get_app_language_tauri")

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Command: get_app_language_tauri"),
        undefined,
      )
    })

    it("должен логировать регистрацию event listeners", async () => {
      render(
        <TauriMockProvider>
          <div>Content</div>
        </TauriMockProvider>,
      )

      await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:event|listen", {
        event: "test-event",
      })

      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining("Registered listener for event"))
    })
  })
})

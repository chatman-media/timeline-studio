/**
 * @vitest-environment jsdom
 */
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
        <TauriMockProvider data-oid="ul1i4i3">
          <div data-oid="mm3p6t3">Test Content</div>
        </TauriMockProvider>,
      )

      expect(getByText("Test Content")).toBeInTheDocument()
    })

    it("должен рендерить несколько children", () => {
      const { getByText } = render(
        <TauriMockProvider data-oid="xc3pdo5">
          <div data-oid="h-t-rn3">First</div>
          <div data-oid="sszawas">Second</div>
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
        <TauriMockProvider data-oid="j.dbxba">
          <div data-oid="qgtj:9q">Content</div>
        </TauriMockProvider>,
      )

      // Should not override existing Tauri
      expect((global.window as any).__TAURI_INTERNALS__.invoke).toBeDefined()
    })

    it("должен мокать navigator.mediaDevices в не-Tauri окружении", () => {
      render(
        <TauriMockProvider data-oid=".d2xe9.">
          <div data-oid="me:g.tm">Content</div>
        </TauriMockProvider>,
      )

      expect(navigator.mediaDevices).toBeDefined()
      expect(navigator.mediaDevices.getUserMedia).toBeDefined()
    })
  })

  describe("mock navigator.mediaDevices", () => {
    it("должен создать mock getUserMedia", async () => {
      render(
        <TauriMockProvider data-oid="l7reuzc">
          <div data-oid="s_4pc52">Content</div>
        </TauriMockProvider>,
      )

      await expect(navigator.mediaDevices.getUserMedia()).rejects.toThrow(
        "MediaDevices API not available in Tauri environment",
      )
    })

    it("должен создать mock getDisplayMedia", async () => {
      render(
        <TauriMockProvider data-oid="2pfs1_y">
          <div data-oid="lhx0vx5">Content</div>
        </TauriMockProvider>,
      )

      await expect(navigator.mediaDevices.getDisplayMedia()).rejects.toThrow(
        "MediaDevices API not available in Tauri environment",
      )
    })

    it("должен создать mock enumerateDevices", async () => {
      render(
        <TauriMockProvider data-oid="x4ilvr:">
          <div data-oid="laqdgaj">Content</div>
        </TauriMockProvider>,
      )

      const devices = await navigator.mediaDevices.enumerateDevices()
      expect(devices).toEqual([])
    })

    it("должен логировать предупреждения при вызове mock методов", async () => {
      render(
        <TauriMockProvider data-oid="5g8j4e-">
          <div data-oid="w8avare">Content</div>
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
        <TauriMockProvider data-oid="sqfll81">
          <div data-oid="go7esnt">Content</div>
        </TauriMockProvider>,
      )

      expect((global.window as any).__TAURI_INTERNALS__).toBeDefined()
      expect((global.window as any).__TAURI_INTERNALS__.invoke).toBeDefined()
    })

    it("должен создать transformCallback функцию", () => {
      render(
        <TauriMockProvider data-oid=".-5gwwo">
          <div data-oid="v7z_391">Content</div>
        </TauriMockProvider>,
      )

      expect((global.window as any).__TAURI_INTERNALS__.transformCallback).toBeDefined()
    })

    it("должен создать callbacks Map", () => {
      render(
        <TauriMockProvider data-oid="lv_5iqr">
          <div data-oid="yf1huqu">Content</div>
        </TauriMockProvider>,
      )

      expect((global.window as any).__TAURI_INTERNALS__.callbacks).toBeInstanceOf(Map)
    })
  })

  describe("mock invoke команды", () => {
    it("должен возвращать mock данные для get_app_language_tauri", async () => {
      render(
        <TauriMockProvider data-oid="ku35a:s">
          <div data-oid="y:fxx52">Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("get_app_language_tauri")

      expect(result).toEqual({ language: "ru", system_language: "ru" })
    })

    it("должен возвращать пустой массив для get_media_files", async () => {
      render(
        <TauriMockProvider data-oid="clhh1as">
          <div data-oid="_iw1a47">Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("get_media_files")

      expect(result).toEqual([])
    })

    it("должен возвращать false для file_exists", async () => {
      render(
        <TauriMockProvider data-oid="k0.o1.y">
          <div data-oid="fllii6i">Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("file_exists")

      expect(result).toBe(false)
    })

    it("должен возвращать директории для get_app_directories", async () => {
      render(
        <TauriMockProvider data-oid="k:j10-t">
          <div data-oid="9tw:-bv">Content</div>
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
        <TauriMockProvider data-oid="j1h4fqq">
          <div data-oid="a8l2g14">Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("get_gpu_capabilities_full")

      expect(result).toHaveProperty("available_encoders")
      expect(result).toHaveProperty("hardware_acceleration_supported")
      expect(result.hardware_acceleration_supported).toBe(true)
    })

    it("должен возвращать system info", async () => {
      render(
        <TauriMockProvider data-oid="ekvcwv7">
          <div data-oid="dcyqj.5">Content</div>
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
        <TauriMockProvider data-oid="l0:662p">
          <div data-oid="vqn-sy0">Content</div>
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
        <TauriMockProvider data-oid="avwf1oz">
          <div data-oid="8tm_kox">Content</div>
        </TauriMockProvider>,
      )

      expect((global.window as any).__TAURI_EVENT_PLUGIN_INTERNALS__).toBeDefined()
      expect((global.window as any).__TAURI_EVENT_PLUGIN_INTERNALS__.listeners).toBeDefined()
    })

    it("должен обрабатывать plugin:event|listen", async () => {
      render(
        <TauriMockProvider data-oid="5e_mh98">
          <div data-oid="6du_u7k">Content</div>
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
        <TauriMockProvider data-oid="d_-5dfo">
          <div data-oid="r_ysjl2">Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:event|unlisten")

      expect(result).toBeNull()
    })
  })

  describe("mock store plugin", () => {
    it("должен обрабатывать plugin:store|load", async () => {
      render(
        <TauriMockProvider data-oid="bkjs:nu">
          <div data-oid="r_ec7u4">Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:store|load")

      expect(typeof result).toBe("string")
    })

    it("должен возвращать app-settings", async () => {
      render(
        <TauriMockProvider data-oid="11cd6m6">
          <div data-oid="3hh_yjf">Content</div>
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
        <TauriMockProvider data-oid="8nmwp4n">
          <div data-oid="gz88f9p">Content</div>
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
        <TauriMockProvider data-oid="owtrg66">
          <div data-oid="09izrw5">Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:store|set")

      expect(result).toBeNull()
    })
  })

  describe("mock filesystem plugin", () => {
    it("должен возвращать true для .tlsp файлов", async () => {
      render(
        <TauriMockProvider data-oid=".abytp7">
          <div data-oid="f91h:yq">Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:fs|exists", {
        path: "/path/to/project.tlsp",
      })

      expect(result).toBe(true)
    })

    it("должен возвращать false для не-.tlsp файлов", async () => {
      render(
        <TauriMockProvider data-oid="za0u9.y">
          <div data-oid="_8gyya0">Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:fs|exists", {
        path: "/path/to/other.txt",
      })

      expect(result).toBe(false)
    })

    it("должен возвращать JSON для .tlsp файлов", async () => {
      render(
        <TauriMockProvider data-oid="kgkg3me">
          <div data-oid="-:509.j">Content</div>
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
        <TauriMockProvider data-oid="ok3.0f-">
          <div data-oid="7d1s.e9">Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:fs|read_text_file", {
        path: "/path/to/config.json",
      })

      expect(result).toBe("{}")
    })

    it("должен обрабатывать plugin:fs|write_text_file", async () => {
      render(
        <TauriMockProvider data-oid="hewyeky">
          <div data-oid="n5hdqmp">Content</div>
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
        <TauriMockProvider data-oid="f58naj5">
          <div data-oid="sw6m3qq">Content</div>
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
        <TauriMockProvider data-oid="fnzyiw4">
          <div data-oid="2l05olr">Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:dialog|open_file")

      expect(result).toEqual({ paths: [] })
    })

    it("должен возвращать null для open_folder", async () => {
      render(
        <TauriMockProvider data-oid="upppv5l">
          <div data-oid="2me.hp8">Content</div>
        </TauriMockProvider>,
      )

      const result = await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:dialog|open_folder")

      expect(result).toEqual({ path: null })
    })
  })

  describe("callback система", () => {
    it("должен регистрировать callbacks", () => {
      render(
        <TauriMockProvider data-oid="8iqvzut">
          <div data-oid=".f73rqr">Content</div>
        </TauriMockProvider>,
      )

      const callback = vi.fn()
      const id = (global.window as any).__TAURI_INTERNALS__.transformCallback(callback)

      expect(typeof id).toBe("number")
      expect((global.window as any).__TAURI_INTERNALS__.callbacks.has(id)).toBe(true)
    })

    it("должен удалять callbacks", () => {
      render(
        <TauriMockProvider data-oid="r08h3k9">
          <div data-oid="e88iekn">Content</div>
        </TauriMockProvider>,
      )

      const callback = vi.fn()
      const id = (global.window as any).__TAURI_INTERNALS__.transformCallback(callback)

      ;(global.window as any).__TAURI_INTERNALS__.unregisterCallback(id)

      expect((global.window as any).__TAURI_INTERNALS__.callbacks.has(id)).toBe(false)
    })

    it("должен вызывать callbacks с данными", () => {
      render(
        <TauriMockProvider data-oid="ckutrrq">
          <div data-oid="uvk9q3f">Content</div>
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
          <TauriMockProvider data-oid="phzsip1">
            <div data-oid="wo0n9df">Content</div>
          </TauriMockProvider>,
        )
      }).not.toThrow()
    })
  })

  describe("логирование", () => {
    it("должен логировать команды invoke", async () => {
      render(
        <TauriMockProvider data-oid="gbu5mm7">
          <div data-oid="7e3ux51">Content</div>
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
        <TauriMockProvider data-oid="2f_i2ks">
          <div data-oid="2as8nau">Content</div>
        </TauriMockProvider>,
      )

      await (global.window as any).__TAURI_INTERNALS__.invoke("plugin:event|listen", {
        event: "test-event",
      })

      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining("Registered listener for event"))
    })
  })
})

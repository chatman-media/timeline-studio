import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { type ShortcutSettings, ShortcutsPersistence } from "../shortcuts-persistence"
import type { ShortcutDefinition } from "../shortcuts-registry"

// Mock Tauri Store
vi.mock("@tauri-apps/plugin-store", () => ({
  Store: vi.fn().mockImplementation(() => ({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    save: vi.fn(),
  })),
}))

describe("ShortcutsPersistence", () => {
  let persistence: ShortcutsPersistence
  let mockLocalStorage: Record<string, string>

  const mockShortcuts: ShortcutDefinition[] = [
    {
      id: "play",
      category: "playback",
      label: "Play/Pause",
      keys: "Space",
      description: "Toggle play/pause",
      action: vi.fn(),
      enabled: true,
    },
    {
      id: "save",
      category: "project",
      label: "Save",
      keys: "Cmd+S",
      description: "Save project",
      action: vi.fn(),
      enabled: true,
    },
  ]

  beforeEach(() => {
    // Reset singleton instance
    // @ts-expect-error - accessing private property for testing
    ShortcutsPersistence.instance = null as any
    persistence = ShortcutsPersistence.getInstance()

    // Mock localStorage
    mockLocalStorage = {}
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockLocalStorage[key] = value
        }),
        removeItem: vi.fn((key: string) => {
          delete mockLocalStorage[key]
        }),
      },
      writable: true,
    })

    // Mock console
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("getInstance", () => {
    it("должен возвращать singleton instance", () => {
      const instance1 = ShortcutsPersistence.getInstance()
      const instance2 = ShortcutsPersistence.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe("saveSettings", () => {
    it("должен сохранять настройки в localStorage", async () => {
      await persistence.saveSettings(mockShortcuts, true)

      const saved = JSON.parse(mockLocalStorage["timeline-studio-shortcuts"])
      expect(saved).toMatchObject({
        shortcuts: {
          play: { keys: "Space", enabled: true },
          save: { keys: "Cmd+S", enabled: true },
        },
        globalEnabled: true,
        version: "1.0.0",
      })
    })

    it("должен использовать Tauri Store если доступен", async () => {
      // Mock Tauri API
      const mockStore = {
        set: vi.fn(),
        save: vi.fn(),
      }

      const { Store } = await import("@tauri-apps/plugin-store")
      ;(Store as any).mockImplementation(() => mockStore)

      // @ts-expect-error
      window.__TAURI__ = {}

      await persistence.saveSettings(mockShortcuts, false)

      expect(mockStore.set).toHaveBeenCalledWith("timeline-studio-shortcuts", {
        shortcuts: {
          play: { keys: "Space", enabled: true },
          save: { keys: "Cmd+S", enabled: true },
        },
        globalEnabled: false,
        version: "1.0.0",
      })
      expect(mockStore.save).toHaveBeenCalled()

      // @ts-expect-error
      delete window.__TAURI__
    })

    it("должен fallback на localStorage при ошибке Tauri Store", async () => {
      // Mock Tauri API с ошибкой
      const mockStore = {
        set: vi.fn().mockRejectedValue(new Error("Tauri error")),
        save: vi.fn(),
      }

      const { Store } = await import("@tauri-apps/plugin-store")
      ;(Store as any).mockImplementation(() => mockStore)

      // @ts-expect-error
      window.__TAURI__ = {}

      await persistence.saveSettings(mockShortcuts, true)

      expect(localStorage.setItem).toHaveBeenCalled()
      const saved = JSON.parse(mockLocalStorage["timeline-studio-shortcuts"])
      expect(saved.globalEnabled).toBe(true)

      // @ts-expect-error
      delete window.__TAURI__
    })

    it("должен выбросить ошибку если все методы сохранения не удались", async () => {
      // Mock localStorage error
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error("localStorage error")
      })

      await expect(persistence.saveSettings(mockShortcuts, true)).rejects.toThrow()
    })
  })

  describe("loadSettings", () => {
    it("должен загружать настройки из localStorage", async () => {
      const settings: ShortcutSettings = {
        shortcuts: {
          play: { keys: "Enter", enabled: false },
        },
        globalEnabled: false,
        version: "1.0.0",
      }

      mockLocalStorage["timeline-studio-shortcuts"] = JSON.stringify(settings)

      const loaded = await persistence.loadSettings()
      expect(loaded).toEqual(settings)
    })

    it("должен использовать Tauri Store если доступен", async () => {
      const settings: ShortcutSettings = {
        shortcuts: {
          save: { keys: "Ctrl+S", enabled: true },
        },
        globalEnabled: true,
        version: "1.0.0",
      }

      const mockStore = {
        get: vi.fn().mockResolvedValue(settings),
      }

      const { Store } = await import("@tauri-apps/plugin-store")
      ;(Store as any).mockImplementation(() => mockStore)

      // @ts-expect-error
      window.__TAURI__ = {}

      const loaded = await persistence.loadSettings()
      expect(loaded).toEqual(settings)
      expect(mockStore.get).toHaveBeenCalledWith("timeline-studio-shortcuts")

      // @ts-expect-error
      delete window.__TAURI__
    })

    it("должен мигрировать настройки старой версии", async () => {
      const oldSettings = {
        shortcuts: { play: { keys: "Space", enabled: true } },
        globalEnabled: true,
        version: "0.9.0",
      }

      mockLocalStorage["timeline-studio-shortcuts"] = JSON.stringify(oldSettings)

      const loaded = await persistence.loadSettings()
      expect(loaded?.version).toBe("1.0.0")
      expect(console.log).toHaveBeenCalledWith("Migrating shortcuts settings from 0.9.0 to 1.0.0")
    })

    it("должен вернуть null при ошибке загрузки", async () => {
      mockLocalStorage["timeline-studio-shortcuts"] = "invalid json"

      const loaded = await persistence.loadSettings()
      expect(loaded).toBeNull()
      expect(console.error).toHaveBeenCalled()
    })

    it("должен вернуть null если настройки отсутствуют", async () => {
      const loaded = await persistence.loadSettings()
      expect(loaded).toBeNull()
    })
  })

  describe("applySettings", () => {
    it("должен применять сохраненные настройки к shortcuts", () => {
      const settings: ShortcutSettings = {
        shortcuts: {
          play: { keys: "P", enabled: false },
          save: { keys: "Ctrl+S" },
        },
        globalEnabled: true,
        version: "1.0.0",
      }

      const applied = persistence.applySettings(mockShortcuts, settings)

      expect(applied[0]).toMatchObject({
        id: "play",
        keys: "P",
        enabled: false,
      })

      expect(applied[1]).toMatchObject({
        id: "save",
        keys: "Ctrl+S",
        enabled: true, // Сохраняется оригинальное значение
      })
    })

    it("должен оставлять shortcuts без изменений если нет сохраненных настроек", () => {
      const settings: ShortcutSettings = {
        shortcuts: {},
        globalEnabled: false,
        version: "1.0.0",
      }

      const applied = persistence.applySettings(mockShortcuts, settings)
      expect(applied).toEqual(mockShortcuts)
    })
  })

  describe("clearSettings", () => {
    it("должен очищать настройки из localStorage", async () => {
      mockLocalStorage["timeline-studio-shortcuts"] = "some data"

      await persistence.clearSettings()

      expect(localStorage.removeItem).toHaveBeenCalledWith("timeline-studio-shortcuts")
      expect(console.log).toHaveBeenCalledWith("Shortcuts settings cleared")
    })

    it("должен использовать Tauri Store если доступен", async () => {
      const mockStore = {
        delete: vi.fn(),
        save: vi.fn(),
      }

      const { Store } = await import("@tauri-apps/plugin-store")
      ;(Store as any).mockImplementation(() => mockStore)

      // @ts-expect-error
      window.__TAURI__ = {}

      await persistence.clearSettings()

      expect(mockStore.delete).toHaveBeenCalledWith("timeline-studio-shortcuts")
      expect(mockStore.save).toHaveBeenCalled()

      // @ts-expect-error
      delete window.__TAURI__
    })

    it("должен выбросить ошибку при неудаче", async () => {
      localStorage.removeItem = vi.fn().mockImplementation(() => {
        throw new Error("Clear error")
      })

      await expect(persistence.clearSettings()).rejects.toThrow("Clear error")
    })
  })

  describe("exportSettings", () => {
    it("должен экспортировать настройки в JSON", async () => {
      const settings: ShortcutSettings = {
        shortcuts: { play: { keys: "Space", enabled: true } },
        globalEnabled: true,
        version: "1.0.0",
      }

      mockLocalStorage["timeline-studio-shortcuts"] = JSON.stringify(settings)

      const exported = await persistence.exportSettings()
      const parsed = JSON.parse(exported)

      expect(parsed).toEqual(settings)
    })

    it("должен выбросить ошибку если нет настроек", async () => {
      await expect(persistence.exportSettings()).rejects.toThrow("No settings to export")
    })
  })

  describe("importSettings", () => {
    it("должен импортировать настройки из JSON", async () => {
      const settings: ShortcutSettings = {
        shortcuts: { play: { keys: "Enter", enabled: false } },
        globalEnabled: false,
        version: "1.0.0",
      }

      await persistence.importSettings(JSON.stringify(settings))

      const saved = JSON.parse(mockLocalStorage["timeline-studio-shortcuts"])
      expect(saved).toEqual(settings)
      expect(console.log).toHaveBeenCalledWith("Settings imported successfully")
    })

    it("должен валидировать структуру настроек", async () => {
      const invalidSettings = { invalid: true }

      await expect(persistence.importSettings(JSON.stringify(invalidSettings))).rejects.toThrow(
        "Invalid settings format",
      )
    })

    it("должен мигрировать старые версии при импорте", async () => {
      const oldSettings = {
        shortcuts: { play: { keys: "Space", enabled: true } },
        globalEnabled: true,
        version: "0.8.0",
      }

      await persistence.importSettings(JSON.stringify(oldSettings))

      const saved = JSON.parse(mockLocalStorage["timeline-studio-shortcuts"])
      expect(saved.version).toBe("1.0.0")
    })

    it("должен использовать Tauri Store если доступен", async () => {
      const settings: ShortcutSettings = {
        shortcuts: { save: { keys: "Cmd+S", enabled: true } },
        globalEnabled: true,
        version: "1.0.0",
      }

      const mockStore = {
        set: vi.fn(),
        save: vi.fn(),
      }

      const { Store } = await import("@tauri-apps/plugin-store")
      ;(Store as any).mockImplementation(() => mockStore)

      // @ts-expect-error
      window.__TAURI__ = {}

      await persistence.importSettings(JSON.stringify(settings))

      expect(mockStore.set).toHaveBeenCalledWith("timeline-studio-shortcuts", settings)
      expect(mockStore.save).toHaveBeenCalled()

      // @ts-expect-error
      delete window.__TAURI__
    })

    it("должен выбросить ошибку при невалидном JSON", async () => {
      await expect(persistence.importSettings("invalid json")).rejects.toThrow()
    })
  })
})

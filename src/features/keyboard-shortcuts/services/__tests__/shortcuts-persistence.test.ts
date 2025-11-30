import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { type ShortcutSettings, ShortcutsPersistence, shortcutsPersistence } from "../shortcuts-persistence"
import type { ShortcutDefinition } from "../shortcuts-registry"

// Setup localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      store = Object.fromEntries(Object.entries(store).filter(([k]) => k !== key))
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
})

// Mock Tauri Store
const mockStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
  save: vi.fn(),
  load: vi.fn(),
}

vi.mock("@tauri-apps/plugin-store", () => ({
  Store: {
    load: vi.fn(() => Promise.resolve(mockStore)),
  },
}))

// Mock environment
vi.mock("@/lib/environment", () => ({
  isDesktop: vi.fn(() => false),
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

describe("ShortcutsPersistence", () => {
  let persistence: ShortcutsPersistence

  const mockShortcut: ShortcutDefinition = {
    id: "test-shortcut",
    name: "Test Shortcut",
    category: "file",
    keys: ["Ctrl+T"],
    description: "Test description",
    enabled: true,
    context: "global",
  }

  const mockSettings: ShortcutSettings = {
    shortcuts: {
      "test-shortcut": {
        keys: ["Ctrl+T"],
        enabled: true,
      },
    },
    globalEnabled: false,
    version: "1.0.0",
  }

  beforeEach(async () => {
    // Reset singleton
    // @ts-expect-error - accessing private property for testing
    ShortcutsPersistence.instance = null as any

    persistence = ShortcutsPersistence.getInstance()

    // Clear localStorage
    localStorage.clear()

    // Reset all mocks
    vi.clearAllMocks()
    mockStore.set.mockResolvedValue(undefined)
    mockStore.get.mockResolvedValue(undefined)
    mockStore.delete.mockResolvedValue(undefined)
    mockStore.save.mockResolvedValue(undefined)

    // Mock isDesktop to return false by default
    const env = await import("@/lib/environment")
    ;(env.isDesktop as any).mockReturnValue(false)
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

    it("экспортированный instance должен быть экземпляром ShortcutsPersistence", () => {
      expect(shortcutsPersistence).toBeInstanceOf(ShortcutsPersistence)
    })
  })

  describe("saveSettings", () => {
    it("должен сохранять настройки в localStorage в веб-режиме", async () => {
      const shortcuts = [mockShortcut]

      await persistence.saveSettings(shortcuts, false)

      const saved = JSON.parse(localStorage.getItem("timeline-studio-shortcuts") || "{}")
      expect(saved).toMatchObject({
        shortcuts: {
          "test-shortcut": {
            keys: ["Ctrl+T"],
            enabled: true,
          },
        },
        globalEnabled: false,
        version: "1.0.0",
      })
    })

    it("должен сохранять настройки в Tauri Store в desktop-режиме", async () => {
      const { isDesktop } = await import("@/lib/environment")
      vi.mocked(isDesktop).mockReturnValue(true)

      const shortcuts = [mockShortcut]

      await persistence.saveSettings(shortcuts, true)

      expect(mockStore.set).toHaveBeenCalledWith(
        "timeline-studio-shortcuts",
        expect.objectContaining({
          globalEnabled: true,
          version: "1.0.0",
        }),
      )
      expect(mockStore.save).toHaveBeenCalled()
    })

    it("должен использовать fallback на localStorage при ошибке Tauri Store", async () => {
      const { isDesktop } = await import("@/lib/environment")
      vi.mocked(isDesktop).mockReturnValue(true)

      mockStore.set.mockRejectedValue(new Error("Tauri error"))

      const shortcuts = [mockShortcut]

      await persistence.saveSettings(shortcuts, false)

      // Проверяем что fallback сработал
      const saved = JSON.parse(localStorage.getItem("timeline-studio-shortcuts") || "{}")
      expect(saved).toBeDefined()
    })

    it("должен выбрасывать ошибку если оба способа сохранения не работают", async () => {
      const { isDesktop } = await import("@/lib/environment")
      vi.mocked(isDesktop).mockReturnValue(true)

      mockStore.set.mockRejectedValue(new Error("Tauri error"))

      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error("localStorage error")
      })

      const shortcuts = [mockShortcut]

      await expect(persistence.saveSettings(shortcuts, false)).rejects.toThrow()

      // Restore
      localStorage.setItem = originalSetItem
    })
  })

  describe("loadSettings", () => {
    it("должен загружать настройки из localStorage в веб-режиме", async () => {
      localStorage.setItem("timeline-studio-shortcuts", JSON.stringify(mockSettings))

      const settings = await persistence.loadSettings()

      expect(settings).toEqual(mockSettings)
    })

    it("должен загружать настройки из Tauri Store в desktop-режиме", async () => {
      const { isDesktop } = await import("@/lib/environment")
      vi.mocked(isDesktop).mockReturnValue(true)

      mockStore.get.mockResolvedValue(mockSettings)

      const settings = await persistence.loadSettings()

      expect(mockStore.get).toHaveBeenCalledWith("timeline-studio-shortcuts")
      expect(settings).toEqual(mockSettings)
    })

    it("должен использовать fallback на localStorage если Tauri Store пуст", async () => {
      const { isDesktop } = await import("@/lib/environment")
      vi.mocked(isDesktop).mockReturnValue(true)

      mockStore.get.mockResolvedValue(undefined)
      localStorage.setItem("timeline-studio-shortcuts", JSON.stringify(mockSettings))

      const settings = await persistence.loadSettings()

      expect(settings).toEqual(mockSettings)
    })

    it("должен возвращать null если настроек нет", async () => {
      const settings = await persistence.loadSettings()

      expect(settings).toBeNull()
    })

    it("должен мигрировать настройки при несовпадении версии", async () => {
      const oldSettings = {
        ...mockSettings,
        version: "0.9.0",
      }
      localStorage.setItem("timeline-studio-shortcuts", JSON.stringify(oldSettings))

      const settings = await persistence.loadSettings()

      expect(settings?.version).toBe("1.0.0")
    })

    it("должен обрабатывать ошибки загрузки", async () => {
      const { isDesktop } = await import("@/lib/environment")
      vi.mocked(isDesktop).mockReturnValue(true)

      mockStore.get.mockRejectedValue(new Error("Load error"))

      const settings = await persistence.loadSettings()

      expect(settings).toBeNull()
    })

    it("должен обрабатывать невалидный JSON в localStorage", async () => {
      localStorage.setItem("timeline-studio-shortcuts", "invalid json")

      const settings = await persistence.loadSettings()

      expect(settings).toBeNull()
    })
  })

  describe("applySettings", () => {
    it("должен применять сохраненные настройки к shortcuts", () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: "shortcut-1",
          name: "Shortcut 1",
          category: "file",
          keys: ["Ctrl+S"],
          enabled: true,
        },
        {
          id: "shortcut-2",
          name: "Shortcut 2",
          category: "edit",
          keys: ["Ctrl+X"],
          enabled: true,
        },
      ]

      const settings: ShortcutSettings = {
        shortcuts: {
          "shortcut-1": {
            keys: ["Alt+S"],
            enabled: false,
          },
        },
        globalEnabled: false,
        version: "1.0.0",
      }

      const updated = persistence.applySettings(shortcuts, settings)

      expect(updated[0].keys).toEqual(["Alt+S"])
      expect(updated[0].enabled).toBe(false)
      expect(updated[1].keys).toEqual(["Ctrl+X"]) // Не изменился
    })

    it("должен сохранять исходные значения если настроек нет", () => {
      const shortcuts: ShortcutDefinition[] = [mockShortcut]

      const settings: ShortcutSettings = {
        shortcuts: {},
        globalEnabled: false,
        version: "1.0.0",
      }

      const updated = persistence.applySettings(shortcuts, settings)

      expect(updated[0]).toEqual(mockShortcut)
    })

    it("должен применять частичные настройки", () => {
      const shortcuts: ShortcutDefinition[] = [mockShortcut]

      const settings: ShortcutSettings = {
        shortcuts: {
          "test-shortcut": {
            enabled: false,
            // keys не указан - должен остаться прежним
          },
        },
        globalEnabled: false,
        version: "1.0.0",
      }

      const updated = persistence.applySettings(shortcuts, settings)

      expect(updated[0].keys).toEqual(mockShortcut.keys)
      expect(updated[0].enabled).toBe(false)
    })
  })

  describe("clearSettings", () => {
    it("должен очищать настройки из localStorage в веб-режиме", async () => {
      localStorage.setItem("timeline-studio-shortcuts", JSON.stringify(mockSettings))

      await persistence.clearSettings()

      expect(localStorage.getItem("timeline-studio-shortcuts")).toBeNull()
    })

    it("должен очищать настройки из Tauri Store в desktop-режиме", async () => {
      const { isDesktop } = await import("@/lib/environment")
      vi.mocked(isDesktop).mockReturnValue(true)

      await persistence.clearSettings()

      expect(mockStore.delete).toHaveBeenCalledWith("timeline-studio-shortcuts")
      expect(mockStore.save).toHaveBeenCalled()
    })

    it("должен выбрасывать ошибку при ошибке очистки", async () => {
      const { isDesktop } = await import("@/lib/environment")
      vi.mocked(isDesktop).mockReturnValue(true)

      mockStore.delete.mockRejectedValue(new Error("Delete error"))

      await expect(persistence.clearSettings()).rejects.toThrow("Delete error")
    })
  })

  describe("exportSettings", () => {
    it("должен экспортировать настройки в JSON", async () => {
      localStorage.setItem("timeline-studio-shortcuts", JSON.stringify(mockSettings))

      const exported = await persistence.exportSettings()

      expect(JSON.parse(exported)).toEqual(mockSettings)
    })

    it("должен выбрасывать ошибку если нечего экспортировать", async () => {
      await expect(persistence.exportSettings()).rejects.toThrow("No settings to export")
    })

    it("должен форматировать JSON с отступами", async () => {
      localStorage.setItem("timeline-studio-shortcuts", JSON.stringify(mockSettings))

      const exported = await persistence.exportSettings()

      // Проверяем что JSON отформатирован
      expect(exported).toContain("\n")
      expect(exported).toContain("  ")
    })
  })

  describe("importSettings", () => {
    it("должен импортировать настройки из JSON", async () => {
      const jsonString = JSON.stringify(mockSettings)

      await persistence.importSettings(jsonString)

      const saved = JSON.parse(localStorage.getItem("timeline-studio-shortcuts") || "{}")
      expect(saved).toEqual(mockSettings)
    })

    it("должен импортировать в Tauri Store в desktop-режиме", async () => {
      const { isDesktop } = await import("@/lib/environment")
      vi.mocked(isDesktop).mockReturnValue(true)

      const jsonString = JSON.stringify(mockSettings)

      await persistence.importSettings(jsonString)

      expect(mockStore.set).toHaveBeenCalledWith("timeline-studio-shortcuts", mockSettings)
      expect(mockStore.save).toHaveBeenCalled()
    })

    it("должен валидировать структуру настроек", async () => {
      const invalidSettings = {
        shortcuts: {},
        // version отсутствует
      }

      await expect(persistence.importSettings(JSON.stringify(invalidSettings))).rejects.toThrow(
        "Invalid settings format",
      )
    })

    it("должен мигрировать импортированные настройки", async () => {
      const oldSettings = {
        shortcuts: {},
        globalEnabled: false,
        version: "0.9.0",
      }

      await persistence.importSettings(JSON.stringify(oldSettings))

      const saved = JSON.parse(localStorage.getItem("timeline-studio-shortcuts") || "{}")
      expect(saved.version).toBe("1.0.0")
    })

    it("должен обрабатывать невалидный JSON", async () => {
      await expect(persistence.importSettings("invalid json")).rejects.toThrow()
    })

    it("должен обрабатывать ошибки импорта", async () => {
      const { isDesktop } = await import("@/lib/environment")
      vi.mocked(isDesktop).mockReturnValue(true)

      mockStore.set.mockRejectedValue(new Error("Import error"))

      await expect(persistence.importSettings(JSON.stringify(mockSettings))).rejects.toThrow()
    })
  })

  describe("serializeShortcuts", () => {
    it("должен сериализовать только необходимые поля", async () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: "test-1",
          name: "Test 1",
          category: "file",
          keys: ["Ctrl+T"],
          enabled: true,
          description: "Description",
          action: vi.fn(),
        },
      ]

      await persistence.saveSettings(shortcuts, false)

      const saved = JSON.parse(localStorage.getItem("timeline-studio-shortcuts") || "{}")

      // Проверяем что сохранены только keys и enabled
      expect(saved.shortcuts["test-1"]).toEqual({
        keys: ["Ctrl+T"],
        enabled: true,
      })
      expect(saved.shortcuts["test-1"].name).toBeUndefined()
      expect(saved.shortcuts["test-1"].category).toBeUndefined()
      expect(saved.shortcuts["test-1"].description).toBeUndefined()
      expect(saved.shortcuts["test-1"].action).toBeUndefined()
    })
  })

  describe("migrateSettings", () => {
    it("должен обновлять версию настроек", async () => {
      const oldSettings = {
        shortcuts: {
          "test-shortcut": {
            keys: ["Ctrl+T"],
            enabled: true,
          },
        },
        globalEnabled: false,
        version: "0.5.0",
      }

      localStorage.setItem("timeline-studio-shortcuts", JSON.stringify(oldSettings))

      const settings = await persistence.loadSettings()

      expect(settings?.version).toBe("1.0.0")
    })

    it("должен сохранять данные при миграции", async () => {
      const oldSettings = {
        shortcuts: {
          "test-shortcut": {
            keys: ["Ctrl+T"],
            enabled: false,
          },
        },
        globalEnabled: true,
        version: "0.8.0",
      }

      localStorage.setItem("timeline-studio-shortcuts", JSON.stringify(oldSettings))

      const settings = await persistence.loadSettings()

      expect(settings?.shortcuts).toEqual(oldSettings.shortcuts)
      expect(settings?.globalEnabled).toBe(true)
    })
  })

  describe("edge cases", () => {
    it("должен обрабатывать пустой массив shortcuts", async () => {
      await persistence.saveSettings([], false)

      const saved = JSON.parse(localStorage.getItem("timeline-studio-shortcuts") || "{}")
      expect(saved.shortcuts).toEqual({})
    })

    it("должен обрабатывать shortcuts с пустыми keys", async () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: "empty-keys",
          name: "Empty",
          category: "file",
          keys: [],
          enabled: true,
        },
      ]

      await persistence.saveSettings(shortcuts, false)

      const saved = JSON.parse(localStorage.getItem("timeline-studio-shortcuts") || "{}")
      expect(saved.shortcuts["empty-keys"].keys).toEqual([])
    })

    it("должен обрабатывать shortcuts с enabled = undefined", async () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: "undefined-enabled",
          name: "Undefined",
          category: "file",
          keys: ["Ctrl+U"],
          enabled: undefined,
        },
      ]

      await persistence.saveSettings(shortcuts, false)

      const saved = JSON.parse(localStorage.getItem("timeline-studio-shortcuts") || "{}")
      expect(saved.shortcuts["undefined-enabled"].enabled).toBeUndefined()
    })

    it("должен обрабатывать множественные shortcuts", async () => {
      const shortcuts: ShortcutDefinition[] = Array.from({ length: 100 }, (_, i) => ({
        id: `shortcut-${i}`,
        name: `Shortcut ${i}`,
        category: "file",
        keys: [`Ctrl+${i}`],
        enabled: true,
      }))

      await persistence.saveSettings(shortcuts, false)

      const saved = JSON.parse(localStorage.getItem("timeline-studio-shortcuts") || "{}")
      expect(Object.keys(saved.shortcuts)).toHaveLength(100)
    })
  })
})

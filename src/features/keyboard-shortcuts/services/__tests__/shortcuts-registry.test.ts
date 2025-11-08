import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { shortcutsPersistence } from "../shortcuts-persistence"
import { type ShortcutDefinition, shortcutsRegistry } from "../shortcuts-registry"

// Mock shortcuts-persistence
vi.mock("../shortcuts-persistence", () => ({
  shortcutsPersistence: {
    saveSettings: vi.fn(),
    loadSettings: vi.fn(),
    applySettings: vi.fn(),
    exportSettings: vi.fn(),
    importSettings: vi.fn(),
    clearSettings: vi.fn(),
  },
}))

describe("ShortcutsRegistry", () => {
  const mockShortcut: ShortcutDefinition = {
    id: "test-shortcut",
    name: "Test Shortcut",
    category: "file",
    keys: ["Ctrl+T"],
    description: "Test description",
    action: vi.fn(),
    enabled: true,
    context: "global",
  }

  const mockShortcut2: ShortcutDefinition = {
    id: "test-shortcut-2",
    name: "Test Shortcut 2",
    category: "edit",
    keys: ["Ctrl+E"],
    description: "Test description 2",
    action: vi.fn(),
    enabled: false,
    context: "timeline",
  }

  beforeEach(() => {
    // Очищаем реестр перед каждым тестом
    shortcutsRegistry.clear()
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("getInstance", () => {
    it("должен возвращать singleton instance", () => {
      const instance1 = shortcutsRegistry
      const instance2 = shortcutsRegistry
      expect(instance1).toBe(instance2)
    })
  })

  describe("initializeCategories", () => {
    it("должен инициализировать категории по умолчанию", () => {
      const categories = shortcutsRegistry.getCategories()

      expect(categories).toHaveLength(11)
      expect(categories[0]).toMatchObject({
        id: "settings",
        name: "Настройки",
        order: 1,
      })
      expect(categories[10]).toMatchObject({
        id: "other",
        name: "Прочее",
        order: 11,
      })
    })
  })

  describe("register", () => {
    it("должен регистрировать shortcut", () => {
      const listener = vi.fn()
      shortcutsRegistry.subscribe(listener)

      shortcutsRegistry.register(mockShortcut)

      expect(shortcutsRegistry.get("test-shortcut")).toEqual(mockShortcut)
      expect(listener).toHaveBeenCalledWith([mockShortcut])
    })

    it("должен нормализовать keys в массив", () => {
      const shortcutWithString = {
        ...mockShortcut,
        keys: "Ctrl+S" as any,
      }

      shortcutsRegistry.register(shortcutWithString)

      const registered = shortcutsRegistry.get(mockShortcut.id)
      expect(registered?.keys).toEqual(["Ctrl+S"])
    })

    it("должен добавлять enabled: true по умолчанию", () => {
      const shortcutWithoutEnabled = {
        ...mockShortcut,
        enabled: undefined,
      }

      shortcutsRegistry.register(shortcutWithoutEnabled)

      const registered = shortcutsRegistry.get(mockShortcut.id)
      expect(registered?.enabled).toBe(true)
    })
  })

  describe("registerMany", () => {
    it("должен регистрировать несколько shortcuts", () => {
      shortcutsRegistry.registerMany([mockShortcut, mockShortcut2])

      expect(shortcutsRegistry.getAll()).toHaveLength(2)
      expect(shortcutsRegistry.get("test-shortcut")).toEqual(mockShortcut)
      expect(shortcutsRegistry.get("test-shortcut-2")).toEqual(mockShortcut2)
    })
  })

  describe("get", () => {
    it("должен возвращать shortcut по id", () => {
      shortcutsRegistry.register(mockShortcut)

      expect(shortcutsRegistry.get("test-shortcut")).toEqual(mockShortcut)
    })

    it("должен возвращать undefined для несуществующего id", () => {
      expect(shortcutsRegistry.get("non-existent")).toBeUndefined()
    })
  })

  describe("getAll", () => {
    it("должен возвращать все shortcuts", () => {
      shortcutsRegistry.registerMany([mockShortcut, mockShortcut2])

      const all = shortcutsRegistry.getAll()
      expect(all).toHaveLength(2)
      expect(all).toContainEqual(mockShortcut)
      expect(all).toContainEqual(mockShortcut2)
    })
  })

  describe("getByCategory", () => {
    it("должен возвращать shortcuts по категории", () => {
      shortcutsRegistry.registerMany([mockShortcut, mockShortcut2])

      const fileShortcuts = shortcutsRegistry.getByCategory("file")
      expect(fileShortcuts).toHaveLength(1)
      expect(fileShortcuts[0]).toEqual(mockShortcut)

      const editShortcuts = shortcutsRegistry.getByCategory("edit")
      expect(editShortcuts).toHaveLength(1)
      expect(editShortcuts[0]).toEqual(mockShortcut2)
    })
  })

  describe("updateKeys", () => {
    it("должен обновлять клавиши shortcut", () => {
      const listener = vi.fn()
      shortcutsRegistry.subscribe(listener)
      shortcutsRegistry.register(mockShortcut)

      shortcutsRegistry.updateKeys("test-shortcut", ["Alt+T", "Cmd+T"])

      const updated = shortcutsRegistry.get("test-shortcut")
      expect(updated?.keys).toEqual(["Alt+T", "Cmd+T"])
      expect(listener).toHaveBeenCalledTimes(2) // При регистрации и обновлении
    })

    it("не должен ничего делать для несуществующего shortcut", () => {
      const listener = vi.fn()
      shortcutsRegistry.subscribe(listener)

      shortcutsRegistry.updateKeys("non-existent", ["Alt+X"])

      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe("toggleEnabled", () => {
    it("должен переключать enabled состояние", () => {
      shortcutsRegistry.register(mockShortcut)

      shortcutsRegistry.toggleEnabled("test-shortcut")

      let updated = shortcutsRegistry.get("test-shortcut")
      expect(updated?.enabled).toBe(false)

      shortcutsRegistry.toggleEnabled("test-shortcut")

      updated = shortcutsRegistry.get("test-shortcut")
      expect(updated?.enabled).toBe(true)
    })
  })

  describe("updateAction", () => {
    it("должен обновлять action shortcut", () => {
      shortcutsRegistry.register(mockShortcut)

      const newAction = vi.fn()
      shortcutsRegistry.updateAction("test-shortcut", newAction)

      const updated = shortcutsRegistry.get("test-shortcut")
      expect(updated?.action).toBe(newAction)
    })

    it("должен устанавливать undefined action", () => {
      shortcutsRegistry.register(mockShortcut)

      shortcutsRegistry.updateAction("test-shortcut", undefined)

      const updated = shortcutsRegistry.get("test-shortcut")
      expect(updated?.action).toBeUndefined()
    })
  })

  describe("reset и resetAll", () => {
    it("должен уведомлять слушателей при reset", () => {
      const listener = vi.fn()
      shortcutsRegistry.subscribe(listener)

      shortcutsRegistry.reset("test-shortcut")

      expect(listener).toHaveBeenCalled()
    })

    it("должен уведомлять слушателей при resetAll", () => {
      const listener = vi.fn()
      shortcutsRegistry.subscribe(listener)

      shortcutsRegistry.resetAll()

      expect(listener).toHaveBeenCalled()
    })
  })

  describe("subscribe", () => {
    it("должен подписывать слушателей на изменения", () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      shortcutsRegistry.subscribe(listener1)
      shortcutsRegistry.subscribe(listener2)

      shortcutsRegistry.register(mockShortcut)

      expect(listener1).toHaveBeenCalledWith([mockShortcut])
      expect(listener2).toHaveBeenCalledWith([mockShortcut])
    })

    it("должен возвращать функцию отписки", () => {
      const listener = vi.fn()
      const unsubscribe = shortcutsRegistry.subscribe(listener)

      shortcutsRegistry.register(mockShortcut)
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()

      shortcutsRegistry.register(mockShortcut2)
      expect(listener).toHaveBeenCalledTimes(1) // Не вызывается после отписки
    })
  })

  describe("context management", () => {
    it("должен устанавливать текущий контекст", () => {
      shortcutsRegistry.setContext("timeline")

      expect(shortcutsRegistry.getCurrentContext()).toBe("timeline")
    })

    it("должен управлять стеком контекстов", () => {
      expect(shortcutsRegistry.getCurrentContext()).toBe("global")

      shortcutsRegistry.enterContext("timeline")
      expect(shortcutsRegistry.getCurrentContext()).toBe("timeline")

      shortcutsRegistry.enterContext("modal")
      expect(shortcutsRegistry.getCurrentContext()).toBe("modal")

      shortcutsRegistry.exitContext()
      expect(shortcutsRegistry.getCurrentContext()).toBe("timeline")

      shortcutsRegistry.exitContext()
      expect(shortcutsRegistry.getCurrentContext()).toBe("global")

      // Не должен выходить из последнего контекста
      shortcutsRegistry.exitContext()
      expect(shortcutsRegistry.getCurrentContext()).toBe("global")
    })

    it("должен возвращать активные shortcuts для текущего контекста", () => {
      shortcutsRegistry.registerMany([
        { ...mockShortcut, id: "global-1", context: "global" },
        { ...mockShortcut, id: "global-2", context: undefined }, // undefined = global
        { ...mockShortcut, id: "timeline-1", context: "timeline" },
        { ...mockShortcut, id: "modal-1", context: "modal" },
      ])

      // В global контексте
      let active = shortcutsRegistry.getActiveShortcuts()
      expect(active).toHaveLength(2)
      expect(active.map((s) => s.id)).toContain("global-1")
      expect(active.map((s) => s.id)).toContain("global-2")

      // В timeline контексте
      shortcutsRegistry.setContext("timeline")
      active = shortcutsRegistry.getActiveShortcuts()
      expect(active).toHaveLength(3) // global + timeline
      expect(active.map((s) => s.id)).toContain("global-1")
      expect(active.map((s) => s.id)).toContain("global-2")
      expect(active.map((s) => s.id)).toContain("timeline-1")
    })

    it("должен возвращать shortcuts по контексту", () => {
      shortcutsRegistry.registerMany([
        { ...mockShortcut, id: "global-1", context: "global" },
        { ...mockShortcut, id: "timeline-1", context: "timeline" },
        { ...mockShortcut, id: "timeline-2", context: "timeline" },
      ])

      const timelineShortcuts = shortcutsRegistry.getByContext("timeline")
      expect(timelineShortcuts).toHaveLength(3) // global + timeline-specific

      const modalShortcuts = shortcutsRegistry.getByContext("modal")
      expect(modalShortcuts).toHaveLength(1) // только global
    })
  })

  describe("settings management", () => {
    it("должен сохранять настройки", async () => {
      shortcutsRegistry.register(mockShortcut)

      await shortcutsRegistry.saveSettings(true)

      expect(shortcutsPersistence.saveSettings).toHaveBeenCalledWith([mockShortcut], true)
    })

    it("должен обрабатывать ошибки при сохранении", async () => {
      vi.mocked(shortcutsPersistence.saveSettings).mockRejectedValue(new Error("Save error"))

      await expect(shortcutsRegistry.saveSettings()).rejects.toThrow("Save error")
    })

    it("должен загружать настройки", async () => {
      const mockSettings = {
        shortcuts: {
          "test-shortcut": { keys: ["Alt+T"], enabled: false },
        },
        globalEnabled: true,
        version: "1.0.0",
      }

      vi.mocked(shortcutsPersistence.loadSettings).mockResolvedValue(mockSettings)
      vi.mocked(shortcutsPersistence.applySettings).mockReturnValue([
        { ...mockShortcut, keys: ["Alt+T"], enabled: false },
      ])

      const result = await shortcutsRegistry.loadSettings()

      expect(result).toEqual({ globalEnabled: true })
      expect(shortcutsRegistry.get("test-shortcut")).toMatchObject({
        keys: ["Alt+T"],
        enabled: false,
      })
    })

    it("должен возвращать null при отсутствии настроек", async () => {
      vi.mocked(shortcutsPersistence.loadSettings).mockResolvedValue(null)

      const result = await shortcutsRegistry.loadSettings()

      expect(result).toBeNull()
    })

    it("должен обрабатывать ошибки при загрузке", async () => {
      vi.mocked(shortcutsPersistence.loadSettings).mockRejectedValue(new Error("Load error"))

      const result = await shortcutsRegistry.loadSettings()

      expect(result).toBeNull()
    })

    it("должен экспортировать настройки", async () => {
      const mockExport = '{"shortcuts": {}}'
      vi.mocked(shortcutsPersistence.exportSettings).mockResolvedValue(mockExport)

      const result = await shortcutsRegistry.exportSettings()

      expect(result).toBe(mockExport)
    })

    it("должен импортировать настройки", async () => {
      const mockImport = '{"shortcuts": {}}'

      await shortcutsRegistry.importSettings(mockImport)

      expect(shortcutsPersistence.importSettings).toHaveBeenCalledWith(mockImport)
      expect(shortcutsPersistence.loadSettings).toHaveBeenCalled()
    })

    it("должен очищать настройки", async () => {
      await shortcutsRegistry.clearSettings()

      expect(shortcutsPersistence.clearSettings).toHaveBeenCalled()
    })
  })

  describe("clear", () => {
    it("должен очищать все shortcuts и сбрасывать состояние", () => {
      const listener = vi.fn()

      shortcutsRegistry.registerMany([mockShortcut, mockShortcut2])
      shortcutsRegistry.setContext("timeline")
      shortcutsRegistry.subscribe(listener)

      shortcutsRegistry.clear()

      expect(shortcutsRegistry.getAll()).toHaveLength(0)
      expect(shortcutsRegistry.getCurrentContext()).toBe("global")
      expect(shortcutsRegistry.getCategories()).toHaveLength(11) // Категории восстановлены
      expect(listener).toHaveBeenCalledWith([])
    })
  })
})

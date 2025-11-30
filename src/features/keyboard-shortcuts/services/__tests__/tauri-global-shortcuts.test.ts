import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { type ShortcutDefinition, shortcutsRegistry } from "../shortcuts-registry"
import { TauriGlobalShortcuts, tauriGlobalShortcuts } from "../tauri-global-shortcuts"

// Mock Tauri global-shortcut plugin
vi.mock("@tauri-apps/plugin-global-shortcut", () => ({
  isRegistered: vi.fn(),
  register: vi.fn(),
  unregister: vi.fn(),
}))

// Mock shortcuts-registry
vi.mock("../shortcuts-registry", () => ({
  shortcutsRegistry: {
    getAll: vi.fn(() => []),
    get: vi.fn(),
  },
}))

// Mock tauri-logger to use console methods directly
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn((message: string) => console.debug(`[TauriGlobalShortcuts] ${message}`)),
    debug: vi.fn((message: string) => console.debug(`[TauriGlobalShortcuts] ${message}`)),
    info: vi.fn((message: string) => console.info(`[TauriGlobalShortcuts] ${message}`)),
    warn: vi.fn((message: string) => console.warn(`[TauriGlobalShortcuts] ${message}`)),
    error: vi.fn((message: string, context?: unknown) => {
      if (context && typeof context === "object" && "error" in context) {
        console.error(`[TauriGlobalShortcuts] ${message}`, context.error)
      } else {
        console.error(`[TauriGlobalShortcuts] ${message}`)
      }
    }),
  })),
}))

describe("TauriGlobalShortcuts", () => {
  let instance: TauriGlobalShortcuts

  const mockGlobalShortcut: ShortcutDefinition = {
    id: "global-shortcut",
    name: "Global Shortcut",
    category: "file",
    keys: ["Cmd+G"],
    description: "Global shortcut",
    action: vi.fn(),
    enabled: true,
    context: "global",
  }

  const mockTimelineShortcut: ShortcutDefinition = {
    id: "timeline-shortcut",
    name: "Timeline Shortcut",
    category: "timeline",
    keys: ["Ctrl+T"],
    description: "Timeline shortcut",
    action: vi.fn(),
    enabled: true,
    context: "timeline",
  }

  const mockDisabledShortcut: ShortcutDefinition = {
    id: "disabled-shortcut",
    name: "Disabled Shortcut",
    category: "file",
    keys: ["Cmd+D"],
    description: "Disabled shortcut",
    action: vi.fn(),
    enabled: false,
    context: "global",
  }

  beforeEach(async () => {
    // Reset singleton instance
    // @ts-expect-error - accessing private property for testing
    TauriGlobalShortcuts.instance = null as any
    instance = TauriGlobalShortcuts.getInstance()

    // Reset all mocks to default successful state
    const tauriShortcut = await import("@tauri-apps/plugin-global-shortcut")
    ;(tauriShortcut.register as any).mockResolvedValue(undefined)
    ;(tauriShortcut.unregister as any).mockResolvedValue(undefined)
    ;(tauriShortcut.isRegistered as any).mockResolvedValue(false)

    vi.clearAllMocks()
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("getInstance", () => {
    it("должен возвращать singleton instance", () => {
      const instance1 = TauriGlobalShortcuts.getInstance()
      const instance2 = TauriGlobalShortcuts.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe("enableGlobal", () => {
    it("должен регистрировать глобальные shortcuts", async () => {
      const { register, isRegistered } = await import("@tauri-apps/plugin-global-shortcut")

      vi.mocked(shortcutsRegistry.getAll).mockReturnValue([
        mockGlobalShortcut,
        mockTimelineShortcut,
        mockDisabledShortcut,
      ])
      vi.mocked(isRegistered).mockResolvedValue(false)

      await instance.enableGlobal()

      // Должен зарегистрировать только глобальные и включенные shortcuts
      expect(register).toHaveBeenCalledWith("CommandOrControl+G", expect.any(Function))
      expect(register).toHaveBeenCalledTimes(1)
      expect(instance.isEnabled()).toBe(true)
    })

    it("не должен ничего делать если уже включен", async () => {
      const { register } = await import("@tauri-apps/plugin-global-shortcut")

      await instance.enableGlobal()
      vi.mocked(register).mockClear()

      await instance.enableGlobal()

      expect(register).not.toHaveBeenCalled()
    })

    it("должен пропускать уже зарегистрированные shortcuts", async () => {
      const { register, isRegistered } = await import("@tauri-apps/plugin-global-shortcut")

      vi.mocked(shortcutsRegistry.getAll).mockReturnValue([mockGlobalShortcut])
      vi.mocked(isRegistered).mockResolvedValue(true)

      await instance.enableGlobal()

      expect(register).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalledWith(
        "[TauriGlobalShortcuts] Global shortcut CommandOrControl+G is already registered by another application",
      )
    })

    it("должен обрабатывать ошибки регистрации", async () => {
      const { register, isRegistered } = await import("@tauri-apps/plugin-global-shortcut")

      vi.mocked(shortcutsRegistry.getAll).mockReturnValue([mockGlobalShortcut])
      vi.mocked(isRegistered).mockResolvedValue(false)
      vi.mocked(register).mockRejectedValue(new Error("Register error"))

      // Ошибка регистрации отдельного shortcut не должна приводить к общей ошибке
      await instance.enableGlobal()

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to register global shortcut ${mockGlobalShortcut.name}:`),
        expect.any(Error),
      )
      // Но общий статус все равно должен быть включен
      expect(instance.isEnabled()).toBe(true)
    })
  })

  describe("disableGlobal", () => {
    it("должен отменять регистрацию глобальных shortcuts", async () => {
      const { register, unregister, isRegistered } = await import("@tauri-apps/plugin-global-shortcut")

      vi.mocked(shortcutsRegistry.getAll).mockReturnValue([mockGlobalShortcut])
      vi.mocked(shortcutsRegistry.get).mockReturnValue(mockGlobalShortcut)
      vi.mocked(isRegistered).mockResolvedValue(false)

      // Сначала включаем
      await instance.enableGlobal()
      vi.mocked(register).mockClear()

      // Затем отключаем
      await instance.disableGlobal()

      expect(unregister).toHaveBeenCalledWith("CommandOrControl+G")
      expect(instance.isEnabled()).toBe(false)
    })

    it("не должен ничего делать если уже отключен", async () => {
      const { unregister } = await import("@tauri-apps/plugin-global-shortcut")

      await instance.disableGlobal()

      expect(unregister).not.toHaveBeenCalled()
    })

    it("должен обрабатывать ошибки отмены регистрации", async () => {
      const { unregister, isRegistered } = await import("@tauri-apps/plugin-global-shortcut")

      vi.mocked(shortcutsRegistry.getAll).mockReturnValue([mockGlobalShortcut])
      vi.mocked(shortcutsRegistry.get).mockReturnValue(mockGlobalShortcut)
      vi.mocked(isRegistered).mockResolvedValue(false)

      // Сначала включаем
      await instance.enableGlobal()

      // Мокаем ошибку при отмене регистрации
      vi.mocked(unregister).mockRejectedValue(new Error("Unregister error"))

      // Ошибка unregister отдельного shortcut не должна приводить к общей ошибке
      await instance.disableGlobal()

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to unregister global shortcut ${mockGlobalShortcut.name}:`),
        expect.any(Error),
      )
      // Но общий статус все равно должен быть выключен
      expect(instance.isEnabled()).toBe(false)
    })
  })

  describe("registerGlobalShortcut", () => {
    it("должен вызывать action при срабатывании shortcut", async () => {
      const { register, isRegistered } = await import("@tauri-apps/plugin-global-shortcut")

      vi.mocked(shortcutsRegistry.getAll).mockReturnValue([mockGlobalShortcut])
      vi.mocked(isRegistered).mockResolvedValue(false)

      let registeredCallback: (() => void) | undefined
      vi.mocked(register).mockImplementation(async (_keys, callback) => {
        // Cast to avoid type errors - we're mocking the callback
        registeredCallback = callback as () => void
      })

      await instance.enableGlobal()

      // Вызываем зарегистрированный callback
      if (registeredCallback) {
        registeredCallback()
      }

      expect(mockGlobalShortcut.action).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "keydown",
          key: "Cmd+G",
          bubbles: false,
          cancelable: false,
        }),
        expect.objectContaining({
          hotkey: "CommandOrControl+G",
        }),
      )
    })

    it("не должен регистрировать shortcut без keys", async () => {
      const { register } = await import("@tauri-apps/plugin-global-shortcut")

      const shortcutWithoutKeys = { ...mockGlobalShortcut, keys: [] }
      vi.mocked(shortcutsRegistry.getAll).mockReturnValue([shortcutWithoutKeys])

      await instance.enableGlobal()

      expect(register).not.toHaveBeenCalled()
    })

    it("должен логировать ошибки регистрации отдельных shortcuts", async () => {
      const { register, isRegistered } = await import("@tauri-apps/plugin-global-shortcut")

      vi.mocked(shortcutsRegistry.getAll).mockReturnValue([mockGlobalShortcut])
      vi.mocked(isRegistered).mockResolvedValue(false)
      vi.mocked(register).mockRejectedValue(new Error("Shortcut error"))

      // Не должен выбросить ошибку, только залогировать
      await instance.enableGlobal()

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to register global shortcut ${mockGlobalShortcut.name}:`),
        expect.any(Error),
      )
    })
  })

  describe("convertKeysToTauriFormat", () => {
    it("должен конвертировать macOS символы", async () => {
      const { register, isRegistered } = await import("@tauri-apps/plugin-global-shortcut")

      const macOSShortcut = {
        ...mockGlobalShortcut,
        keys: ["⌘+⌥+⇧+⌃+Space"],
      }

      vi.mocked(shortcutsRegistry.getAll).mockReturnValue([macOSShortcut])
      vi.mocked(isRegistered).mockResolvedValue(false)

      await instance.enableGlobal()

      expect(register).toHaveBeenCalledWith("CommandOrControl+Alt+Shift+Ctrl+Space", expect.any(Function))
    })

    it("должен конвертировать текстовые модификаторы", async () => {
      const { register, isRegistered } = await import("@tauri-apps/plugin-global-shortcut")

      const shortcuts = [
        { ...mockGlobalShortcut, id: "1", keys: ["cmd+a"] },
        { ...mockGlobalShortcut, id: "2", keys: ["command+b"] },
        { ...mockGlobalShortcut, id: "3", keys: ["meta+c"] },
        { ...mockGlobalShortcut, id: "4", keys: ["alt+d"] },
        { ...mockGlobalShortcut, id: "5", keys: ["option+e"] },
        { ...mockGlobalShortcut, id: "6", keys: ["opt+f"] },
        { ...mockGlobalShortcut, id: "7", keys: ["shift+g"] },
        { ...mockGlobalShortcut, id: "8", keys: ["ctrl+h"] },
      ]

      vi.mocked(shortcutsRegistry.getAll).mockReturnValue(shortcuts)
      vi.mocked(isRegistered).mockResolvedValue(false)

      await instance.enableGlobal()

      expect(register).toHaveBeenCalledWith("CommandOrControl+a", expect.any(Function))
      expect(register).toHaveBeenCalledWith("CommandOrControl+b", expect.any(Function))
      expect(register).toHaveBeenCalledWith("CommandOrControl+c", expect.any(Function))
      expect(register).toHaveBeenCalledWith("Alt+d", expect.any(Function))
      expect(register).toHaveBeenCalledWith("Alt+e", expect.any(Function))
      expect(register).toHaveBeenCalledWith("Alt+f", expect.any(Function))
      expect(register).toHaveBeenCalledWith("Shift+g", expect.any(Function))
      expect(register).toHaveBeenCalledWith("Ctrl+h", expect.any(Function))
    })

    it("должен конвертировать специальные клавиши", async () => {
      const { register, isRegistered } = await import("@tauri-apps/plugin-global-shortcut")

      const shortcuts = [
        { ...mockGlobalShortcut, id: "1", keys: ["→"] },
        { ...mockGlobalShortcut, id: "2", keys: ["←"] },
        { ...mockGlobalShortcut, id: "3", keys: ["↑"] },
        { ...mockGlobalShortcut, id: "4", keys: ["↓"] },
        { ...mockGlobalShortcut, id: "5", keys: ["Delete"] },
        { ...mockGlobalShortcut, id: "6", keys: ["Home"] },
        { ...mockGlobalShortcut, id: "7", keys: ["End"] },
      ]

      vi.mocked(shortcutsRegistry.getAll).mockReturnValue(shortcuts)
      vi.mocked(isRegistered).mockResolvedValue(false)

      await instance.enableGlobal()

      expect(register).toHaveBeenCalledWith("ArrowRight", expect.any(Function))
      expect(register).toHaveBeenCalledWith("ArrowLeft", expect.any(Function))
      expect(register).toHaveBeenCalledWith("ArrowUp", expect.any(Function))
      expect(register).toHaveBeenCalledWith("ArrowDown", expect.any(Function))
      expect(register).toHaveBeenCalledWith("Delete", expect.any(Function))
      expect(register).toHaveBeenCalledWith("Home", expect.any(Function))
      expect(register).toHaveBeenCalledWith("End", expect.any(Function))
    })
  })

  describe("updateGlobalShortcuts", () => {
    it("должен обновлять shortcuts при изменениях", async () => {
      const { register, unregister, isRegistered } = await import("@tauri-apps/plugin-global-shortcut")

      vi.mocked(shortcutsRegistry.getAll).mockReturnValue([mockGlobalShortcut])
      vi.mocked(shortcutsRegistry.get).mockReturnValue(mockGlobalShortcut)
      vi.mocked(isRegistered).mockResolvedValue(false)

      // Включаем
      await instance.enableGlobal()

      vi.mocked(register).mockClear()
      vi.mocked(unregister).mockClear()

      // Обновляем
      await instance.updateGlobalShortcuts()

      expect(unregister).toHaveBeenCalled()
      expect(register).toHaveBeenCalled()
    })

    it("не должен ничего делать если shortcuts отключены", async () => {
      const { register, unregister } = await import("@tauri-apps/plugin-global-shortcut")

      await instance.updateGlobalShortcuts()

      expect(unregister).not.toHaveBeenCalled()
      expect(register).not.toHaveBeenCalled()
    })
  })

  describe("getRegisteredShortcuts", () => {
    it("должен возвращать список зарегистрированных shortcuts", async () => {
      const { isRegistered } = await import("@tauri-apps/plugin-global-shortcut")

      vi.mocked(shortcutsRegistry.getAll).mockReturnValue([
        mockGlobalShortcut,
        { ...mockGlobalShortcut, id: "another-global", keys: ["Cmd+A"] },
      ])
      vi.mocked(isRegistered).mockResolvedValue(false)

      await instance.enableGlobal()

      const registered = instance.getRegisteredShortcuts()
      expect(registered).toEqual(["global-shortcut", "another-global"])
    })

    it("должен возвращать пустой массив если ничего не зарегистрировано", () => {
      const registered = instance.getRegisteredShortcuts()
      expect(registered).toEqual([])
    })
  })

  describe("exported instance", () => {
    it("должен экспортировать singleton instance", () => {
      // Проверяем, что экспортированный объект является экземпляром TauriGlobalShortcuts
      expect(tauriGlobalShortcuts).toBeInstanceOf(TauriGlobalShortcuts)
      // Проверяем, что методы доступны
      expect(typeof tauriGlobalShortcuts.enableGlobal).toBe("function")
      expect(typeof tauriGlobalShortcuts.disableGlobal).toBe("function")
      expect(typeof tauriGlobalShortcuts.isEnabled).toBe("function")
      expect(typeof tauriGlobalShortcuts.updateGlobalShortcuts).toBe("function")
      expect(typeof tauriGlobalShortcuts.getRegisteredShortcuts).toBe("function")
    })
  })
})

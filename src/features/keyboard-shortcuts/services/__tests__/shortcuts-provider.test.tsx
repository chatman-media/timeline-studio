import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ShortcutsProvider, useShortcuts } from "../shortcuts-provider"
import type { ShortcutDefinition } from "../shortcuts-registry"
import { shortcutsRegistry } from "../shortcuts-registry"
import { tauriGlobalShortcuts } from "../tauri-global-shortcuts"

// Import backend-sync mock
import "@/test/mocks/backend-sync"

// Mock модулей
vi.mock("@/features/modals/services/modal-provider", () => ({
  useModal: () => ({
    openModal: vi.fn(),
    closeModal: vi.fn(),
  }),
}))

vi.mock("../../hooks/use-panel-shortcuts", () => ({
  usePanelShortcuts: vi.fn(),
}))

vi.mock("../shortcuts-registry", () => {
  const registry = {
    getAll: vi.fn(() => []),
    getActiveShortcuts: vi.fn(() => []),
    getCurrentContext: vi.fn(() => "global"),
    registerMany: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    updateKeys: vi.fn(),
    reset: vi.fn(),
    resetAll: vi.fn(),
    setContext: vi.fn(),
    enterContext: vi.fn(),
    exitContext: vi.fn(),
    saveSettings: vi.fn(),
    loadSettings: vi.fn(),
    exportSettings: vi.fn(),
    importSettings: vi.fn(),
    clearSettings: vi.fn(),
  }

  return {
    shortcutsRegistry: registry,
  }
})

vi.mock("../tauri-global-shortcuts", () => ({
  tauriGlobalShortcuts: {
    isEnabled: vi.fn(() => false),
    enableGlobal: vi.fn(),
    disableGlobal: vi.fn(),
    updateGlobalShortcuts: vi.fn(),
  },
}))

vi.mock("../../components/shortcut-handler", () => ({
  ShortcutHandler: ({ shortcut }: { shortcut: ShortcutDefinition }) => <div data-testid={`handler-${shortcut.id}`} />,
}))

// Тестовый компонент для доступа к контексту
const TestComponent = () => {
  const shortcuts = useShortcuts()
  return (
    <div>
      <div data-testid="shortcuts-count">{shortcuts.shortcuts.length}</div>
      <div data-testid="active-count">{shortcuts.activeShortcuts.length}</div>
      <div data-testid="context">{shortcuts.currentContext}</div>
      <div data-testid="enabled">{shortcuts.isEnabled.toString()}</div>
      <div data-testid="global-enabled">{shortcuts.isGlobalEnabled.toString()}</div>
      <div data-testid="backend-connected">{shortcuts.isBackendConnected.toString()}</div>
      <div data-testid="usage-stats">{JSON.stringify(shortcuts.shortcutUsageStats)}</div>
      <button onClick={() => shortcuts.toggleShortcuts(false)}>Toggle</button>
      <button onClick={() => shortcuts.toggleGlobalShortcuts(true)}>Toggle Global</button>
      <button onClick={() => shortcuts.updateShortcutKeys("test", ["Ctrl+T"])}>Update Keys</button>
      <button onClick={() => shortcuts.resetShortcut("test")}>Reset</button>
      <button onClick={() => shortcuts.resetAllShortcuts()}>Reset All</button>
      <button onClick={() => shortcuts.setContext("modal")}>Set Context</button>
      <button onClick={() => shortcuts.enterContext("timeline")}>Enter Context</button>
      <button onClick={() => shortcuts.exitContext()}>Exit Context</button>
      <button onClick={() => shortcuts.syncShortcuts()}>Sync Shortcuts</button>
    </div>
  )
}

describe("ShortcutsProvider", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("инициализация", () => {
    it("должен инициализировать shortcuts при первой загрузке", () => {
      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      expect(shortcutsRegistry.registerMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: "open-user-settings",
            action: expect.any(Function),
          }),
        ]),
      )
    })

    it("должен загружать сохраненные настройки", async () => {
      const mockSettings = { globalEnabled: true }
      vi.mocked(shortcutsRegistry.loadSettings).mockResolvedValue(mockSettings)

      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      await waitFor(() => {
        expect(shortcutsRegistry.loadSettings).toHaveBeenCalled()
      })
    })

    it("должен включать глобальные shortcuts если они были сохранены", async () => {
      const mockSettings = { globalEnabled: true }
      vi.mocked(shortcutsRegistry.loadSettings).mockResolvedValue(mockSettings)

      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      await waitFor(() => {
        expect(tauriGlobalShortcuts.enableGlobal).toHaveBeenCalled()
      })
    })

    it("должен обрабатывать ошибки при загрузке настроек", async () => {
      vi.mocked(shortcutsRegistry.loadSettings).mockRejectedValue(new Error("Load error"))

      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith("Failed to load shortcuts settings:", expect.any(Error))
      })
    })
  })

  describe("подписка на изменения", () => {
    it("должен подписываться на изменения shortcuts", () => {
      const unsubscribe = vi.fn()
      vi.mocked(shortcutsRegistry.subscribe).mockReturnValue(unsubscribe)

      const { unmount } = render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      expect(shortcutsRegistry.subscribe).toHaveBeenCalled()

      unmount()
      expect(unsubscribe).toHaveBeenCalled()
    })

    it("должен обновлять состояние при изменениях", () => {
      let subscribeCallback: ((shortcuts: ShortcutDefinition[]) => void) | null = null
      vi.mocked(shortcutsRegistry.subscribe).mockImplementation((cb) => {
        subscribeCallback = cb
        return vi.fn()
      })

      const mockShortcuts = [{ id: "test", keys: "Ctrl+T" } as ShortcutDefinition]
      vi.mocked(shortcutsRegistry.getAll).mockReturnValue(mockShortcuts)
      vi.mocked(shortcutsRegistry.getActiveShortcuts).mockReturnValue(mockShortcuts)

      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      // Вызываем callback подписки
      subscribeCallback?.(mockShortcuts)

      expect(screen.getByTestId("shortcuts-count")).toHaveTextContent("1")
    })
  })

  describe("управление shortcuts", () => {
    it("должен переключать состояние shortcuts", async () => {
      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      expect(screen.getByTestId("enabled")).toHaveTextContent("true")

      await user.click(screen.getByText("Toggle"))

      expect(screen.getByTestId("enabled")).toHaveTextContent("false")
    })

    it("должен переключать глобальные shortcuts", async () => {
      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      await user.click(screen.getByText("Toggle Global"))

      await waitFor(() => {
        expect(tauriGlobalShortcuts.enableGlobal).toHaveBeenCalled()
        expect(shortcutsRegistry.saveSettings).toHaveBeenCalledWith(true)
      })
    })

    it("должен обрабатывать ошибки при переключении глобальных shortcuts", async () => {
      vi.mocked(tauriGlobalShortcuts.enableGlobal).mockRejectedValue(new Error("Enable error"))
      vi.mocked(tauriGlobalShortcuts.isEnabled).mockReturnValue(false)

      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      await expect(async () => {
        await user.click(screen.getByText("Toggle Global"))
        await waitFor(() => {
          expect(console.error).toHaveBeenCalled()
        })
      }).rejects.toThrow()

      expect(screen.getByTestId("global-enabled")).toHaveTextContent("false")
    })

    it("должен обновлять ключи shortcut", async () => {
      vi.mocked(tauriGlobalShortcuts.isEnabled).mockReturnValue(true)

      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      await user.click(screen.getByText("Update Keys"))

      expect(shortcutsRegistry.updateKeys).toHaveBeenCalledWith("test", ["Ctrl+T"])
      expect(tauriGlobalShortcuts.updateGlobalShortcuts).toHaveBeenCalled()
      expect(shortcutsRegistry.saveSettings).toHaveBeenCalledWith(true)
    })

    it("должен сбрасывать shortcut", async () => {
      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      await user.click(screen.getByText("Reset"))

      expect(shortcutsRegistry.reset).toHaveBeenCalledWith("test")
    })

    it("должен сбрасывать все shortcuts", async () => {
      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      await user.click(screen.getByText("Reset All"))

      expect(shortcutsRegistry.resetAll).toHaveBeenCalled()
    })
  })

  describe("управление контекстом", () => {
    it("должен устанавливать контекст", async () => {
      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      await user.click(screen.getByText("Set Context"))

      expect(shortcutsRegistry.setContext).toHaveBeenCalledWith("modal")
    })

    it("должен входить в контекст", async () => {
      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      await user.click(screen.getByText("Enter Context"))

      expect(shortcutsRegistry.enterContext).toHaveBeenCalledWith("timeline")
    })

    it("должен выходить из контекста", async () => {
      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      await user.click(screen.getByText("Exit Context"))

      expect(shortcutsRegistry.exitContext).toHaveBeenCalled()
    })
  })

  describe("управление настройками", () => {
    it("должен сохранять настройки", async () => {
      const { result } = renderHook(() => useShortcuts(), {
        wrapper: ShortcutsProvider,
      })

      await result.current.saveSettings()

      expect(shortcutsRegistry.saveSettings).toHaveBeenCalledWith(false)
    })

    it("должен загружать настройки", async () => {
      const mockSettings = { globalEnabled: true }
      vi.mocked(shortcutsRegistry.loadSettings).mockResolvedValue(mockSettings)
      vi.mocked(tauriGlobalShortcuts.isEnabled).mockReturnValue(false)

      const { result } = renderHook(() => useShortcuts(), {
        wrapper: ShortcutsProvider,
      })

      await result.current.loadSettings()

      expect(tauriGlobalShortcuts.enableGlobal).toHaveBeenCalled()
    })

    it("должен экспортировать настройки", async () => {
      const mockExport = '{"shortcuts": {}}'
      vi.mocked(shortcutsRegistry.exportSettings).mockResolvedValue(mockExport)

      const { result } = renderHook(() => useShortcuts(), {
        wrapper: ShortcutsProvider,
      })

      const exported = await result.current.exportSettings()

      expect(exported).toBe(mockExport)
    })

    it("должен импортировать настройки", async () => {
      const mockImport = '{"shortcuts": {}}'

      const { result } = renderHook(() => useShortcuts(), {
        wrapper: ShortcutsProvider,
      })

      await result.current.importSettings(mockImport)

      expect(shortcutsRegistry.importSettings).toHaveBeenCalledWith(mockImport)
      expect(shortcutsRegistry.loadSettings).toHaveBeenCalled()
    })

    it("должен очищать настройки", async () => {
      const { result } = renderHook(() => useShortcuts(), {
        wrapper: ShortcutsProvider,
      })

      await result.current.clearSettings()

      expect(shortcutsRegistry.clearSettings).toHaveBeenCalled()
    })
  })

  describe("рендеринг обработчиков", () => {
    it("должен рендерить ShortcutHandler для активных shortcuts", () => {
      const mockShortcuts = [
        { id: "test1", keys: "Ctrl+1" } as ShortcutDefinition,
        { id: "test2", keys: "Ctrl+2" } as ShortcutDefinition,
      ]
      vi.mocked(shortcutsRegistry.getActiveShortcuts).mockReturnValue(mockShortcuts)

      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      expect(screen.getByTestId("handler-test1")).toBeInTheDocument()
      expect(screen.getByTestId("handler-test2")).toBeInTheDocument()
    })
  })

  describe("useShortcuts hook", () => {
    it("должен выбрасывать ошибку если используется вне провайдера", () => {
      const Component = () => {
        useShortcuts()
        return null
      }

      expect(() => render(<Component />)).toThrow("useShortcuts must be used within ShortcutsProvider")
    })
  })

  describe("BackendSync интеграция", () => {
    it("должен показывать состояние подключения к backend", () => {
      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      expect(screen.getByTestId("backend-connected")).toHaveTextContent("true")
    })

    it("должен инициализировать пустую статистику использования", () => {
      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      expect(screen.getByTestId("usage-stats")).toHaveTextContent("{}")
    })

    it("должен вызывать syncShortcuts при нажатии кнопки", async () => {
      const { getBackendSync } = await import("@/features/app-state/services/backend-sync")
      const mockBackendSync = getBackendSync()

      render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      await user.click(screen.getByText("Sync Shortcuts"))

      await waitFor(() => {
        expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
          type: "Settings",
          params: {
            type: "SyncShortcuts",
            params: expect.objectContaining({
              shortcuts: expect.any(Array),
              globalEnabled: expect.any(Boolean),
              context: expect.any(String),
              usageStats: expect.any(Object),
            }),
          },
        })
      })
    })

    it("должен обновлять статистику использования при вызове action", async () => {
      const mockShortcut = {
        id: "test-shortcut",
        keys: "Ctrl+T",
        action: vi.fn(),
      } as unknown as ShortcutDefinition

      vi.mocked(shortcutsRegistry.getActiveShortcuts).mockReturnValue([mockShortcut])

      const { rerender } = render(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      // Симулируем вызов action через registerMany
      const registerCall = vi.mocked(shortcutsRegistry.registerMany).mock.calls[0]
      const registeredShortcut = registerCall[0].find(s => s.id === "open-user-settings")
      
      if (registeredShortcut?.action) {
        registeredShortcut.action(new KeyboardEvent("keydown"))
      }

      // Перерендериваем для обновления UI
      rerender(
        <ShortcutsProvider>
          <TestComponent />
        </ShortcutsProvider>,
      )

      await waitFor(() => {
        const stats = JSON.parse(screen.getByTestId("usage-stats").textContent || "{}")
        expect(stats["open-user-settings"]).toBe(1)
      })
    })
  })
})

// Хелпер для тестирования хуков
function renderHook<T>(hook: () => T, options?: { wrapper: React.ComponentType<{ children: React.ReactNode }> }) {
  const result: { current: T } = { current: undefined as any }

  const TestComponent = () => {
    result.current = hook()
    return null
  }

  const Wrapper = options?.wrapper || (({ children }: { children: React.ReactNode }) => <>{children}</>)

  render(
    <Wrapper>
      <TestComponent />
    </Wrapper>,
  )

  return { result }
}

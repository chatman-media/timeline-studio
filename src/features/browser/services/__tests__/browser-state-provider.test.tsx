import { act, render, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BrowserTab } from "@/domains/browser"
import { BrowserStateProvider, useBrowserState, useBrowserStateSync } from "../browser-state-provider"

// Import backend-sync mock
import "@/test/mocks/backend-sync"

// Mock getBackendSync
import { getBackendSync } from "@/features/app-state/services/backend-sync"

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

describe("BrowserStateProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it("должен рендерить детей", () => {
    const { getByText } = render(
      <BrowserStateProvider>
        <div>Test Child</div>
      </BrowserStateProvider>,
    )

    expect(getByText("Test Child")).toBeInTheDocument()
  })

  it("должен предоставлять контекст через useBrowserState", () => {
    const TestComponent = () => {
      const context = useBrowserState()
      return (
        <div>
          <div data-testid="activeTab">{context.activeTab}</div>
          <div data-testid="searchQuery">{context.currentTabSettings.searchQuery}</div>
          <div data-testid="viewMode">{context.currentTabSettings.viewMode}</div>
          <div data-testid="isBackendConnected">{context.isBackendConnected.toString()}</div>
        </div>
      )
    }

    const { getByTestId } = render(
      <BrowserStateProvider>
        <TestComponent />
      </BrowserStateProvider>,
    )

    expect(getByTestId("activeTab")).toHaveTextContent("media")
    expect(getByTestId("searchQuery")).toHaveTextContent("")
    expect(getByTestId("viewMode")).toHaveTextContent("thumbnails")
    expect(getByTestId("isBackendConnected")).toHaveTextContent("true")
  })

  it("должен выбрасывать ошибку при использовании вне провайдера", () => {
    const TestComponent = () => {
      useBrowserState()
      return null
    }

    // Подавляем вывод ошибки в консоль для этого теста
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => render(<TestComponent />)).toThrow("useBrowserState must be used within BrowserStateProvider")

    consoleSpy.mockRestore()
  })

  it("должен загружать настройки из localStorage при инициализации", () => {
    const mockSettings = {
      activeTab: "music",
      tabSettings: {
        media: { searchQuery: "test", viewMode: "list" },
      },
    }

    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSettings))

    const TestComponent = () => {
      const context = useBrowserState()
      return <div data-testid="activeTab">{context.activeTab}</div>
    }

    const { getByTestId } = render(
      <BrowserStateProvider>
        <TestComponent />
      </BrowserStateProvider>,
    )

    expect(getByTestId("activeTab")).toHaveTextContent("music")
    expect(localStorageMock.getItem).toHaveBeenCalledWith("browserSettings")
  })

  it("должен сохранять настройки в localStorage с дебаунсом", async () => {
    const { result } = renderHook(() => useBrowserState(), {
      wrapper: ({ children }) => <BrowserStateProvider>{children}</BrowserStateProvider>,
    })

    // Изменяем настройки
    act(() => {
      result.current.setSearchQuery("test query")
    })

    // Ждем дебаунс (500мс)
    await waitFor(
      () => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith("browserSettings", expect.stringContaining("test query"))
      },
      { timeout: 1000 },
    )
  })

  it("должен синхронизировать состояние с backend", async () => {
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => useBrowserStateSync(), {
      wrapper: ({ children }) => <BrowserStateProvider>{children}</BrowserStateProvider>,
    })

    // Вызываем синхронизацию
    await act(async () => {
      await result.current.sync()
    })

    // Проверяем вызов backend
    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "UI",
      params: {
        type: "SyncBrowserState",
        params: expect.objectContaining({
          activeTab: "media",
          selectedFiles: expect.any(Object),
          tabSettings: expect.any(Object),
        }),
      },
    })
  })

  it("должен переключать вкладки и логировать в аналитику", async () => {
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => useBrowserState(), {
      wrapper: ({ children }) => <BrowserStateProvider>{children}</BrowserStateProvider>,
    })

    // Переключаем вкладку
    act(() => {
      result.current.switchTab("effects" as BrowserTab)
    })

    // Проверяем логирование
    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "Analytics",
      params: {
        type: "LogBrowserAction",
        params: { action: "switch_tab", tab: "effects" },
      },
    })

    expect(result.current.activeTab).toBe("effects")
  })

  it("должен управлять выбором файлов", () => {
    const { result } = renderHook(() => useBrowserState(), {
      wrapper: ({ children }) => <BrowserStateProvider>{children}</BrowserStateProvider>,
    })

    // Выбираем файлы
    act(() => {
      result.current.selectFile("file1")
      result.current.selectFile("file2")
    })

    expect(result.current.selectedFiles.has("file1")).toBe(true)
    expect(result.current.selectedFiles.has("file2")).toBe(true)

    // Отменяем выбор
    act(() => {
      result.current.deselectFile("file1")
    })

    expect(result.current.selectedFiles.has("file1")).toBe(false)
    expect(result.current.selectedFiles.has("file2")).toBe(true)
  })

  it("должен логировать массовый выбор файлов", async () => {
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => useBrowserState(), {
      wrapper: ({ children }) => <BrowserStateProvider>{children}</BrowserStateProvider>,
    })

    // Выбираем много файлов
    const fileIds = Array.from({ length: 15 }, (_, i) => `file${i}`)

    act(() => {
      result.current.selectAllFiles(fileIds)
    })

    // Проверяем логирование (только для больших выборок)
    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "Analytics",
      params: {
        type: "LogBrowserAction",
        params: { action: "select_all_files", count: 15, tab: "media" },
      },
    })
  })

  it("должен восстанавливать состояние из backend", async () => {
    const mockBackendSync = getBackendSync()
    let stateCallback: any

    // Сохраняем callback для вызова позже
    mockBackendSync.onStateChange.mockImplementation((callback) => {
      stateCallback = callback
      return vi.fn() // unsubscribe
    })

    const { result } = renderHook(() => useBrowserState(), {
      wrapper: ({ children }) => <BrowserStateProvider>{children}</BrowserStateProvider>,
    })

    // Симулируем получение состояния от backend
    await act(async () => {
      if (stateCallback) {
        stateCallback({
          ui_state: {
            browser_state: {
              activeTab: "templates",
              selectedFiles: {
                templates: ["template1", "template2"],
              },
              tabSettings: {
                templates: {
                  searchQuery: "intro",
                  viewMode: "list",
                },
              },
            },
          },
        })
      }
    })

    expect(result.current.activeTab).toBe("templates")
    expect(result.current.currentTabSettings.searchQuery).toBe("intro")
  })

  it("должен изменять режим просмотра и логировать в аналитику", async () => {
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => useBrowserState(), {
      wrapper: ({ children }) => <BrowserStateProvider>{children}</BrowserStateProvider>,
    })

    // Меняем режим просмотра
    act(() => {
      result.current.setViewMode("list")
    })

    // Проверяем логирование
    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "Analytics",
      params: {
        type: "LogBrowserAction",
        params: { action: "change_view_mode", viewMode: "list", tab: "media" },
      },
    })

    expect(result.current.currentTabSettings.viewMode).toBe("list")
  })
})

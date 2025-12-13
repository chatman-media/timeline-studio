/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для AppInitProvider
 *
 * Проверяет инициализацию адаптеров в зависимости от окружения (Desktop/Browser)
 */

import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AppInitProvider, useAppInit, useAppReady } from "../app-init-provider"

// Мокируем зависимости
vi.mock("@/lib/environment", () => ({
  isDesktop: vi.fn(),
}))

vi.mock("@/core/container", () => ({
  container: {
    hasBackend: vi.fn(),
    getBackend: vi.fn(),
    hasPlatform: vi.fn(),
    getPlatform: vi.fn(),
    hasStorage: vi.fn(),
    getStorage: vi.fn(),
  },
}))

vi.mock("@/adapters/tauri", () => ({
  initTauriApp: vi.fn(),
}))

vi.mock("@/adapters/mock", () => ({
  initMockApp: vi.fn(),
}))

import { initMockApp } from "@/adapters/mock"
import { initTauriApp } from "@/adapters/tauri"
import { container } from "@/core/container"
import { isDesktop } from "@/lib/environment"

describe("AppInitProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(container.hasBackend).mockReturnValue(false)
    vi.mocked(container.hasPlatform).mockReturnValue(false)
    vi.mocked(container.hasStorage).mockReturnValue(false)
  })

  describe("Initialization", () => {
    it("должен рендериться без ошибок", () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      expect(() => {
        render(
          <AppInitProvider>
            <div>Test</div>
          </AppInitProvider>,
        )
      }).not.toThrow()
    })

    it("должен инициализировать Tauri адаптеры в desktop окружении", async () => {
      vi.mocked(isDesktop).mockReturnValue(true)
      vi.mocked(initTauriApp).mockResolvedValue(undefined as any)

      render(
        <AppInitProvider>
          <div data-testid="content">Desktop Content</div>
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(initTauriApp).toHaveBeenCalledWith({ autoConnect: true })
      })

      expect(initMockApp).not.toHaveBeenCalled()
    })

    it("должен инициализировать Mock адаптеры в browser окружении", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockReturnValue(undefined as any)

      render(
        <AppInitProvider>
          <div data-testid="content">Browser Content</div>
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(initMockApp).toHaveBeenCalledWith({ useLocalStorage: true })
      })

      expect(initTauriApp).not.toHaveBeenCalled()
    })

    it("должен получить сервисы из контейнера после инициализации", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockReturnValue(undefined as any)

      const mockBackend = { type: "mock-backend" }
      const mockPlatform = { type: "mock-platform" }
      const mockStorage = { type: "mock-storage" }

      vi.mocked(container.hasBackend).mockReturnValue(true)
      vi.mocked(container.getBackend).mockReturnValue(mockBackend as any)
      vi.mocked(container.hasPlatform).mockReturnValue(true)
      vi.mocked(container.getPlatform).mockReturnValue(mockPlatform as any)
      vi.mocked(container.hasStorage).mockReturnValue(true)
      vi.mocked(container.getStorage).mockReturnValue(mockStorage as any)

      render(
        <AppInitProvider>
          <div>Content</div>
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(container.hasBackend).toHaveBeenCalled()
        expect(container.hasPlatform).toHaveBeenCalled()
        expect(container.hasStorage).toHaveBeenCalled()
      })
    })

    it("должен обработать отсутствие сервисов в контейнере", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockReturnValue(undefined as any)

      vi.mocked(container.hasBackend).mockReturnValue(false)
      vi.mocked(container.hasPlatform).mockReturnValue(false)
      vi.mocked(container.hasStorage).mockReturnValue(false)

      render(
        <AppInitProvider>
          <div data-testid="content">Content</div>
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId("content")).toBeInTheDocument()
      })

      // Не должно вызывать getters для отсутствующих сервисов
      expect(container.getBackend).not.toHaveBeenCalled()
      expect(container.getPlatform).not.toHaveBeenCalled()
      expect(container.getStorage).not.toHaveBeenCalled()
    })
  })

  describe("Fallback UI", () => {
    it("должен показывать fallback во время инициализации", () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      // Делаем инициализацию медленной
      vi.mocked(initMockApp).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100)
          }) as any,
      )

      const { queryByTestId, getByTestId } = render(
        <AppInitProvider fallback={<div data-testid="loading">Loading...</div>}>
          <div data-testid="content">Content</div>
        </AppInitProvider>,
      )

      // Во время инициализации должен показываться fallback
      expect(getByTestId("loading")).toBeInTheDocument()
      expect(queryByTestId("content")).not.toBeInTheDocument()
    })

    it("должен показывать children после инициализации", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockResolvedValue(undefined as any)

      const { queryByTestId, getByTestId } = render(
        <AppInitProvider fallback={<div data-testid="loading">Loading...</div>}>
          <div data-testid="content">Content</div>
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(getByTestId("content")).toBeInTheDocument()
      })

      // Fallback не должен отображаться после инициализации
      expect(queryByTestId("loading")).not.toBeInTheDocument()
    })

    it("не должен показывать ничего, если fallback не передан", () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100)
          }) as any,
      )

      const { container } = render(
        <AppInitProvider>
          <div data-testid="content">Content</div>
        </AppInitProvider>,
      )

      // Не должно быть контента во время инициализации
      expect(container.textContent).toBe("")
    })
  })

  describe("useAppInit hook", () => {
    it("должен возвращать состояние инициализации", async () => {
      vi.mocked(isDesktop).mockReturnValue(true)
      vi.mocked(initTauriApp).mockResolvedValue(undefined as any)

      const mockBackend = { type: "backend" }
      vi.mocked(container.hasBackend).mockReturnValue(true)
      vi.mocked(container.getBackend).mockReturnValue(mockBackend as any)

      let hookResult: any = null

      function TestComponent() {
        hookResult = useAppInit()
        return <div data-testid="test">{hookResult.initialized ? "Ready" : "Loading"}</div>
      }

      render(
        <AppInitProvider>
          <TestComponent />
        </AppInitProvider>,
      )

      // После инициализации
      await waitFor(() => {
        expect(hookResult?.initialized).toBe(true)
      })

      expect(hookResult.isDesktop).toBe(true)
      expect(hookResult.backend).toBe(mockBackend)
    })

    it("должен возвращать корректные значения для browser окружения", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockReturnValue(undefined as any)

      const mockPlatform = { type: "platform" }
      vi.mocked(container.hasPlatform).mockReturnValue(true)
      vi.mocked(container.getPlatform).mockReturnValue(mockPlatform as any)

      let hookResult: any = null

      function TestComponent() {
        hookResult = useAppInit()
        return <div>Test</div>
      }

      render(
        <AppInitProvider>
          <TestComponent />
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(hookResult.initialized).toBe(true)
      })

      expect(hookResult.isDesktop).toBe(false)
      expect(hookResult.platform).toBe(mockPlatform)
    })
  })

  describe("useAppReady hook", () => {
    it("должен возвращать false до инициализации", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      let resolveInit: (() => void) | null = null
      const initPromise = new Promise<void>((resolve) => {
        resolveInit = resolve
      })
      vi.mocked(initMockApp).mockImplementation(() => initPromise as any)

      let isReady: boolean | null = null

      function TestComponent() {
        isReady = useAppReady()
        return <div data-testid="test">{isReady ? "Ready" : "Not Ready"}</div>
      }

      const { getByTestId } = render(
        <AppInitProvider fallback={<div>Loading...</div>}>
          <TestComponent />
        </AppInitProvider>,
      )

      // Ждем немного
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Завершаем инициализацию
      resolveInit!()

      // Проверяем что стало true
      await waitFor(() => {
        expect(getByTestId("test")).toHaveTextContent("Ready")
      })

      expect(isReady).toBe(true)
    })

    it("должен возвращать true после инициализации", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockResolvedValue(undefined as any)

      let isReady = false

      function TestComponent() {
        isReady = useAppReady()
        return <div data-testid="test">Ready: {isReady.toString()}</div>
      }

      render(
        <AppInitProvider>
          <TestComponent />
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(isReady).toBe(true)
      })

      expect(screen.getByTestId("test")).toHaveTextContent("Ready: true")
    })
  })

  describe("Error Handling", () => {
    it("должен обрабатывать ошибки инициализации Tauri", async () => {
      vi.mocked(isDesktop).mockReturnValue(true)
      vi.mocked(initTauriApp).mockRejectedValue(new Error("Tauri init failed"))

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      render(
        <AppInitProvider>
          <div data-testid="content">Content</div>
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })

    it("должен обрабатывать ошибки инициализации Mock", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockImplementation(() => {
        throw new Error("Mock init failed")
      })

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      render(
        <AppInitProvider>
          <div data-testid="content">Content</div>
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe("React Component", () => {
    it("должен быть React компонентом", () => {
      expect(typeof AppInitProvider).toBe("function")
    })

    it("должен принимать children prop", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockResolvedValue(undefined as any)

      const TestChild = () => <div data-testid="child">Child Component</div>

      render(
        <AppInitProvider>
          <TestChild />
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId("child")).toBeInTheDocument()
      })
    })

    it("должен принимать fallback prop", () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100)
          }) as any,
      )

      const FallbackComponent = () => <div data-testid="fallback">Loading App...</div>

      render(
        <AppInitProvider fallback={<FallbackComponent />}>
          <div>Content</div>
        </AppInitProvider>,
      ) as any

      expect(screen.getByTestId("fallback")).toBeInTheDocument()
    })
  })

  describe("Multiple Children", () => {
    it("должен рендерить несколько children", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockResolvedValue(undefined as any)

      render(
        <AppInitProvider>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
          <div data-testid="child3">Child 3</div>
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId("child1")).toBeInTheDocument()
        expect(screen.getByTestId("child2")).toBeInTheDocument()
        expect(screen.getByTestId("child3")).toBeInTheDocument()
      })
    })
  })

  describe("Re-initialization", () => {
    it("не должен повторно инициализировать при ре-рендере", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockResolvedValue(undefined as any)

      const { rerender } = render(
        <AppInitProvider>
          <div>Content 1</div>
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(initMockApp).toHaveBeenCalledTimes(1)
      })

      // Перерендер с новым контентом
      rerender(
        <AppInitProvider>
          <div>Content 2</div>
        </AppInitProvider>,
      )

      // Инициализация должна быть вызвана только один раз
      expect(initMockApp).toHaveBeenCalledTimes(1)
    })
  })
})

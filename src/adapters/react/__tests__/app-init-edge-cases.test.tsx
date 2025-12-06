/**
 * Edge Cases тесты для AppInitProvider
 *
 * Проверяет граничные случаи и нестандартные сценарии
 */

import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AppInitProvider, useAppInit, useAppReady } from "../app-init-provider"

// Мокируем зависимости
vi.mock("@/lib/environment", () => ({
  isDesktop: vi.fn(),
}))

vi.mock("@/core/container")
vi.mock("@/adapters/tauri")
vi.mock("@/adapters/mock")

import { initMockApp } from "@/adapters/mock"
import { initTauriApp } from "@/adapters/tauri"
import { container } from "@/core/container"
import { isDesktop } from "@/lib/environment"

describe("AppInitProvider Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(container.hasBackend).mockReturnValue(false)
    vi.mocked(container.hasPlatform).mockReturnValue(false)
    vi.mocked(container.hasStorage).mockReturnValue(false)
  })

  describe("Hook Usage Outside Provider", () => {
    it("useAppInit должен возвращать дефолтные значения вне провайдера", () => {
      let hookResult: any = null

      function TestComponent() {
        hookResult = useAppInit()
        return <div>Test</div>
      }

      render(<TestComponent />)

      expect(hookResult).toEqual({
        initialized: false,
        isDesktop: false,
        backend: null,
        platform: null,
        storage: null,
      })
    })

    it("useAppReady должен возвращать false вне провайдера", () => {
      let isReady = true

      function TestComponent() {
        isReady = useAppReady()
        return <div>Test</div>
      }

      render(<TestComponent />)

      expect(isReady).toBe(false)
    })
  })

  describe("Empty Children", () => {
    it("должен обрабатывать отсутствие children", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockResolvedValue(undefined as any)

      const { container } = render(<AppInitProvider>{null}</AppInitProvider>)

      await waitFor(() => {
        expect(vi.mocked(initMockApp)).toHaveBeenCalled()
      })

      expect(container.textContent).toBe("")
    })

    it("должен обрабатывать undefined children", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockResolvedValue(undefined as any)

      const { container } = render(<AppInitProvider>{undefined}</AppInitProvider>)

      await waitFor(() => {
        expect(vi.mocked(initMockApp)).toHaveBeenCalled()
      })

      expect(container.textContent).toBe("")
    })

    it("должен обрабатывать массив children", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockResolvedValue(undefined as any)

      render(
        <AppInitProvider>
          {[
            <div key="1" data-testid="child1">
              Child 1
            </div>,
            <div key="2" data-testid="child2">
              Child 2
            </div>,
          ]}
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId("child1")).toBeInTheDocument()
        expect(screen.getByTestId("child2")).toBeInTheDocument()
      })
    })
  })

  describe("Initialization Race Conditions", () => {
    it("должен обрабатывать быструю инициализацию", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      // Инициализация завершается мгновенно
      vi.mocked(initMockApp).mockResolvedValue(undefined as any)

      render(
        <AppInitProvider fallback={<div data-testid="loading">Loading</div>}>
          <div data-testid="content">Content</div>
        </AppInitProvider>,
      )

      // Контент должен появиться очень быстро
      await waitFor(() => {
        expect(screen.getByTestId("content")).toBeInTheDocument()
      })
    })

    it("должен обрабатывать медленную инициализацию", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      let resolveInit: (() => void) | null = null
      const initPromise = new Promise<void>((resolve) => {
        resolveInit = resolve
      })

      vi.mocked(initMockApp).mockImplementation(() => initPromise as any)

      const { queryByTestId } = render(
        <AppInitProvider fallback={<div data-testid="loading">Loading</div>}>
          <div data-testid="content">Content</div>
        </AppInitProvider>,
      )

      // Должен показывать loading
      expect(queryByTestId("loading")).toBeInTheDocument()
      expect(queryByTestId("content")).not.toBeInTheDocument()

      // Завершаем инициализацию
      resolveInit!()

      // Должен показать контент
      await waitFor(() => {
        expect(queryByTestId("content")).toBeInTheDocument()
      })

      expect(queryByTestId("loading")).not.toBeInTheDocument()
    })

    it("должен обрабатывать одновременное завершение инициализации и unmount", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      let resolveInit: (() => void) | null = null
      const initPromise = new Promise<void>((resolve) => {
        resolveInit = resolve
      })

      vi.mocked(initMockApp).mockImplementation(() => initPromise as any)

      const { unmount } = render(
        <AppInitProvider>
          <div data-testid="content">Content</div>
        </AppInitProvider>,
      )

      // Размонтируем до завершения инициализации
      unmount()

      // Завершаем инициализацию после unmount
      resolveInit!()

      // Не должно быть ошибок
      await new Promise((resolve) => setTimeout(resolve, 100))
    })
  })

  describe("Container Edge Cases", () => {
    it("должен обрабатывать контейнер с частично зарегистрированными сервисами", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockResolvedValue(undefined as any)

      // Только platform зарегистрирован
      vi.mocked(container.hasPlatform).mockReturnValue(true)
      vi.mocked(container.getPlatform).mockReturnValue({ type: "platform" } as any)
      vi.mocked(container.hasBackend).mockReturnValue(false)
      vi.mocked(container.hasStorage).mockReturnValue(false)

      let state: any = null

      function TestComponent() {
        state = useAppInit()
        return <div data-testid="test">Test</div>
      }

      render(
        <AppInitProvider>
          <TestComponent />
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId("test")).toBeInTheDocument()
      })

      expect(state.platform).not.toBeNull()
      expect(state.backend).toBeNull()
      expect(state.storage).toBeNull()
    })

    it("должен обрабатывать исключения при получении сервисов из контейнера", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockResolvedValue(undefined as any)

      vi.mocked(container.hasPlatform).mockReturnValue(true)
      vi.mocked(container.getPlatform).mockImplementation(() => {
        throw new Error("Container error")
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

  describe("Environment Detection Edge Cases", () => {
    it("должен обрабатывать исключение в isDesktop()", async () => {
      vi.mocked(isDesktop).mockImplementation(() => {
        throw new Error("Environment detection failed")
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

    it("должен обрабатывать переключение isDesktop во время инициализации", async () => {
      // Сначала возвращаем true
      vi.mocked(isDesktop).mockReturnValue(true)
      vi.mocked(initTauriApp).mockImplementation(
        () =>
          new Promise((resolve) => {
            // Во время инициализации меняем значение
            vi.mocked(isDesktop).mockReturnValue(false)
            setTimeout(resolve, 50)
          }),
      )

      let state: any = null

      function TestComponent() {
        state = useAppInit()
        return <div data-testid="test">Test</div>
      }

      render(
        <AppInitProvider>
          <TestComponent />
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId("test")).toBeInTheDocument()
      })

      // Должно использовать значение из момента начала инициализации
      expect(state.isDesktop).toBe(true)
      expect(initTauriApp).toHaveBeenCalled()
    })
  })

  describe("Dynamic Import Edge Cases", () => {
    it("должен обрабатывать ошибки динамического импорта Tauri", async () => {
      vi.mocked(isDesktop).mockReturnValue(true)

      // Мокируем ошибку при вызове initTauriApp
      vi.mocked(initTauriApp).mockRejectedValue(new Error("Failed to load Tauri adapter") as any)

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

    it("должен обрабатывать ошибки динамического импорта Mock", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      // Мокируем ошибку при вызове initMockApp
      vi.mocked(initMockApp).mockImplementation(() => {
        throw new Error("Failed to load Mock adapter")
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

  describe("Fallback Edge Cases", () => {
    it("должен обрабатывать fallback с исключением", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100)
          }) as any,
      )

      function FallbackWithError(): React.ReactElement {
        throw new Error("Fallback error")
      }

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      expect(() => {
        render(
          <AppInitProvider fallback={<FallbackWithError />}>
            <div>Content</div>
          </AppInitProvider>,
        )
      }).toThrow()

      consoleErrorSpy.mockRestore()
    })

    it("должен обрабатывать сложный fallback с провайдерами", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)
      vi.mocked(initMockApp).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100)
          }) as any,
      )

      function ComplexFallback() {
        return (
          <div data-testid="complex-fallback">
            <div>Loading...</div>
            <div>Please wait</div>
          </div>
        )
      }

      render(
        <AppInitProvider fallback={<ComplexFallback />}>
          <div data-testid="content">Content</div>
        </AppInitProvider>,
      )

      expect(screen.getByTestId("complex-fallback")).toBeInTheDocument()
      expect(screen.getByText("Loading...")).toBeInTheDocument()
      expect(screen.getByText("Please wait")).toBeInTheDocument()
    })
  })

  describe("Memory Leaks", () => {
    it("не должен вызывать setState после unmount", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      let resolveInit: (() => void) | null = null
      const initPromise = new Promise<void>((resolve) => {
        resolveInit = resolve
      })

      vi.mocked(initMockApp).mockImplementation(() => initPromise as any)

      const { unmount } = render(
        <AppInitProvider>
          <div>Content</div>
        </AppInitProvider>,
      )

      // Размонтируем до завершения инициализации
      unmount()

      // Завершаем инициализацию
      resolveInit!()

      // Ждем немного, чтобы убедиться, что нет ошибок
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Не должно быть предупреждений о setState после unmount
    })
  })
})

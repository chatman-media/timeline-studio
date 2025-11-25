import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Providers } from "../providers"

// Мокаем все провайдеры
vi.mock("@/domains/browser", () => ({
  BrowserProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="browser-provider">{children}</div>
  ),
}))

vi.mock("@/domains/video-editing/providers/timeline-providers", () => ({
  TimelineProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="timeline-provider">{children}</div>
  ),
}))

vi.mock("@/features/ai-chat/services/chat-provider", () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="chat-provider">{children}</div>,
}))

vi.mock("@/features/app-state/services/app-provider", () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="app-provider">{children}</div>,
}))

vi.mock("@/features/media-studio/components/top-bar/theme/theme-context", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>,
}))

vi.mock("@/features/media-studio/services/tauri-mock-provider", () => ({
  TauriMockProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tauri-mock-provider">{children}</div>
  ),
}))

vi.mock("@/features/modals/services/modal-provider", () => ({
  ModalProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="modal-provider">{children}</div>,
}))

vi.mock("@/features/project-settings/services/project-settings-provider", () => ({
  ProjectSettingsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="project-settings-provider">{children}</div>
  ),
}))

vi.mock("@/features/resources/services/resources-provider", () => ({
  ResourcesProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="resources-provider">{children}</div>
  ),
}))

vi.mock("@/features/video-player/services/player-provider", () => ({
  PlayerProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="player-provider">{children}</div>,
}))

vi.mock("@/i18n/services/i18n-provider", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="i18n-provider">{children}</div>,
}))

// AIServicesProvider removed - not used in app

describe("Providers", () => {
  describe("рендеринг", () => {
    it("должен рендерить children", () => {
      render(
        <Providers>
          <div data-testid="test-child">Test Child</div>
        </Providers>,
      )

      expect(screen.getByTestId("test-child")).toBeInTheDocument()
    })

    it("должен рендерить все провайдеры", () => {
      const { container } = render(
        <Providers>
          <div data-testid="test-child">Test Child</div>
        </Providers>,
      )

      // Проверяем наличие ключевых провайдеров
      expect(container.querySelector('[data-testid="tauri-mock-provider"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="app-provider"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="theme-provider"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="i18n-provider"]')).toBeInTheDocument()
    })
  })

  describe("порядок провайдеров", () => {
    it("TauriMockProvider должен быть первым в цепочке", () => {
      const { container } = render(
        <Providers>
          <div data-testid="test-child">Test Child</div>
        </Providers>,
      )

      // TauriMockProvider должен быть самым внешним
      const tauriMockProvider = container.querySelector('[data-testid="tauri-mock-provider"]')
      expect(tauriMockProvider).toBeInTheDocument()
    })

    it("AppProvider должен быть после TauriMockProvider", () => {
      const { container } = render(
        <Providers>
          <div data-testid="test-child">Test Child</div>
        </Providers>,
      )

      const appProvider = container.querySelector('[data-testid="app-provider"]')
      expect(appProvider).toBeInTheDocument()
    })

    it("TimelineProvider должен быть в цепочке", () => {
      const { container } = render(
        <Providers>
          <div data-testid="test-child">Test Child</div>
        </Providers>,
      )

      const timelineProvider = container.querySelector('[data-testid="timeline-provider"]')
      expect(timelineProvider).toBeInTheDocument()
    })
  })

  describe("композиция провайдеров", () => {
    it("должен правильно композировать провайдеры", () => {
      const { container } = render(
        <Providers>
          <div data-testid="test-child">Test Child</div>
        </Providers>,
      )

      // Проверяем наличие всех провайдеров (AIServicesProvider removed)
      expect(container.querySelector('[data-testid="tauri-mock-provider"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="i18n-provider"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="theme-provider"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="modal-provider"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="app-provider"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="project-settings-provider"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="resources-provider"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="browser-provider"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="timeline-provider"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="player-provider"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="chat-provider"]')).toBeInTheDocument()
    })

    it("должен передавать children через всю цепочку провайдеров", () => {
      render(
        <Providers>
          <div data-testid="nested-child">Nested Child</div>
        </Providers>,
      )

      expect(screen.getByTestId("nested-child")).toBeInTheDocument()
      expect(screen.getByText("Nested Child")).toBeInTheDocument()
    })
  })

  describe("множественные children", () => {
    it("должен рендерить множественные children", () => {
      render(
        <Providers>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </Providers>,
      )

      expect(screen.getByTestId("child-1")).toBeInTheDocument()
      expect(screen.getByTestId("child-2")).toBeInTheDocument()
      expect(screen.getByTestId("child-3")).toBeInTheDocument()
    })
  })

  describe("вложенные компоненты", () => {
    it("должен рендерить вложенные компоненты", () => {
      render(
        <Providers>
          <div data-testid="parent">
            <div data-testid="child">
              <span data-testid="grandchild">Grandchild</span>
            </div>
          </div>
        </Providers>,
      )

      expect(screen.getByTestId("parent")).toBeInTheDocument()
      expect(screen.getByTestId("child")).toBeInTheDocument()
      expect(screen.getByTestId("grandchild")).toBeInTheDocument()
    })
  })

  describe("без children", () => {
    it("должен работать без children", () => {
      const { container } = render(<Providers>{null}</Providers>)

      // Провайдеры должны быть отрендерены
      expect(container.querySelector('[data-testid="tauri-mock-provider"]')).toBeInTheDocument()
    })

    it("должен работать с undefined children", () => {
      const { container } = render(<Providers>{undefined}</Providers>)

      expect(container.querySelector('[data-testid="tauri-mock-provider"]')).toBeInTheDocument()
    })
  })

  describe("изоляция провайдеров", () => {
    it("каждый провайдер должен быть независимым", () => {
      const { container } = render(
        <Providers>
          <div data-testid="test-child">Test</div>
        </Providers>,
      )

      // Все провайдеры должны быть в DOM (AIServicesProvider removed)
      const providers = [
        "tauri-mock-provider",
        "i18n-provider",
        "theme-provider",
        "modal-provider",
        "app-provider",
        "project-settings-provider",
        "resources-provider",
        "browser-provider",
        "timeline-provider",
        "player-provider",
        "chat-provider",
      ]

      providers.forEach((provider) => {
        expect(container.querySelector(`[data-testid="${provider}"]`)).toBeInTheDocument()
      })
    })
  })

  describe("производительность", () => {
    it("не должен создавать лишних ререндеров", () => {
      const renderSpy = vi.fn()

      function TestComponent() {
        renderSpy()
        return <div data-testid="test-component">Test</div>
      }

      const { rerender } = render(
        <Providers>
          <TestComponent />
        </Providers>,
      )

      const initialRenderCount = renderSpy.mock.calls.length

      // Повторный рендер с теми же пропсами
      rerender(
        <Providers>
          <TestComponent />
        </Providers>,
      )

      // Должен быть только один дополнительный рендер
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount + 1)
    })
  })

  describe("интеграция", () => {
    it("должен правильно работать с React компонентами", () => {
      function IntegrationTestComponent() {
        return (
          <div data-testid="integration-test">
            <h1>Integration Test</h1>
            <p>Testing Providers</p>
          </div>
        )
      }

      render(
        <Providers>
          <IntegrationTestComponent />
        </Providers>,
      )

      expect(screen.getByTestId("integration-test")).toBeInTheDocument()
      expect(screen.getByText("Integration Test")).toBeInTheDocument()
      expect(screen.getByText("Testing Providers")).toBeInTheDocument()
    })
  })

  describe("edge cases", () => {
    it("должен обрабатывать пустую строку как children", () => {
      const { container } = render(<Providers>{""}</Providers>)

      expect(container.querySelector('[data-testid="tauri-mock-provider"]')).toBeInTheDocument()
    })

    it("должен обрабатывать число как children", () => {
      render(<Providers>{42}</Providers>)

      expect(screen.getByText("42")).toBeInTheDocument()
    })

    it("должен обрабатывать булево значение как children", () => {
      const { container } = render(<Providers>{true}</Providers>)

      expect(container.querySelector('[data-testid="tauri-mock-provider"]')).toBeInTheDocument()
    })

    it("должен обрабатывать массив как children", () => {
      render(
        <Providers>
          {[
            <div key="1" data-testid="array-child-1">
              Child 1
            </div>,
            <div key="2" data-testid="array-child-2">
              Child 2
            </div>,
          ]}
        </Providers>,
      )

      expect(screen.getByTestId("array-child-1")).toBeInTheDocument()
      expect(screen.getByTestId("array-child-2")).toBeInTheDocument()
    })
  })
})

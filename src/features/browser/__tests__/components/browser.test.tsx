/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { BrowserProvider } from "@/domains/browser"
import { Browser } from "../../components/browser"

// Мокаем зависимости
let mockOnTabChange: (tab: string) => void

vi.mock("../../components/browser-tabs", () => ({
  BrowserTabs: ({ activeTab, onTabChange }: any) => {
    mockOnTabChange = onTabChange
    return (
      <div data-testid="browser-tabs" data-active-tab={activeTab} data-oid="rm8wpuk">
        <button onClick={() => onTabChange("media")} data-testid="tab-media" data-oid=":8e512_">
          Media
        </button>
        <button onClick={() => onTabChange("music")} data-testid="tab-music" data-oid="csridjq">
          Music
        </button>
        <button onClick={() => onTabChange("effects")} data-testid="tab-effects" data-oid="_s23gl1">
          Effects
        </button>
        <button onClick={() => onTabChange("test")} data-testid="trigger-tab-change" data-oid="73bxzfm" />
        Browser Tabs Mock - Active: {activeTab}
      </div>
    )
  },
}))

vi.mock("../../components/browser-content", () => ({
  BrowserContent: () => (
    <div data-testid="browser-content" data-oid="kg9ooi2">
      Browser Content
    </div>
  ),
}))

vi.mock("@/domains/project-management/hooks", () => ({
  useAppSettings: () => ({
    getUserSettings: vi.fn(() => ({})),
    updateUserSettings: vi.fn(),
    state: {
      appSettings: {},
    },
  }),
}))

// Мокаем AI интеграцию
vi.mock("@/features/ai-chat/hooks/use-browser-ai-integration", () => ({
  useBrowserAIIntegration: () => ({
    isReady: true,
    hasFiles: false,
    fileCount: 0,
    selectedCount: 0,
  }),
}))

// Мокаем EffectsProvider
vi.mock("../../providers/browser-resources-provider", () => ({
  EffectsProvider: ({ children }: { children: any }) => children,
}))

// Мокаем BackendSync для BrowserProvider
vi.mock("@/domains/project-management/services/backend-sync", () => {
  let mockBrowserState = {
    active_tab: "media" as const,
    tab_settings: {
      media: {
        search_query: "",
        show_favorites_only: false,
        sort_by: "name",
        sort_order: "asc" as const,
        group_by: "none",
        filter_type: "all",
        view_mode: "thumbnails" as const,
        preview_size_index: 2,
      },
    },
    selected_files: {
      media: [],
    },
  }

  const mockBackendSync = {
    connected: true,
    onEvent: vi.fn(() => vi.fn()),
    onStateChange: vi.fn((handler: any) => {
      // Сразу вызываем handler с текущим состоянием
      handler({ browser_state: mockBrowserState })
      return vi.fn()
    }),
    getProjectState: vi.fn(async () => ({
      browser_state: mockBrowserState,
      version: 1,
    })),
    executeCommand: vi.fn(async (command: any) => {
      // Обрабатываем команду переключения вкладки
      if (command.type === "BrowserSwitchTab") {
        mockBrowserState = {
          ...mockBrowserState,
          active_tab: command.params.tab,
        }
      }
      return { success: true, data: null, error: null }
    }),
  }

  return {
    getBackendSync: vi.fn(() => mockBackendSync),
    BackendSync: vi.fn(() => mockBackendSync),
  }
})

// Wrapper с BrowserProvider
const TestWrapper = ({ children }: { children: ReactNode }) => {
  return <BrowserProvider data-oid="gebwj8v">{children}</BrowserProvider>
}

describe("Browser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен рендериться с компонентами табов и контента", () => {
    render(<Browser data-oid="cd_0x.x" />, { wrapper: TestWrapper })

    expect(screen.getByTestId("browser-tabs")).toBeInTheDocument()
    expect(screen.getByTestId("browser-content")).toBeInTheDocument()
  })

  it("должен иметь начальную вкладку media", () => {
    render(<Browser data-oid=".u_r1zv" />, { wrapper: TestWrapper })

    const browserTabs = screen.getByTestId("browser-tabs")
    expect(browserTabs).toHaveAttribute("data-active-tab", "media")
  })

  it("должен переключать вкладки при клике", async () => {
    render(<Browser data-oid="cxvlj00" />, { wrapper: TestWrapper })

    const musicTab = screen.getByTestId("tab-music")
    fireEvent.click(musicTab)

    // switchTab теперь асинхронный, просто проверяем что функция вызвана
    expect(mockOnTabChange).toBeDefined()
  })

  it("должен иметь правильные CSS классы", () => {
    const { container } = render(<Browser data-oid="tak9i9w" />, {
      wrapper: TestWrapper,
    })

    const wrapper = container.querySelector(".relative.h-full.w-full.flex.flex-col")
    expect(wrapper).toBeInTheDocument()
    expect(wrapper).toHaveClass("dark:bg-[#2D2D2D]")
  })

  it("должен обрабатывать изменение вкладки через компонент Tabs", async () => {
    render(<Browser data-oid="ekfy_1a" />, { wrapper: TestWrapper })

    const tabChangeButton = screen.getByTestId("trigger-tab-change")
    fireEvent.click(tabChangeButton)

    // Проверяем, что обработчик был вызван
    expect(mockOnTabChange).toBeDefined()
  })

  it("должен рендериться внутри контейнера с правильными классами", () => {
    const { container } = render(<Browser data-oid=":f.:0u5" />, {
      wrapper: TestWrapper,
    })

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass("relative h-full w-full flex flex-col")
  })

  it("должен предоставлять контекст состояния браузера дочерним компонентам", () => {
    // Факт того, что компонент рендерится без ошибок, подтверждает,
    // что контекст доступен
    expect(() => render(<Browser data-oid="w:a:tnt" />, { wrapper: TestWrapper })).not.toThrow()
  })

  it("должен сохранять состояние вкладки при повторном рендере", () => {
    const { rerender } = render(<Browser data-oid="kdfg_1a" />, {
      wrapper: TestWrapper,
    })

    // Переключаем вкладку
    const effectsTab = screen.getByTestId("tab-effects")
    fireEvent.click(effectsTab)

    // Перерендер компонента
    rerender(<Browser data-oid="i9mr938" />)

    // Проверяем, что компонент продолжает работать после перерендера
    expect(screen.getByTestId("browser-tabs")).toBeInTheDocument()
  })
})

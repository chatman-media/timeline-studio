/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from "@testing-library/react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useUserSettings } from "@/features/user-settings"

import { BrowserToggle } from "../../../components/layout/browser-toggle"

// Мокаем хук useUserSettings
vi.mock("@/features/user-settings")

// Мокаем компоненты Lucide
vi.mock("lucide-react", () => ({
  PanelLeftClose: vi.fn(() => (
    <div data-testid="panel-left-close" data-oid="s2afalz">
      PanelLeftClose
    </div>
  )),
  PanelLeftOpen: vi.fn(() => (
    <div data-testid="panel-left-open" data-oid="k9:h6ph">
      PanelLeftOpen
    </div>
  )),
}))

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "browser.hide": "Hide Browser",
        "browser.show": "Show Browser",
      }
      return translations[key] || key
    },
  }),
}))

describe("BrowserToggle", () => {
  // Очищаем моки перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render PanelLeftClose icon when browser is visible", () => {
    // Мокаем useUserSettings для случая, когда браузер видим
    vi.mocked(useUserSettings).mockReturnValue({
      isBrowserVisible: true,
      toggleBrowserVisibility: vi.fn(),
    } as any)

    // Рендерим компонент
    render(<BrowserToggle data-oid=".k88jnh" />)

    // Проверяем, что отображается правильная иконка
    expect(screen.getByTestId("panel-left-close")).toBeInTheDocument()
    expect(screen.queryByTestId("panel-left-open")).not.toBeInTheDocument()

    // Проверяем, что PanelLeftClose был вызван
    expect(PanelLeftClose).toHaveBeenCalled()
    expect(PanelLeftOpen).not.toHaveBeenCalled()

    // Проверяем, что кнопка имеет правильный title
    expect(screen.getByTitle("Hide Browser")).toBeInTheDocument()
  })

  it("should render PanelLeftOpen icon when browser is hidden", () => {
    // Мокаем useUserSettings для случая, когда браузер скрыт
    vi.mocked(useUserSettings).mockReturnValue({
      isBrowserVisible: false,
      toggleBrowserVisibility: vi.fn(),
    } as any)

    // Рендерим компонент
    render(<BrowserToggle data-oid="nccrub6" />)

    // Проверяем, что отображается правильная иконка
    expect(screen.getByTestId("panel-left-open")).toBeInTheDocument()
    expect(screen.queryByTestId("panel-left-close")).not.toBeInTheDocument()

    // Проверяем, что PanelLeftOpen был вызван
    expect(PanelLeftOpen).toHaveBeenCalled()
    expect(PanelLeftClose).not.toHaveBeenCalled()

    // Проверяем, что кнопка имеет правильный title
    expect(screen.getByTitle("Show Browser")).toBeInTheDocument()
  })

  it("should call toggleBrowserVisibility when button is clicked", () => {
    // Создаем мок для toggleBrowserVisibility
    const toggleBrowserVisibilityMock = vi.fn()

    // Мокаем useUserSettings
    vi.mocked(useUserSettings).mockReturnValue({
      isBrowserVisible: true,
      toggleBrowserVisibility: toggleBrowserVisibilityMock,
    } as any)

    // Рендерим компонент
    render(<BrowserToggle data-oid="836qn.u" />)

    // Кликаем на кнопку
    act(() => {
      act(() => {
        fireEvent.click(screen.getByTitle("Hide Browser"))
      })
    })

    // Проверяем, что toggleBrowserVisibility был вызван
    expect(toggleBrowserVisibilityMock).toHaveBeenCalledTimes(1)
  })
})

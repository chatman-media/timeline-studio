import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { LayoutPreviews } from "../layout-previews"

// Мокаем useUserSettings
const mockHandleLayoutChange = vi.fn()
let mockLayoutMode = "default"
vi.mock("@/features/user-settings", () => ({
  useUserSettings: () => ({
    layoutMode: mockLayoutMode,
    handleLayoutChange: mockHandleLayoutChange,
  }),
}))

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Мокаем компоненты layout
vi.mock("../../../components/layout/layouts-markup", () => ({
  DefaultLayout: ({ isActive, onClick }: { isActive: boolean; onClick: () => void }) => (
    <button data-testid="default-layout" onClick={onClick} data-active={isActive}>
      Default Layout
    </button>
  ),
  OptionsLayout: ({ isActive, onClick }: { isActive: boolean; onClick: () => void }) => (
    <button data-testid="options-layout" onClick={onClick} data-active={isActive}>
      Options Layout
    </button>
  ),
  VerticalLayout: ({ isActive, onClick }: { isActive: boolean; onClick: () => void }) => (
    <button data-testid="vertical-layout" onClick={onClick} data-active={isActive}>
      Vertical Layout
    </button>
  ),
  ChatLayout: ({ isActive, onClick }: { isActive: boolean; onClick: () => void }) => (
    <button data-testid="chat-layout" onClick={onClick} data-active={isActive}>
      Chat Layout
    </button>
  ),
}))

describe("LayoutPreviews", () => {
  beforeEach(() => {
    mockHandleLayoutChange.mockClear()
  })

  it("должен рендерить все превью layout", () => {
    render(<LayoutPreviews />)

    expect(screen.getByTestId("default-layout")).toBeInTheDocument()
    expect(screen.getByTestId("options-layout")).toBeInTheDocument()
    expect(screen.getByTestId("vertical-layout")).toBeInTheDocument()
    expect(screen.getByTestId("chat-layout")).toBeInTheDocument()
  })

  it("должен отмечать активный layout", () => {
    render(<LayoutPreviews />)

    const defaultLayout = screen.getByTestId("default-layout")
    expect(defaultLayout).toHaveAttribute("data-active", "true")

    const optionsLayout = screen.getByTestId("options-layout")
    expect(optionsLayout).toHaveAttribute("data-active", "false")

    const verticalLayout = screen.getByTestId("vertical-layout")
    expect(verticalLayout).toHaveAttribute("data-active", "false")

    const chatLayout = screen.getByTestId("chat-layout")
    expect(chatLayout).toHaveAttribute("data-active", "false")
  })

  it("должен вызывать handleLayoutChange при клике на layout", () => {
    render(<LayoutPreviews />)

    // Клик на default layout
    fireEvent.click(screen.getByTestId("default-layout"))
    expect(mockHandleLayoutChange).toHaveBeenCalledWith("default")

    // Клик на options layout
    fireEvent.click(screen.getByTestId("options-layout"))
    expect(mockHandleLayoutChange).toHaveBeenCalledWith("options")

    // Клик на vertical layout
    fireEvent.click(screen.getByTestId("vertical-layout"))
    expect(mockHandleLayoutChange).toHaveBeenCalledWith("vertical")

    // Клик на chat layout
    fireEvent.click(screen.getByTestId("chat-layout"))
    expect(mockHandleLayoutChange).toHaveBeenCalledWith("chat")
  })

  it("должен иметь правильную структуру с двумя рядами", () => {
    const { container } = render(<LayoutPreviews />)

    // Проверяем основной контейнер
    const mainContainer = container.firstChild as HTMLElement
    expect(mainContainer).toHaveClass("flex flex-col gap-2")

    // Проверяем два ряда
    const rows = mainContainer.querySelectorAll(".flex.justify-around.gap-2")
    expect(rows).toHaveLength(2)

    // Первый ряд должен содержать default и options layouts
    const firstRow = rows[0]
    expect(firstRow.querySelector('[data-testid="default-layout"]')).toBeInTheDocument()
    expect(firstRow.querySelector('[data-testid="options-layout"]')).toBeInTheDocument()

    // Второй ряд должен содержать vertical и chat layouts
    const secondRow = rows[1]
    expect(secondRow.querySelector('[data-testid="vertical-layout"]')).toBeInTheDocument()
    expect(secondRow.querySelector('[data-testid="chat-layout"]')).toBeInTheDocument()
  })

  it("должен поддерживать разные активные layouts", () => {
    // Меняем активный layout
    mockLayoutMode = "vertical"

    render(<LayoutPreviews />)

    const verticalLayout = screen.getByTestId("vertical-layout")
    expect(verticalLayout).toHaveAttribute("data-active", "true")

    // Возвращаем обратно
    mockLayoutMode = "default"
  })

  describe("интеграция с разными layout modes", () => {
    it("должен корректно работать с options layout", () => {
      mockLayoutMode = "options"

      render(<LayoutPreviews />)

      expect(screen.getByTestId("options-layout")).toHaveAttribute("data-active", "true")
      expect(screen.getByTestId("default-layout")).toHaveAttribute("data-active", "false")
    })

    it("должен корректно работать с chat layout", () => {
      mockLayoutMode = "chat"

      render(<LayoutPreviews />)

      expect(screen.getByTestId("chat-layout")).toHaveAttribute("data-active", "true")
      expect(screen.getByTestId("vertical-layout")).toHaveAttribute("data-active", "false")
    })
  })

  describe("обработка кликов", () => {
    it("должен вызывать handleLayoutChange только один раз при клике", () => {
      render(<LayoutPreviews />)

      fireEvent.click(screen.getByTestId("default-layout"))

      expect(mockHandleLayoutChange).toHaveBeenCalledTimes(1)
      expect(mockHandleLayoutChange).toHaveBeenCalledWith("default")
    })

    it("должен обрабатывать множественные клики", () => {
      render(<LayoutPreviews />)

      fireEvent.click(screen.getByTestId("default-layout"))
      fireEvent.click(screen.getByTestId("options-layout"))
      fireEvent.click(screen.getByTestId("vertical-layout"))

      expect(mockHandleLayoutChange).toHaveBeenCalledTimes(3)
    })
  })

  describe("структура компонента", () => {
    it("должен использовать правильные CSS классы для контейнера", () => {
      const { container } = render(<LayoutPreviews />)

      const mainContainer = container.firstChild as HTMLElement
      expect(mainContainer.className).toBe("flex flex-col gap-2")
    })

    it("должен использовать правильные CSS классы для рядов", () => {
      const { container } = render(<LayoutPreviews />)

      const rows = container.querySelectorAll(".flex.justify-around.gap-2")
      rows.forEach((row) => {
        expect(row).toHaveClass("flex", "justify-around", "gap-2")
      })
    })
  })
})

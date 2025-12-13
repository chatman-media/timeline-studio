/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ChatLayout, DefaultLayout, OptionsLayout, VerticalLayout } from "../layouts-markup"

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Мокаем lucide-react иконки
vi.mock("lucide-react", () => ({
  Play: () => <div data-testid="play-icon">Play</div>,
  MessageCircle: () => <div data-testid="message-circle-icon">MessageCircle</div>,
}))

describe("Layout Markup Components", () => {
  describe("DefaultLayout", () => {
    it("должен рендерить компонент с правильными классами", () => {
      const { container } = render(<DefaultLayout isActive={false} onClick={vi.fn()} />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass("flex cursor-pointer flex-col items-center")
      expect(mainDiv).toHaveClass("hover:bg-muted/40")
      expect(mainDiv).not.toHaveClass("bg-muted/40")
    })

    it("должен применять активные стили когда isActive=true", () => {
      const { container } = render(<DefaultLayout isActive={true} onClick={vi.fn()} />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass("bg-muted/40")
    })

    it("должен вызывать onClick при клике", () => {
      const mockOnClick = vi.fn()
      const { container } = render(<DefaultLayout isActive={false} onClick={mockOnClick} />)

      const mainDiv = container.firstChild as HTMLElement
      fireEvent.click(mainDiv)
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it("должен отображать правильный текст", () => {
      render(<DefaultLayout isActive={false} onClick={vi.fn()} />)
      expect(screen.getByText("topBar.layouts.default")).toBeInTheDocument()
    })

    it("должен отображать иконку Play", () => {
      render(<DefaultLayout isActive={false} onClick={vi.fn()} />)
      expect(screen.getByTestId("play-icon")).toBeInTheDocument()
    })
  })

  describe("OptionsLayout", () => {
    it("должен рендерить компонент с правильными классами", () => {
      const { container } = render(<OptionsLayout isActive={false} onClick={vi.fn()} />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass("flex cursor-pointer flex-col items-center")
    })

    it("должен применять активные стили когда isActive=true", () => {
      const { container } = render(<OptionsLayout isActive={true} onClick={vi.fn()} />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass("bg-muted/40")
    })

    it("должен вызывать onClick при клике", () => {
      const mockOnClick = vi.fn()
      const { container } = render(<OptionsLayout isActive={false} onClick={mockOnClick} />)

      const mainDiv = container.firstChild as HTMLElement
      fireEvent.click(mainDiv)
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it("должен отображать правильный текст", () => {
      render(<OptionsLayout isActive={false} onClick={vi.fn()} />)
      expect(screen.getByText("topBar.layouts.options")).toBeInTheDocument()
    })

    it("должен отображать иконку Play", () => {
      render(<OptionsLayout isActive={false} onClick={vi.fn()} />)
      expect(screen.getByTestId("play-icon")).toBeInTheDocument()
    })
  })

  describe("VerticalLayout", () => {
    it("должен рендерить компонент с правильными классами", () => {
      const { container } = render(<VerticalLayout isActive={false} onClick={vi.fn()} />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass("flex cursor-pointer flex-col items-center")
    })

    it("должен применять активные стили когда isActive=true", () => {
      const { container } = render(<VerticalLayout isActive={true} onClick={vi.fn()} />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass("bg-muted/40")
    })

    it("должен вызывать onClick при клике", () => {
      const mockOnClick = vi.fn()
      const { container } = render(<VerticalLayout isActive={false} onClick={mockOnClick} />)

      const mainDiv = container.firstChild as HTMLElement
      fireEvent.click(mainDiv)
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it("должен отображать правильный текст", () => {
      render(<VerticalLayout isActive={false} onClick={vi.fn()} />)
      expect(screen.getByText("topBar.layouts.vertical")).toBeInTheDocument()
    })

    it("должен отображать иконку Play", () => {
      render(<VerticalLayout isActive={false} onClick={vi.fn()} />)
      expect(screen.getByTestId("play-icon")).toBeInTheDocument()
    })
  })

  describe("ChatLayout", () => {
    it("должен рендерить компонент с правильными классами", () => {
      const { container } = render(<ChatLayout isActive={false} onClick={vi.fn()} />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass("flex cursor-pointer flex-col items-center")
    })

    it("должен применять активные стили когда isActive=true", () => {
      const { container } = render(<ChatLayout isActive={true} onClick={vi.fn()} />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass("bg-muted/40")
    })

    it("должен вызывать onClick при клике", () => {
      const mockOnClick = vi.fn()
      const { container } = render(<ChatLayout isActive={false} onClick={mockOnClick} />)

      const mainDiv = container.firstChild as HTMLElement
      fireEvent.click(mainDiv)
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it("должен отображать правильный текст", () => {
      render(<ChatLayout isActive={false} onClick={vi.fn()} />)
      expect(screen.getByText("topBar.layouts.chat")).toBeInTheDocument()
    })

    it("должен отображать иконки Play и MessageCircle", () => {
      render(<ChatLayout isActive={false} onClick={vi.fn()} />)
      expect(screen.getByTestId("play-icon")).toBeInTheDocument()
      expect(screen.getByTestId("message-circle-icon")).toBeInTheDocument()
    })
  })

  describe("Общие тесты для всех layout компонентов", () => {
    const components = [
      { name: "DefaultLayout", Component: DefaultLayout },
      { name: "OptionsLayout", Component: OptionsLayout },
      { name: "VerticalLayout", Component: VerticalLayout },
      { name: "ChatLayout", Component: ChatLayout },
    ]

    components.forEach(({ name, Component }) => {
      it(`${name}: должен иметь правильную структуру с border и размерами`, () => {
        const { container } = render(<Component isActive={false} onClick={vi.fn()} />)

        // Проверяем основной превью контейнер
        const previewContainer = container.querySelector(".h-24.w-40.border-2.border-gray-700")
        expect(previewContainer).toBeInTheDocument()
      })

      it(`${name}: должен переключать стили при изменении isActive`, () => {
        const { rerender, container } = render(<Component isActive={false} onClick={vi.fn()} />)

        const mainDiv = container.firstChild as HTMLElement
        expect(mainDiv).toHaveClass("hover:bg-muted/40")
        expect(mainDiv).not.toHaveClass("bg-muted/40")

        rerender(<Component isActive={true} onClick={vi.fn()} />)
        expect(mainDiv).toHaveClass("bg-muted/40")
      })
    })
  })
})

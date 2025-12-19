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
  Play: () => (
    <div data-testid="play-icon" data-oid="kyd2qbu">
      Play
    </div>
  ),

  MessageCircle: () => (
    <div data-testid="message-circle-icon" data-oid="8rumzq1">
      MessageCircle
    </div>
  ),
}))

describe("Layout Markup Components", () => {
  describe("DefaultLayout", () => {
    it("должен рендерить компонент с правильными классами", () => {
      const { container } = render(<DefaultLayout isActive={false} onClick={vi.fn()} data-oid="btqdtz1" />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass("flex cursor-pointer flex-col items-center")
      expect(mainDiv).toHaveClass("hover:bg-muted/40")
      expect(mainDiv).not.toHaveClass("bg-muted/40")
    })

    it("должен применять активные стили когда isActive=true", () => {
      const { container } = render(<DefaultLayout isActive={true} onClick={vi.fn()} data-oid="qtjvbay" />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass("bg-muted/40")
    })

    it("должен вызывать onClick при клике", () => {
      const mockOnClick = vi.fn()
      const { container } = render(<DefaultLayout isActive={false} onClick={mockOnClick} data-oid="t350ubw" />)

      const mainDiv = container.firstChild as HTMLElement
      fireEvent.click(mainDiv)
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it("должен отображать правильный текст", () => {
      render(<DefaultLayout isActive={false} onClick={vi.fn()} data-oid="e_c9-b-" />)
      expect(screen.getByText("topBar.layouts.default")).toBeInTheDocument()
    })

    it("должен отображать иконку Play", () => {
      render(<DefaultLayout isActive={false} onClick={vi.fn()} data-oid="vb:kv08" />)
      expect(screen.getByTestId("play-icon")).toBeInTheDocument()
    })
  })

  describe("OptionsLayout", () => {
    it("должен рендерить компонент с правильными классами", () => {
      const { container } = render(<OptionsLayout isActive={false} onClick={vi.fn()} data-oid="68s87rj" />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass("flex cursor-pointer flex-col items-center")
    })

    it("должен применять активные стили когда isActive=true", () => {
      const { container } = render(<OptionsLayout isActive={true} onClick={vi.fn()} data-oid=".pb1ucl" />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass("bg-muted/40")
    })

    it("должен вызывать onClick при клике", () => {
      const mockOnClick = vi.fn()
      const { container } = render(<OptionsLayout isActive={false} onClick={mockOnClick} data-oid="itbmmam" />)

      const mainDiv = container.firstChild as HTMLElement
      fireEvent.click(mainDiv)
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it("должен отображать правильный текст", () => {
      render(<OptionsLayout isActive={false} onClick={vi.fn()} data-oid="d-tlj2n" />)
      expect(screen.getByText("topBar.layouts.options")).toBeInTheDocument()
    })

    it("должен отображать иконку Play", () => {
      render(<OptionsLayout isActive={false} onClick={vi.fn()} data-oid="r2vk176" />)
      expect(screen.getByTestId("play-icon")).toBeInTheDocument()
    })
  })

  describe("VerticalLayout", () => {
    it("должен рендерить компонент с правильными классами", () => {
      const { container } = render(<VerticalLayout isActive={false} onClick={vi.fn()} data-oid="zp-857p" />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass("flex cursor-pointer flex-col items-center")
    })

    it("должен применять активные стили когда isActive=true", () => {
      const { container } = render(<VerticalLayout isActive={true} onClick={vi.fn()} data-oid="mxpez6t" />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass("bg-muted/40")
    })

    it("должен вызывать onClick при клике", () => {
      const mockOnClick = vi.fn()
      const { container } = render(<VerticalLayout isActive={false} onClick={mockOnClick} data-oid="-0w50as" />)

      const mainDiv = container.firstChild as HTMLElement
      fireEvent.click(mainDiv)
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it("должен отображать правильный текст", () => {
      render(<VerticalLayout isActive={false} onClick={vi.fn()} data-oid="u9h.u1g" />)
      expect(screen.getByText("topBar.layouts.vertical")).toBeInTheDocument()
    })

    it("должен отображать иконку Play", () => {
      render(<VerticalLayout isActive={false} onClick={vi.fn()} data-oid="ji27wrw" />)
      expect(screen.getByTestId("play-icon")).toBeInTheDocument()
    })
  })

  describe("ChatLayout", () => {
    it("должен рендерить компонент с правильными классами", () => {
      const { container } = render(<ChatLayout isActive={false} onClick={vi.fn()} data-oid=":pdp599" />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass("flex cursor-pointer flex-col items-center")
    })

    it("должен применять активные стили когда isActive=true", () => {
      const { container } = render(<ChatLayout isActive={true} onClick={vi.fn()} data-oid="t_h5c-_" />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass("bg-muted/40")
    })

    it("должен вызывать onClick при клике", () => {
      const mockOnClick = vi.fn()
      const { container } = render(<ChatLayout isActive={false} onClick={mockOnClick} data-oid="4lpb9y8" />)

      const mainDiv = container.firstChild as HTMLElement
      fireEvent.click(mainDiv)
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it("должен отображать правильный текст", () => {
      render(<ChatLayout isActive={false} onClick={vi.fn()} data-oid="902upbc" />)
      expect(screen.getByText("topBar.layouts.chat")).toBeInTheDocument()
    })

    it("должен отображать иконки Play и MessageCircle", () => {
      render(<ChatLayout isActive={false} onClick={vi.fn()} data-oid="87wq5ei" />)
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
        const { container } = render(<Component isActive={false} onClick={vi.fn()} data-oid="3wo:dqf" />)

        // Проверяем основной превью контейнер
        const previewContainer = container.querySelector(".h-24.w-40.border-2.border-gray-700")
        expect(previewContainer).toBeInTheDocument()
      })

      it(`${name}: должен переключать стили при изменении isActive`, () => {
        const { rerender, container } = render(<Component isActive={false} onClick={vi.fn()} data-oid="7r8bgnn" />)

        const mainDiv = container.firstChild as HTMLElement
        expect(mainDiv).toHaveClass("hover:bg-muted/40")
        expect(mainDiv).not.toHaveClass("bg-muted/40")

        rerender(<Component isActive={true} onClick={vi.fn()} data-oid="k2yw7uo" />)
        expect(mainDiv).toHaveClass("bg-muted/40")
      })
    })
  })
})

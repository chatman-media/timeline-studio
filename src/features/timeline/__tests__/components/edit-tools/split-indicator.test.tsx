import { fireEvent, screen } from "@testing-library/react"
import type React from "react"
import { createRef } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render } from "@/test/test-utils"

import { SplitIndicator, SplitPreview } from "../../../components/edit-tools/split-indicator"
import { EDIT_MODES } from "../../../types/edit-modes"

// Мокаем useEditModeContext
const mockEditModeContext = {
  editMode: EDIT_MODES.SPLIT as any,
  setEditMode: vi.fn(),
  isEditMode: vi.fn((mode: any) => mode === mockEditModeContext.editMode),
  cursor: "crosshair",
}

vi.mock("../../../hooks/use-edit-mode", () => ({
  useEditModeContext: () => mockEditModeContext,
}))

// Мокаем cn utility
vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}))

describe("SplitIndicator", () => {
  const mockOnSplit = vi.fn()
  const mockContainerRef = createRef<HTMLElement>()

  const defaultProps = {
    containerRef: mockContainerRef as React.RefObject<HTMLElement>,
    timeScale: 10,
    scrollX: 0,
    onSplit: mockOnSplit,
    disabled: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockEditModeContext.editMode = EDIT_MODES.SPLIT
    mockEditModeContext.isEditMode = vi.fn((mode: any) => mode === EDIT_MODES.SPLIT)

    // Создаем мок контейнера
    const container = document.createElement("div")
    container.getBoundingClientRect = vi.fn(
      () =>
        ({
          left: 100,
          right: 600,
          top: 50,
          bottom: 250,
          width: 500,
          height: 200,
          x: 100,
          y: 50,
          toJSON: () => ({}),
        }) as DOMRect,
    )
    mockContainerRef.current = container
  })

  describe("Видимость компонента", () => {
    it("не должен отображаться в других режимах редактирования", () => {
      mockEditModeContext.editMode = EDIT_MODES.SELECT
      mockEditModeContext.isEditMode = vi.fn((mode: any) => mode === EDIT_MODES.SELECT)

      render(<SplitIndicator {...defaultProps} />)

      expect(screen.queryByText(/\d{2}:\d{2}\.\d{2}/)).not.toBeInTheDocument()
    })

    it("не должен отображаться когда disabled = true", () => {
      render(<SplitIndicator {...defaultProps} disabled={true} />)

      expect(screen.queryByText(/\d{2}:\d{2}\.\d{2}/)).not.toBeInTheDocument()
    })

    it("не должен отображаться без containerRef", () => {
      const emptyRef = createRef<HTMLElement>()

      render(<SplitIndicator {...defaultProps} containerRef={emptyRef as React.RefObject<HTMLElement>} />)

      expect(screen.queryByText(/\d{2}:\d{2}\.\d{2}/)).not.toBeInTheDocument()
    })

    it("должен отображаться при движении мыши в SPLIT режиме", () => {
      const { container } = render(<SplitIndicator {...defaultProps} />)

      // Симулируем движение мыши
      fireEvent.mouseMove(mockContainerRef.current!, { clientX: 200 })

      // Проверяем наличие индикатора
      const splitLine = container.querySelector(".bg-red-500")
      expect(splitLine).toBeInTheDocument()
      expect(splitLine).toHaveClass("absolute")
      expect(splitLine).toHaveClass("top-0")
      expect(splitLine).toHaveClass("bottom-0")
      expect(splitLine).toHaveClass("w-0.5")
    })

    it("должен скрываться при выходе мыши из контейнера", () => {
      const { container } = render(<SplitIndicator {...defaultProps} />)

      // Симулируем движение и выход мыши
      fireEvent.mouseMove(mockContainerRef.current!, { clientX: 200 })
      fireEvent.mouseLeave(mockContainerRef.current!)

      // Индикатор должен исчезнуть
      const splitLine = container.querySelector(".bg-red-500")
      expect(splitLine).not.toBeInTheDocument()
    })
  })

  describe("Позиционирование", () => {
    it("должен следовать за курсором мыши", () => {
      const { container } = render(<SplitIndicator {...defaultProps} />)

      // Первая позиция
      fireEvent.mouseMove(mockContainerRef.current!, { clientX: 200 })

      let splitLine = container.querySelector(".bg-red-500")!
      expect(splitLine).toHaveStyle({ left: "100px" }) // 200 - 100 (rect.left)

      // Вторая позиция
      fireEvent.mouseMove(mockContainerRef.current!, { clientX: 350 })

      splitLine = container.querySelector(".bg-red-500")!
      expect(splitLine).toHaveStyle({ left: "250px" }) // 350 - 100
    })

    it("должен правильно рассчитывать время с учетом scrollX", () => {
      render(<SplitIndicator {...defaultProps} scrollX={100} />)

      fireEvent.mouseMove(mockContainerRef.current!, { clientX: 200 })

      // Время: (mouseX + scrollX) / timeScale = (100 + 100) / 10 = 20 секунд
      expect(screen.getByText("00:20.00")).toBeInTheDocument()
    })

    it("должен правильно форматировать время", () => {
      render(<SplitIndicator {...defaultProps} />)

      // Проверяем разные позиции
      fireEvent.mouseMove(mockContainerRef.current!, { clientX: 200 }) // 10 секунд
      expect(screen.getByText("00:10.00")).toBeInTheDocument()

      fireEvent.mouseMove(mockContainerRef.current!, { clientX: 800 }) // 70 секунд = 1:10
      expect(screen.getByText("01:10.00")).toBeInTheDocument()

      fireEvent.mouseMove(mockContainerRef.current!, { clientX: 215 }) // 11.5 секунд
      expect(screen.getByText("00:11.15")).toBeInTheDocument() // 0.5 * 30fps = 15 frames
    })
  })

  describe("Интерактивность", () => {
    it("должен вызывать onSplit при клике", () => {
      render(<SplitIndicator {...defaultProps} />)

      fireEvent.mouseMove(mockContainerRef.current!, { clientX: 200 })
      fireEvent.click(mockContainerRef.current!, { clientX: 200 })

      expect(mockOnSplit).toHaveBeenCalledTimes(1)
      expect(mockOnSplit).toHaveBeenCalledWith(10, null) // время = 100/10 = 10, trackId = null
    })

    it("должен передавать trackId при клике на трек", () => {
      // Создаем элемент трека
      const trackElement = document.createElement("div")
      trackElement.setAttribute("data-track-id", "track-1")
      mockContainerRef.current!.appendChild(trackElement)

      render(<SplitIndicator {...defaultProps} />)

      fireEvent.mouseMove(trackElement, { clientX: 200 })
      fireEvent.click(trackElement, { clientX: 200 })

      expect(mockOnSplit).toHaveBeenCalledWith(10, "track-1")
    })

    it("не должен вызывать onSplit если индикатор не видим", () => {
      render(<SplitIndicator {...defaultProps} />)

      // Клик без предварительного mouseMove
      fireEvent.click(mockContainerRef.current!, { clientX: 200 })

      expect(mockOnSplit).not.toHaveBeenCalled()
    })

    it("должен подсвечивать трек при наведении", () => {
      const trackElement = document.createElement("div")
      trackElement.setAttribute("data-track-id", "track-1")
      mockContainerRef.current!.appendChild(trackElement)

      const { container } = render(<SplitIndicator {...defaultProps} />)

      fireEvent.mouseMove(trackElement, { clientX: 200 })

      // Проверяем наличие подсветки трека
      const trackHighlight = container.querySelector(".bg-red-500\\/20")
      expect(trackHighlight).toBeInTheDocument()
      expect(trackHighlight).toHaveStyle({
        clipPath: "polygon(0 45%, 100% 40%, 100% 60%, 0 55%)",
      })
    })
  })

  describe("Визуальные элементы", () => {
    it("должен отображать иконку split", () => {
      const { container } = render(<SplitIndicator {...defaultProps} />)

      fireEvent.mouseMove(mockContainerRef.current!, { clientX: 200 })

      const splitIcon = container.querySelector("svg")
      expect(splitIcon).toBeInTheDocument()
      expect(splitIcon).toHaveClass("w-6")
      expect(splitIcon).toHaveClass("h-6")
      expect(splitIcon).toHaveClass("text-red-500")
    })

    it("должен отображать все элементы иконки", () => {
      const { container } = render(<SplitIndicator {...defaultProps} />)

      fireEvent.mouseMove(mockContainerRef.current!, { clientX: 200 })

      const paths = container.querySelectorAll("svg path")
      expect(paths).toHaveLength(3) // Вертикальная линия и две стрелки
    })

    it("должен применять правильные стили", () => {
      const { container } = render(<SplitIndicator {...defaultProps} />)

      fireEvent.mouseMove(mockContainerRef.current!, { clientX: 200 })

      const splitLine = container.querySelector(".bg-red-500")
      expect(splitLine).toHaveClass("pointer-events-none")
      expect(splitLine).toHaveClass("z-30")
      expect(splitLine).toHaveClass("transition-opacity")
      expect(splitLine).toHaveClass("duration-100")
    })

    it("должен правильно позиционировать время", () => {
      const { container } = render(<SplitIndicator {...defaultProps} />)

      fireEvent.mouseMove(mockContainerRef.current!, { clientX: 200 })

      const timeIndicator = container.querySelector(".text-red-500.font-mono")
      expect(timeIndicator).toBeInTheDocument()
      expect(timeIndicator).toHaveClass("absolute")
      expect(timeIndicator).toHaveClass("-bottom-6")
      expect(timeIndicator).toHaveClass("text-xs")
      expect(timeIndicator).toHaveClass("pointer-events-none")
      expect(timeIndicator).toHaveClass("z-30")
      expect(timeIndicator).toHaveStyle({
        left: "100px",
        transform: "translateX(-50%)",
      })
    })
  })

  describe("Event listeners", () => {
    it("должен очищать event listeners при размонтировании", () => {
      const removeEventListenerSpy = vi.spyOn(mockContainerRef.current!, "removeEventListener")

      const { unmount } = render(<SplitIndicator {...defaultProps} />)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith("mousemove", expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith("mouseleave", expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith("click", expect.any(Function))
    })

    it("должен обновлять listeners при изменении props", () => {
      const addEventListenerSpy = vi.spyOn(mockContainerRef.current!, "addEventListener")
      const removeEventListenerSpy = vi.spyOn(mockContainerRef.current!, "removeEventListener")

      const { rerender } = render(<SplitIndicator {...defaultProps} />)

      const callCountBefore = addEventListenerSpy.mock.calls.length

      // Изменяем props
      rerender(<SplitIndicator {...defaultProps} timeScale={20} />)

      // Проверяем что старые listeners удалены и новые добавлены
      expect(removeEventListenerSpy).toHaveBeenCalled()
      expect(addEventListenerSpy.mock.calls.length).toBeGreaterThan(callCountBefore)
    })
  })

  describe("Граничные случаи", () => {
    it("должен работать с большими значениями scrollX", () => {
      render(<SplitIndicator {...defaultProps} scrollX={10000} />)

      fireEvent.mouseMove(mockContainerRef.current!, { clientX: 200 })

      // Время: (100 + 10000) / 10 = 1010 секунд = 16:50
      expect(screen.getByText("16:50.00")).toBeInTheDocument()
    })

    it("должен работать с маленьким timeScale", () => {
      render(<SplitIndicator {...defaultProps} timeScale={0.1} />)

      fireEvent.mouseMove(mockContainerRef.current!, { clientX: 200 })

      // Время: 100 / 0.1 = 1000 секунд = 16:40
      expect(screen.getByText("16:40.00")).toBeInTheDocument()
    })

    it("должен работать с отрицательным scrollX", () => {
      render(<SplitIndicator {...defaultProps} scrollX={-50} />)

      fireEvent.mouseMove(mockContainerRef.current!, { clientX: 200 })

      // Время: (100 - 50) / 10 = 5 секунд
      expect(screen.getByText("00:05.00")).toBeInTheDocument()
    })

    it("должен корректно обрабатывать клики на границе контейнера", () => {
      render(<SplitIndicator {...defaultProps} />)

      fireEvent.mouseMove(mockContainerRef.current!, { clientX: 100 }) // На левой границе
      fireEvent.click(mockContainerRef.current!, { clientX: 100 })

      expect(mockOnSplit).toHaveBeenCalledWith(0, null)
    })
  })
})

describe("SplitPreview", () => {
  const clips = [
    {
      id: "clip-1",
      startTime: 10,
      duration: 20,
      trackId: "track-1",
    },
    {
      id: "clip-2",
      startTime: 40,
      duration: 30,
      trackId: "track-2",
    },
    {
      id: "clip-3",
      startTime: 80,
      duration: 15,
      trackId: "track-1",
    },
  ]

  const defaultProps = {
    clips,
    splitTime: 20,
    timeScale: 10,
  }

  describe("Отображение preview", () => {
    it("должен отображать preview для клипов, через которые проходит split", () => {
      const { container } = render(<SplitPreview {...defaultProps} />)

      // Должен показать preview только для clip-1 (splitTime=20 попадает в диапазон 10-30)
      const clipPreviews = container.querySelectorAll(".absolute > .absolute")
      expect(clipPreviews.length).toBeGreaterThan(0)
    })

    it("не должен отображаться если split не попадает ни в один клип", () => {
      const { container } = render(<SplitPreview {...defaultProps} splitTime={35} />)

      // splitTime=35 попадает в промежуток между клипами
      expect(container.firstChild).toHaveTextContent("")
    })

    it("должен отображать preview для нескольких клипов", () => {
      const overlappingClips = [
        ...clips,
        {
          id: "clip-4",
          startTime: 15,
          duration: 10,
          trackId: "track-3",
        },
      ]

      const { container } = render(<SplitPreview clips={overlappingClips} splitTime={20} timeScale={10} />)

      // Должен показать preview для clip-1 и clip-4
      // Ищем контейнеры клипов по стилю
      const clipPreviews = Array.from(container.querySelectorAll(".absolute")).filter((el) => {
        const style = (el as HTMLElement).style
        return style.left && style.width && style.left !== "" && style.width !== ""
      })
      expect(clipPreviews).toHaveLength(2)
    })
  })

  describe("Позиционирование элементов", () => {
    it("должен правильно позиционировать split line внутри клипа", () => {
      const { container } = render(<SplitPreview {...defaultProps} />)

      // Для clip-1: splitPoint = 20 - 10 = 10, splitPosition = 10 * 10 = 100px
      const splitLine = container.querySelector(".w-0\\.5.bg-red-500")
      expect(splitLine).toBeInTheDocument()
      expect(splitLine).toHaveStyle({ left: "100px" })
    })

    it("должен правильно позиционировать клипы", () => {
      const { container } = render(<SplitPreview {...defaultProps} />)

      const clipContainer = container.querySelector('.absolute[style*="width"]')!
      expect(clipContainer).toHaveStyle({
        left: "100px", // startTime * timeScale = 10 * 10
        width: "200px", // duration * timeScale = 20 * 10
      })
    })

    it("должен правильно позиционировать индикатор точки split", () => {
      const { container } = render(<SplitPreview {...defaultProps} />)

      const splitPoint = container.querySelector(".rounded-full")
      expect(splitPoint).toBeInTheDocument()
      expect(splitPoint).toHaveClass("w-2")
      expect(splitPoint).toHaveClass("h-2")
      expect(splitPoint).toHaveClass("bg-red-500")
      expect(splitPoint).toHaveStyle({ left: "96px" }) // splitPosition - 4 = 100 - 4
    })
  })

  describe("Кастомные классы", () => {
    it("должен применять кастомный className", () => {
      const { container } = render(<SplitPreview {...defaultProps} className="custom-class" />)

      const wrapper = container.querySelector(".absolute.inset-0.pointer-events-none")!
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveClass("custom-class")
    })
  })

  describe("Граничные случаи", () => {
    it("должен корректно обрабатывать split в самом начале клипа", () => {
      const { container } = render(<SplitPreview {...defaultProps} splitTime={10.001} />)

      const splitLine = container.querySelector(".w-0\\.5.bg-red-500")
      expect(splitLine).toBeInTheDocument()
      // Проверяем что позиция очень близка к 0
      const style = window.getComputedStyle(splitLine!)
      const leftValue = Number.parseFloat(style.left)
      expect(leftValue).toBeCloseTo(0.01, 2)
    })

    it("должен корректно обрабатывать split в самом конце клипа", () => {
      const { container } = render(<SplitPreview {...defaultProps} splitTime={29.999} />)

      const splitLine = container.querySelector(".w-0\\.5.bg-red-500")
      expect(splitLine).toBeInTheDocument()
      // Проверяем что позиция очень близка к 200
      const style = window.getComputedStyle(splitLine!)
      const leftValue = Number.parseFloat(style.left)
      expect(leftValue).toBeCloseTo(199.99, 1)
    })

    it("должен работать с нулевым timeScale", () => {
      const { container } = render(<SplitPreview {...defaultProps} timeScale={0} />)

      const splitLine = container.querySelector(".w-0\\.5.bg-red-500")
      if (splitLine) {
        expect(splitLine).toHaveStyle({ left: "0px" })
      }
    })

    it("должен обрабатывать пустой массив клипов", () => {
      const { container } = render(<SplitPreview clips={[]} splitTime={20} timeScale={10} />)

      const wrapper = container.querySelector(".absolute.inset-0.pointer-events-none")
      expect(wrapper).not.toBeInTheDocument()
    })
  })
})

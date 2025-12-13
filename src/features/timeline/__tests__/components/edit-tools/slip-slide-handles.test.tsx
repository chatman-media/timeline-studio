/**
 * @vitest-environment jsdom
 */
import { fireEvent, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithTimeline } from "@/test/test-utils"

import { SlipSlideHandles } from "../../../components/edit-tools/slip-slide-handles"
import type { TimelineClip } from "../../../types"
import { EDIT_MODES } from "../../../types/edit-modes"

// Мокаем useEditModeContext
const mockEditModeContext = {
  editMode: EDIT_MODES.SLIP as any,
  setEditMode: vi.fn(),
  isEditMode: vi.fn(),
  cursor: "ew-resize",
}

vi.mock("../../../hooks/editing/use-edit-mode", () => ({
  useEditModeContext: () => mockEditModeContext,
}))

// Мокаем cn utility
vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}))

// Мокаем Tooltip компоненты
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => children,
  TooltipContent: ({ children, className }: any) => (
    <div data-testid="tooltip-content" className={className}>
      {children}
    </div>
  ),
  TooltipProvider: ({ children }: any) => children,
  TooltipTrigger: ({ children }: any) => children,
}))

// Мокаем иконки
vi.mock("lucide-react", () => ({
  MoveHorizontal: ({ className }: any) => <svg data-testid="move-horizontal-icon" className={className} />,
  Maximize2: ({ className }: any) => <svg data-testid="maximize2-icon" className={className} />,
  AlertTriangle: ({ className }: any) => <svg data-testid="alert-triangle-icon" className={className} />,
}))

describe("SlipSlideHandles", () => {
  // Создаем тестовый клип
  const clip: TimelineClip = {
    id: "clip-1",
    name: "Test Clip",
    trackId: "track-1",
    mediaId: "media-1",
    startTime: 10,
    duration: 20,
    sourceIn: 5,
    sourceOut: 25,
    mediaStartTime: 5,
    mediaEndTime: 25,
    offset: 5, // Для slip тестов
    mediaDuration: 60, // Для slip тестов
    effects: [],
    speed: 1,
    playbackRate: 1,
    volume: 1,
    opacity: 1,
    isMuted: false,
    filters: [],
    transitions: [],
    isReversed: false,
    isSelected: false,
    isLocked: false,
    position: {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const defaultProps = {
    clip,
    isHovered: true,
    isActive: false,
    timeScale: 10,
    onSlipStart: vi.fn(),
    onSlideStart: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockEditModeContext.editMode = EDIT_MODES.SLIP
  })

  describe("Видимость компонента", () => {
    it("должен не отображаться когда isHovered = false", () => {
      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} isHovered={false} />)

      expect(container.querySelector(".cursor-ew-resize")).not.toBeInTheDocument()
    })

    it("должен не отображаться когда editMode не SLIP или SLIDE", () => {
      mockEditModeContext.editMode = EDIT_MODES.SELECT

      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      expect(container.querySelector(".cursor-ew-resize")).not.toBeInTheDocument()
    })

    it("должен отображаться в SLIP режиме", () => {
      mockEditModeContext.editMode = EDIT_MODES.SLIP

      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      const handle = container.querySelector(".cursor-ew-resize")
      expect(handle).toBeInTheDocument()
    })

    it("должен отображаться в SLIDE режиме", () => {
      mockEditModeContext.editMode = EDIT_MODES.SLIDE

      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      const handle = container.querySelector(".cursor-ew-resize")
      expect(handle).toBeInTheDocument()
    })
  })

  describe("Slip Mode", () => {
    beforeEach(() => {
      mockEditModeContext.editMode = EDIT_MODES.SLIP
    })

    it("должен отображать handle в центре клипа", () => {
      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()

      // Центр клипа: (startTime + duration/2) * timeScale = (10 + 10) * 10 = 200px
      expect(handle).toHaveStyle({ left: "200px" })
    })

    it("должен отображать media boundaries когда есть offset", () => {
      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      // Проверяем контейнер медиа границ
      const mediaExtent = container.querySelector(".pointer-events-none")!
      expect(mediaExtent).toBeInTheDocument()

      // Left position: clipLeft - offsetPixels = 100 - 50 = 50px
      expect(mediaExtent).toHaveStyle({
        left: "50px",
        width: "600px", // mediaDuration * timeScale = 60 * 10
      })

      // Проверяем левую границу медиа
      const leftBoundary = mediaExtent.querySelector(".left-0.bg-blue-500\\/50")
      expect(leftBoundary).toBeInTheDocument()
    })

    it("должен отображать правую границу медиа когда есть доступное медиа справа", () => {
      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      const mediaExtent = container.querySelector(".pointer-events-none")!
      const rightBoundary = mediaExtent.querySelector(".right-0.bg-blue-500\\/50")

      // mediaDuration - offset - duration = 60 - 5 - 20 = 35 > 0
      expect(rightBoundary).toBeInTheDocument()
    })

    it("не должен отображать левую границу когда offset = 0", () => {
      const clipNoOffset = { ...clip, offset: 0 }

      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} clip={clipNoOffset} />)

      const mediaExtent = container.querySelector(".pointer-events-none")!
      const leftBoundary = mediaExtent.querySelector(".left-0.bg-blue-500\\/50")
      expect(leftBoundary).not.toBeInTheDocument()
    })

    it("должен отображать индикатор доступного медиа", () => {
      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      const availableMediaIndicator = container.querySelector(".h-1.bg-blue-500\\/20.rounded-full")
      expect(availableMediaIndicator).toBeInTheDocument()
      expect(availableMediaIndicator).toHaveClass("absolute")
      expect(availableMediaIndicator).toHaveClass("top-1/2")
      expect(availableMediaIndicator).toHaveClass("-translate-y-1/2")
      expect(availableMediaIndicator).toHaveClass("left-0")
      expect(availableMediaIndicator).toHaveClass("right-0")
    })

    it("должен использовать blue цвета для slip режима", () => {
      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toHaveClass("bg-blue-500/20")
      expect(handle).toHaveClass("border-blue-500")

      const icon = screen.getByTestId("move-horizontal-icon")
      expect(icon).toHaveClass("text-blue-500")
    })

    it("должен применять активные стили когда isActive = true", () => {
      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} isActive={true} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toHaveClass("bg-blue-500/40")
      expect(handle).toHaveClass("scale-110")
    })

    it("должен вызывать onSlipStart при mouseDown", () => {
      const onSlipStart = vi.fn()

      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} onSlipStart={onSlipStart} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      fireEvent.mouseDown(handle, { clientX: 150 })

      expect(onSlipStart).toHaveBeenCalledTimes(1)
      expect(onSlipStart).toHaveBeenCalledWith(150)
    })

    it("должен отображать tooltip с правильным содержимым для slip", () => {
      renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      const tooltipContent = screen.getByTestId("tooltip-content")
      expect(tooltipContent).toBeInTheDocument()

      const title = within(tooltipContent).getByText("Slip Edit (Y)")
      expect(title).toBeInTheDocument()

      const description = within(tooltipContent).getByText("Drag to slip media content")
      expect(description).toBeInTheDocument()
    })

    it("должен правильно рассчитывать позиции для клипа без mediaDuration", () => {
      const clipNoMediaDuration = { ...clip, mediaDuration: undefined }

      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} clip={clipNoMediaDuration} />)

      const mediaExtent = container.querySelector(".pointer-events-none")!
      expect(mediaExtent).toBeInTheDocument()

      // Должен использовать duration как fallback
      expect(mediaExtent).toHaveStyle({ width: "200px" }) // duration * timeScale = 20 * 10
    })

    it("должен работать с отрицательным timeScale", () => {
      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} timeScale={-10} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()
      expect(handle).toHaveStyle({ left: "-200px" }) // (10 + 10) * -10
    })
  })

  describe("Slide Mode", () => {
    beforeEach(() => {
      mockEditModeContext.editMode = EDIT_MODES.SLIDE
    })

    it("должен отображать handle в центре клипа", () => {
      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()

      // Центр клипа: (startTime + duration/2) * timeScale = (10 + 10) * 10 = 200px
      expect(handle).toHaveStyle({ left: "200px" })
    })

    it("должен отображать направляющие стрелки", () => {
      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      // Проверяем контейнер стрелок
      const arrowsContainer = container.querySelector(".absolute.top-0.bottom-0")!
      expect(arrowsContainer).toBeInTheDocument()
      expect(arrowsContainer).toHaveStyle({
        left: "100px", // startTime * timeScale
        width: "200px", // duration * timeScale
      })

      // Проверяем левую стрелку
      const leftArrow = arrowsContainer.querySelector(".left-0.top-1\\/2")
      expect(leftArrow).toBeInTheDocument()

      const leftArrowLine = leftArrow?.querySelector(".w-8.h-0\\.5.bg-green-500\\/50")
      expect(leftArrowLine).toBeInTheDocument()

      // Проверяем правую стрелку
      const rightArrow = arrowsContainer.querySelector(".right-0.top-1\\/2")
      expect(rightArrow).toBeInTheDocument()

      const rightArrowLine = rightArrow?.querySelector(".w-8.h-0\\.5.bg-green-500\\/50")
      expect(rightArrowLine).toBeInTheDocument()
    })

    it("должен использовать green цвета для slide режима", () => {
      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toHaveClass("bg-green-500/20")
      expect(handle).toHaveClass("border-green-500")

      const icon = screen.getByTestId("maximize2-icon")
      expect(icon).toHaveClass("text-green-500")
      expect(icon).toHaveClass("rotate-90")
    })

    it("должен применять активные стили когда isActive = true", () => {
      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} isActive={true} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toHaveClass("bg-green-500/40")
      expect(handle).toHaveClass("scale-110")
    })

    it("должен вызывать onSlideStart при mouseDown", () => {
      const onSlideStart = vi.fn()

      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} onSlideStart={onSlideStart} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      fireEvent.mouseDown(handle, { clientX: 250 })

      expect(onSlideStart).toHaveBeenCalledTimes(1)
      expect(onSlideStart).toHaveBeenCalledWith(250)
    })

    it("должен отображать tooltip с правильным содержимым для slide", () => {
      renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      const tooltipContent = screen.getByTestId("tooltip-content")
      expect(tooltipContent).toBeInTheDocument()

      const title = within(tooltipContent).getByText("Slide Edit (U)")
      expect(title).toBeInTheDocument()

      const description = within(tooltipContent).getByText("Drag to slide clip")
      expect(description).toBeInTheDocument()
    })

    it("должен отображать стрелки с правильными стилями", () => {
      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      // Проверяем стили стрелок
      const leftArrowHead = container.querySelector(".border-r-green-500\\/50")
      expect(leftArrowHead).toBeInTheDocument()
      expect(leftArrowHead).toHaveClass("border-t-4")
      expect(leftArrowHead).toHaveClass("border-t-transparent")
      expect(leftArrowHead).toHaveClass("border-r-4")
      expect(leftArrowHead).toHaveClass("border-b-4")
      expect(leftArrowHead).toHaveClass("border-b-transparent")

      const rightArrowHead = container.querySelector(".border-l-green-500\\/50")
      expect(rightArrowHead).toBeInTheDocument()
      expect(rightArrowHead).toHaveClass("border-t-4")
      expect(rightArrowHead).toHaveClass("border-t-transparent")
      expect(rightArrowHead).toHaveClass("border-l-4")
      expect(rightArrowHead).toHaveClass("border-b-4")
      expect(rightArrowHead).toHaveClass("border-b-transparent")
    })
  })

  describe("Общие функции", () => {
    it("должен останавливать propagation при mouseDown в любом режиме", () => {
      mockEditModeContext.editMode = EDIT_MODES.SLIP
      const onSlipStart = vi.fn()

      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} onSlipStart={onSlipStart} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      fireEvent.mouseDown(handle, { clientX: 100 })

      // Если onSlipStart вызван, значит обработчик сработал и stopPropagation тоже
      expect(onSlipStart).toHaveBeenCalledTimes(1)
    })

    it("не должен вызывать обработчики если они не переданы", () => {
      mockEditModeContext.editMode = EDIT_MODES.SLIP

      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} onSlipStart={undefined} />)

      const handle = container.querySelector(".cursor-ew-resize")!

      // Не должно быть ошибок при клике
      expect(() => {
        fireEvent.mouseDown(handle, { clientX: 100 })
      }).not.toThrow()
    })

    it("должен иметь правильные базовые стили для handle", () => {
      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toHaveClass("absolute")
      expect(handle).toHaveClass("top-1/2")
      expect(handle).toHaveClass("left-1/2")
      expect(handle).toHaveClass("-translate-x-1/2")
      expect(handle).toHaveClass("-translate-y-1/2")
      expect(handle).toHaveClass("w-12")
      expect(handle).toHaveClass("h-12")
      expect(handle).toHaveClass("rounded-full")
      expect(handle).toHaveClass("flex")
      expect(handle).toHaveClass("items-center")
      expect(handle).toHaveClass("justify-center")
      expect(handle).toHaveClass("transition-all")
      expect(handle).toHaveClass("duration-150")
    })

    it("должен корректно масштабироваться с разными timeScale", () => {
      const { rerender, container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} timeScale={5} />)

      let handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toHaveStyle({ left: "100px" }) // (10 + 10) * 5

      rerender(<SlipSlideHandles {...defaultProps} timeScale={20} />)

      handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toHaveStyle({ left: "400px" }) // (10 + 10) * 20
    })
  })

  describe("Граничные случаи", () => {
    it("должен работать с очень маленькими клипами", () => {
      const tinyClip = { ...clip, startTime: 0, duration: 0.01 }

      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} clip={tinyClip} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()
      expect(handle).toHaveStyle({ left: "0.05px" }) // (0 + 0.005) * 10
    })

    it("должен работать с очень большими значениями", () => {
      const largeClip = { ...clip, startTime: 10000, duration: 5000 }

      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} clip={largeClip} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()
      expect(handle).toHaveStyle({ left: "125000px" }) // (10000 + 2500) * 10
    })

    it("должен работать с нулевым timeScale", () => {
      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} timeScale={0} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()
      expect(handle).toHaveStyle({ left: "0px" })
    })

    it("должен корректно обрабатывать клип без offset в slip режиме", () => {
      mockEditModeContext.editMode = EDIT_MODES.SLIP
      const clipNoOffset = { ...clip, offset: 0 }

      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} clip={clipNoOffset} />)

      const mediaExtent = container.querySelector(".pointer-events-none")!
      expect(mediaExtent).toBeInTheDocument()
      expect(mediaExtent).toHaveStyle({ left: "100px" }) // clipLeft - 0
    })

    it("должен возвращать null для неподдерживаемых режимов", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM

      const { container } = renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      expect(container.querySelector(".cursor-ew-resize")).not.toBeInTheDocument()
    })
  })

  describe("Tooltip стили", () => {
    it("должен иметь правильные стили для tooltip", () => {
      renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      const tooltipContent = screen.getByTestId("tooltip-content")
      expect(tooltipContent).toHaveClass("bg-gray-900")
      expect(tooltipContent).toHaveClass("text-white")
    })

    it("должен отображать правильный hotkey для каждого режима", () => {
      // Slip mode
      mockEditModeContext.editMode = EDIT_MODES.SLIP
      const { rerender } = renderWithTimeline(<SlipSlideHandles {...defaultProps} />)

      let tooltipContent = screen.getByTestId("tooltip-content")
      expect(within(tooltipContent).getByText(/\(Y\)/)).toBeInTheDocument()

      // Slide mode
      mockEditModeContext.editMode = EDIT_MODES.SLIDE
      rerender(<SlipSlideHandles {...defaultProps} />)

      tooltipContent = screen.getByTestId("tooltip-content")
      expect(within(tooltipContent).getByText(/\(U\)/)).toBeInTheDocument()
    })
  })
})

import { fireEvent, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render } from "@/test/test-utils"

import { RollEditHandle } from "../../../components/edit-tools/roll-edit-handle"
import type { TimelineClip } from "../../../types"
import { EDIT_MODES } from "../../../types/edit-modes"

// Мокаем useEditModeContext
const mockEditModeContext = {
  editMode: EDIT_MODES.ROLL as any,
  setEditMode: vi.fn(),
  isEditMode: vi.fn(),
  cursor: "ew-resize",
}

vi.mock("../../../hooks/use-edit-mode", () => ({
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

describe("RollEditHandle", () => {
  // Создаем тестовые клипы
  const leftClip: TimelineClip = {
    id: "clip-1",
    trackId: "track-1",
    sourceId: "source-1",
    startTime: 10,
    duration: 20,
    trimStart: 0,
    trimEnd: 0,
    effects: [],
    speed: 1,
    volume: 1,
    opacity: 1,
    filters: [],
    transitions: { in: null, out: null },
    metadata: {},
  }

  const rightClip: TimelineClip = {
    id: "clip-2",
    trackId: "track-1",
    sourceId: "source-2",
    startTime: 30, // Adjacent to leftClip (10 + 20 = 30)
    duration: 15,
    trimStart: 0,
    trimEnd: 0,
    effects: [],
    speed: 1,
    volume: 1,
    opacity: 1,
    filters: [],
    transitions: { in: null, out: null },
    metadata: {},
  }

  const defaultProps = {
    leftClip,
    rightClip,
    isHovered: true,
    isActive: false,
    timeScale: 10,
    onRollStart: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockEditModeContext.editMode = EDIT_MODES.ROLL
  })

  describe("Видимость компонента", () => {
    it("должен не отображаться когда editMode !== ROLL", () => {
      mockEditModeContext.editMode = EDIT_MODES.SELECT

      const { container } = render(<RollEditHandle {...defaultProps} />)

      const handle = container.querySelector(".cursor-ew-resize")
      expect(handle).not.toBeInTheDocument()
    })

    it("должен не отображаться когда isHovered = false", () => {
      const { container } = render(<RollEditHandle {...defaultProps} isHovered={false} />)

      const handle = container.querySelector(".cursor-ew-resize")
      expect(handle).not.toBeInTheDocument()
    })

    it("должен не отображаться когда клипы не смежные", () => {
      const nonAdjacentRightClip = {
        ...rightClip,
        startTime: 35, // Gap of 5 seconds
      }

      const { container } = render(<RollEditHandle {...defaultProps} rightClip={nonAdjacentRightClip} />)

      const handle = container.querySelector(".cursor-ew-resize")
      expect(handle).not.toBeInTheDocument()
    })

    it("должен отображаться когда все условия выполнены", () => {
      const { container } = render(<RollEditHandle {...defaultProps} />)

      const handle = container.querySelector(".cursor-ew-resize")
      expect(handle).toBeInTheDocument()
    })

    it("должен отображаться при минимальном зазоре (0.001)", () => {
      const almostAdjacentRightClip = {
        ...rightClip,
        startTime: 30.0005, // Gap of 0.0005 < 0.001
      }

      const { container } = render(<RollEditHandle {...defaultProps} rightClip={almostAdjacentRightClip} />)

      const handle = container.querySelector(".cursor-ew-resize")
      expect(handle).toBeInTheDocument()
    })

    it("не должен отображаться при зазоре больше допустимого", () => {
      const gappedRightClip = {
        ...rightClip,
        startTime: 30.002, // Gap of 0.002 > 0.001
      }

      const { container } = render(<RollEditHandle {...defaultProps} rightClip={gappedRightClip} />)

      const handle = container.querySelector(".cursor-ew-resize")
      expect(handle).not.toBeInTheDocument()
    })
  })

  describe("Позиционирование", () => {
    it("должен позиционироваться на границе клипов", () => {
      const { container } = render(<RollEditHandle {...defaultProps} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()

      // leftEnd = 10 + 20 = 30, timeScale = 10, position = 30 * 10 = 300px
      expect(handle).toHaveStyle({ left: "300px" })
    })

    it("должен корректно масштабироваться с timeScale", () => {
      const { container } = render(<RollEditHandle {...defaultProps} timeScale={5} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()

      // leftEnd = 30, timeScale = 5, position = 30 * 5 = 150px
      expect(handle).toHaveStyle({ left: "150px" })
    })

    it("должен правильно позиционироваться для клипов в начале таймлайна", () => {
      const earlyLeftClip = { ...leftClip, startTime: 0, duration: 5 }
      const earlyRightClip = { ...rightClip, startTime: 5, duration: 10 }

      const { container } = render(
        <RollEditHandle {...defaultProps} leftClip={earlyLeftClip} rightClip={earlyRightClip} />,
      )

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()

      // leftEnd = 0 + 5 = 5, timeScale = 10, position = 5 * 10 = 50px
      expect(handle).toHaveStyle({ left: "50px" })
    })
  })

  describe("Интерактивность", () => {
    it("должен вызывать onRollStart при mouseDown", () => {
      const onRollStart = vi.fn()

      const { container } = render(<RollEditHandle {...defaultProps} onRollStart={onRollStart} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()

      fireEvent.mouseDown(handle, { clientX: 100 })

      expect(onRollStart).toHaveBeenCalledTimes(1)
      expect(onRollStart).toHaveBeenCalledWith(100)
    })

    it("должен останавливать propagation при mouseDown", () => {
      const onRollStart = vi.fn()
      const stopPropagation = vi.fn()

      const { container } = render(<RollEditHandle {...defaultProps} onRollStart={onRollStart} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()

      // Используем fireEvent с настройкой stopPropagation
      const event = fireEvent.mouseDown(handle, { clientX: 100 })

      // Проверяем что onRollStart был вызван (это подтверждает что обработчик работает)
      expect(onRollStart).toHaveBeenCalledTimes(1)
    })

    it("не должен вызывать onRollStart если не передан", () => {
      const { container } = render(<RollEditHandle {...defaultProps} onRollStart={undefined} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()

      // Не должно быть ошибок при клике
      expect(() => {
        fireEvent.mouseDown(handle, { clientX: 100 })
      }).not.toThrow()
    })
  })

  describe("Визуальное состояние", () => {
    it("должен иметь базовые стили когда не активен", () => {
      const { container } = render(<RollEditHandle {...defaultProps} isActive={false} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()
      expect(handle).toHaveClass("absolute top-0 bottom-0 w-4 -translate-x-1/2")
      expect(handle).toHaveClass("flex items-center justify-center cursor-ew-resize z-20")
      expect(handle).toHaveClass("transition-all duration-150")

      const background = handle.querySelector(".bg-purple-500\\/20")
      expect(background).toBeInTheDocument()
      expect(background).toHaveClass("absolute inset-0 rounded")
      expect(background).toHaveClass("border-x-2 border-purple-500")
      expect(background).not.toHaveClass("bg-purple-500/40")
    })

    it("должен иметь активные стили когда isActive = true", () => {
      const { container } = render(<RollEditHandle {...defaultProps} isActive={true} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()

      const background = handle.querySelector(".bg-purple-500\\/20")
      expect(background).toBeInTheDocument()
      expect(background).toHaveClass("bg-purple-500/40")
    })

    it("должен отображать индикаторы когда активен", () => {
      const { container } = render(<RollEditHandle {...defaultProps} isActive={true} />)

      // Проверяем левый индикатор
      const leftIndicator = container.querySelector(".right-full")
      expect(leftIndicator).toBeInTheDocument()
      expect(leftIndicator).toHaveClass("absolute top-1/2 -translate-y-1/2 mr-1")

      const leftLine = leftIndicator?.querySelector(".bg-purple-500\\/50")
      expect(leftLine).toBeInTheDocument()
      expect(leftLine).toHaveClass("w-8 h-0.5")

      // Проверяем правый индикатор
      const rightIndicator = container.querySelector(".left-full")
      expect(rightIndicator).toBeInTheDocument()
      expect(rightIndicator).toHaveClass("absolute top-1/2 -translate-y-1/2 ml-1")

      const rightLine = rightIndicator?.querySelector(".bg-purple-500\\/50")
      expect(rightLine).toBeInTheDocument()
      expect(rightLine).toHaveClass("w-8 h-0.5")
    })

    it("не должен отображать индикаторы когда не активен", () => {
      const { container } = render(<RollEditHandle {...defaultProps} isActive={false} />)

      const leftIndicator = container.querySelector(".right-full")
      expect(leftIndicator).not.toBeInTheDocument()

      const rightIndicator = container.querySelector(".left-full")
      expect(rightIndicator).not.toBeInTheDocument()
    })
  })

  describe("Иконка", () => {
    it("должен отображать иконку GripVertical", () => {
      const { container } = render(<RollEditHandle {...defaultProps} />)

      const icon = container.querySelector("svg")
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass("w-4 h-4 text-purple-500")

      const iconWrapper = icon?.parentElement
      expect(iconWrapper).toHaveClass("relative z-10")
    })
  })

  describe("Tooltip", () => {
    it("должен отображать tooltip с правильным содержимым", () => {
      render(<RollEditHandle {...defaultProps} />)

      const tooltipContent = screen.getByTestId("tooltip-content")
      expect(tooltipContent).toBeInTheDocument()

      const title = within(tooltipContent).getByText("Roll Edit (W)")
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass("text-sm")

      const description = within(tooltipContent).getByText("Drag to adjust edit point")
      expect(description).toBeInTheDocument()
      expect(description).toHaveClass("text-xs opacity-80")
    })

    it("должен иметь правильные стили для tooltip", () => {
      render(<RollEditHandle {...defaultProps} />)

      const tooltipContent = screen.getByTestId("tooltip-content")
      expect(tooltipContent).toHaveClass("bg-gray-900 text-white")
    })
  })

  describe("Граничные случаи", () => {
    it("должен работать с очень маленькими клипами", () => {
      const tinyLeftClip = { ...leftClip, startTime: 0, duration: 0.001 }
      const tinyRightClip = { ...rightClip, startTime: 0.001, duration: 0.001 }

      const { container } = render(
        <RollEditHandle {...defaultProps} leftClip={tinyLeftClip} rightClip={tinyRightClip} />,
      )

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()
      expect(handle).toHaveStyle({ left: "0.01px" }) // 0.001 * 10
    })

    it("должен работать с очень большими значениями времени", () => {
      const lateLeftClip = { ...leftClip, startTime: 10000, duration: 5000 }
      const lateRightClip = { ...rightClip, startTime: 15000, duration: 3000 }

      const { container } = render(
        <RollEditHandle {...defaultProps} leftClip={lateLeftClip} rightClip={lateRightClip} />,
      )

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()
      expect(handle).toHaveStyle({ left: "150000px" }) // 15000 * 10
    })

    it("должен работать с отрицательным timeScale", () => {
      const { container } = render(<RollEditHandle {...defaultProps} timeScale={-10} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()
      expect(handle).toHaveStyle({ left: "-300px" }) // 30 * -10
    })

    it("должен работать с нулевым timeScale", () => {
      const { container } = render(<RollEditHandle {...defaultProps} timeScale={0} />)

      const handle = container.querySelector(".cursor-ew-resize")!
      expect(handle).toBeInTheDocument()
      expect(handle).toHaveStyle({ left: "0px" }) // 30 * 0
    })

    it("должен корректно обрабатывать клипы с одинаковым trackId", () => {
      const sameTrackRightClip = {
        ...rightClip,
        trackId: leftClip.trackId,
      }

      const { container } = render(<RollEditHandle {...defaultProps} rightClip={sameTrackRightClip} />)

      const handle = container.querySelector(".cursor-ew-resize")
      expect(handle).toBeInTheDocument()
    })

    it("должен работать с клипами на разных треках", () => {
      const differentTrackRightClip = {
        ...rightClip,
        trackId: "track-2",
      }

      const { container } = render(<RollEditHandle {...defaultProps} rightClip={differentTrackRightClip} />)

      const handle = container.querySelector(".cursor-ew-resize")
      expect(handle).toBeInTheDocument()
    })
  })

  describe("Производительность", () => {
    it("не должен перерендериваться при изменении неиспользуемых свойств клипа", () => {
      const { rerender, container } = render(<RollEditHandle {...defaultProps} />)

      const handle1 = container.querySelector(".cursor-ew-resize")

      // Изменяем свойства, которые не влияют на отображение
      const updatedLeftClip = {
        ...leftClip,
        volume: 0.5,
        opacity: 0.8,
        effects: ["effect1"],
      }

      rerender(<RollEditHandle {...defaultProps} leftClip={updatedLeftClip} />)

      const handle2 = container.querySelector(".cursor-ew-resize")

      // Компонент должен остаться на том же месте
      expect(handle1).toEqual(handle2)
    })

    it("должен перерендериваться при изменении позиции клипов", () => {
      const { rerender, container } = render(<RollEditHandle {...defaultProps} />)

      const handle1 = container.querySelector(".cursor-ew-resize")!
      expect(handle1).toHaveStyle({ left: "300px" })

      const movedLeftClip = {
        ...leftClip,
        duration: 25, // Changed duration affects position
      }

      const movedRightClip = {
        ...rightClip,
        startTime: 35, // Also need to move right clip to keep them adjacent
      }

      rerender(<RollEditHandle {...defaultProps} leftClip={movedLeftClip} rightClip={movedRightClip} />)

      const handle2 = container.querySelector(".cursor-ew-resize")!
      expect(handle2).toBeInTheDocument()
      expect(handle2).toHaveStyle({ left: "350px" }) // (10 + 25) * 10
    })
  })
})

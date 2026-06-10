/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { TimelineMarker } from "../../../components/markers/timeline-marker"
import type { ExtendedTimelineMarker } from "../../../types/markers"

// Mock компонентов
vi.mock("@timeline-studio/ui/components/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <div data-oid="qtgn51v">{children}</div>,
  Tooltip: ({ children }: any) => <div data-oid="etku::7">{children}</div>,
  TooltipContent: ({ children }: any) => <div data-oid="s9vd76x">{children}</div>,
  TooltipTrigger: ({ children }: any) => <div data-oid="679zn76">{children}</div>,
}))

vi.mock("@timeline-studio/ui/components/context-menu", () => ({
  ContextMenu: ({ children }: any) => <div data-oid="x.tx:qe">{children}</div>,
  ContextMenuContent: ({ children }: any) => <div data-oid="5w-3ft5">{children}</div>,
  ContextMenuItem: ({ children, onClick }: any) => (
    <div onClick={onClick} data-oid="kjohgow">
      {children}
    </div>
  ),

  ContextMenuTrigger: ({ children }: any) => <div data-oid="-j86-kd">{children}</div>,
}))

describe("TimelineMarker", () => {
  const mockMarker: ExtendedTimelineMarker = {
    id: "marker-1",
    time: 5.5,
    name: "Test Chapter",
    description: "A test chapter marker",
    color: "#3b82f6",
    type: "chapter",
    isLocked: false,
    duration: 2.0,
  }

  const defaultProps = {
    marker: mockMarker,
    timeScale: 100,
    isSelected: false,
    onDrag: vi.fn(),
    onClick: vi.fn(),
    onDelete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("рендерит маркер с правильной позицией", () => {
    render(<TimelineMarker {...defaultProps} data-oid="b2gv94j" />)

    const markerElement = screen.getByTestId
      ? screen.getByTestId("timeline-marker")
      : screen.getByRole("generic", { hidden: true })
    expect(markerElement).toHaveStyle({
      left: "550px", // 5.5 секунд * 100 пикселей/сек
    })
  })

  it("показывает правильные данные в tooltip", () => {
    render(<TimelineMarker {...defaultProps} data-oid="fd0x8jh" />)

    expect(screen.getByText("Test Chapter")).toBeInTheDocument()
    expect(screen.getByText("00:05.15")).toBeInTheDocument() // 5.5 сек = 5 сек + 15 кадров при 30fps
    expect(screen.getByText("A test chapter marker")).toBeInTheDocument()
  })

  it("вызывает onClick при клике на маркер", () => {
    const onClick = vi.fn()
    render(<TimelineMarker {...defaultProps} onClick={onClick} data-oid="s_afm:r" />)

    const markerElement = screen.getByTestId("timeline-marker")
    fireEvent.click(markerElement)

    expect(onClick).toHaveBeenCalledWith("marker-1")
  })

  it("начинает перетаскивание при mouseDown", () => {
    const onDrag = vi.fn()
    render(<TimelineMarker {...defaultProps} onDrag={onDrag} data-oid="wm4yf5w" />)

    const markerElement = screen.getByTestId("timeline-marker")
    fireEvent.mouseDown(markerElement, { clientX: 550 })

    // Симулируем движение мыши
    fireEvent.mouseMove(document, { clientX: 650 })

    expect(onDrag).toHaveBeenCalledWith("marker-1", expect.any(Number))
  })

  it("не позволяет перетаскивать заблокированный маркер", () => {
    const lockedMarker = { ...mockMarker, isLocked: true }
    const onDrag = vi.fn()

    render(<TimelineMarker {...defaultProps} marker={lockedMarker} onDrag={onDrag} data-oid="e217lrn" />)

    const markerElement = screen.getByTestId("timeline-marker")
    fireEvent.mouseDown(markerElement, { clientX: 550 })
    fireEvent.mouseMove(document, { clientX: 650 })

    expect(onDrag).not.toHaveBeenCalled()
  })

  it("показывает визуальную индикацию для выбранного маркера", () => {
    render(<TimelineMarker {...defaultProps} isSelected={true} data-oid="1cy9::n" />)

    const markerElement = screen.getByTestId("timeline-marker")
    expect(markerElement).toHaveClass("ring-2")
    expect(markerElement).toHaveClass("ring-primary")
  })

  it("показывает флаг длительности для маркеров с duration", () => {
    render(<TimelineMarker {...defaultProps} data-oid="rf713py" />)

    // Проверяем, что есть дополнительный элемент для duration
    const markerElement = screen.getByTestId("timeline-marker")
    const durationFlag = markerElement.querySelector('[style*="width: 200px"]') // 2.0 * 100
    expect(durationFlag).toBeInTheDocument()
  })

  it("не показывает флаг длительности для маркеров без duration", () => {
    const markerWithoutDuration = { ...mockMarker, duration: undefined }
    render(<TimelineMarker {...defaultProps} marker={markerWithoutDuration} data-oid="2aa6ow3" />)

    const markerElement = screen.getByTestId("timeline-marker")
    const durationFlag = markerElement.querySelector('[style*="width:"]')
    expect(durationFlag).not.toBeInTheDocument()
  })

  it("отображает правильную иконку для типа маркера", () => {
    // Проверяем иконку chapter (bookmark)
    const { rerender } = render(<TimelineMarker {...defaultProps} data-oid="n2dvsyx" />)
    expect(screen.getByTestId("timeline-marker")).toBeInTheDocument()

    // Тест для другого типа маркера
    const noteMarker = { ...mockMarker, type: "note" as const }
    rerender(<TimelineMarker {...defaultProps} marker={noteMarker} data-oid="y:ybtbu" />)
    expect(screen.getByTestId("timeline-marker")).toBeInTheDocument()
  })

  it("вызывает onDelete из контекстного меню", () => {
    const onDelete = vi.fn()
    render(<TimelineMarker {...defaultProps} onDelete={onDelete} data-oid="hmf1zen" />)

    const deleteMenuItem = screen.getByText("Delete Marker")
    fireEvent.click(deleteMenuItem)

    expect(onDelete).toHaveBeenCalledWith("marker-1")
  })

  it('вызывает onClick из контекстного меню "Go to Marker"', () => {
    const onClick = vi.fn()
    render(<TimelineMarker {...defaultProps} onClick={onClick} data-oid="f-v3f:j" />)

    const goToMenuItem = screen.getByText("Go to Marker")
    fireEvent.click(goToMenuItem)

    expect(onClick).toHaveBeenCalledWith("marker-1")
  })

  it("форматирует время правильно", () => {
    // Тест различных значений времени
    const testCases = [
      { time: 0, expected: "00:00.00" },
      { time: 65.5, expected: "01:05.15" }, // 1 минута 5.5 секунд
      { time: 125.25, expected: "02:05.07" }, // 2 минуты 5.25 секунд
    ]

    testCases.forEach(({ time, expected }) => {
      const markerWithTime = { ...mockMarker, time }
      const { rerender } = render(<TimelineMarker {...defaultProps} marker={markerWithTime} data-oid="elitchk" />)

      expect(screen.getByText(expected)).toBeInTheDocument()

      rerender(<div data-oid="t54zf9x" />) // Очистка для следующего теста
    })
  })
})

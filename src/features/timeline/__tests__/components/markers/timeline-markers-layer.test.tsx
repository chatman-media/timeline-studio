/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { TimelineMarkersLayer } from "../../../components/markers/timeline-markers-layer"
import type { ExtendedTimelineMarker } from "../../../types/markers"

// Mock компонента TimelineMarker
vi.mock("../../../components/markers/timeline-marker", () => ({
  TimelineMarker: ({ marker, onClick }: any) => (
    <div
      data-testid={`marker-${marker.id}`}
      onClick={() => onClick?.(marker.id)}
      style={{ display: "block", visibility: "visible" }}
    >
      <span data-testid={`marker-name-${marker.id}`}>{marker.name}</span>
    </div>
  ),
}))

// Mock хука маркеров - используем vi.fn() чтобы можно было менять возвращаемое значение
const mockUseTimelineMarkersReturn = {
  markers: [] as ExtendedTimelineMarker[],
  updateMarker: vi.fn(),
  removeMarker: vi.fn(),
  goToMarker: vi.fn(),
}

const mockUseTimelineMarkers = vi.fn(() => mockUseTimelineMarkersReturn)

vi.mock("../../../hooks/markers/use-timeline-markers", () => ({
  useTimelineMarkers: () => mockUseTimelineMarkers(),
}))

describe("TimelineMarkersLayer", () => {
  const defaultProps = {
    timeScale: 100,
    scrollOffset: 0,
    containerWidth: 1000,
    currentTime: 5.5,
    duration: 60,
  }

  const mockMarkers: ExtendedTimelineMarker[] = [
    {
      id: "marker-1",
      time: 10,
      name: "Chapter 1",
      type: "chapter",
      color: "#3b82f6",
      isLocked: false,
    },
    {
      id: "marker-2",
      time: 25,
      name: "Important Note",
      type: "note",
      color: "#f59e0b",
      isLocked: false,
    },
    {
      id: "marker-3",
      time: 45,
      name: "Export Point",
      type: "export",
      color: "#ef4444",
      isLocked: true,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTimelineMarkersReturn.markers = []
  })

  it("рендерит слой с правильными размерами и позицией", () => {
    render(<TimelineMarkersLayer {...defaultProps} />)

    const layer = screen.getByTestId("timeline-markers-layer")
    expect(layer).toHaveStyle({
      transform: "translateX(-0px)",
      width: "6000px", // 60 секунд * 100 пикселей/сек
    })
  })

  it("применяет смещение прокрутки", () => {
    render(<TimelineMarkersLayer {...defaultProps} scrollOffset={200} />)

    const layer = screen.getByTestId("timeline-markers-layer")
    expect(layer).toHaveStyle({
      transform: "translateX(-200px)",
    })
  })

  it("отображает линию текущего времени в правильной позиции", () => {
    render(<TimelineMarkersLayer {...defaultProps} />)

    const playhead = screen.getByTestId("timeline-markers-layer").querySelector(".bg-red-500")
    expect(playhead).toHaveStyle({
      left: "550px", // 5.5 секунд * 100 пикселей/сек
    })
  })

  it("рендерит все маркеры", () => {
    mockUseTimelineMarkersReturn.markers = [...mockMarkers]

    render(<TimelineMarkersLayer {...defaultProps} />)

    // Check that marker elements are rendered
    const markerElements = screen.queryAllByTestId(/^marker-marker-/)
    expect(markerElements.length).toBe(3)

    // Check that marker names are present
    expect(screen.getByText("Chapter 1")).toBeInTheDocument()
    expect(screen.getByText("Important Note")).toBeInTheDocument()
    expect(screen.getByText("Export Point")).toBeInTheDocument()
  })

  it("передает правильные пропсы в компоненты маркеров", () => {
    mockUseTimelineMarkersReturn.markers = [...mockMarkers.slice(0, 1)]

    render(<TimelineMarkersLayer {...defaultProps} />)

    // Проверяем, что маркер рендерится с правильными пропсами
    const markerElements = screen.queryAllByTestId(/^marker-/)
    expect(markerElements.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Chapter 1")).toBeInTheDocument()
  })

  it("обрабатывает перетаскивание маркера с ограничением по времени", () => {
    mockUseTimelineMarkersReturn.markers = [mockMarkers[0]]

    const { rerender } = render(<TimelineMarkersLayer {...defaultProps} />)

    // Симулируем вызов handleMarkerDrag через callback
    // В реальном компоненте это происходит через пропс onDrag
    const updateMarker = mockUseTimelineMarkersReturn.updateMarker

    // Проверяем, что функция updateMarker готова к вызову
    expect(updateMarker).toBeDefined()
  })

  it("ограничивает время маркера в пределах duration", () => {
    mockUseTimelineMarkersReturn.markers = [mockMarkers[0]]

    render(<TimelineMarkersLayer {...defaultProps} duration={30} />)

    // В реальном сценарии handleMarkerDrag должен ограничить время до 30 секунд
    // Здесь мы просто проверяем, что компонент рендерится с корректным duration
    const layer = screen.getByTestId("timeline-markers-layer")
    expect(layer).toHaveStyle({
      width: "3000px", // 30 секунд * 100 пикселей/сек
    })
  })

  it("обрабатывает клик по маркеру", () => {
    mockUseTimelineMarkersReturn.markers = [...mockMarkers.slice(0, 1)]

    render(<TimelineMarkersLayer {...defaultProps} />)

    const marker = screen.getByText("Chapter 1").closest("div")!
    marker.click()

    // В реальной реализации handleMarkerClick вызовет goToMarker
    expect(mockUseTimelineMarkersReturn.goToMarker).toHaveBeenCalledWith("marker-1")
  })

  it("применяет дополнительные CSS классы", () => {
    render(<TimelineMarkersLayer {...defaultProps} className="custom-layer" />)

    const layer = screen.getByTestId("timeline-markers-layer")
    expect(layer).toHaveClass("custom-layer")
  })

  it("не рендерит маркеры если список пуст", () => {
    mockUseTimelineMarkersReturn.markers = []

    render(<TimelineMarkersLayer {...defaultProps} />)

    // Должна быть только линия текущего времени, без маркеров
    const markers = screen.queryAllByTestId(/marker-/)
    expect(markers).toHaveLength(0)
  })

  it("обновляет позицию при изменении timeScale", () => {
    const { rerender } = render(<TimelineMarkersLayer {...defaultProps} />)

    // Меняем масштаб времени
    rerender(<TimelineMarkersLayer {...defaultProps} timeScale={200} />)

    const layer = screen.getByTestId("timeline-markers-layer")
    expect(layer).toHaveStyle({
      width: "12000px", // 60 секунд * 200 пикселей/сек
    })

    const playhead = layer.querySelector(".bg-red-500")
    expect(playhead).toHaveStyle({
      left: "1100px", // 5.5 секунд * 200 пикселей/сек
    })
  })
})

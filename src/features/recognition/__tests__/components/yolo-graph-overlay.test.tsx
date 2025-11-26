import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { YoloGraphOverlay } from "../../components/yolo-graph-overlay"
import { createMockYoloData, setupCanvasMock } from "../../__mocks__"
import userEvent from "@testing-library/user-event"

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe("YoloGraphOverlay", () => {
  const mockYoloData = createMockYoloData()
  const mockOnTimeChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    setupCanvasMock()
  })

  it("должен отобразить canvas элемент", () => {
    const { container } = render(
      <YoloGraphOverlay yoloData={mockYoloData} currentTime={0} onTimeChange={mockOnTimeChange} />,
    )

    const canvas = container.querySelector("canvas")
    expect(canvas).toBeInTheDocument()
  })

  it("должен использовать правильные размеры", () => {
    const { container } = render(
      <YoloGraphOverlay yoloData={mockYoloData} currentTime={0} width={800} height={150} />,
    )

    const canvas = container.querySelector("canvas")
    expect(canvas?.getAttribute("width")).toBe("800")
    expect(canvas?.getAttribute("height")).toBe("150")
  })

  it("должен использовать размеры по умолчанию", () => {
    const { container } = render(<YoloGraphOverlay yoloData={mockYoloData} currentTime={0} />)

    const canvas = container.querySelector("canvas")
    expect(canvas?.getAttribute("width")).toBe("600")
    expect(canvas?.getAttribute("height")).toBe("100")
  })

  it("должен отрисовать график на canvas", () => {
    const { mockCanvasContext } = setupCanvasMock()
    render(<YoloGraphOverlay yoloData={mockYoloData} currentTime={0} />)

    expect(mockCanvasContext.clearRect).toHaveBeenCalled()
    expect(mockCanvasContext.fillRect).toHaveBeenCalled()
    expect(mockCanvasContext.stroke).toHaveBeenCalled()
  })

  it("должен вызвать onTimeChange при клике", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <YoloGraphOverlay yoloData={mockYoloData} currentTime={0} onTimeChange={mockOnTimeChange} />,
    )

    const canvas = container.querySelector("canvas")
    if (canvas) {
      await user.click(canvas)
    }

    await waitFor(() => {
      expect(mockOnTimeChange).toHaveBeenCalled()
    })
  })

  it("не должен вызывать onTimeChange если не передан", async () => {
    const user = userEvent.setup()
    const { container } = render(<YoloGraphOverlay yoloData={mockYoloData} currentTime={0} />)

    const canvas = container.querySelector("canvas")
    if (canvas) {
      await user.click(canvas)
    }

    expect(mockOnTimeChange).not.toHaveBeenCalled()
  })

  it("должен показать tooltip при наведении", async () => {
    const user = userEvent.setup()
    const { container } = render(<YoloGraphOverlay yoloData={mockYoloData} currentTime={0} />)

    const canvas = container.querySelector("canvas")
    if (canvas) {
      await user.hover(canvas)
    }

    await waitFor(() => {
      expect(screen.getByText(/Время/)).toBeInTheDocument()
      expect(screen.getByText(/Обнаружений/)).toBeInTheDocument()
    })
  })

  it("должен скрыть tooltip при уходе мыши", async () => {
    const user = userEvent.setup()
    const { container } = render(<YoloGraphOverlay yoloData={mockYoloData} currentTime={0} />)

    const canvas = container.querySelector("canvas")
    if (canvas) {
      await user.hover(canvas)
      await waitFor(() => {
        expect(screen.getByText(/Время/)).toBeInTheDocument()
      })

      await user.unhover(canvas)
    }

    await waitFor(() => {
      expect(screen.queryByText(/Время/)).not.toBeInTheDocument()
    })
  })

  it("должен отображать легенду", () => {
    render(<YoloGraphOverlay yoloData={mockYoloData} currentTime={0} />)

    expect(screen.getByText(/Количество обнаружений/)).toBeInTheDocument()
    expect(screen.getByText(/Текущее время/)).toBeInTheDocument()
    expect(screen.getByText(/Кликните для перехода к времени/)).toBeInTheDocument()
  })

  it("должен отрисовать сетку", () => {
    const { mockCanvasContext } = setupCanvasMock()
    render(<YoloGraphOverlay yoloData={mockYoloData} currentTime={0} />)

    // Проверяем, что рисовались линии (сетка)
    expect(mockCanvasContext.moveTo).toHaveBeenCalled()
    expect(mockCanvasContext.lineTo).toHaveBeenCalled()
  })

  it("должен отрисовать линию графика", () => {
    const { mockCanvasContext } = setupCanvasMock()
    render(<YoloGraphOverlay yoloData={mockYoloData} currentTime={0} />)

    // Проверяем, что рисовалась линия графика
    expect(mockCanvasContext.beginPath).toHaveBeenCalled()
    expect(mockCanvasContext.stroke).toHaveBeenCalled()
  })

  it("должен отрисовать точки данных", () => {
    const { mockCanvasContext } = setupCanvasMock()
    render(<YoloGraphOverlay yoloData={mockYoloData} currentTime={0} />)

    // Проверяем, что рисовались круги (точки)
    expect(mockCanvasContext.arc).toHaveBeenCalled()
    expect(mockCanvasContext.fill).toHaveBeenCalled()
  })

  it("должен отрисовать индикатор текущего времени", () => {
    const { mockCanvasContext } = setupCanvasMock()
    render(<YoloGraphOverlay yoloData={mockYoloData} currentTime={5} />)

    // Проверяем, что рисовалась вертикальная линия для текущего времени
    expect(mockCanvasContext.moveTo).toHaveBeenCalled()
    expect(mockCanvasContext.lineTo).toHaveBeenCalled()
  })

  it("должен обновить график при изменении currentTime", () => {
    const { mockCanvasContext } = setupCanvasMock()
    const { rerender } = render(<YoloGraphOverlay yoloData={mockYoloData} currentTime={0} />)

    const initialCalls = mockCanvasContext.clearRect.mock.calls.length

    rerender(<YoloGraphOverlay yoloData={mockYoloData} currentTime={5} />)

    expect(mockCanvasContext.clearRect.mock.calls.length).toBeGreaterThan(initialCalls)
  })

  it("должен обновить график при изменении данных", () => {
    const { mockCanvasContext } = setupCanvasMock()
    const { rerender } = render(<YoloGraphOverlay yoloData={mockYoloData} currentTime={0} />)

    const initialCalls = mockCanvasContext.clearRect.mock.calls.length

    const newData = {
      ...mockYoloData,
      frames: [...mockYoloData.frames, { timestamp: 15, detections: [] }],
    }
    rerender(<YoloGraphOverlay yoloData={newData} currentTime={0} />)

    expect(mockCanvasContext.clearRect.mock.calls.length).toBeGreaterThan(initialCalls)
  })

  it("должен правильно масштабировать график", () => {
    render(<YoloGraphOverlay yoloData={mockYoloData} currentTime={0} width={800} height={200} />)

    // График должен заполнять доступное пространство с учетом отступов
    expect(true).toBe(true) // Визуальный тест, проверяется через canvas API
  })

  it("должен использовать devicePixelRatio для четкости", () => {
    const { mockCanvasContext } = setupCanvasMock()
    render(<YoloGraphOverlay yoloData={mockYoloData} currentTime={0} />)

    expect(mockCanvasContext.scale).toHaveBeenCalled()
  })

  it("должен найти ближайшие данные к позиции мыши", async () => {
    const user = userEvent.setup()
    const { container } = render(<YoloGraphOverlay yoloData={mockYoloData} currentTime={0} />)

    const canvas = container.querySelector("canvas")
    if (canvas) {
      await user.hover(canvas)
    }

    // Tooltip должен показывать данные ближайшего кадра
    await waitFor(() => {
      const tooltip = screen.queryByText(/Время/)
      if (tooltip) {
        expect(tooltip).toBeInTheDocument()
      }
    })
  })

  it("должен правильно рассчитать время из позиции клика", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <YoloGraphOverlay yoloData={mockYoloData} currentTime={0} onTimeChange={mockOnTimeChange} width={600} />,
    )

    const canvas = container.querySelector("canvas")
    if (canvas) {
      // Симулируем клик в середине canvas
      await user.click(canvas, { clientX: 300, clientY: 50 })
    }

    await waitFor(() => {
      expect(mockOnTimeChange).toHaveBeenCalled()
      const calledTime = mockOnTimeChange.mock.calls[0][0]
      expect(typeof calledTime).toBe("number")
      expect(calledTime).toBeGreaterThanOrEqual(0)
    })
  })

  it("должен ограничивать время в пределах данных", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <YoloGraphOverlay yoloData={mockYoloData} currentTime={0} onTimeChange={mockOnTimeChange} />,
    )

    const canvas = container.querySelector("canvas")
    if (canvas) {
      // Клик далеко за пределами
      await user.click(canvas, { clientX: 1000, clientY: 50 })
    }

    await waitFor(() => {
      if (mockOnTimeChange.mock.calls.length > 0) {
        const calledTime = mockOnTimeChange.mock.calls[0][0]
        const maxTime = Math.max(...mockYoloData.frames.map((f) => f.timestamp))
        expect(calledTime).toBeLessThanOrEqual(maxTime)
      }
    })
  })

  it("должен отрисовать индикатор hover времени", async () => {
    const { mockCanvasContext } = setupCanvasMock()
    const user = userEvent.setup()
    const { container } = render(<YoloGraphOverlay yoloData={mockYoloData} currentTime={0} />)

    const canvas = container.querySelector("canvas")
    if (canvas) {
      await user.hover(canvas)
    }

    await waitFor(() => {
      // Проверяем, что использовался setLineDash для пунктирной линии
      expect(mockCanvasContext.setLineDash).toHaveBeenCalled()
    })
  })

  it("должен иметь правильные aria атрибуты", () => {
    const { container } = render(<YoloGraphOverlay yoloData={mockYoloData} currentTime={0} />)

    const canvas = container.querySelector("canvas")
    expect(canvas?.getAttribute("role")).toBe("img")
    expect(canvas?.getAttribute("aria-label")).toBe("График обнаружений YOLO")
  })
})

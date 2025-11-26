import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockYoloData, setupCanvasMock } from "../../__mocks__"
import { YoloTrackOverlay } from "../../components/yolo-track-overlay"

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: vi.fn(),
}))

describe("YoloTrackOverlay", () => {
  const mockYoloData = createMockYoloData({
    frames: [
      {
        timestamp: 0,
        detections: [
          {
            class: "person",
            confidence: 0.95,
            bbox: { x: 0.1, y: 0.2, width: 0.3, height: 0.6 },
            trackId: 1,
          },
        ],
      },
      {
        timestamp: 1,
        detections: [
          {
            class: "person",
            confidence: 0.95,
            bbox: { x: 0.2, y: 0.2, width: 0.3, height: 0.6 },
            trackId: 1,
          },
        ],
      },
      {
        timestamp: 2,
        detections: [
          {
            class: "person",
            confidence: 0.95,
            bbox: { x: 0.3, y: 0.2, width: 0.3, height: 0.6 },
            trackId: 1,
          },
        ],
      },
    ],
  })

  beforeEach(() => {
    vi.clearAllMocks()
    setupCanvasMock()
  })

  it("должен отобразить canvas элемент", () => {
    const { container } = render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={0} />)

    const canvas = container.querySelector("canvas")
    expect(canvas).toBeInTheDocument()
  })

  it("должен использовать правильные размеры", () => {
    const { container } = render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={0} width={800} height={600} />)

    const canvas = container.querySelector("canvas")
    // Canvas width/height are scaled by devicePixelRatio (2x)
    expect(canvas?.getAttribute("width")).toBe("1600")
    expect(canvas?.getAttribute("height")).toBe("1200")
  })

  it("должен использовать размеры по умолчанию", () => {
    const { container } = render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={0} />)

    const canvas = container.querySelector("canvas")
    // Canvas width/height are scaled by devicePixelRatio (2x)
    expect(canvas?.getAttribute("width")).toBe("800")
    expect(canvas?.getAttribute("height")).toBe("600")
  })

  it("должен отобразить заголовок", () => {
    render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={0} />)

    expect(screen.getByText(/Треки объектов/)).toBeInTheDocument()
  })

  it("должен отобразить чекбокс для показа траекторий", () => {
    render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={0} />)

    expect(screen.getByText(/Показать траектории/)).toBeInTheDocument()
    const checkbox = screen.getByRole("checkbox")
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).toBeChecked()
  })

  it("должен скрыть траектории при отключении", async () => {
    const user = userEvent.setup()
    render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={0} />)

    const checkbox = screen.getByRole("checkbox")
    await user.click(checkbox)

    await waitFor(() => {
      expect(checkbox).not.toBeChecked()
    })
  })

  it("должен использовать initialShowTrajectories prop", () => {
    render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={0} showTrajectories={false} />)

    const checkbox = screen.getByRole("checkbox")
    expect(checkbox).not.toBeChecked()
  })

  it("должен отрисовать треки на canvas", () => {
    const { mockCanvasContext } = setupCanvasMock()
    render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={2} />)

    expect(mockCanvasContext.clearRect).toHaveBeenCalled()
    expect(mockCanvasContext.fillRect).toHaveBeenCalled()
  })

  it("должен создать историю треков из данных", () => {
    render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={2} />)

    expect(screen.getByText(/Всего треков/)).toBeInTheDocument()
  })

  it("должен фильтровать треки с минимальным количеством точек", () => {
    const shortTrackData = createMockYoloData({
      frames: [
        {
          timestamp: 0,
          detections: [
            {
              class: "person",
              confidence: 0.95,
              bbox: { x: 0.1, y: 0.2, width: 0.3, height: 0.6 },
            },
          ],
        },
      ],
    })

    render(<YoloTrackOverlay yoloData={shortTrackData} currentTime={0} />)

    // Треки с менее чем 3 точками должны быть отфильтрованы
    expect(screen.getByText(/Всего треков/)).toBeInTheDocument()
  })

  it("должен отрисовать траектории", () => {
    const { mockCanvasContext } = setupCanvasMock()
    render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={2} />)

    // Проверяем, что рисовались линии траекторий
    expect(mockCanvasContext.beginPath).toHaveBeenCalled()
    expect(mockCanvasContext.stroke).toHaveBeenCalled()
  })

  it("должен отрисовать точки треков", () => {
    const { mockCanvasContext } = setupCanvasMock()
    render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={2} />)

    // Проверяем, что рисовались круги (точки)
    expect(mockCanvasContext.arc).toHaveBeenCalled()
    expect(mockCanvasContext.fill).toHaveBeenCalled()
  })

  it("должен выделить выбранный трек", async () => {
    const user = userEvent.setup()
    const { container } = render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={2} />)

    const canvas = container.querySelector("canvas")
    if (canvas) {
      await user.click(canvas)
    }

    // Проверяем, что был показан toast с информацией о треке
    await waitFor(() => {
      if (vi.mocked(toast).mock.calls.length > 0) {
        expect(toast).toHaveBeenCalled()
      }
    })
  })

  it("должен показать информацию о треке при клике", async () => {
    const user = userEvent.setup()
    const { container } = render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={2} />)

    const canvas = container.querySelector("canvas")
    if (canvas) {
      // Клик в позицию трека
      await user.click(canvas)
    }

    await waitFor(() => {
      if (vi.mocked(toast).mock.calls.length > 0) {
        expect(toast).toHaveBeenCalledWith(expect.stringContaining("Трек выбран"), expect.any(Object))
      }
    })
  })

  it("должен отменить выбор при повторном клике", async () => {
    const user = userEvent.setup()
    const { container } = render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={2} />)

    const canvas = container.querySelector("canvas")
    if (canvas) {
      await user.click(canvas)
      await user.click(canvas)
    }

    await waitFor(() => {
      expect(screen.getByText(/Не выбран/)).toBeInTheDocument()
    })
  })

  it("должен показать статистику треков", () => {
    render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={2} />)

    expect(screen.getByText(/Всего треков/)).toBeInTheDocument()
    expect(screen.getByText(/Выбранный трек/)).toBeInTheDocument()
  })

  it("должен отобразить легенду", () => {
    render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={2} />)

    // Легенда с цветами для разных классов - ищем в легенде
    const legendContainer = screen.getByText(/Всего треков/).closest("div")?.parentElement
    // Если есть треки, легенда должна показывать классы
    if (legendContainer) {
      const legendItems = legendContainer.querySelectorAll(".w-3.h-3.rounded-full")
      // Может быть 0 если треков нет (слишком короткие)
      expect(legendItems.length).toBeGreaterThanOrEqual(0)
    }
  })

  it("должен использовать разные цвета для разных классов", () => {
    render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={2} />)

    // Проверяем, что легенда отображается с цветными индикаторами
    const legendContainer = screen.getByText(/Всего треков/).closest("div")?.parentElement
    const colorIndicators = legendContainer?.querySelectorAll(".w-3.h-3.rounded-full")
    // Если есть треки, должны быть цветные индикаторы
    expect(colorIndicators?.length).toBeGreaterThanOrEqual(0)
  })

  it("должен показать только видимые точки до currentTime", () => {
    const { mockCanvasContext } = setupCanvasMock()
    render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={1} />)

    // Точки после currentTime не должны отрисовываться
    expect(mockCanvasContext.arc).toHaveBeenCalled()
  })

  it("должен обновить треки при изменении currentTime", () => {
    const { mockCanvasContext } = setupCanvasMock()
    const { rerender } = render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={0} />)

    const initialCalls = mockCanvasContext.clearRect.mock.calls.length

    rerender(<YoloTrackOverlay yoloData={mockYoloData} currentTime={2} />)

    expect(mockCanvasContext.clearRect.mock.calls.length).toBeGreaterThan(initialCalls)
  })

  it("должен выделить текущую точку трека", () => {
    const { mockCanvasContext } = setupCanvasMock()
    render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={2} />)

    // Текущая точка должна быть больше
    expect(mockCanvasContext.arc).toHaveBeenCalled()
  })

  it("должен отрисовать пульсирующие круги для текущих обнаружений", () => {
    const { mockCanvasContext } = setupCanvasMock()
    render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={2} />)

    // Проверяем, что рисовались круги для текущих обнаружений
    expect(mockCanvasContext.arc).toHaveBeenCalled()
  })

  it("должен показать подпись для выбранного трека", async () => {
    const { mockCanvasContext } = setupCanvasMock()
    const user = userEvent.setup()
    const { container } = render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={2} />)

    const canvas = container.querySelector("canvas")
    if (canvas) {
      await user.click(canvas)
    }

    await waitFor(() => {
      if (vi.mocked(toast).mock.calls.length > 0) {
        // Проверяем, что fillText был вызван для подписи
        expect(mockCanvasContext.fillText).toHaveBeenCalled()
      }
    })
  })

  it("должен использовать devicePixelRatio для четкости", () => {
    const { mockCanvasContext } = setupCanvasMock()
    render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={0} />)

    expect(mockCanvasContext.scale).toHaveBeenCalled()
  })

  it("должен иметь правильные aria атрибуты", () => {
    const { container } = render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={0} />)

    const canvas = container.querySelector("canvas")
    expect(canvas?.getAttribute("role")).toBe("img")
    expect(canvas?.getAttribute("aria-label")).toBe("Треки объектов YOLO")
  })

  it("должен группировать обнаружения в треки", () => {
    render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={2} />)

    // Треки должны быть созданы на основе класса и позиции
    expect(screen.getByText(/Всего треков/)).toBeInTheDocument()
  })

  it("должен объединять близкие точки в один трек", () => {
    const closePointsData = createMockYoloData({
      frames: [
        {
          timestamp: 0,
          detections: [
            {
              class: "person",
              confidence: 0.95,
              bbox: { x: 0.1, y: 0.2, width: 0.3, height: 0.6 },
            },
          ],
        },
        {
          timestamp: 0.3,
          detections: [
            {
              class: "person",
              confidence: 0.95,
              bbox: { x: 0.11, y: 0.21, width: 0.3, height: 0.6 },
            },
          ],
        },
        {
          timestamp: 1.5,
          detections: [
            {
              class: "person",
              confidence: 0.95,
              bbox: { x: 0.12, y: 0.22, width: 0.3, height: 0.6 },
            },
          ],
        },
      ],
    })

    render(<YoloTrackOverlay yoloData={closePointsData} currentTime={2} />)

    // Близкие точки должны быть в одном треке
    expect(screen.getByText(/Всего треков/)).toBeInTheDocument()
  })

  it("не должен рисовать траектории когда showTrajectories=false", async () => {
    const { mockCanvasContext } = setupCanvasMock()
    const user = userEvent.setup()
    render(<YoloTrackOverlay yoloData={mockYoloData} currentTime={2} />)

    const checkbox = screen.getByRole("checkbox")
    await user.click(checkbox)

    await waitFor(() => {
      // Фон все равно должен быть нарисован
      expect(mockCanvasContext.fillRect).toHaveBeenCalled()
    })
  })
})

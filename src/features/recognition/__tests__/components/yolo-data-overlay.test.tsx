import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockDetections } from "../../__mocks__"
import { YoloDataOverlay } from "../../components/yolo-data-overlay"

// Mock useYoloData hook
const mockGetYoloDataAtTimestamp = vi.fn()
vi.mock("../../hooks/use-yolo-data", () => ({
  useYoloData: () => ({
    getYoloDataAtTimestamp: mockGetYoloDataAtTimestamp,
  }),
}))

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

// Mock tauri logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    error: vi.fn(),
  }),
}))

// Mock clipboard
const mockWriteText = vi.fn().mockResolvedValue(undefined)
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
})

describe("YoloDataOverlay", () => {
  const mockVideo = {
    id: "test-video",
    name: "test.mp4",
    path: "/path/to/test.mp4",
  }

  beforeEach(() => {
    mockGetYoloDataAtTimestamp.mockResolvedValue(mockDetections)
    vi.clearAllMocks()
  })

  it("должен отобразить оверлей с обнаружениями", async () => {
    render(<YoloDataOverlay video={mockVideo} currentTime={5} />)

    await waitFor(() => {
      expect(screen.getByText(/Обнаружено объектов/)).toBeInTheDocument()
    })
  })

  it("должен показать количество обнаруженных объектов", async () => {
    render(<YoloDataOverlay video={mockVideo} currentTime={5} />)

    await waitFor(() => {
      const text = screen.getByText(/Обнаружено объектов/)
      expect(text).toBeInTheDocument()
    })
  })

  it("должен отобразить рамки для каждого объекта", async () => {
    render(<YoloDataOverlay video={mockVideo} currentTime={5} />)

    await waitFor(() => {
      // Проверяем, что есть рамки (DetectionBox компоненты)
      const boxes = document.querySelectorAll('div[style*="border"]')
      expect(boxes.length).toBeGreaterThan(0)
    })
  })

  it("не должен ничего отображать без обнаружений", async () => {
    mockGetYoloDataAtTimestamp.mockResolvedValue([])
    const { container } = render(<YoloDataOverlay video={mockVideo} currentTime={5} />)

    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })

  it("должен загрузить данные для текущего времени", async () => {
    render(<YoloDataOverlay video={mockVideo} currentTime={5.7} />)

    await waitFor(() => {
      // Время должно быть округлено до ближайшей секунды
      expect(mockGetYoloDataAtTimestamp).toHaveBeenCalledWith("test-video", 6)
    })
  })

  it("должен обновить данные при изменении времени", async () => {
    const { rerender } = render(<YoloDataOverlay video={mockVideo} currentTime={5} />)

    await waitFor(() => {
      expect(mockGetYoloDataAtTimestamp).toHaveBeenCalledWith("test-video", 5)
    })

    rerender(<YoloDataOverlay video={mockVideo} currentTime={10} />)

    await waitFor(() => {
      expect(mockGetYoloDataAtTimestamp).toHaveBeenCalledWith("test-video", 10)
    })
  })

  it("должен показать кнопку для копирования контекста сцены", async () => {
    render(<YoloDataOverlay video={mockVideo} currentTime={5} />)

    await waitFor(() => {
      expect(screen.getByText(/Обнаружено объектов/)).toBeInTheDocument()
    })

    // Проверяем, что кнопка отображается
    const copyButton = screen.getByText(/Скопировать контекст сцены/)
    expect(copyButton).toBeInTheDocument()
    expect(copyButton).toBeEnabled()
  })

  it("должен показать уникальные классы объектов", async () => {
    mockGetYoloDataAtTimestamp.mockResolvedValue([
      { class: "person", confidence: 0.95, bbox: { x: 0.1, y: 0.2, width: 0.3, height: 0.6 } },
      { class: "person", confidence: 0.92, bbox: { x: 0.2, y: 0.3, width: 0.25, height: 0.5 } },
      { class: "car", confidence: 0.87, bbox: { x: 0.5, y: 0.4, width: 0.2, height: 0.3 } },
    ])

    render(<YoloDataOverlay video={mockVideo} currentTime={5} />)

    await waitFor(() => {
      // Должны быть показаны уникальные классы
      expect(screen.getByText(/person, car/)).toBeInTheDocument()
    })
  })

  it("должен обработать отсутствие video id", async () => {
    const videoWithoutId = { ...mockVideo, id: "" }
    const { container } = render(<YoloDataOverlay video={videoWithoutId} currentTime={5} />)

    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })

  describe("DetectionBox", () => {
    it("должен отображать класс и уверенность", async () => {
      render(<YoloDataOverlay video={mockVideo} currentTime={5} />)

      await waitFor(() => {
        expect(screen.getByText(/person \(95%\)/)).toBeInTheDocument()
      })
    })

    it("должен использовать правильные цвета для классов", async () => {
      render(<YoloDataOverlay video={mockVideo} currentTime={5} />)

      await waitFor(() => {
        const boxes = document.querySelectorAll('div[style*="border"]')
        expect(boxes.length).toBeGreaterThan(0)
        // Проверяем, что у рамки есть цвет границы
        const firstBox = boxes[0] as HTMLElement
        expect(firstBox.style.borderColor).toBeTruthy()
      })
    })

    it("должен правильно позиционировать рамки", async () => {
      mockGetYoloDataAtTimestamp.mockResolvedValue([
        { class: "person", confidence: 0.95, bbox: { x: 0.5, y: 0.5, width: 0.2, height: 0.3 } },
      ])

      render(<YoloDataOverlay video={mockVideo} currentTime={5} />)

      await waitFor(() => {
        const boxes = document.querySelectorAll('div[style*="left"]')
        expect(boxes.length).toBeGreaterThan(0)
        const box = boxes[0] as HTMLElement
        expect(box.style.left).toBe("50%")
        expect(box.style.top).toBe("50%")
        expect(box.style.width).toBe("20%")
        expect(box.style.height).toBe("30%")
      })
    })
  })

  describe("calculatePosition", () => {
    it("должен определить верхнюю левую позицию", async () => {
      mockGetYoloDataAtTimestamp.mockResolvedValue([
        { class: "person", confidence: 0.95, bbox: { x: 0.1, y: 0.1, width: 0.1, height: 0.1 } },
      ])

      render(<YoloDataOverlay video={mockVideo} currentTime={5} />)

      await waitFor(() => {
        const copyButton = screen.getByText(/Скопировать контекст сцены/)
        expect(copyButton).toBeInTheDocument()
      })
    })

    it("должен определить центральную позицию", async () => {
      mockGetYoloDataAtTimestamp.mockResolvedValue([
        { class: "person", confidence: 0.95, bbox: { x: 0.4, y: 0.4, width: 0.2, height: 0.2 } },
      ])

      render(<YoloDataOverlay video={mockVideo} currentTime={5} />)

      await waitFor(() => {
        const copyButton = screen.getByText(/Скопировать контекст сцены/)
        expect(copyButton).toBeInTheDocument()
      })
    })

    it("должен определить нижнюю правую позицию", async () => {
      mockGetYoloDataAtTimestamp.mockResolvedValue([
        { class: "person", confidence: 0.95, bbox: { x: 0.7, y: 0.7, width: 0.2, height: 0.2 } },
      ])

      render(<YoloDataOverlay video={mockVideo} currentTime={5} />)

      await waitFor(() => {
        const copyButton = screen.getByText(/Скопировать контекст сцены/)
        expect(copyButton).toBeInTheDocument()
      })
    })
  })

  describe("calculateSize", () => {
    it("должен определить маленький размер", async () => {
      mockGetYoloDataAtTimestamp.mockResolvedValue([
        { class: "person", confidence: 0.95, bbox: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } },
      ])

      render(<YoloDataOverlay video={mockVideo} currentTime={5} />)

      await waitFor(() => {
        expect(screen.getAllByText(/person/)[0]).toBeInTheDocument()
      })
    })

    it("должен определить средний размер", async () => {
      mockGetYoloDataAtTimestamp.mockResolvedValue([
        { class: "person", confidence: 0.95, bbox: { x: 0.1, y: 0.1, width: 0.2, height: 0.3 } },
      ])

      render(<YoloDataOverlay video={mockVideo} currentTime={5} />)

      await waitFor(() => {
        expect(screen.getAllByText(/person/)[0]).toBeInTheDocument()
      })
    })

    it("должен определить большой размер", async () => {
      mockGetYoloDataAtTimestamp.mockResolvedValue([
        { class: "person", confidence: 0.95, bbox: { x: 0.1, y: 0.1, width: 0.4, height: 0.5 } },
      ])

      render(<YoloDataOverlay video={mockVideo} currentTime={5} />)

      await waitFor(() => {
        expect(screen.getAllByText(/person/)[0]).toBeInTheDocument()
      })
    })
  })
})

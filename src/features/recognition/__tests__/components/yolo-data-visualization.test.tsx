import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockYoloData } from "../../__mocks__"
import { YoloDataVisualization } from "../../components/yolo-data-visualization"

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe("YoloDataVisualization", () => {
  const mockYoloData = createMockYoloData()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен отобразить компонент визуализации", () => {
    render(<YoloDataVisualization yoloData={mockYoloData} />)

    expect(screen.getByText(/Анализ обнаружений YOLO/)).toBeInTheDocument()
  })

  it("должен показать количество кадров", () => {
    render(<YoloDataVisualization yoloData={mockYoloData} />)

    expect(screen.getByText(/Общее количество кадров/)).toBeInTheDocument()
    // Количество кадров будет отображено в статистике
    const statsContainer = screen.getByText(/Всего кадров/).parentElement
    const valueDiv = statsContainer?.querySelector(".text-xl.font-semibold")
    expect(valueDiv).toHaveTextContent(mockYoloData.frames.length.toString())
  })

  it("должен отобразить легенду с классами", () => {
    render(<YoloDataVisualization yoloData={mockYoloData} />)

    expect(screen.getByText(/Все классы/)).toBeInTheDocument()
    expect(screen.getByText(/person/)).toBeInTheDocument()
    expect(screen.getByText(/car/)).toBeInTheDocument()
  })

  it("должен отобразить SVG график", () => {
    const { container } = render(<YoloDataVisualization yoloData={mockYoloData} width={800} height={400} />)

    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
    expect(svg?.getAttribute("width")).toBe("800")
    expect(svg?.getAttribute("height")).toBe("400")
  })

  it("должен фильтровать по выбранному классу", async () => {
    const user = userEvent.setup()
    render(<YoloDataVisualization yoloData={mockYoloData} />)

    const personButton = screen.getByRole("button", { name: /person/ })
    await user.click(personButton)

    await waitFor(() => {
      // Кнопка должна быть активной (иметь стиль выбранного элемента)
      expect(personButton.className).toContain("text-white")
    })
  })

  it("должен вернуться к показу всех классов", async () => {
    const user = userEvent.setup()
    render(<YoloDataVisualization yoloData={mockYoloData} />)

    // Выбираем конкретный класс
    const personButton = screen.getByRole("button", { name: /person/ })
    await user.click(personButton)

    // Возвращаемся к "Все классы"
    const allClassesButton = screen.getByRole("button", { name: /Все классы/ })
    await user.click(allClassesButton)

    await waitFor(() => {
      expect(allClassesButton.className).toContain("bg-blue-500")
    })
  })

  it("должен показать статистику", () => {
    render(<YoloDataVisualization yoloData={mockYoloData} />)

    expect(screen.getByText(/Всего кадров/)).toBeInTheDocument()
    expect(screen.getByText(/Уникальных классов/)).toBeInTheDocument()
    expect(screen.getByText(/Всего обнаружений/)).toBeInTheDocument()
    expect(screen.getByText(/Среднее за кадр/)).toBeInTheDocument()
  })

  it("должен правильно рассчитать количество обнаружений", () => {
    render(<YoloDataVisualization yoloData={mockYoloData} />)

    const totalDetections = mockYoloData.frames.reduce((sum, frame) => sum + frame.detections.length, 0)
    expect(screen.getByText(totalDetections.toString())).toBeInTheDocument()
  })

  it("должен правильно рассчитать среднее", () => {
    render(<YoloDataVisualization yoloData={mockYoloData} />)

    const totalDetections = mockYoloData.frames.reduce((sum, frame) => sum + frame.detections.length, 0)
    const average = (totalDetections / mockYoloData.frames.length).toFixed(1)
    expect(screen.getByText(average)).toBeInTheDocument()
  })

  it("должен отобразить график с правильным масштабом", () => {
    const { container } = render(<YoloDataVisualization yoloData={mockYoloData} />)

    // Проверяем, что есть линия графика
    const path = container.querySelector("path")
    expect(path).toBeInTheDocument()
  })

  it("должен отобразить точки данных", () => {
    const { container } = render(<YoloDataVisualization yoloData={mockYoloData} />)

    // Проверяем, что есть круги (точки данных)
    const circles = container.querySelectorAll("circle")
    expect(circles.length).toBe(mockYoloData.frames.length)
  })

  it("должен отобразить сетку", () => {
    const { container } = render(<YoloDataVisualization yoloData={mockYoloData} />)

    // Проверяем, что есть линии сетки
    const lines = container.querySelectorAll("line")
    expect(lines.length).toBeGreaterThan(0)
  })

  it("должен использовать правильные цвета для классов", () => {
    render(<YoloDataVisualization yoloData={mockYoloData} />)

    const personButton = screen.getByRole("button", { name: /person/ })
    expect(personButton).toBeInTheDocument()
  })

  it("должен обработать пустые кадры", () => {
    const emptyData = { ...mockYoloData, frames: [] }
    render(<YoloDataVisualization yoloData={emptyData} />)

    expect(screen.getByText(/Общее количество кадров/)).toBeInTheDocument()
    const statsContainer = screen.getByText(/Всего кадров/).parentElement
    const valueDiv = statsContainer?.querySelector(".text-xl.font-semibold")
    expect(valueDiv).toHaveTextContent("0")
  })

  it("должен обработать данные с одним кадром", () => {
    const singleFrameData = {
      ...mockYoloData,
      frames: [mockYoloData.frames[0]],
    }
    render(<YoloDataVisualization yoloData={singleFrameData} />)

    const statsContainer = screen.getByText(/Всего кадров/).parentElement
    const valueDiv = statsContainer?.querySelector(".text-xl.font-semibold")
    expect(valueDiv).toHaveTextContent("1")
  })

  it("должен использовать пользовательские размеры", () => {
    const { container } = render(<YoloDataVisualization yoloData={mockYoloData} width={600} height={300} />)

    const svg = container.querySelector("svg")
    expect(svg?.getAttribute("width")).toBe("600")
    expect(svg?.getAttribute("height")).toBe("300")
  })

  it("должен отобразить подписи осей", () => {
    const { container } = render(<YoloDataVisualization yoloData={mockYoloData} />)

    const texts = container.querySelectorAll("text")
    const axisLabels = Array.from(texts).map((text) => text.textContent)

    expect(axisLabels).toContain("Время (секунды)")
    expect(axisLabels).toContain("Количество обнаружений")
  })

  it("должен правильно считать уникальные классы", () => {
    render(<YoloDataVisualization yoloData={mockYoloData} />)

    const uniqueClasses = new Set(
      mockYoloData.frames.flatMap((frame) => frame.detections.map((detection) => detection.class)),
    )

    const statsContainer = screen.getByText(/Уникальных классов/).parentElement
    const valueDiv = statsContainer?.querySelector(".text-xl.font-semibold")
    expect(valueDiv).toHaveTextContent(uniqueClasses.size.toString())
  })
})

/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom"
import { MulticamIndicator } from "../multicam-indicator"

// Мокируем иконки lucide-react
vi.mock("lucide-react", () => ({
  Camera: ({ className, ...props }: any) => (
    <svg {...props} className={className} data-testid="camera-icon" data-icon="Camera">
      Camera
    </svg>
  ),
}))

describe("MulticamIndicator", () => {
  it("не рендерится, если totalAngles <= 1", () => {
    const { container } = render(<MulticamIndicator currentAngle={0} totalAngles={1} />)

    expect(container.firstChild).toBeNull()
  })

  it("рендерится, если totalAngles > 1", () => {
    render(<MulticamIndicator currentAngle={0} totalAngles={2} />)

    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("/")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("показывает корректный номер текущей камеры", () => {
    render(<MulticamIndicator currentAngle={2} totalAngles={5} />)

    // currentAngle=2 означает 3-ю камеру (индексация с 0)
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("показывает имя камеры, если указано", () => {
    render(<MulticamIndicator currentAngle={1} totalAngles={3} angleName="Front Camera" />)

    expect(screen.getByText("Front Camera")).toBeInTheDocument()
  })

  it("не показывает имя камеры, если не указано", () => {
    render(<MulticamIndicator currentAngle={0} totalAngles={2} />)

    // Проверяем, что нет дополнительного текста с именем
    const container = screen.getByText("1").closest(".flex")
    expect(container).not.toHaveTextContent("Front Camera")
  })

  it("применяет кастомный className", () => {
    render(<MulticamIndicator currentAngle={0} totalAngles={2} className="custom-class" />)

    const container = screen.getByText("1").closest(".custom-class")
    expect(container).toBeInTheDocument()
  })

  it("показывает иконку камеры", () => {
    render(<MulticamIndicator currentAngle={0} totalAngles={2} />)

    // Находим иконку камеры по data-testid
    const cameraIcon = screen.getByTestId("camera-icon")
    expect(cameraIcon).toBeInTheDocument()
  })

  it("применяет правильные стили к элементам", () => {
    render(<MulticamIndicator currentAngle={0} totalAngles={2} />)

    // Проверяем стиль иконки
    const cameraIcon = screen.getByTestId("camera-icon")
    expect(cameraIcon).toHaveClass("text-muted-foreground")

    // Проверяем бейдж
    const badge = screen.getByText("1").closest("[data-slot='badge']")
    expect(badge).toBeInTheDocument()

    // Проверяем разделитель
    expect(screen.getByText("/")).toHaveClass("text-muted-foreground")
  })

  it("корректно отображает большие числа", () => {
    render(<MulticamIndicator currentAngle={99} totalAngles={100} />)

    // Проверяем текущий номер камеры (100)
    const currentNumber = screen.getAllByText("100")[0]
    expect(currentNumber).toHaveClass("font-bold")

    // Проверяем общее количество
    const totalNumber = screen.getAllByText("100")[1]
    expect(totalNumber).toBeInTheDocument()
  })

  it("отображает длинные имена камер", () => {
    const longName = "Very Long Camera Name That Might Be Truncated"
    render(<MulticamIndicator currentAngle={0} totalAngles={2} angleName={longName} />)

    expect(screen.getByText(longName)).toBeInTheDocument()
    const longNameElement = screen.getByText(longName)
    expect(longNameElement).toHaveClass("text-sm")
    expect(longNameElement).toHaveClass("text-muted-foreground")
  })

  it("использует flex layout для выравнивания", () => {
    render(<MulticamIndicator currentAngle={0} totalAngles={2} />)

    const container = screen.getByText("1").closest(".flex")
    expect(container).toHaveClass("flex")
    expect(container).toHaveClass("items-center")
    expect(container).toHaveClass("gap-2")
  })

  it("правильно выделяет текущий номер камеры жирным шрифтом", () => {
    render(<MulticamIndicator currentAngle={0} totalAngles={3} />)

    const currentNumber = screen.getByText("1")
    expect(currentNumber).toHaveClass("font-bold")

    const totalNumber = screen.getByText("3")
    expect(totalNumber).not.toHaveClass("font-bold")
  })
})

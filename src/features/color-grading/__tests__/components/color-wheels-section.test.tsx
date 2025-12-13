/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ColorWheelsSection } from "../../components/color-wheels/color-wheels-section"

// Мокаем хук useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}))

// Мокаем ColorWheel компонент
vi.mock("../../components/color-wheels/color-wheel", () => ({
  ColorWheel: ({ type, label, onChange }: any) => (
    <div data-testid={`color-wheel-${type}`}>
      <span>{label}</span>
      <button onClick={() => onChange({ r: 0.5, g: 0.5, b: 0.5 })}>Change {type}</button>
    </div>
  ),
}))

// Мокаем ParameterSlider компонент
vi.mock("../../components/controls/parameter-slider", () => ({
  ParameterSlider: ({ label, value, onChange }: any) => (
    <div data-testid={`parameter-slider-${label}`}>
      <span>{label}</span>
      <input
        type="range"
        value={value.toString()}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </div>
  ),
}))

// Мокаем ColorGradingContext
const mockContextValue = {
  state: {
    colorWheels: {
      lift: { r: 0, g: 0, b: 0 },
      gamma: { r: 0, g: 0, b: 0 },
      gain: { r: 0, g: 0, b: 0 },
    },
    basicParameters: {
      temperature: 0,
      tint: 0,
      contrast: 0,
      saturation: 0,
    },
  },
  updateColorWheel: vi.fn(),
  updateBasicParameter: vi.fn(),
}

const mockUseColorGradingContext = vi.fn(() => mockContextValue)

vi.mock("../../services/color-grading-provider", () => {
  return {
    useColorGradingContext: () => mockUseColorGradingContext(),
  }
})

describe("ColorWheelsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock to default value
    mockUseColorGradingContext.mockReturnValue(mockContextValue)
  })

  it("should render color wheels section", () => {
    render(<ColorWheelsSection />)

    expect(screen.getByTestId("color-wheels-section")).toBeInTheDocument()
  })

  it("should render description text", () => {
    render(<ColorWheelsSection />)

    expect(screen.getByText("Adjust shadows (Lift), midtones (Gamma), and highlights (Gain)")).toBeInTheDocument()
  })

  it("should render all three color wheels", () => {
    render(<ColorWheelsSection />)

    expect(screen.getByTestId("color-wheel-lift")).toBeInTheDocument()
    expect(screen.getByTestId("color-wheel-gamma")).toBeInTheDocument()
    expect(screen.getByTestId("color-wheel-gain")).toBeInTheDocument()

    expect(screen.getByText("Lift (Shadows)")).toBeInTheDocument()
    expect(screen.getByText("Gamma (Midtones)")).toBeInTheDocument()
    expect(screen.getByText("Gain (Highlights)")).toBeInTheDocument()
  })

  it("should call updateColorWheel when color wheel changes", async () => {
    const user = userEvent.setup()
    render(<ColorWheelsSection />)

    await user.click(screen.getByText("Change lift"))

    expect(mockContextValue.updateColorWheel).toHaveBeenCalledWith("lift", { r: 0.5, g: 0.5, b: 0.5 })
  })

  it("should render all parameter sliders", () => {
    render(<ColorWheelsSection />)

    expect(screen.getByTestId("parameter-slider-Temperature")).toBeInTheDocument()
    expect(screen.getByTestId("parameter-slider-Tint")).toBeInTheDocument()
    expect(screen.getByTestId("parameter-slider-Contrast")).toBeInTheDocument()
    expect(screen.getByTestId("parameter-slider-Saturation")).toBeInTheDocument()
  })

  it("should call updateBasicParameter when slider changes", async () => {
    const user = userEvent.setup()
    render(<ColorWheelsSection />)

    const temperatureSlider = screen.getByLabelText("Temperature")
    // Для range input используем fireEvent вместо user.clear/type
    fireEvent.change(temperatureSlider, { target: { value: "50" } })

    expect(mockContextValue.updateBasicParameter).toHaveBeenCalledWith("temperature", 50)
  })

  it("should pass correct values from state to components", () => {
    // Create a new mock context value for this test
    const testMockContextValue = {
      state: {
        colorWheels: {
          lift: { r: 0.1, g: 0.2, b: 0.3 },
          gamma: { r: 0.4, g: 0.5, b: 0.6 },
          gain: { r: 0.7, g: 0.8, b: 0.9 },
        },
        basicParameters: {
          temperature: 25,
          tint: -10,
          contrast: 15,
          saturation: 30,
        },
      },
      updateColorWheel: vi.fn(),
      updateBasicParameter: vi.fn(),
    }

    // Mock the context to return our test values
    mockUseColorGradingContext.mockReturnValueOnce(testMockContextValue)

    render(<ColorWheelsSection />)

    // Debug: Давайте проверим, что находится на экране
    const temperatureSlider = screen.getByLabelText("Temperature")
    const tintSlider = screen.getByLabelText("Tint")

    // Проверим атрибут value напрямую
    expect(temperatureSlider).toHaveAttribute("value", "25")
    expect(tintSlider).toHaveAttribute("value", "-10")
    expect(screen.getByLabelText("Contrast")).toHaveAttribute("value", "15")
    expect(screen.getByLabelText("Saturation")).toHaveAttribute("value", "30")
  })

  it("should handle multiple parameter updates and color wheel changes", async () => {
    const user = userEvent.setup()
    render(<ColorWheelsSection />)

    // Test temperature update
    const temperatureSlider = screen.getByLabelText("Temperature")
    fireEvent.change(temperatureSlider, { target: { value: "75" } })
    expect(mockContextValue.updateBasicParameter).toHaveBeenLastCalledWith("temperature", 75)

    // Test color wheel click
    await user.click(screen.getByText("Change gamma"))
    expect(mockContextValue.updateColorWheel).toHaveBeenLastCalledWith("gamma", { r: 0.5, g: 0.5, b: 0.5 })

    // Test that we can interact with all controls
    expect(screen.getByLabelText("Tint")).toBeInTheDocument()
    expect(screen.getByLabelText("Contrast")).toBeInTheDocument()
    expect(screen.getByLabelText("Saturation")).toBeInTheDocument()
    expect(screen.getByText("Change lift")).toBeInTheDocument()
    expect(screen.getByText("Change gain")).toBeInTheDocument()
  })
})

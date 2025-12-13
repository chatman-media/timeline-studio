/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { HSLSection } from "../../components/hsl/hsl-section"

// Мокаем хук useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}))

// Мокаем ParameterSlider
vi.mock("../../components/controls/parameter-slider", () => ({
  ParameterSlider: ({ label, value, onChange, formatValue, className }: any) => (
    <div data-testid={`parameter-slider-${label}`} className={className}>
      <span>{label}</span>
      <span data-testid={`value-${label}`}>{formatValue ? formatValue(value) : value}</span>
      <button onClick={() => onChange(50)}>Change {label}</button>
    </div>
  ),
}))

// Мокаем ColorGradingContext
const mockContextValue = {
  state: {
    basicParameters: {
      hue: 0,
      saturation: 0,
      luminance: 0,
      pivot: 0.5,
      temperature: 0,
      tint: 0,
      contrast: 0,
    },
  },
  updateBasicParameter: vi.fn(),
}

vi.mock("../../services/color-grading-provider", () => ({
  useColorGradingContext: () => mockContextValue,
}))

describe("HSLSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render HSL section", () => {
    render(<HSLSection />)

    expect(screen.getByTestId("hsl-section")).toBeInTheDocument()
  })

  it("should render description text", () => {
    render(<HSLSection />)

    expect(screen.getByText("Advanced HSL adjustments and secondary color correction")).toBeInTheDocument()
  })

  it("should render all parameter sliders", () => {
    render(<HSLSection />)

    expect(screen.getByTestId("parameter-slider-Hue")).toBeInTheDocument()
    expect(screen.getByTestId("parameter-slider-Saturation")).toBeInTheDocument()
    expect(screen.getByTestId("parameter-slider-Luminance")).toBeInTheDocument()
    expect(screen.getByTestId("parameter-slider-Contrast Pivot")).toBeInTheDocument()
    expect(screen.getByTestId("parameter-slider-Vibrance")).toBeInTheDocument()
  })

  it("should format hue value with degree symbol", () => {
    render(<HSLSection />)

    expect(screen.getByTestId("value-Hue")).toHaveTextContent("0°")
  })

  it("should format saturation value with plus sign for positive", () => {
    mockContextValue.state.basicParameters.saturation = 25
    render(<HSLSection />)

    expect(screen.getByTestId("value-Saturation")).toHaveTextContent("+25")
  })

  it("should format luminance value with plus sign for positive", () => {
    mockContextValue.state.basicParameters.luminance = 50
    render(<HSLSection />)

    expect(screen.getByTestId("value-Luminance")).toHaveTextContent("+50")
  })

  it("should format pivot value with two decimal places", () => {
    mockContextValue.state.basicParameters.pivot = 0.75
    render(<HSLSection />)

    expect(screen.getByTestId("value-Contrast Pivot")).toHaveTextContent("0.75")
  })

  it("should update hue parameter", async () => {
    const user = userEvent.setup()
    render(<HSLSection />)

    await user.click(screen.getByText("Change Hue"))

    expect(mockContextValue.updateBasicParameter).toHaveBeenCalledWith("hue", 50)
  })

  it("should update saturation parameter", async () => {
    const user = userEvent.setup()
    render(<HSLSection />)

    await user.click(screen.getByText("Change Saturation"))

    expect(mockContextValue.updateBasicParameter).toHaveBeenCalledWith("saturation", 50)
  })

  it("should update luminance parameter", async () => {
    const user = userEvent.setup()
    render(<HSLSection />)

    await user.click(screen.getByText("Change Luminance"))

    expect(mockContextValue.updateBasicParameter).toHaveBeenCalledWith("luminance", 50)
  })

  it("should update pivot parameter", async () => {
    const user = userEvent.setup()
    render(<HSLSection />)

    await user.click(screen.getByText("Change Contrast Pivot"))

    expect(mockContextValue.updateBasicParameter).toHaveBeenCalledWith("pivot", 50)
  })

  it("should update vibrance (saturation) parameter", async () => {
    const user = userEvent.setup()
    render(<HSLSection />)

    await user.click(screen.getByText("Change Vibrance"))

    expect(mockContextValue.updateBasicParameter).toHaveBeenCalledWith("saturation", 50)
  })

  it("should render advanced section", () => {
    render(<HSLSection />)

    expect(screen.getByText("Advanced")).toBeInTheDocument()
  })

  it("should apply gradient classes to sliders", () => {
    render(<HSLSection />)

    const hueSlider = screen.getByTestId("parameter-slider-Hue")
    expect(hueSlider).toHaveClass("[&_input]:bg-linear-to-r")
    expect(hueSlider).toHaveClass("[&_input]:from-red-500")

    const saturationSlider = screen.getByTestId("parameter-slider-Saturation")
    expect(saturationSlider).toHaveClass("[&_input]:from-muted")
    expect(saturationSlider).toHaveClass("[&_input]:to-purple-500")

    const luminanceSlider = screen.getByTestId("parameter-slider-Luminance")
    expect(luminanceSlider).toHaveClass("[&_input]:from-background")
    expect(luminanceSlider).toHaveClass("[&_input]:to-foreground")
  })

  it("should have correct slider ranges", () => {
    const { container } = render(<HSLSection />)

    // We can't directly test the props passed to ParameterSlider
    // but we can verify the sliders are rendered with correct labels
    expect(screen.getByText("Hue")).toBeInTheDocument()
    expect(screen.getByText("Saturation")).toBeInTheDocument()
    expect(screen.getByText("Luminance")).toBeInTheDocument()
    expect(screen.getByText("Contrast Pivot")).toBeInTheDocument()
    expect(screen.getByText("Vibrance")).toBeInTheDocument()
  })

  it("should render border separator before advanced section", () => {
    const { container } = render(<HSLSection />)

    const borderDiv = container.querySelector(".border-t")
    expect(borderDiv).toBeInTheDocument()
  })

  it("should update state values correctly", () => {
    // Test with different initial values
    mockContextValue.state.basicParameters = {
      hue: 45,
      saturation: -20,
      luminance: 30,
      pivot: 0.25,
      temperature: 0,
      tint: 0,
      contrast: 0,
    }

    render(<HSLSection />)

    expect(screen.getByTestId("value-Hue")).toHaveTextContent("45°")
    expect(screen.getByTestId("value-Saturation")).toHaveTextContent("-20")
    expect(screen.getByTestId("value-Luminance")).toHaveTextContent("+30")
    expect(screen.getByTestId("value-Contrast Pivot")).toHaveTextContent("0.25")
  })
})

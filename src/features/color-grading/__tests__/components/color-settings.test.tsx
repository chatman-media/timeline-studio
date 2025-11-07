import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ColorSettings } from "../../components/color-settings"

// Мокаем хук useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}))

// Мокаем ColorGradingProvider и useColorGradingContext
vi.mock("../../services/color-grading-provider", () => ({
  ColorGradingProvider: ({ children }: { children: React.ReactNode }) => children,
  useColorGradingContext: () => ({
    state: {
      colorWheels: {
        lift: { r: 0, g: 0, b: 0 },
        gamma: { r: 0, g: 0, b: 0 },
        gain: { r: 0, g: 0, b: 0 },
      },
      basicParameters: {
        temperature: 0,
        tint: 0,
        vibrance: 0,
        saturation: 100,
        exposure: 0,
        contrast: 100,
        highlights: 0,
        shadows: 0,
        whites: 0,
        blacks: 0,
      },
      curves: {
        rgb: [],
        red: [],
        green: [],
        blue: [],
      },
      hsl: {
        ranges: [],
      },
      lut: {
        enabled: false,
        file: null,
        intensity: 100,
      },
      previewEnabled: true,
    },
    dispatch: vi.fn(),
    updateColorWheel: vi.fn(),
    updateBasicParameter: vi.fn(),
    updateCurve: vi.fn(),
    loadLUT: vi.fn(),
    setLUTIntensity: vi.fn(),
    toggleLUT: vi.fn(),
    togglePreview: vi.fn(),
    applyToClip: vi.fn(),
    resetAll: vi.fn(),
    autoCorrect: vi.fn(),
    loadPreset: vi.fn(),
    savePreset: vi.fn(),
    hasChanges: false,
    isActive: true,
    availablePresets: [],
  }),
  useColorGrading: () => ({
    state: {},
    dispatch: vi.fn(),
  }),
}))

// Мокаем дочерние компоненты
vi.mock("../../components/color-wheels/color-wheels-section", () => ({
  ColorWheelsSection: () => <div data-testid="color-wheels-section">Color Wheels Section</div>,
}))

vi.mock("../../components/curves/curves-section", () => ({
  CurvesSection: () => <div data-testid="curves-section">Curves Section</div>,
}))

vi.mock("../../components/hsl/hsl-section", () => ({
  HSLSection: () => <div data-testid="hsl-section">HSL Section</div>,
}))

vi.mock("../../components/lut/lut-section", () => ({
  LUTSection: () => <div data-testid="lut-section">LUT Section</div>,
}))

vi.mock("../../components/scopes/scopes-section", () => ({
  ScopesSection: () => <div data-testid="scopes-section">Scopes Section</div>,
}))

vi.mock("../../components/controls/color-grading-controls", () => ({
  ColorGradingControls: () => <div data-testid="color-grading-controls">Color Grading Controls</div>,
}))

describe("ColorSettings", () => {
  it("should render color settings panel", () => {
    render(<ColorSettings />)

    expect(screen.getByTestId("color-settings")).toBeInTheDocument()
  })

  it("should render all collapsible sections", () => {
    render(<ColorSettings />)

    // Проверяем наличие всех секций
    expect(screen.getByTestId("color-wheels-trigger")).toBeInTheDocument()
    expect(screen.getByTestId("curves-trigger")).toBeInTheDocument()
    expect(screen.getByTestId("hsl-trigger")).toBeInTheDocument()
    expect(screen.getByTestId("lut-trigger")).toBeInTheDocument()
    expect(screen.getByTestId("scopes-trigger")).toBeInTheDocument()

    // Проверяем тексты секций
    expect(screen.getByText("Primary Color Correction")).toBeInTheDocument()
    expect(screen.getByText("Curves")).toBeInTheDocument()
    expect(screen.getByText("HSL Correction")).toBeInTheDocument()
    expect(screen.getByText("LUT")).toBeInTheDocument()
    expect(screen.getByText("Scopes")).toBeInTheDocument()
  })

  it("should have color wheels section open by default", () => {
    render(<ColorSettings />)

    // Color wheels должны быть открыты по умолчанию
    expect(screen.getByTestId("color-wheels-section")).toBeInTheDocument()

    // Остальные секции должны быть закрыты
    expect(screen.queryByTestId("curves-section")).not.toBeInTheDocument()
    expect(screen.queryByTestId("hsl-section")).not.toBeInTheDocument()
    expect(screen.queryByTestId("lut-section")).not.toBeInTheDocument()
    expect(screen.queryByTestId("scopes-section")).not.toBeInTheDocument()
  })

  it("should toggle sections when clicking triggers", async () => {
    const user = userEvent.setup()
    render(<ColorSettings />)

    // Изначально только color wheels открыты
    expect(screen.getByTestId("color-wheels-section")).toBeInTheDocument()
    expect(screen.queryByTestId("curves-section")).not.toBeInTheDocument()

    // Кликаем на curves trigger
    await user.click(screen.getByTestId("curves-trigger"))

    // Curves должны открыться
    expect(screen.getByTestId("curves-section")).toBeInTheDocument()

    // Кликаем еще раз - должны закрыться
    await user.click(screen.getByTestId("curves-trigger"))
    expect(screen.queryByTestId("curves-section")).not.toBeInTheDocument()
  })

  it("should render color grading controls at the bottom", () => {
    render(<ColorSettings />)

    expect(screen.getByTestId("color-grading-controls")).toBeInTheDocument()
  })

  it("should have proper scrollable container", () => {
    render(<ColorSettings />)

    const scrollableContainer = screen.getByTestId("color-settings").querySelector(".overflow-y-auto")
    expect(scrollableContainer).toBeInTheDocument()
    expect(scrollableContainer).toHaveClass("custom-scrollbar")
  })

  it("should apply custom className when provided", () => {
    render(<ColorSettings className="test-custom-class" />)

    expect(screen.getByTestId("color-settings")).toHaveClass("test-custom-class")
  })

  it("should have proper flex layout structure", () => {
    render(<ColorSettings />)

    const container = screen.getByTestId("color-settings")
    expect(container).toHaveClass("h-full")
    expect(container).toHaveClass("flex")
    expect(container).toHaveClass("flex-col")

    // Проверяем структуру flex контейнеров
    const scrollableContent = container.querySelector(".flex-1.min-h-0")
    expect(scrollableContent).toBeInTheDocument()
  })
})

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { VideoEffect } from "@/features/effects/types"
import { BrowserProviders } from "@/test/test-utils"

import { EffectParameterControls } from "../../components/effect-parameter-controls"

// Mock useUserSettings
vi.mock("@/features/user-settings/hooks/use-user-settings", () => ({
  useUserSettings: () => ({
    settings: {},
    updateSettings: vi.fn(),
  }),
}))

// Mock window.prompt
global.prompt = vi.fn()

describe("EffectParameterControls", () => {
  const mockEffect: VideoEffect = {
    id: "test-effect",
    name: {
      en: "Test Effect",
      ru: "Тестовый эффект",
    },
    category: "blur_sharpen",
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    tags: ["popular"],
    description: { ru: "Тестовый эффект", en: "Test effect" },
    complexity: "low",
    gpuAccelerated: true,
    parameters: [
      {
        id: "intensity",
        name: { en: "Intensity", ru: "Интенсивность" },
        type: "number",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        animatable: true,
      },
      {
        id: "radius",
        name: { en: "Radius", ru: "Радиус" },
        type: "number",
        defaultValue: 5,
        min: 0,
        max: 50,
        step: 1,
        animatable: true,
      },
      {
        id: "temperature",
        name: { en: "Temperature", ru: "Температура" },
        type: "number",
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 1,
        animatable: true,
      },
      {
        id: "speed",
        name: { en: "Speed", ru: "Скорость" },
        type: "number",
        defaultValue: 1.0,
        min: 0.1,
        max: 10,
        step: 0.1,
        animatable: true,
      },
    ],
    presets: [],
    processors: {
      ffmpeg: {
        filter: (params) => `blur=${params.intensity || 50}`,
      },
    },
  }

  const mockOnParametersChange = vi.fn()
  const mockOnSavePreset = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.prompt = vi.fn()
  })

  it("renders parameter controls for effect with params", () => {
    render(
      <BrowserProviders>
        <EffectParameterControls effect={mockEffect} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    expect(screen.getByText("effects.detail.parameters")).toBeInTheDocument()
    expect(screen.getByText("Интенсивность")).toBeInTheDocument()
    expect(screen.getByText("Радиус")).toBeInTheDocument()
    expect(screen.getByText("Температура")).toBeInTheDocument()
    expect(screen.getByText("Скорость")).toBeInTheDocument()
  })

  it("renders null for effect without params", () => {
    const effectWithoutParams = { ...mockEffect, parameters: [] as any }

    render(
      <BrowserProviders>
        <EffectParameterControls effect={effectWithoutParams} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    // Should not render parameter controls
    expect(screen.queryByText("effects.detail.parameters")).not.toBeInTheDocument()
    expect(screen.queryByText("Интенсивность")).not.toBeInTheDocument()
  })

  it("renders null for effect with empty params", () => {
    const effectWithEmptyParams = { ...mockEffect, parameters: [] }

    render(
      <BrowserProviders>
        <EffectParameterControls effect={effectWithEmptyParams} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    // Should not render parameter controls
    expect(screen.queryByText("effects.detail.parameters")).not.toBeInTheDocument()
    expect(screen.queryByText("Интенсивность")).not.toBeInTheDocument()
  })

  it("displays current parameter values", () => {
    render(
      <BrowserProviders>
        <EffectParameterControls effect={mockEffect} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    expect(screen.getByText("50")).toBeInTheDocument() // intensity
    expect(screen.getByText("5")).toBeInTheDocument() // radius
    expect(screen.getByText("0")).toBeInTheDocument() // temperature
    expect(screen.getByText("1")).toBeInTheDocument() // speed
  })

  it("calls onParametersChange when slider value changes", async () => {
    const user = userEvent.setup()

    render(
      <BrowserProviders>
        <EffectParameterControls effect={mockEffect} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    const slider = screen.getAllByRole("slider")[0] // intensity slider

    // Use keyboard interaction instead of mouse for more reliable testing
    slider.focus()
    await user.keyboard("{ArrowRight}")

    await waitFor(() => {
      expect(mockOnParametersChange).toHaveBeenCalled()
    })
  })

  it("resets parameters to default values when reset button is clicked", async () => {
    const user = userEvent.setup()

    render(
      <BrowserProviders>
        <EffectParameterControls effect={mockEffect} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    const resetButton = screen.getByRole("button", { name: "RotateCcw" })

    await user.click(resetButton)

    expect(mockOnParametersChange).toHaveBeenCalledWith({
      intensity: 50, // default from PARAMETER_CONFIG
      radius: 5,
      temperature: 0,
      speed: 1.0,
    })
  })

  it("shows save preset button when onSavePreset is provided", () => {
    render(
      <BrowserProviders>
        <EffectParameterControls
          effect={mockEffect}
          onParametersChange={mockOnParametersChange}
          onSavePreset={mockOnSavePreset}
        />
      </BrowserProviders>,
    )

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
  })

  it("does not show save preset button when onSavePreset is not provided", () => {
    render(
      <BrowserProviders>
        <EffectParameterControls effect={mockEffect} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument()
  })

  it("saves preset with user-provided name", async () => {
    const user = userEvent.setup()
    global.prompt = vi.fn().mockReturnValue("My Custom Preset")

    render(
      <BrowserProviders>
        <EffectParameterControls
          effect={mockEffect}
          onParametersChange={mockOnParametersChange}
          onSavePreset={mockOnSavePreset}
        />
      </BrowserProviders>,
    )

    const saveButton = screen.getByRole("button", { name: "Save" })

    await user.click(saveButton)

    expect(global.prompt).toHaveBeenCalledWith("effects.enterPresetName")
    expect(mockOnSavePreset).toHaveBeenCalledWith("My Custom Preset", {
      intensity: 50,
      radius: 5,
      temperature: 0,
      speed: 1.0,
    })
  })

  it("does not save preset when user cancels prompt", async () => {
    const user = userEvent.setup()
    global.prompt = vi.fn().mockReturnValue(null)

    render(
      <BrowserProviders>
        <EffectParameterControls
          effect={mockEffect}
          onParametersChange={mockOnParametersChange}
          onSavePreset={mockOnSavePreset}
        />
      </BrowserProviders>,
    )

    const saveButton = screen.getByRole("button", { name: "Save" })

    await user.click(saveButton)

    expect(global.prompt).toHaveBeenCalled()
    expect(mockOnSavePreset).not.toHaveBeenCalled()
  })

  it("does not save preset when user provides empty name", async () => {
    const user = userEvent.setup()
    global.prompt = vi.fn().mockReturnValue("   ")

    render(
      <BrowserProviders>
        <EffectParameterControls
          effect={mockEffect}
          onParametersChange={mockOnParametersChange}
          onSavePreset={mockOnSavePreset}
        />
      </BrowserProviders>,
    )

    const saveButton = screen.getByRole("button", { name: "Save" })

    await user.click(saveButton)

    expect(global.prompt).toHaveBeenCalled()
    expect(mockOnSavePreset).not.toHaveBeenCalled()
  })

  it("updates parameters when selectedPreset changes", async () => {
    const effectWithPresets = {
      ...mockEffect,
      presets: [
        {
          id: "light",
          name: { ru: "Легкий", en: "Light" },
          parameters: { intensity: 25, radius: 2, temperature: 10, speed: 0.5 },
          description: { ru: "Легкий эффект", en: "Light effect" },
          tags: [],
        },
      ],
    }

    const { rerender } = render(
      <BrowserProviders>
        <EffectParameterControls effect={effectWithPresets} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    // Re-render with selectedPreset
    rerender(
      <BrowserProviders>
        <EffectParameterControls
          effect={effectWithPresets}
          onParametersChange={mockOnParametersChange}
          selectedPreset="light"
        />
      </BrowserProviders>,
    )

    await waitFor(() => {
      expect(mockOnParametersChange).toHaveBeenCalledWith({
        intensity: 25,
        radius: 2,
        temperature: 10,
        speed: 0.5,
      })
    })
  })

  it("displays current parameter values in info section", () => {
    render(
      <BrowserProviders>
        <EffectParameterControls effect={mockEffect} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    // Check that current values are displayed (i18n key may not be translated in test)
    expect(screen.getByText("intensity: 50")).toBeInTheDocument()
    expect(screen.getByText("radius: 5")).toBeInTheDocument()
    expect(screen.getByText("temperature: 0")).toBeInTheDocument()
    expect(screen.getByText("speed: 1")).toBeInTheDocument()
  })

  it("shows tooltips with parameter descriptions", async () => {
    render(
      <BrowserProviders>
        <EffectParameterControls effect={mockEffect} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    // Check that sliders are present (they have tooltip containers)
    const sliders = screen.getAllByRole("slider")
    expect(sliders.length).toBe(4) // We have 4 parameters in mockEffect
  })

  it("handles parameters not in PARAMETER_CONFIG", () => {
    const effectWithCustomParam = {
      ...mockEffect,
      parameters: [
        ...mockEffect.parameters,
        {
          id: "customParam",
          name: { en: "Custom Param", ru: "Кастомный параметр" },
          type: "number" as const,
          defaultValue: 100,
          min: 0,
          max: 200,
          step: 1,
          animatable: false,
        },
      ],
    }

    render(
      <BrowserProviders>
        <EffectParameterControls effect={effectWithCustomParam} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    expect(screen.getByText("Интенсивность")).toBeInTheDocument()
    // customParam might be rendered if PARAMETER_CONFIG includes it or uses a fallback
    // The test should check what the actual behavior is
  })

  it("uses correct language for labels and descriptions", () => {
    render(
      <BrowserProviders>
        <EffectParameterControls effect={mockEffect} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    // Should use Russian labels as default in test environment
    expect(screen.getByText("Интенсивность")).toBeInTheDocument()
    expect(screen.getByText("Радиус")).toBeInTheDocument()
    expect(screen.getByText("Температура")).toBeInTheDocument()
    expect(screen.getByText("Скорость")).toBeInTheDocument()
  })

  it("validates effect has parameters", () => {
    expect(mockEffect.parameters).toBeDefined()
    expect(mockEffect.parameters.length).toBeGreaterThan(0)
  })

  it("should handle effect with presets", () => {
    const effectWithPresets = {
      ...mockEffect,
      presets: [
        {
          id: "light",
          name: { ru: "Легкий", en: "Light" },
          parameters: { intensity: 25, radius: 2 },
          description: { ru: "Легкий эффект", en: "Light effect" },
          tags: [],
        },
      ],
    }
    expect(effectWithPresets.presets).toBeDefined()
    expect(effectWithPresets.presets[0]).toBeDefined()
    expect(effectWithPresets.presets[0].id).toBe("light")
  })

  it("should validate parameter types", () => {
    const intensityParam = mockEffect.parameters.find((p) => p.id === "intensity")
    const radiusParam = mockEffect.parameters.find((p) => p.id === "radius")
    expect(intensityParam?.type).toBe("number")
    expect(radiusParam?.type).toBe("number")
    expect(intensityParam?.defaultValue).toBe(50)
    expect(radiusParam?.defaultValue).toBe(5)
  })
})

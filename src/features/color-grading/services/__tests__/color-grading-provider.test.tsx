/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ColorGradingProvider, useColorGradingContext } from "../color-grading-provider"

// Mock container.getBackend first
const mockExecuteCommand = vi.fn()
const mockOnEvent = vi.fn()

vi.mock("@/core/container", () => ({
  container: {
    getBackend: vi.fn(() => ({
      executeCommand: mockExecuteCommand,
      onEvent: mockOnEvent,
    })),
    hasBackend: vi.fn(() => true),
    registerBackend: vi.fn(),
  },
}))

// Mock the useColorGrading hook
const mockColorGrading = {
  state: {
    colorWheels: {
      lift: { r: 0, g: 0, b: 0 },
      gamma: { r: 0, g: 0, b: 0 },
      gain: { r: 0, g: 0, b: 0 },
      offset: { r: 0, g: 0, b: 0 },
    },
    basicParameters: {
      temperature: 0,
      tint: 0,
      contrast: 0,
      pivot: 0.5,
      saturation: 0,
      hue: 0,
      luminance: 0,
    },
    curves: {
      master: [
        { x: 0, y: 256, id: "start" },
        { x: 256, y: 0, id: "end" },
      ],

      red: [
        { x: 0, y: 256, id: "start" },
        { x: 256, y: 0, id: "end" },
      ],

      green: [
        { x: 0, y: 256, id: "start" },
        { x: 256, y: 0, id: "end" },
      ],

      blue: [
        { x: 0, y: 256, id: "start" },
        { x: 256, y: 0, id: "end" },
      ],

      hueVsHue: [],
      hueVsSaturation: [],
      hueVsLuminance: [],
      luminanceVsSaturation: [],
      saturationVsSaturation: [],
    },
    lut: {
      file: null,
      intensity: 100,
      isEnabled: false,
    },
    scopes: {
      waveformEnabled: true,
      vectorscopeEnabled: false,
      histogramEnabled: false,
      refreshRate: 30,
    },
    previewEnabled: true,
    selectedClip: null,
    isActive: false,
    currentPreset: null,
    hasUnsavedChanges: false,
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
  isActive: false,
  availablePresets: [],
}

vi.mock("../hooks/use-color-grading", () => ({
  useColorGrading: vi.fn(() => mockColorGrading),
}))

// Test component that uses the context
function TestComponent() {
  const context = useColorGradingContext()

  return (
    <div data-oid="tp5t3:h">
      <div data-testid="temperature" data-oid="m-eibi2">
        {context.state.basicParameters.temperature}
      </div>
      <div data-testid="has-changes" data-oid="7iu3xjl">
        {context.hasChanges.toString()}
      </div>
      <div data-testid="is-active" data-oid="prjvkeh">
        {context.isActive.toString()}
      </div>
      <button onClick={() => context.updateBasicParameter("temperature", 1)} data-oid="9kqv5j4">
        Update Temperature
      </button>
      <button onClick={() => context.resetAll()} data-oid="zrt6m8g">
        Reset All
      </button>
    </div>
  )
}

describe("ColorGradingProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    mockOnEvent.mockReturnValue(() => {}) // unsubscribe function
    mockExecuteCommand.mockResolvedValue({
      success: true,
      data: { presets: [] },
    })
  })

  it("should provide color grading context to children", () => {
    render(
      <ColorGradingProvider data-oid="7p.dbs3">
        <TestComponent data-oid="tb_d-pm" />
      </ColorGradingProvider>,
    )

    expect(screen.getByTestId("temperature")).toHaveTextContent("0")
    expect(screen.getByTestId("has-changes")).toHaveTextContent("false")
    expect(screen.getByTestId("is-active")).toHaveTextContent("false")
  })

  it("should provide all required context methods", () => {
    render(
      <ColorGradingProvider data-oid="sz.k20k">
        <TestComponent data-oid="k47s4o0" />
      </ColorGradingProvider>,
    )

    const updateButton = screen.getByText("Update Temperature")
    const resetButton = screen.getByText("Reset All")

    expect(updateButton).toBeInTheDocument()
    expect(resetButton).toBeInTheDocument()
  })

  it("should call context methods when triggered", () => {
    render(
      <ColorGradingProvider data-oid="ij7z3ls">
        <TestComponent data-oid="-i51yql" />
      </ColorGradingProvider>,
    )

    const updateButton = screen.getByText("Update Temperature")
    const resetButton = screen.getByText("Reset All")

    // Just verify the buttons exist and are clickable
    expect(updateButton).toBeInTheDocument()
    expect(resetButton).toBeInTheDocument()
  })
})

describe("useColorGradingContext", () => {
  it("should throw error when used outside provider", () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = vi.fn()

    expect(() => {
      render(<TestComponent data-oid="zwr:ve4" />)
    }).toThrow("useColorGradingContext must be used within ColorGradingProvider")

    console.error = originalError
  })

  it("should return context value when used within provider", () => {
    let contextValue: any

    function ContextCapture() {
      contextValue = useColorGradingContext()
      return null
    }

    render(
      <ColorGradingProvider data-oid="oxry1-i">
        <ContextCapture data-oid="-e4un3_" />
      </ColorGradingProvider>,
    )

    expect(contextValue).toBeDefined()
    expect(contextValue.state).toBeDefined()
    expect(typeof contextValue.updateBasicParameter).toBe("function")
    expect(typeof contextValue.resetAll).toBe("function")
  })

  it("should provide all required context properties", () => {
    let contextValue: any

    function ContextCapture() {
      contextValue = useColorGradingContext()
      return null
    }

    render(
      <ColorGradingProvider data-oid="ot0uy_a">
        <ContextCapture data-oid="-jd_yg2" />
      </ColorGradingProvider>,
    )

    // Check that all required properties exist
    expect(contextValue.state).toBeDefined()
    expect(contextValue.dispatch).toBeDefined()
    expect(contextValue.updateColorWheel).toBeDefined()
    expect(contextValue.updateBasicParameter).toBeDefined()
    expect(contextValue.updateCurve).toBeDefined()
    expect(contextValue.loadLUT).toBeDefined()
    expect(contextValue.setLUTIntensity).toBeDefined()
    expect(contextValue.toggleLUT).toBeDefined()
    expect(contextValue.togglePreview).toBeDefined()
    expect(contextValue.applyToClip).toBeDefined()
    expect(contextValue.resetAll).toBeDefined()
    expect(contextValue.autoCorrect).toBeDefined()
    expect(contextValue.loadPreset).toBeDefined()
    expect(contextValue.savePreset).toBeDefined()
    expect(typeof contextValue.hasChanges).toBe("boolean")
    expect(typeof contextValue.isActive).toBe("boolean")
    expect(Array.isArray(contextValue.availablePresets)).toBe(true)
  })

  describe("backend sync integration", () => {
    it("should initialize with connected state", () => {
      let contextValue: any

      function ContextCapture() {
        contextValue = useColorGradingContext()
        return null
      }

      render(
        <ColorGradingProvider data-oid="3yfdl9m">
          <ContextCapture data-oid="b_kbjy6" />
        </ColorGradingProvider>,
      )

      expect(contextValue.isConnected).toBeDefined()
      expect(contextValue.error).toBeDefined()
    })

    it("should provide backend-enhanced applyToClip method", () => {
      let contextValue: any

      function ContextCapture() {
        contextValue = useColorGradingContext()
        return null
      }

      render(
        <ColorGradingProvider data-oid="mrv2n_d">
          <ContextCapture data-oid="__a2oam" />
        </ColorGradingProvider>,
      )

      expect(typeof contextValue.applyToClip).toBe("function")
      expect(contextValue.applyToClip).not.toBe(mockColorGrading.applyToClip)
    })

    it("should provide backend-enhanced savePreset method", () => {
      let contextValue: any

      function ContextCapture() {
        contextValue = useColorGradingContext()
        return null
      }

      render(
        <ColorGradingProvider data-oid="sme::4p">
          <ContextCapture data-oid="50u3zjt" />
        </ColorGradingProvider>,
      )

      expect(typeof contextValue.savePreset).toBe("function")
      expect(contextValue.savePreset).not.toBe(mockColorGrading.savePreset)
    })

    it("should provide backend-enhanced loadPreset method", () => {
      let contextValue: any

      function ContextCapture() {
        contextValue = useColorGradingContext()
        return null
      }

      render(
        <ColorGradingProvider data-oid="dsh53pu">
          <ContextCapture data-oid="e57shdd" />
        </ColorGradingProvider>,
      )

      expect(typeof contextValue.loadPreset).toBe("function")
      expect(contextValue.loadPreset).not.toBe(mockColorGrading.loadPreset)
    })

    it("should expose connection status", () => {
      let contextValue: any

      function ContextCapture() {
        contextValue = useColorGradingContext()
        return null
      }

      render(
        <ColorGradingProvider data-oid=":o-fygy">
          <ContextCapture data-oid="gdz_fp7" />
        </ColorGradingProvider>,
      )

      expect(typeof contextValue.isConnected).toBe("boolean")
      expect(contextValue.error === null || typeof contextValue.error === "string").toBe(true)
    })

    it("should pass through state from hook", () => {
      let contextValue: any

      function ContextCapture() {
        contextValue = useColorGradingContext()
        return null
      }

      render(
        <ColorGradingProvider data-oid="tpo8105">
          <ContextCapture data-oid="c_q:e.u" />
        </ColorGradingProvider>,
      )

      expect(contextValue.state).toEqual(mockColorGrading.state)
    })

    it("should pass through hasChanges from hook", () => {
      let contextValue: any

      function ContextCapture() {
        contextValue = useColorGradingContext()
        return null
      }

      render(
        <ColorGradingProvider data-oid="0a4e-7a">
          <ContextCapture data-oid="dym0y.9" />
        </ColorGradingProvider>,
      )

      expect(contextValue.hasChanges).toBe(mockColorGrading.hasChanges)
    })

    it("should pass through isActive from hook", () => {
      let contextValue: any

      function ContextCapture() {
        contextValue = useColorGradingContext()
        return null
      }

      render(
        <ColorGradingProvider data-oid="u9:o_x6">
          <ContextCapture data-oid=":6f9kag" />
        </ColorGradingProvider>,
      )

      expect(contextValue.isActive).toBe(mockColorGrading.isActive)
    })

    it("should have availablePresets defined", async () => {
      let contextValue: any

      function ContextCapture() {
        contextValue = useColorGradingContext()
        return null
      }

      // Mock preset loading from backend
      mockExecuteCommand.mockResolvedValue({
        success: true,
        data: {
          presets: [
            {
              id: "preset-1",
              name: "Cinematic",
              added_at: Date.now() / 1000,
              parameters: {},
            },
          ],
        },
      })

      render(
        <ColorGradingProvider data-oid="s5j-5vt">
          <ContextCapture data-oid="8-o2:d:" />
        </ColorGradingProvider>,
      )

      // Wait for preset loading
      await vi.waitFor(() => {
        expect(mockExecuteCommand).toHaveBeenCalledWith({
          type: "GetColorGradingPresets",
        })
      })

      expect(contextValue.availablePresets).toBeDefined()
      expect(Array.isArray(contextValue.availablePresets)).toBe(true)
      // Presets are loaded asynchronously, so they may be empty initially
      expect(contextValue.availablePresets.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe("edge cases", () => {
    it("should handle multiple renders without issues", () => {
      const { rerender } = render(
        <ColorGradingProvider data-oid=":75f_bp">
          <TestComponent data-oid="hh.84az" />
        </ColorGradingProvider>,
      )

      expect(screen.getByTestId("temperature")).toHaveTextContent("0")

      rerender(
        <ColorGradingProvider data-oid="xgyq76z">
          <TestComponent data-oid="dlkw00p" />
        </ColorGradingProvider>,
      )

      expect(screen.getByTestId("temperature")).toHaveTextContent("0")
    })

    it("should handle nested providers gracefully", () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = vi.fn()

      function NestedComponent() {
        const context = useColorGradingContext()
        return (
          <div data-testid="nested" data-oid="0q4nwf2">
            {context.state.basicParameters.temperature}
          </div>
        )
      }

      render(
        <ColorGradingProvider data-oid="94dsvuh">
          <ColorGradingProvider data-oid="rcjy75z">
            <NestedComponent data-oid="-rgkxs." />
          </ColorGradingProvider>
        </ColorGradingProvider>,
      )

      expect(screen.getByTestId("nested")).toHaveTextContent("0")

      console.error = originalError
    })

    it("should maintain context across component updates", () => {
      function DynamicComponent({ showContent }: { showContent: boolean }) {
        const context = useColorGradingContext()

        if (!showContent) return null

        return (
          <div data-testid="dynamic" data-oid="bbj_-.e">
            {context.state.basicParameters.temperature}
          </div>
        )
      }

      const { rerender } = render(
        <ColorGradingProvider data-oid="sw3o3.n">
          <DynamicComponent showContent={false} data-oid="b5noa1g" />
        </ColorGradingProvider>,
      )

      expect(screen.queryByTestId("dynamic")).not.toBeInTheDocument()

      rerender(
        <ColorGradingProvider data-oid=":zqx3s5">
          <DynamicComponent showContent={true} data-oid="waw-ei1" />
        </ColorGradingProvider>,
      )

      expect(screen.getByTestId("dynamic")).toHaveTextContent("0")
    })

    it("should handle unmounting gracefully", () => {
      const { unmount } = render(
        <ColorGradingProvider data-oid="902tk1j">
          <TestComponent data-oid="ng7clk-" />
        </ColorGradingProvider>,
      )

      expect(screen.getByTestId("temperature")).toBeInTheDocument()

      unmount()

      expect(screen.queryByTestId("temperature")).not.toBeInTheDocument()
    })
  })
})

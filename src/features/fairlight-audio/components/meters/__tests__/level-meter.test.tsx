/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LevelMeter } from "../level-meter"

// Mock AudioContext и related APIs
const mockAudioContext = {
  createAnalyser: vi.fn(() => ({
    fftSize: 256,
    smoothingTimeConstant: 0.8,
    frequencyBinCount: 128,
    connect: vi.fn(),
    disconnect: vi.fn(),
    getFloatTimeDomainData: vi.fn((dataArray: Float32Array) => {
      // Simulate audio data with some variation
      for (let i = 0; i < dataArray.length; i++) {
        dataArray[i] = Math.sin(i * 0.1) * 0.5 // Generate test sine wave data
      }
    }),
  })),
} as unknown as AudioContext

const mockAudioNode = {
  connect: vi.fn(),
  disconnect: vi.fn(),
} as unknown as AudioNode

// Mock requestAnimationFrame and cancelAnimationFrame
let rafId = 0
const mockRaf = vi.fn((_callback) => {
  // Don't execute immediately to prevent infinite loop
  rafId++
  return rafId
})

const mockCancelRaf = vi.fn()

beforeEach(() => {
  global.requestAnimationFrame = mockRaf
  global.cancelAnimationFrame = mockCancelRaf
  rafId = 0
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("LevelMeter", () => {
  it("should render without crashing", () => {
    const { container } = render(<LevelMeter />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("should render with default props", () => {
    const { container } = render(<LevelMeter />)

    // Should render with default 2 channels
    const meters = container.querySelectorAll(".relative.w-4")
    expect(meters).toHaveLength(2)

    // Should have vertical orientation by default
    expect(container.querySelector(".flex-row")).toBeInTheDocument()
  })

  it("should render mono meter (1 channel)", () => {
    const { container } = render(<LevelMeter channels={1} />)

    const meters = container.querySelectorAll(".relative.w-4")
    expect(meters).toHaveLength(1)
  })

  it("should render horizontal orientation", () => {
    const { container } = render(<LevelMeter orientation="horizontal" />)

    // Should have horizontal orientation
    expect(container.querySelector(".flex-col")).toBeInTheDocument()

    // Should render horizontal meters
    const meters = container.querySelectorAll(".relative.h-4")
    expect(meters).toHaveLength(2)
  })

  it("should apply custom className", () => {
    const { container } = render(<LevelMeter className="custom-class" />)

    expect(container.querySelector(".custom-class")).toBeInTheDocument()
  })

  it("should create analyser when audioContext and source are provided", () => {
    render(<LevelMeter audioContext={mockAudioContext} source={mockAudioNode} />)

    expect(mockAudioContext.createAnalyser).toHaveBeenCalled()
    expect(mockAudioNode.connect).toHaveBeenCalled()
  })

  it("should set analyser properties correctly", () => {
    const mockAnalyser = {
      fftSize: 0,
      smoothingTimeConstant: 0,
      frequencyBinCount: 128,
      connect: vi.fn(),
      disconnect: vi.fn(),
      getFloatTimeDomainData: vi.fn(),
    }

    const mockContext = {
      createAnalyser: vi.fn(() => mockAnalyser),
    } as unknown as AudioContext

    render(<LevelMeter audioContext={mockContext} source={mockAudioNode} />)

    expect(mockAnalyser.fftSize).toBe(256)
    expect(mockAnalyser.smoothingTimeConstant).toBe(0.8)
  })

  it("should start animation loop when audioContext and source are provided", () => {
    render(<LevelMeter audioContext={mockAudioContext} source={mockAudioNode} />)

    expect(mockRaf).toHaveBeenCalled()
  })

  it("should cleanup on unmount", () => {
    const { unmount } = render(<LevelMeter audioContext={mockAudioContext} source={mockAudioNode} />)

    unmount()

    expect(mockCancelRaf).toHaveBeenCalled()
    expect(mockAudioNode.disconnect).toHaveBeenCalled()
  })

  it("should not create analyser without audioContext", () => {
    render(<LevelMeter source={mockAudioNode} />)

    expect(mockAudioContext.createAnalyser).not.toHaveBeenCalled()
  })

  it("should not create analyser without source", () => {
    render(<LevelMeter audioContext={mockAudioContext} />)

    expect(mockAudioContext.createAnalyser).not.toHaveBeenCalled()
  })

  it("should render scale marks in vertical orientation", () => {
    const { container } = render(<LevelMeter />)

    // Look for scale marks (dB indicators)
    const scaleMarks = container.querySelectorAll(".h-px.bg-zinc-600")
    expect(scaleMarks.length).toBeGreaterThan(0)
  })

  it("should render level bars", () => {
    const { container } = render(<LevelMeter />)

    // Look for level bars
    const levelBars = container.querySelectorAll("[style*='height']")
    expect(levelBars.length).toBeGreaterThan(0)
  })

  it("should render peak indicators", () => {
    const { container } = render(<LevelMeter />)

    // Look for peak indicators
    const peakIndicators = container.querySelectorAll(".bg-white")
    expect(peakIndicators.length).toBeGreaterThan(0)
  })

  it("should handle different channel counts", () => {
    const { container } = render(<LevelMeter channels={1} audioContext={mockAudioContext} source={mockAudioNode} />)

    const meters = container.querySelectorAll(".relative.w-4")
    expect(meters).toHaveLength(1)
  })

  it("should update levels with audio data", () => {
    const mockAnalyser = {
      fftSize: 256,
      smoothingTimeConstant: 0.8,
      frequencyBinCount: 128,
      connect: vi.fn(),
      disconnect: vi.fn(),
      getFloatTimeDomainData: vi.fn((dataArray: Float32Array) => {
        // Simulate louder audio signal
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.sin(i * 0.1) * 0.8
        }
      }),
    }

    const mockContext = {
      createAnalyser: vi.fn(() => mockAnalyser),
    } as unknown as AudioContext

    const { container } = render(<LevelMeter audioContext={mockContext} source={mockAudioNode} />)

    expect(mockAnalyser.getFloatTimeDomainData).toHaveBeenCalled()
  })

  it("should handle horizontal orientation correctly", () => {
    const { container } = render(
      <LevelMeter orientation="horizontal" audioContext={mockAudioContext} source={mockAudioNode} />,
    )

    // Check for horizontal layout
    expect(container.querySelector(".flex-col")).toBeInTheDocument()

    // Check for horizontal meters
    const horizontalMeters = container.querySelectorAll(".relative.h-4")
    expect(horizontalMeters).toHaveLength(2)
  })

  it("should apply correct color classes based on level", () => {
    const { container } = render(<LevelMeter />)

    // Level bars should have color classes
    const greenBars = container.querySelectorAll(".bg-green-500")
    const yellowBars = container.querySelectorAll(".bg-yellow-500")
    const redBars = container.querySelectorAll(".bg-red-500")

    // At least one color should be present
    expect(greenBars.length + yellowBars.length + redBars.length).toBeGreaterThan(0)
  })
})

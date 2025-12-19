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
    const { container } = render(<LevelMeter data-oid="tv.b6f7" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("should render with default props", () => {
    const { container } = render(<LevelMeter data-oid="f:.a-2h" />)

    // Should render with default 2 channels
    const meters = container.querySelectorAll(".relative.w-4")
    expect(meters).toHaveLength(2)

    // Should have vertical orientation by default
    expect(container.querySelector(".flex-row")).toBeInTheDocument()
  })

  it("should render mono meter (1 channel)", () => {
    const { container } = render(<LevelMeter channels={1} data-oid="rlmp77u" />)

    const meters = container.querySelectorAll(".relative.w-4")
    expect(meters).toHaveLength(1)
  })

  it("should render horizontal orientation", () => {
    const { container } = render(<LevelMeter orientation="horizontal" data-oid="4_z9re_" />)

    // Should have horizontal orientation
    expect(container.querySelector(".flex-col")).toBeInTheDocument()

    // Should render horizontal meters
    const meters = container.querySelectorAll(".relative.h-4")
    expect(meters).toHaveLength(2)
  })

  it("should apply custom className", () => {
    const { container } = render(<LevelMeter className="custom-class" data-oid="-vcej5." />)

    expect(container.querySelector(".custom-class")).toBeInTheDocument()
  })

  it("should create analyser when audioContext and source are provided", () => {
    render(<LevelMeter audioContext={mockAudioContext} source={mockAudioNode} data-oid="0:d6w5g" />)

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

    render(<LevelMeter audioContext={mockContext} source={mockAudioNode} data-oid="acl8z4q" />)

    expect(mockAnalyser.fftSize).toBe(256)
    expect(mockAnalyser.smoothingTimeConstant).toBe(0.8)
  })

  it("should start animation loop when audioContext and source are provided", () => {
    render(<LevelMeter audioContext={mockAudioContext} source={mockAudioNode} data-oid="w5c8kfr" />)

    expect(mockRaf).toHaveBeenCalled()
  })

  it("should cleanup on unmount", () => {
    const { unmount } = render(<LevelMeter audioContext={mockAudioContext} source={mockAudioNode} data-oid="sh-yj8r" />)

    unmount()

    expect(mockCancelRaf).toHaveBeenCalled()
    expect(mockAudioNode.disconnect).toHaveBeenCalled()
  })

  it("should not create analyser without audioContext", () => {
    render(<LevelMeter source={mockAudioNode} data-oid="c1c9ava" />)

    expect(mockAudioContext.createAnalyser).not.toHaveBeenCalled()
  })

  it("should not create analyser without source", () => {
    render(<LevelMeter audioContext={mockAudioContext} data-oid="8r8u9qb" />)

    expect(mockAudioContext.createAnalyser).not.toHaveBeenCalled()
  })

  it("should render scale marks in vertical orientation", () => {
    const { container } = render(<LevelMeter data-oid="dfrm9y9" />)

    // Look for scale marks (dB indicators)
    const scaleMarks = container.querySelectorAll(".h-px.bg-zinc-600")
    expect(scaleMarks.length).toBeGreaterThan(0)
  })

  it("should render level bars", () => {
    const { container } = render(<LevelMeter data-oid="ojpk_zq" />)

    // Look for level bars
    const levelBars = container.querySelectorAll("[style*='height']")
    expect(levelBars.length).toBeGreaterThan(0)
  })

  it("should render peak indicators", () => {
    const { container } = render(<LevelMeter data-oid="aa4xt2_" />)

    // Look for peak indicators
    const peakIndicators = container.querySelectorAll(".bg-white")
    expect(peakIndicators.length).toBeGreaterThan(0)
  })

  it("should handle different channel counts", () => {
    const { container } = render(
      <LevelMeter channels={1} audioContext={mockAudioContext} source={mockAudioNode} data-oid="2ri4s0d" />,
    )

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

    const { container } = render(<LevelMeter audioContext={mockContext} source={mockAudioNode} data-oid="d-r6hgc" />)

    expect(mockAnalyser.getFloatTimeDomainData).toHaveBeenCalled()
  })

  it("should handle horizontal orientation correctly", () => {
    const { container } = render(
      <LevelMeter orientation="horizontal" audioContext={mockAudioContext} source={mockAudioNode} data-oid="r:9rujv" />,
    )

    // Check for horizontal layout
    expect(container.querySelector(".flex-col")).toBeInTheDocument()

    // Check for horizontal meters
    const horizontalMeters = container.querySelectorAll(".relative.h-4")
    expect(horizontalMeters).toHaveLength(2)
  })

  it("should apply correct color classes based on level", () => {
    const { container } = render(<LevelMeter data-oid="bv0g8g5" />)

    // Level bars should have color classes
    const greenBars = container.querySelectorAll(".bg-green-500")
    const yellowBars = container.querySelectorAll(".bg-yellow-500")
    const redBars = container.querySelectorAll(".bg-red-500")

    // At least one color should be present
    expect(greenBars.length + yellowBars.length + redBars.length).toBeGreaterThan(0)
  })
})

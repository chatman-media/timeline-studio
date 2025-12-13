/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useMidiIntegration } from "../use-midi-integration"

// Mock the hooks
const mockOnParameterChange = vi.fn()
const mockSetChannelVolume = vi.fn()
const mockSetChannelPan = vi.fn()
const mockSetMasterVolume = vi.fn()
const mockSetMasterLimiterThreshold = vi.fn()

vi.mock("../use-midi", () => ({
  useMidi: () => ({
    onParameterChange: mockOnParameterChange,
  }),
}))

vi.mock("../use-mixer-state", () => ({
  useMixerState: () => ({
    setChannelVolume: mockSetChannelVolume,
    setChannelPan: mockSetChannelPan,
    setMasterVolume: mockSetMasterVolume,
    setMasterLimiterThreshold: mockSetMasterLimiterThreshold,
  }),
}))

describe("useMidiIntegration", () => {
  let parameterChangeCallback: (data: { parameter: string; value: number }) => void
  const mockUnsubscribe = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Capture the callback passed to onParameterChange
    mockOnParameterChange.mockImplementation((callback) => {
      parameterChangeCallback = callback
      return mockUnsubscribe
    })
  })

  it("should subscribe to parameter changes on mount", () => {
    renderHook(() => useMidiIntegration())

    expect(mockOnParameterChange).toHaveBeenCalledTimes(1)
    expect(mockOnParameterChange).toHaveBeenCalledWith(expect.any(Function))
  })

  it("should unsubscribe on unmount", () => {
    const { unmount } = renderHook(() => useMidiIntegration())

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  describe("Channel Parameter Handling", () => {
    it("should handle channel volume changes", () => {
      renderHook(() => useMidiIntegration())

      parameterChangeCallback({
        parameter: "channel.1.volume",
        value: 0.75,
      })

      expect(mockSetChannelVolume).toHaveBeenCalledWith(0, 0.75)
    })

    it("should handle channel pan changes", () => {
      renderHook(() => useMidiIntegration())

      // Test center pan (0.5 -> 0)
      parameterChangeCallback({
        parameter: "channel.3.pan",
        value: 0.5,
      })

      expect(mockSetChannelPan).toHaveBeenCalledWith(2, 0)

      // Test full left (0 -> -1)
      parameterChangeCallback({
        parameter: "channel.1.pan",
        value: 0,
      })

      expect(mockSetChannelPan).toHaveBeenCalledWith(0, -1)

      // Test full right (1 -> 1)
      parameterChangeCallback({
        parameter: "channel.2.pan",
        value: 1,
      })

      expect(mockSetChannelPan).toHaveBeenCalledWith(1, 1)
    })

    it("should convert channel numbers from 1-based to 0-based", () => {
      renderHook(() => useMidiIntegration())

      parameterChangeCallback({
        parameter: "channel.5.volume",
        value: 0.5,
      })

      expect(mockSetChannelVolume).toHaveBeenCalledWith(4, 0.5)
    })

    it("should ignore invalid channel numbers", () => {
      renderHook(() => useMidiIntegration())

      // Non-numeric channel
      parameterChangeCallback({
        parameter: "channel.abc.volume",
        value: 0.5,
      })

      expect(mockSetChannelVolume).not.toHaveBeenCalled()

      // Missing channel number
      parameterChangeCallback({
        parameter: "channel..volume",
        value: 0.5,
      })

      expect(mockSetChannelVolume).not.toHaveBeenCalled()
    })

    it("should ignore unknown channel parameters", () => {
      renderHook(() => useMidiIntegration())

      parameterChangeCallback({
        parameter: "channel.1.solo",
        value: 1,
      })

      expect(mockSetChannelVolume).not.toHaveBeenCalled()
      expect(mockSetChannelPan).not.toHaveBeenCalled()
    })
  })

  describe("Master Parameter Handling", () => {
    it("should handle master volume changes", () => {
      renderHook(() => useMidiIntegration())

      parameterChangeCallback({
        parameter: "master.volume",
        value: 0.8,
      })

      expect(mockSetMasterVolume).toHaveBeenCalledWith(0.8)
    })

    it("should handle master limiter threshold changes", () => {
      renderHook(() => useMidiIntegration())

      // Test minimum value (0 -> -20 dB)
      parameterChangeCallback({
        parameter: "master.limiter.threshold",
        value: 0,
      })

      expect(mockSetMasterLimiterThreshold).toHaveBeenCalledWith(-20)

      // Test maximum value (1 -> 0 dB)
      parameterChangeCallback({
        parameter: "master.limiter.threshold",
        value: 1,
      })

      expect(mockSetMasterLimiterThreshold).toHaveBeenCalledWith(0)

      // Test middle value (0.5 -> -10 dB)
      parameterChangeCallback({
        parameter: "master.limiter.threshold",
        value: 0.5,
      })

      expect(mockSetMasterLimiterThreshold).toHaveBeenCalledWith(-10)
    })

    it("should ignore unknown master parameters", () => {
      renderHook(() => useMidiIntegration())

      parameterChangeCallback({
        parameter: "master.compressor.ratio",
        value: 0.5,
      })

      expect(mockSetMasterVolume).not.toHaveBeenCalled()
      expect(mockSetMasterLimiterThreshold).not.toHaveBeenCalled()
    })
  })

  describe("Invalid Parameter Handling", () => {
    it("should ignore parameters with less than 2 parts", () => {
      renderHook(() => useMidiIntegration())

      parameterChangeCallback({
        parameter: "volume",
        value: 0.5,
      })

      expect(mockSetChannelVolume).not.toHaveBeenCalled()
      expect(mockSetMasterVolume).not.toHaveBeenCalled()
    })

    it("should ignore unknown target types", () => {
      renderHook(() => useMidiIntegration())

      parameterChangeCallback({
        parameter: "bus.1.volume",
        value: 0.5,
      })

      expect(mockSetChannelVolume).not.toHaveBeenCalled()
      expect(mockSetMasterVolume).not.toHaveBeenCalled()
    })

    it("should handle empty parameter paths", () => {
      renderHook(() => useMidiIntegration())

      parameterChangeCallback({
        parameter: "",
        value: 0.5,
      })

      expect(mockSetChannelVolume).not.toHaveBeenCalled()
      expect(mockSetMasterVolume).not.toHaveBeenCalled()
    })
  })

  describe("Edge Cases", () => {
    it("should handle extreme values", () => {
      renderHook(() => useMidiIntegration())

      // Volume at max
      parameterChangeCallback({
        parameter: "channel.1.volume",
        value: 1,
      })

      expect(mockSetChannelVolume).toHaveBeenCalledWith(0, 1)

      // Volume at min
      parameterChangeCallback({
        parameter: "channel.1.volume",
        value: 0,
      })

      expect(mockSetChannelVolume).toHaveBeenCalledWith(0, 0)
    })

    it("should handle multiple parameter changes", () => {
      renderHook(() => useMidiIntegration())

      // Change multiple parameters in sequence
      parameterChangeCallback({
        parameter: "channel.1.volume",
        value: 0.5,
      })

      parameterChangeCallback({
        parameter: "channel.2.pan",
        value: 0.25,
      })

      parameterChangeCallback({
        parameter: "master.volume",
        value: 0.9,
      })

      expect(mockSetChannelVolume).toHaveBeenCalledWith(0, 0.5)
      expect(mockSetChannelPan).toHaveBeenCalledWith(1, -0.5)
      expect(mockSetMasterVolume).toHaveBeenCalledWith(0.9)
    })

    it("should handle decimal channel numbers", () => {
      renderHook(() => useMidiIntegration())

      // parseInt will parse "1.5" as 1
      parameterChangeCallback({
        parameter: "channel.1.5.volume",
        value: 0.5,
      })

      // Since parseInt("1.5") returns 1, and we subtract 1, we get 0
      expect(mockSetChannelVolume).not.toHaveBeenCalled()

      // The parameter is treated as having 4 parts: ["channel", "1", "5", "volume"]
      // which doesn't match the expected format
    })

    it("should handle negative channel numbers", () => {
      renderHook(() => useMidiIntegration())

      // Negative channel numbers should work (though unusual)
      parameterChangeCallback({
        parameter: "channel.-1.volume",
        value: 0.5,
      })

      expect(mockSetChannelVolume).toHaveBeenCalledWith(-2, 0.5)
    })

    it("should handle channel 0", () => {
      renderHook(() => useMidiIntegration())

      // Channel 0 becomes -1 after conversion
      parameterChangeCallback({
        parameter: "channel.0.volume",
        value: 0.5,
      })

      expect(mockSetChannelVolume).toHaveBeenCalledWith(-1, 0.5)
    })
  })

  describe("Dependency Updates", () => {
    it("should maintain same subscription when dependencies don't change", () => {
      const { rerender } = renderHook(() => useMidiIntegration())

      expect(mockOnParameterChange).toHaveBeenCalledTimes(1)
      expect(mockUnsubscribe).toHaveBeenCalledTimes(0)

      // Re-render with same dependencies
      rerender()

      // Since all dependencies are mocked and stable, useEffect won't re-run
      expect(mockUnsubscribe).toHaveBeenCalledTimes(0)
      expect(mockOnParameterChange).toHaveBeenCalledTimes(1)
    })
  })
})

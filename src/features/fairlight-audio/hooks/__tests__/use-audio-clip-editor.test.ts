import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AudioClip, FadeOptions } from "../../services/audio-clip-editor"
import { useAudioClipEditor } from "../use-audio-clip-editor"

// Mock dependencies using vi.hoisted
const { mockUseAudioEngine, mockAudioEngine, mockClipEditor } = vi.hoisted(() => ({
  mockUseAudioEngine: vi.fn(),
  mockAudioEngine: {
    clipEditor: {
      trimClip: vi.fn(),
      splitClip: vi.fn(),
      applyFadeIn: vi.fn(),
      applyFadeOut: vi.fn(),
      createCrossfade: vi.fn(),
      normalizeClip: vi.fn(),
    },
  },
  mockClipEditor: {
    trimClip: vi.fn(),
    splitClip: vi.fn(),
    applyFadeIn: vi.fn(),
    applyFadeOut: vi.fn(),
    createCrossfade: vi.fn(),
    normalizeClip: vi.fn(),
  },
}))

vi.mock("../use-audio-engine", () => ({
  useAudioEngine: mockUseAudioEngine,
}))

// Create a mock AudioBuffer
const createMockAudioBuffer = (): AudioBuffer => {
  const audioContext = new AudioContext()
  return audioContext.createBuffer(2, 44100 * 10, 44100) // 10 seconds stereo buffer
}

const mockClip: AudioClip = {
  id: "clip-1",
  trackId: "track-1",
  audioBuffer: createMockAudioBuffer(),
  startTime: 0,
  duration: 10,
  fadeIn: 0,
  fadeOut: 0,
  gain: 1,
}

const mockFadeOptions: FadeOptions = {
  duration: 2,
  type: "linear",
}

describe("useAudioClipEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock returns
    mockUseAudioEngine.mockReturnValue({
      engine: mockAudioEngine,
    })
  })

  describe("initialization", () => {
    it("returns all clip editing functions", () => {
      const { result } = renderHook(() => useAudioClipEditor())

      expect(typeof result.current.trimClip).toBe("function")
      expect(typeof result.current.splitClip).toBe("function")
      expect(typeof result.current.applyFadeIn).toBe("function")
      expect(typeof result.current.applyFadeOut).toBe("function")
      expect(typeof result.current.createCrossfade).toBe("function")
      expect(typeof result.current.normalizeClip).toBe("function")
    })
  })

  describe("trimClip", () => {
    it("calls engine trimClip with correct parameters", async () => {
      const { result } = renderHook(() => useAudioClipEditor())

      const trimmedClip = { ...mockClip, startTime: 1, duration: 5 }
      mockAudioEngine.clipEditor.trimClip.mockResolvedValue(trimmedClip)

      const result_clip = await result.current.trimClip(mockClip, 1, 6)

      expect(mockAudioEngine.clipEditor.trimClip).toHaveBeenCalledWith(mockClip, 1, 6)
      expect(result_clip).toEqual(trimmedClip)
    })

    it("throws error when audio engine is not initialized", async () => {
      mockUseAudioEngine.mockReturnValue({ engine: null })

      const { result } = renderHook(() => useAudioClipEditor())

      await expect(result.current.trimClip(mockClip, 1, 6)).rejects.toThrow("Audio engine not initialized")
    })

    it("throws error when clipEditor is not available", async () => {
      mockUseAudioEngine.mockReturnValue({ engine: {} })

      const { result } = renderHook(() => useAudioClipEditor())

      await expect(result.current.trimClip(mockClip, 1, 6)).rejects.toThrow("Audio engine not initialized")
    })
  })

  describe("splitClip", () => {
    it("calls engine splitClip with correct parameters", async () => {
      const { result } = renderHook(() => useAudioClipEditor())

      const clipA = { ...mockClip, duration: 3 }
      const clipB = { ...mockClip, id: "clip-2", startTime: 3, duration: 7 }
      mockAudioEngine.clipEditor.splitClip.mockResolvedValue([clipA, clipB])

      const splitClips = await result.current.splitClip(mockClip, 3)

      expect(mockAudioEngine.clipEditor.splitClip).toHaveBeenCalledWith(mockClip, 3)
      expect(splitClips).toEqual([clipA, clipB])
    })

    it("throws error when audio engine is not initialized", async () => {
      mockUseAudioEngine.mockReturnValue({ engine: null })

      const { result } = renderHook(() => useAudioClipEditor())

      await expect(result.current.splitClip(mockClip, 3)).rejects.toThrow("Audio engine not initialized")
    })
  })

  describe("applyFadeIn", () => {
    it("calls engine applyFadeIn with correct parameters", () => {
      const { result } = renderHook(() => useAudioClipEditor())

      const fadedClip = { ...mockClip }
      mockAudioEngine.clipEditor.applyFadeIn.mockReturnValue(fadedClip)

      const result_clip = result.current.applyFadeIn(mockClip, mockFadeOptions)

      expect(mockAudioEngine.clipEditor.applyFadeIn).toHaveBeenCalledWith(mockClip, mockFadeOptions)
      expect(result_clip).toEqual(fadedClip)
    })

    it("throws error when audio engine is not initialized", () => {
      mockUseAudioEngine.mockReturnValue({ engine: null })

      const { result } = renderHook(() => useAudioClipEditor())

      expect(() => result.current.applyFadeIn(mockClip, mockFadeOptions)).toThrow("Audio engine not initialized")
    })
  })

  describe("applyFadeOut", () => {
    it("calls engine applyFadeOut with correct parameters", () => {
      const { result } = renderHook(() => useAudioClipEditor())

      const fadedClip = { ...mockClip }
      mockAudioEngine.clipEditor.applyFadeOut.mockReturnValue(fadedClip)

      const result_clip = result.current.applyFadeOut(mockClip, mockFadeOptions)

      expect(mockAudioEngine.clipEditor.applyFadeOut).toHaveBeenCalledWith(mockClip, mockFadeOptions)
      expect(result_clip).toEqual(fadedClip)
    })

    it("throws error when audio engine is not initialized", () => {
      mockUseAudioEngine.mockReturnValue({ engine: null })

      const { result } = renderHook(() => useAudioClipEditor())

      expect(() => result.current.applyFadeOut(mockClip, mockFadeOptions)).toThrow("Audio engine not initialized")
    })
  })

  describe("createCrossfade", () => {
    it("calls engine createCrossfade with correct parameters", async () => {
      const { result } = renderHook(() => useAudioClipEditor())

      const clipB = { ...mockClip, id: "clip-2" }
      const crossfadeResult = { clipA: mockClip, clipB, crossfadeDuration: 1.5 }
      mockAudioEngine.clipEditor.createCrossfade.mockResolvedValue(crossfadeResult)

      const result_crossfade = await result.current.createCrossfade(mockClip, clipB, 1.5, "exponential")

      expect(mockAudioEngine.clipEditor.createCrossfade).toHaveBeenCalledWith(mockClip, clipB, 1.5, "exponential")
      expect(result_crossfade).toEqual(crossfadeResult)
    })

    it("calls engine createCrossfade without fade type", async () => {
      const { result } = renderHook(() => useAudioClipEditor())

      const clipB = { ...mockClip, id: "clip-2" }
      const crossfadeResult = { clipA: mockClip, clipB, crossfadeDuration: 1.5 }
      mockAudioEngine.clipEditor.createCrossfade.mockResolvedValue(crossfadeResult)

      const result_crossfade = await result.current.createCrossfade(mockClip, clipB, 1.5)

      expect(mockAudioEngine.clipEditor.createCrossfade).toHaveBeenCalledWith(mockClip, clipB, 1.5, undefined)
      expect(result_crossfade).toEqual(crossfadeResult)
    })

    it("throws error when audio engine is not initialized", async () => {
      mockUseAudioEngine.mockReturnValue({ engine: null })

      const { result } = renderHook(() => useAudioClipEditor())

      const clipB = { ...mockClip, id: "clip-2" }
      await expect(result.current.createCrossfade(mockClip, clipB, 1.5)).rejects.toThrow("Audio engine not initialized")
    })
  })

  describe("normalizeClip", () => {
    it("calls engine normalizeClip with target level", () => {
      const { result } = renderHook(() => useAudioClipEditor())

      const normalizedClip = { ...mockClip }
      mockAudioEngine.clipEditor.normalizeClip.mockReturnValue(normalizedClip)

      const result_clip = result.current.normalizeClip(mockClip, -6)

      expect(mockAudioEngine.clipEditor.normalizeClip).toHaveBeenCalledWith(mockClip, -6)
      expect(result_clip).toEqual(normalizedClip)
    })

    it("calls engine normalizeClip without target level", () => {
      const { result } = renderHook(() => useAudioClipEditor())

      const normalizedClip = { ...mockClip }
      mockAudioEngine.clipEditor.normalizeClip.mockReturnValue(normalizedClip)

      const result_clip = result.current.normalizeClip(mockClip)

      expect(mockAudioEngine.clipEditor.normalizeClip).toHaveBeenCalledWith(mockClip, undefined)
      expect(result_clip).toEqual(normalizedClip)
    })

    it("throws error when audio engine is not initialized", () => {
      mockUseAudioEngine.mockReturnValue({ engine: null })

      const { result } = renderHook(() => useAudioClipEditor())

      expect(() => result.current.normalizeClip(mockClip)).toThrow("Audio engine not initialized")
    })
  })

  describe("function stability", () => {
    it("returns stable function references", () => {
      const { result, rerender } = renderHook(() => useAudioClipEditor())

      const firstRender = result.current

      rerender()

      const secondRender = result.current

      // Functions should be the same reference (stable)
      expect(secondRender.trimClip).toBe(firstRender.trimClip)
      expect(secondRender.splitClip).toBe(firstRender.splitClip)
      expect(secondRender.applyFadeIn).toBe(firstRender.applyFadeIn)
      expect(secondRender.applyFadeOut).toBe(firstRender.applyFadeOut)
      expect(secondRender.createCrossfade).toBe(firstRender.createCrossfade)
      expect(secondRender.normalizeClip).toBe(firstRender.normalizeClip)
    })
  })

  describe("error handling", () => {
    it("propagates errors from clip editor operations", async () => {
      const { result } = renderHook(() => useAudioClipEditor())

      const error = new Error("Clip processing failed")
      mockAudioEngine.clipEditor.trimClip.mockRejectedValue(error)

      await expect(result.current.trimClip(mockClip, 1, 6)).rejects.toThrow("Clip processing failed")
    })

    it("propagates synchronous errors from clip editor operations", () => {
      const { result } = renderHook(() => useAudioClipEditor())

      const error = new Error("Fade processing failed")
      mockAudioEngine.clipEditor.applyFadeIn.mockImplementation(() => {
        throw error
      })

      expect(() => result.current.applyFadeIn(mockClip, mockFadeOptions)).toThrow("Fade processing failed")
    })
  })

  describe("edge cases", () => {
    it("handles zero duration fade", () => {
      const { result } = renderHook(() => useAudioClipEditor())

      const zeroFadeOptions: FadeOptions = { duration: 0, type: "linear" }
      const fadedClip = { ...mockClip }
      mockAudioEngine.clipEditor.applyFadeIn.mockReturnValue(fadedClip)

      const result_clip = result.current.applyFadeIn(mockClip, zeroFadeOptions)

      expect(mockAudioEngine.clipEditor.applyFadeIn).toHaveBeenCalledWith(mockClip, zeroFadeOptions)
      expect(result_clip).toEqual(fadedClip)
    })

    it("handles split at start of clip", async () => {
      const { result } = renderHook(() => useAudioClipEditor())

      const clipA = { ...mockClip, duration: 0 }
      const clipB = { ...mockClip, id: "clip-2", startTime: 0, duration: 10 }
      mockAudioEngine.clipEditor.splitClip.mockResolvedValue([clipA, clipB])

      const splitClips = await result.current.splitClip(mockClip, 0)

      expect(mockAudioEngine.clipEditor.splitClip).toHaveBeenCalledWith(mockClip, 0)
      expect(splitClips).toEqual([clipA, clipB])
    })

    it("handles split at end of clip", async () => {
      const { result } = renderHook(() => useAudioClipEditor())

      const clipA = { ...mockClip, duration: 10 }
      const clipB = { ...mockClip, id: "clip-2", startTime: 10, duration: 0 }
      mockAudioEngine.clipEditor.splitClip.mockResolvedValue([clipA, clipB])

      const splitClips = await result.current.splitClip(mockClip, 10)

      expect(mockAudioEngine.clipEditor.splitClip).toHaveBeenCalledWith(mockClip, 10)
      expect(splitClips).toEqual([clipA, clipB])
    })

    it("handles trim with start offset equal to end offset", async () => {
      const { result } = renderHook(() => useAudioClipEditor())

      const trimmedClip = { ...mockClip, startTime: 5, duration: 0 }
      mockAudioEngine.clipEditor.trimClip.mockResolvedValue(trimmedClip)

      const result_clip = await result.current.trimClip(mockClip, 5, 5)

      expect(mockAudioEngine.clipEditor.trimClip).toHaveBeenCalledWith(mockClip, 5, 5)
      expect(result_clip).toEqual(trimmedClip)
    })

    it("handles zero duration crossfade", async () => {
      const { result } = renderHook(() => useAudioClipEditor())

      const clipB = { ...mockClip, id: "clip-2" }
      const crossfadeResult = { clipA: mockClip, clipB, crossfadeDuration: 0 }
      mockAudioEngine.clipEditor.createCrossfade.mockResolvedValue(crossfadeResult)

      const result_crossfade = await result.current.createCrossfade(mockClip, clipB, 0)

      expect(mockAudioEngine.clipEditor.createCrossfade).toHaveBeenCalledWith(mockClip, clipB, 0, undefined)
      expect(result_crossfade).toEqual(crossfadeResult)
    })
  })

  describe("audio engine dependency", () => {
    it("updates function behavior when audio engine changes", () => {
      const { result, rerender } = renderHook(() => useAudioClipEditor())

      // Initially with engine
      expect(() => result.current.normalizeClip(mockClip)).not.toThrow()

      // Change to no engine
      mockUseAudioEngine.mockReturnValue({ engine: null })
      rerender()

      // Should now throw error
      expect(() => result.current.normalizeClip(mockClip)).toThrow("Audio engine not initialized")
    })

    it("handles engine with missing clipEditor property", () => {
      mockUseAudioEngine.mockReturnValue({ engine: {} })

      const { result } = renderHook(() => useAudioClipEditor())

      expect(() => result.current.normalizeClip(mockClip)).toThrow("Audio engine not initialized")
    })
  })
})

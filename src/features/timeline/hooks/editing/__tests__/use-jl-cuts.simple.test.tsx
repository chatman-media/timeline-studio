import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useJLCuts } from "../use-jl-cuts"
import { useTimeline } from "../../state/use-timeline"

// Mock useTimeline hook
vi.mock("../../hooks/use-timeline", () => ({
  useTimeline: vi.fn(),
}))

describe("useJLCuts - Simple Tests", () => {
  const mockSend = vi.fn()
  const mockUpdateClip = vi.fn()

  const mockVideoClip = {
    id: "video-1",
    trackId: "video-track",
    linkedClipId: "audio-1",
    isLinked: true,
    audioOffset: 0,
  }

  const mockAudioClip = {
    id: "audio-1",
    trackId: "audio-track",
    linkedClipId: "video-1",
    isLinked: true,
    audioOffset: 0,
  }

  const mockProject = {
    sections: [
      {
        tracks: [
          {
            id: "video-track",
            type: "video",
            clips: [mockVideoClip],
          },
          {
            id: "audio-track",
            type: "audio",
            clips: [mockAudioClip],
          },
        ],
      },
    ],
    globalTracks: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useTimeline as any).mockReturnValue({
      project: mockProject,
      send: mockSend,
      updateClip: mockUpdateClip,
    })
  })

  it("should create J-Cut correctly", async () => {
    const { result } = renderHook(() => useJLCuts())

    await act(async () => {
      await result.current.createJCut("video-1", 0.5)
    })

    expect(mockUpdateClip).toHaveBeenCalledWith("audio-1", {
      audioOffset: -0.5,
    })
  })

  it("should create L-Cut correctly", async () => {
    const { result } = renderHook(() => useJLCuts())

    await act(async () => {
      await result.current.createLCut("video-1", 0.5)
    })

    expect(mockUpdateClip).toHaveBeenCalledWith("audio-1", {
      audioOffset: 0.5,
    })
  })

  it("should reset cut correctly", async () => {
    const { result } = renderHook(() => useJLCuts())

    await act(async () => {
      await result.current.resetCut("video-1")
    })

    expect(mockUpdateClip).toHaveBeenCalledWith("audio-1", {
      audioOffset: 0,
    })
  })

  it("should link clips correctly", async () => {
    const { result } = renderHook(() => useJLCuts())

    await act(async () => {
      await result.current.linkClips("video-2", "audio-2")
    })

    expect(mockUpdateClip).toHaveBeenCalledTimes(2)
    expect(mockUpdateClip).toHaveBeenNthCalledWith(1, "video-2", {
      linkedClipId: "audio-2",
      isLinked: true,
    })
    expect(mockUpdateClip).toHaveBeenNthCalledWith(2, "audio-2", {
      linkedClipId: "video-2",
      isLinked: true,
    })
  })

  it("should unlink clips correctly", async () => {
    const { result } = renderHook(() => useJLCuts())

    await act(async () => {
      await result.current.unlinkClips("video-1")
    })

    expect(mockUpdateClip).toHaveBeenCalledTimes(2)
    expect(mockUpdateClip).toHaveBeenNthCalledWith(1, "video-1", {
      linkedClipId: undefined,
      isLinked: false,
      audioOffset: 0,
    })
    expect(mockUpdateClip).toHaveBeenNthCalledWith(2, "audio-1", {
      linkedClipId: undefined,
      isLinked: false,
      audioOffset: 0,
    })
  })

  it("should identify video clip correctly", () => {
    const { result } = renderHook(() => useJLCuts())

    expect(result.current.isVideoClip(mockVideoClip as any)).toBe(true)
    expect(result.current.isAudioClip(mockVideoClip as any)).toBe(false)
  })

  it("should identify audio clip correctly", () => {
    const { result } = renderHook(() => useJLCuts())

    expect(result.current.isAudioClip(mockAudioClip as any)).toBe(true)
    expect(result.current.isVideoClip(mockAudioClip as any)).toBe(false)
  })

  it("should get linked clip correctly", () => {
    const { result } = renderHook(() => useJLCuts())

    const linkedClip = result.current.getLinkedClip("video-1")
    expect(linkedClip?.id).toBe("audio-1")
  })

  it("should detect J/L cut correctly", () => {
    const { result } = renderHook(() => useJLCuts())

    // No offset - no J/L cut
    expect(result.current.hasJLCut("video-1")).toBe(false)

    // With offset - has J/L cut
    mockAudioClip.audioOffset = 0.5
    expect(result.current.hasJLCut("video-1")).toBe(true)
  })
})

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { TimelineProject } from "@/features/timeline/types"
import { useTimeline } from "../../state/use-timeline"
import { useJLCuts } from "../use-jl-cuts"

// Mock useTimeline hook
vi.mock("../../hooks/use-timeline", () => ({
  useTimeline: vi.fn(),
}))

// Mock timeline project
const mockProject: TimelineProject = {
  id: "test-project",
  name: "Test Project",
  duration: 120,
  fps: 30,
  sampleRate: 48000,
  sections: [
    {
      id: "section-1",
      index: 0,
      name: "Section 1",
      startTime: 0,
      endTime: 60,
      duration: 60,
      tracks: [
        {
          id: "video-track",
          name: "V1",
          type: "video",
          order: 0,
          clips: [
            {
              id: "video-clip-1",
              name: "Video Clip 1",
              type: "video",
              mediaId: "media-1",
              mediaFile: {
                id: "media-1",
                name: "video.mp4",
                path: "/path/to/video.mp4",
                type: "video" as any,
                duration: 20,
                size: 1000000,
                createdAt: new Date(),
              },
              trackId: "video-track",
              startTime: 10,
              duration: 20,
              mediaStartTime: 0,
              mediaEndTime: 20,
              offset: 0,
              volume: 1,
              speed: 1,
              playbackRate: 1,
              isReversed: false,
              opacity: 1,
              effects: [],
              filters: [],
              transitions: [],
              isSelected: false,
              isLocked: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              linkedClipId: "audio-clip-1",
              isLinked: true,
            },
          ],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 60,
          trackEffects: [],
          trackFilters: [],
          transitions: [],
        },
        {
          id: "audio-track",
          name: "A1",
          type: "audio",
          order: 1,
          clips: [
            {
              id: "audio-clip-1",
              name: "Audio Clip 1",
              type: "audio",
              mediaId: "media-2",
              mediaFile: {
                id: "media-2",
                name: "audio.mp3",
                path: "/path/to/audio.mp3",
                type: "audio" as any,
                duration: 20,
                size: 500000,
                createdAt: new Date(),
              },
              trackId: "audio-track",
              startTime: 10,
              duration: 20,
              mediaStartTime: 0,
              mediaEndTime: 20,
              offset: 0,
              volume: 1,
              speed: 1,
              playbackRate: 1,
              isReversed: false,
              opacity: 1,
              effects: [],
              filters: [],
              transitions: [],
              isSelected: false,
              isLocked: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              linkedClipId: "video-clip-1",
              isLinked: true,
              audioOffset: 0,
            },
          ],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 60,
          trackEffects: [],
          trackFilters: [],
          transitions: [],
        },
      ],
      isCollapsed: false,
    },
  ],
  globalTracks: [],
  resources: {
    effects: [],
    filters: [],
    transitions: [],
    timelineTransitions: [],
    templates: [],
    styleTemplates: [],
    subtitleStyles: [],
    music: [],
    media: [],
  },
  settings: {
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    aspectRatio: "16:9",
    sampleRate: 48000,
    channels: 2,
    bitDepth: 16,
    timeFormat: "timecode",
    snapToGrid: true,
    gridSize: 1,
    autoSave: true,
    autoSaveInterval: 300,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  version: "1.0.0",
}

describe("useJLCuts", () => {
  const mockSend = vi.fn()
  const mockUpdateClip = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset audio offset before each test
    const audioClip = mockProject.sections[0].tracks[1].clips[0]
    audioClip.audioOffset = 0

    // Setup useTimeline mock
    vi.mocked(useTimeline).mockReturnValue({
      project: mockProject,
      send: mockSend,
      updateClip: mockUpdateClip,
    } as any)
  })

  it("should get linked clip correctly", () => {
    const { result } = renderHook(() => useJLCuts(), {})

    const linkedClip = result.current.getLinkedClip("video-clip-1")
    expect(linkedClip).toBeDefined()
    expect(linkedClip?.id).toBe("audio-clip-1")
  })

  it("should get linked pair correctly", () => {
    const { result } = renderHook(() => useJLCuts(), {})

    const pair = result.current.getLinkedPair("video-clip-1")
    expect(pair).toBeDefined()
    expect(pair?.videoClipId).toBe("video-clip-1")
    expect(pair?.audioClipId).toBe("audio-clip-1")
    expect(pair?.isLinked).toBe(true)
  })

  it("should create J-Cut correctly", () => {
    const { result } = renderHook(() => useJLCuts(), {})

    act(() => {
      result.current.createJCut("video-clip-1", 0.5)
    })

    expect(mockUpdateClip).toHaveBeenCalledWith("audio-clip-1", {
      audioOffset: -0.5,
    })
  })

  it("should create L-Cut correctly", () => {
    const { result } = renderHook(() => useJLCuts(), {})

    act(() => {
      result.current.createLCut("video-clip-1", 0.5)
    })

    expect(mockUpdateClip).toHaveBeenCalledWith("audio-clip-1", {
      audioOffset: 0.5,
    })
  })

  it("should reset cut correctly", () => {
    const { result } = renderHook(() => useJLCuts(), {})

    act(() => {
      result.current.resetCut("video-clip-1")
    })

    expect(mockUpdateClip).toHaveBeenCalledWith("audio-clip-1", {
      audioOffset: 0,
    })
  })

  it("should link clips correctly", () => {
    const { result } = renderHook(() => useJLCuts(), {})

    act(() => {
      result.current.linkClips("video-clip-2", "audio-clip-2")
    })

    expect(mockUpdateClip).toHaveBeenCalledTimes(2)
    expect(mockUpdateClip).toHaveBeenNthCalledWith(1, "video-clip-2", {
      linkedClipId: "audio-clip-2",
      isLinked: true,
    })
    expect(mockUpdateClip).toHaveBeenNthCalledWith(2, "audio-clip-2", {
      linkedClipId: "video-clip-2",
      isLinked: true,
    })
  })

  it("should unlink clips correctly", () => {
    const { result } = renderHook(() => useJLCuts(), {})

    act(() => {
      result.current.unlinkClips("video-clip-1")
    })

    expect(mockUpdateClip).toHaveBeenCalledTimes(2)
    expect(mockUpdateClip).toHaveBeenNthCalledWith(1, "video-clip-1", {
      linkedClipId: undefined,
      isLinked: false,
      audioOffset: 0,
    })
    expect(mockUpdateClip).toHaveBeenNthCalledWith(2, "audio-clip-1", {
      linkedClipId: undefined,
      isLinked: false,
      audioOffset: 0,
    })
  })

  it("should identify video clips correctly", () => {
    const { result } = renderHook(() => useJLCuts(), {})

    const videoClip = mockProject.sections[0].tracks[0].clips[0] as any
    const audioClip = mockProject.sections[0].tracks[1].clips[0] as any

    expect(result.current.isVideoClip(videoClip)).toBe(true)
    expect(result.current.isVideoClip(audioClip)).toBe(false)
  })

  it("should identify audio clips correctly", () => {
    const { result } = renderHook(() => useJLCuts(), {})

    const videoClip = mockProject.sections[0].tracks[0].clips[0] as any
    const audioClip = mockProject.sections[0].tracks[1].clips[0] as any

    expect(result.current.isAudioClip(audioClip)).toBe(true)
    expect(result.current.isAudioClip(videoClip)).toBe(false)
  })

  it("should get cut preview correctly", () => {
    const { result } = renderHook(() => useJLCuts(), {})

    const preview = result.current.getCutPreview("video-clip-1", "j-cut", 0.5)

    expect(preview).toBeDefined()
    expect(preview?.videoStart).toBe(10)
    expect(preview?.videoEnd).toBe(30)
    expect(preview?.audioStart).toBe(10.5) // J-Cut offset
    expect(preview?.cutType).toBe("j-cut")
    expect(preview?.offset).toBe(0.5)
  })
})

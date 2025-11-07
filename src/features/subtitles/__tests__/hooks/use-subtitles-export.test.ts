import { invoke } from "@tauri-apps/api/core"
import { save } from "@tauri-apps/plugin-dialog"
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useTracks } from "@/features/timeline/hooks/use-tracks"

import { useSubtitlesExport } from "../../hooks/use-subtitles-export"

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: vi.fn(),
}))

vi.mock("@/features/timeline/hooks/use-tracks", () => ({
  useTracks: vi.fn(() => ({
    tracks: [
      {
        id: "subtitle-track-1",
        type: "subtitle",
        clips: [
          {
            id: "sub-1",
            trackId: "subtitle-track-1",
            type: "subtitle",
            startTime: 0,
            duration: 2,
            text: "First subtitle",
          },
          {
            id: "sub-2",
            trackId: "subtitle-track-1",
            type: "subtitle",
            startTime: 3,
            duration: 2,
            text: "Second subtitle",
          },
        ],
      },
    ],
  })),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe("useSubtitlesExport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should export subtitles to SRT format", async () => {
    const mockFilePath = "/path/to/output.srt"
    vi.mocked(save).mockResolvedValueOnce(mockFilePath)
    vi.mocked(invoke).mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useSubtitlesExport())

    await act(async () => {
      await result.current.exportSubtitleFile("srt")
    })

    expect(save).toHaveBeenCalledWith({
      filters: [
        {
          name: "SRT Subtitles",
          extensions: ["srt"],
        },
      ],
      defaultPath: "subtitles.srt",
    })

    expect(invoke).toHaveBeenCalledWith("save_subtitle_file", {
      options: {
        format: "srt",
        content: expect.stringContaining("00:00:00,000 --> 00:00:02,000"),
        output_path: mockFilePath,
      },
    })
  })

  it("should export subtitles to VTT format", async () => {
    const mockFilePath = "/path/to/output.vtt"
    vi.mocked(save).mockResolvedValueOnce(mockFilePath)
    vi.mocked(invoke).mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useSubtitlesExport())

    await act(async () => {
      await result.current.exportSubtitleFile("vtt")
    })

    expect(save).toHaveBeenCalledWith({
      filters: [
        {
          name: "VTT Subtitles",
          extensions: ["vtt"],
        },
      ],
      defaultPath: "subtitles.vtt",
    })

    expect(invoke).toHaveBeenCalledWith("save_subtitle_file", {
      options: {
        format: "vtt",
        content: expect.stringContaining("WEBVTT"),
        output_path: mockFilePath,
      },
    })
  })

  it("should export subtitles to ASS format", async () => {
    const mockFilePath = "/path/to/output.ass"
    vi.mocked(save).mockResolvedValueOnce(mockFilePath)
    vi.mocked(invoke).mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useSubtitlesExport())

    await act(async () => {
      await result.current.exportSubtitleFile("ass")
    })

    expect(save).toHaveBeenCalledWith({
      filters: [
        {
          name: "ASS Subtitles",
          extensions: ["ass"],
        },
      ],
      defaultPath: "subtitles.ass",
    })

    expect(invoke).toHaveBeenCalledWith("save_subtitle_file", {
      options: {
        format: "ass",
        content: expect.stringContaining("[Script Info]"),
        output_path: mockFilePath,
      },
    })
  })

  it("should get subtitles from timeline", () => {
    const { result } = renderHook(() => useSubtitlesExport())

    const subtitles = result.current.getSubtitlesFromTimeline()

    expect(subtitles).toHaveLength(2)
    expect(subtitles[0].text).toBe("First subtitle")
    expect(subtitles[1].text).toBe("Second subtitle")
  })

  it("should handle no subtitles on timeline", async () => {
    // Override the mock to return empty tracks
    vi.mocked(useTracks).mockReturnValueOnce({
      tracks: [],
      globalTracks: [],
      sectionTracks: [],
      getTracksByType: vi.fn(() => []),
      getTracksBySection: vi.fn(() => []),
      findTrack: vi.fn(() => null),
      selectedTracks: [],
      visibleTracks: [],
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      updateTrack: vi.fn(async () => {}),
      toggleTrackMute: vi.fn(),
      toggleTrackLock: vi.fn(),
      toggleTrackVisibility: vi.fn(),
      toggleTrackSolo: vi.fn(),
      setTrackVolume: vi.fn(),
      setTrackPan: vi.fn(),
      setTrackHeight: vi.fn(),
      selectTrack: vi.fn(),
      selectMultipleTracks: vi.fn(),
      clearTrackSelection: vi.fn(),
      canAddTrackToSection: vi.fn(() => true),
      getTrackStats: vi.fn(() => ({
        clipCount: 0,
        totalDuration: 0,
        isEmpty: true,
      })),
    } as any)

    const { result } = renderHook(() => useSubtitlesExport())

    await act(async () => {
      await result.current.exportSubtitleFile("srt")
    })

    expect(save).not.toHaveBeenCalled()
    expect(invoke).not.toHaveBeenCalled()
  })

  it("should handle cancelled save dialog", async () => {
    vi.mocked(save).mockResolvedValueOnce(null)

    const { result } = renderHook(() => useSubtitlesExport())

    await act(async () => {
      await result.current.exportSubtitleFile("srt")
    })

    expect(invoke).not.toHaveBeenCalled()
  })

  it("should export selected subtitles", async () => {
    const mockFilePath = "/path/to/output.srt"
    vi.mocked(save).mockResolvedValueOnce(mockFilePath)
    vi.mocked(invoke).mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useSubtitlesExport())

    await act(async () => {
      await result.current.exportSelectedSubtitles(["sub-1"], "srt")
    })

    expect(invoke).toHaveBeenCalledWith("save_subtitle_file", {
      options: {
        format: "srt",
        content: expect.stringContaining("First subtitle"),
        output_path: mockFilePath,
      },
    })
  })

  it("should export subtitles by time range", async () => {
    const mockFilePath = "/path/to/output.srt"
    vi.mocked(save).mockResolvedValueOnce(mockFilePath)
    vi.mocked(invoke).mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useSubtitlesExport())

    await act(async () => {
      await result.current.exportSubtitlesByTimeRange(2.5, 5, "srt")
    })

    expect(invoke).toHaveBeenCalledWith("save_subtitle_file", {
      options: {
        format: "srt",
        content: expect.stringContaining("Second subtitle"),
        output_path: mockFilePath,
      },
    })
  })

  it("should handle export errors", async () => {
    const mockError = new Error("Failed to save file")
    vi.mocked(save).mockResolvedValueOnce("/path/to/output.srt")
    vi.mocked(invoke).mockRejectedValueOnce(mockError)

    const { result } = renderHook(() => useSubtitlesExport())

    await act(async () => {
      await result.current.exportSubtitleFile("srt")
    })

    expect(result.current.isExporting).toBe(false)
  })
})

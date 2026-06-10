/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useTracks } from "@/features/timeline/hooks/state/use-tracks"

import { useSubtitlesExport } from "../../hooks/use-subtitles-export"

// Mock core subtitle service
const mockSaveSubtitleFile = vi.fn()

vi.mock("@timeline-studio/core/services/subtitles", () => ({
  subtitleService: {
    exportSubtitleFile: (...args: any[]) => mockSaveSubtitleFile(...args),
  },
}))

// Mock @timeline-studio/core container
const mockShowSaveDialog = vi.fn()

vi.mock("@timeline-studio/core", () => ({
  container: {
    hasPlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => ({
      showSaveDialog: mockShowSaveDialog,
    })),
  },
}))

vi.mock("@/features/timeline/hooks/state/use-tracks", () => ({
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

vi.mock("@/domains/system-integration", () => ({
  useNotifications: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}))

describe("useSubtitlesExport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should export subtitles to SRT format", async () => {
    const mockFilePath = "/path/to/output.srt"
    mockShowSaveDialog.mockResolvedValueOnce(mockFilePath)
    mockSaveSubtitleFile.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useSubtitlesExport())

    await act(async () => {
      await result.current.exportSubtitleFile("srt")
    })

    expect(mockShowSaveDialog).toHaveBeenCalledWith({
      filters: [
        {
          name: "SRT Subtitles",
          extensions: ["srt"],
        },
      ],
      defaultPath: "subtitles.srt",
    })

    expect(mockSaveSubtitleFile).toHaveBeenCalledWith({
      format: "srt",
      content: expect.stringContaining("00:00:00,000 --> 00:00:02,000"),
      output_path: mockFilePath,
    })
  })

  it("should export subtitles to VTT format", async () => {
    const mockFilePath = "/path/to/output.vtt"
    mockShowSaveDialog.mockResolvedValueOnce(mockFilePath)
    mockSaveSubtitleFile.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useSubtitlesExport())

    await act(async () => {
      await result.current.exportSubtitleFile("vtt")
    })

    expect(mockShowSaveDialog).toHaveBeenCalledWith({
      filters: [
        {
          name: "VTT Subtitles",
          extensions: ["vtt"],
        },
      ],
      defaultPath: "subtitles.vtt",
    })

    expect(mockSaveSubtitleFile).toHaveBeenCalledWith({
      format: "vtt",
      content: expect.stringContaining("WEBVTT"),
      output_path: mockFilePath,
    })
  })

  it("should export subtitles to ASS format", async () => {
    const mockFilePath = "/path/to/output.ass"
    mockShowSaveDialog.mockResolvedValueOnce(mockFilePath)
    mockSaveSubtitleFile.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useSubtitlesExport())

    await act(async () => {
      await result.current.exportSubtitleFile("ass")
    })

    expect(mockShowSaveDialog).toHaveBeenCalledWith({
      filters: [
        {
          name: "ASS Subtitles",
          extensions: ["ass"],
        },
      ],
      defaultPath: "subtitles.ass",
    })

    expect(mockSaveSubtitleFile).toHaveBeenCalledWith({
      format: "ass",
      content: expect.stringContaining("[Script Info]"),
      output_path: mockFilePath,
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

    expect(mockShowSaveDialog).not.toHaveBeenCalled()
    expect(mockSaveSubtitleFile).not.toHaveBeenCalled()
  })

  it("should handle cancelled save dialog", async () => {
    mockShowSaveDialog.mockResolvedValueOnce(null)

    const { result } = renderHook(() => useSubtitlesExport())

    await act(async () => {
      await result.current.exportSubtitleFile("srt")
    })

    expect(mockSaveSubtitleFile).not.toHaveBeenCalled()
  })

  it("should export selected subtitles", async () => {
    const mockFilePath = "/path/to/output.srt"
    mockShowSaveDialog.mockResolvedValueOnce(mockFilePath)
    mockSaveSubtitleFile.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useSubtitlesExport())

    await act(async () => {
      await result.current.exportSelectedSubtitles(["sub-1"], "srt")
    })

    expect(mockSaveSubtitleFile).toHaveBeenCalledWith({
      format: "srt",
      content: expect.stringContaining("First subtitle"),
      output_path: mockFilePath,
    })
  })

  it("should export subtitles by time range", async () => {
    const mockFilePath = "/path/to/output.srt"
    mockShowSaveDialog.mockResolvedValueOnce(mockFilePath)
    mockSaveSubtitleFile.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useSubtitlesExport())

    await act(async () => {
      await result.current.exportSubtitlesByTimeRange(2.5, 5, "srt")
    })

    expect(mockSaveSubtitleFile).toHaveBeenCalledWith({
      format: "srt",
      content: expect.stringContaining("Second subtitle"),
      output_path: mockFilePath,
    })
  })

  it("should handle export errors", async () => {
    const mockError = new Error("Failed to save file")
    mockShowSaveDialog.mockResolvedValueOnce("/path/to/output.srt")
    mockSaveSubtitleFile.mockRejectedValueOnce(mockError)

    const { result } = renderHook(() => useSubtitlesExport())

    await act(async () => {
      await result.current.exportSubtitleFile("srt")
    })

    expect(result.current.isExporting).toBe(false)
  })
})

/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useSubtitlesImport } from "../../hooks/use-subtitles-import"

// Mock core subtitle service
const mockReadSubtitleFile = vi.fn()
const mockShowOpenDialog = vi.fn()

vi.mock("@timeline-studio/core/services/subtitles", () => ({
  readSubtitleFile: (...args: any[]) => mockReadSubtitleFile(...args),
}))

// Mock core container
vi.mock("@timeline-studio/core", () => ({
  container: {
    hasPlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => ({
      showOpenDialog: mockShowOpenDialog,
    })),
  },
}))

vi.mock("@/features/timeline/hooks/state/use-timeline", () => ({
  useTimeline: () => ({
    project: { sections: [{ tracks: [] }] },
    send: vi.fn(),
  }),
}))

vi.mock("@timeline-studio/domains/system-integration", () => ({
  useNotifications: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}))

vi.mock("../utils/subtitle-parsers", () => ({
  parseSubtitleFile: vi.fn((_content: string) => {
    // Simple mock parser - returns one subtitle
    return [
      {
        id: "test-1",
        type: "subtitle" as const,
        startTime: 0,
        duration: 2,
        text: "Test subtitle",
      },
    ]
  }),
}))

describe("useSubtitlesImport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should import single subtitle file", async () => {
    const mockFilePath = "/path/to/subtitle.srt"
    const mockContent = `1
00:00:00,000 --> 00:00:02,000
Test subtitle`

    mockShowOpenDialog.mockResolvedValueOnce([mockFilePath])
    mockReadSubtitleFile.mockResolvedValueOnce({
      content: mockContent,
      format: "srt",
      file_name: "subtitle.srt",
    })

    const { result } = renderHook(() => useSubtitlesImport())

    expect(result.current.isImporting).toBe(false)

    await act(async () => {
      await result.current.importSubtitleFile()
    })

    expect(mockShowOpenDialog).toHaveBeenCalledWith({
      multiple: false,
      filters: [
        {
          name: "Subtitle Files",
          extensions: ["srt", "vtt", "ass", "ssa"],
        },
      ],
    })

    expect(mockReadSubtitleFile).toHaveBeenCalledWith(mockFilePath)
  })

  it("should import multiple subtitle files", async () => {
    const mockFilePaths = ["/path/to/subtitle1.srt", "/path/to/subtitle2.vtt"]
    const mockContent1 = `1
00:00:00,000 --> 00:00:02,000
First subtitle`
    const mockContent2 = `WEBVTT

00:00:03.000 --> 00:00:05.000
Second subtitle`

    mockShowOpenDialog.mockResolvedValueOnce(mockFilePaths)
    mockReadSubtitleFile
      .mockResolvedValueOnce({
        content: mockContent1,
        format: "srt",
        file_name: "subtitle1.srt",
      })
      .mockResolvedValueOnce({
        content: mockContent2,
        format: "vtt",
        file_name: "subtitle2.vtt",
      })

    const { result } = renderHook(() => useSubtitlesImport())

    await act(async () => {
      await result.current.importSubtitleFiles()
    })

    expect(mockShowOpenDialog).toHaveBeenCalledWith({
      multiple: true,
      filters: [
        {
          name: "Subtitle Files",
          extensions: ["srt", "vtt", "ass", "ssa"],
        },
      ],
    })

    expect(mockReadSubtitleFile).toHaveBeenCalledTimes(2)
  })

  it("should handle import errors gracefully", async () => {
    const mockError = new Error("Failed to read file")
    mockShowOpenDialog.mockResolvedValueOnce(["/path/to/subtitle.srt"])
    mockReadSubtitleFile.mockRejectedValueOnce(mockError)

    const { result } = renderHook(() => useSubtitlesImport())

    await act(async () => {
      await result.current.importSubtitleFile()
    })

    expect(result.current.isImporting).toBe(false)
  })

  it("should handle cancelled file dialog", async () => {
    mockShowOpenDialog.mockResolvedValueOnce(null)

    const { result } = renderHook(() => useSubtitlesImport())

    await act(async () => {
      await result.current.importSubtitleFile()
    })

    expect(mockReadSubtitleFile).not.toHaveBeenCalled()
  })

  it("should set isImporting state correctly", async () => {
    let resolveOpen: (value: any) => void
    const openPromise = new Promise((resolve) => {
      resolveOpen = resolve
    })
    mockShowOpenDialog.mockReturnValueOnce(openPromise)

    const { result } = renderHook(() => useSubtitlesImport())

    expect(result.current.isImporting).toBe(false)

    // Запускаем импорт
    const importPromise = result.current.importSubtitleFile()

    // Проверяем что состояние изменилось на true
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1))
    })
    expect(result.current.isImporting).toBe(true)

    // Заканчиваем операцию
    resolveOpen!(null)
    await act(async () => {
      await importPromise
    })

    expect(result.current.isImporting).toBe(false)
  })
})

/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useFrameExtraction } from "../../hooks/use-frame-extraction"

// Мокаем все зависимости
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Мокаем useFramePreview
vi.mock("@/features/media/hooks/use-frame-preview", () => ({
  useFramePreview: () => ({
    extractTimelineFrames: vi.fn().mockResolvedValue([
      { timestamp: 0, frameData: "frame1", isKeyframe: true },
      { timestamp: 1, frameData: "frame2", isKeyframe: false },
    ]),
    extractRecognitionFrames: vi.fn().mockResolvedValue([
      {
        timestamp: 0,
        frameData: new Uint8Array([1, 2, 3]),
        resolution: [640, 480],
        isKeyframe: true,
      },
    ]),
    getFrameAtTimestamp: vi.fn().mockResolvedValue("frame-at-timestamp"),
    isExtracting: false,
    error: null,
  }),
}))

// Мокаем frame extraction service
vi.mock("../../services/frame-extraction-service", () => ({
  ExtractionPurpose: {
    TimelinePreview: "timeline_preview",
    ObjectDetection: "object_detection",
    SceneRecognition: "scene_recognition",
  },
  FrameExtractionService: {
    getInstance: vi.fn(() => ({
      extractTimelineFrames: vi.fn(),
      extractRecognitionFrames: vi.fn(),
      extractSubtitleFrames: vi.fn().mockResolvedValue([
        {
          subtitleId: "sub1",
          subtitleText: "Test subtitle",
          timestamp: 1.5,
          frameData: new Uint8Array([4, 5, 6]),
          startTime: 1.0,
          endTime: 2.0,
        },
      ]),
      clearFrameCache: vi.fn().mockResolvedValue(undefined),
    })),
  },
  frameExtractionService: {
    extractSubtitleFrames: vi.fn().mockResolvedValue([
      {
        subtitleId: "sub1",
        subtitleText: "Test subtitle",
        timestamp: 1.5,
        frameData: new Uint8Array([4, 5, 6]),
        startTime: 1.0,
        endTime: 2.0,
      },
    ]),
    clearFrameCache: vi.fn().mockResolvedValue(undefined),
  },
}))

describe("useFrameExtraction (simple)", () => {
  it("should initialize with default state", () => {
    const { result } = renderHook(() => useFrameExtraction())

    expect(result.current.timelineFrames).toEqual([])
    expect(result.current.recognitionFrames).toEqual([])
    expect(result.current.subtitleFrames).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.progress).toBe(0)
  })

  it("should have all required methods", () => {
    const { result } = renderHook(() => useFrameExtraction())

    expect(typeof result.current.extractTimelineFrames).toBe("function")
    expect(typeof result.current.extractRecognitionFrames).toBe("function")
    expect(typeof result.current.extractSubtitleFrames).toBe("function")
    expect(typeof result.current.clearCache).toBe("function")
    expect(typeof result.current.reset).toBe("function")
  })
})

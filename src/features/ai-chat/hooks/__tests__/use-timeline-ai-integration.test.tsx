/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для useTimelineAIIntegration
 */

import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createTimelineClip } from "@/features/timeline/types"
import { useTimelineAIIntegration } from "../use-timeline-ai-integration"

// Mock useTimeline hook
const mockTimeline = {
  isReady: true,
  project: null as any,
  selectedClipIds: [] as string[],
  createProject: vi.fn(),
  addSection: vi.fn(),
  addTrack: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  seek: vi.fn(),
  selectClips: vi.fn(),
}

vi.mock("@/features/timeline/hooks", () => ({
  useTimeline: () => mockTimeline,
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    warn: vi.fn(),
  }),
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

describe("useTimelineAIIntegration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTimeline.isReady = true
    mockTimeline.project = null
    mockTimeline.selectedClipIds = []
  })

  describe("Инициализация", () => {
    it("должен вернуть начальное состояние когда проект не загружен", () => {
      mockTimeline.project = null
      const { result } = renderHook(() => useTimelineAIIntegration())

      expect(result.current).toEqual({
        isReady: false,
        hasProject: false,
        clipsCount: 0,
        tracksCount: 0,
        projectDuration: 0,
      })
    })

    it("должен вернуть состояние готовности когда проект загружен", () => {
      mockTimeline.project = {
        id: "project-1",
        name: "Test Project",
        globalTracks: [],
        sections: [],
      }

      const { result } = renderHook(() => useTimelineAIIntegration())

      expect(result.current).toEqual({
        isReady: true,
        hasProject: true,
        clipsCount: 0,
        tracksCount: 0,
        projectDuration: 0,
      })
    })
  })

  describe("Подсчет клипов", () => {
    it("должен подсчитать клипы из глобальных треков", () => {
      const clips = [createTimelineClip("media-1", "track-1", 0, 10), createTimelineClip("media-2", "track-1", 10, 15)]

      mockTimeline.project = {
        globalTracks: [
          {
            id: "track-1",
            type: "video",
            clips,
          },
        ],

        sections: [],
      }

      const { result } = renderHook(() => useTimelineAIIntegration())

      expect(result.current.clipsCount).toBe(2)
    })

    it("должен подсчитать клипы из секций", () => {
      const clips = [createTimelineClip("media-1", "track-1", 0, 10)]

      mockTimeline.project = {
        globalTracks: [],
        sections: [
          {
            id: "section-1",
            name: "Section 1",
            startTime: 0,
            duration: 30,
            tracks: [
              {
                id: "track-1",
                type: "video",
                clips,
              },
            ],
          },
        ],
      }

      const { result } = renderHook(() => useTimelineAIIntegration())

      expect(result.current.clipsCount).toBe(1)
    })

    it("должен подсчитать клипы из глобальных треков и секций", () => {
      mockTimeline.project = {
        globalTracks: [
          {
            id: "track-1",
            type: "video",
            clips: [createTimelineClip("media-1", "track-1", 0, 10)],
          },
        ],

        sections: [
          {
            id: "section-1",
            name: "Section 1",
            startTime: 0,
            duration: 30,
            tracks: [
              {
                id: "track-2",
                type: "audio",
                clips: [
                  createTimelineClip("media-2", "track-2", 0, 20),
                  createTimelineClip("media-3", "track-2", 20, 10),
                ],
              },
            ],
          },
        ],
      }

      const { result } = renderHook(() => useTimelineAIIntegration())

      expect(result.current.clipsCount).toBe(3)
    })
  })

  describe("Подсчет треков", () => {
    it("должен подсчитать глобальные треки", () => {
      mockTimeline.project = {
        globalTracks: [
          { id: "track-1", type: "video", clips: [] },
          { id: "track-2", type: "audio", clips: [] },
        ],

        sections: [],
      }

      const { result } = renderHook(() => useTimelineAIIntegration())

      expect(result.current.tracksCount).toBe(2)
    })

    it("должен подсчитать треки из секций", () => {
      mockTimeline.project = {
        globalTracks: [],
        sections: [
          {
            id: "section-1",
            name: "Section 1",
            startTime: 0,
            duration: 30,
            tracks: [
              { id: "track-1", type: "video", clips: [] },
              { id: "track-2", type: "audio", clips: [] },
            ],
          },
        ],
      }

      const { result } = renderHook(() => useTimelineAIIntegration())

      expect(result.current.tracksCount).toBe(2)
    })

    it("должен подсчитать все треки из глобальных и секций", () => {
      mockTimeline.project = {
        globalTracks: [{ id: "track-1", type: "video", clips: [] }],
        sections: [
          {
            id: "section-1",
            name: "Section 1",
            startTime: 0,
            duration: 30,
            tracks: [
              { id: "track-2", type: "audio", clips: [] },
              { id: "track-3", type: "audio", clips: [] },
            ],
          },
        ],
      }

      const { result } = renderHook(() => useTimelineAIIntegration())

      expect(result.current.tracksCount).toBe(3)
    })
  })

  describe("Расчет длительности проекта", () => {
    it("должен вернуть 0 для проекта без клипов", () => {
      mockTimeline.project = {
        globalTracks: [],
        sections: [],
      }

      const { result } = renderHook(() => useTimelineAIIntegration())

      expect(result.current.projectDuration).toBe(0)
    })

    it("должен рассчитать длительность на основе самого позднего клипа", () => {
      mockTimeline.project = {
        globalTracks: [
          {
            id: "track-1",
            type: "video",
            clips: [
              createTimelineClip("media-1", "track-1", 0, 10),
              createTimelineClip("media-2", "track-1", 15, 20), // Заканчивается в 35
              createTimelineClip("media-3", "track-1", 40, 5), // Заканчивается в 45
            ],
          },
        ],

        sections: [],
      }

      const { result } = renderHook(() => useTimelineAIIntegration())

      expect(result.current.projectDuration).toBe(45)
    })

    it("должен учитывать клипы из секций при расчете длительности", () => {
      mockTimeline.project = {
        globalTracks: [
          {
            id: "track-1",
            type: "video",
            clips: [createTimelineClip("media-1", "track-1", 0, 10)],
          },
        ],

        sections: [
          {
            id: "section-1",
            name: "Section 1",
            startTime: 0,
            duration: 100,
            tracks: [
              {
                id: "track-2",
                type: "audio",
                clips: [createTimelineClip("media-2", "track-2", 50, 100)], // Заканчивается в 150
              },
            ],
          },
        ],
      }

      const { result } = renderHook(() => useTimelineAIIntegration())

      expect(result.current.projectDuration).toBe(150)
    })
  })

  describe("Обновление при изменении проекта", () => {
    it("должен обновить статистику при добавлении клипа", async () => {
      mockTimeline.project = {
        globalTracks: [
          {
            id: "track-1",
            type: "video",
            clips: [],
          },
        ],

        sections: [],
      }

      const { result, rerender } = renderHook(() => useTimelineAIIntegration())

      expect(result.current.clipsCount).toBe(0)

      // Добавляем клип
      mockTimeline.project = {
        globalTracks: [
          {
            id: "track-1",
            type: "video",
            clips: [createTimelineClip("media-1", "track-1", 0, 10)],
          },
        ],

        sections: [],
      }

      rerender()

      await waitFor(() => {
        expect(result.current.clipsCount).toBe(1)
        expect(result.current.projectDuration).toBe(10)
      })
    })
  })

  describe("Edge cases", () => {
    it("должен обрабатывать проект без globalTracks", () => {
      mockTimeline.project = {
        sections: [],
      }

      const { result } = renderHook(() => useTimelineAIIntegration())

      expect(result.current.clipsCount).toBe(0)
      expect(result.current.tracksCount).toBe(0)
    })

    it("должен обрабатывать секции без треков", () => {
      mockTimeline.project = {
        globalTracks: [],
        sections: [
          {
            id: "section-1",
            name: "Empty Section",
            startTime: 0,
            duration: 30,
          },
        ],
      }

      const { result } = renderHook(() => useTimelineAIIntegration())

      expect(result.current.clipsCount).toBe(0)
      expect(result.current.tracksCount).toBe(0)
    })

    it("должен обрабатывать треки без клипов", () => {
      mockTimeline.project = {
        globalTracks: [
          {
            id: "track-1",
            type: "video",
          },
        ],

        sections: [],
      }

      const { result } = renderHook(() => useTimelineAIIntegration())

      expect(result.current.clipsCount).toBe(0)
      expect(result.current.tracksCount).toBe(1)
      expect(result.current.projectDuration).toBe(0)
    })

    it("должен обрабатывать клипы с нулевой длительностью", () => {
      mockTimeline.project = {
        globalTracks: [
          {
            id: "track-1",
            type: "video",
            clips: [createTimelineClip("media-1", "track-1", 0, 0)],
          },
        ],

        sections: [],
      }

      const { result } = renderHook(() => useTimelineAIIntegration())

      expect(result.current.clipsCount).toBe(1)
      expect(result.current.projectDuration).toBe(0)
    })

    it("должен обрабатывать отрицательное startTime (если такое возможно)", () => {
      mockTimeline.project = {
        globalTracks: [
          {
            id: "track-1",
            type: "video",
            clips: [createTimelineClip("media-1", "track-1", -10, 20)],
          },
        ],

        sections: [],
      }

      const { result } = renderHook(() => useTimelineAIIntegration())

      expect(result.current.projectDuration).toBe(10)
    })
  })
})

/**
 * @vitest-environment jsdom
 * Тесты для хука useTracks
 */

import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Timeline, Track } from "@/domains/video-editing/types"
import { TimelineProviders } from "@/test/test-utils"
import { useTracks } from "../use-tracks"

// Мокаем треки (domain типы)
const mockTracks: Track[] = [
  {
    id: "track-1",
    name: "Video Track 1",
    type: "video",
    clips: [],
    muted: false,
    locked: false,
    solo: false,
    volume: 1,
    pan: 0,
    height: 80,
    order: 0,
    trackEffects: [],
    trackFilters: [],
  } as any,
  {
    id: "track-2",
    name: "Audio Track 1",
    type: "audio",
    clips: [],
    muted: true,
    locked: false,
    solo: false,
    volume: 0.8,
    pan: -0.2,
    height: 60,
    order: 1,
    trackEffects: [],
    trackFilters: [],
  } as any,
  {
    id: "track-3",
    name: "Hidden Track",
    type: "video",
    clips: [],
    muted: false,
    locked: false,
    solo: false,
    volume: 1,
    pan: 0,
    height: 80,
    order: 2,
    trackEffects: [],
    trackFilters: [],
  } as any,
]

// Мокаем проект (domain типы)
const mockProject: Timeline = {
  id: "project-1",
  name: "Test Project",
  duration: 60,
  sections: [
    {
      id: "section-1",
      index: 0,
      name: "Main Section",
      startTime: 0,
      endTime: 30,
      duration: 30,
      isCollapsed: false,
      tracks: [mockTracks[0], mockTracks[1]],
    },
    {
      id: "section-2",
      index: 1,
      name: "Secondary Section",
      startTime: 30,
      endTime: 60,
      duration: 30,
      isCollapsed: false,
      tracks: [mockTracks[2]],
    },
  ],

  globalTracks: [],
  settings: {
    resolution: {
      width: 1920,
      height: 1080,
    },
    fps: 30,
    aspectRatio: "16:9",
    sampleRate: 44100,
    channels: 2,
    bitDepth: 16,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  version: "1.0.0",
  resources: {
    effects: [],
    filters: [],
    transitions: [],
    templates: [],
    music: [],
    media: [],
  },
  markers: [],
} as any

// Мокаем useTimeline
const mockUseTimeline = vi.fn()
vi.mock("../use-timeline", () => ({
  useTimeline: () => mockUseTimeline(),
}))

describe("useTracks", () => {
  beforeEach(() => {
    // Default mock implementation
    mockUseTimeline.mockReturnValue({
      project: mockProject,
      selectedTrackIds: [],
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      updateTrack: vi.fn(),
      selectTracks: vi.fn(),
      clearSelection: vi.fn(),
    })
  })

  describe("Hook Initialization", () => {
    it("should be defined and exportable", () => {
      expect(useTracks).toBeDefined()
      expect(typeof useTracks).toBe("function")
    })

    it("should return object with all required properties and methods", () => {
      const { result } = renderHook(() => useTracks(), {
        wrapper: TimelineProviders,
      })

      // Проверяем наличие основных свойств
      expect(result.current).toHaveProperty("tracks")
      expect(result.current).toHaveProperty("selectedTracks")
      expect(result.current).toHaveProperty("visibleTracks")
      expect(result.current).toHaveProperty("sectionTracks")
      expect(result.current).toHaveProperty("globalTracks")

      // Проверяем наличие методов
      expect(result.current).toHaveProperty("findTrack")
      expect(result.current).toHaveProperty("getTracksByType")
      expect(result.current).toHaveProperty("getTracksBySection")
      expect(result.current).toHaveProperty("canAddTrackToSection")
      expect(result.current).toHaveProperty("getTrackStats")
    })
  })

  describe("Default State", () => {
    it("should return empty arrays when no project is loaded", () => {
      // Mock useTimeline to return no project
      mockUseTimeline.mockReturnValueOnce({
        project: null,
        selectedTrackIds: [],
        addTrack: vi.fn(),
        removeTrack: vi.fn(),
        updateTrack: vi.fn(),
        selectTracks: vi.fn(),
        clearSelection: vi.fn(),
      })

      const { result } = renderHook(() => useTracks(), {
        wrapper: TimelineProviders,
      })

      expect(result.current.tracks).toEqual([])
      expect(result.current.selectedTracks).toEqual([])
      expect(result.current.visibleTracks).toEqual([])
      expect(result.current.sectionTracks).toEqual([])
      expect(result.current.globalTracks).toEqual([])
    })

    it("should return tracks when project is loaded", () => {
      const { result } = renderHook(() => useTracks(), {
        wrapper: TimelineProviders,
      })

      // Tracks будут адаптированы из domain в feature, так что проверяем структуру
      expect(result.current.tracks).toHaveLength(3)
      expect(result.current.tracks[0]).toMatchObject({
        id: "track-1",
        name: "Video Track 1",
        type: "video",
        isMuted: false,
        isLocked: false,
        isSolo: false,
      })
      expect(result.current.globalTracks).toEqual([]) // No global tracks in mock project
      expect(result.current.sectionTracks).toHaveLength(3) // All tracks are in sections
      expect(result.current.selectedTracks).toEqual([]) // No tracks selected by default
      expect(result.current.visibleTracks).toHaveLength(3) // All tracks visible (isHidden добавляется адаптером как false)
    })
  })

  describe("Track Search and Filtering", () => {
    it("should return null for non-existent track", () => {
      const { result } = renderHook(() => useTracks(), {
        wrapper: TimelineProviders,
      })

      const track = result.current.findTrack("non-existent-track")
      expect(track).toBeNull()
    })

    it("should find existing tracks by id", () => {
      const { result } = renderHook(() => useTracks(), {
        wrapper: TimelineProviders,
      })

      const track = result.current.findTrack("track-1")
      expect(track).toBeTruthy()
      expect(track?.id).toBe("track-1")
      expect(track?.name).toBe("Video Track 1")
    })

    it("should return tracks filtered by type", () => {
      const { result } = renderHook(() => useTracks(), {
        wrapper: TimelineProviders,
      })

      const videoTracks = result.current.getTracksByType("video")
      expect(videoTracks).toHaveLength(2)
      expect(videoTracks[0].type).toBe("video")
      expect(videoTracks[1].type).toBe("video")

      const audioTracks = result.current.getTracksByType("audio")
      expect(audioTracks).toHaveLength(1)
      expect(audioTracks[0].type).toBe("audio")
    })

    it("should return empty array for tracks by type when no project", () => {
      mockUseTimeline.mockReturnValueOnce({
        project: null,
        selectedTrackIds: [],
        addTrack: vi.fn(),
        removeTrack: vi.fn(),
        updateTrack: vi.fn(),
        selectTracks: vi.fn(),
        clearSelection: vi.fn(),
      })

      const { result } = renderHook(() => useTracks(), {
        wrapper: TimelineProviders,
      })

      const videoTracks = result.current.getTracksByType("video")
      expect(videoTracks).toEqual([])
    })

    it("should return tracks for specific section", () => {
      const { result } = renderHook(() => useTracks(), {
        wrapper: TimelineProviders,
      })

      const sectionTracks = result.current.getTracksBySection("section-1")
      expect(sectionTracks).toHaveLength(2)
      expect(sectionTracks[0].id).toBe("track-1")
      expect(sectionTracks[1].id).toBe("track-2")
    })

    it("should return empty array for non-existent section", () => {
      const { result } = renderHook(() => useTracks(), {
        wrapper: TimelineProviders,
      })

      const sectionTracks = result.current.getTracksBySection("non-existent-section")
      expect(sectionTracks).toEqual([])
    })
  })

  describe("Track Management", () => {
    it("should return false when adding track without project", () => {
      mockUseTimeline.mockReturnValueOnce({
        project: null,
        selectedTrackIds: [],
        addTrack: vi.fn(),
        removeTrack: vi.fn(),
        updateTrack: vi.fn(),
        selectTracks: vi.fn(),
        clearSelection: vi.fn(),
      })

      const { result } = renderHook(() => useTracks(), {
        wrapper: TimelineProviders,
      })

      const canAdd = result.current.canAddTrackToSection("non-existent", "video")
      expect(canAdd).toBe(false)
    })

    it("should return false for adding track to non-existent section", () => {
      const { result } = renderHook(() => useTracks(), {
        wrapper: TimelineProviders,
      })

      const canAdd = result.current.canAddTrackToSection("non-existent", "video")
      expect(canAdd).toBe(false)
    })

    it("should return true for adding track to existing section", () => {
      const { result } = renderHook(() => useTracks(), {
        wrapper: TimelineProviders,
      })

      const canAdd = result.current.canAddTrackToSection("section-1", "video")
      expect(canAdd).toBe(true)
    })

    it("should return default track statistics for non-existent track", () => {
      const { result } = renderHook(() => useTracks(), {
        wrapper: TimelineProviders,
      })

      const stats = result.current.getTrackStats("non-existent-track")
      expect(stats).toEqual({
        clipCount: 0,
        totalDuration: 0,
        isEmpty: true,
      })
    })

    it("should return track statistics for existing track", () => {
      const { result } = renderHook(() => useTracks(), {
        wrapper: TimelineProviders,
      })

      const stats = result.current.getTrackStats("track-1")
      expect(stats).toEqual({
        clipCount: 0,
        totalDuration: 0,
        isEmpty: true,
      })
    })
  })

  describe("Error Handling", () => {
    it("should not throw errors when calling methods with invalid parameters", () => {
      const { result } = renderHook(() => useTracks(), {
        wrapper: TimelineProviders,
      })

      expect(() => {
        result.current.findTrack("")
        result.current.getTracksByType("invalid" as any)
        result.current.getTracksBySection("")
        result.current.canAddTrackToSection("", "video")
        result.current.getTrackStats("")
      }).not.toThrow()
    })
  })
})

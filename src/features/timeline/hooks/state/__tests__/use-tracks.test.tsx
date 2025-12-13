/**
 * @vitest-environment jsdom
 * Тесты для хука useTracks
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { TimelineProject, TimelineTrack } from "@/features/timeline/types"
import { TimelineProviders } from "@/test/test-utils"
import { useTracks } from "../use-tracks"

// Мокаем треки (используем domain свойства)
const mockTracks: TimelineTrack[] = [
  {
    id: "track-1",
    name: "Video Track 1",
    type: "video",
    clips: [],
    muted: false,
    locked: false,
    isHidden: false,
    solo: false,
    volume: 1,
    pan: 0,
    height: 80,
    order: 0,
    trackEffects: [],
    trackFilters: [],
    // Feature properties (добавляются адаптером)
    isMuted: false,
    isLocked: false,
    isSolo: false,
  } as any,
  {
    id: "track-2",
    name: "Audio Track 1",
    type: "audio",
    clips: [],
    muted: true,
    locked: false,
    isHidden: false,
    solo: false,
    volume: 0.8,
    pan: -0.2,
    height: 60,
    order: 1,
    trackEffects: [],
    trackFilters: [],
    // Feature properties (добавляются адаптером)
    isMuted: true,
    isLocked: false,
    isSolo: false,
  } as any,
  {
    id: "track-3",
    name: "Hidden Track",
    type: "video",
    clips: [],
    muted: false,
    locked: false,
    isHidden: true,
    solo: false,
    volume: 1,
    pan: 0,
    height: 80,
    order: 2,
    trackEffects: [],
    trackFilters: [],
    // Feature properties (добавляются адаптером)
    isMuted: false,
    isLocked: false,
    isSolo: false,
  } as any,
]

// Мокаем проект
const mockProject: TimelineProject = {
  id: "project-1",
  name: "Test Project",
  duration: 60,
  fps: 30,
  sampleRate: 44100,
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
    timeFormat: "timecode",
    snapToGrid: true,
    gridSize: 1,
    autoSave: true,
    autoSaveInterval: 300,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  version: "1.0.0",
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
}

// Мокаем UI состояние
const mockUIState = {
  selectedClipIds: [],
  selectedTrackIds: ["track-1"],
  currentTime: 0,
  zoom: 1,
  scrollPosition: 0,
  visibleTrackTypes: ["video", "audio"],
}

// Мокаем зависимости
const mockUseTimeline = vi.fn()
vi.mock("../../hooks/use-timeline", () => ({
  useTimeline: () => mockUseTimeline(),
}))

// Default mock implementation
mockUseTimeline.mockReturnValue({
  project: mockProject,
  uiState: mockUIState,
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
  updateTrack: vi.fn(),
  reorderTracks: vi.fn(),
  selectTracks: vi.fn(),
  clearSelection: vi.fn(),
})

vi.mock("../../utils/utils", () => ({
  getAllTracks: vi.fn((project) => (project ? mockTracks : [])),
  findTrackById: vi.fn((project, id) => (project ? mockTracks.find((track) => track.id === id) || null : null)),
  getTracksByType: vi.fn((project, type) => (project ? mockTracks.filter((track) => track.type === type) : [])),
  sortTracksByOrder: vi.fn((tracks) => tracks || []),
}))

describe("useTracks", () => {
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
        uiState: mockUIState,
        addTrack: vi.fn(),
        removeTrack: vi.fn(),
        updateTrack: vi.fn(),
        reorderTracks: vi.fn(),
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

      expect(result.current.tracks).toEqual(mockTracks)
      expect(result.current.globalTracks).toEqual([]) // No global tracks in mock project
      expect(result.current.sectionTracks).toEqual(mockTracks) // All tracks are in sections
      expect(result.current.selectedTracks).toEqual([]) // No tracks selected by default
      expect(result.current.visibleTracks).toEqual([mockTracks[0], mockTracks[1]]) // Only non-hidden tracks (track-3 is hidden)
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
      expect(track).toEqual(mockTracks[0])
    })

    it("should return tracks filtered by type", () => {
      const { result } = renderHook(() => useTracks(), {
        wrapper: TimelineProviders,
      })

      const videoTracks = result.current.getTracksByType("video")
      expect(videoTracks).toEqual([mockTracks[0], mockTracks[2]])

      const audioTracks = result.current.getTracksByType("audio")
      expect(audioTracks).toEqual([mockTracks[1]])
    })

    it("should return empty array for tracks by type when no project", () => {
      mockUseTimeline.mockReturnValueOnce({
        project: null,
        uiState: mockUIState,
        addTrack: vi.fn(),
        removeTrack: vi.fn(),
        updateTrack: vi.fn(),
        reorderTracks: vi.fn(),
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
      expect(sectionTracks).toEqual([mockTracks[0], mockTracks[1]])
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
        uiState: mockUIState,
        addTrack: vi.fn(),
        removeTrack: vi.fn(),
        updateTrack: vi.fn(),
        reorderTracks: vi.fn(),
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

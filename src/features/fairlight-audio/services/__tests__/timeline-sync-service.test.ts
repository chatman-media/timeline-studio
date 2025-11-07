import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { TimelineTrack } from "@/features/timeline/types"
import type { AudioChannel } from "../../types"
import { convertTrackToChannel, useTimelineMixerSync } from "../timeline-sync-service"

// Mock timeline hook
const mockTimeline = {
  project: null as any,
  updateTrack: vi.fn(),
}

vi.mock("@/features/timeline/hooks", () => ({
  useTimeline: () => mockTimeline,
}))

const createMockTrack = (overrides: Partial<TimelineTrack> = {}): TimelineTrack => ({
  id: "track-1",
  name: "Test Track",
  type: "audio",
  order: 0,
  clips: [],
  transitions: [],
  isLocked: false,
  isMuted: false,
  isHidden: false,
  isSolo: false,
  volume: 0.75,
  pan: 0.5,
  height: 60,
  trackEffects: [],
  trackFilters: [],
  ...overrides,
})

describe("TimelineSyncService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTimeline.project = null
  })

  describe("convertTrackToChannel", () => {

    it("should convert audio track to channel", () => {
      const track = createMockTrack({
        id: "audio-track",
        name: "Audio Track",
        type: "audio",
        volume: 0.8,
        pan: -0.3,
        isMuted: true,
        isSolo: true,
      })

      const channel = convertTrackToChannel(track)

      expect(channel).toEqual({
        id: "audio-track",
        name: "Audio Track",
        type: "stereo",
        volume: 80, // 0.8 * 100
        pan: -30, // -0.3 * 100
        muted: true,
        solo: true,
        armed: false,
        trackId: "audio-track",
        effects: [],
        sends: [],
        eq: {
          enabled: false,
          bands: [],
        },
      })
    })

    it("should convert music track to channel", () => {
      const track = createMockTrack({
        type: "music",
        volume: 0.5,
        pan: 0,
      })

      const channel = convertTrackToChannel(track)

      expect(channel).not.toBeNull()
      expect(channel?.type).toBe("stereo")
      expect(channel?.volume).toBe(50)
      expect(channel?.pan).toBe(0)
    })

    it("should convert voiceover track to channel", () => {
      const track = createMockTrack({ type: "voiceover" })
      const channel = convertTrackToChannel(track)
      expect(channel).not.toBeNull()
    })

    it("should convert sfx track to channel", () => {
      const track = createMockTrack({ type: "sfx" })
      const channel = convertTrackToChannel(track)
      expect(channel).not.toBeNull()
    })

    it("should convert ambient track to channel", () => {
      const track = createMockTrack({ type: "ambient" })
      const channel = convertTrackToChannel(track)
      expect(channel).not.toBeNull()
    })

    it("should return null for video track", () => {
      const track = createMockTrack({ type: "video" })
      const channel = convertTrackToChannel(track)
      expect(channel).toBeNull()
    })

    it("should return null for text track", () => {
      const track = createMockTrack({ type: "subtitle" as any })
      const channel = convertTrackToChannel(track)
      expect(channel).toBeNull()
    })

    it("should return null for unknown track type", () => {
      const track = createMockTrack({ type: "unknown" as any })
      const channel = convertTrackToChannel(track)
      expect(channel).toBeNull()
    })

    it("should handle extreme volume values", () => {
      const maxVolumeTrack = createMockTrack({ volume: 1.0 })
      const minVolumeTrack = createMockTrack({ volume: 0.0 })

      const maxChannel = convertTrackToChannel(maxVolumeTrack)
      const minChannel = convertTrackToChannel(minVolumeTrack)

      expect(maxChannel?.volume).toBe(100)
      expect(minChannel?.volume).toBe(0)
    })

    it("should handle extreme pan values", () => {
      const leftPanTrack = createMockTrack({ pan: -1.0 })
      const rightPanTrack = createMockTrack({ pan: 1.0 })

      const leftChannel = convertTrackToChannel(leftPanTrack)
      const rightChannel = convertTrackToChannel(rightPanTrack)

      expect(leftChannel?.pan).toBe(-100)
      expect(rightChannel?.pan).toBe(100)
    })

    it("should set default values correctly", () => {
      const track = createMockTrack()
      const channel = convertTrackToChannel(track)

      expect(channel?.type).toBe("stereo")
      expect(channel?.armed).toBe(false)
      expect(channel?.effects).toEqual([])
      expect(channel?.sends).toEqual([])
      expect(channel?.eq).toEqual({
        enabled: false,
        bands: [],
      })
    })
  })

  describe("useTimelineMixerSync", () => {
    const mockOnChannelsUpdate = vi.fn()

    const createMockProject = () => ({
      id: "project-1",
      name: "Test Project",
      sections: [
        {
          id: "section-1",
          name: "Section 1",
          tracks: [
            {
              id: "track-1",
              name: "Audio Track 1",
              type: "audio" as const,
              volume: 0.8,
              pan: 0.2,
              isMuted: false,
              isSolo: false,
              position: { x: 0, y: 0 },
              duration: 10,
            },
            {
              id: "track-2",
              name: "Video Track",
              type: "video" as const,
              volume: 0.7,
              pan: 0,
              isMuted: false,
              isSolo: false,
              position: { x: 0, y: 1 },
              duration: 10,
            },
            {
              id: "track-3",
              name: "Music Track",
              type: "music" as const,
              volume: 0.6,
              pan: -0.5,
              isMuted: true,
              isSolo: true,
              position: { x: 0, y: 2 },
              duration: 10,
            },
          ],
        },
        {
          id: "section-2",
          name: "Section 2",
          tracks: [
            {
              id: "track-4",
              name: "SFX Track",
              type: "sfx" as const,
              volume: 0.9,
              pan: 0.8,
              isMuted: false,
              isSolo: false,
              position: { x: 0, y: 0 },
              duration: 5,
            },
          ],
        },
      ],
    })

    beforeEach(() => {
      mockOnChannelsUpdate.mockClear()
    })

    it("should call onChannelsUpdate with audio channels when project is available", () => {
      mockTimeline.project = createMockProject()

      renderHook(() => useTimelineMixerSync(mockOnChannelsUpdate))

      expect(mockOnChannelsUpdate).toHaveBeenCalledTimes(1)

      const channels = mockOnChannelsUpdate.mock.calls[0][0] as AudioChannel[]
      expect(channels).toHaveLength(3) // Only audio tracks (audio, music, sfx)

      expect(channels[0].id).toBe("track-1")
      expect(channels[0].name).toBe("Audio Track 1")
      expect(channels[1].id).toBe("track-3")
      expect(channels[1].name).toBe("Music Track")
      expect(channels[2].id).toBe("track-4")
      expect(channels[2].name).toBe("SFX Track")
    })

    it("should not call onChannelsUpdate when project is null", () => {
      mockTimeline.project = null

      renderHook(() => useTimelineMixerSync(mockOnChannelsUpdate))

      expect(mockOnChannelsUpdate).not.toHaveBeenCalled()
    })

    it("should update channels when project changes", () => {
      mockTimeline.project = null

      const { rerender } = renderHook(() => useTimelineMixerSync(mockOnChannelsUpdate))

      expect(mockOnChannelsUpdate).not.toHaveBeenCalled()

      // Update project
      mockTimeline.project = createMockProject()
      rerender()

      expect(mockOnChannelsUpdate).toHaveBeenCalledTimes(1)
    })

    it("should handle empty project sections", () => {
      mockTimeline.project = {
        id: "empty-project",
        name: "Empty Project",
        sections: [],
      }

      renderHook(() => useTimelineMixerSync(mockOnChannelsUpdate))

      expect(mockOnChannelsUpdate).toHaveBeenCalledWith([])
    })

    it("should handle sections with no audio tracks", () => {
      mockTimeline.project = {
        id: "video-project",
        name: "Video Only Project",
        sections: [
          {
            id: "section-1",
            name: "Video Section",
            tracks: [
              {
                id: "video-track",
                name: "Video Track",
                type: "video" as const,
                volume: 0.8,
                pan: 0,
                isMuted: false,
                isSolo: false,
                position: { x: 0, y: 0 },
                duration: 10,
              },
            ],
          },
        ],
      }

      renderHook(() => useTimelineMixerSync(mockOnChannelsUpdate))

      expect(mockOnChannelsUpdate).toHaveBeenCalledWith([])
    })

    describe("updateTrackFromMixer", () => {
      it("should update timeline track volume from mixer", () => {
        mockTimeline.project = createMockProject()

        const { result } = renderHook(() => useTimelineMixerSync(mockOnChannelsUpdate))

        result.current.updateTrackFromMixer("track-1", { volume: 90 })

        expect(mockTimeline.updateTrack).toHaveBeenCalledWith("track-1", {
          volume: 0.9, // 90 / 100
        })
      })

      it("should update timeline track pan from mixer", () => {
        mockTimeline.project = createMockProject()

        const { result } = renderHook(() => useTimelineMixerSync(mockOnChannelsUpdate))

        result.current.updateTrackFromMixer("track-1", { pan: -60 })

        expect(mockTimeline.updateTrack).toHaveBeenCalledWith("track-1", {
          pan: -0.6, // -60 / 100
        })
      })

      it("should update timeline track muted state from mixer", () => {
        mockTimeline.project = createMockProject()

        const { result } = renderHook(() => useTimelineMixerSync(mockOnChannelsUpdate))

        result.current.updateTrackFromMixer("track-1", { muted: true })

        expect(mockTimeline.updateTrack).toHaveBeenCalledWith("track-1", {
          isMuted: true,
        })
      })

      it("should update timeline track solo state from mixer", () => {
        mockTimeline.project = createMockProject()

        const { result } = renderHook(() => useTimelineMixerSync(mockOnChannelsUpdate))

        result.current.updateTrackFromMixer("track-1", { solo: true })

        expect(mockTimeline.updateTrack).toHaveBeenCalledWith("track-1", {
          isSolo: true,
        })
      })

      it("should update multiple properties at once", () => {
        mockTimeline.project = createMockProject()

        const { result } = renderHook(() => useTimelineMixerSync(mockOnChannelsUpdate))

        result.current.updateTrackFromMixer("track-1", {
          volume: 80,
          pan: 25,
          muted: true,
          solo: false,
        })

        expect(mockTimeline.updateTrack).toHaveBeenCalledWith("track-1", {
          volume: 0.8,
          pan: 0.25,
          isMuted: true,
          isSolo: false,
        })
      })

      it("should not update when project is null", () => {
        mockTimeline.project = null

        const { result } = renderHook(() => useTimelineMixerSync(mockOnChannelsUpdate))

        result.current.updateTrackFromMixer("track-1", { volume: 80 })

        expect(mockTimeline.updateTrack).not.toHaveBeenCalled()
      })

      it("should ignore undefined properties", () => {
        mockTimeline.project = createMockProject()

        const { result } = renderHook(() => useTimelineMixerSync(mockOnChannelsUpdate))

        result.current.updateTrackFromMixer("track-1", {
          volume: 80,
          // pan, muted, solo are undefined
        })

        expect(mockTimeline.updateTrack).toHaveBeenCalledWith("track-1", {
          volume: 0.8,
          // Should not include undefined properties
        })
      })

      it("should handle edge case values", () => {
        mockTimeline.project = createMockProject()

        const { result } = renderHook(() => useTimelineMixerSync(mockOnChannelsUpdate))

        result.current.updateTrackFromMixer("track-1", {
          volume: 0, // Minimum volume
          pan: -100, // Maximum left pan
        })

        expect(mockTimeline.updateTrack).toHaveBeenCalledWith("track-1", {
          volume: 0.0,
          pan: -1.0,
        })

        result.current.updateTrackFromMixer("track-2", {
          volume: 100, // Maximum volume
          pan: 100, // Maximum right pan
        })

        expect(mockTimeline.updateTrack).toHaveBeenCalledWith("track-2", {
          volume: 1.0,
          pan: 1.0,
        })
      })
    })

    it("should return project reference", () => {
      const project = createMockProject()
      mockTimeline.project = project

      const { result } = renderHook(() => useTimelineMixerSync(mockOnChannelsUpdate))

      expect(result.current.project).toBe(project)
    })

    it("should return null project when timeline has no project", () => {
      mockTimeline.project = null

      const { result } = renderHook(() => useTimelineMixerSync(mockOnChannelsUpdate))

      expect(result.current.project).toBeNull()
    })

    it("should handle callback dependency changes", () => {
      mockTimeline.project = createMockProject()

      const callback1 = vi.fn()
      const callback2 = vi.fn()

      const { rerender } = renderHook(({ callback }) => useTimelineMixerSync(callback), {
        initialProps: { callback: callback1 },
      })

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).not.toHaveBeenCalled()

      // Change callback
      rerender({ callback: callback2 })

      expect(callback2).toHaveBeenCalledTimes(1)
    })
  })

  describe("edge cases", () => {
    it("should handle tracks with missing properties gracefully", () => {
      const incompleteTrack = {
        id: "incomplete-track",
        name: "Incomplete Track",
        type: "audio" as const,
        // Missing some properties
      } as TimelineTrack

      expect(() => convertTrackToChannel(incompleteTrack)).not.toThrow()

      const channel = convertTrackToChannel(incompleteTrack)
      expect(channel).not.toBeNull()
      expect(channel?.volume).toBeNaN() // undefined * 100 = NaN
    })

    it("should handle very large volume and pan values", () => {
      const extremeTrack = createMockTrack({
        volume: 999,
        pan: -999,
      })

      const channel = convertTrackToChannel(extremeTrack)
      expect(channel?.volume).toBe(99900) // 999 * 100
      expect(channel?.pan).toBe(-99900) // -999 * 100
    })

    it("should handle fractional volume and pan values", () => {
      const fractionalTrack = createMockTrack({
        volume: 0.123456,
        pan: 0.987654,
      })

      const channel = convertTrackToChannel(fractionalTrack)
      expect(channel?.volume).toBeCloseTo(12.3456)
      expect(channel?.pan).toBeCloseTo(98.7654)
    })
  })
})

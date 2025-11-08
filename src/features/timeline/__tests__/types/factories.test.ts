/**
 * Тесты для Timeline Factory Functions
 */

import { describe, expect, it } from "vitest"

import {
  createTimelineClip,
  createTimelineProject,
  createTimelineSection,
  createTimelineTrack,
} from "../../types/factories"

describe("Timeline Factories", () => {
  describe("createTimelineProject", () => {
    it("should create project with default settings", () => {
      const project = createTimelineProject("Test Project")

      expect(project).toHaveProperty("id")
      expect(project.name).toBe("Test Project")
      expect(project.duration).toBe(0)
      expect(project.fps).toBe(30)
      expect(project.sampleRate).toBe(48000)
      expect(project.sections).toEqual([])
      expect(project.globalTracks).toEqual([])
      expect(project.version).toBe("2.0.0")
      expect(project.createdAt).toBeInstanceOf(Date)
      expect(project.updatedAt).toBeInstanceOf(Date)
    })

    it("should create project with custom settings", () => {
      const customSettings = {
        fps: 60,
        sampleRate: 44100,
        resolution: { width: 3840, height: 2160 },
      }

      const project = createTimelineProject("4K Project", customSettings)

      expect(project.name).toBe("4K Project")
      expect(project.fps).toBe(60)
      expect(project.sampleRate).toBe(44100)
      expect(project.settings.fps).toBe(60)
      expect(project.settings.sampleRate).toBe(44100)
      expect(project.settings.resolution.width).toBe(3840)
      expect(project.settings.resolution.height).toBe(2160)
    })

    it("should generate unique IDs", () => {
      const project1 = createTimelineProject("Project 1")
      const project2 = createTimelineProject("Project 2")

      expect(project1.id).not.toBe(project2.id)
      expect(project1.id).toMatch(/^project-\d+-[a-z0-9]+$/)
    })

    it("should have valid default settings structure", () => {
      const project = createTimelineProject("Test")

      expect(project.settings).toHaveProperty("resolution")
      expect(project.settings).toHaveProperty("fps")
      expect(project.settings).toHaveProperty("aspectRatio")
      expect(project.settings).toHaveProperty("sampleRate")
      expect(project.settings).toHaveProperty("channels")
      expect(project.settings).toHaveProperty("bitDepth")
      expect(project.settings).toHaveProperty("timeFormat")
      expect(project.settings).toHaveProperty("snapToGrid")
      expect(project.settings).toHaveProperty("gridSize")
      expect(project.settings).toHaveProperty("autoSave")
      expect(project.settings).toHaveProperty("autoSaveInterval")
    })
  })

  describe("createTimelineSection", () => {
    it("should create section with basic parameters", () => {
      const section = createTimelineSection("Main Section", 0, 60)

      expect(section).toHaveProperty("id")
      expect(section.name).toBe("Main Section")
      expect(section.startTime).toBe(0)
      expect(section.endTime).toBe(60)
      expect(section.duration).toBe(60)
      expect(section.index).toBe(0)
      expect(section.tracks).toEqual([])
      expect(section.isCollapsed).toBe(false)
    })

    it("should create section with real time", () => {
      const realTime = new Date("2023-01-01T10:00:00Z")
      const section = createTimelineSection("Timed Section", 10, 30, realTime, 1)

      expect(section.name).toBe("Timed Section")
      expect(section.startTime).toBe(10)
      expect(section.duration).toBe(30)
      expect(section.index).toBe(1)
      expect(section.realStartTime).toBe(realTime)
      expect(section.realEndTime).toBeInstanceOf(Date)
      expect(section.realEndTime?.getTime()).toBe(realTime.getTime() + 30 * 1000)
    })

    it("should generate unique IDs", () => {
      const section1 = createTimelineSection("Section 1", 0, 10)
      const section2 = createTimelineSection("Section 2", 10, 10)

      expect(section1.id).not.toBe(section2.id)
      expect(section1.id).toMatch(/^section-\d+-[a-z0-9]+$/)
    })

    it("should calculate end time correctly", () => {
      const section = createTimelineSection("Test", 15, 25)

      expect(section.startTime).toBe(15)
      expect(section.duration).toBe(25)
      expect(section.endTime).toBe(40)
    })
  })

  describe("createTimelineTrack", () => {
    it("should create track with basic parameters", () => {
      const track = createTimelineTrack("Video Track", "video")

      expect(track).toHaveProperty("id")
      expect(track.name).toBe("Video Track")
      expect(track.type).toBe("video")
      expect(track.sectionId).toBeUndefined()
      expect(track.order).toBe(0)
      expect(track.clips).toEqual([])
      expect(track.isLocked).toBe(false)
      expect(track.isMuted).toBe(false)
      expect(track.isHidden).toBe(false)
      expect(track.isSolo).toBe(false)
      expect(track.volume).toBe(1)
      expect(track.pan).toBe(0)
      expect(track.trackEffects).toEqual([])
      expect(track.trackFilters).toEqual([])
    })

    it("should create track with section ID", () => {
      const track = createTimelineTrack("Audio Track", "audio", "section-123")

      expect(track.name).toBe("Audio Track")
      expect(track.type).toBe("audio")
      expect(track.sectionId).toBe("section-123")
    })

    it("should set correct height based on track type", () => {
      const videoTrack = createTimelineTrack("Video", "video")
      const audioTrack = createTimelineTrack("Audio", "audio")
      const titleTrack = createTimelineTrack("Title", "title")

      expect(videoTrack.height).toBe(120)
      expect(audioTrack.height).toBe(80)
      expect(titleTrack.height).toBe(60)
    })

    it("should generate unique IDs", () => {
      const track1 = createTimelineTrack("Track 1", "video")
      const track2 = createTimelineTrack("Track 2", "audio")

      expect(track1.id).not.toBe(track2.id)
      expect(track1.id).toMatch(/^track-\d+-[a-z0-9]+$/)
    })
  })

  describe("createTimelineClip", () => {
    it("should create clip with basic parameters", () => {
      const clip = createTimelineClip("media-123", "track-456", 10, 5)

      expect(clip).toHaveProperty("id")
      expect(clip.name).toMatch(/^Clip \d+$/)
      expect(clip.mediaId).toBe("media-123")
      expect(clip.trackId).toBe("track-456")
      expect(clip.startTime).toBe(10)
      expect(clip.duration).toBe(5)
      expect(clip.mediaStartTime).toBe(0)
      expect(clip.mediaEndTime).toBe(5)
      expect(clip.volume).toBe(1)
      expect(clip.speed).toBe(1)
      expect(clip.isReversed).toBe(false)
      expect(clip.opacity).toBe(1)
      expect(clip.effects).toEqual([])
      expect(clip.filters).toEqual([])
      expect(clip.transitions).toEqual([])
      expect(clip.isSelected).toBe(false)
      expect(clip.isLocked).toBe(false)
      expect(clip.createdAt).toBeInstanceOf(Date)
      expect(clip.updatedAt).toBeInstanceOf(Date)
    })

    it("should create clip with custom media start time", () => {
      const clip = createTimelineClip("media-123", "track-456", 0, 10, 5)

      expect(clip.mediaStartTime).toBe(5)
      expect(clip.mediaEndTime).toBe(15)
      expect(clip.duration).toBe(10)
    })

    it("should generate unique IDs", () => {
      const clip1 = createTimelineClip("media-1", "track-1", 0, 5)
      const clip2 = createTimelineClip("media-2", "track-2", 5, 5)

      expect(clip1.id).not.toBe(clip2.id)
      expect(clip1.id).toMatch(/^clip-\d+-[a-z0-9]+$/)
    })

    it("should calculate media end time correctly", () => {
      const clip = createTimelineClip("media-123", "track-456", 0, 8, 2)

      expect(clip.mediaStartTime).toBe(2)
      expect(clip.duration).toBe(8)
      expect(clip.mediaEndTime).toBe(10)
    })
  })

  describe("Factory Error Handling", () => {
    it("should handle empty strings gracefully", () => {
      expect(() => createTimelineProject("")).not.toThrow()
      expect(() => createTimelineSection("", 0, 1)).not.toThrow()
      expect(() => createTimelineTrack("", "video")).not.toThrow()
    })

    it("should handle negative values appropriately", () => {
      const section = createTimelineSection("Test", -5, 10)
      expect(section.startTime).toBe(-5)
      expect(section.endTime).toBe(5)

      const clip = createTimelineClip("media", "track", -2, 5, -1)
      expect(clip.startTime).toBe(-2)
      expect(clip.mediaStartTime).toBe(-1)
    })
  })
})

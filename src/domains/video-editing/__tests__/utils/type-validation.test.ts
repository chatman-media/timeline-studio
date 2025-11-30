/**
 * Tests for Type Validation Utilities
 *
 * Тесты для runtime валидации типов на границах Rust ↔ TypeScript
 */

import { describe, expect, it, vi } from "vitest"
import type { Clip, Project, ProjectEvent, Track as RustTrack } from "@/types/generated/tauri-bindings"
import {
  assertValid,
  validateClip,
  validateProject,
  validateProjectEvent,
  validateTrack,
} from "../../utils/type-validation"

// Mock logger to avoid console spam during tests
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Helper to create a valid Clip with required fields
const createMockClip = (overrides: Partial<Clip> = {}): Clip => ({
  id: "clip-1",
  media_id: "media-1",
  name: "test.mp4",
  timeline_in: 0,
  timeline_out: 10,
  source_in: 0,
  source_out: 10,
  playback_rate: 1.0,
  enabled: true,
  effects: [],
  transitions: [],
  keyframes: [],
  ...overrides,
})

// Helper to create a valid Track with required fields
const createMockTrack = (overrides: Partial<RustTrack> = {}): RustTrack => ({
  id: "track-1",
  name: "Video Track 1",
  track_type: "Video",
  enabled: true,
  locked: false,
  height: 100,
  clips: [],
  effects: [],
  volume: 1.0,
  pan: 0,
  ...overrides,
})

describe("Type Validation Utilities", () => {
  describe("validateClip", () => {
    const validClip = createMockClip()

    it("should validate correct clip", () => {
      expect(validateClip(validClip)).toBe(true)
    })

    it("should reject non-object values", () => {
      expect(validateClip(null)).toBe(false)
      expect(validateClip(undefined)).toBe(false)
      expect(validateClip("string")).toBe(false)
      expect(validateClip(123)).toBe(false)
      expect(validateClip([])).toBe(false)
    })

    it("should reject clip without id", () => {
      const { id, ...clipWithoutId } = validClip
      expect(validateClip(clipWithoutId)).toBe(false)
    })

    it("should reject clip with empty id", () => {
      expect(validateClip({ ...validClip, id: "" })).toBe(false)
    })

    it("should reject clip with non-string id", () => {
      expect(validateClip({ ...validClip, id: 123 })).toBe(false)
      expect(validateClip({ ...validClip, id: null })).toBe(false)
    })

    it("should reject clip without media_id", () => {
      const { media_id, ...clipWithoutMediaId } = validClip
      expect(validateClip(clipWithoutMediaId)).toBe(false)
    })

    it("should reject clip with empty media_id", () => {
      expect(validateClip({ ...validClip, media_id: "" })).toBe(false)
    })

    it("should reject clip with negative timeline_in", () => {
      expect(validateClip({ ...validClip, timeline_in: -1 })).toBe(false)
    })

    it("should accept clip with zero timeline_in", () => {
      expect(validateClip({ ...validClip, timeline_in: 0 })).toBe(true)
    })

    it("should reject clip with timeline_out <= timeline_in", () => {
      expect(validateClip({ ...validClip, timeline_in: 10, timeline_out: 10 })).toBe(false)
      expect(validateClip({ ...validClip, timeline_in: 10, timeline_out: 5 })).toBe(false)
    })

    it("should reject clip with non-number timing values", () => {
      expect(validateClip({ ...validClip, timeline_in: "0" })).toBe(false)
      expect(validateClip({ ...validClip, timeline_out: "10" })).toBe(false)
    })

    it("should reject clip with zero or negative playback_rate", () => {
      expect(validateClip({ ...validClip, playback_rate: 0 })).toBe(false)
      expect(validateClip({ ...validClip, playback_rate: -1 })).toBe(false)
    })

    it("should accept clip with very small positive playback_rate", () => {
      expect(validateClip({ ...validClip, playback_rate: 0.01 })).toBe(true)
    })

    it("should reject clip missing required fields", () => {
      const requiredFields = [
        "id",
        "media_id",
        "name",
        "timeline_in",
        "timeline_out",
        "source_in",
        "source_out",
        "playback_rate",
        "enabled",
      ]

      for (const field of requiredFields) {
        const { [field]: _, ...clipWithoutField } = validClip as any
        expect(validateClip(clipWithoutField)).toBe(false)
      }
    })
  })

  describe("validateTrack", () => {
    const validClip: Clip = {
      id: "clip-1",
      media_id: "media-1",
      name: "test.mp4",
      timeline_in: 0,
      timeline_out: 10,
      source_in: 0,
      source_out: 10,
      playback_rate: 1.0,
      enabled: true,
      effects: [],
      transitions: [],
      keyframes: [],
    }

    const validTrack: RustTrack = {
      id: "track-1",
      name: "Video Track 1",
      track_type: "Video",
      enabled: true,
      locked: false,
      height: 100,
      clips: [validClip],
      effects: [],
      volume: 1.0,
      pan: 0.0,
    }

    it("should validate correct track", () => {
      expect(validateTrack(validTrack)).toBe(true)
    })

    it("should reject non-object values", () => {
      expect(validateTrack(null)).toBe(false)
      expect(validateTrack(undefined)).toBe(false)
      expect(validateTrack("string")).toBe(false)
    })

    it("should reject track without id", () => {
      const { id, ...trackWithoutId } = validTrack
      expect(validateTrack(trackWithoutId)).toBe(false)
    })

    it("should reject track with empty id", () => {
      expect(validateTrack({ ...validTrack, id: "" })).toBe(false)
    })

    it("should reject track without name", () => {
      const { name, ...trackWithoutName } = validTrack
      expect(validateTrack(trackWithoutName)).toBe(false)
    })

    it("should reject track with empty name", () => {
      expect(validateTrack({ ...validTrack, name: "" })).toBe(false)
    })

    it("should validate all track types", () => {
      const validTypes = ["Video", "Audio", "Title", "Music", "Voiceover", "Sfx", "Ambient"]

      for (const type of validTypes) {
        expect(validateTrack({ ...validTrack, track_type: type })).toBe(true)
      }
    })

    it("should reject invalid track type", () => {
      expect(validateTrack({ ...validTrack, track_type: "InvalidType" })).toBe(false)
      expect(validateTrack({ ...validTrack, track_type: "video" })).toBe(false) // case-sensitive
      expect(validateTrack({ ...validTrack, track_type: "" })).toBe(false)
    })

    it("should reject track without clips array", () => {
      const { clips, ...trackWithoutClips } = validTrack
      expect(validateTrack(trackWithoutClips)).toBe(false)
    })

    it("should reject track with non-array clips", () => {
      expect(validateTrack({ ...validTrack, clips: "not-array" })).toBe(false)
      expect(validateTrack({ ...validTrack, clips: {} })).toBe(false)
    })

    it("should accept track with empty clips array", () => {
      expect(validateTrack({ ...validTrack, clips: [] })).toBe(true)
    })

    it("should reject track with invalid clip", () => {
      const invalidClip = { ...validClip, id: "" }
      expect(validateTrack({ ...validTrack, clips: [invalidClip] })).toBe(false)
    })

    it("should validate track with multiple clips", () => {
      const clip2 = { ...validClip, id: "clip-2" }
      const clip3 = { ...validClip, id: "clip-3" }
      expect(validateTrack({ ...validTrack, clips: [validClip, clip2, clip3] })).toBe(true)
    })

    it("should reject track if any clip is invalid", () => {
      const invalidClip = { ...validClip, playback_rate: -1 }
      const validClip2 = { ...validClip, id: "clip-2" }
      expect(validateTrack({ ...validTrack, clips: [validClip2, invalidClip] })).toBe(false)
    })
  })

  describe("validateProject", () => {
    const validClip: Clip = {
      id: "clip-1",
      media_id: "media-1",
      name: "test.mp4",
      timeline_in: 0,
      timeline_out: 10,
      source_in: 0,
      source_out: 10,
      playback_rate: 1.0,
      enabled: true,
      effects: [],
      transitions: [],
      keyframes: [],
    }

    const validTrack: RustTrack = {
      id: "track-1",
      name: "Video Track 1",
      track_type: "Video",
      enabled: true,
      locked: false,
      height: 100,
      clips: [validClip],
      effects: [],
      volume: 1.0,
      pan: 0.0,
    }

    const validProject: Project = {
      id: "project-1",
      metadata: {
        name: "Test Project",
        description: null,
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString(),
        file_path: null,
        is_dirty: false,
        version: "1.0.0",
      },
      timeline: {
        duration: 100,
        fps: 30,
        sample_rate: 48000,
        tracks: [validTrack],
        markers: [],
      },
      media_pool: {
        items: {},
      },
      settings: {
        resolution: { width: 1920, height: 1080 },
        frame_rate: 30,
        audio_sample_rate: 48000,
        audio_channels: 2,
      },
      effects_pool: {} as any,
      filters_pool: {} as any,
      transitions_pool: {} as any,
      templates_pool: {} as any,
      style_templates_pool: {} as any,
      subtitles_pool: {} as any,
      color_grading_presets_pool: {} as any,
    }

    it("should validate correct project", () => {
      expect(validateProject(validProject)).toBe(true)
    })

    it("should reject non-object values", () => {
      expect(validateProject(null)).toBe(false)
      expect(validateProject(undefined)).toBe(false)
      expect(validateProject("string")).toBe(false)
    })

    it("should reject project without id", () => {
      const { id, ...projectWithoutId } = validProject
      expect(validateProject(projectWithoutId)).toBe(false)
    })

    it("should reject project with empty id", () => {
      expect(validateProject({ ...validProject, id: "" })).toBe(false)
    })

    it("should reject project without timeline", () => {
      const { timeline, ...projectWithoutTimeline } = validProject
      expect(validateProject(projectWithoutTimeline)).toBe(false)
    })

    it("should reject project with non-object timeline", () => {
      expect(validateProject({ ...validProject, timeline: "not-object" })).toBe(false)
      expect(validateProject({ ...validProject, timeline: [] })).toBe(false)
    })

    it("should reject project without timeline.tracks", () => {
      expect(validateProject({ ...validProject, timeline: {} })).toBe(false)
    })

    it("should reject project with non-array tracks", () => {
      expect(validateProject({ ...validProject, timeline: { tracks: "not-array" } })).toBe(false)
    })

    it("should accept project with empty tracks", () => {
      expect(validateProject({ ...validProject, timeline: { tracks: [] } })).toBe(true)
    })

    it("should reject project with invalid track", () => {
      const invalidTrack = { ...validTrack, id: "" }
      expect(validateProject({ ...validProject, timeline: { tracks: [invalidTrack] } })).toBe(false)
    })

    it("should validate project with multiple tracks", () => {
      const track2 = { ...validTrack, id: "track-2", track_type: "Audio" as const }
      expect(validateProject({ ...validProject, timeline: { tracks: [validTrack, track2] } })).toBe(true)
    })
  })

  describe("validateProjectEvent", () => {
    const validClip: Clip = {
      id: "clip-1",
      media_id: "media-1",
      name: "test.mp4",
      timeline_in: 0,
      timeline_out: 10,
      source_in: 0,
      source_out: 10,
      playback_rate: 1.0,
      enabled: true,
      effects: [],
      transitions: [],
      keyframes: [],
    }

    const validTrack: RustTrack = {
      id: "track-1",
      name: "Video Track 1",
      track_type: "Video",
      enabled: true,
      locked: false,
      height: 100,
      clips: [],
      effects: [],
      volume: 1.0,
      pan: 0.0,
    }

    it("should reject non-object values", () => {
      expect(validateProjectEvent(null)).toBe(false)
      expect(validateProjectEvent(undefined)).toBe(false)
      expect(validateProjectEvent("string")).toBe(false)
    })

    it("should reject event without type", () => {
      expect(validateProjectEvent({ payload: {} })).toBe(false)
    })

    it("should reject event with non-string type", () => {
      expect(validateProjectEvent({ type: 123, payload: {} })).toBe(false)
    })

    describe("ClipAdded event", () => {
      it("should validate correct ClipAdded event", () => {
        const event: ProjectEvent = {
          type: "ClipAdded",
          payload: {
            track_id: "track-1",
            clip: validClip,
          },
        }
        expect(validateProjectEvent(event)).toBe(true)
      })

      it("should reject ClipAdded without track_id", () => {
        const event = {
          type: "ClipAdded",
          payload: {
            clip: validClip,
          },
        }
        expect(validateProjectEvent(event)).toBe(false)
      })

      it("should reject ClipAdded without clip", () => {
        const event = {
          type: "ClipAdded",
          payload: {
            track_id: "track-1",
          },
        }
        expect(validateProjectEvent(event)).toBe(false)
      })

      it("should reject ClipAdded with invalid clip", () => {
        const invalidClip = { ...validClip, id: "" }
        const event = {
          type: "ClipAdded",
          payload: {
            track_id: "track-1",
            clip: invalidClip,
          },
        }
        expect(validateProjectEvent(event)).toBe(false)
      })
    })

    describe("ClipMoved event", () => {
      it("should validate correct ClipMoved event", () => {
        const event: ProjectEvent = {
          type: "ClipMoved",
          payload: {
            clip_id: "clip-1",
            new_track_id: "track-2",
            new_time: 5.0,
          },
        }
        expect(validateProjectEvent(event)).toBe(true)
      })

      it("should reject ClipMoved without clip_id", () => {
        const event = {
          type: "ClipMoved",
          payload: {
            new_track_id: "track-2",
            new_time: 5.0,
          },
        }
        expect(validateProjectEvent(event)).toBe(false)
      })

      it("should reject ClipMoved without new_track_id", () => {
        const event = {
          type: "ClipMoved",
          payload: {
            clip_id: "clip-1",
            new_time: 5.0,
          },
        }
        expect(validateProjectEvent(event)).toBe(false)
      })

      it("should reject ClipMoved without new_time", () => {
        const event = {
          type: "ClipMoved",
          payload: {
            clip_id: "clip-1",
            new_track_id: "track-2",
          },
        }
        expect(validateProjectEvent(event)).toBe(false)
      })

      it("should reject ClipMoved with non-number new_time", () => {
        const event = {
          type: "ClipMoved",
          payload: {
            clip_id: "clip-1",
            new_track_id: "track-2",
            new_time: "5.0",
          },
        }
        expect(validateProjectEvent(event)).toBe(false)
      })
    })

    describe("ClipDeleted event", () => {
      it("should validate correct ClipDeleted event", () => {
        const event: ProjectEvent = {
          type: "ClipDeleted",
          payload: {
            clip_id: "clip-1",
            track_id: "track-1",
          },
        }
        expect(validateProjectEvent(event)).toBe(true)
      })

      it("should reject ClipDeleted without clip_id", () => {
        const event = {
          type: "ClipDeleted",
          payload: {},
        }
        expect(validateProjectEvent(event)).toBe(false)
      })

      it("should reject ClipDeleted with non-string clip_id", () => {
        const event = {
          type: "ClipDeleted",
          payload: {
            clip_id: 123,
          },
        }
        expect(validateProjectEvent(event)).toBe(false)
      })
    })

    describe("TrackAdded event", () => {
      it("should validate correct TrackAdded event", () => {
        const trackData = {
          id: validTrack.id,
          name: validTrack.name,
          track_type: validTrack.track_type,
          clips: [],
          index: 0,
        }
        const event: ProjectEvent = {
          type: "TrackAdded",
          payload: {
            track: trackData,
          },
        }
        expect(validateProjectEvent(event)).toBe(true)
      })

      it("should reject TrackAdded without track", () => {
        const event = {
          type: "TrackAdded",
          payload: {},
        }
        expect(validateProjectEvent(event)).toBe(false)
      })

      it("should reject TrackAdded with invalid track", () => {
        const invalidTrack = {
          id: "",
          name: validTrack.name,
          track_type: validTrack.track_type,
          index: 0,
        }
        const event = {
          type: "TrackAdded",
          payload: {
            track: invalidTrack,
          },
        }
        expect(validateProjectEvent(event)).toBe(false)
      })
    })

    it("should accept events without payload", () => {
      const event = {
        type: "ImportedMediaCleared",
      }
      expect(validateProjectEvent(event)).toBe(true)
    })

    it("should reject event with non-object payload", () => {
      const event = {
        type: "ClipAdded",
        payload: "not-object",
      }
      expect(validateProjectEvent(event)).toBe(false)
    })
  })

  describe("assertValid", () => {
    const validClip: Clip = {
      id: "clip-1",
      media_id: "media-1",
      name: "test.mp4",
      timeline_in: 0,
      timeline_out: 10,
      source_in: 0,
      source_out: 10,
      playback_rate: 1.0,
      enabled: true,
      effects: [],
      transitions: [],
      keyframes: [],
    }

    it("should not throw for valid value", () => {
      expect(() => {
        assertValid(validClip, validateClip, "Invalid clip")
      }).not.toThrow()
    })

    it("should throw for invalid value", () => {
      const invalidClip = { ...validClip, id: "" }
      expect(() => {
        assertValid(invalidClip, validateClip, "Invalid clip")
      }).toThrow("Invalid clip")
    })

    it("should include value in error message", () => {
      const invalidClip = { ...validClip, id: "" }
      expect(() => {
        assertValid(invalidClip, validateClip, "Invalid clip")
      }).toThrow(/Invalid clip:/)
    })

    it("should work with different validators", () => {
      const validTrack: RustTrack = {
        id: "track-1",
        name: "Track 1",
        track_type: "Video",
        enabled: true,
        locked: false,
        height: 100,
        clips: [],
        effects: [],
        volume: 1.0,
        pan: 0.0,
      }

      expect(() => {
        assertValid(validTrack, validateTrack, "Invalid track")
      }).not.toThrow()
    })
  })

  describe("Edge Cases", () => {
    it("should handle clip with Unicode characters", () => {
      const clip = {
        id: "clip-1",
        media_id: "media-1",
        name: "测试视频.mp4 🎬",
        timeline_in: 0,
        timeline_out: 10,
        source_in: 0,
        source_out: 10,
        playback_rate: 1.0,
        enabled: true,
      }
      expect(validateClip(clip)).toBe(true)
    })

    it("should handle very long clip names", () => {
      const clip = {
        id: "clip-1",
        media_id: "media-1",
        name: "a".repeat(10000),
        timeline_in: 0,
        timeline_out: 10,
        source_in: 0,
        source_out: 10,
        playback_rate: 1.0,
        enabled: true,
      }
      expect(validateClip(clip)).toBe(true)
    })

    it("should handle very large numbers", () => {
      const clip = {
        id: "clip-1",
        media_id: "media-1",
        name: "test.mp4",
        timeline_in: 0,
        timeline_out: Number.MAX_SAFE_INTEGER,
        source_in: 0,
        source_out: Number.MAX_SAFE_INTEGER,
        playback_rate: 1.0,
        enabled: true,
      }
      expect(validateClip(clip)).toBe(true)
    })

    it("should handle very small positive playback rates", () => {
      const clip = {
        id: "clip-1",
        media_id: "media-1",
        name: "test.mp4",
        timeline_in: 0,
        timeline_out: 10,
        source_in: 0,
        source_out: 10,
        playback_rate: 0.0001,
        enabled: true,
      }
      expect(validateClip(clip)).toBe(true)
    })

    it("should accept Infinity in numeric fields", () => {
      const clip = {
        id: "clip-1",
        media_id: "media-1",
        name: "test.mp4",
        timeline_in: 0,
        timeline_out: Number.POSITIVE_INFINITY,
        source_in: 0,
        source_out: 10,
        playback_rate: 1.0,
        enabled: true,
      }
      expect(validateClip(clip)).toBe(true) // Infinity is a valid number in JavaScript
    })
  })
})

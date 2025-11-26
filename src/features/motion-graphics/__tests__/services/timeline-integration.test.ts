import { describe, expect, it } from "vitest"
import type { TimelineClip } from "@/features/timeline/types/timeline"
import { createKeyframe } from "../../services/keyframe-manager"
import {
  addMotionGraphicsToClip,
  applyMotionPresetToClip,
  copyMotionGraphics,
  createMotionContext,
  evaluateClipMotionAtTime,
  exportMotionGraphics,
  getMotionGraphicsSummary,
  getMotionKeyframesForTimeline,
  importMotionGraphics,
  offsetMotionGraphicsTiming,
  removeMotionGraphicsFromClip,
  scaleMotionGraphicsDuration,
  updateMotionPropertyInClip,
} from "../../services/timeline-integration"
import type { MotionGraphicsClip, MotionPreset } from "../../types/keyframe"

describe("TimelineIntegration", () => {
  const createMockClip = (): TimelineClip => ({
    id: "clip-1",
    trackId: "track-1",
    startTime: 0,
    duration: 5,
    trimStart: 0,
    trimEnd: 0,
    enabled: true,
    locked: false,
    selected: false,
  })

  const createMockPreset = (): MotionPreset => ({
    id: "preset-1",
    name: "Test Preset",
    description: "Test motion preset",
    category: "test",
    tags: ["test"],
    duration: 2,
    scalable: true,
    customizable: true,
    properties: [
      {
        id: "prop-1",
        name: "Opacity",
        path: "opacity",
        type: "number",
        keyframes: [createKeyframe(0, 0), createKeyframe(2, 100)],
        enabled: true,
      },
    ],
  })

  describe("addMotionGraphicsToClip", () => {
    it("adds motion graphics to clip without preset", () => {
      const clip = createMockClip()
      const motionClip = addMotionGraphicsToClip(clip)

      expect(motionClip.motionTracks).toEqual([])
      expect(motionClip.motionEnabled).toBe(true)
    })

    it("adds motion graphics with preset", () => {
      const clip = createMockClip()
      const preset = createMockPreset()
      const motionClip = addMotionGraphicsToClip(clip, preset)

      expect(motionClip.motionTracks).toHaveLength(1)
      expect(motionClip.motionTracks![0].layers).toHaveLength(1)
      expect(motionClip.motionEnabled).toBe(true)
    })

    it("applies preset with clip duration", () => {
      const clip = createMockClip()
      const preset = createMockPreset()
      const motionClip = addMotionGraphicsToClip(clip, preset)

      const layer = motionClip.motionTracks![0].layers[0]
      const lastKeyframe = layer.properties[0].keyframes[layer.properties[0].keyframes.length - 1]

      expect(lastKeyframe.time).toBe(clip.duration)
    })
  })

  describe("applyMotionPresetToClip", () => {
    it("applies preset to clip", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()

      const updated = applyMotionPresetToClip(clip, preset)

      expect(updated.motionTracks).toHaveLength(1)
      expect(updated.motionEnabled).toBe(true)
    })

    it("replaces existing tracks when replace option is true", () => {
      const clip: MotionGraphicsClip = {
        ...createMockClip(),
        motionTracks: [
          {
            id: "track-1",
            targetId: "clip-1",
            targetType: "clip",
            layers: [],
            enabled: true,
          },
        ],
        motionEnabled: true,
      }
      const preset = createMockPreset()

      const updated = applyMotionPresetToClip(clip, preset, { replace: true })

      expect(updated.motionTracks).toHaveLength(1)
      expect(updated.motionTracks![0].layers).toHaveLength(1)
    })

    it("adds to existing tracks when replace is false", () => {
      const clip: MotionGraphicsClip = {
        ...createMockClip(),
        motionTracks: [
          {
            id: "track-1",
            targetId: "clip-1",
            targetType: "clip",
            layers: [
              {
                id: "layer-1",
                name: "Existing Layer",
                properties: [],
                enabled: true,
                solo: false,
                locked: false,
                opacity: 1,
                blendMode: "normal",
              },
            ],
            enabled: true,
          },
        ],
        motionEnabled: true,
      }
      const preset = createMockPreset()

      const updated = applyMotionPresetToClip(clip, preset, { replace: false })

      expect(updated.motionTracks![0].layers).toHaveLength(2)
    })

    it("applies custom start time and duration", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()

      const updated = applyMotionPresetToClip(clip, preset, {
        startTime: 1,
        duration: 3,
      })

      const layer = updated.motionTracks![0].layers[0]
      const firstKeyframe = layer.properties[0].keyframes[0]
      const lastKeyframe = layer.properties[0].keyframes[layer.properties[0].keyframes.length - 1]

      expect(firstKeyframe.time).toBe(1)
      expect(lastKeyframe.time).toBe(4) // startTime + duration
    })
  })

  describe("evaluateClipMotionAtTime", () => {
    it("returns empty object when motion disabled", () => {
      const clip: MotionGraphicsClip = {
        ...createMockClip(),
        motionEnabled: false,
      }

      const values = evaluateClipMotionAtTime(clip, 1)

      expect(values).toEqual({})
    })

    it("returns empty object when no motion tracks", () => {
      const clip: MotionGraphicsClip = {
        ...createMockClip(),
        motionEnabled: true,
      }

      const values = evaluateClipMotionAtTime(clip, 1)

      expect(values).toEqual({})
    })

    it("returns empty object for time outside clip range", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()
      const motionClip = applyMotionPresetToClip(clip, preset)

      const values = evaluateClipMotionAtTime(motionClip, 10)

      expect(values).toEqual({})
    })

    it("evaluates motion at time within clip", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()
      const motionClip = applyMotionPresetToClip(clip, preset)

      const values = evaluateClipMotionAtTime(motionClip, 1)

      expect(values).toBeDefined()
      expect(Object.keys(values).length).toBeGreaterThan(0)
    })

    it("adjusts time relative to clip start", () => {
      const clip: TimelineClip = {
        ...createMockClip(),
        startTime: 5,
      }
      const preset = createMockPreset()
      const motionClip = applyMotionPresetToClip(clip as MotionGraphicsClip, preset)

      // Time 6 in timeline = time 1 in clip
      const values = evaluateClipMotionAtTime(motionClip, 6)

      expect(values).toBeDefined()
    })
  })

  describe("getMotionKeyframesForTimeline", () => {
    it("returns empty array when no motion tracks", () => {
      const clip: MotionGraphicsClip = createMockClip() as MotionGraphicsClip

      const keyframes = getMotionKeyframesForTimeline(clip)

      expect(keyframes).toEqual([])
    })

    it("returns all keyframes from motion tracks", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()
      const motionClip = applyMotionPresetToClip(clip, preset)

      const keyframes = getMotionKeyframesForTimeline(motionClip)

      expect(keyframes.length).toBeGreaterThan(0)
    })

    it("filters keyframes by property path", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()
      const motionClip = applyMotionPresetToClip(clip, preset)

      const keyframes = getMotionKeyframesForTimeline(motionClip, "opacity")

      expect(keyframes.every((kf) => typeof kf.value === "number")).toBe(true)
    })

    it("adjusts keyframe times to timeline coordinates", () => {
      const clip: TimelineClip = {
        ...createMockClip(),
        startTime: 10,
      }
      const preset = createMockPreset()
      const motionClip = applyMotionPresetToClip(clip as MotionGraphicsClip, preset)

      const keyframes = getMotionKeyframesForTimeline(motionClip)

      // All keyframes should be offset by clip start time
      expect(keyframes.every((kf) => kf.time >= 10)).toBe(true)
    })

    it("sorts keyframes by time", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()
      const motionClip = applyMotionPresetToClip(clip, preset)

      const keyframes = getMotionKeyframesForTimeline(motionClip)

      for (let i = 1; i < keyframes.length; i++) {
        expect(keyframes[i].time).toBeGreaterThanOrEqual(keyframes[i - 1].time)
      }
    })
  })

  describe("updateMotionPropertyInClip", () => {
    it("updates property by path", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()
      const motionClip = applyMotionPresetToClip(clip, preset)

      const updated = updateMotionPropertyInClip(motionClip, "opacity", { enabled: false })

      const property = updated.motionTracks![0].layers[0].properties[0]
      expect(property.enabled).toBe(false)
    })

    it("returns unchanged clip when no motion tracks", () => {
      const clip: MotionGraphicsClip = createMockClip() as MotionGraphicsClip

      const updated = updateMotionPropertyInClip(clip, "opacity", { enabled: false })

      expect(updated).toBe(clip)
    })
  })

  describe("removeMotionGraphicsFromClip", () => {
    it("removes motion graphics data", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()
      const motionClip = applyMotionPresetToClip(clip, preset)

      const plainClip = removeMotionGraphicsFromClip(motionClip)

      expect((plainClip as any).motionTracks).toBeUndefined()
      expect((plainClip as any).motionEnabled).toBeUndefined()
    })
  })

  describe("copyMotionGraphics", () => {
    it("copies motion graphics to target clip", () => {
      const sourceClip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()
      const source = applyMotionPresetToClip(sourceClip, preset)

      const targetClip = { ...createMockClip(), id: "clip-2" }
      const copied = copyMotionGraphics(source, targetClip)

      expect(copied.motionTracks).toHaveLength(1)
      expect(copied.id).toBe("clip-2")
    })

    it("generates new IDs for copied tracks", () => {
      const sourceClip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()
      const source = applyMotionPresetToClip(sourceClip, preset)

      const targetClip = { ...createMockClip(), id: "clip-2" }
      const copied = copyMotionGraphics(source, targetClip)

      expect(copied.motionTracks![0].id).not.toBe(source.motionTracks![0].id)
    })

    it("returns target clip unchanged when source has no motion tracks", () => {
      const source: MotionGraphicsClip = createMockClip() as MotionGraphicsClip
      const target = createMockClip()

      const copied = copyMotionGraphics(source, target)

      expect((copied as any).motionTracks).toBeUndefined()
    })
  })

  describe("scaleMotionGraphicsDuration", () => {
    it("scales motion graphics to new duration", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()
      const motionClip = applyMotionPresetToClip(clip, preset)

      const scaled = scaleMotionGraphicsDuration(motionClip, 10)

      const property = scaled.motionTracks![0].layers[0].properties[0]
      const lastKeyframe = property.keyframes[property.keyframes.length - 1]

      expect(lastKeyframe.time).toBe(10)
    })

    it("returns unchanged clip when no motion tracks", () => {
      const clip: MotionGraphicsClip = createMockClip() as MotionGraphicsClip

      const scaled = scaleMotionGraphicsDuration(clip, 10)

      expect(scaled).toBe(clip)
    })
  })

  describe("offsetMotionGraphicsTiming", () => {
    it("offsets all keyframes by time offset", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()
      const motionClip = applyMotionPresetToClip(clip, preset)

      const offset = offsetMotionGraphicsTiming(motionClip, 2)

      const property = offset.motionTracks![0].layers[0].properties[0]
      const firstKeyframe = property.keyframes[0]

      expect(firstKeyframe.time).toBeGreaterThanOrEqual(2)
    })

    it("prevents negative time", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()
      const motionClip = applyMotionPresetToClip(clip, preset)

      const offset = offsetMotionGraphicsTiming(motionClip, -10)

      const property = offset.motionTracks![0].layers[0].properties[0]
      const firstKeyframe = property.keyframes[0]

      expect(firstKeyframe.time).toBeGreaterThanOrEqual(0)
    })
  })

  describe("exportMotionGraphics", () => {
    it("exports motion graphics as JSON", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()
      const motionClip = applyMotionPresetToClip(clip, preset)

      const json = exportMotionGraphics(motionClip)

      expect(typeof json).toBe("string")
      expect(() => JSON.parse(json)).not.toThrow()
    })

    it("exports empty object when no motion tracks", () => {
      const clip: MotionGraphicsClip = createMockClip() as MotionGraphicsClip

      const json = exportMotionGraphics(clip)

      expect(json).toBe("{}")
    })

    it("exported JSON has correct structure", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()
      const motionClip = applyMotionPresetToClip(clip, preset)

      const json = exportMotionGraphics(motionClip)
      const data = JSON.parse(json)

      expect(data.version).toBe("1.0.0")
      expect(data.clipId).toBe(motionClip.id)
      expect(data.duration).toBe(motionClip.duration)
      expect(data.motionTracks).toBeDefined()
    })
  })

  describe("importMotionGraphics", () => {
    it("imports motion graphics from JSON", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()
      const motionClip = applyMotionPresetToClip(clip, preset)

      const json = exportMotionGraphics(motionClip)
      const targetClip = { ...createMockClip(), id: "clip-2" }

      const imported = importMotionGraphics(targetClip, json)

      expect(imported).toBeDefined()
      expect(imported?.motionTracks).toHaveLength(1)
      expect(imported?.motionEnabled).toBe(true)
    })

    it("returns null for invalid JSON", () => {
      const clip = createMockClip()
      const imported = importMotionGraphics(clip, "invalid json")

      expect(imported).toBeNull()
    })

    it("returns null for JSON without motion tracks", () => {
      const clip = createMockClip()
      const imported = importMotionGraphics(clip, JSON.stringify({ version: "1.0.0" }))

      expect(imported).toBeNull()
    })
  })

  describe("getMotionGraphicsSummary", () => {
    it("returns summary for clip with motion graphics", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const preset = createMockPreset()
      const motionClip = applyMotionPresetToClip(clip, preset)

      const summary = getMotionGraphicsSummary(motionClip)

      expect(summary.enabled).toBe(true)
      expect(summary.tracks).toBe(1)
      expect(summary.layers).toBe(1)
      expect(summary.properties).toBe(1)
      expect(summary.keyframes).toBeGreaterThan(0)
    })

    it("returns zero summary for clip without motion graphics", () => {
      const clip: MotionGraphicsClip = createMockClip() as MotionGraphicsClip

      const summary = getMotionGraphicsSummary(clip)

      expect(summary.enabled).toBe(false)
      expect(summary.tracks).toBe(0)
      expect(summary.layers).toBe(0)
      expect(summary.properties).toBe(0)
      expect(summary.keyframes).toBe(0)
    })
  })

  describe("createMotionContext", () => {
    it("creates context with correct values", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const context = createMotionContext(clip, 1, 30, 30)

      expect(context.time).toBe(1)
      expect(context.frame).toBe(30)
      expect(context.fps).toBe(30)
      expect(context.comp.width).toBe(1920)
      expect(context.comp.height).toBe(1080)
      expect(context.comp.duration).toBe(clip.duration)
    })

    it("provides helper functions", () => {
      const clip = createMockClip() as MotionGraphicsClip
      const context = createMotionContext(clip, 1, 30)

      expect(typeof context.thisComp).toBe("function")
      expect(typeof context.thisLayer).toBe("function")
      expect(typeof context.thisProperty).toBe("function")
    })
  })
})

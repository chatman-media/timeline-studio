import { describe, expect, it } from "vitest"
import {
  addLayerToTrack,
  blendLayerValues,
  createAnimationLayer,
  createAnimationState,
  createAnimationTrack,
  duplicateLayer,
  evaluateLayerAtTime,
  evaluateTrackAtTime,
  exportLayer,
  getLayerHierarchy,
  importLayer,
  mergeLayers,
  removeLayerFromTrack,
  reorderLayersInTrack,
  setLayerParent,
  updateLayerInTrack,
} from "../../services/animation-layers"
import { createKeyframe } from "../../services/keyframe-manager"
import type {
  AnimatedProperty,
  AnimationLayer,
  AnimationTrack,
  KeyframeValue,
} from "../../types/keyframe"

describe("AnimationLayers", () => {
  const createMockProperty = (name: string = "Test"): AnimatedProperty => ({
    id: `prop-${name}`,
    name,
    path: `path.${name}`,
    type: "number",
    keyframes: [createKeyframe(0, 0), createKeyframe(1, 100)],
    enabled: true,
  })

  describe("createAnimationLayer", () => {
    it("creates layer with default properties", () => {
      const layer = createAnimationLayer("Test Layer")

      expect(layer.id).toBeDefined()
      expect(layer.name).toBe("Test Layer")
      expect(layer.properties).toEqual([])
      expect(layer.enabled).toBe(true)
      expect(layer.solo).toBe(false)
      expect(layer.locked).toBe(false)
      expect(layer.opacity).toBe(1)
      expect(layer.blendMode).toBe("normal")
    })

    it("creates layer with properties", () => {
      const properties = [createMockProperty()]
      const layer = createAnimationLayer("Test Layer", properties)

      expect(layer.properties).toHaveLength(1)
    })
  })

  describe("createAnimationTrack", () => {
    it("creates track with correct properties", () => {
      const track = createAnimationTrack("target-1", "clip")

      expect(track.id).toBeDefined()
      expect(track.targetId).toBe("target-1")
      expect(track.targetType).toBe("clip")
      expect(track.layers).toEqual([])
      expect(track.enabled).toBe(true)
    })
  })

  describe("addLayerToTrack", () => {
    const track: AnimationTrack = {
      id: "track-1",
      targetId: "target-1",
      targetType: "clip",
      layers: [],
      enabled: true,
    }
    const layer = createAnimationLayer("Layer 1")

    it("adds layer to empty track", () => {
      const updated = addLayerToTrack(track, layer)

      expect(updated.layers).toHaveLength(1)
      expect(updated.layers[0]).toBe(layer)
    })

    it("adds layer at specific index", () => {
      const layer2 = createAnimationLayer("Layer 2")
      const layer3 = createAnimationLayer("Layer 3")

      let updated = addLayerToTrack(track, layer)
      updated = addLayerToTrack(updated, layer3)
      updated = addLayerToTrack(updated, layer2, 1)

      expect(updated.layers).toHaveLength(3)
      expect(updated.layers[1]).toBe(layer2)
    })

    it("adds layer at end when no index specified", () => {
      const layer2 = createAnimationLayer("Layer 2")

      let updated = addLayerToTrack(track, layer)
      updated = addLayerToTrack(updated, layer2)

      expect(updated.layers).toHaveLength(2)
      expect(updated.layers[1]).toBe(layer2)
    })
  })

  describe("removeLayerFromTrack", () => {
    it("removes layer by id", () => {
      const layer1 = createAnimationLayer("Layer 1")
      const layer2 = createAnimationLayer("Layer 2")

      const track: AnimationTrack = {
        id: "track-1",
        targetId: "target-1",
        targetType: "clip",
        layers: [layer1, layer2],
        enabled: true,
      }

      const updated = removeLayerFromTrack(track, layer1.id)

      expect(updated.layers).toHaveLength(1)
      expect(updated.layers[0]).toBe(layer2)
    })
  })

  describe("updateLayerInTrack", () => {
    it("updates layer properties", () => {
      const layer = createAnimationLayer("Layer 1")
      const track: AnimationTrack = {
        id: "track-1",
        targetId: "target-1",
        targetType: "clip",
        layers: [layer],
        enabled: true,
      }

      const updated = updateLayerInTrack(track, layer.id, {
        name: "Updated Layer",
        opacity: 0.5,
      })

      expect(updated.layers[0].name).toBe("Updated Layer")
      expect(updated.layers[0].opacity).toBe(0.5)
    })
  })

  describe("reorderLayersInTrack", () => {
    it("reorders layers", () => {
      const layer1 = createAnimationLayer("Layer 1")
      const layer2 = createAnimationLayer("Layer 2")
      const layer3 = createAnimationLayer("Layer 3")

      const track: AnimationTrack = {
        id: "track-1",
        targetId: "target-1",
        targetType: "clip",
        layers: [layer1, layer2, layer3],
        enabled: true,
      }

      const updated = reorderLayersInTrack(track, 0, 2)

      expect(updated.layers[0]).toBe(layer2)
      expect(updated.layers[1]).toBe(layer3)
      expect(updated.layers[2]).toBe(layer1)
    })
  })

  describe("evaluateLayerAtTime", () => {
    it("evaluates layer properties at time", () => {
      const property = createMockProperty("opacity")
      const layer = createAnimationLayer("Test Layer", [property])

      const context = {
        time: 0.5,
        frame: 15,
        fps: 30,
        comp: { width: 1920, height: 1080, duration: 10, frameDuration: 1 / 30 },
        thisComp: () => null,
        thisLayer: () => null,
        thisProperty: () => null,
      }

      const values = evaluateLayerAtTime(layer, 0.5, context)

      expect(values[property.path]).toBe(50)
    })

    it("skips disabled properties", () => {
      const property: AnimatedProperty = {
        ...createMockProperty("opacity"),
        enabled: false,
      }
      const layer = createAnimationLayer("Test Layer", [property])

      const context = {
        time: 0.5,
        frame: 15,
        fps: 30,
        comp: { width: 1920, height: 1080, duration: 10, frameDuration: 1 / 30 },
        thisComp: () => null,
        thisLayer: () => null,
        thisProperty: () => null,
      }

      const values = evaluateLayerAtTime(layer, 0.5, context)

      expect(values[property.path]).toBeUndefined()
    })

    it("applies time offset", () => {
      const property = createMockProperty("opacity")
      const layer: AnimationLayer = {
        ...createAnimationLayer("Test Layer", [property]),
        offset: 0.5,
      }

      const context = {
        time: 1,
        frame: 30,
        fps: 30,
        comp: { width: 1920, height: 1080, duration: 10, frameDuration: 1 / 30 },
        thisComp: () => null,
        thisLayer: () => null,
        thisProperty: () => null,
      }

      const values = evaluateLayerAtTime(layer, 1, context)

      // With offset of 0.5, time 1 becomes 0.5 for the layer
      expect(values[property.path]).toBe(50)
    })

    it("applies time scale", () => {
      const property = createMockProperty("opacity")
      const layer: AnimationLayer = {
        ...createAnimationLayer("Test Layer", [property]),
        timeScale: 2,
      }

      const context = {
        time: 0.5,
        frame: 15,
        fps: 30,
        comp: { width: 1920, height: 1080, duration: 10, frameDuration: 1 / 30 },
        thisComp: () => null,
        thisLayer: () => null,
        thisProperty: () => null,
      }

      const values = evaluateLayerAtTime(layer, 0.5, context)

      // With time scale of 2, time 0.5 becomes 1
      expect(values[property.path]).toBe(100)
    })
  })

  describe("blendLayerValues", () => {
    it("blends with normal mode", () => {
      const baseValues = { opacity: 50 }
      const layerValues = { opacity: 100 }
      const layer = createAnimationLayer("Test")

      const blended = blendLayerValues(baseValues, layerValues, layer)

      expect(blended.opacity).toBe(100)
    })

    it("applies layer opacity", () => {
      const baseValues = { opacity: 50 }
      const layerValues = { opacity: 100 }
      const layer: AnimationLayer = {
        ...createAnimationLayer("Test"),
        opacity: 0.5,
      }

      const blended = blendLayerValues(baseValues, layerValues, layer)

      expect(blended.opacity).toBe(50)
    })

    it("blends with add mode", () => {
      const baseValues = { value: 50 }
      const layerValues = { value: 30 }
      const layer: AnimationLayer = {
        ...createAnimationLayer("Test"),
        blendMode: "add",
      }

      const blended = blendLayerValues(baseValues, layerValues, layer)

      expect(blended.value).toBe(80)
    })

    it("blends with multiply mode", () => {
      const baseValues = { value: 2 }
      const layerValues = { value: 3 }
      const layer: AnimationLayer = {
        ...createAnimationLayer("Test"),
        blendMode: "multiply",
      }

      const blended = blendLayerValues(baseValues, layerValues, layer)

      expect(blended.value).toBe(6)
    })

    it("blends vector values", () => {
      const baseValues: Record<string, KeyframeValue> = { position: [10, 20] as [number, number] }
      const layerValues: Record<string, KeyframeValue> = { position: [5, 10] as [number, number] }
      const layer: AnimationLayer = {
        ...createAnimationLayer("Test"),
        blendMode: "add",
      }

      const blended = blendLayerValues(baseValues, layerValues, layer)

      expect(blended.position).toEqual([15, 30])
    })
  })

  describe("evaluateTrackAtTime", () => {
    it("evaluates enabled track", () => {
      const property = createMockProperty("opacity")
      const layer = createAnimationLayer("Layer 1", [property])
      const track: AnimationTrack = {
        id: "track-1",
        targetId: "target-1",
        targetType: "clip",
        layers: [layer],
        enabled: true,
      }

      const context = {
        time: 0.5,
        frame: 15,
        fps: 30,
        comp: { width: 1920, height: 1080, duration: 10, frameDuration: 1 / 30 },
        thisComp: () => null,
        thisLayer: () => null,
        thisProperty: () => null,
      }

      const values = evaluateTrackAtTime(track, 0.5, context)

      expect(values[property.path]).toBe(50)
    })

    it("returns empty object for disabled track", () => {
      const track: AnimationTrack = {
        id: "track-1",
        targetId: "target-1",
        targetType: "clip",
        layers: [],
        enabled: false,
      }

      const values = evaluateTrackAtTime(track, 0.5, {})

      expect(values).toEqual({})
    })

    it("respects solo layers", () => {
      const property1 = createMockProperty("prop1")
      const property2 = createMockProperty("prop2")

      const layer1: AnimationLayer = {
        ...createAnimationLayer("Layer 1", [property1]),
        solo: true,
      }
      const layer2 = createAnimationLayer("Layer 2", [property2])

      const track: AnimationTrack = {
        id: "track-1",
        targetId: "target-1",
        targetType: "clip",
        layers: [layer1, layer2],
        enabled: true,
      }

      const context = {
        time: 0.5,
        frame: 15,
        fps: 30,
        comp: { width: 1920, height: 1080, duration: 10, frameDuration: 1 / 30 },
        thisComp: () => null,
        thisLayer: () => null,
        thisProperty: () => null,
      }

      const values = evaluateTrackAtTime(track, 0.5, context)

      expect(values[property1.path]).toBeDefined()
      expect(values[property2.path]).toBeUndefined()
    })
  })

  describe("setLayerParent", () => {
    it("sets parent-child relationship", () => {
      const layer1 = createAnimationLayer("Parent")
      const layer2 = createAnimationLayer("Child")

      const layers = setLayerParent([layer1, layer2], layer2.id, layer1.id)

      const child = layers.find((l) => l.id === layer2.id)
      const parent = layers.find((l) => l.id === layer1.id)

      expect(child?.parentId).toBe(layer1.id)
      expect(parent?.childIds).toContain(layer2.id)
    })

    it("removes parent relationship", () => {
      const layer1 = createAnimationLayer("Parent")
      const layer2: AnimationLayer = {
        ...createAnimationLayer("Child"),
        parentId: layer1.id,
      }

      const layers = setLayerParent([layer1, layer2], layer2.id, undefined)

      const child = layers.find((l) => l.id === layer2.id)
      expect(child?.parentId).toBeUndefined()
    })
  })

  describe("getLayerHierarchy", () => {
    it("returns root layers", () => {
      const layer1 = createAnimationLayer("Root 1")
      const layer2 = createAnimationLayer("Root 2")
      const layer3: AnimationLayer = {
        ...createAnimationLayer("Child"),
        parentId: layer1.id,
      }

      const rootLayers = getLayerHierarchy([layer1, layer2, layer3])

      expect(rootLayers).toHaveLength(2)
      expect(rootLayers).toContain(layer1)
      expect(rootLayers).toContain(layer2)
    })
  })

  describe("duplicateLayer", () => {
    it("creates copy with new id", () => {
      const original = createAnimationLayer("Original", [createMockProperty()])
      const duplicate = duplicateLayer(original)

      expect(duplicate.id).not.toBe(original.id)
      expect(duplicate.name).toBe("Original Copy")
      expect(duplicate.properties).toHaveLength(1)
      expect(duplicate.properties[0].id).not.toBe(original.properties[0].id)
    })

    it("clears parent-child relationships", () => {
      const original: AnimationLayer = {
        ...createAnimationLayer("Original"),
        parentId: "parent-id",
        childIds: ["child-1", "child-2"],
      }

      const duplicate = duplicateLayer(original)

      expect(duplicate.parentId).toBeUndefined()
      expect(duplicate.childIds).toEqual([])
    })
  })

  describe("mergeLayers", () => {
    it("merges multiple layers", () => {
      const layer1 = createAnimationLayer("Layer 1", [createMockProperty("prop1")])
      const layer2 = createAnimationLayer("Layer 2", [createMockProperty("prop2")])

      const merged = mergeLayers([layer1, layer2])

      expect(merged.name).toBe("Merged Layer")
      expect(merged.properties).toHaveLength(2)
    })

    it("merges properties with same path", () => {
      const prop1 = createMockProperty("opacity")
      const prop2: AnimatedProperty = {
        ...createMockProperty("opacity"),
        keyframes: [createKeyframe(2, 200)],
      }

      const layer1 = createAnimationLayer("Layer 1", [prop1])
      const layer2 = createAnimationLayer("Layer 2", [prop2])

      const merged = mergeLayers([layer1, layer2])

      expect(merged.properties).toHaveLength(1)
      expect(merged.properties[0].keyframes.length).toBeGreaterThan(2)
    })
  })

  describe("createAnimationState", () => {
    it("creates initial animation state", () => {
      const state = createAnimationState()

      expect(state.tracks).toEqual([])
      expect(state.currentTime).toBe(0)
      expect(state.playing).toBe(false)
      expect(state.loop).toBe(false)
      expect(state.selectedKeyframes).toEqual([])
      expect(state.selectedProperties).toEqual([])
      expect(state.selectedLayers).toEqual([])
      expect(state.timelineZoom).toBe(1)
      expect(state.showCurves).toBe(true)
      expect(state.snapToFrames).toBe(true)
      expect(state.previewQuality).toBe("full")
      expect(state.realtimePlayback).toBe(true)
    })
  })

  describe("exportLayer", () => {
    it("exports layer as JSON string", () => {
      const layer = createAnimationLayer("Test Layer", [createMockProperty()])
      const json = exportLayer(layer)

      expect(typeof json).toBe("string")
      expect(() => JSON.parse(json)).not.toThrow()
    })

    it("exported JSON contains all layer data", () => {
      const layer = createAnimationLayer("Test Layer", [createMockProperty()])
      const json = exportLayer(layer)
      const parsed = JSON.parse(json)

      expect(parsed.name).toBe("Test Layer")
      expect(parsed.properties).toHaveLength(1)
    })
  })

  describe("importLayer", () => {
    it("imports layer from valid JSON", () => {
      const original = createAnimationLayer("Test Layer", [createMockProperty()])
      const json = exportLayer(original)

      const imported = importLayer(json)

      expect(imported).toBeDefined()
      expect(imported?.name).toBe("Test Layer")
      expect(imported?.properties).toHaveLength(1)
    })

    it("generates new IDs for imported layer", () => {
      const original = createAnimationLayer("Test Layer", [createMockProperty()])
      const json = exportLayer(original)

      const imported = importLayer(json)

      expect(imported?.id).not.toBe(original.id)
      expect(imported?.properties[0].id).not.toBe(original.properties[0].id)
    })

    it("returns null for invalid JSON", () => {
      const imported = importLayer("invalid json")
      expect(imported).toBeNull()
    })

    it("returns null for JSON without required fields", () => {
      const imported = importLayer(JSON.stringify({ id: "test" }))
      expect(imported).toBeNull()
    })
  })
})

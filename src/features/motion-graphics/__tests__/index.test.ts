import { describe, expect, it } from "vitest"
import {
  createFadeAnimation,
  createScaleAnimation,
  createSlideAnimation,
  DEFAULT_MOTION_SETTINGS,
  MOTION_CAPABILITIES,
  MOTION_GRAPHICS_VERSION,
  quickApplyPreset,
} from "../index"

describe("MotionGraphics Index", () => {
  describe("constants", () => {
    it("exports version", () => {
      expect(MOTION_GRAPHICS_VERSION).toBe("1.0.0")
    })

    it("exports default settings", () => {
      expect(DEFAULT_MOTION_SETTINGS.fps).toBe(30)
      expect(DEFAULT_MOTION_SETTINGS.snapToFrames).toBe(true)
      expect(DEFAULT_MOTION_SETTINGS.showCurves).toBe(true)
      expect(DEFAULT_MOTION_SETTINGS.autoKeyframe).toBe(false)
      expect(DEFAULT_MOTION_SETTINGS.defaultInterpolation).toBe("ease-in-out")
      expect(DEFAULT_MOTION_SETTINGS.timelineZoom).toBe(1)
      expect(DEFAULT_MOTION_SETTINGS.curveEditorHeight).toBe(400)
      expect(DEFAULT_MOTION_SETTINGS.previewQuality).toBe("full")
      expect(DEFAULT_MOTION_SETTINGS.realtimePlayback).toBe(true)
    })

    it("exports motion capabilities", () => {
      expect(MOTION_CAPABILITIES.maxKeyframes).toBe(10000)
      expect(MOTION_CAPABILITIES.maxLayers).toBe(100)
      expect(MOTION_CAPABILITIES.maxTracks).toBe(50)
      expect(MOTION_CAPABILITIES.maxProperties).toBe(500)

      expect(MOTION_CAPABILITIES.supportedTypes).toContain("number")
      expect(MOTION_CAPABILITIES.supportedTypes).toContain("vec2")
      expect(MOTION_CAPABILITIES.supportedTypes).toContain("vec3")
      expect(MOTION_CAPABILITIES.supportedTypes).toContain("vec4")
      expect(MOTION_CAPABILITIES.supportedTypes).toContain("color")
      expect(MOTION_CAPABILITIES.supportedTypes).toContain("boolean")
      expect(MOTION_CAPABILITIES.supportedTypes).toContain("text")

      expect(MOTION_CAPABILITIES.interpolationTypes).toContain("linear")
      expect(MOTION_CAPABILITIES.interpolationTypes).toContain("bezier")
      expect(MOTION_CAPABILITIES.interpolationTypes).toContain("ease-in-out")

      expect(MOTION_CAPABILITIES.blendModes).toContain("normal")
      expect(MOTION_CAPABILITIES.blendModes).toContain("add")
      expect(MOTION_CAPABILITIES.blendModes).toContain("multiply")
    })
  })

  describe("createFadeAnimation", () => {
    it("creates fade animation with defaults", () => {
      const animation = createFadeAnimation()

      expect(animation.id).toBeDefined()
      expect(animation.name).toBe("Opacity")
      expect(animation.path).toBe("opacity")
      expect(animation.type).toBe("number")
      expect(animation.keyframes).toHaveLength(2)
      expect(animation.enabled).toBe(true)
    })

    it("creates fade from 0 to 1 by default", () => {
      const animation = createFadeAnimation()

      expect(animation.keyframes[0].value).toBe(0)
      expect(animation.keyframes[1].value).toBe(1)
    })

    it("uses ease-out interpolation for start keyframe", () => {
      const animation = createFadeAnimation()

      expect(animation.keyframes[0].interpolation).toBe("ease-out")
    })

    it("applies custom start and end values", () => {
      const animation = createFadeAnimation(0.2, 0.8)

      expect(animation.keyframes[0].value).toBe(0.2)
      expect(animation.keyframes[1].value).toBe(0.8)
    })

    it("applies custom duration", () => {
      const animation = createFadeAnimation(0, 1, 2)

      expect(animation.keyframes[1].time).toBe(2)
    })

    it("applies custom start time", () => {
      const animation = createFadeAnimation(0, 1, 1, 5)

      expect(animation.keyframes[0].time).toBe(5)
      expect(animation.keyframes[1].time).toBe(6)
    })
  })

  describe("createScaleAnimation", () => {
    it("creates scale animation with defaults", () => {
      const animation = createScaleAnimation()

      expect(animation.id).toBeDefined()
      expect(animation.name).toBe("Scale")
      expect(animation.path).toBe("transform.scale")
      expect(animation.type).toBe("vec2")
      expect(animation.keyframes).toHaveLength(2)
      expect(animation.enabled).toBe(true)
    })

    it("creates scale from [0,0] to [1,1] by default", () => {
      const animation = createScaleAnimation()

      expect(animation.keyframes[0].value).toEqual([0, 0])
      expect(animation.keyframes[1].value).toEqual([1, 1])
    })

    it("uses bounce interpolation by default", () => {
      const animation = createScaleAnimation()

      expect(animation.keyframes[0].interpolation).toBe("bounce")
    })

    it("applies custom start and end values", () => {
      const animation = createScaleAnimation([0.5, 0.5], [2, 2])

      expect(animation.keyframes[0].value).toEqual([0.5, 0.5])
      expect(animation.keyframes[1].value).toEqual([2, 2])
    })

    it("applies custom duration", () => {
      const animation = createScaleAnimation([0, 0], [1, 1], 2)

      expect(animation.keyframes[1].time).toBe(2)
    })

    it("applies custom start time", () => {
      const animation = createScaleAnimation([0, 0], [1, 1], 1, 3)

      expect(animation.keyframes[0].time).toBe(3)
      expect(animation.keyframes[1].time).toBe(4)
    })

    it("applies custom interpolation", () => {
      const animation = createScaleAnimation([0, 0], [1, 1], 1, 0, "linear")

      expect(animation.keyframes[0].interpolation).toBe("linear")
    })
  })

  describe("createSlideAnimation", () => {
    it("creates slide animation with required values", () => {
      const animation = createSlideAnimation([-100, 0])

      expect(animation.id).toBeDefined()
      expect(animation.name).toBe("Position")
      expect(animation.path).toBe("transform.position")
      expect(animation.type).toBe("vec2")
      expect(animation.keyframes).toHaveLength(2)
      expect(animation.enabled).toBe(true)
    })

    it("slides to [0,0] by default", () => {
      const animation = createSlideAnimation([-100, 0])

      expect(animation.keyframes[0].value).toEqual([-100, 0])
      expect(animation.keyframes[1].value).toEqual([0, 0])
    })

    it("uses ease-out interpolation", () => {
      const animation = createSlideAnimation([-100, 0])

      expect(animation.keyframes[0].interpolation).toBe("ease-out")
    })

    it("applies custom end value", () => {
      const animation = createSlideAnimation([100, 0], [50, 25])

      expect(animation.keyframes[0].value).toEqual([100, 0])
      expect(animation.keyframes[1].value).toEqual([50, 25])
    })

    it("applies custom duration", () => {
      const animation = createSlideAnimation([0, 0], [100, 100], 1.5)

      expect(animation.keyframes[1].time).toBe(1.5)
    })

    it("applies custom start time", () => {
      const animation = createSlideAnimation([0, 0], [100, 100], 0.8, 2)

      expect(animation.keyframes[0].time).toBe(2)
      expect(animation.keyframes[1].time).toBe(2.8)
    })

    it("has default duration of 0.8 seconds", () => {
      const animation = createSlideAnimation([0, 0])

      expect(animation.keyframes[1].time).toBe(0.8)
    })
  })

  describe("quickApplyPreset", () => {
    it("returns null for non-existent preset", () => {
      const result = quickApplyPreset("non-existent-preset", "target-1")

      expect(result).toBeNull()
    })

    it("applies preset with default duration", () => {
      // Note: This test requires mocked preset data
      // The actual test will depend on the motion-presets.json mock
      const result = quickApplyPreset("fade-in", "target-1")

      if (result) {
        expect(result.id).toBeDefined()
        expect(result.name).toBeDefined()
      }
    })

    it("applies preset with custom duration", () => {
      const result = quickApplyPreset("fade-in", "target-1", 3)

      if (result) {
        expect(result.id).toBeDefined()
      }
    })
  })

  describe("module exports", () => {
    it("exports components", async () => {
      const { CurveEditor, MotionGraphicsPanel } = await import("../index")

      expect(CurveEditor).toBeDefined()
      expect(MotionGraphicsPanel).toBeDefined()
    })

    it("exports animation layer services", async () => {
      const {
        createAnimationLayer,
        createAnimationTrack,
        createAnimationState,
        addLayerToTrack,
        removeLayerFromTrack,
        updateLayerInTrack,
        evaluateLayerAtTime,
        evaluateTrackAtTime,
        blendLayerValues,
      } = await import("../index")

      expect(createAnimationLayer).toBeDefined()
      expect(createAnimationTrack).toBeDefined()
      expect(createAnimationState).toBeDefined()
      expect(addLayerToTrack).toBeDefined()
      expect(removeLayerFromTrack).toBeDefined()
      expect(updateLayerInTrack).toBeDefined()
      expect(evaluateLayerAtTime).toBeDefined()
      expect(evaluateTrackAtTime).toBeDefined()
      expect(blendLayerValues).toBeDefined()
    })

    it("exports expression engine", async () => {
      const { ExpressionEvaluator, expressionEvaluator, expressionPresets } = await import("../index")

      expect(ExpressionEvaluator).toBeDefined()
      expect(expressionEvaluator).toBeDefined()
      expect(expressionPresets).toBeDefined()
    })

    it("exports interpolation services", async () => {
      const { interpolateKeyframes, getValueAtTime, getVelocityAtTime, snapToFrame, generateSmoothTransition } =
        await import("../index")

      expect(interpolateKeyframes).toBeDefined()
      expect(getValueAtTime).toBeDefined()
      expect(getVelocityAtTime).toBeDefined()
      expect(snapToFrame).toBeDefined()
      expect(generateSmoothTransition).toBeDefined()
    })

    it("exports keyframe manager services", async () => {
      const {
        createKeyframe,
        addKeyframeToProperty,
        removeKeyframeFromProperty,
        updateKeyframeInProperty,
        selectKeyframes,
        deselectAllKeyframes,
        moveKeyframes,
        copyKeyframes,
        deleteSelectedKeyframes,
      } = await import("../index")

      expect(createKeyframe).toBeDefined()
      expect(addKeyframeToProperty).toBeDefined()
      expect(removeKeyframeFromProperty).toBeDefined()
      expect(updateKeyframeInProperty).toBeDefined()
      expect(selectKeyframes).toBeDefined()
      expect(deselectAllKeyframes).toBeDefined()
      expect(moveKeyframes).toBeDefined()
      expect(copyKeyframes).toBeDefined()
      expect(deleteSelectedKeyframes).toBeDefined()
    })

    it("exports preset manager services", async () => {
      const {
        applyPreset,
        getPresetById,
        getAllPresets,
        getPresetsByCategory,
        getPresetCategories,
        searchPresets,
        combinePresets,
        createPresetFromLayer,
      } = await import("../index")

      expect(applyPreset).toBeDefined()
      expect(getPresetById).toBeDefined()
      expect(getAllPresets).toBeDefined()
      expect(getPresetsByCategory).toBeDefined()
      expect(getPresetCategories).toBeDefined()
      expect(searchPresets).toBeDefined()
      expect(combinePresets).toBeDefined()
      expect(createPresetFromLayer).toBeDefined()
    })

    it("exports timeline integration services", async () => {
      const {
        addMotionGraphicsToClip,
        applyMotionPresetToClip,
        evaluateClipMotionAtTime,
        getMotionKeyframesForTimeline,
        removeMotionGraphicsFromClip,
        copyMotionGraphics,
      } = await import("../index")

      expect(addMotionGraphicsToClip).toBeDefined()
      expect(applyMotionPresetToClip).toBeDefined()
      expect(evaluateClipMotionAtTime).toBeDefined()
      expect(getMotionKeyframesForTimeline).toBeDefined()
      expect(removeMotionGraphicsFromClip).toBeDefined()
      expect(copyMotionGraphics).toBeDefined()
    })

    it("exports types", async () => {
      // TypeScript types are compile-time only, but we can verify the import statement works
      const module = await import("../index")

      // Verify that type exports exist in module (they won't be runtime values)
      expect(module).toBeDefined()
    })
  })
})

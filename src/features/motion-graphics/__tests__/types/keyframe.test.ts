import { describe, expect, it } from "vitest"
import type {
  AnimatedProperty,
  AnimationCurve,
  AnimationLayer,
  AnimationState,
  AnimationTrack,
  BezierHandle,
  EasingFunction,
  ExpressionContext,
  InterpolationOptions,
  InterpolationType,
  Keyframe,
  KeyframeValue,
  MotionPreset,
  PropertyDescriptor,
} from "../../types/keyframe"

describe("Keyframe Types", () => {
  describe("InterpolationType", () => {
    it("accepts valid interpolation types", () => {
      const types: InterpolationType[] = [
        "linear",
        "bezier",
        "hold",
        "ease",
        "ease-in",
        "ease-out",
        "ease-in-out",
        "bounce",
        "elastic",
        "back",
        "expo",
      ]

      expect(types.length).toBe(11)
      expect(types).toContain("linear")
      expect(types).toContain("bezier")
    })
  })

  describe("KeyframeValue", () => {
    it("supports number values", () => {
      const value: KeyframeValue = 42
      expect(typeof value).toBe("number")
    })

    it("supports vec2 values", () => {
      const value: KeyframeValue = [10, 20]
      expect(Array.isArray(value)).toBe(true)
      expect(value.length).toBe(2)
    })

    it("supports vec3 values", () => {
      const value: KeyframeValue = [10, 20, 30]
      expect(Array.isArray(value)).toBe(true)
      expect(value.length).toBe(3)
    })

    it("supports vec4 values", () => {
      const value: KeyframeValue = [10, 20, 30, 40]
      expect(Array.isArray(value)).toBe(true)
      expect(value.length).toBe(4)
    })

    it("supports string values", () => {
      const value: KeyframeValue = "#ff0000"
      expect(typeof value).toBe("string")
    })

    it("supports boolean values", () => {
      const value: KeyframeValue = true
      expect(typeof value).toBe("boolean")
    })
  })

  describe("Keyframe", () => {
    it("creates valid keyframe object", () => {
      const keyframe: Keyframe = {
        id: "kf-1",
        time: 1.5,
        value: 100,
        interpolation: "linear",
      }

      expect(keyframe.id).toBe("kf-1")
      expect(keyframe.time).toBe(1.5)
      expect(keyframe.value).toBe(100)
      expect(keyframe.interpolation).toBe("linear")
    })

    it("supports bezier control points", () => {
      const keyframe: Keyframe = {
        id: "kf-2",
        time: 2,
        value: 50,
        interpolation: "bezier",
        easeIn: [0.42, 0],
        easeOut: [0.58, 1],
      }

      expect(keyframe.easeIn).toEqual([0.42, 0])
      expect(keyframe.easeOut).toEqual([0.58, 1])
    })

    it("supports temporal ease", () => {
      const keyframe: Keyframe = {
        id: "kf-3",
        time: 3,
        value: 75,
        interpolation: "ease-in-out",
        temporalEaseIn: 0.5,
        temporalEaseOut: 0.7,
      }

      expect(keyframe.temporalEaseIn).toBe(0.5)
      expect(keyframe.temporalEaseOut).toBe(0.7)
    })

    it("supports additional properties", () => {
      const keyframe: Keyframe = {
        id: "kf-4",
        time: 4,
        value: 200,
        interpolation: "linear",
        locked: true,
        selected: false,
        label: "Important Frame",
      }

      expect(keyframe.locked).toBe(true)
      expect(keyframe.selected).toBe(false)
      expect(keyframe.label).toBe("Important Frame")
    })
  })

  describe("AnimatedProperty", () => {
    it("creates valid property object", () => {
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Opacity",
        path: "effects.opacity",
        type: "number",
        keyframes: [],
        enabled: true,
      }

      expect(property.id).toBe("prop-1")
      expect(property.name).toBe("Opacity")
      expect(property.path).toBe("effects.opacity")
      expect(property.type).toBe("number")
    })

    it("supports property constraints", () => {
      const property: AnimatedProperty = {
        id: "prop-2",
        name: "Scale",
        path: "transform.scale",
        type: "number",
        keyframes: [],
        enabled: true,
        min: 0,
        max: 200,
        step: 1,
      }

      expect(property.min).toBe(0)
      expect(property.max).toBe(200)
      expect(property.step).toBe(1)
    })

    it("supports expressions", () => {
      const property: AnimatedProperty = {
        id: "prop-3",
        name: "Position",
        path: "transform.position",
        type: "vec2",
        keyframes: [],
        enabled: true,
        expression: "value + wiggle(2, 50)",
        expressionEnabled: true,
      }

      expect(property.expression).toBe("value + wiggle(2, 50)")
      expect(property.expressionEnabled).toBe(true)
    })
  })

  describe("AnimationLayer", () => {
    it("creates valid layer object", () => {
      const layer: AnimationLayer = {
        id: "layer-1",
        name: "Main Layer",
        properties: [],
        enabled: true,
        solo: false,
        locked: false,
        opacity: 1,
        blendMode: "normal",
      }

      expect(layer.id).toBe("layer-1")
      expect(layer.name).toBe("Main Layer")
      expect(layer.blendMode).toBe("normal")
    })

    it("supports timing properties", () => {
      const layer: AnimationLayer = {
        id: "layer-2",
        name: "Timed Layer",
        properties: [],
        enabled: true,
        solo: false,
        locked: false,
        opacity: 0.8,
        blendMode: "add",
        startTime: 0,
        endTime: 10,
        offset: 2,
        timeScale: 1.5,
      }

      expect(layer.startTime).toBe(0)
      expect(layer.endTime).toBe(10)
      expect(layer.offset).toBe(2)
      expect(layer.timeScale).toBe(1.5)
    })

    it("supports parent-child relationships", () => {
      const layer: AnimationLayer = {
        id: "layer-3",
        name: "Child Layer",
        properties: [],
        enabled: true,
        solo: false,
        locked: false,
        opacity: 1,
        blendMode: "normal",
        parentId: "layer-1",
        childIds: ["layer-4", "layer-5"],
      }

      expect(layer.parentId).toBe("layer-1")
      expect(layer.childIds).toEqual(["layer-4", "layer-5"])
    })
  })

  describe("AnimationTrack", () => {
    it("creates valid track object", () => {
      const track: AnimationTrack = {
        id: "track-1",
        targetId: "clip-1",
        targetType: "clip",
        layers: [],
        enabled: true,
      }

      expect(track.id).toBe("track-1")
      expect(track.targetId).toBe("clip-1")
      expect(track.targetType).toBe("clip")
    })

    it("supports different target types", () => {
      const types: Array<AnimationTrack["targetType"]> = ["clip", "effect", "text", "shape", "camera"]

      types.forEach((type) => {
        const track: AnimationTrack = {
          id: `track-${type}`,
          targetId: `${type}-1`,
          targetType: type,
          layers: [],
          enabled: true,
        }

        expect(track.targetType).toBe(type)
      })
    })

    it("supports track settings", () => {
      const track: AnimationTrack = {
        id: "track-2",
        targetId: "clip-2",
        targetType: "clip",
        layers: [],
        enabled: false,
        muted: true,
        locked: true,
        color: "#ff0000",
      }

      expect(track.muted).toBe(true)
      expect(track.locked).toBe(true)
      expect(track.color).toBe("#ff0000")
    })
  })

  describe("BezierHandle", () => {
    it("creates valid bezier handle", () => {
      const handle: BezierHandle = {
        x: 0.5,
        y: 0.5,
        linked: true,
      }

      expect(handle.x).toBe(0.5)
      expect(handle.y).toBe(0.5)
      expect(handle.linked).toBe(true)
    })
  })

  describe("AnimationCurve", () => {
    it("creates valid animation curve", () => {
      const curve: AnimationCurve = {
        propertyId: "prop-1",
        keyframes: [],
        preInfinity: "constant",
        postInfinity: "constant",
        visible: true,
        color: "#3b82f6",
        selected: false,
      }

      expect(curve.propertyId).toBe("prop-1")
      expect(curve.preInfinity).toBe("constant")
      expect(curve.postInfinity).toBe("constant")
    })

    it("supports different infinity modes", () => {
      const modes: Array<AnimationCurve["preInfinity"]> = ["constant", "linear", "cycle", "cycle-offset", "oscillate"]

      modes.forEach((mode) => {
        const curve: AnimationCurve = {
          propertyId: "prop-1",
          keyframes: [],
          preInfinity: mode,
          postInfinity: mode,
          visible: true,
          color: "#000000",
          selected: false,
        }

        expect(curve.preInfinity).toBe(mode)
        expect(curve.postInfinity).toBe(mode)
      })
    })
  })

  describe("EasingFunction", () => {
    it("creates valid easing function", () => {
      const easing: EasingFunction = {
        name: "ease-in-out",
        type: "ease-in-out",
        controlPoints: [0.42, 0, 0.58, 1],
      }

      expect(easing.name).toBe("ease-in-out")
      expect(easing.type).toBe("ease-in-out")
      expect(easing.controlPoints).toEqual([0.42, 0, 0.58, 1])
    })

    it("supports parametric easing", () => {
      const easing: EasingFunction = {
        name: "elastic",
        type: "elastic",
        params: {
          amplitude: 1,
          period: 0.3,
        },
      }

      expect(easing.params).toEqual({ amplitude: 1, period: 0.3 })
    })
  })

  describe("MotionPreset", () => {
    it("creates valid motion preset", () => {
      const preset: MotionPreset = {
        id: "preset-1",
        name: "Fade In",
        description: "Smooth fade in animation",
        category: "transitions",
        tags: ["fade", "transition"],
        duration: 1,
        properties: [],
        scalable: true,
        customizable: true,
      }

      expect(preset.id).toBe("preset-1")
      expect(preset.name).toBe("Fade In")
      expect(preset.category).toBe("transitions")
      expect(preset.scalable).toBe(true)
    })

    it("supports preview data", () => {
      const preset: MotionPreset = {
        id: "preset-2",
        name: "Scale Up",
        description: "Scale animation",
        category: "scale",
        tags: ["scale"],
        duration: 1,
        properties: [],
        scalable: true,
        customizable: true,
        preview: {
          before: 0,
          after: 100,
        },
      }

      expect(preset.preview).toEqual({ before: 0, after: 100 })
    })
  })

  describe("ExpressionContext", () => {
    it("creates valid expression context", () => {
      const context: ExpressionContext = {
        time: 1.5,
        frame: 45,
        fps: 30,
        layer: {
          id: "layer-1",
          name: "Layer",
          properties: [],
          enabled: true,
          solo: false,
          locked: false,
          opacity: 1,
          blendMode: "normal",
        },
        property: {
          id: "prop-1",
          name: "Property",
          path: "test",
          type: "number",
          keyframes: [],
          enabled: true,
        },
        value: 50,
        comp: {
          width: 1920,
          height: 1080,
          duration: 10,
          frameDuration: 1 / 30,
        },
        thisComp: () => null,
        thisLayer: () => null,
        thisProperty: () => null,
      }

      expect(context.time).toBe(1.5)
      expect(context.frame).toBe(45)
      expect(context.fps).toBe(30)
    })
  })

  describe("AnimationState", () => {
    it("creates valid animation state", () => {
      const state: AnimationState = {
        tracks: [],
        currentTime: 0,
        playing: false,
        loop: false,
        selectedKeyframes: [],
        selectedProperties: [],
        selectedLayers: [],
        timelineZoom: 1,
        timelineScroll: 0,
        showCurves: false,
        snapToFrames: true,
        previewQuality: "full",
        realtimePlayback: true,
      }

      expect(state.currentTime).toBe(0)
      expect(state.playing).toBe(false)
      expect(state.previewQuality).toBe("full")
    })

    it("supports different preview qualities", () => {
      const qualities: Array<AnimationState["previewQuality"]> = ["full", "half", "quarter"]

      qualities.forEach((quality) => {
        const state: AnimationState = {
          tracks: [],
          currentTime: 0,
          playing: false,
          loop: false,
          selectedKeyframes: [],
          selectedProperties: [],
          selectedLayers: [],
          timelineZoom: 1,
          timelineScroll: 0,
          showCurves: false,
          snapToFrames: true,
          previewQuality: quality,
          realtimePlayback: true,
        }

        expect(state.previewQuality).toBe(quality)
      })
    })
  })

  describe("InterpolationOptions", () => {
    it("creates valid interpolation options", () => {
      const options: InterpolationOptions = {
        type: "bezier",
        tension: 0.5,
        bias: 0,
        continuity: 0,
      }

      expect(options.type).toBe("bezier")
      expect(options.tension).toBe(0.5)
    })

    it("supports elastic easing parameters", () => {
      const options: InterpolationOptions = {
        type: "elastic",
        amplitude: 1,
        period: 0.3,
      }

      expect(options.amplitude).toBe(1)
      expect(options.period).toBe(0.3)
    })

    it("supports back easing parameters", () => {
      const options: InterpolationOptions = {
        type: "back",
        overshoot: 1.70158,
      }

      expect(options.overshoot).toBe(1.70158)
    })
  })

  describe("PropertyDescriptor", () => {
    it("creates valid property descriptor", () => {
      const descriptor: PropertyDescriptor = {
        path: "transform.position",
        name: "Position",
        type: "vec2",
        defaultValue: [0, 0],
        animatable: true,
      }

      expect(descriptor.path).toBe("transform.position")
      expect(descriptor.name).toBe("Position")
      expect(descriptor.type).toBe("vec2")
      expect(descriptor.animatable).toBe(true)
    })

    it("supports property metadata", () => {
      const descriptor: PropertyDescriptor = {
        path: "effects.blur.amount",
        name: "Blur Amount",
        type: "number",
        defaultValue: 0,
        animatable: true,
        min: 0,
        max: 100,
        step: 1,
        units: "px",
        group: "blur",
      }

      expect(descriptor.units).toBe("px")
      expect(descriptor.group).toBe("blur")
    })
  })
})

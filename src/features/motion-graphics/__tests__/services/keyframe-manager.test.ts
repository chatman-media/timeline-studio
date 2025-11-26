import { describe, expect, it } from "vitest"
import type { AnimatedProperty, InterpolationType, Keyframe } from "../../types/keyframe"
import {
  addKeyframeToProperty,
  autoKeyframe,
  copyKeyframes,
  createAnimationCurve,
  createEasingKeyframes,
  createKeyframe,
  deleteSelectedKeyframes,
  deselectAllKeyframes,
  findKeyframeAtTime,
  getKeyframesInRange,
  mergeOverlappingKeyframes,
  moveKeyframes,
  offsetKeyframesToTime,
  removeKeyframeFromProperty,
  reverseKeyframes,
  scaleKeyframesTime,
  scaleKeyframesToDuration,
  selectKeyframes,
  snapKeyframeToGrid,
  updateKeyframeInProperty,
  validatePropertyKeyframes,
} from "../../services/keyframe-manager"

describe("KeyframeManager", () => {
  describe("createKeyframe", () => {
    it("creates a keyframe with basic properties", () => {
      const keyframe = createKeyframe(1.5, 100, "linear")

      expect(keyframe.id).toBeDefined()
      expect(keyframe.time).toBe(1.5)
      expect(keyframe.value).toBe(100)
      expect(keyframe.interpolation).toBe("linear")
      expect(keyframe.locked).toBe(false)
      expect(keyframe.selected).toBe(false)
    })

    it("creates keyframe with default linear interpolation", () => {
      const keyframe = createKeyframe(0, 0)
      expect(keyframe.interpolation).toBe("linear")
    })

    it("creates keyframe with vector value", () => {
      const keyframe = createKeyframe<[number, number]>(2, [100, 200], "ease-out")

      expect(keyframe.value).toEqual([100, 200])
      expect(keyframe.interpolation).toBe("ease-out")
    })
  })

  describe("addKeyframeToProperty", () => {
    const mockProperty: AnimatedProperty = {
      id: "prop-1",
      name: "Opacity",
      path: "opacity",
      type: "number",
      keyframes: [
        createKeyframe(0, 0),
        createKeyframe(2, 100),
      ],
      enabled: true,
    }

    it("adds keyframe at new time", () => {
      const newKeyframe = createKeyframe(1, 50)
      const updated = addKeyframeToProperty(mockProperty, newKeyframe)

      expect(updated.keyframes).toHaveLength(3)
      expect(updated.keyframes[1].time).toBe(1)
      expect(updated.keyframes[1].value).toBe(50)
    })

    it("replaces keyframe at existing time", () => {
      const newKeyframe = createKeyframe(2, 80)
      const updated = addKeyframeToProperty(mockProperty, newKeyframe)

      expect(updated.keyframes).toHaveLength(2)
      expect(updated.keyframes[1].value).toBe(80)
    })

    it("sorts keyframes by time", () => {
      const newKeyframe = createKeyframe(0.5, 25)
      const updated = addKeyframeToProperty(mockProperty, newKeyframe)

      expect(updated.keyframes).toHaveLength(3)
      expect(updated.keyframes[0].time).toBe(0)
      expect(updated.keyframes[1].time).toBe(0.5)
      expect(updated.keyframes[2].time).toBe(2)
    })
  })

  describe("removeKeyframeFromProperty", () => {
    it("removes keyframe by id", () => {
      const keyframes = [
        createKeyframe(0, 0),
        createKeyframe(1, 50),
        createKeyframe(2, 100),
      ]
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Test",
        path: "test",
        type: "number",
        keyframes,
        enabled: true,
      }

      const updated = removeKeyframeFromProperty(property, keyframes[1].id)

      expect(updated.keyframes).toHaveLength(2)
      expect(updated.keyframes.find((kf) => kf.id === keyframes[1].id)).toBeUndefined()
    })

    it("returns property unchanged if keyframe not found", () => {
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Test",
        path: "test",
        type: "number",
        keyframes: [createKeyframe(0, 0)],
        enabled: true,
      }

      const updated = removeKeyframeFromProperty(property, "non-existent-id")

      expect(updated.keyframes).toHaveLength(1)
    })
  })

  describe("updateKeyframeInProperty", () => {
    it("updates keyframe value", () => {
      const keyframes = [createKeyframe(0, 0), createKeyframe(1, 50)]
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Test",
        path: "test",
        type: "number",
        keyframes,
        enabled: true,
      }

      const updated = updateKeyframeInProperty(property, keyframes[1].id, { value: 75 })

      expect(updated.keyframes[1].value).toBe(75)
    })

    it("updates keyframe interpolation", () => {
      const keyframes = [createKeyframe(0, 0)]
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Test",
        path: "test",
        type: "number",
        keyframes,
        enabled: true,
      }

      const updated = updateKeyframeInProperty(property, keyframes[0].id, { interpolation: "bounce" })

      expect(updated.keyframes[0].interpolation).toBe("bounce")
    })

    it("re-sorts keyframes when time is updated", () => {
      const keyframes = [
        createKeyframe(0, 0),
        createKeyframe(1, 50),
        createKeyframe(2, 100),
      ]
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Test",
        path: "test",
        type: "number",
        keyframes,
        enabled: true,
      }

      const updated = updateKeyframeInProperty(property, keyframes[2].id, { time: 0.5 })

      expect(updated.keyframes[0].time).toBe(0)
      expect(updated.keyframes[1].time).toBe(0.5)
      expect(updated.keyframes[2].time).toBe(1)
    })
  })

  describe("selectKeyframes", () => {
    it("selects keyframes by id", () => {
      const keyframes = [
        createKeyframe(0, 0),
        createKeyframe(1, 50),
        createKeyframe(2, 100),
      ]
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Test",
        path: "test",
        type: "number",
        keyframes,
        enabled: true,
      }

      const updated = selectKeyframes(property, [keyframes[1].id])

      expect(updated.keyframes[0].selected).toBe(false)
      expect(updated.keyframes[1].selected).toBe(true)
      expect(updated.keyframes[2].selected).toBe(false)
    })

    it("adds to selection when not exclusive", () => {
      const keyframes = [
        { ...createKeyframe(0, 0), selected: true },
        createKeyframe(1, 50),
      ]
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Test",
        path: "test",
        type: "number",
        keyframes,
        enabled: true,
      }

      const updated = selectKeyframes(property, [keyframes[1].id], false)

      expect(updated.keyframes[0].selected).toBe(true)
      expect(updated.keyframes[1].selected).toBe(true)
    })

    it("replaces selection when exclusive", () => {
      const keyframes = [
        { ...createKeyframe(0, 0), selected: true },
        createKeyframe(1, 50),
      ]
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Test",
        path: "test",
        type: "number",
        keyframes,
        enabled: true,
      }

      const updated = selectKeyframes(property, [keyframes[1].id], true)

      expect(updated.keyframes[0].selected).toBe(false)
      expect(updated.keyframes[1].selected).toBe(true)
    })
  })

  describe("deselectAllKeyframes", () => {
    it("deselects all keyframes", () => {
      const keyframes = [
        { ...createKeyframe(0, 0), selected: true },
        { ...createKeyframe(1, 50), selected: true },
      ]
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Test",
        path: "test",
        type: "number",
        keyframes,
        enabled: true,
      }

      const updated = deselectAllKeyframes(property)

      expect(updated.keyframes[0].selected).toBe(false)
      expect(updated.keyframes[1].selected).toBe(false)
    })
  })

  describe("moveKeyframes", () => {
    it("moves keyframes by time offset", () => {
      const keyframes = [
        createKeyframe(1, 50),
        createKeyframe(2, 100),
      ]
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Test",
        path: "test",
        type: "number",
        keyframes,
        enabled: true,
      }

      const updated = moveKeyframes(property, [keyframes[0].id], 0.5)

      expect(updated.keyframes[0].time).toBe(1.5)
      expect(updated.keyframes[1].time).toBe(2)
    })

    it("prevents negative time", () => {
      const keyframes = [createKeyframe(0.5, 50)]
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Test",
        path: "test",
        type: "number",
        keyframes,
        enabled: true,
      }

      const updated = moveKeyframes(property, [keyframes[0].id], -1)

      expect(updated.keyframes[0].time).toBe(0)
    })
  })

  describe("scaleKeyframesTime", () => {
    it("scales keyframes around anchor time", () => {
      const keyframes = [
        createKeyframe(0, 0),
        createKeyframe(1, 50),
        createKeyframe(2, 100),
      ]
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Test",
        path: "test",
        type: "number",
        keyframes,
        enabled: true,
      }

      const updated = scaleKeyframesTime(property, keyframes.map((kf) => kf.id), 2, 0)

      expect(updated.keyframes[0].time).toBe(0)
      expect(updated.keyframes[1].time).toBe(2)
      expect(updated.keyframes[2].time).toBe(4)
    })
  })

  describe("copyKeyframes", () => {
    it("copies keyframes with new ids", () => {
      const original = [createKeyframe(0, 0), createKeyframe(1, 50)]
      const copied = copyKeyframes(original)

      expect(copied).toHaveLength(2)
      expect(copied[0].id).not.toBe(original[0].id)
      expect(copied[0].value).toBe(original[0].value)
      expect(copied[0].time).toBe(original[0].time)
    })

    it("applies time offset", () => {
      const original = [createKeyframe(0, 0), createKeyframe(1, 50)]
      const copied = copyKeyframes(original, 2)

      expect(copied[0].time).toBe(2)
      expect(copied[1].time).toBe(3)
    })

    it("deselects copied keyframes", () => {
      const original = [{ ...createKeyframe(0, 0), selected: true }]
      const copied = copyKeyframes(original)

      expect(copied[0].selected).toBe(false)
    })
  })

  describe("deleteSelectedKeyframes", () => {
    it("removes selected keyframes", () => {
      const keyframes = [
        createKeyframe(0, 0),
        { ...createKeyframe(1, 50), selected: true },
        createKeyframe(2, 100),
      ]
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Test",
        path: "test",
        type: "number",
        keyframes,
        enabled: true,
      }

      const updated = deleteSelectedKeyframes(property)

      expect(updated.keyframes).toHaveLength(2)
      expect(updated.keyframes.find((kf) => kf.time === 1)).toBeUndefined()
    })
  })

  describe("reverseKeyframes", () => {
    it("reverses keyframes within range", () => {
      const keyframes = [
        createKeyframe(0, 0),
        createKeyframe(1, 50),
        createKeyframe(2, 100),
      ]
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Test",
        path: "test",
        type: "number",
        keyframes,
        enabled: true,
      }

      const updated = reverseKeyframes(property)

      expect(updated.keyframes[0].time).toBe(0)
      expect(updated.keyframes[1].time).toBe(1)
      expect(updated.keyframes[2].time).toBe(2)
      // Values should be reversed
      expect(updated.keyframes[0].value).toBe(100)
      expect(updated.keyframes[2].value).toBe(0)
    })
  })

  describe("createAnimationCurve", () => {
    it("creates animation curve from property", () => {
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Opacity",
        path: "opacity",
        type: "number",
        keyframes: [createKeyframe(0, 0)],
        enabled: true,
      }

      const curve = createAnimationCurve(property)

      expect(curve.propertyId).toBe("prop-1")
      expect(curve.keyframes).toBe(property.keyframes)
      expect(curve.preInfinity).toBe("constant")
      expect(curve.postInfinity).toBe("constant")
      expect(curve.visible).toBe(true)
      expect(curve.color).toBe("#3b82f6")
    })
  })

  describe("autoKeyframe", () => {
    it("creates two keyframes for simple transition", () => {
      const keyframes = autoKeyframe(0, 100, 0, 2, "ease-in-out")

      expect(keyframes).toHaveLength(2)
      expect(keyframes[0].time).toBe(0)
      expect(keyframes[0].value).toBe(0)
      expect(keyframes[1].time).toBe(2)
      expect(keyframes[1].value).toBe(100)
    })

    it("creates multiple keyframes for multi-step animation", () => {
      const keyframes = autoKeyframe(0, 100, 0, 2, "ease-in-out", 5)

      expect(keyframes).toHaveLength(5)
      expect(keyframes[0].time).toBe(0)
      expect(keyframes[4].time).toBe(2)
    })

    it("handles vector values", () => {
      const keyframes = autoKeyframe<[number, number]>([0, 0], [100, 100], 0, 1)

      expect(keyframes).toHaveLength(2)
      expect(keyframes[0].value).toEqual([0, 0])
      expect(keyframes[1].value).toEqual([100, 100])
    })
  })

  describe("offsetKeyframesToTime", () => {
    it("offsets keyframes to target start time", () => {
      const keyframes = [
        createKeyframe(1, 0),
        createKeyframe(2, 100),
      ]

      const offset = offsetKeyframesToTime(keyframes, 5)

      expect(offset[0].time).toBe(5)
      expect(offset[1].time).toBe(6)
    })

    it("handles empty array", () => {
      const offset = offsetKeyframesToTime([], 5)
      expect(offset).toEqual([])
    })
  })

  describe("scaleKeyframesToDuration", () => {
    it("scales keyframes to target duration", () => {
      const keyframes = [
        createKeyframe(0, 0),
        createKeyframe(1, 50),
        createKeyframe(2, 100),
      ]

      const scaled = scaleKeyframesToDuration(keyframes, 4, 0)

      expect(scaled[0].time).toBe(0)
      expect(scaled[1].time).toBe(2)
      expect(scaled[2].time).toBe(4)
    })

    it("handles single keyframe", () => {
      const keyframes = [createKeyframe(0, 0)]
      const scaled = scaleKeyframesToDuration(keyframes, 5)

      expect(scaled).toHaveLength(1)
      expect(scaled[0].time).toBe(0)
    })
  })

  describe("findKeyframeAtTime", () => {
    const keyframes = [
      createKeyframe(0, 0),
      createKeyframe(1, 50),
      createKeyframe(2, 100),
    ]

    it("finds keyframe at exact time", () => {
      const found = findKeyframeAtTime(keyframes, 1)
      expect(found?.value).toBe(50)
    })

    it("finds keyframe within tolerance", () => {
      const found = findKeyframeAtTime(keyframes, 1.0005, 0.001)
      expect(found?.value).toBe(50)
    })

    it("returns null when no keyframe found", () => {
      const found = findKeyframeAtTime(keyframes, 1.5)
      expect(found).toBeNull()
    })
  })

  describe("getKeyframesInRange", () => {
    const keyframes = [
      createKeyframe(0, 0),
      createKeyframe(1, 50),
      createKeyframe(2, 100),
      createKeyframe(3, 150),
    ]

    it("returns keyframes in range", () => {
      const inRange = getKeyframesInRange(keyframes, 1, 2)

      expect(inRange).toHaveLength(2)
      expect(inRange[0].time).toBe(1)
      expect(inRange[1].time).toBe(2)
    })

    it("returns empty array when no keyframes in range", () => {
      const inRange = getKeyframesInRange(keyframes, 5, 10)
      expect(inRange).toEqual([])
    })
  })

  describe("snapKeyframeToGrid", () => {
    it("snaps time to grid", () => {
      const snapped = snapKeyframeToGrid(1.23, 1, 30)
      expect(snapped).toBeCloseTo(1.233, 2)
    })

    it("snaps to nearest frame", () => {
      const snapped = snapKeyframeToGrid(1.01, 1, 30)
      expect(snapped).toBeCloseTo(1.0, 2)
    })
  })

  describe("createEasingKeyframes", () => {
    it("creates keyframes with easing", () => {
      const keyframes = createEasingKeyframes(0, 100, 0, 2, "ease-out")

      expect(keyframes).toHaveLength(2)
      expect(keyframes[0].interpolation).toBe("ease-out")
    })

    it("creates multiple keyframes for bounce easing", () => {
      const keyframes = createEasingKeyframes(0, 100, 0, 2, "bounce")

      expect(keyframes.length).toBeGreaterThan(2)
    })

    it("creates multiple keyframes for elastic easing", () => {
      const keyframes = createEasingKeyframes(0, 100, 0, 2, "elastic")

      expect(keyframes.length).toBeGreaterThan(2)
    })
  })

  describe("mergeOverlappingKeyframes", () => {
    it("merges keyframes with same time", () => {
      const keyframes = [
        createKeyframe(0, 0),
        createKeyframe(1, 50),
        createKeyframe(1.0001, 60),
        createKeyframe(2, 100),
      ]

      const merged = mergeOverlappingKeyframes(keyframes)

      expect(merged).toHaveLength(3)
    })

    it("keeps keyframes with different times", () => {
      const keyframes = [
        createKeyframe(0, 0),
        createKeyframe(1, 50),
        createKeyframe(2, 100),
      ]

      const merged = mergeOverlappingKeyframes(keyframes)

      expect(merged).toHaveLength(3)
    })
  })

  describe("validatePropertyKeyframes", () => {
    it("validates correct property", () => {
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Test",
        path: "test",
        type: "number",
        keyframes: [
          createKeyframe(0, 0),
          createKeyframe(1, 50),
        ],
        enabled: true,
      }

      const errors = validatePropertyKeyframes(property)
      expect(errors).toHaveLength(0)
    })

    it("detects unsorted keyframes", () => {
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Test",
        path: "test",
        type: "number",
        keyframes: [
          createKeyframe(1, 50),
          createKeyframe(0, 0),
        ],
        enabled: true,
      }

      const errors = validatePropertyKeyframes(property)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain("sorted")
    })

    it("detects inconsistent value types", () => {
      const property: AnimatedProperty = {
        id: "prop-1",
        name: "Test",
        path: "test",
        type: "number",
        keyframes: [
          createKeyframe(0, 0),
          createKeyframe(1, "string" as any),
        ],
        enabled: true,
      }

      const errors = validatePropertyKeyframes(property)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain("inconsistent")
    })
  })
})

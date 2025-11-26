import { describe, expect, it } from "vitest"
import {
  generateSmoothTransition,
  getValueAtTime,
  getVelocityAtTime,
  interpolateKeyframes,
  snapToFrame,
} from "../../services/interpolation"
import { createKeyframe } from "../../services/keyframe-manager"
import type { Keyframe } from "../../types/keyframe"

describe("Interpolation", () => {
  describe("interpolateKeyframes", () => {
    it("interpolates linear number values", () => {
      const kf1 = createKeyframe(0, 0, "linear")
      const kf2 = createKeyframe(2, 100, "linear")

      const value = interpolateKeyframes(kf1, kf2, 1)

      expect(value).toBe(50)
    })

    it("returns first value when duration is zero", () => {
      const kf1 = createKeyframe(1, 50, "linear")
      const kf2 = createKeyframe(1, 100, "linear")

      const value = interpolateKeyframes(kf1, kf2, 1)

      expect(value).toBe(50)
    })

    it("clamps time to 0-1 range", () => {
      const kf1 = createKeyframe(0, 0, "linear")
      const kf2 = createKeyframe(1, 100, "linear")

      const before = interpolateKeyframes(kf1, kf2, -0.5)
      const after = interpolateKeyframes(kf1, kf2, 1.5)

      expect(before).toBe(0)
      expect(after).toBe(100)
    })

    it("holds value for hold interpolation", () => {
      const kf1 = createKeyframe(0, 50, "hold")
      const kf2 = createKeyframe(2, 100, "hold")

      const value = interpolateKeyframes(kf1, kf2, 1)

      expect(value).toBe(50)
    })

    it("interpolates vector values", () => {
      const kf1 = createKeyframe<[number, number]>(0, [0, 0], "linear")
      const kf2 = createKeyframe<[number, number]>(2, [100, 200], "linear")

      const value = interpolateKeyframes(kf1, kf2, 1) as [number, number]

      expect(value[0]).toBe(50)
      expect(value[1]).toBe(100)
    })

    it("interpolates boolean values as step", () => {
      const kf1 = createKeyframe<boolean>(0, false, "linear")
      const kf2 = createKeyframe<boolean>(2, true, "linear")

      const valueBefore = interpolateKeyframes(kf1, kf2, 0.4)
      const valueAfter = interpolateKeyframes(kf1, kf2, 1.1)

      expect(valueBefore).toBe(false)
      expect(valueAfter).toBe(true)
    })

    it("interpolates color values", () => {
      const kf1 = createKeyframe<string>(0, "#000000", "linear")
      const kf2 = createKeyframe<string>(2, "#ffffff", "linear")

      const value = interpolateKeyframes(kf1, kf2, 1) as string

      expect(value).toMatch(/^#[0-9a-f]{6}$/)
      expect(value).not.toBe("#000000")
      expect(value).not.toBe("#ffffff")
    })

    it("applies ease-in easing", () => {
      const kf1 = createKeyframe(0, 0, "ease-in")
      const kf2 = createKeyframe(1, 100, "linear")

      const valueMid = interpolateKeyframes(kf1, kf2, 0.5) as number

      // Ease-in should have less progress at 0.5
      expect(valueMid).toBeLessThan(50)
    })

    it("applies ease-out easing", () => {
      const kf1 = createKeyframe(0, 0, "ease-out")
      const kf2 = createKeyframe(1, 100, "linear")

      const valueMid = interpolateKeyframes(kf1, kf2, 0.5) as number

      // Ease-out should have more progress at 0.5
      expect(valueMid).toBeGreaterThan(50)
    })

    it("applies bounce easing", () => {
      const kf1 = createKeyframe(0, 0, "bounce")
      const kf2 = createKeyframe(1, 100, "linear")

      const value = interpolateKeyframes(kf1, kf2, 0.5) as number

      expect(typeof value).toBe("number")
      expect(value).toBeGreaterThanOrEqual(0)
    })

    it("applies elastic easing", () => {
      const kf1 = createKeyframe(0, 0, "elastic")
      const kf2 = createKeyframe(1, 100, "linear")

      const value = interpolateKeyframes(kf1, kf2, 0.5) as number

      expect(typeof value).toBe("number")
    })

    it("applies expo easing", () => {
      const kf1 = createKeyframe(0, 0, "expo")
      const kf2 = createKeyframe(1, 100, "linear")

      const value = interpolateKeyframes(kf1, kf2, 0.5) as number

      expect(typeof value).toBe("number")
      expect(value).toBeGreaterThanOrEqual(0)
    })

    it("handles bezier interpolation with control points", () => {
      const kf1: Keyframe = {
        ...createKeyframe(0, 0, "bezier"),
        easeOut: [0.5, 0],
      }
      const kf2: Keyframe = {
        ...createKeyframe(1, 100, "linear"),
        easeIn: [0.5, 1],
      }

      const value = interpolateKeyframes(kf1, kf2, 0.5) as number

      expect(typeof value).toBe("number")
    })

    it("handles temporal easing in bezier mode", () => {
      const kf1: Keyframe = {
        ...createKeyframe(0, 0, "bezier"),
        temporalEaseOut: 0.5,
      }
      const kf2: Keyframe = {
        ...createKeyframe(1, 100, "linear"),
        temporalEaseIn: 0.5,
      }

      const value = interpolateKeyframes(kf1, kf2, 0.5) as number

      expect(typeof value).toBe("number")
    })
  })

  describe("getValueAtTime", () => {
    const keyframes = [createKeyframe(0, 0), createKeyframe(1, 50), createKeyframe(2, 100)]

    it("returns default value for empty keyframes", () => {
      const value = getValueAtTime([], 1, 999)
      expect(value).toBe(999)
    })

    it("returns first value for time before first keyframe", () => {
      const value = getValueAtTime(keyframes, -1, 0)
      expect(value).toBe(0)
    })

    it("returns last value for time after last keyframe", () => {
      const value = getValueAtTime(keyframes, 10, 0)
      expect(value).toBe(100)
    })

    it("interpolates value between keyframes", () => {
      const value = getValueAtTime(keyframes, 0.5, 0)
      expect(value).toBe(25)
    })

    it("returns exact value at keyframe time", () => {
      const value = getValueAtTime(keyframes, 1, 0)
      expect(value).toBe(50)
    })

    it("handles unsorted keyframes", () => {
      const unsorted = [createKeyframe(2, 100), createKeyframe(0, 0), createKeyframe(1, 50)]

      const value = getValueAtTime(unsorted, 1, 0)
      expect(value).toBe(50)
    })
  })

  describe("getVelocityAtTime", () => {
    const keyframes = [createKeyframe(0, 0), createKeyframe(1, 100)]

    it("returns null for single keyframe", () => {
      const velocity = getVelocityAtTime([createKeyframe(0, 0)], 0.5)
      expect(velocity).toBeNull()
    })

    it("calculates velocity for number values", () => {
      const velocity = getVelocityAtTime(keyframes, 0.5)
      expect(typeof velocity).toBe("number")
      expect(velocity).toBeGreaterThan(0)
    })

    it("calculates velocity for vector values", () => {
      const vectorKeyframes = [
        createKeyframe<[number, number]>(0, [0, 0]),
        createKeyframe<[number, number]>(1, [100, 100]),
      ]

      const velocity = getVelocityAtTime(vectorKeyframes, 0.5)
      expect(Array.isArray(velocity)).toBe(true)
    })

    it("uses custom delta time", () => {
      const velocity1 = getVelocityAtTime(keyframes, 0.5, 1 / 60)
      const velocity2 = getVelocityAtTime(keyframes, 0.5, 1 / 30)

      expect(velocity1).not.toBe(velocity2)
    })
  })

  describe("snapToFrame", () => {
    it("snaps time to frame at 30 fps", () => {
      const snapped = snapToFrame(0.123, 30)
      expect(snapped).toBeCloseTo(0.133, 2)
    })

    it("snaps time to frame at 60 fps", () => {
      const snapped = snapToFrame(0.123, 60)
      expect(snapped).toBeCloseTo(0.117, 2)
    })

    it("snaps exact frame time", () => {
      const snapped = snapToFrame(1.0, 30)
      expect(snapped).toBe(1.0)
    })

    it("handles zero time", () => {
      const snapped = snapToFrame(0, 30)
      expect(snapped).toBe(0)
    })
  })

  describe("generateSmoothTransition", () => {
    it("generates two keyframes for transition", () => {
      const keyframes = generateSmoothTransition(0, 100, 0, 2)

      expect(keyframes).toHaveLength(2)
      expect(keyframes[0].time).toBe(0)
      expect(keyframes[0].value).toBe(0)
      expect(keyframes[1].time).toBe(2)
      expect(keyframes[1].value).toBe(100)
    })

    it("uses specified interpolation", () => {
      const keyframes = generateSmoothTransition(0, 100, 0, 2, "ease-in-out")

      expect(keyframes[0].interpolation).toBe("ease-in-out")
    })

    it("adds bezier control points for bezier interpolation", () => {
      const keyframes = generateSmoothTransition(0, 100, 0, 2, "bezier")

      expect(keyframes[0].easeOut).toBeDefined()
      expect(keyframes[1].easeIn).toBeDefined()
    })

    it("generates transition for vector values", () => {
      const keyframes = generateSmoothTransition<[number, number]>([0, 0], [100, 200], 0, 1)

      expect(keyframes).toHaveLength(2)
      expect(keyframes[0].value).toEqual([0, 0])
      expect(keyframes[1].value).toEqual([100, 200])
    })

    it("generates transition with custom start time", () => {
      const keyframes = generateSmoothTransition(0, 100, 5, 2)

      expect(keyframes[0].time).toBe(5)
      expect(keyframes[1].time).toBe(7)
    })
  })
})

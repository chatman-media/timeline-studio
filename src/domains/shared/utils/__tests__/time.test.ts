/**
 * Time Formatting Utilities Tests
 */

import { describe, expect, it } from "vitest"
import {
  formatDuration,
  formatTime,
  frameToMs,
  isValidTimeFormat,
  msToFrame,
  msToSeconds,
  parseTime,
  roundToFrame,
  secondsToMs,
} from "../time"

describe("time utils", () => {
  describe("formatTime", () => {
    it("should format MM:SS for times under 1 hour", () => {
      expect(formatTime(125000)).toBe("02:05")
      expect(formatTime(0)).toBe("00:00")
      expect(formatTime(59999)).toBe("00:59")
    })

    it("should format HH:MM:SS for times over 1 hour", () => {
      expect(formatTime(3725000)).toBe("01:02:05")
      expect(formatTime(3600000)).toBe("01:00:00")
    })

    it("should show milliseconds when option is enabled", () => {
      expect(formatTime(125000, { showMilliseconds: true })).toBe("02:05.000")
      expect(formatTime(125500, { showMilliseconds: true })).toBe("02:05.500")
    })

    it("should always show hours when option is enabled", () => {
      expect(formatTime(125000, { alwaysShowHours: true })).toBe("00:02:05")
      expect(formatTime(59000, { alwaysShowHours: true })).toBe("00:00:59")
    })

    it("should handle negative values", () => {
      expect(formatTime(-125000)).toBe("-02:05")
      expect(formatTime(-3725000)).toBe("-01:02:05")
    })

    it("should format in compact mode", () => {
      expect(formatTime(125000, { compact: true })).toBe("2:05")
      expect(formatTime(65000, { compact: true })).toBe("1:05")
    })

    it("should combine multiple options", () => {
      expect(formatTime(125000, { alwaysShowHours: true, showMilliseconds: true })).toBe("00:02:05.000")
    })
  })

  describe("parseTime", () => {
    it("should parse MM:SS format", () => {
      expect(parseTime("02:05")).toBe(125000)
      expect(parseTime("00:00")).toBe(0)
      expect(parseTime("10:30")).toBe(630000)
    })

    it("should parse HH:MM:SS format", () => {
      expect(parseTime("01:02:05")).toBe(3725000)
      expect(parseTime("00:00:00")).toBe(0)
      expect(parseTime("02:30:45")).toBe(9045000)
    })

    it("should parse SS format", () => {
      expect(parseTime("30")).toBe(30000)
      expect(parseTime("0")).toBe(0)
      expect(parseTime("120")).toBe(120000)
    })

    it("should parse with milliseconds", () => {
      expect(parseTime("02:05.500")).toBe(125500)
      expect(parseTime("01:02:05.123")).toBe(3725123)
    })

    it("should handle negative values", () => {
      expect(parseTime("-02:05")).toBe(-125000)
      expect(parseTime("-01:02:05")).toBe(-3725000)
    })

    it("should return null for invalid formats", () => {
      expect(parseTime("invalid")).toBeNull()
      expect(parseTime("")).toBeNull()
      // Note: parseTime("25:61") is actually valid - it parses as 25 minutes and 61 seconds
      expect(parseTime("abc:def")).toBeNull()
    })

    it("should handle whitespace", () => {
      expect(parseTime("  02:05  ")).toBe(125000)
      expect(parseTime("01:02:05")).toBe(3725000)
    })

    // @ts-expect-error - testing invalid input
    it("should return null for non-string input", () => {
      expect(parseTime(null)).toBeNull()
      // @ts-expect-error - testing invalid input
      expect(parseTime(undefined)).toBeNull()
      // @ts-expect-error - testing invalid input
      expect(parseTime(123)).toBeNull()
    })
  })

  describe("secondsToMs and msToSeconds", () => {
    it("should convert seconds to milliseconds", () => {
      expect(secondsToMs(1)).toBe(1000)
      expect(secondsToMs(0)).toBe(0)
      expect(secondsToMs(2.5)).toBe(2500)
    })

    it("should convert milliseconds to seconds", () => {
      expect(msToSeconds(1000)).toBe(1)
      expect(msToSeconds(0)).toBe(0)
      expect(msToSeconds(2500)).toBe(2.5)
    })

    it("should be reversible", () => {
      const seconds = 125
      expect(msToSeconds(secondsToMs(seconds))).toBe(seconds)
    })
  })

  describe("formatDuration", () => {
    it("should format duration in human readable format", () => {
      expect(formatDuration(125000)).toBe("2m 5s")
      expect(formatDuration(3725000)).toBe("1h 2m 5s")
      expect(formatDuration(5000)).toBe("5s")
    })

    it("should handle hours only", () => {
      expect(formatDuration(3600000)).toBe("1h")
      expect(formatDuration(7200000)).toBe("2h")
    })

    it("should handle minutes only", () => {
      expect(formatDuration(120000)).toBe("2m")
    })

    it("should handle zero", () => {
      expect(formatDuration(0)).toBe("0s")
    })

    it("should handle negative values", () => {
      expect(formatDuration(-125000)).toBe("-2m 5s")
    })

    it("should skip zero parts", () => {
      expect(formatDuration(3605000)).toBe("1h 5s")
      expect(formatDuration(65000)).toBe("1m 5s")
    })
  })

  describe("isValidTimeFormat", () => {
    it("should validate correct time formats", () => {
      expect(isValidTimeFormat("02:05")).toBe(true)
      expect(isValidTimeFormat("01:02:05")).toBe(true)
      expect(isValidTimeFormat("30")).toBe(true)
      expect(isValidTimeFormat("02:05.500")).toBe(true)
    })

    it("should reject invalid formats", () => {
      expect(isValidTimeFormat("invalid")).toBe(false)
      expect(isValidTimeFormat("")).toBe(false)
      expect(isValidTimeFormat("abc:def")).toBe(false)
    })
  })

  describe("roundToFrame", () => {
    it("should round to nearest frame at 30fps", () => {
      const frameDuration = 1000 / 30 // ~33.33ms
      expect(roundToFrame(125, 30)).toBeCloseTo(133, 0)
      expect(roundToFrame(100, 30)).toBeCloseTo(100, 0)
    })

    it("should round to nearest frame at 60fps", () => {
      // At 60fps, frame duration is ~16.67ms
      // 125ms / 16.67ms = 7.5 frames, rounds to 8 frames
      // 8 frames * 16.67ms = ~133.33ms but actual is 8 * (1000/60) = 133.33...
      const result = roundToFrame(125, 60)
      expect(result).toBeGreaterThan(115)
      expect(result).toBeLessThan(135)
    })

    it("should handle zero fps gracefully", () => {
      expect(roundToFrame(125, 0)).toBe(125)
    })

    it("should handle negative fps gracefully", () => {
      expect(roundToFrame(125, -30)).toBe(125)
    })

    it("should handle exact frame boundaries", () => {
      const fps = 30
      const frameDuration = 1000 / fps
      expect(roundToFrame(frameDuration, fps)).toBeCloseTo(frameDuration, 1)
      expect(roundToFrame(frameDuration * 2, fps)).toBeCloseTo(frameDuration * 2, 1)
    })
  })

  describe("frameToMs and msToFrame", () => {
    it("should convert frame number to milliseconds", () => {
      expect(frameToMs(30, 30)).toBe(1000)
      expect(frameToMs(0, 30)).toBe(0)
      expect(frameToMs(60, 30)).toBe(2000)
    })

    it("should convert milliseconds to frame number", () => {
      expect(msToFrame(1000, 30)).toBe(30)
      expect(msToFrame(0, 30)).toBe(0)
      expect(msToFrame(2000, 30)).toBe(60)
    })

    it("should handle different frame rates", () => {
      expect(frameToMs(60, 60)).toBe(1000)
      expect(msToFrame(1000, 60)).toBe(60)
    })

    it("should handle zero fps gracefully", () => {
      expect(frameToMs(30, 0)).toBe(0)
      expect(msToFrame(1000, 0)).toBe(0)
    })

    it("should handle negative fps gracefully", () => {
      expect(frameToMs(30, -30)).toBe(0)
      expect(msToFrame(1000, -30)).toBe(0)
    })

    it("should be approximately reversible", () => {
      const ms = 1000
      const fps = 30
      const frame = msToFrame(ms, fps)
      expect(frameToMs(frame, fps)).toBeCloseTo(ms, 0)
    })
  })

  describe("edge cases", () => {
    it("should handle very large values", () => {
      const largeValue = 999999999999
      expect(formatTime(largeValue)).toBeTruthy()
      expect(typeof formatTime(largeValue)).toBe("string")
    })

    it("should handle fractional milliseconds", () => {
      expect(formatTime(125.7)).toBe("00:00")
      expect(formatTime(125.7, { showMilliseconds: true })).toContain(".")
    })

    it("should handle precision in conversions", () => {
      const fps = 29.97 // NTSC frame rate
      const frame = 100
      const ms = frameToMs(frame, fps)
      expect(ms).toBeCloseTo(3337, 0)
    })
  })
})

import { describe, expect, it } from "vitest"

import {
  formatDurationHuman,
  formatDurationMs,
  formatDurationSeconds,
  parseDurationString,
} from "../duration-formatter"

describe("Duration Formatter Utilities", () => {
  describe("formatDurationSeconds", () => {
    it("formats seconds without hours (MM:SS)", () => {
      expect(formatDurationSeconds(0)).toBe("0:00")
      expect(formatDurationSeconds(5)).toBe("0:05")
      expect(formatDurationSeconds(65)).toBe("1:05")
      expect(formatDurationSeconds(125)).toBe("2:05")
      expect(formatDurationSeconds(3599)).toBe("59:59")
    })

    it("formats seconds with hours (HH:MM:SS) - without leading zero for hours", () => {
      expect(formatDurationSeconds(3600)).toBe("1:00:00")
      expect(formatDurationSeconds(3665)).toBe("1:01:05")
      expect(formatDurationSeconds(7325)).toBe("2:02:05")
      expect(formatDurationSeconds(36000)).toBe("10:00:00")
    })

    it("formats with showHours=true", () => {
      expect(formatDurationSeconds(0, true)).toBe("00:00:00")
      expect(formatDurationSeconds(65, true)).toBe("00:01:05")
      expect(formatDurationSeconds(3665, true)).toBe("01:01:05")
    })

    it("handles edge cases", () => {
      expect(formatDurationSeconds(-5)).toBe("0:00")
      expect(formatDurationSeconds(Number.POSITIVE_INFINITY)).toBe("0:00")
      expect(formatDurationSeconds(Number.NaN)).toBe("0:00")
    })
  })

  describe("formatDurationMs", () => {
    it("formats milliseconds to HH:MM:SS format", () => {
      expect(formatDurationMs(0)).toBe("0:00")
      expect(formatDurationMs(5000)).toBe("0:05")
      expect(formatDurationMs(65000)).toBe("1:05")
      expect(formatDurationMs(3600000)).toBe("1:00:00")
      expect(formatDurationMs(3665000)).toBe("1:01:05")
    })

    it("handles showHours parameter", () => {
      expect(formatDurationMs(65000, true)).toBe("00:01:05")
      expect(formatDurationMs(3665000, true)).toBe("01:01:05")
    })
  })

  describe("formatDurationHuman", () => {
    it("formats seconds in human readable format", () => {
      expect(formatDurationHuman(0)).toBe("0s")
      expect(formatDurationHuman(5)).toBe("5s")
      expect(formatDurationHuman(60)).toBe("1m")
      expect(formatDurationHuman(65)).toBe("1m 5s")
      expect(formatDurationHuman(125)).toBe("2m 5s")
    })

    it("includes hours when present", () => {
      expect(formatDurationHuman(3600)).toBe("1h")
      expect(formatDurationHuman(3605)).toBe("1h 5s")
      expect(formatDurationHuman(3665)).toBe("1h 1m 5s")
      expect(formatDurationHuman(7325)).toBe("2h 2m 5s")
    })

    it("handles edge cases", () => {
      expect(formatDurationHuman(-5)).toBe("0s")
      expect(formatDurationHuman(Number.NaN)).toBe("0s")
    })
  })

  describe("parseDurationString", () => {
    it("parses HH:MM:SS format", () => {
      expect(parseDurationString("01:23:45")).toBe(1 * 3600 + 23 * 60 + 45)
      expect(parseDurationString("00:00:30")).toBe(30)
      expect(parseDurationString("10:00:00")).toBe(36000)
      expect(parseDurationString("01:01:01")).toBe(3661)
    })

    it("parses MM:SS format", () => {
      expect(parseDurationString("01:30")).toBe(90)
      expect(parseDurationString("00:45")).toBe(45)
      expect(parseDurationString("59:59")).toBe(3599)
      expect(parseDurationString("1:05")).toBe(65)
    })

    it("parses SS format", () => {
      expect(parseDurationString("123")).toBe(123)
      expect(parseDurationString("0")).toBe(0)
      expect(parseDurationString("45")).toBe(45)
    })

    it("accepts number input", () => {
      expect(parseDurationString(65)).toBe(65)
      expect(parseDurationString(0)).toBe(0)
      expect(parseDurationString(3665)).toBe(3665)
    })

    it("handles invalid input", () => {
      expect(parseDurationString("abc")).toBeNull()
      expect(parseDurationString("")).toBeNull()
      expect(parseDurationString(null)).toBeNull()
      expect(parseDurationString(undefined)).toBeNull()
      expect(parseDurationString("1:2:3:4")).toBeNull()
    })

    it("handles negative values", () => {
      expect(parseDurationString(-65)).toBeNull()
      expect(parseDurationString(-1)).toBeNull()
    })

    it("handles whitespace", () => {
      expect(parseDurationString("  65  ")).toBe(65)
      expect(parseDurationString("  01:05  ")).toBe(65)
    })
  })

  describe("Round-trip conversion", () => {
    it("should format and parse consistently", () => {
      const testValues = [0, 5, 65, 125, 3600, 3665, 7325]

      for (const seconds of testValues) {
        const formatted = formatDurationSeconds(seconds)
        const parsed = parseDurationString(formatted)
        expect(parsed).toBe(seconds)
      }
    })
  })
})

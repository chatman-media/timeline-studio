import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useTimelineScale } from "../use-timeline-scale"

describe("useTimelineScale", () => {
  describe("Time Scale Calculations", () => {
    it("should calculate correct time steps for very short duration (≤5s)", () => {
      const { result } = renderHook(() => useTimelineScale(3, 0, 3, 1))

      expect(result.current.timeStep).toBe(1)
      expect(result.current.subStep).toBe(0.2)
    })

    it("should calculate correct time steps for short duration (≤10s)", () => {
      const { result } = renderHook(() => useTimelineScale(8, 0, 8, 1))

      expect(result.current.timeStep).toBe(2)
      expect(result.current.subStep).toBe(0.5)
    })

    it("should calculate correct time steps for medium duration (≤30s)", () => {
      const { result } = renderHook(() => useTimelineScale(25, 0, 25, 1))

      expect(result.current.timeStep).toBe(5)
      expect(result.current.subStep).toBe(1)
    })

    it("should calculate correct time steps for 1 minute duration", () => {
      const { result } = renderHook(() => useTimelineScale(60, 0, 60, 1))

      expect(result.current.timeStep).toBe(10)
      expect(result.current.subStep).toBe(2)
    })

    it("should calculate correct time steps for 2 minute duration", () => {
      const { result } = renderHook(() => useTimelineScale(120, 0, 120, 1))

      expect(result.current.timeStep).toBe(20)
      expect(result.current.subStep).toBe(5)
    })

    it("should calculate correct time steps for 5 minute duration", () => {
      const { result } = renderHook(() => useTimelineScale(300, 0, 300, 1))

      expect(result.current.timeStep).toBe(60)
      expect(result.current.subStep).toBe(10)
    })

    it("should calculate correct time steps for 10 minute duration", () => {
      const { result } = renderHook(() => useTimelineScale(600, 0, 600, 1))

      expect(result.current.timeStep).toBe(120)
      expect(result.current.subStep).toBe(30)
    })

    it("should calculate correct time steps for 30 minute duration", () => {
      const { result } = renderHook(() => useTimelineScale(1800, 0, 1800, 1))

      expect(result.current.timeStep).toBe(300)
      expect(result.current.subStep).toBe(60)
    })

    it("should calculate correct time steps for 1 hour duration", () => {
      const { result } = renderHook(() => useTimelineScale(3600, 0, 3600, 1))

      expect(result.current.timeStep).toBe(600)
      expect(result.current.subStep).toBe(120)
    })

    it("should calculate correct time steps for 2 hour duration", () => {
      const { result } = renderHook(() => useTimelineScale(7200, 0, 7200, 1))

      expect(result.current.timeStep).toBe(1200)
      expect(result.current.subStep).toBe(300)
    })

    it("should calculate correct time steps for 4 hour duration", () => {
      const { result } = renderHook(() => useTimelineScale(14400, 0, 14400, 1))

      expect(result.current.timeStep).toBe(1800)
      expect(result.current.subStep).toBe(600)
    })

    it("should calculate correct time steps for 12 hour duration", () => {
      const { result } = renderHook(() => useTimelineScale(43200, 0, 43200, 1))

      expect(result.current.timeStep).toBe(3600)
      expect(result.current.subStep).toBe(900)
    })

    it("should calculate correct time steps for very long duration (>12h)", () => {
      const { result } = renderHook(() => useTimelineScale(86400, 0, 86400, 1))

      expect(result.current.timeStep).toBe(7200)
      expect(result.current.subStep).toBe(1800)
    })
  })

  describe("Scale Factor Effects", () => {
    it("should adjust time steps when scale > 1 (zoom in)", () => {
      const { result: normalResult } = renderHook(() => useTimelineScale(60, 0, 60, 1))
      const { result: zoomedResult } = renderHook(() => useTimelineScale(60, 0, 60, 2))

      // With scale = 2, the effective duration is 30s, so we get different time steps
      expect(normalResult.current.timeStep).toBe(10) // 60s duration
      expect(zoomedResult.current.timeStep).toBe(5) // 30s effective duration
    })

    it("should adjust time steps when scale < 1 (zoom out)", () => {
      const { result: normalResult } = renderHook(() => useTimelineScale(30, 0, 30, 1))
      const { result: zoomedOutResult } = renderHook(() => useTimelineScale(30, 0, 30, 0.5))

      // With scale = 0.5, the effective duration is 60s, so we get different time steps
      expect(normalResult.current.timeStep).toBe(5) // 30s duration
      expect(zoomedOutResult.current.timeStep).toBe(10) // 60s effective duration
    })

    it("should handle edge case scale values", () => {
      const { result: veryHighScale } = renderHook(() => useTimelineScale(60, 0, 60, 10))
      const { result: veryLowScale } = renderHook(() => useTimelineScale(60, 0, 60, 0.1))

      // With scale 10, effective duration is 6s, should get 2s step
      expect(veryHighScale.current.timeStep).toBe(2)
      // With scale 0.1, effective duration is 600s, should get 120s step
      expect(veryLowScale.current.timeStep).toBe(120)
    })
  })

  describe("Adjusted Range Calculations", () => {
    it("should calculate adjusted range with padding for normal scale", () => {
      const { result } = renderHook(() => useTimelineScale(100, 10, 110, 1))

      const { adjustedRange } = result.current
      const timeRange = 110 - 10 // 100
      const padding = timeRange * 0.03 // 3

      expect(adjustedRange.startTime).toBe(10 - padding) // 7
      expect(adjustedRange.endTime).toBe(110 + padding) // 113
      expect(adjustedRange.duration).toBe(timeRange + padding * 2) // 106
    })

    it("should calculate adjusted range with scale > 1 (zoom in)", () => {
      const { result } = renderHook(() => useTimelineScale(100, 10, 110, 2))

      const { adjustedRange } = result.current
      const timeRange = 110 - 10 // 100
      const scaledDuration = timeRange / 2 // 50
      const scaledPadding = (timeRange * 0.03) / 2 // 1.5

      expect(adjustedRange.startTime).toBe(10 - scaledPadding) // 8.5
      expect(adjustedRange.endTime).toBe(10 - scaledPadding + scaledDuration + scaledPadding * 2) // 61.5
      expect(adjustedRange.duration).toBe(scaledDuration + scaledPadding * 2) // 53
    })

    it("should calculate adjusted range with scale < 1 (zoom out)", () => {
      const { result } = renderHook(() => useTimelineScale(100, 10, 110, 0.5))

      const { adjustedRange } = result.current
      const timeRange = 110 - 10 // 100
      const scaledDuration = timeRange / 0.5 // 200
      const scaledPadding = (timeRange * 0.03) / 0.5 // 6

      expect(adjustedRange.startTime).toBe(10 - scaledPadding) // 4
      expect(adjustedRange.endTime).toBe(10 - scaledPadding + scaledDuration + scaledPadding * 2) // 216
      expect(adjustedRange.duration).toBe(scaledDuration + scaledPadding * 2) // 212
    })

    it("should handle edge case with zero duration", () => {
      const { result } = renderHook(() => useTimelineScale(0, 10, 10, 1))

      const { adjustedRange } = result.current

      expect(adjustedRange.startTime).toBe(10)
      expect(adjustedRange.endTime).toBe(10)
      expect(adjustedRange.duration).toBe(0)
    })

    it("should preserve start time as anchor point during scaling", () => {
      const startTime = 100
      const endTime = 200

      const { result: normalScale } = renderHook(() => useTimelineScale(100, startTime, endTime, 1))
      const { result: zoomedScale } = renderHook(() => useTimelineScale(100, startTime, endTime, 2))

      // Both should have similar start times (with padding adjustment)
      const normalPadding = (endTime - startTime) * 0.03
      const zoomedPadding = ((endTime - startTime) * 0.03) / 2

      expect(normalScale.current.adjustedRange.startTime).toBe(startTime - normalPadding)
      expect(zoomedScale.current.adjustedRange.startTime).toBe(startTime - zoomedPadding)
    })
  })

  describe("Time to Position Conversion", () => {
    it("should convert time to position correctly", () => {
      const { result } = renderHook(() => useTimelineScale(100, 0, 100, 1))

      const { timeToPosition, adjustedRange } = result.current

      // Time at start of adjusted range should be 0%
      expect(timeToPosition(adjustedRange.startTime)).toBe(0)

      // Time at end of adjusted range should be 100%
      expect(timeToPosition(adjustedRange.endTime)).toBe(100)

      // Time in middle should be 50%
      const middleTime = adjustedRange.startTime + adjustedRange.duration / 2
      expect(timeToPosition(middleTime)).toBe(50)
    })

    it("should handle edge cases in time to position conversion", () => {
      const { result } = renderHook(() => useTimelineScale(100, 0, 100, 1))

      const { timeToPosition, adjustedRange } = result.current

      // Time before start should give negative percentage
      expect(timeToPosition(adjustedRange.startTime - 10)).toBeLessThan(0)

      // Time after end should give percentage > 100
      expect(timeToPosition(adjustedRange.endTime + 10)).toBeGreaterThan(100)
    })

    it("should handle zero duration in time to position conversion", () => {
      const { result } = renderHook(() => useTimelineScale(0, 10, 10, 1))

      const { timeToPosition } = result.current

      // Should return 0 for zero duration
      expect(timeToPosition(5)).toBe(0)
      expect(timeToPosition(10)).toBe(0)
      expect(timeToPosition(15)).toBe(0)
    })
  })

  describe("Position to Time Conversion", () => {
    it("should convert position to time correctly", () => {
      const { result } = renderHook(() => useTimelineScale(100, 0, 100, 1))

      const { positionToTime, adjustedRange } = result.current

      // 0% position should be start time
      expect(positionToTime(0)).toBe(adjustedRange.startTime)

      // 100% position should be end time
      expect(positionToTime(100)).toBe(adjustedRange.endTime)

      // 50% position should be middle time
      const expectedMiddleTime = adjustedRange.startTime + adjustedRange.duration / 2
      expect(positionToTime(50)).toBe(expectedMiddleTime)
    })

    it("should handle out-of-bounds positions", () => {
      const { result } = renderHook(() => useTimelineScale(100, 0, 100, 1))

      const { positionToTime, adjustedRange } = result.current

      // Negative position should return start time
      expect(positionToTime(-10)).toBe(adjustedRange.startTime)

      // Position > 100 should return start time
      expect(positionToTime(150)).toBe(adjustedRange.startTime)
    })

    it("should be inverse of timeToPosition", () => {
      const { result } = renderHook(() => useTimelineScale(100, 0, 100, 1))

      const { timeToPosition, positionToTime, adjustedRange } = result.current

      // Test round-trip conversion
      const testTime = adjustedRange.startTime + adjustedRange.duration * 0.3
      const position = timeToPosition(testTime)
      const convertedTime = positionToTime(position)

      expect(convertedTime).toBeCloseTo(testTime, 10)
    })
  })

  describe("Hook Memoization", () => {
    it("should recalculate when duration changes", () => {
      const { result, rerender } = renderHook(({ duration }) => useTimelineScale(duration, 0, duration, 1), {
        initialProps: { duration: 30 },
      })

      const initialTimeStep = result.current.timeStep
      expect(initialTimeStep).toBe(5) // 30s duration

      rerender({ duration: 60 })

      const newTimeStep = result.current.timeStep
      expect(newTimeStep).toBe(10) // 60s duration
      expect(newTimeStep).not.toBe(initialTimeStep)
    })

    it("should recalculate when scale changes", () => {
      const { result, rerender } = renderHook(({ scale }) => useTimelineScale(60, 0, 60, scale), {
        initialProps: { scale: 1 },
      })

      const initialTimeStep = result.current.timeStep
      expect(initialTimeStep).toBe(10) // 60s duration

      rerender({ scale: 2 })

      const newTimeStep = result.current.timeStep
      expect(newTimeStep).toBe(5) // 30s effective duration
      expect(newTimeStep).not.toBe(initialTimeStep)
    })

    it("should recalculate when start or end time changes", () => {
      const { result, rerender } = renderHook(
        ({ startTime, endTime }) => useTimelineScale(100, startTime, endTime, 1),
        { initialProps: { startTime: 0, endTime: 100 } },
      )

      const initialRange = result.current.adjustedRange
      expect(initialRange.startTime).toBeCloseTo(-3) // With 3% padding

      rerender({ startTime: 50, endTime: 150 })

      const newRange = result.current.adjustedRange
      expect(newRange.startTime).toBeCloseTo(47) // 50 - 3% of 100
      expect(newRange.startTime).not.toBe(initialRange.startTime)
    })
  })

  describe("Real-world Scenarios", () => {
    it("should handle typical video timeline (5 minutes)", () => {
      const duration = 300 // 5 minutes
      const { result } = renderHook(() => useTimelineScale(duration, 0, duration, 1))

      expect(result.current.timeStep).toBe(60) // 1-minute steps
      expect(result.current.subStep).toBe(10) // 10-second substeps

      // Test time conversions
      const position = result.current.timeToPosition(150) // 2.5 minutes
      expect(position).toBeGreaterThan(40)
      expect(position).toBeLessThan(60)
    })

    it("should handle zoomed-in short clip (10 seconds, 4x zoom)", () => {
      const duration = 10
      const scale = 4
      const { result } = renderHook(() => useTimelineScale(duration, 0, duration, scale))

      // Effective duration is 2.5s, so should use fine-grained steps
      expect(result.current.timeStep).toBe(1) // 1-second steps
      expect(result.current.subStep).toBe(0.2) // 0.2-second substeps

      // Range should be much smaller due to zoom
      expect(result.current.adjustedRange.duration).toBeLessThan(duration)
    })

    it("should handle long documentary timeline (2 hours, zoomed out)", () => {
      const duration = 7200 // 2 hours
      const scale = 0.1 // Zoomed way out
      const { result } = renderHook(() => useTimelineScale(duration, 0, duration, scale))

      // Effective duration is 20 hours, so should use very coarse steps
      expect(result.current.timeStep).toBe(7200) // 2-hour steps
      expect(result.current.subStep).toBe(1800) // 30-minute substeps
    })

    it("should handle Unix timestamp ranges", () => {
      const startTime = 1640995200 // Jan 1, 2022 00:00:00 UTC
      const endTime = 1641081600 // Jan 2, 2022 00:00:00 UTC
      const duration = endTime - startTime // 24 hours

      const { result } = renderHook(() => useTimelineScale(duration, startTime, endTime, 1))

      expect(result.current.timeStep).toBe(7200) // 2-hour steps for 24h duration
      expect(result.current.adjustedRange.startTime).toBeLessThan(startTime)
      expect(result.current.adjustedRange.endTime).toBeGreaterThan(endTime)

      // Test conversion with Unix timestamps
      const position = result.current.timeToPosition(startTime + 12 * 3600) // Noon
      expect(position).toBeGreaterThan(40)
      expect(position).toBeLessThan(60)
    })
  })
})

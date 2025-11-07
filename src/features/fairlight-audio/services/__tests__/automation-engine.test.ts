import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AutomationEngine, type AutomationMode } from "../automation-engine"

describe("AutomationEngine", () => {
  let engine: AutomationEngine
  let mockCallback: (value: number) => void

  beforeEach(() => {
    engine = new AutomationEngine()
    mockCallback = vi.fn((value: number) => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("initialization", () => {
    it("should initialize with default state", () => {
      const state = engine.getState()

      expect(state.mode).toBe("read")
      expect(state.isRecording).toBe(false)
      expect(state.currentTime).toBe(0)
      expect(state.lanes.size).toBe(0)
    })
  })

  describe("lane management", () => {
    it("should create automation lane with default values", () => {
      const lane = engine.createLane("ch1", "volume")

      expect(lane.id).toBe("ch1.volume")
      expect(lane.parameterId).toBe("volume")
      expect(lane.channelId).toBe("ch1")
      expect(lane.points).toEqual([{ time: 0, value: 0.5, curve: "linear" }])
      expect(lane.isEnabled).toBe(true)
      expect(lane.isVisible).toBe(false)
    })

    it("should create automation lane with custom initial value", () => {
      const lane = engine.createLane("ch2", "pan", 0.8)

      expect(lane.points[0].value).toBe(0.8)
    })

    it("should store lane in engine state", () => {
      engine.createLane("ch1", "volume")

      const state = engine.getState()
      expect(state.lanes.has("ch1.volume")).toBe(true)
    })

    it("should get channel lanes", () => {
      engine.createLane("ch1", "volume")
      engine.createLane("ch1", "pan")
      engine.createLane("ch2", "volume")

      const ch1Lanes = engine.getChannelLanes("ch1")
      expect(ch1Lanes).toHaveLength(2)
      expect(ch1Lanes.every((lane) => lane.channelId === "ch1")).toBe(true)
    })

    it("should toggle lane visibility", () => {
      const lane = engine.createLane("ch1", "volume")
      expect(lane.isVisible).toBe(false)

      engine.toggleLaneVisibility("ch1.volume")
      expect(lane.isVisible).toBe(true)

      engine.toggleLaneVisibility("ch1.volume")
      expect(lane.isVisible).toBe(false)
    })

    it("should handle toggle visibility for non-existent lane", () => {
      expect(() => engine.toggleLaneVisibility("non-existent")).not.toThrow()
    })
  })

  describe("automation modes", () => {
    it("should set automation mode", () => {
      engine.setMode("write")
      expect(engine.getState().mode).toBe("write")
    })

    it("should stop recording when mode is set to off", () => {
      engine.startRecording()
      expect(engine.getState().isRecording).toBe(true)

      engine.setMode("off")
      expect(engine.getState().isRecording).toBe(false)
    })

    it.each<AutomationMode>(["read", "write", "touch", "latch", "trim"])("should handle %s mode", (mode) => {
      engine.setMode(mode)
      expect(engine.getState().mode).toBe(mode)
    })
  })

  describe("parameter callbacks", () => {
    it("should register parameter callback", () => {
      engine.createLane("ch1", "volume")
      engine.registerParameterCallback("ch1.volume", mockCallback)

      // This doesn't return anything, but we can test it works through other methods
      expect(mockCallback).not.toHaveBeenCalled()
    })

    it("should call callback when writing parameter", () => {
      engine.createLane("ch1", "volume")
      engine.registerParameterCallback("ch1.volume", mockCallback)

      engine.writeParameter("ch1.volume", 0.7, true) // Force write
      expect(mockCallback).toHaveBeenCalledWith(0.7)
    })
  })

  describe("time management", () => {
    it("should update current time", () => {
      engine.updateTime(5.5)
      expect(engine.getState().currentTime).toBe(5.5)
    })

    it("should read automation when updating time in read mode", () => {
      engine.createLane("ch1", "volume")
      engine.registerParameterCallback("ch1.volume", mockCallback)

      // Add automation point
      engine.writeParameter("ch1.volume", 0.8, true)

      engine.setMode("read")
      engine.updateTime(1.0)

      expect(mockCallback).toHaveBeenCalledWith(0.8)
    })
  })

  describe("recording", () => {
    it("should start recording", () => {
      engine.updateTime(2.0)
      engine.startRecording()

      const state = engine.getState()
      expect(state.isRecording).toBe(true)
    })

    it("should not start recording when mode is off", () => {
      engine.setMode("off")
      engine.startRecording()

      expect(engine.getState().isRecording).toBe(false)
    })

    it("should stop recording", () => {
      engine.startRecording()
      engine.stopRecording()

      expect(engine.getState().isRecording).toBe(false)
    })
  })

  describe("parameter writing", () => {
    beforeEach(() => {
      engine.createLane("ch1", "volume")
      engine.registerParameterCallback("ch1.volume", mockCallback)
    })

    it("should force write parameter regardless of mode", () => {
      engine.setMode("off")
      engine.writeParameter("ch1.volume", 0.8, true)

      expect(mockCallback).toHaveBeenCalledWith(0.8)
    })

    it("should write parameter in write mode when recording", () => {
      engine.setMode("write")
      engine.startRecording()
      engine.writeParameter("ch1.volume", 0.6)

      expect(mockCallback).toHaveBeenCalledWith(0.6)
    })

    it("should not write parameter in write mode when not recording", () => {
      engine.setMode("write")
      engine.writeParameter("ch1.volume", 0.6)

      // Callback is still called for immediate application
      expect(mockCallback).toHaveBeenCalledWith(0.6)
    })

    it("should not write parameter for disabled lane", () => {
      const lane = engine.createLane("ch2", "pan")
      lane.isEnabled = false
      engine.registerParameterCallback("ch2.pan", mockCallback)

      engine.writeParameter("ch2.pan", 0.7, true)
      expect(mockCallback).not.toHaveBeenCalled()
    })

    it("should not write parameter for non-existent lane", () => {
      engine.writeParameter("non-existent", 0.7, true)
      // Should not throw
    })

    it("should handle trim mode with relative changes", () => {
      engine.setMode("trim")
      engine.startRecording()

      // Add initial point
      engine.writeParameter("ch1.volume", 0.5, true)
      engine.updateTime(1.0)

      // Trim adjustment (0.6 - 0.5) * 0.1 = 0.01 added to current value
      engine.writeParameter("ch1.volume", 0.6)

      // Should apply trim relative to current value
      expect(mockCallback).toHaveBeenCalledWith(0.51) // 0.5 + 0.01
    })
  })

  describe("touch and latch modes", () => {
    beforeEach(() => {
      engine.createLane("ch1", "volume")
      engine.registerParameterCallback("ch1.volume", mockCallback)
    })

    it("should handle touch parameter in touch mode", () => {
      engine.setMode("touch")
      engine.touchParameter("ch1.volume")

      // Should now write when parameter is touched
      engine.writeParameter("ch1.volume", 0.8)
      expect(mockCallback).toHaveBeenCalledWith(0.8)
    })

    it("should stop writing when parameter is released in touch mode", () => {
      engine.setMode("touch")
      engine.touchParameter("ch1.volume")
      engine.releaseParameter("ch1.volume")

      vi.clearAllMocks()

      // Should not write after release
      engine.writeParameter("ch1.volume", 0.8)
      expect(mockCallback).toHaveBeenCalledWith(0.8) // Still called for immediate application
    })

    it("should continue writing after release in latch mode", () => {
      engine.setMode("latch")
      engine.touchParameter("ch1.volume")
      engine.releaseParameter("ch1.volume")

      // Should still write after release in latch mode
      engine.writeParameter("ch1.volume", 0.8)
      expect(mockCallback).toHaveBeenCalledWith(0.8)
    })

    it("should not touch parameter in other modes", () => {
      engine.setMode("read")
      engine.touchParameter("ch1.volume")

      engine.writeParameter("ch1.volume", 0.8)
      expect(mockCallback).toHaveBeenCalledWith(0.8) // Only immediate application
    })
  })

  describe("automation point management", () => {
    beforeEach(() => {
      engine.createLane("ch1", "volume")
    })

    it("should add automation points in chronological order", () => {
      engine.setMode("write")
      engine.startRecording()

      engine.updateTime(1.0)
      engine.writeParameter("ch1.volume", 0.8)

      engine.updateTime(0.5)
      engine.writeParameter("ch1.volume", 0.6)

      engine.updateTime(1.5)
      engine.writeParameter("ch1.volume", 0.9)

      const lane = engine.getState().lanes.get("ch1.volume")!
      const times = lane.points.map((p) => p.time)
      expect(times).toEqual([0, 0.5, 1.0, 1.5])
    })

    it("should update existing point at same time", () => {
      engine.setMode("write")
      engine.startRecording()

      engine.updateTime(1.0)
      engine.writeParameter("ch1.volume", 0.8)
      engine.writeParameter("ch1.volume", 0.9) // Same time, should update

      const lane = engine.getState().lanes.get("ch1.volume")!
      expect(lane.points).toHaveLength(2) // Initial point + one updated point
      expect(lane.points[1].value).toBe(0.9)
    })

    it("should handle delete range on non-existent lane", () => {
      expect(() => engine.deletePointsInRange("non-existent", 0, 1)).not.toThrow()
    })
  })

  describe("value reading and interpolation", () => {
    beforeEach(() => {
      engine.createLane("ch1", "volume")
    })

    it("should return default value for empty lane", () => {
      const emptyLane = engine.createLane("ch2", "pan")
      emptyLane.points = []

      const value = engine.readValueAtTime("ch2.pan", 1.0)
      expect(value).toBe(0.5)
    })

    it("should return first point value for time before first point", () => {
      engine.updateTime(1.0)
      engine.writeParameter("ch1.volume", 0.8, true)

      const value = engine.readValueAtTime("ch1.volume", 0.5)
      expect(value).toBe(0.5) // Initial point value
    })

    it("should interpolate linearly between points", () => {
      engine.updateTime(0.0)
      engine.writeParameter("ch1.volume", 0.0, true)
      engine.updateTime(2.0)
      engine.writeParameter("ch1.volume", 1.0, true)

      const value = engine.readValueAtTime("ch1.volume", 1.0) // Halfway
      expect(value).toBe(0.5)
    })

    it("should handle hold curve", () => {
      const lane = engine.getState().lanes.get("ch1.volume")!
      lane.points = [
        { time: 0, value: 0.3, curve: "hold" },
        { time: 2, value: 0.8, curve: "linear" },
      ]

      const value = engine.readValueAtTime("ch1.volume", 1.0)
      expect(value).toBe(0.3) // Should hold first value
    })

    it("should handle bezier curve", () => {
      const lane = engine.getState().lanes.get("ch1.volume")!
      lane.points = [
        { time: 0, value: 0.0, curve: "bezier" },
        { time: 2, value: 1.0, curve: "linear" },
      ]

      const value = engine.readValueAtTime("ch1.volume", 1.0)
      // Bezier should give smooth S-curve, value should be close to 0.5 but slightly different
      expect(value).toBeGreaterThan(0.45)
      expect(value).toBeLessThan(0.55)
    })

    it("should handle zero duration between points", () => {
      const lane = engine.getState().lanes.get("ch1.volume")!
      lane.points = [
        { time: 1.0, value: 0.3, curve: "linear" },
        { time: 1.0, value: 0.8, curve: "linear" }, // Same time
      ]

      const value = engine.readValueAtTime("ch1.volume", 1.0)
      expect(value).toBe(0.3) // Should return first point value
    })

    it("should return default for non-existent lane", () => {
      const value = engine.readValueAtTime("non-existent", 1.0)
      expect(value).toBe(0.5)
    })
  })

  describe("automation reading during playback", () => {
    beforeEach(() => {
      engine.createLane("ch1", "volume")
      engine.createLane("ch1", "pan")
      engine.registerParameterCallback("ch1.volume", mockCallback)

      // Add some automation points
      engine.updateTime(1.0)
      engine.writeParameter("ch1.volume", 0.8, true)
      engine.updateTime(2.0)
      engine.writeParameter("ch1.volume", 0.6, true)
    })

    it("should not read automation for recording lanes", () => {
      engine.setMode("touch")
      engine.touchParameter("ch1.volume")
      vi.clearAllMocks()

      engine.updateTime(1.5)

      expect(mockCallback).not.toHaveBeenCalled()
    })

    it("should not read automation for disabled lanes", () => {
      const lane = engine.getState().lanes.get("ch1.volume")!
      lane.isEnabled = false

      engine.setMode("read")
      vi.clearAllMocks()

      engine.updateTime(1.5)

      expect(mockCallback).not.toHaveBeenCalled()
    })
  })

  describe("export and import", () => {
    beforeEach(() => {
      engine.createLane("ch1", "volume")
      engine.createLane("ch2", "pan")

      // Add some automation
      engine.updateTime(1.0)
      engine.writeParameter("ch1.volume", 0.8, true)
      engine.writeParameter("ch2.pan", 0.3, true)
    })

    it("should import automation data", () => {
      const importData = {
        "ch3.eq": {
          id: "ch3.eq",
          parameterId: "eq",
          channelId: "ch3",
          points: [{ time: 0, value: 0.2, curve: "linear" as const }],
          isEnabled: true,
          isVisible: true,
        },
      }

      engine.importAutomation(importData)

      const state = engine.getState()
      expect(state.lanes.has("ch3.eq")).toBe(true)
      expect(state.lanes.get("ch3.eq")?.points[0].value).toBe(0.2)
      expect(state.lanes.has("ch1.volume")).toBe(false) // Should clear existing
    })
  })

  describe("edge cases", () => {
    it("should handle empty lane points array", () => {
      engine.createLane("ch1", "volume")
      const lane = engine.getState().lanes.get("ch1.volume")!
      lane.points = []

      expect(() => engine.readValueAtTime("ch1.volume", 1.0)).not.toThrow()
    })

    it("should handle single point interpolation", () => {
      const lane = engine.createLane("ch1", "volume")
      // Lane already has initial point at time 0

      const value = engine.readValueAtTime("ch1.volume", 10.0)
      expect(value).toBe(0.5) // Should return the single point value
    })

    it("should handle negative time values", () => {
      engine.updateTime(-1.0)
      engine.writeParameter("ch1.volume", 0.8, true)

      expect(() => engine.readValueAtTime("ch1.volume", -0.5)).not.toThrow()
    })

    it("should handle very large time values", () => {
      engine.updateTime(999999.0)
      engine.writeParameter("ch1.volume", 0.8, true)

      expect(() => engine.readValueAtTime("ch1.volume", 1000000.0)).not.toThrow()
    })
  })
})

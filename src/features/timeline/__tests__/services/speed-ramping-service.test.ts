/**
 * Тесты для SpeedRampingService
 */

import { beforeEach, describe, expect, it } from "vitest"
import { SpeedRampingServiceImpl } from "../../services/speed-ramping-service"
import type { TimelineClip } from "../../types"
import type { SpeedRampingConfig } from "../../types/speed-ramping"
import { createSpeedKeyframe } from "../../types/speed-ramping"

describe("SpeedRampingService", () => {
  let service: SpeedRampingServiceImpl

  beforeEach(() => {
    service = new SpeedRampingServiceImpl()
  })

  it("should initialize with empty configs", () => {
    expect(service.getAllActiveConfigs()).toEqual({})
  })

  it("should initialize with provided configs", () => {
    const initialConfigs = {
      "clip-1": {
        enabled: true,
        keyframes: [],
        maintainPitch: true,
        minSpeed: 0.1,
        maxSpeed: 10.0,
        showGraph: true,
        graphHeight: 60,
        graphOpacity: 0.7,
      },
    }

    const serviceWithConfigs = new SpeedRampingServiceImpl(initialConfigs)
    expect(serviceWithConfigs.isSpeedRampingEnabled("clip-1")).toBe(true)
  })

  it("should return false for non-existent clip", () => {
    expect(service.isSpeedRampingEnabled("non-existent")).toBe(false)
  })

  it("should return 1.0 playback rate for non-existent clip", () => {
    expect(service.getPlaybackRateForTime("non-existent", 5)).toBe(1.0)
  })

  it("should return 1.0 playback rate for disabled speed ramping", () => {
    const config: SpeedRampingConfig = {
      enabled: false,
      keyframes: [createSpeedKeyframe(0, 0.5, "linear")],
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 10.0,
      showGraph: true,
      graphHeight: 60,
      graphOpacity: 0.7,
    }

    service.updateSpeedRampingConfig("clip-1", config)
    expect(service.getPlaybackRateForTime("clip-1", 5)).toBe(1.0)
  })

  it("should return correct playback rate for enabled speed ramping", () => {
    const config: SpeedRampingConfig = {
      enabled: true,
      keyframes: [
        createSpeedKeyframe(0, 1.0, "linear"),
        createSpeedKeyframe(5, 0.5, "linear"),
        createSpeedKeyframe(10, 2.0, "linear"),
      ],
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 10.0,
      showGraph: true,
      graphHeight: 60,
      graphOpacity: 0.7,
    }

    service.updateSpeedRampingConfig("clip-1", config)

    expect(service.getPlaybackRateForTime("clip-1", 0)).toBe(1.0)
    expect(service.getPlaybackRateForTime("clip-1", 5)).toBe(0.5)
    expect(service.getPlaybackRateForTime("clip-1", 10)).toBe(2.0)
  })

  it("should interpolate between keyframes", () => {
    const config: SpeedRampingConfig = {
      enabled: true,
      keyframes: [createSpeedKeyframe(0, 1.0, "linear"), createSpeedKeyframe(10, 2.0, "linear")],
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 10.0,
      showGraph: true,
      graphHeight: 60,
      graphOpacity: 0.7,
    }

    service.updateSpeedRampingConfig("clip-1", config)

    // Проверяем интерполяцию в середине
    const speedAt5 = service.getPlaybackRateForTime("clip-1", 5)
    expect(speedAt5).toBe(1.5) // Линейная интерполяция между 1.0 и 2.0
  })

  it("should get speed ramping config", () => {
    const config: SpeedRampingConfig = {
      enabled: true,
      keyframes: [],
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 10.0,
      showGraph: true,
      graphHeight: 60,
      graphOpacity: 0.7,
    }

    service.updateSpeedRampingConfig("clip-1", config)

    const retrievedConfig = service.getSpeedRampingConfig("clip-1")
    expect(retrievedConfig).toEqual(config)
  })

  it("should return null for non-existent config", () => {
    expect(service.getSpeedRampingConfig("non-existent")).toBeNull()
  })

  it("should calculate clip duration with speed ramping", () => {
    const clip: TimelineClip = {
      id: "clip-1",
      duration: 10,
      name: "Test Clip",
      startTime: 0,
      trackId: "track-1",
      mediaFile: undefined,
      offset: 0,
      playbackRate: 1.0,
      maintainPitch: true,
      effects: [],
      filters: [],
      transitions: [],
      isSelected: false,
      isLocked: false,
      audioOffset: 0,
      linkedClipId: undefined,
      isLinked: false,
      mediaId: "media-1",
      mediaStartTime: 0,
      mediaEndTime: 10,
      volume: 1.0,
      speed: 1.0,
      isReversed: false,
      opacity: 1.0,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      sourceIn: 0,
      sourceOut: 10,
      isMuted: false,
      position: { x: 0, y: 0, width: 100, height: 100, rotation: 0, scaleX: 1, scaleY: 1 },
    }

    // Без speed ramping должно возвращать оригинальную длительность
    expect(service.calculateClipDuration(clip)).toBe(10)

    // С speed ramping (0.5x скорость) должно удвоить длительность
    const config: SpeedRampingConfig = {
      enabled: true,
      keyframes: [createSpeedKeyframe(0, 0.5, "linear")],
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 10.0,
      showGraph: true,
      graphHeight: 60,
      graphOpacity: 0.7,
    }

    service.updateSpeedRampingConfig("clip-1", config)
    const newDuration = service.calculateClipDuration(clip)
    // Должно быть больше из-за замедления
    expect(newDuration).toBeGreaterThan(10)
  })

  it("should convert time with speed ramping", () => {
    const config: SpeedRampingConfig = {
      enabled: true,
      keyframes: [createSpeedKeyframe(0, 2.0, "linear")], // 2x скорость
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 10.0,
      showGraph: true,
      graphHeight: 60,
      graphOpacity: 0.7,
    }

    service.updateSpeedRampingConfig("clip-1", config)

    // С 2x скоростью время должно конвертироваться меньше
    const convertedTime = service.convertTimeWithSpeedRamping("clip-1", 10)
    expect(convertedTime).toBeLessThan(10)
  })

  it("should return only active configs", () => {
    const activeConfig: SpeedRampingConfig = {
      enabled: true,
      keyframes: [],
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 10.0,
      showGraph: true,
      graphHeight: 60,
      graphOpacity: 0.7,
    }

    const inactiveConfig: SpeedRampingConfig = {
      enabled: false,
      keyframes: [],
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 10.0,
      showGraph: true,
      graphHeight: 60,
      graphOpacity: 0.7,
    }

    service.updateSpeedRampingConfig("active-clip", activeConfig)
    service.updateSpeedRampingConfig("inactive-clip", inactiveConfig)

    const activeConfigs = service.getAllActiveConfigs()
    expect(activeConfigs).toHaveProperty("active-clip")
    expect(activeConfigs).not.toHaveProperty("inactive-clip")
  })

  it("should reset all configs", () => {
    const config: SpeedRampingConfig = {
      enabled: true,
      keyframes: [],
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 10.0,
      showGraph: true,
      graphHeight: 60,
      graphOpacity: 0.7,
    }

    service.updateSpeedRampingConfig("clip-1", config)
    expect(service.isSpeedRampingEnabled("clip-1")).toBe(true)

    service.resetAllConfigs()
    expect(service.isSpeedRampingEnabled("clip-1")).toBe(false)
    expect(service.getAllActiveConfigs()).toEqual({})
  })

  it("should update from timeline configs", () => {
    const configs = {
      "clip-1": {
        enabled: true,
        keyframes: [],
        maintainPitch: true,
        minSpeed: 0.1,
        maxSpeed: 10.0,
        showGraph: true,
        graphHeight: 60,
        graphOpacity: 0.7,
      },
      "clip-2": {
        enabled: false,
        keyframes: [],
        maintainPitch: true,
        minSpeed: 0.1,
        maxSpeed: 10.0,
        showGraph: true,
        graphHeight: 60,
        graphOpacity: 0.7,
      },
    }

    service.updateFromTimelineConfigs(configs)

    expect(service.isSpeedRampingEnabled("clip-1")).toBe(true)
    expect(service.isSpeedRampingEnabled("clip-2")).toBe(false)
  })

  it("should get configs for timeline", () => {
    const config: SpeedRampingConfig = {
      enabled: true,
      keyframes: [],
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 10.0,
      showGraph: true,
      graphHeight: 60,
      graphOpacity: 0.7,
    }

    service.updateSpeedRampingConfig("clip-1", config)

    const configs = service.getConfigsForTimeline()
    expect(configs).toHaveProperty("clip-1")
    expect(configs["clip-1"]).toEqual(config)
  })
})

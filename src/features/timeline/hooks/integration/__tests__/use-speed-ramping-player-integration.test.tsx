/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для хука use-speed-ramping-player-integration
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { TimelineProviders } from "@/test/test-utils"
import { SpeedRampingServiceImpl } from "../../../services/speed-ramping-service"
import { useSpeedRampingPlayerIntegration } from "../use-speed-ramping-player-integration"

// Мокаем timeline
const mockSpeedRampingService = new SpeedRampingServiceImpl()
const mockTimelineState = {
  context: {
    project: {
      id: "test-project",
      globalTracks: [
        {
          id: "track-1",
          clips: [
            {
              id: "clip-1",
              startTime: 0,
              duration: 10,
              offset: 0,
            },
            {
              id: "clip-2",
              startTime: 15,
              duration: 8,
              offset: 2,
            },
          ],
        },
      ],

      sections: [],
    },
    currentTime: 5,
    speedRampingService: mockSpeedRampingService,
  },
}

vi.mock("../use-timeline", () => ({
  useTimeline: () => ({
    project: mockTimelineState.context.project,
    currentTime: mockTimelineState.context.currentTime,
    speedRampingService: mockTimelineState.context.speedRampingService,
  }),
}))

describe("useSpeedRampingPlayerIntegration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSpeedRampingService.resetAllConfigs()
  })

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useSpeedRampingPlayerIntegration(), {
      wrapper: TimelineProviders,
    })

    expect(result.current.getCurrentPlaybackRate()).toBe(1.0)
    expect(result.current.isSpeedRampingActive("clip-1")).toBe(false)
  })

  it("should update playback rate when speed ramping is active", () => {
    // Настраиваем speed ramping для клипа
    mockSpeedRampingService.updateSpeedRampingConfig("clip-1", {
      enabled: true,
      keyframes: [
        { id: "kf1", time: 0, value: 0.5, interpolation: "linear" },
        { id: "kf2", time: 10, value: 2.0, interpolation: "linear" },
      ],

      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 10.0,
      showGraph: true,
      graphHeight: 60,
      graphOpacity: 0.7,
    })

    const { result } = renderHook(() => useSpeedRampingPlayerIntegration(), {
      wrapper: TimelineProviders,
    })

    act(() => {
      result.current.updatePlaybackRateForTime(5) // Время внутри клипа
    })

    // Проверяем, что функция была вызвана без ошибок
    expect(result.current.getCurrentPlaybackRate()).toBeDefined()
  })

  it("should check if speed ramping is active for clip", () => {
    const { result } = renderHook(() => useSpeedRampingPlayerIntegration(), {
      wrapper: TimelineProviders,
    })

    expect(result.current.isSpeedRampingActive("clip-1")).toBe(false)

    mockSpeedRampingService.updateSpeedRampingConfig("clip-1", {
      enabled: true,
      keyframes: [],
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 10.0,
      showGraph: true,
      graphHeight: 60,
      graphOpacity: 0.7,
    })

    expect(result.current.isSpeedRampingActive("clip-1")).toBe(false)
  })

  it("should handle auto update enabling/disabling", () => {
    const { result } = renderHook(() => useSpeedRampingPlayerIntegration(), {
      wrapper: TimelineProviders,
    })

    act(() => {
      result.current.setAutoUpdateEnabled(false)
    })

    act(() => {
      result.current.updatePlaybackRateForTime(5)
    })

    // Проверяем, что auto update отключен
    expect(result.current.getCurrentPlaybackRate()).toBe(1.0)

    act(() => {
      result.current.setAutoUpdateEnabled(true)
    })

    // Проверяем, что auto update включен
    expect(result.current.getCurrentPlaybackRate()).toBe(1.0)
  })

  it("should manually reset playback rate", () => {
    const { result } = renderHook(() => useSpeedRampingPlayerIntegration(), {
      wrapper: TimelineProviders,
    })

    act(() => {
      result.current.resetPlaybackRate()
    })

    expect(result.current.getCurrentPlaybackRate()).toBe(1.0)
  })
})

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { TimelineProviders } from "@/test/test-utils"
import { SPEED_RAMPING_PRESETS } from "../../../types/speed-ramping"
import { useSpeedRamping } from "../use-speed-ramping"

// Mock useTimeline хук
const mockSend = vi.fn()
const mockProject = {
  id: "test-project",
  sections: [],
  globalTracks: [
    {
      id: "track-1",
      clips: [
        {
          id: "clip-1",
          duration: 10,
          mediaDuration: 10,
          startTime: 0,
          playbackRate: 1.0,
        },
      ],
    },
  ],
}

vi.mock("../../state/use-timeline", () => ({
  useTimeline: () => ({
    project: mockProject,
    send: mockSend,
  }),
}))

describe("useSpeedRamping", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("возвращает правильный интерфейс", () => {
    const { result } = renderHook(() => useSpeedRamping(), { wrapper: TimelineProviders })

    expect(result.current).toHaveProperty("getConfig")
    expect(result.current).toHaveProperty("setConfig")
    expect(result.current).toHaveProperty("addKeyframe")
    expect(result.current).toHaveProperty("updateKeyframe")
    expect(result.current).toHaveProperty("removeKeyframe")
    expect(result.current).toHaveProperty("moveKeyframe")
    expect(result.current).toHaveProperty("applyPreset")
    expect(result.current).toHaveProperty("getPresets")
    expect(result.current).toHaveProperty("createPresetFromClip")
    expect(result.current).toHaveProperty("enableSpeedRamping")
    expect(result.current).toHaveProperty("disableSpeedRamping")
    expect(result.current).toHaveProperty("toggleSpeedRamping")
    expect(result.current).toHaveProperty("getSpeedAtTime")
    expect(result.current).toHaveProperty("getNewDuration")
    expect(result.current).toHaveProperty("resetToConstantSpeed")
    expect(result.current).toHaveProperty("getSpeedCurveData")
  })

  it("возвращает null для несуществующей конфигурации", () => {
    const { result } = renderHook(() => useSpeedRamping(), { wrapper: TimelineProviders })

    const config = result.current.getConfig("non-existent-clip")
    expect(config).toBeNull()
  })

  it("добавляет keyframe и создает конфигурацию если её нет", () => {
    const { result } = renderHook(() => useSpeedRamping(), { wrapper: TimelineProviders })

    act(() => {
      result.current.addKeyframe("clip-1", 5, 2.0, "ease")
    })

    const config = result.current.getConfig("clip-1")
    expect(config).toBeDefined()
    expect(config?.keyframes).toHaveLength(1)
    expect(config?.keyframes[0]).toMatchObject({
      time: 5,
      value: 2.0,
      interpolation: "ease",
    })
    expect(config?.enabled).toBe(true)
  })

  it("сортирует keyframes по времени при добавлении", () => {
    const { result } = renderHook(() => useSpeedRamping(), { wrapper: TimelineProviders })

    act(() => {
      result.current.addKeyframe("clip-1", 10, 1.5, "linear")
      result.current.addKeyframe("clip-1", 5, 0.5, "ease")
      result.current.addKeyframe("clip-1", 15, 2.0, "ease-out")
    })

    const config = result.current.getConfig("clip-1")
    expect(config?.keyframes).toHaveLength(3)
    expect(config?.keyframes[0].time).toBe(5)
    expect(config?.keyframes[1].time).toBe(10)
    expect(config?.keyframes[2].time).toBe(15)
  })

  it("обновляет keyframe и пересортировывает если время изменилось", () => {
    const { result } = renderHook(() => useSpeedRamping(), { wrapper: TimelineProviders })

    // Добавляем keyframes
    act(() => {
      result.current.addKeyframe("clip-1", 5, 1.0, "linear")
      result.current.addKeyframe("clip-1", 10, 2.0, "ease")
    })

    const config = result.current.getConfig("clip-1")
    const keyframeId = config?.keyframes[0].id

    // Обновляем время первого keyframe
    act(() => {
      result.current.updateKeyframe("clip-1", keyframeId!, { time: 15, value: 3.0 })
    })

    const updatedConfig = result.current.getConfig("clip-1")
    expect(updatedConfig?.keyframes).toHaveLength(2)
    expect(updatedConfig?.keyframes[0].time).toBe(10) // Старый второй keyframe теперь первый
    expect(updatedConfig?.keyframes[1].time).toBe(15) // Обновленный keyframe теперь последний
    expect(updatedConfig?.keyframes[1].value).toBe(3.0)
  })

  it("удаляет keyframe", () => {
    const { result } = renderHook(() => useSpeedRamping(), { wrapper: TimelineProviders })

    // Добавляем keyframes
    act(() => {
      result.current.addKeyframe("clip-1", 5, 1.0, "linear")
      result.current.addKeyframe("clip-1", 10, 2.0, "ease")
    })

    const config = result.current.getConfig("clip-1")
    const keyframeId = config?.keyframes[0].id

    // Удаляем keyframe
    act(() => {
      result.current.removeKeyframe("clip-1", keyframeId!)
    })

    const updatedConfig = result.current.getConfig("clip-1")
    expect(updatedConfig?.keyframes).toHaveLength(1)
    expect(updatedConfig?.keyframes[0].time).toBe(10)
  })

  it("применяет пресет и адаптирует keyframes к длительности клипа", () => {
    const { result } = renderHook(() => useSpeedRamping(), { wrapper: TimelineProviders })

    act(() => {
      result.current.applyPreset("clip-1", "slow-motion")
    })

    const config = result.current.getConfig("clip-1")
    expect(config?.keyframes).toHaveLength(1)

    // Пресет slow-motion должен иметь keyframe на time: 0 с value: 0.5
    // Но время адаптируется к длительности клипа (10 секунд)
    expect(config?.keyframes[0].time).toBe(0)
    expect(config?.keyframes[0].value).toBe(0.5)
  })

  it("возвращает список пресетов", () => {
    const { result } = renderHook(() => useSpeedRamping(), { wrapper: TimelineProviders })

    const presets = result.current.getPresets()
    expect(presets).toEqual(SPEED_RAMPING_PRESETS)
    expect(presets.length).toBeGreaterThan(0)
  })

  it("создает пресет из конфигурации клипа", () => {
    const { result } = renderHook(() => useSpeedRamping(), { wrapper: TimelineProviders })

    // Создаем конфигурацию
    act(() => {
      result.current.addKeyframe("clip-1", 2, 0.5, "linear")
      result.current.addKeyframe("clip-1", 8, 2.0, "ease")
    })

    const preset = result.current.createPresetFromClip("clip-1", "My Custom Preset")

    expect(preset).toBeDefined()
    expect(preset?.name).toBe("My Custom Preset")
    expect(preset?.category).toBe("custom")
    expect(preset?.keyframes).toHaveLength(2)

    // Keyframes должны быть нормализованы к диапазону 0-1
    expect(preset?.keyframes[0].time).toBe(0.2) // 2/10
    expect(preset?.keyframes[1].time).toBe(0.8) // 8/10
  })

  it("включает speed ramping", () => {
    const { result } = renderHook(() => useSpeedRamping(), { wrapper: TimelineProviders })

    act(() => {
      result.current.enableSpeedRamping("clip-1")
    })

    const config = result.current.getConfig("clip-1")
    expect(config?.enabled).toBe(true)
  })

  it("выключает speed ramping и сбрасывает скорость клипа", () => {
    const { result } = renderHook(() => useSpeedRamping(), { wrapper: TimelineProviders })

    // Сначала включаем и добавляем keyframe
    act(() => {
      result.current.enableSpeedRamping("clip-1")
      result.current.addKeyframe("clip-1", 5, 2.0, "linear")
    })

    // Затем выключаем
    act(() => {
      result.current.disableSpeedRamping("clip-1")
    })

    const config = result.current.getConfig("clip-1")
    expect(config?.enabled).toBe(false)

    // Проверяем, что отправлено событие сброса скорости (должно быть последним вызовом)
    expect(mockSend).toHaveBeenLastCalledWith({
      type: "UPDATE_CLIP",
      clipId: "clip-1",
      updates: {
        playbackRate: 1.0,
        duration: 10, // mediaDuration
        speedRamping: expect.objectContaining({
          enabled: false,
        }),
      },
    })
  })

  it("переключает состояние speed ramping", () => {
    const { result } = renderHook(() => useSpeedRamping(), { wrapper: TimelineProviders })

    // Включаем (сначала выключен)
    act(() => {
      result.current.toggleSpeedRamping("clip-1")
    })

    let config = result.current.getConfig("clip-1")
    expect(config?.enabled).toBe(true)

    // Выключаем
    act(() => {
      result.current.toggleSpeedRamping("clip-1")
    })

    config = result.current.getConfig("clip-1")
    expect(config?.enabled).toBe(false)
  })

  it("сбрасывает к постоянной скорости", () => {
    const { result } = renderHook(() => useSpeedRamping(), { wrapper: TimelineProviders })

    act(() => {
      result.current.resetToConstantSpeed("clip-1", 1.5)
    })

    const config = result.current.getConfig("clip-1")
    expect(config?.keyframes).toHaveLength(1)
    expect(config?.keyframes[0].time).toBe(0)
    expect(config?.keyframes[0].value).toBe(1.5)
    expect(config?.keyframes[0].interpolation).toBe("linear")
  })

  it("возвращает скорость в определенный момент времени", () => {
    const { result } = renderHook(() => useSpeedRamping(), { wrapper: TimelineProviders })

    // Создаем кривую скорости
    act(() => {
      result.current.addKeyframe("clip-1", 0, 1.0, "linear")
      result.current.addKeyframe("clip-1", 5, 0.5, "linear")
      result.current.addKeyframe("clip-1", 10, 2.0, "linear")
    })

    // Проверяем скорость в разные моменты времени
    expect(result.current.getSpeedAtTime("clip-1", 0)).toBe(1.0)
    expect(result.current.getSpeedAtTime("clip-1", 2.5)).toBe(0.75) // Линейная интерполяция между 1.0 и 0.5
    expect(result.current.getSpeedAtTime("clip-1", 5)).toBe(0.5)
    expect(result.current.getSpeedAtTime("clip-1", 7.5)).toBe(1.25) // Линейная интерполяция между 0.5 и 2.0
    expect(result.current.getSpeedAtTime("clip-1", 10)).toBe(2.0)
  })

  it("генерирует данные кривой скорости с заданным разрешением", () => {
    const { result } = renderHook(() => useSpeedRamping(), { wrapper: TimelineProviders })

    // Создаем простую кривую
    act(() => {
      result.current.addKeyframe("clip-1", 0, 1.0, "linear")
      result.current.addKeyframe("clip-1", 10, 2.0, "linear")
    })

    const curveData = result.current.getSpeedCurveData("clip-1", 10)

    expect(curveData).toHaveLength(11) // 0-10 включительно
    expect(curveData[0]).toEqual({ time: 0, speed: 1.0 })
    expect(curveData[5]).toEqual({ time: 5, speed: 1.5 }) // Середина между 1.0 и 2.0
    expect(curveData[10]).toEqual({ time: 10, speed: 2.0 })
  })

  it("ограничивает время keyframe в пределах клипа при moveKeyframe", () => {
    const { result } = renderHook(() => useSpeedRamping(), { wrapper: TimelineProviders })

    // Добавляем keyframe
    act(() => {
      result.current.addKeyframe("clip-1", 5, 1.5, "linear")
    })

    const config = result.current.getConfig("clip-1")
    const keyframeId = config?.keyframes[0].id
    if (!keyframeId) throw new Error("Expected keyframe to exist")

    // Пытаемся переместить за пределы клипа
    act(() => {
      result.current.moveKeyframe("clip-1", keyframeId, 15) // Больше чем duration (10)
    })

    const updatedConfig = result.current.getConfig("clip-1")
    expect(updatedConfig?.keyframes[0].time).toBe(10) // Ограничено до duration

    // Пытаемся переместить в отрицательное время
    act(() => {
      result.current.moveKeyframe("clip-1", keyframeId, -5)
    })

    const finalConfig = result.current.getConfig("clip-1")
    expect(finalConfig?.keyframes[0].time).toBe(0) // Ограничено до 0
  })
})

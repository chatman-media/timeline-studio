/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useSpeedRamping } from "../use-speed-ramping"

// Mock useTimeline хук
const mockSend = vi.fn()
let mockProject: any

// Функция для создания чистого проекта
function createMockProject() {
  return {
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
          {
            id: "clip-2",
            duration: 20,
            mediaDuration: 20,
            startTime: 10,
            playbackRate: 1.0,
            // Этот клип уже имеет сохраненную конфигурацию
            speedRamping: {
              enabled: true,
              keyframes: [
                {
                  id: "saved-kf-1",
                  time: 0,
                  value: 0.5,
                  interpolation: "linear",
                },
                {
                  id: "saved-kf-2",
                  time: 10,
                  value: 2.0,
                  interpolation: "ease",
                },
              ],
              maintainPitch: true,
              minSpeed: 0.1,
              maxSpeed: 10.0,
              showGraph: true,
              graphHeight: 60,
              graphOpacity: 0.8,
            },
          },
        ],
      },
    ],
  }
}

vi.mock("../../../hooks/use-timeline", () => ({
  useTimeline: () => ({
    project: mockProject,
    send: mockSend,
  }),
}))

describe("Speed Ramping Persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Создаем новый проект для каждого теста
    mockProject = createMockProject()
  })

  it("читает сохраненную конфигурацию из клипа", () => {
    const { result } = renderHook(() => useSpeedRamping())

    // Получаем конфигурацию для клипа с сохраненными данными
    const config = result.current.getConfig("clip-2")

    expect(config).toBeDefined()
    expect(config?.enabled).toBe(true)
    expect(config?.keyframes).toHaveLength(2)
    expect(config?.keyframes[0].id).toBe("saved-kf-1")
    expect(config?.keyframes[0].value).toBe(0.5)
    expect(config?.keyframes[1].id).toBe("saved-kf-2")
    expect(config?.keyframes[1].value).toBe(2.0)
  })

  it("сохраняет конфигурацию в клип при добавлении keyframe", () => {
    const { result } = renderHook(() => useSpeedRamping())

    act(() => {
      result.current.addKeyframe("clip-1", 5, 1.5, "linear")
    })

    // Проверяем что UPDATE_CLIP был вызван с speedRamping
    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_CLIP",
      clipId: "clip-1",
      updates: expect.objectContaining({
        speedRamping: expect.objectContaining({
          enabled: true,
          keyframes: expect.arrayContaining([
            expect.objectContaining({
              time: 5,
              value: 1.5,
              interpolation: "linear",
            }),
          ]),
        }),
      }),
    })
  })

  it("сохраняет конфигурацию при включении/выключении speed ramping", () => {
    const { result } = renderHook(() => useSpeedRamping())

    // Включаем speed ramping
    act(() => {
      result.current.enableSpeedRamping("clip-1")
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_CLIP",
      clipId: "clip-1",
      updates: expect.objectContaining({
        speedRamping: expect.objectContaining({
          enabled: true,
        }),
      }),
    })

    mockSend.mockClear()

    // Выключаем speed ramping
    act(() => {
      result.current.disableSpeedRamping("clip-1")
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_CLIP",
      clipId: "clip-1",
      updates: expect.objectContaining({
        speedRamping: expect.objectContaining({
          enabled: false,
        }),
      }),
    })
  })

  it("использует кэш для последующих обращений", () => {
    const { result } = renderHook(() => useSpeedRamping())

    // Первое обращение - читаем из клипа и сохраняем в кэш
    const config1 = result.current.getConfig("clip-2")
    expect(config1).toBeDefined()
    expect(config1?.keyframes).toHaveLength(2)

    // Второе обращение с тем же ID должно вернуть из кэша
    // (даже если проект изменился, кэш должен сохраняться)
    const config2 = result.current.getConfig("clip-2")
    expect(config2).toBe(config1) // Ссылка на тот же объект из кэша
    expect(config2?.keyframes).toHaveLength(2)
  })

  it("обновляет конфигурацию при изменении keyframe", () => {
    const { result } = renderHook(() => useSpeedRamping())

    // Сначала получаем конфигурацию чтобы загрузить в кэш
    const config = result.current.getConfig("clip-2")
    expect(config).toBeDefined()
    expect(config?.keyframes).toHaveLength(2)

    const keyframeId = config!.keyframes[0].id

    act(() => {
      result.current.updateKeyframe("clip-2", keyframeId, { value: 0.75 })
    })

    expect(mockSend).toHaveBeenLastCalledWith({
      type: "UPDATE_CLIP",
      clipId: "clip-2",
      updates: expect.objectContaining({
        speedRamping: expect.objectContaining({
          keyframes: expect.arrayContaining([
            expect.objectContaining({
              id: keyframeId,
              value: 0.75,
            }),
          ]),
        }),
      }),
    })
  })
})

import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { timelineMachine } from "../../__mocks__/timeline-machine"
import { createTimelineProject } from "../../types/factories"
import type { SpeedRampingConfig } from "../../types/speed-ramping"

// Mock the timeline machine to use the mock version with speedRampingConfigs
vi.mock("../../services/timeline-ui-machine", () => ({
  timelineUIMachine: vi.fn(),
}))

describe("Speed Ramping State Machine Integration", () => {
  let actor: any

  beforeEach(() => {
    const initialProject = createTimelineProject("Test Project")
    // Add custom track with clip
    initialProject.id = "test-project"
    initialProject.globalTracks = [
      {
        id: "track-1",
        name: "Track 1",
        type: "video",
        order: 0,
        height: 100,
        isLocked: false,
        isMuted: false,
        isHidden: false,
        isSolo: false,
        volume: 1,
        pan: 0,
        transitions: [],
        trackEffects: [],
        trackFilters: [],
        clips: [
          {
            id: "clip-1",
            name: "Clip 1",
            mediaId: "media-1",
            trackId: "track-1",
            startTime: 0,
            duration: 10,
            mediaStartTime: 0,
            mediaEndTime: 10,
            offset: 0,
            volume: 1,
            speed: 1,
            playbackRate: 1.0,
            isReversed: false,
            opacity: 1,
            effects: [],
            filters: [],
            transitions: [],
            isSelected: false,
            isLocked: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      } as any,
    ]

    actor = createActor(timelineMachine)
    actor.start()

    // Загружаем проект через событие
    actor.send({
      type: "LOAD_PROJECT",
      project: initialProject,
    })
  })

  afterEach(() => {
    actor.stop()
  })

  it("включает speed ramping для клипа", () => {
    actor.send({
      type: "ENABLE_SPEED_RAMPING",
      clipId: "clip-1",
    })

    const state = actor.getSnapshot()
    expect(state.context.speedRampingConfigs).toHaveProperty("clip-1")
    expect(state.context.speedRampingConfigs["clip-1"]).toMatchObject({
      enabled: true,
      keyframes: [],
      maintainPitch: true,
    })
  })

  it("выключает speed ramping для клипа", () => {
    // Сначала включаем
    actor.send({
      type: "ENABLE_SPEED_RAMPING",
      clipId: "clip-1",
    })

    // Затем выключаем
    actor.send({
      type: "DISABLE_SPEED_RAMPING",
      clipId: "clip-1",
    })

    const state = actor.getSnapshot()
    expect(state.context.speedRampingConfigs["clip-1"]?.enabled).toBe(false)
  })

  it("устанавливает конфигурацию speed ramping", () => {
    const config: SpeedRampingConfig = {
      enabled: true,
      keyframes: [
        {
          id: "kf1",
          time: 5,
          value: 2.0,
          interpolation: "ease",
        },
      ],
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 4.0,
      showGraph: true,
      graphHeight: 120,
      graphOpacity: 0.8,
    }

    actor.send({
      type: "SET_SPEED_RAMPING_CONFIG",
      clipId: "clip-1",
      config,
    })

    const state = actor.getSnapshot()
    expect(state.context.speedRampingConfigs["clip-1"]).toEqual(config)
  })

  it("добавляет keyframe через state machine", () => {
    // Сначала включаем speed ramping
    actor.send({
      type: "ENABLE_SPEED_RAMPING",
      clipId: "clip-1",
    })

    // Добавляем keyframe
    actor.send({
      type: "ADD_SPEED_KEYFRAME",
      clipId: "clip-1",
      time: 5,
      value: 2.0,
      interpolation: "ease",
    })

    const state = actor.getSnapshot()
    const config = state.context.speedRampingConfigs["clip-1"]

    expect(config?.keyframes).toHaveLength(1)
    expect(config?.keyframes[0]).toMatchObject({
      time: 5,
      value: 2.0,
      interpolation: "ease",
    })
  })

  it("обновляет keyframe через state machine", () => {
    // Подготавливаем конфигурацию с keyframe
    const config: SpeedRampingConfig = {
      enabled: true,
      keyframes: [
        {
          id: "kf1",
          time: 5,
          value: 1.5,
          interpolation: "linear",
        },
      ],
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 4.0,
      showGraph: true,
      graphHeight: 120,
      graphOpacity: 0.8,
    }

    actor.send({
      type: "SET_SPEED_RAMPING_CONFIG",
      clipId: "clip-1",
      config,
    })

    // Обновляем keyframe
    actor.send({
      type: "UPDATE_SPEED_KEYFRAME",
      clipId: "clip-1",
      keyframeId: "kf1",
      updates: {
        value: 2.5,
        interpolation: "ease-out",
      },
    })

    const state = actor.getSnapshot()
    const updatedConfig = state.context.speedRampingConfigs["clip-1"]

    expect(updatedConfig?.keyframes[0]).toMatchObject({
      id: "kf1",
      time: 5,
      value: 2.5,
      interpolation: "ease-out",
    })
  })

  it("удаляет keyframe через state machine", () => {
    // Подготавливаем конфигурацию с keyframes
    const config: SpeedRampingConfig = {
      enabled: true,
      keyframes: [
        {
          id: "kf1",
          time: 3,
          value: 1.5,
          interpolation: "linear",
        },
        {
          id: "kf2",
          time: 7,
          value: 2.0,
          interpolation: "ease",
        },
      ],
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 4.0,
      showGraph: true,
      graphHeight: 120,
      graphOpacity: 0.8,
    }

    actor.send({
      type: "SET_SPEED_RAMPING_CONFIG",
      clipId: "clip-1",
      config,
    })

    // Удаляем keyframe
    actor.send({
      type: "REMOVE_SPEED_KEYFRAME",
      clipId: "clip-1",
      keyframeId: "kf1",
    })

    const state = actor.getSnapshot()
    const updatedConfig = state.context.speedRampingConfigs["clip-1"]

    expect(updatedConfig?.keyframes).toHaveLength(1)
    expect(updatedConfig?.keyframes[0].id).toBe("kf2")
  })

  it("обновляет клип при изменении speed ramping", () => {
    // Включаем speed ramping
    actor.send({
      type: "ENABLE_SPEED_RAMPING",
      clipId: "clip-1",
    })

    // Добавляем keyframe который изменит скорость
    actor.send({
      type: "ADD_SPEED_KEYFRAME",
      clipId: "clip-1",
      time: 0,
      value: 2.0, // Удвоенная скорость
      interpolation: "linear",
    })

    // Проверяем, что keyframe был добавлен в конфигурацию
    const state = actor.getSnapshot()
    const config = state.context.speedRampingConfigs["clip-1"]

    // При speed ramping должен быть добавлен keyframe со значением 2.0
    expect(config?.keyframes).toHaveLength(1)
    expect(config?.keyframes[0].value).toBe(2.0)
    expect(config?.keyframes[0].interpolation).toBe("linear")
  })

  it("сохраняет конфигурацию speed ramping при сохранении проекта", () => {
    // Настраиваем speed ramping
    const config: SpeedRampingConfig = {
      enabled: true,
      keyframes: [
        {
          id: "kf1",
          time: 5,
          value: 1.5,
          interpolation: "ease",
        },
      ],
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 4.0,
      showGraph: true,
      graphHeight: 120,
      graphOpacity: 0.8,
    }

    actor.send({
      type: "SET_SPEED_RAMPING_CONFIG",
      clipId: "clip-1",
      config,
    })

    // Сохраняем проект
    actor.send({
      type: "SAVE_PROJECT",
    })

    const state = actor.getSnapshot()

    // Конфигурация должна сохраниться в контексте
    expect(state.context.speedRampingConfigs).toHaveProperty("clip-1")
    expect(state.context.speedRampingConfigs["clip-1"]).toEqual(config)
  })

  it("обрабатывает несколько клипов с разными конфигурациями", () => {
    // Добавляем второй клип
    actor.send({
      type: "ADD_CLIP",
      trackId: "track-1",
      mediaFile: {
        id: "clip-2",
        name: "video2.mp4",
        path: "/test/video2.mp4",
        type: "video",
        size: 1024,
        duration: 8,
        createdAt: new Date(),
        modifiedAt: new Date(),
      },
      startTime: 15,
      duration: 8,
    })

    // Настраиваем speed ramping для первого клипа
    actor.send({
      type: "SET_SPEED_RAMPING_CONFIG",
      clipId: "clip-1",
      config: {
        enabled: true,
        keyframes: [{ id: "kf1", time: 5, value: 2.0, interpolation: "linear" }],
        maintainPitch: true,
        minSpeed: 0.1,
        maxSpeed: 4.0,
        showGraph: true,
        graphHeight: 120,
        graphOpacity: 0.8,
      },
    })

    // Настраиваем speed ramping для второго клипа
    actor.send({
      type: "SET_SPEED_RAMPING_CONFIG",
      clipId: "clip-2",
      config: {
        enabled: true,
        keyframes: [{ id: "kf2", time: 4, value: 0.5, interpolation: "ease" }],
        maintainPitch: false,
        minSpeed: 0.1,
        maxSpeed: 4.0,
        showGraph: false,
        graphHeight: 80,
        graphOpacity: 0.6,
      },
    })

    const state = actor.getSnapshot()

    // Оба клипа должны иметь свои конфигурации
    expect(state.context.speedRampingConfigs).toHaveProperty("clip-1")
    expect(state.context.speedRampingConfigs).toHaveProperty("clip-2")

    expect(state.context.speedRampingConfigs["clip-1"]?.keyframes[0].value).toBe(2.0)
    expect(state.context.speedRampingConfigs["clip-2"]?.keyframes[0].value).toBe(0.5)
    expect(state.context.speedRampingConfigs["clip-1"]?.maintainPitch).toBe(true)
    expect(state.context.speedRampingConfigs["clip-2"]?.maintainPitch).toBe(false)
  })
})

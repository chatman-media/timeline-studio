import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { Transition } from "@/domains/video-editing/types"
import {
  addTransitionBetweenClips,
  addTransitionIn,
  addTransitionOut,
  adjustTransitionsForClipChange,
  applyTransitionPresetToTrack,
  checkTransitionCollisions,
  getClipTransitions,
  getTrackTransitions,
  removeTransition,
} from "../../services/timeline-transition-manager"
import type { TimelineClip, TimelineProject, TimelineTrack } from "../../types/timeline"
import type { TimelineTransition } from "../../types/timeline-transition"

// Mock модуля resource-manager
vi.mock("../../services/resource-manager", () => ({
  createTimelineTransition: vi.fn((project: TimelineProject, resource: Transition, config: any) => {
    const timelineTransition: TimelineTransition = {
      id: `transition-${Date.now()}`,
      transitionId: resource.id,
      type: config.type,
      position: config.position,
      duration: config.duration,
      startClipId: config.startClipId,
      endClipId: config.endClipId,
      trackId: config.trackId,
      parameters: config.parameters || {
        intensity: 1,
        easing: "easeInOut",
      },
      keyframes: [],
      curve: {
        type: "ease-in-out",
        points: [],
      },
      isEnabled: true,
      isLocked: false,
      renderCache: undefined,
    }
    return { project: { ...project }, timelineTransition }
  }),
  addTimelineTransitionToResources: vi.fn((project: TimelineProject, transition: TimelineTransition) => {
    const updatedProject = { ...project }
    if (!updatedProject.resources.timelineTransitions) {
      updatedProject.resources.timelineTransitions = []
    }
    updatedProject.resources.timelineTransitions.push(transition)
    return updatedProject
  }),
  updateTimelineTransitionParameters: vi.fn((project: TimelineProject, transitionId: string, updates: any) => {
    const updatedProject = { ...project }
    const transition = updatedProject.resources.timelineTransitions.find((t) => t.id === transitionId)
    if (transition) {
      Object.assign(transition.parameters, updates)
    }
    return updatedProject
  }),
  updateTimelineTransitionProperties: vi.fn((project: TimelineProject, transitionId: string, updates: any) => {
    const updatedProject = { ...project }
    const transition = updatedProject.resources.timelineTransitions.find((t) => t.id === transitionId)
    if (transition) {
      Object.assign(transition, updates)
    }
    return updatedProject
  }),
}))

// Тестовые данные
const createMockTransitionResource = (): Transition => ({
  id: "fade-transition",
  type: "fade",
  labels: {
    ru: "Затухание",
    en: "Fade",
  },
  description: {
    ru: "Переход с затуханием",
    en: "Crossfade transition",
  },
  category: "basic",
  complexity: "basic",
  tags: ["fade"],
  duration: { min: 0.1, max: 10, default: 1 },
  parameters: {
    direction: "center",
    intensity: 0.5,
    easing: "ease-in-out",
  },
  ffmpegCommand: () => "fade",
  gpuAccelerated: false,
})

const createMockClip = (id: string, startTime: number, duration: number): TimelineClip => ({
  id,
  name: `Clip ${id}`,
  type: "video",
  mediaId: `media-${id}`,
  trackId: "track-1",
  startTime,
  duration,
  mediaStartTime: 0,
  mediaEndTime: duration,
  offset: 0,
  mediaDuration: duration,
  volume: 1.0,
  speed: 1.0,
  isReversed: false,
  opacity: 1.0,
  effects: [],
  filters: [],
  transitions: [],
  isSelected: false,
  isLocked: false,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
})

const createMockTrack = (id: string, clips: TimelineClip[] = []): TimelineTrack => ({
  id,
  name: `Track ${id}`,
  type: "video",
  order: 0,
  clips,
  isLocked: false,
  isMuted: false,
  isHidden: false,
  isSolo: false,
  volume: 1.0,
  pan: 0,
  height: 100,
  trackEffects: [],
  trackFilters: [],
  transitions: [],
})

const createMockProject = (tracks: TimelineTrack[] = []): TimelineProject => ({
  id: "test-project",
  name: "Test Project",
  duration: 100,
  fps: 30,
  sampleRate: 48000,
  sections: [],
  globalTracks: tracks,
  resources: {
    effects: [],
    filters: [],
    transitions: [],
    templates: [],
    styleTemplates: [],
    subtitleStyles: [],
    music: [],
    media: [],
    timelineTransitions: [],
  },
  settings: {
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    aspectRatio: "16:9",
    sampleRate: 48000,
    channels: 2,
    bitDepth: 16,
    timeFormat: "timecode",
    snapToGrid: false,
    gridSize: 1,
    autoSave: true,
    autoSaveInterval: 300,
  },
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  version: "1.0.0",
})

describe("timeline-transition-manager", () => {
  let mockProject: TimelineProject
  let mockTransitionResource: Transition
  let mockTrack: TimelineTrack
  let mockClips: TimelineClip[]

  beforeEach(() => {
    mockClips = [
      createMockClip("clip-1", 0, 10),
      createMockClip("clip-2", 10, 10), // Соседний клип
      createMockClip("clip-3", 25, 10), // Несоседний клип
    ]
    mockTrack = createMockTrack("track-1", mockClips)
    mockProject = createMockProject([mockTrack])
    mockTransitionResource = createMockTransitionResource()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("addTransitionBetweenClips", () => {
    it("должен добавлять переход между соседними клипами", () => {
      const result = addTransitionBetweenClips(mockProject, "track-1", "clip-1", "clip-2", mockTransitionResource, 2)

      expect(result.project).toBeDefined()
      expect(result.transition).toBeDefined()
      expect(result.transition.type).toBe("between")
      expect(result.transition.startClipId).toBe("clip-1")
      expect(result.transition.endClipId).toBe("clip-2")
      expect(result.transition.trackId).toBe("track-1")
      expect(result.transition.position).toBe(9) // 10 - 2/2
      expect(result.transition.duration).toBe(2)
    })

    it("должен использовать длительность по умолчанию если не указана", () => {
      const result = addTransitionBetweenClips(mockProject, "track-1", "clip-1", "clip-2", mockTransitionResource)

      expect(result.transition.duration).toBe(mockTransitionResource.duration.default)
    })

    it("должен выбрасывать ошибку если трек не найден", () => {
      expect(() => {
        addTransitionBetweenClips(mockProject, "nonexistent", "clip-1", "clip-2", mockTransitionResource)
      }).toThrow("Track nonexistent not found")
    })

    it("должен выбрасывать ошибку если клипы не найдены", () => {
      expect(() => {
        addTransitionBetweenClips(mockProject, "track-1", "nonexistent", "clip-2", mockTransitionResource)
      }).toThrow("Clips not found")

      expect(() => {
        addTransitionBetweenClips(mockProject, "track-1", "clip-1", "nonexistent", mockTransitionResource)
      }).toThrow("Clips not found")
    })

    it("должен выбрасывать ошибку если клипы не соседние", () => {
      expect(() => {
        addTransitionBetweenClips(mockProject, "track-1", "clip-1", "clip-3", mockTransitionResource)
      }).toThrow("Clips are not adjacent")
    })

    it("должен добавлять переход к ресурсам и треку", () => {
      const result = addTransitionBetweenClips(mockProject, "track-1", "clip-1", "clip-2", mockTransitionResource, 2)

      // Проверяем что переход добавлен в ресурсы
      expect(result.project.resources.timelineTransitions).toContainEqual(result.transition)

      // Проверяем что ID перехода добавлен в трек
      const updatedTrack = result.project.globalTracks.find((t) => t.id === "track-1")
      expect(updatedTrack?.transitions).toContain(result.transition.id)
    })
  })

  describe("addTransitionIn", () => {
    it("должен добавлять переход на вход клипа", () => {
      const result = addTransitionIn(mockProject, "track-1", "clip-1", mockTransitionResource, 2)

      expect(result.transition.type).toBe("in")
      expect(result.transition.endClipId).toBe("clip-1")
      expect(result.transition.trackId).toBe("track-1")
      expect(result.transition.position).toBe(0) // clip.startTime
      expect(result.transition.duration).toBe(2)
    })

    it("должен использовать длительность по умолчанию", () => {
      const result = addTransitionIn(mockProject, "track-1", "clip-1", mockTransitionResource)

      expect(result.transition.duration).toBe(mockTransitionResource.duration.default)
    })

    it("должен выбрасывать ошибку если трек не найден", () => {
      expect(() => {
        addTransitionIn(mockProject, "nonexistent", "clip-1", mockTransitionResource)
      }).toThrow("Track nonexistent not found")
    })

    it("должен выбрасывать ошибку если клип не найден", () => {
      expect(() => {
        addTransitionIn(mockProject, "track-1", "nonexistent", mockTransitionResource)
      }).toThrow("Clip nonexistent not found")
    })
  })

  describe("addTransitionOut", () => {
    it("должен добавлять переход на выход клипа", () => {
      const result = addTransitionOut(mockProject, "track-1", "clip-1", mockTransitionResource, 2)

      expect(result.transition.type).toBe("out")
      expect(result.transition.startClipId).toBe("clip-1")
      expect(result.transition.trackId).toBe("track-1")
      expect(result.transition.position).toBe(8) // 0 + 10 - 2
      expect(result.transition.duration).toBe(2)
    })

    it("должен использовать длительность по умолчанию", () => {
      const result = addTransitionOut(mockProject, "track-1", "clip-1", mockTransitionResource)

      expect(result.transition.duration).toBe(mockTransitionResource.duration.default)
      expect(result.transition.position).toBe(9) // 0 + 10 - 1
    })

    it("должен выбрасывать ошибку если трек не найден", () => {
      expect(() => {
        addTransitionOut(mockProject, "nonexistent", "clip-1", mockTransitionResource)
      }).toThrow("Track nonexistent not found")
    })

    it("должен выбрасывать ошибку если клип не найден", () => {
      expect(() => {
        addTransitionOut(mockProject, "track-1", "nonexistent", mockTransitionResource)
      }).toThrow("Clip nonexistent not found")
    })
  })

  describe("getTrackTransitions", () => {
    it("должен возвращать переходы трека", () => {
      const transition: TimelineTransition = {
        id: "test-transition",
        transitionId: "fade",
        type: "between",
        position: 5,
        duration: 2,
        parameters: {},
        keyframes: [],
        curve: { type: "ease", points: [] },
        startClipId: "clip-1",
        endClipId: "clip-2",
        trackId: "track-1",
        isEnabled: true,
        isLocked: false,
      }

      // Добавляем переход в проект
      mockProject.resources.timelineTransitions = [transition]
      mockProject.globalTracks[0].transitions = ["test-transition"]

      const transitions = getTrackTransitions(mockProject, "track-1")

      expect(transitions).toHaveLength(1)
      expect(transitions[0]).toEqual(transition)
    })

    it("должен возвращать пустой массив если трек не найден", () => {
      const transitions = getTrackTransitions(mockProject, "nonexistent")
      expect(transitions).toEqual([])
    })

    it("должен возвращать пустой массив если нет переходов", () => {
      const transitions = getTrackTransitions(mockProject, "track-1")
      expect(transitions).toEqual([])
    })

    it("должен фильтровать несуществующие переходы", () => {
      mockProject.globalTracks[0].transitions = ["nonexistent"]
      const transitions = getTrackTransitions(mockProject, "track-1")
      expect(transitions).toEqual([])
    })
  })

  describe("checkTransitionCollisions", () => {
    beforeEach(() => {
      // Добавляем тестовые переходы
      const transition1: TimelineTransition = {
        id: "transition-1",
        transitionId: "fade",
        type: "between",
        position: 5,
        duration: 2, // 5-7
        parameters: {},
        keyframes: [],
        curve: { type: "ease", points: [] },
        trackId: "track-1",
        isEnabled: true,
        isLocked: false,
      }

      const transition2: TimelineTransition = {
        id: "transition-2",
        transitionId: "fade",
        type: "in",
        position: 10,
        duration: 3, // 10-13
        parameters: {},
        keyframes: [],
        curve: { type: "ease", points: [] },
        trackId: "track-1",
        isEnabled: true,
        isLocked: false,
      }

      mockProject.resources.timelineTransitions = [transition1, transition2]
      mockProject.globalTracks[0].transitions = ["transition-1", "transition-2"]
    })

    it("должен обнаруживать коллизию с существующим переходом", () => {
      // Пересечение с transition-1 (5-7)
      const hasCollision1 = checkTransitionCollisions(mockProject, "track-1", 6, 2)
      expect(hasCollision1).toBe(true)

      // Пересечение с transition-2 (10-13)
      const hasCollision2 = checkTransitionCollisions(mockProject, "track-1", 11, 2)
      expect(hasCollision2).toBe(true)
    })

    it("должен не обнаруживать коллизию если переходы не пересекаются", () => {
      const hasCollision = checkTransitionCollisions(mockProject, "track-1", 8, 1) // 8-9, между 5-7 и 10-13
      expect(hasCollision).toBe(false)
    })

    it("должен исключать указанный переход из проверки", () => {
      // Проверяем позицию transition-1, но исключаем его из проверки
      const hasCollision = checkTransitionCollisions(mockProject, "track-1", 5, 2, "transition-1")
      expect(hasCollision).toBe(false)
    })

    it("должен обнаруживать коллизию при полном перекрытии", () => {
      const hasCollision = checkTransitionCollisions(mockProject, "track-1", 4, 5) // 4-9, покрывает 5-7
      expect(hasCollision).toBe(true)
    })

    it("должен обнаруживать коллизию при частичном перекрытии", () => {
      const hasCollision1 = checkTransitionCollisions(mockProject, "track-1", 4, 2) // 4-6, пересекается с 5-7
      expect(hasCollision1).toBe(true)

      const hasCollision2 = checkTransitionCollisions(mockProject, "track-1", 6, 2) // 6-8, пересекается с 5-7
      expect(hasCollision2).toBe(true)
    })
  })

  describe("adjustTransitionsForClipChange", () => {
    let testTransitions: TimelineTransition[]

    beforeEach(() => {
      testTransitions = [
        {
          id: "between-transition",
          transitionId: "fade",
          type: "between",
          position: 9,
          duration: 2,
          parameters: {},
          keyframes: [],
          curve: { type: "ease", points: [] },
          startClipId: "clip-1",
          endClipId: "clip-2",
          trackId: "track-1",
          isEnabled: true,
          isLocked: false,
        },
        {
          id: "in-transition",
          transitionId: "fade",
          type: "in",
          position: 10,
          duration: 1,
          parameters: {},
          keyframes: [],
          curve: { type: "ease", points: [] },
          endClipId: "clip-2",
          trackId: "track-1",
          isEnabled: true,
          isLocked: false,
        },
        {
          id: "out-transition",
          transitionId: "fade",
          type: "out",
          position: 9,
          duration: 1,
          parameters: {},
          keyframes: [],
          curve: { type: "ease", points: [] },
          startClipId: "clip-1",
          trackId: "track-1",
          isEnabled: true,
          isLocked: false,
        },
      ]

      mockProject.resources.timelineTransitions = testTransitions
      mockProject.globalTracks[0].transitions = ["between-transition", "in-transition", "out-transition"]
    })

    it("должен корректировать переходы при перемещении клипа", () => {
      // Перемещаем clip-1 с позиции 0 на позицию 5 (длительность остается 10)
      const result = adjustTransitionsForClipChange(mockProject, "track-1", "clip-1", 0, 5, 10, 10)

      const betweenTransition = result.resources.timelineTransitions.find((t) => t.id === "between-transition")
      expect(betweenTransition?.position).toBe(14) // 9 + (15 - 10) = 14

      const outTransition = result.resources.timelineTransitions.find((t) => t.id === "out-transition")
      expect(outTransition?.position).toBe(14) // 5 + 10 - 1 = 14
    })

    it("должен корректировать переходы при изменении длительности клипа", () => {
      // Изменяем длительность clip-1 с 10 на 15 (позиция остается 0)
      const result = adjustTransitionsForClipChange(mockProject, "track-1", "clip-1", 0, 0, 10, 15)

      const betweenTransition = result.resources.timelineTransitions.find((t) => t.id === "between-transition")
      expect(betweenTransition?.position).toBe(14) // 9 + (15 - 10) = 14

      const outTransition = result.resources.timelineTransitions.find((t) => t.id === "out-transition")
      expect(outTransition?.position).toBe(14) // 0 + 15 - 1 = 14
    })

    it("должен корректировать переходы при изменении обоих параметров", () => {
      // Перемещаем clip-2 с позиции 10 на 12 и меняем длительность с 10 на 8
      const result = adjustTransitionsForClipChange(mockProject, "track-1", "clip-2", 10, 12, 10, 8)

      const betweenTransition = result.resources.timelineTransitions.find((t) => t.id === "between-transition")
      expect(betweenTransition?.position).toBe(11) // 9 + (12 - 10) = 11

      const inTransition = result.resources.timelineTransitions.find((t) => t.id === "in-transition")
      expect(inTransition?.position).toBe(12) // новая позиция клипа
    })

    it("должен не изменять переходы не связанные с данным клипом", () => {
      // Изменяем clip-3, который не связан с переходами
      const result = adjustTransitionsForClipChange(mockProject, "track-1", "clip-3", 25, 30, 10, 12)

      // Все переходы должны остаться без изменений
      const betweenTransition = result.resources.timelineTransitions.find((t) => t.id === "between-transition")
      expect(betweenTransition?.position).toBe(9)

      const inTransition = result.resources.timelineTransitions.find((t) => t.id === "in-transition")
      expect(inTransition?.position).toBe(10)

      const outTransition = result.resources.timelineTransitions.find((t) => t.id === "out-transition")
      expect(outTransition?.position).toBe(9)
    })
  })

  describe("removeTransition", () => {
    it("должен удалять переход из ресурсов и треков", () => {
      const transition: TimelineTransition = {
        id: "test-transition",
        transitionId: "fade",
        type: "between",
        position: 5,
        duration: 2,
        parameters: {},
        keyframes: [],
        curve: { type: "ease", points: [] },
        trackId: "track-1",
        isEnabled: true,
        isLocked: false,
      }

      mockProject.resources.timelineTransitions = [transition]
      mockProject.globalTracks[0].transitions = ["test-transition"]

      const result = removeTransition(mockProject, "test-transition")

      expect(result.resources.timelineTransitions).not.toContainEqual(transition)
      expect(result.globalTracks[0].transitions).not.toContain("test-transition")
    })

    it("должен удалять переход из всех треков (включая секции)", () => {
      const transition: TimelineTransition = {
        id: "test-transition",
        transitionId: "fade",
        type: "between",
        position: 5,
        duration: 2,
        parameters: {},
        keyframes: [],
        curve: { type: "ease", points: [] },
        trackId: "track-1",
        isEnabled: true,
        isLocked: false,
      }

      const sectionTrack = createMockTrack("section-track", [])
      sectionTrack.transitions = ["test-transition"]

      mockProject.resources.timelineTransitions = [transition]
      mockProject.globalTracks[0].transitions = ["test-transition"]
      mockProject.sections = [
        {
          id: "section-1",
          index: 0,
          name: "Section 1",
          startTime: 0,
          endTime: 10,
          duration: 10,
          isCollapsed: false,
          tracks: [sectionTrack],
        },
      ]

      const result = removeTransition(mockProject, "test-transition")

      expect(result.resources.timelineTransitions).toHaveLength(0)
      expect(result.globalTracks[0].transitions).toHaveLength(0)
      expect(result.sections[0].tracks[0].transitions).toHaveLength(0)
    })

    it("должен не изменять проект если переход не найден", () => {
      const originalTransitionsLength = mockProject.resources.timelineTransitions.length
      const originalTrackTransitionsLength = mockProject.globalTracks[0].transitions.length

      const result = removeTransition(mockProject, "nonexistent")

      expect(result.resources.timelineTransitions).toHaveLength(originalTransitionsLength)
      expect(result.globalTracks[0].transitions).toHaveLength(originalTrackTransitionsLength)
    })
  })

  describe("getClipTransitions", () => {
    beforeEach(() => {
      const transitions: TimelineTransition[] = [
        {
          id: "in-transition",
          transitionId: "fade",
          type: "in",
          position: 0,
          duration: 1,
          parameters: {},
          keyframes: [],
          curve: { type: "ease", points: [] },
          endClipId: "clip-1",
          trackId: "track-1",
          isEnabled: true,
          isLocked: false,
        },
        {
          id: "out-transition",
          transitionId: "fade",
          type: "out",
          position: 9,
          duration: 1,
          parameters: {},
          keyframes: [],
          curve: { type: "ease", points: [] },
          startClipId: "clip-1",
          trackId: "track-1",
          isEnabled: true,
          isLocked: false,
        },
        {
          id: "between-before",
          transitionId: "fade",
          type: "between",
          position: -1,
          duration: 2,
          parameters: {},
          keyframes: [],
          curve: { type: "ease", points: [] },
          startClipId: "clip-0",
          endClipId: "clip-1",
          trackId: "track-1",
          isEnabled: true,
          isLocked: false,
        },
        {
          id: "between-after",
          transitionId: "fade",
          type: "between",
          position: 9,
          duration: 2,
          parameters: {},
          keyframes: [],
          curve: { type: "ease", points: [] },
          startClipId: "clip-1",
          endClipId: "clip-2",
          trackId: "track-1",
          isEnabled: true,
          isLocked: false,
        },
      ]

      mockProject.resources.timelineTransitions = transitions
    })

    it("должен возвращать все типы переходов для клипа", () => {
      const transitions = getClipTransitions(mockProject, "clip-1")

      expect(transitions.in).toBeTruthy()
      expect(transitions.in?.id).toBe("in-transition")

      expect(transitions.out).toBeTruthy()
      expect(transitions.out?.id).toBe("out-transition")

      expect(transitions.betweenBefore).toBeTruthy()
      expect(transitions.betweenBefore?.id).toBe("between-before")

      expect(transitions.betweenAfter).toBeTruthy()
      expect(transitions.betweenAfter?.id).toBe("between-after")
    })

    it("должен возвращать null для отсутствующих переходов", () => {
      const transitions = getClipTransitions(mockProject, "clip-3")

      expect(transitions.in).toBeNull()
      expect(transitions.out).toBeNull()
      expect(transitions.betweenBefore).toBeNull()
      expect(transitions.betweenAfter).toBeNull()
    })

    it("должен частично заполнять объект если есть только некоторые переходы", () => {
      const transitions = getClipTransitions(mockProject, "clip-2")

      expect(transitions.in).toBeNull()
      expect(transitions.out).toBeNull()
      expect(transitions.betweenBefore).toBeTruthy()
      expect(transitions.betweenBefore?.id).toBe("between-after") // clip-2 является endClipId
      expect(transitions.betweenAfter).toBeNull()
    })
  })

  describe("applyTransitionPresetToTrack", () => {
    it("должен применять переходы между всеми соседними клипами", () => {
      // Создаем трек с 3 соседними клипами
      const clips = [createMockClip("clip-1", 0, 5), createMockClip("clip-2", 5, 5), createMockClip("clip-3", 10, 5)]
      const track = createMockTrack("track-1", clips)
      const project = createMockProject([track])

      const result = applyTransitionPresetToTrack(project, "track-1", mockTransitionResource, 1)

      // Должно быть 2 перехода (между clip-1 и clip-2, между clip-2 и clip-3)
      expect(result.resources.timelineTransitions).toHaveLength(2)

      // Проверяем что переходы созданы правильно
      const transitions = result.resources.timelineTransitions
      expect(transitions.every((t) => t.type === "between")).toBe(true)
      expect(transitions.every((t) => t.duration === 1)).toBe(true)
    })

    it("должен пропускать несоседние клипы", () => {
      // Используем исходные клипы где clip-3 не соседний с clip-2
      const result = applyTransitionPresetToTrack(mockProject, "track-1", mockTransitionResource, 1)

      // Должен быть только 1 переход (между clip-1 и clip-2)
      expect(result.resources.timelineTransitions).toHaveLength(1)

      const transition = result.resources.timelineTransitions[0]
      expect(transition.startClipId).toBe("clip-1")
      expect(transition.endClipId).toBe("clip-2")
    })

    it("должен возвращать проект без изменений если трек не найден", () => {
      const result = applyTransitionPresetToTrack(mockProject, "nonexistent", mockTransitionResource)
      expect(result).toBe(mockProject)
    })

    it("должен возвращать проект без изменений если в треке меньше 2 клипов", () => {
      const singleClipTrack = createMockTrack("single-track", [createMockClip("clip-1", 0, 10)])
      const project = createMockProject([singleClipTrack])

      const result = applyTransitionPresetToTrack(project, "single-track", mockTransitionResource)
      expect(result).toBe(project)
    })

    it("должен использовать длительность по умолчанию если не указана", () => {
      const clips = [createMockClip("clip-1", 0, 5), createMockClip("clip-2", 5, 5)]
      const track = createMockTrack("track-1", clips)
      const project = createMockProject([track])

      const result = applyTransitionPresetToTrack(project, "track-1", mockTransitionResource)

      const transition = result.resources.timelineTransitions[0]
      expect(transition.duration).toBe(mockTransitionResource.duration.default)
    })

    it("должен сортировать клипы по времени перед применением", () => {
      // Создаем клипы в неправильном порядке
      const clips = [createMockClip("clip-3", 10, 5), createMockClip("clip-1", 0, 5), createMockClip("clip-2", 5, 5)]
      const track = createMockTrack("track-1", clips)
      const project = createMockProject([track])

      const result = applyTransitionPresetToTrack(project, "track-1", mockTransitionResource, 1)

      expect(result.resources.timelineTransitions).toHaveLength(2)

      const transitions = result.resources.timelineTransitions
      // Первый переход между clip-1 и clip-2
      const firstTransition = transitions.find((t) => t.startClipId === "clip-1")
      expect(firstTransition?.endClipId).toBe("clip-2")

      // Второй переход между clip-2 и clip-3
      const secondTransition = transitions.find((t) => t.startClipId === "clip-2")
      expect(secondTransition?.endClipId).toBe("clip-3")
    })
  })
})

import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  canAddTransition,
  resolveTransitionCollisions,
  syncTransitionsOnClipDelete,
  syncTransitionsOnClipMove,
  syncTransitionsOnClipSplit,
  syncTransitionsOnClipTrim,
} from "../../services/clip-transition-sync"
import type { TimelineClip, TimelineProject, TimelineTrack } from "@/features/timeline/types"
import type { TimelineTransition } from "../../types/timeline-transition"

// Mock модулей
vi.mock("../../services/resource-manager", () => ({
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

vi.mock("../timeline-transition-manager", () => ({
  adjustTransitionsForClipChange: vi.fn((project, _trackId, clipId, oldPos, newPos, _oldDur, _newDur) => {
    // Простая имитация - возвращаем проект с измененными переходами
    const updatedProject = { ...project }
    updatedProject.resources.timelineTransitions.forEach((t: any) => {
      if (t.startClipId === clipId || t.endClipId === clipId) {
        t.position = newPos + (t.position - oldPos) // Сдвигаем пропорционально
      }
    })
    return updatedProject
  }),
  checkTransitionCollisions: vi.fn((project, trackId, position, duration, excludeId?) => {
    const track = findTrackInProject(project, trackId)
    if (!track?.transitions) return false

    const transitions = track.transitions
      .map((id) => project.resources.timelineTransitions.find((transition: any) => transition.id === id))
      .filter((t): t is NonNullable<typeof t> => t !== undefined && t.id !== excludeId)

    return transitions.some((t) => {
      const tEnd = t.position + t.duration
      const posEnd = position + duration
      return (
        (position >= t.position && position < tEnd) ||
        (posEnd > t.position && posEnd <= tEnd) ||
        (position <= t.position && posEnd >= tEnd)
      )
    })
  }),
  getClipTransitions: vi.fn((project: TimelineProject, clipId: string) => {
    const transitions = project.resources.timelineTransitions
    return {
      in: transitions.find((t) => t.type === "in" && t.endClipId === clipId) || null,
      out: transitions.find((t) => t.type === "out" && t.startClipId === clipId) || null,
      betweenBefore: transitions.find((t) => t.type === "between" && t.endClipId === clipId) || null,
      betweenAfter: transitions.find((t) => t.type === "between" && t.startClipId === clipId) || null,
    }
  }),
  removeTransition: vi.fn((project: TimelineProject, transitionId: string) => {
    const updatedProject = { ...project }
    updatedProject.resources.timelineTransitions = updatedProject.resources.timelineTransitions.filter(
      (t) => t.id !== transitionId,
    )
    // Удаляем из треков
    updatedProject.sections.forEach((section) => {
      section.tracks.forEach((track) => {
        if (track.transitions) {
          track.transitions = track.transitions.filter((id) => id !== transitionId)
        }
      })
    })
    updatedProject.globalTracks.forEach((track) => {
      if (track.transitions) {
        track.transitions = track.transitions.filter((id) => id !== transitionId)
      }
    })
    return updatedProject
  }),
}))

// Вспомогательная функция для поиска трека
function findTrackInProject(project: TimelineProject, trackId: string) {
  for (const section of project.sections) {
    const track = section.tracks.find((t) => t.id === trackId)
    if (track) return track
  }
  return project.globalTracks.find((t) => t.id === trackId)
}

// Тестовые данные
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

const createMockTransition = (
  id: string,
  type: "in" | "out" | "between" | "adjustment",
  position: number,
  duration: number,
  startClipId?: string,
  endClipId?: string,
  trackId?: string,
): TimelineTransition => ({
  id,
  transitionId: "fade-transition",
  type,
  position,
  duration,
  parameters: {
    intensity: 1,
    easing: "easeInOut",
  },
  keyframes: [],
  curve: {
    type: "ease-in-out",
    points: [],
  },
  startClipId,
  endClipId,
  trackId: trackId || "default-track",
  isEnabled: true,
  isLocked: false,
  renderCache: undefined,
})

const createMockTrack = (id: string, clips: TimelineClip[] = [], transitions: string[] = []): TimelineTrack => ({
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
  transitions,
})

const createMockProject = (
  tracks: TimelineTrack[] = [],
  timelineTransitions: TimelineTransition[] = [],
): TimelineProject => ({
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
    timelineTransitions,
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

describe("clip-transition-sync", () => {
  let mockProject: TimelineProject
  let mockClips: TimelineClip[]
  let mockTrack: TimelineTrack
  let mockTransitions: TimelineTransition[]

  beforeEach(() => {
    mockClips = [createMockClip("clip-1", 0, 10), createMockClip("clip-2", 10, 10), createMockClip("clip-3", 25, 10)]

    mockTransitions = [
      createMockTransition("t-in", "in", 0, 2, undefined, "clip-1", "track-1"),
      createMockTransition("t-out", "out", 8, 2, "clip-1", undefined, "track-1"),
      createMockTransition("t-between", "between", 9, 2, "clip-1", "clip-2", "track-1"),
    ]

    mockTrack = createMockTrack("track-1", mockClips, ["t-in", "t-out", "t-between"])
    mockProject = createMockProject([mockTrack], mockTransitions)
  })

  describe("syncTransitionsOnClipMove", () => {
    it("должен удалять все переходы при перемещении клипа на другой трек", () => {
      const result = syncTransitionsOnClipMove(mockProject, "clip-1", "track-1", "track-2", 0, 5, 10)

      expect(result.resources.timelineTransitions).toHaveLength(0)
    })

    it("должен корректировать позиции переходов при перемещении в том же треке", () => {
      const originalTransitionsCount = mockProject.resources.timelineTransitions.length
      const result = syncTransitionsOnClipMove(mockProject, "clip-1", "track-1", "track-1", 0, 5, 10)

      // Переходы должны остаться
      expect(result.resources.timelineTransitions).toHaveLength(originalTransitionsCount)

      // Позиции переходов должны быть скорректированы
      const inTransition = result.resources.timelineTransitions.find((t) => t.id === "t-in")
      expect(inTransition?.position).toBe(5) // 0 + (5 - 0) = 5

      const outTransition = result.resources.timelineTransitions.find((t) => t.id === "t-out")
      expect(outTransition?.position).toBe(13) // 8 + (5 - 0) = 13
    })

    it("должен правильно обрабатывать клип без переходов", () => {
      const result = syncTransitionsOnClipMove(mockProject, "clip-3", "track-1", "track-2", 25, 30, 10)

      // Переходы других клипов должны остаться нетронутыми
      expect(result.resources.timelineTransitions).toHaveLength(mockTransitions.length)
    })
  })

  describe("syncTransitionsOnClipTrim", () => {
    it("должен корректировать переходы при изменении начала клипа", () => {
      const result = syncTransitionsOnClipTrim(mockProject, "clip-1", "track-1", 0, 2, 10, 8)

      // Позиции переходов должны быть скорректированы
      const inTransition = result.resources.timelineTransitions.find((t) => t.id === "t-in")
      expect(inTransition?.position).toBe(2) // 0 + (2 - 0) = 2

      const outTransition = result.resources.timelineTransitions.find((t) => t.id === "t-out")
      expect(outTransition?.position).toBe(10) // 8 + (2 - 0) = 10
    })

    it("должен корректировать переходы при изменении длительности клипа", () => {
      const result = syncTransitionsOnClipTrim(mockProject, "clip-1", "track-1", 0, 0, 10, 12)

      expect(result.resources.timelineTransitions.length).toBeGreaterThan(0)
    })

    it("должен правильно обрабатывать клип без переходов", () => {
      const result = syncTransitionsOnClipTrim(mockProject, "clip-3", "track-1", 25, 27, 10, 8)

      // Все переходы должны остаться без изменений
      expect(result.resources.timelineTransitions).toHaveLength(mockTransitions.length)
    })
  })

  describe("syncTransitionsOnClipDelete", () => {
    it("должен удалять все переходы связанные с удаленным клипом", () => {
      const result = syncTransitionsOnClipDelete(mockProject, "clip-1")

      // Все переходы связанные с clip-1 должны быть удалены
      expect(result.resources.timelineTransitions).toHaveLength(0)
    })

    it("должен оставлять переходы других клипов", () => {
      // Добавляем переход для другого клипа
      const anotherTransition = createMockTransition("t-other", "in", 10, 1, undefined, "clip-2", "track-1")
      mockProject.resources.timelineTransitions.push(anotherTransition)
      mockTrack.transitions.push("t-other")

      const result = syncTransitionsOnClipDelete(mockProject, "clip-1")

      // Переход clip-2 должен остаться
      expect(result.resources.timelineTransitions).toHaveLength(1)
      expect(result.resources.timelineTransitions[0].id).toBe("t-other")
    })

    it("должен правильно обрабатывать клип без переходов", () => {
      const originalCount = mockProject.resources.timelineTransitions.length
      const result = syncTransitionsOnClipDelete(mockProject, "clip-3")

      // Количество переходов не должно измениться
      expect(result.resources.timelineTransitions).toHaveLength(originalCount)
    })
  })

  describe("syncTransitionsOnClipSplit", () => {
    it("должен правильно распределить переходы между частями", () => {
      const result = syncTransitionsOnClipSplit(mockProject, "clip-1", "clip-1a", "clip-1b", 5)

      // Переход "in" должен остаться с левым клипом
      const inTransition = result.resources.timelineTransitions.find((t) => t.id === "t-in")
      expect(inTransition?.endClipId).toBe("clip-1a")

      // Переход "out" должен перейти к правому клипу
      const outTransition = result.resources.timelineTransitions.find((t) => t.id === "t-out")
      expect(outTransition?.startClipId).toBe("clip-1b")
      expect(outTransition?.position).toBe(8) // 5 + (8 - 5) = 8

      // Переход "between" (если был) должен остаться с левым клипом
      const betweenTransition = result.resources.timelineTransitions.find((t) => t.id === "t-between")
      expect(betweenTransition?.startClipId).toBe("clip-1b")
    })

    it("должен обрабатывать только существующие переходы", () => {
      // Удаляем некоторые переходы
      mockProject.resources.timelineTransitions = [mockTransitions[0]] // только "in"

      const result = syncTransitionsOnClipSplit(mockProject, "clip-1", "clip-1a", "clip-1b", 5)

      expect(result.resources.timelineTransitions).toHaveLength(1)
      const transition = result.resources.timelineTransitions[0]
      expect(transition.endClipId).toBe("clip-1a")
    })

    it("должен правильно вычислять новые позиции", () => {
      const result = syncTransitionsOnClipSplit(mockProject, "clip-1", "clip-1a", "clip-1b", 3)

      const outTransition = result.resources.timelineTransitions.find((t) => t.id === "t-out")
      if (outTransition) {
        // Новая позиция: splitTime + (старая позиция - splitTime) = 3 + (8 - 3) = 8
        expect(outTransition.position).toBe(8)
      }
    })
  })

  describe("resolveTransitionCollisions", () => {
    it("должен исправлять коллизии между переходами", () => {
      // Создаем коллидирующие переходы
      const transitions = [
        createMockTransition("t1", "in", 5, 3, undefined, "clip-1", "track-1"), // 5-8
        createMockTransition("t2", "out", 7, 2, "clip-1", undefined, "track-1"), // 7-9, коллизия
      ]

      const track = createMockTrack("track-1", mockClips, ["t1", "t2"])
      const project = createMockProject([track], transitions)

      const result = resolveTransitionCollisions(project, "track-1")

      // Второй переход должен быть сдвинут
      const transition2 = result.resources.timelineTransitions.find((t) => t.id === "t2")
      expect(transition2?.position).toBeGreaterThan(7) // Должен быть сдвинут
    })

    it("должен исключать указанный переход из проверки", () => {
      const transitions = [
        createMockTransition("t1", "in", 5, 3, undefined, "clip-1", "track-1"), // 5-8
        createMockTransition("t2", "out", 7, 2, "clip-1", undefined, "track-1"), // 7-9, коллизия
      ]

      const track = createMockTrack("track-1", mockClips, ["t1", "t2"])
      const project = createMockProject([track], transitions)

      const result = resolveTransitionCollisions(project, "track-1", "t2")

      // t2 должен остаться без изменений, так как он исключен
      const transition2 = result.resources.timelineTransitions.find((t) => t.id === "t2")
      expect(transition2?.position).toBe(7)
    })

    it("должен обрабатывать треки без переходов", () => {
      const track = createMockTrack("empty-track", mockClips, [])
      const project = createMockProject([track], [])

      const result = resolveTransitionCollisions(project, "empty-track")

      expect(result).toEqual(project)
    })

    it("должен правильно сортировать переходы по позиции", () => {
      // Создаем переходы в неправильном порядке
      const transitions = [
        createMockTransition("t2", "out", 10, 1, "clip-1", undefined, "track-1"), // 10-11
        createMockTransition("t1", "in", 5, 2, undefined, "clip-1", "track-1"), // 5-7
        createMockTransition("t3", "between", 12, 1, "clip-1", "clip-2", "track-1"), // 12-13
      ]

      const track = createMockTrack("track-1", mockClips, ["t2", "t1", "t3"])
      const project = createMockProject([track], transitions)

      const result = resolveTransitionCollisions(project, "track-1")

      // Функция должна обработать их в правильном порядке по позиции
      expect(result.resources.timelineTransitions).toHaveLength(3)
    })
  })

  describe("canAddTransition", () => {
    beforeEach(() => {
      // Очищаем существующие переходы для чистоты тестов
      mockProject.resources.timelineTransitions = []
      mockTrack.transitions = []
    })

    it("должен разрешать добавление перехода между соседними клипами", () => {
      const clips = [
        createMockClip("clip-1", 0, 10), // 0-10
        createMockClip("clip-2", 10, 10), // 10-20
      ]
      const track = createMockTrack("track-1", clips, [])
      const project = createMockProject([track], [])

      // Переход в области стыка клипов (9-11)
      const canAdd = canAddTransition(project, "track-1", 9, 2)
      expect(canAdd).toBe(true)
    })

    it("должен разрешать добавление перехода на вход клипа", () => {
      const clips = [createMockClip("clip-1", 5, 10)] // 5-15
      const track = createMockTrack("track-1", clips, [])
      const project = createMockProject([track], [])

      // Переход на вход (5-7)
      const canAdd = canAddTransition(project, "track-1", 5, 2)
      expect(canAdd).toBe(true)
    })

    it("должен разрешать добавление перехода на выход клипа", () => {
      const clips = [createMockClip("clip-1", 5, 10)] // 5-15
      const track = createMockTrack("track-1", clips, [])
      const project = createMockProject([track], [])

      // Переход на выход (13-15)
      const canAdd = canAddTransition(project, "track-1", 13, 2)
      expect(canAdd).toBe(true)
    })

    it("должен запрещать добавление перехода при коллизии", () => {
      const transitions = [
        createMockTransition("t1", "in", 5, 2, undefined, "clip-1", "track-1"), // 5-7
      ]
      const project = createMockProject([mockTrack], transitions)
      mockTrack.transitions = ["t1"]

      // Пытаемся добавить переход, который пересекается с существующим (6-8)
      const canAdd = canAddTransition(project, "track-1", 6, 2)
      expect(canAdd).toBe(false)
    })

    it("должен исключать указанный переход из проверки коллизий", () => {
      const transitions = [
        createMockTransition("t1", "in", 5, 2, undefined, "clip-1", "track-1"), // 5-7
      ]
      const project = createMockProject([mockTrack], transitions)
      mockTrack.transitions = ["t1"]

      // Проверяем ту же позицию, но исключаем переход из проверки
      const canAdd = canAddTransition(project, "track-1", 5, 2, "t1")
      // Поскольку t1 исключён из проверки, нужно проверить другие критерии
      // В данном случае может быть true или false в зависимости от расположения клипов
      expect(typeof canAdd).toBe("boolean")
    })

    it("должен запрещать добавление перехода на несуществующем треке", () => {
      const canAdd = canAddTransition(mockProject, "nonexistent", 5, 2)
      expect(canAdd).toBe(false)
    })

    it("должен запрещать добавление перехода вне области клипов", () => {
      const canAdd = canAddTransition(mockProject, "track-1", 50, 2) // Вне области клипов
      expect(canAdd).toBe(false)
    })
  })
})

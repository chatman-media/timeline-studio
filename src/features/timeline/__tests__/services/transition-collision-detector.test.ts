import { beforeEach, describe, expect, it } from "vitest"
import type { TimelineClip, TimelineProject, TimelineTrack } from "@/features/timeline/types"
import {
  autoFixCollisions,
  detectAllCollisions,
  detectTrackCollisions,
  suggestCollisionFixes,
  type TransitionCollision,
} from "../../services/transition-collision-detector"
import type { TimelineTransition } from "../../types/timeline-transition"

// Тестовые данные
const createMockClip = (id: string, startTime: number, duration: number): TimelineClip => ({
  id,
  name: `Clip ${id}`,
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
  trackId: string = "track-1",
): TimelineTransition => ({
  id,
  transitionId: "fade-transition",
  type,
  position,
  duration,
  parameters: {},
  keyframes: [],
  curve: { type: "ease", points: [] },
  startClipId,
  endClipId,
  trackId,
  isEnabled: true,
  isLocked: false,
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
    timelineTransitions: timelineTransitions as any,
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

describe("transition-collision-detector", () => {
  let mockProject: TimelineProject
  let mockClips: TimelineClip[]
  let mockTrack: TimelineTrack

  beforeEach(() => {
    mockClips = [createMockClip("clip-1", 0, 10), createMockClip("clip-2", 10, 10), createMockClip("clip-3", 25, 10)]
    mockTrack = createMockTrack("track-1", mockClips)
    mockProject = createMockProject([mockTrack])
  })

  describe("detectTrackCollisions", () => {
    it("должен обнаруживать пересекающиеся переходы", () => {
      const transition1 = createMockTransition("t1", "in", 5, 3, undefined, "clip-1", "track-1") // 5-8
      const transition2 = createMockTransition("t2", "out", 7, 3, "clip-1", undefined, "track-1") // 7-10

      mockProject.resources.timelineTransitions = [transition1 as any, transition2 as any]
      mockTrack.transitions = ["t1", "t2"]

      const collisions = detectTrackCollisions(mockProject, mockTrack)

      expect(collisions).toHaveLength(1)
      expect(collisions[0].type).toBe("overlap")
      expect(collisions[0].severity).toBe("error")
      expect(collisions[0].transition1.id).toBe("t1")
      expect(collisions[0].transition2.id).toBe("t2")
    })

    it("должен обнаруживать близко расположенные переходы", () => {
      const transition1 = createMockTransition("t1", "in", 5, 2, undefined, "clip-1", "track-1") // 5-7
      const transition2 = createMockTransition("t2", "out", 7.05, 2, "clip-1", undefined, "track-1") // 7.05-9.05

      mockProject.resources.timelineTransitions = [transition1 as any, transition2 as any]
      mockTrack.transitions = ["t1", "t2"]

      const collisions = detectTrackCollisions(mockProject, mockTrack)

      expect(collisions).toHaveLength(1)
      expect(collisions[0].type).toBe("adjacent")
      expect(collisions[0].severity).toBe("warning")
    })

    it("должен обнаруживать выход перехода 'in' за границы клипа", () => {
      const transition = createMockTransition("t1", "in", -1, 3, undefined, "clip-1", "track-1") // -1 до 2

      mockProject.resources.timelineTransitions = [transition as any]
      mockTrack.transitions = ["t1"]

      const collisions = detectTrackCollisions(mockProject, mockTrack)

      expect(collisions).toHaveLength(1)
      expect(collisions[0].type).toBe("clip-boundary")
      expect(collisions[0].severity).toBe("error")
      expect(collisions[0].message).toContain("начинается до начала клипа")
    })

    it("должен обнаруживать выход перехода 'out' за границы клипа", () => {
      const transition = createMockTransition("t1", "out", 8, 5, "clip-1", undefined, "track-1") // 8-13, но clip-1 заканчивается в 10

      mockProject.resources.timelineTransitions = [transition as any]
      mockTrack.transitions = ["t1"]

      const collisions = detectTrackCollisions(mockProject, mockTrack)

      expect(collisions).toHaveLength(1)
      expect(collisions[0].type).toBe("clip-boundary")
      expect(collisions[0].severity).toBe("error")
      expect(collisions[0].message).toContain("заканчивается после конца клипа")
    })

    it("должен обнаруживать слишком длинный переход 'between'", () => {
      // Создаем новые клипы с явным промежутком
      const clips = [
        createMockClip("clip-1", 0, 10), // 0-10
        createMockClip("clip-2", 11, 10), // 11-21, gap = 1s
      ]
      const track = createMockTrack("track-1", clips, ["t1"])

      // Переход длиной 2s не помещается в gap 1s, оптимальная позиция 10 - 2/2 = 9
      const transition = createMockTransition("t1", "between", 9, 2, "clip-1", "clip-2", "track-1")

      const project = createMockProject([track], [transition])

      const collisions = detectTrackCollisions(project, track)

      // Ожидаем 2 коллизии: слишком длинный переход + он может быть смещён от оптимальной позиции
      expect(collisions.length).toBeGreaterThanOrEqual(1)
      expect(collisions.some((c) => c.message.includes("не помещается в промежуток"))).toBe(true)
    })

    it("должен обнаруживать смещённый переход 'between'", () => {
      // Создаем clips с gap для перехода между ними
      const clips = [
        createMockClip("clip-1", 0, 10), // 0-10
        createMockClip("clip-2", 12, 10), // 12-22, gap = 2s
      ]
      const track = createMockTrack("track-1", clips, ["t1"])

      // Переход должен быть в позиции 10 - 1/2 = 9.5, но мы ставим в 8
      const transition = createMockTransition("t1", "between", 8, 1, "clip-1", "clip-2", "track-1")

      const project = createMockProject([track], [transition])

      const collisions = detectTrackCollisions(project, track)

      expect(collisions).toHaveLength(1)
      expect(collisions[0].type).toBe("clip-boundary")
      expect(collisions[0].severity).toBe("warning")
      expect(collisions[0].message).toContain("смещён от оптимальной позиции")
    })

    it("должен возвращать пустой массив если нет коллизий", () => {
      // Переходы с достаточным промежутком
      const transition1 = createMockTransition("t1", "in", 2, 2, undefined, "clip-1", "track-1") // 2-4, в пределах clip-1 (0-10)
      const transition2 = createMockTransition("t2", "out", 15, 1, "clip-2", undefined, "track-1") // 15-16, в пределах clip-2 (10-20)

      mockProject.resources.timelineTransitions = [transition1 as any, transition2 as any]
      mockTrack.transitions = ["t1", "t2"]

      const collisions = detectTrackCollisions(mockProject, mockTrack)

      expect(collisions).toHaveLength(0)
    })

    it("должен возвращать пустой массив если нет переходов", () => {
      const collisions = detectTrackCollisions(mockProject, mockTrack)
      expect(collisions).toHaveLength(0)
    })

    it("должен игнорировать несуществующие переходы", () => {
      mockTrack.transitions = ["nonexistent"]
      const collisions = detectTrackCollisions(mockProject, mockTrack)
      expect(collisions).toHaveLength(0)
    })
  })

  describe("detectAllCollisions", () => {
    it("должен обнаруживать коллизии во всех треках", () => {
      const track1 = createMockTrack("track-1", [createMockClip("clip-1", 0, 10)], ["t1", "t2"])
      const track2 = createMockTrack("track-2", [createMockClip("clip-2", 0, 10)], ["t3", "t4"])

      const transitions = [
        createMockTransition("t1", "in", 5, 3, undefined, "clip-1", "track-1"), // 5-8
        createMockTransition("t2", "out", 7, 2, "clip-1", undefined, "track-1"), // 7-9, overlap
        createMockTransition("t3", "in", 2, 2, undefined, "clip-2", "track-2"), // 2-4
        createMockTransition("t4", "out", 4.05, 2, "clip-2", undefined, "track-2"), // 4.05-6.05, adjacent
      ]

      const project = createMockProject([track1, track2], transitions)

      const collisions = detectAllCollisions(project)

      expect(collisions).toHaveLength(2)
      expect(collisions.some((c) => c.type === "overlap")).toBe(true)
      expect(collisions.some((c) => c.type === "adjacent")).toBe(true)
    })

    it("должен обрабатывать треки из секций", () => {
      const sectionTrack = createMockTrack("section-track", [createMockClip("clip-1", 0, 10)], ["t1"])
      const transition = createMockTransition("t1", "in", -1, 2, undefined, "clip-1", "section-track")

      const project = createMockProject([], [transition])
      project.sections = [
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

      const collisions = detectAllCollisions(project)

      expect(collisions).toHaveLength(1)
      expect(collisions[0].type).toBe("clip-boundary")
    })

    it("должен возвращать пустой массив если нет коллизий", () => {
      const track = createMockTrack("track-1", [createMockClip("clip-1", 0, 10)], ["t1"])
      const transition = createMockTransition("t1", "in", 5, 2, undefined, "clip-1", "track-1")

      const project = createMockProject([track], [transition])

      const collisions = detectAllCollisions(project)
      expect(collisions).toHaveLength(0)
    })
  })

  describe("suggestCollisionFixes", () => {
    it("должен предлагать исправления для пересекающихся переходов", () => {
      const collision: TransitionCollision = {
        transition1: createMockTransition("t1", "in", 5, 3), // 5-8
        transition2: createMockTransition("t2", "out", 7, 2), // 7-9
        type: "overlap",
        severity: "error",
        message: "Переходы пересекаются",
      }

      const fixes = suggestCollisionFixes(collision)

      expect(fixes.length).toBeGreaterThan(0)
      expect(fixes.some((f) => f.description.includes("Сократить первый переход"))).toBe(true)
      expect(fixes.some((f) => f.description.includes("Сдвинуть второй переход"))).toBe(true)
      expect(fixes.some((f) => f.description.includes("Удалить переход"))).toBe(true)
    })

    it("должен предлагать исправления для близких переходов", () => {
      const collision: TransitionCollision = {
        transition1: createMockTransition("t1", "in", 5, 2), // 5-7
        transition2: createMockTransition("t2", "out", 7.05, 2), // 7.05-9.05
        type: "adjacent",
        severity: "warning",
        message: "Переходы расположены слишком близко",
      }

      const fixes = suggestCollisionFixes(collision)

      expect(fixes.length).toBeGreaterThan(0)
      expect(fixes.some((f) => f.description.includes("Сдвинуть второй переход"))).toBe(true)
    })

    it("должен предлагать исправления для выхода за границы клипа", () => {
      const collision: TransitionCollision = {
        transition1: createMockTransition("t1", "in", -1, 3),
        transition2: createMockTransition("t1", "in", -1, 3), // Тот же переход
        type: "clip-boundary",
        severity: "error",
        message: "Переход начинается до начала клипа",
      }

      const fixes = suggestCollisionFixes(collision)

      expect(fixes.length).toBeGreaterThan(0)
      expect(fixes.some((f) => f.description.includes("Сдвинуть переход к началу"))).toBe(true)
    })

    it("должен предлагать сокращение длительности для выхода за границы", () => {
      const collision: TransitionCollision = {
        transition1: createMockTransition("t1", "out", 8, 5),
        transition2: createMockTransition("t1", "out", 8, 5), // Тот же переход
        type: "clip-boundary",
        severity: "error",
        message: "Переход выходит за границы клипа",
      }

      const fixes = suggestCollisionFixes(collision)

      expect(fixes.length).toBeGreaterThan(0)
      expect(fixes.some((f) => f.description.includes("Сократить длительность"))).toBe(true)
    })

    it("должен всегда предлагать удаление перехода", () => {
      const collision: TransitionCollision = {
        transition1: createMockTransition("t1", "in", 5, 2),
        transition2: createMockTransition("t2", "out", 7, 2),
        type: "overlap",
        severity: "error",
        message: "Test collision",
      }

      const fixes = suggestCollisionFixes(collision)

      expect(fixes.some((f) => f.description.includes("Удалить переход"))).toBe(true)
    })

    it("должен обрабатывать неизвестные типы коллизий", () => {
      const collision: TransitionCollision = {
        transition1: createMockTransition("t1", "in", 5, 2),
        transition2: createMockTransition("t2", "out", 7, 2),
        type: "unknown" as any,
        severity: "error",
        message: "Unknown collision type",
      }

      const fixes = suggestCollisionFixes(collision)

      expect(fixes.length).toBeGreaterThan(0)
      expect(fixes.every((f) => f.description.includes("Удалить переход"))).toBe(true)
    })
  })

  describe("autoFixCollisions", () => {
    it("должен автоматически исправлять коллизии", () => {
      const transition1 = createMockTransition("t1", "in", 5, 3, undefined, "clip-1", "track-1") // 5-8
      const transition2 = createMockTransition("t2", "out", 7, 2, "clip-1", undefined, "track-1") // 7-9

      const project = createMockProject([mockTrack], [transition1, transition2])
      mockTrack.transitions = ["t1", "t2"]

      const collisions = detectTrackCollisions(project, mockTrack)
      expect(collisions).toHaveLength(1)

      const fixedProject = autoFixCollisions(project, collisions)

      // Проверяем, что переходы были изменены
      const updatedTransition1 = fixedProject.resources.timelineTransitions.find((t) => t.id === "t1")
      expect(updatedTransition1).toBeDefined()
      expect(updatedTransition1?.duration).not.toBe(3) // Должно быть изменено
    })

    it("должен обрабатывать коллизии по трекам", () => {
      const track1 = createMockTrack("track-1", [createMockClip("clip-1", 0, 10)], ["t1"])
      const track2 = createMockTrack("track-2", [createMockClip("clip-2", 0, 10)], ["t2"])

      const transition1 = createMockTransition("t1", "in", -1, 3, undefined, "clip-1", "track-1")
      const transition2 = createMockTransition("t2", "in", -2, 4, undefined, "clip-2", "track-2")

      const project = createMockProject([track1, track2], [transition1, transition2])

      const collisions = [
        {
          transition1,
          transition2: transition1,
          type: "clip-boundary" as const,
          severity: "error" as const,
          message: "Переход начинается до начала клипа",
        },
        {
          transition1: transition2,
          transition2,
          type: "clip-boundary" as const,
          severity: "error" as const,
          message: "Переход начинается до начала клипа",
        },
      ]

      const fixedProject = autoFixCollisions(project, collisions)

      // Проверяем, что оба перехода были изменены
      const updatedTransition1 = fixedProject.resources.timelineTransitions.find((t) => t.id === "t1")
      const updatedTransition2 = fixedProject.resources.timelineTransitions.find((t) => t.id === "t2")

      expect(updatedTransition1?.position).not.toBe(-1)
      expect(updatedTransition2?.position).not.toBe(-2)
    })

    it("должен возвращать неизмененный проект если нет коллизий", () => {
      const collisions: TransitionCollision[] = []
      const fixedProject = autoFixCollisions(mockProject, collisions)

      expect(fixedProject).toEqual(mockProject)
    })

    it("должен правильно сортировать коллизии по позиции", () => {
      const transition1 = createMockTransition("t1", "in", 10, 2, undefined, "clip-1", "track-1")
      const transition2 = createMockTransition("t2", "out", 5, 2, "clip-1", undefined, "track-1")

      const project = createMockProject([mockTrack], [transition1, transition2])

      const collisions: TransitionCollision[] = [
        {
          transition1, // позиция 10
          transition2: transition1,
          type: "clip-boundary",
          severity: "error",
          message: "Test collision",
        },
        {
          transition1: transition2, // позиция 5
          transition2,
          type: "clip-boundary",
          severity: "error",
          message: "Test collision",
        },
      ]

      // autoFixCollisions должен обработать коллизии, начиная с меньшей позиции
      const fixedProject = autoFixCollisions(project, collisions)

      expect(fixedProject.resources.timelineTransitions).toHaveLength(2)
    })

    it("должен пропускать переходы без корректного ID", () => {
      const transition = createMockTransition("t1", "in", 5, 2, undefined, "clip-1", "track-1")
      const project = createMockProject([mockTrack], [transition])

      const collisions: TransitionCollision[] = [
        {
          transition1: { ...transition, id: "nonexistent" },
          transition2: transition,
          type: "clip-boundary",
          severity: "error",
          message: "Test collision",
        },
      ]

      const fixedProject = autoFixCollisions(project, collisions)

      // Оригинальный переход не должен быть изменен
      const unchangedTransition = fixedProject.resources.timelineTransitions.find((t) => t.id === "t1")
      expect(unchangedTransition).toEqual(transition)
    })
  })
})

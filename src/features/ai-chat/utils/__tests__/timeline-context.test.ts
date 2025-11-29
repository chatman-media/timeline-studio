/**
 * Тесты для Timeline Context утилит
 */

import { describe, expect, it } from "vitest"
import type { TimelineClip, TimelineProject, TimelineSection } from "@/features/timeline/types/timeline"
import { createDetailedTimelineContext, createTimelineContextPrompt } from "../timeline-context"

// Helper для создания mock проекта
const createMockProject = (overrides?: Partial<TimelineProject>): TimelineProject => ({
  id: "project-1",
  name: "Тестовый проект",
  description: "Описание проекта",
  settings: {
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    aspectRatio: "16:9",
    sampleRate: 48000,
    channels: 2,
  },
  sections: [],
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
})

// Helper для создания mock секции
const createMockSection = (overrides?: Partial<TimelineSection>): TimelineSection => ({
  id: "section-1",
  name: "Секция 1",
  duration: 60,
  startTime: 0,
  tracks: [],
  ...overrides,
})

// Helper для создания mock клипа
const createMockClip = (overrides?: Partial<TimelineClip>): TimelineClip => ({
  id: "clip-1",
  name: "Клип 1",
  type: "video",
  startTime: 0,
  duration: 10,
  trackId: "track-1",
  mediaId: "media-1",
  trimStart: 0,
  trimEnd: 10,
  effects: [],
  transitions: [],
  ...overrides,
})

describe("Timeline Context Utils", () => {
  describe("createTimelineContextPrompt", () => {
    it("должен создать базовый промпт без проекта", () => {
      const prompt = createTimelineContextPrompt(null)

      expect(prompt).toContain("AI ассистент в видеоредакторе Timeline Studio")
      expect(prompt).toContain("Проект не открыт")
      expect(prompt).not.toContain("Текущий проект:")
    })

    it("должен включить информацию о проекте", () => {
      const project = createMockProject({
        name: "Мой фильм",
        description: "Приключенческий фильм",
      })

      const prompt = createTimelineContextPrompt(project)

      expect(prompt).toContain("Текущий проект:")
      expect(prompt).toContain("Название: Мой фильм")
      expect(prompt).toContain("Описание: Приключенческий фильм")
      expect(prompt).toContain("Разрешение: 1920x1080")
      expect(prompt).toContain("FPS: 30")
      expect(prompt).toContain("Соотношение сторон: 16:9")
    })

    it("должен обработать проект без описания", () => {
      const project = createMockProject({
        description: undefined,
      })

      const prompt = createTimelineContextPrompt(project)

      expect(prompt).toContain("Описание: Нет описания")
    })

    it("должен включить статистику проекта", () => {
      const project = createMockProject({
        sections: [
          createMockSection({
            duration: 120,
            tracks: [
              {
                id: "track-1",
                type: "video",
                clips: [
                  createMockClip({ duration: 30, effects: [{ id: "effect-1" } as any] }),
                  createMockClip({ duration: 40, transitions: [{ id: "trans-1" } as any] }),
                ],
                name: "Track 1",
                enabled: true,
                locked: false,
              },
            ],
          }),
        ],
      })

      const prompt = createTimelineContextPrompt(project)

      expect(prompt).toContain("Статистика проекта:")
      expect(prompt).toContain("Длительность: 2м 0с")
      expect(prompt).toContain("Количество секций: 1")
      expect(prompt).toContain("Количество треков: 1")
      expect(prompt).toContain("Количество клипов: 2")
      expect(prompt).toContain("Использовано эффектов: 1")
      expect(prompt).toContain("Использовано переходов: 1")
    })

    it("должен правильно форматировать длительность", () => {
      const project1 = createMockProject({
        sections: [createMockSection({ duration: 45 })],
      })
      const prompt1 = createTimelineContextPrompt(project1)
      expect(prompt1).toContain("Длительность: 45с")

      const project2 = createMockProject({
        sections: [createMockSection({ duration: 125 })],
      })
      const prompt2 = createTimelineContextPrompt(project2)
      expect(prompt2).toContain("Длительность: 2м 5с")

      const project3 = createMockProject({
        sections: [createMockSection({ duration: 3665 })],
      })
      const prompt3 = createTimelineContextPrompt(project3)
      expect(prompt3).toContain("Длительность: 1ч 1м 5с")
    })

    it("должен включить информацию об активной секции", () => {
      const project = createMockProject()
      const activeSection = createMockSection({
        name: "Основная сцена",
        duration: 180,
        tracks: [
          { id: "track-1", type: "video", clips: [], name: "Track 1", enabled: true, locked: false },
          { id: "track-2", type: "audio", clips: [], name: "Track 2", enabled: true, locked: false },
        ],
      })

      const prompt = createTimelineContextPrompt(project, activeSection)

      expect(prompt).toContain("Активная секция:")
      expect(prompt).toContain("Название: Основная сцена")
      expect(prompt).toContain("Длительность: 3м 0с")
      expect(prompt).toContain("Количество треков: 2")
    })

    it("должен включить информацию о выбранных клипах", () => {
      const project = createMockProject()
      const selectedClips = [
        createMockClip({ name: "Клип 1", duration: 15 }),
        createMockClip({ name: "Клип 2", duration: 20, effects: [{ id: "effect-1" } as any] }),
      ]

      const prompt = createTimelineContextPrompt(project, null, selectedClips)

      expect(prompt).toContain("Выбранные клипы (2):")
      expect(prompt).toContain('"Клип 1" (15с)')
      expect(prompt).toContain('"Клип 2" (20с) с 1 эффектами')
    })

    it("должен ограничить количество отображаемых клипов", () => {
      const project = createMockProject()
      const selectedClips = [
        createMockClip({ name: "Клип 1" }),
        createMockClip({ name: "Клип 2" }),
        createMockClip({ name: "Клип 3" }),
        createMockClip({ name: "Клип 4" }),
        createMockClip({ name: "Клип 5" }),
      ]

      const prompt = createTimelineContextPrompt(project, null, selectedClips)

      expect(prompt).toContain("Выбранные клипы (5):")
      expect(prompt).toContain('"Клип 1"')
      expect(prompt).toContain('"Клип 2"')
      expect(prompt).toContain('"Клип 3"')
      expect(prompt).toContain("... и еще 2 клипов")
      expect(prompt).not.toContain('"Клип 4"')
      expect(prompt).not.toContain('"Клип 5"')
    })

    it("должен включить последние действия", () => {
      const project = createMockProject({ name: "Тестовый проект" })
      const prompt = createTimelineContextPrompt(project)

      expect(prompt).toContain("Последние действия:")
      expect(prompt).toContain('Открыт проект "Тестовый проект"')
    })
  })

  describe("createDetailedTimelineContext", () => {
    it("должен вернуть hasProject: false без проекта", () => {
      const context = createDetailedTimelineContext(null)

      expect(context).toEqual({
        hasProject: false,
        projectName: null,
        projectStats: null,
        activeSection: null,
        selectedClips: [],
      })
    })

    it("должен вернуть детальную информацию о проекте", () => {
      const project = createMockProject({
        name: "Детальный проект",
        description: "Полное описание",
        sections: [
          createMockSection({
            tracks: [
              {
                id: "track-1",
                type: "video",
                clips: [createMockClip({ duration: 30 })],
                name: "Track 1",
                enabled: true,
                locked: false,
              },
            ],
          }),
        ],
      })

      const context = createDetailedTimelineContext(project)

      expect(context.hasProject).toBe(true)
      expect(context.projectName).toBe("Детальный проект")
      expect(context.projectDescription).toBe("Полное описание")
      expect(context.projectSettings).toEqual({
        resolution: { width: 1920, height: 1080 },
        fps: 30,
        aspectRatio: "16:9",
      })
      expect(context.projectStats).toMatchObject({
        totalDuration: 60,
        sectionCount: 1,
        trackCount: 1,
        clipCount: 1,
        effectCount: 0,
        transitionCount: 0,
      })
    })

    it("должен включить информацию об активной секции", () => {
      const project = createMockProject()
      const activeSection = createMockSection({
        name: "Активная секция",
        duration: 120,
        tracks: [
          { id: "track-1", type: "video", clips: [], name: "Track 1", enabled: true, locked: false },
          { id: "track-2", type: "video", clips: [], name: "Track 2", enabled: true, locked: false },
        ],
      })

      const context = createDetailedTimelineContext(project, activeSection)

      expect(context.activeSection).toEqual({
        name: "Активная секция",
        duration: 120,
        trackCount: 2,
      })
    })

    it("должен обработать null активную секцию", () => {
      const project = createMockProject()
      const context = createDetailedTimelineContext(project, null)

      expect(context.activeSection).toBeNull()
    })

    it("должен включить детали выбранных клипов", () => {
      const project = createMockProject()
      const selectedClips = [
        createMockClip({
          name: "Клип 1",
          duration: 15,
          effects: [{ id: "effect-1" } as any, { id: "effect-2" } as any],
        }),
        createMockClip({
          name: "Клип 2",
          duration: 20,
          transitions: [{ id: "trans-1" } as any],
        }),
      ]

      const context = createDetailedTimelineContext(project, null, selectedClips)

      expect(context.selectedClips).toEqual([
        {
          name: "Клип 1",
          duration: 15,
          effectCount: 2,
          hasTransitions: false,
        },
        {
          name: "Клип 2",
          duration: 20,
          effectCount: 0,
          hasTransitions: true,
        },
      ])
    })

    it("должен обработать пустой массив выбранных клипов", () => {
      const project = createMockProject()
      const context = createDetailedTimelineContext(project, null, [])

      expect(context.selectedClips).toEqual([])
    })

    it("должен правильно подсчитать статистику для сложного проекта", () => {
      const project = createMockProject({
        sections: [
          createMockSection({
            duration: 100,
            tracks: [
              {
                id: "track-1",
                type: "video",
                clips: [
                  createMockClip({ effects: [{ id: "e1" } as any, { id: "e2" } as any] }),
                  createMockClip({ transitions: [{ id: "t1" } as any] }),
                ],
                name: "Track 1",
                enabled: true,
                locked: false,
              },
              {
                id: "track-2",
                type: "audio",
                clips: [createMockClip()],
                name: "Track 2",
                enabled: true,
                locked: false,
              },
            ],
          }),
          createMockSection({
            duration: 150,
            tracks: [
              {
                id: "track-3",
                type: "video",
                clips: [createMockClip({ effects: [{ id: "e3" } as any] })],
                name: "Track 3",
                enabled: true,
                locked: false,
              },
            ],
          }),
        ],
      })

      const context = createDetailedTimelineContext(project)

      expect(context.projectStats).toEqual({
        totalDuration: 250,
        sectionCount: 2,
        trackCount: 3,
        clipCount: 4,
        effectCount: 3,
        transitionCount: 1,
      })
    })
  })
})

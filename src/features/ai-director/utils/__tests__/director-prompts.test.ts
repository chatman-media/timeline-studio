/**
 * Tests for director prompts utilities
 */

import { describe, expect, it } from "vitest"

import type { FileAnalysisProgress } from "../../types/analysis-progress"
import {
  AI_DIRECTOR_SYSTEM_PROMPT,
  createAnalysisContext,
  createWelcomeMessage,
  DIRECTOR_PROMPT_EXAMPLES,
  parseUserIntent,
} from "../director-prompts"

describe("director-prompts", () => {
  describe("AI_DIRECTOR_SYSTEM_PROMPT", () => {
    it("should contain system prompt text", () => {
      expect(AI_DIRECTOR_SYSTEM_PROMPT).toBeTruthy()
      expect(AI_DIRECTOR_SYSTEM_PROMPT).toContain("AI Director")
      expect(AI_DIRECTOR_SYSTEM_PROMPT).toContain("монтаж")
    })

    it("should include style definitions", () => {
      expect(AI_DIRECTOR_SYSTEM_PROMPT).toContain("dynamic")
      expect(AI_DIRECTOR_SYSTEM_PROMPT).toContain("calm")
      expect(AI_DIRECTOR_SYSTEM_PROMPT).toContain("balanced")
    })

    it("should include transition types", () => {
      expect(AI_DIRECTOR_SYSTEM_PROMPT).toContain("cut")
      expect(AI_DIRECTOR_SYSTEM_PROMPT).toContain("cross_dissolve")
      expect(AI_DIRECTOR_SYSTEM_PROMPT).toContain("fade_to_black")
    })
  })

  describe("createAnalysisContext", () => {
    it("should handle empty files", () => {
      const context = createAnalysisContext([])

      expect(context).toContain("Анализ файлов еще не завершен")
    })

    it("should handle files in progress", () => {
      const filesProgress: FileAnalysisProgress[] = [
        {
          fileId: "file-1",
          fileName: "video1.mp4",
          filePath: "/path/to/video1.mp4",
          status: "analyzing",
          progress: 50,
          startTime: Date.now(),
          analyzers: [],
        },
      ]

      const context = createAnalysisContext(filesProgress)

      expect(context).toContain("Анализ файлов еще не завершен")
    })

    it("should create context from completed files", () => {
      const filesProgress: FileAnalysisProgress[] = [
        {
          fileId: "file-1",
          fileName: "video1.mp4",
          filePath: "/path/to/video1.mp4",
          status: "completed",
          progress: 100,
          startTime: Date.now(),
          duration: 5000,
          analyzers: [
            {
              type: "scene_detection",
              status: "completed",
              progress: 100,
              result: {
                metadata: {
                  itemsFound: 5,
                  confidence: 0.9,
                },
              },
            },
          ],
        },
      ]

      const context = createAnalysisContext(filesProgress)

      expect(context).toContain("РЕЗУЛЬТАТЫ АНАЛИЗА ВИДЕО")
      expect(context).toContain("video1.mp4")
      expect(context).toContain("/path/to/video1.mp4")
      expect(context).toContain("Видео анализ")
      expect(context).toContain("scene_detection")
    })

    it("should group analyzers by category", () => {
      const filesProgress: FileAnalysisProgress[] = [
        {
          fileId: "file-1",
          fileName: "video1.mp4",
          filePath: "/path/to/video1.mp4",
          status: "completed",
          progress: 100,
          startTime: Date.now(),
          analyzers: [
            {
              type: "scene_detection",
              status: "completed",
              progress: 100,
            },
            {
              type: "audio_quality",
              status: "completed",
              progress: 100,
            },
            {
              type: "mood_analysis",
              status: "completed",
              progress: 100,
            },
          ],
        },
      ]

      const context = createAnalysisContext(filesProgress)

      expect(context).toContain("Видео анализ")
      expect(context).toContain("Аудио анализ")
      expect(context).toContain("Контент анализ")
    })

    it("should include statistics", () => {
      const filesProgress: FileAnalysisProgress[] = [
        {
          fileId: "file-1",
          fileName: "video1.mp4",
          filePath: "/path/to/video1.mp4",
          status: "completed",
          progress: 100,
          startTime: Date.now(),
          analyzers: [],
        },
        {
          fileId: "file-2",
          fileName: "video2.mp4",
          filePath: "/path/to/video2.mp4",
          status: "error",
          progress: 0,
          startTime: Date.now(),
          analyzers: [],
        },
      ]

      const context = createAnalysisContext(filesProgress)

      expect(context).toContain("Всего проанализировано файлов: 1")
      expect(context).toContain("Файлов с ошибками: 1")
    })

    it("should handle analyzer metadata", () => {
      const filesProgress: FileAnalysisProgress[] = [
        {
          fileId: "file-1",
          fileName: "video1.mp4",
          filePath: "/path/to/video1.mp4",
          status: "completed",
          progress: 100,
          startTime: Date.now(),
          analyzers: [
            {
              type: "object_detection",
              status: "completed",
              progress: 100,
              result: {
                metadata: {
                  itemsFound: 10,
                  confidence: 0.85,
                },
              },
            },
          ],
        },
      ]

      const context = createAnalysisContext(filesProgress)

      expect(context).toContain("найдено 10 элементов")
      expect(context).toContain("уверенность 85%")
    })
  })

  describe("createWelcomeMessage", () => {
    it("should create message for single file", () => {
      const message = createWelcomeMessage(1)

      expect(message).toContain("Анализ завершен")
      expect(message).toContain("1 файл")
    })

    it("should create message for multiple files (2-4)", () => {
      const message = createWelcomeMessage(3)

      expect(message).toContain("3 файла")
    })

    it("should create message for many files (5+)", () => {
      const message = createWelcomeMessage(10)

      expect(message).toContain("10 файлов")
    })

    it("should include capabilities", () => {
      const message = createWelcomeMessage(1)

      expect(message).toContain("Создать монтаж")
      expect(message).toContain("Найти моменты")
      expect(message).toContain("Дать аналитику")
      expect(message).toContain("Подсказать идеи")
    })

    it("should include examples", () => {
      const message = createWelcomeMessage(1)

      expect(message).toContain("Создай динамичный ролик")
      expect(message).toContain("Найди 5 лучших моментов")
      expect(message).toContain("Покажи статистику")
    })
  })

  describe("parseUserIntent", () => {
    it("should recognize create_montage intent", () => {
      const tests = [
        "создай монтаж",
        "сделай ролик на 2 минуты",
        "смонтируй видео",
      ]

      tests.forEach((text) => {
        const result = parseUserIntent(text)
        expect(result.intent).toBe("create_montage")
      })
    })

    it("should extract duration from create_montage", () => {
      const result = parseUserIntent("создай ролик на 3 минуты")

      expect(result.intent).toBe("create_montage")
      expect(result.params.duration).toBe(3)
    })

    it("should recognize style from create_montage", () => {
      const dynamicResult = parseUserIntent("создай динамичный монтаж")
      expect(dynamicResult.params.style).toBe("dynamic")

      const calmResult = parseUserIntent("создай спокойный ролик")
      expect(calmResult.params.style).toBe("calm")
    })

    it("should recognize find_moments intent", () => {
      const tests = [
        "найди лучшие моменты",
        "покажи highlights",
        "найди 10 сцен",
      ]

      tests.forEach((text) => {
        const result = parseUserIntent(text)
        expect(result.intent).toBe("find_moments")
      })
    })

    it("should extract count from find_moments", () => {
      const result = parseUserIntent("найди 5 лучших моментов")

      expect(result.intent).toBe("find_moments")
      expect(result.params.count).toBe(5)
    })

    it("should use default count for find_moments", () => {
      const result = parseUserIntent("найди лучшие моменты")

      expect(result.intent).toBe("find_moments")
      expect(result.params.count).toBe(10)
    })

    it("should recognize analyze intent", () => {
      const tests = [
        "покажи статистику",
        "какое качество?",
        "анализ видео",
        "что нашел?",
      ]

      tests.forEach((text) => {
        const result = parseUserIntent(text)
        expect(result.intent).toBe("analyze")
      })
    })

    it("should recognize suggest intent", () => {
      const tests = [
        "посоветуй что сделать",
        "предложи варианты",
        "как лучше смонтировать",
        "дай идеи",
      ]

      tests.forEach((text) => {
        const result = parseUserIntent(text)
        expect(result.intent).toBe("suggest")
      })
    })

    it("should return other for unrecognized intent", () => {
      const result = parseUserIntent("привет, как дела?")

      expect(result.intent).toBe("other")
      expect(result.params).toEqual({})
    })

    it("should be case insensitive", () => {
      const result = parseUserIntent("СОЗДАЙ МОНТАЖ")

      expect(result.intent).toBe("create_montage")
    })
  })

  describe("DIRECTOR_PROMPT_EXAMPLES", () => {
    it("should have multiple categories", () => {
      expect(DIRECTOR_PROMPT_EXAMPLES).toBeTruthy()
      expect(DIRECTOR_PROMPT_EXAMPLES.length).toBeGreaterThan(0)

      const categories = DIRECTOR_PROMPT_EXAMPLES.map((ex) => ex.category)
      expect(categories).toContain("Highlights")
      expect(categories).toContain("Монтаж")
      expect(categories).toContain("Анализ")
      expect(categories).toContain("Рекомендации")
    })

    it("should have prompts for each category", () => {
      DIRECTOR_PROMPT_EXAMPLES.forEach((example) => {
        expect(example.category).toBeTruthy()
        expect(example.prompts).toBeTruthy()
        expect(example.prompts.length).toBeGreaterThan(0)
      })
    })

    it("should have varied prompts", () => {
      const highlightsCategory = DIRECTOR_PROMPT_EXAMPLES.find(
        (ex) => ex.category === "Highlights",
      )

      expect(highlightsCategory).toBeTruthy()
      expect(highlightsCategory!.prompts.length).toBeGreaterThan(2)
    })
  })
})

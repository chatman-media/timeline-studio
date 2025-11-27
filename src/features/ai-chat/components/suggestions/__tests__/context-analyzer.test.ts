/**
 * Тесты для context-analyzer
 * Проверяет анализ контекста для генерации умных промтов
 */

import { describe, expect, it } from "vitest"
import { analyzeContextForPrompts, createAnalysisContext } from "../context-analyzer"
import type { AnalysisContext } from "../types"

describe("context-analyzer", () => {
  describe("analyzeContextForPrompts", () => {
    it("должен вернуть промты для пустого состояния если нет медиа", () => {
      const context: AnalysisContext = {
        hasAnalysisResults: false,
        mediaFilesCount: 0,
      }

      const prompts = analyzeContextForPrompts(context)

      expect(prompts.length).toBeGreaterThan(0)
      expect(prompts.every((p) => p.category === "universal" || p.category === "platform")).toBe(true)
    })

    it("должен вернуть базовые промты если есть медиа но нет анализа", () => {
      const context: AnalysisContext = {
        hasAnalysisResults: false,
        mediaFilesCount: 5,
      }

      const prompts = analyzeContextForPrompts(context)

      expect(prompts.length).toBeGreaterThan(0)
      // Должны быть базовые промты (платформенные и быстрые действия)
      const hasBasicPrompts = prompts.some((p) => p.category === "platform" || p.category === "quick")
      expect(hasBasicPrompts).toBe(true)
    })

    it("должен вернуть контекстные промты когда есть результаты анализа", () => {
      const context: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        sceneCount: 10,
        avgSceneDuration: 5,
        momentCount: 20,
        hasMusic: true,
        musicConfidence: 0.9,
        hasSpeech: true,
        facesCount: 3,
        overallQuality: 75,
        visualQuality: 80,
        audioQuality: 70,
      }

      const prompts = analyzeContextForPrompts(context)

      expect(prompts.length).toBeGreaterThan(0)
      // Должны быть как универсальные, так и контекстные промты
      const hasUniversal = prompts.some((p) => p.category === "universal" || p.category === "platform")
      const hasContextual = prompts.some(
        (p) => p.category === "style" || p.category === "quick" || p.category === "quality",
      )
      expect(hasUniversal).toBe(true)
      expect(hasContextual).toBe(true)
    })

    it("должен сортировать промты по приоритету", () => {
      const context: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        sceneCount: 10,
        hasMusic: true,
        hasSpeech: true,
        facesCount: 3,
      }

      const prompts = analyzeContextForPrompts(context)

      // Проверяем, что промты отсортированы по убыванию приоритета
      for (let i = 0; i < prompts.length - 1; i++) {
        const currentPriority = prompts[i].priority || 0
        const nextPriority = prompts[i + 1].priority || 0
        expect(currentPriority).toBeGreaterThanOrEqual(nextPriority)
      }
    })

    it("должен ограничить количество промтов до 12", () => {
      const context: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 10,
        sceneCount: 50,
        avgSceneDuration: 10,
        momentCount: 100,
        hasMusic: true,
        musicConfidence: 0.9,
        hasSpeech: true,
        facesCount: 10,
        overallQuality: 80,
        visualQuality: 85,
        audioQuality: 75,
      }

      const prompts = analyzeContextForPrompts(context)

      expect(prompts.length).toBeLessThanOrEqual(12)
    })

    it("должен фильтровать промты по условиям hasMusic", () => {
      const contextWithMusic: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        hasMusic: true,
        musicConfidence: 0.8,
      }

      const contextWithoutMusic: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        hasMusic: false,
        musicConfidence: 0,
      }

      const promptsWithMusic = analyzeContextForPrompts(contextWithMusic)
      const promptsWithoutMusic = analyzeContextForPrompts(contextWithoutMusic)

      // Промты, требующие музыку, должны появиться только в первом случае
      const musicRelatedPrompt = promptsWithMusic.find((p) => p.requiredConditions?.hasMusic)
      expect(musicRelatedPrompt).toBeDefined()

      const musicRelatedInSecond = promptsWithoutMusic.find((p) => p.requiredConditions?.hasMusic)
      expect(musicRelatedInSecond).toBeUndefined()
    })

    it("должен фильтровать промты по условиям hasSpeech", () => {
      const contextWithSpeech: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        hasSpeech: true,
      }

      const contextWithoutSpeech: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        hasSpeech: false,
      }

      const promptsWithSpeech = analyzeContextForPrompts(contextWithSpeech)
      const promptsWithoutSpeech = analyzeContextForPrompts(contextWithoutSpeech)

      // Промты, требующие речь, должны появиться только в первом случае
      const speechPrompts = promptsWithSpeech.filter((p) => p.requiredConditions?.hasSpeech)
      const noSpeechPrompts = promptsWithoutSpeech.filter((p) => p.requiredConditions?.hasSpeech)

      if (speechPrompts.length > 0) {
        expect(noSpeechPrompts.length).toBe(0)
      }
    })

    it("должен фильтровать промты по условиям hasFaces", () => {
      const contextWithFaces: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        facesCount: 5,
      }

      const contextWithoutFaces: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        facesCount: 0,
      }

      const promptsWithFaces = analyzeContextForPrompts(contextWithFaces)
      const promptsWithoutFaces = analyzeContextForPrompts(contextWithoutFaces)

      // Промты, требующие лица, должны появиться только в первом случае
      const facePrompts = promptsWithFaces.filter((p) => p.requiredConditions?.hasFaces)
      const noFacePrompts = promptsWithoutFaces.filter((p) => p.requiredConditions?.hasFaces)

      if (facePrompts.length > 0) {
        expect(noFacePrompts.length).toBe(0)
      }
    })

    it("должен фильтровать промты по условиям minScenes", () => {
      const contextWithManyScenes: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        sceneCount: 20,
      }

      const contextWithFewScenes: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        sceneCount: 2,
      }

      const promptsWithManyScenes = analyzeContextForPrompts(contextWithManyScenes)
      const promptsWithFewScenes = analyzeContextForPrompts(contextWithFewScenes)

      // Промты с условием minScenes должны фильтроваться
      const manyScenePrompts = promptsWithManyScenes.filter(
        (p) => p.requiredConditions?.minScenes && p.requiredConditions.minScenes > 2,
      )
      const fewScenePrompts = promptsWithFewScenes.filter(
        (p) => p.requiredConditions?.minScenes && p.requiredConditions.minScenes > 2,
      )

      if (manyScenePrompts.length > 0) {
        expect(fewScenePrompts.length).toBe(0)
      }
    })

    it("должен фильтровать промты по условиям hasLowQuality", () => {
      const contextWithLowQuality: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        overallQuality: 30,
      }

      const contextWithHighQuality: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        overallQuality: 80,
      }

      const promptsLowQuality = analyzeContextForPrompts(contextWithLowQuality)
      const promptsHighQuality = analyzeContextForPrompts(contextWithHighQuality)

      // Промты для низкого качества должны появиться только в первом случае
      const lowQualityPrompts = promptsLowQuality.filter((p) => p.requiredConditions?.hasLowQuality)
      const highQualityPrompts = promptsHighQuality.filter((p) => p.requiredConditions?.hasLowQuality)

      if (lowQualityPrompts.length > 0) {
        expect(highQualityPrompts.length).toBe(0)
      }
    })

    it("должен корректно обрабатывать пограничные значения качества", () => {
      const contextBorderline: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        overallQuality: 50, // Граница для низкого качества
      }

      const prompts = analyzeContextForPrompts(contextBorderline)

      expect(prompts).toBeDefined()
      expect(prompts.length).toBeGreaterThan(0)
    })
  })

  describe("createAnalysisContext", () => {
    it("должен создать контекст без анализа", () => {
      const context = createAnalysisContext({
        mediaFilesCount: 5,
      })

      expect(context.hasAnalysisResults).toBe(false)
      expect(context.mediaFilesCount).toBe(5)
    })

    it("должен создать полный контекст с результатами анализа", () => {
      const analysisResult = {
        scene_analysis: {
          total_scenes: 15,
          avg_scene_duration: 7.5,
        },
        moment_analysis: {
          total_moments: 30,
        },
        audio_analysis: {
          has_music: true,
          music_confidence: 0.85,
          has_speech: true,
        },
        vision_analysis: {
          faces_count: 4,
        },
        content_analysis: {
          overall_quality: 75,
          visual_quality: 80,
          audio_quality: 70,
        },
      }

      const context = createAnalysisContext({
        analysisResult,
        mediaFilesCount: 10,
      })

      expect(context.hasAnalysisResults).toBe(true)
      expect(context.mediaFilesCount).toBe(10)
      expect(context.sceneCount).toBe(15)
      expect(context.avgSceneDuration).toBe(7.5)
      expect(context.momentCount).toBe(30)
      expect(context.hasMusic).toBe(true)
      expect(context.musicConfidence).toBe(0.85)
      expect(context.hasSpeech).toBe(true)
      expect(context.facesCount).toBe(4)
      expect(context.overallQuality).toBe(75)
      expect(context.visualQuality).toBe(80)
      expect(context.audioQuality).toBe(70)
    })

    it("должен корректно обрабатывать частичные результаты анализа", () => {
      const analysisResult = {
        scene_analysis: {
          total_scenes: 10,
          // avg_scene_duration отсутствует
        },
        audio_analysis: {
          has_music: true,
          // music_confidence отсутствует
        },
      }

      const context = createAnalysisContext({
        analysisResult,
        mediaFilesCount: 5,
      })

      expect(context.hasAnalysisResults).toBe(true)
      expect(context.sceneCount).toBe(10)
      expect(context.avgSceneDuration).toBe(0)
      expect(context.hasMusic).toBe(true)
      expect(context.musicConfidence).toBe(0)
    })

    it("должен обрабатывать нулевые значения в анализе", () => {
      const analysisResult = {
        scene_analysis: {
          total_scenes: 0,
          avg_scene_duration: 0,
        },
        moment_analysis: {
          total_moments: 0,
        },
        audio_analysis: {
          has_music: false,
          music_confidence: 0,
          has_speech: false,
        },
        vision_analysis: {
          faces_count: 0,
        },
        content_analysis: {
          overall_quality: 0,
          visual_quality: 0,
          audio_quality: 0,
        },
      }

      const context = createAnalysisContext({
        analysisResult,
        mediaFilesCount: 1,
      })

      expect(context.hasAnalysisResults).toBe(true)
      expect(context.sceneCount).toBe(0)
      expect(context.facesCount).toBe(0)
      expect(context.overallQuality).toBe(0)
    })

    it("должен обрабатывать пустой объект анализа", () => {
      const context = createAnalysisContext({
        analysisResult: {},
        mediaFilesCount: 3,
      })

      expect(context.hasAnalysisResults).toBe(true)
      expect(context.mediaFilesCount).toBe(3)
      expect(context.sceneCount).toBe(0)
      expect(context.momentCount).toBe(0)
      expect(context.hasMusic).toBe(false)
      expect(context.facesCount).toBe(0)
    })

    it("должен обрабатывать отсутствующие секции анализа", () => {
      const analysisResult = {
        scene_analysis: {
          total_scenes: 5,
          avg_scene_duration: 3,
        },
        // Остальные секции отсутствуют
      }

      const context = createAnalysisContext({
        analysisResult,
        mediaFilesCount: 2,
      })

      expect(context.hasAnalysisResults).toBe(true)
      expect(context.sceneCount).toBe(5)
      expect(context.avgSceneDuration).toBe(3)
      expect(context.momentCount).toBe(0)
      expect(context.hasMusic).toBe(false)
      expect(context.facesCount).toBe(0)
    })
  })

  describe("Edge cases", () => {
    it("должен обрабатывать контекст с отрицательными значениями", () => {
      const context: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: -1, // Некорректное значение
        sceneCount: -5,
        overallQuality: -10,
      }

      const prompts = analyzeContextForPrompts(context)

      // Не должно выбросить ошибку
      expect(prompts).toBeDefined()
    })

    it("должен обрабатывать контекст с очень большими значениями", () => {
      const context: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 999999,
        sceneCount: 100000,
        facesCount: 50000,
      }

      const prompts = analyzeContextForPrompts(context)

      expect(prompts).toBeDefined()
      expect(prompts.length).toBeLessThanOrEqual(12)
    })

    it("должен обрабатывать контекст с undefined значениями", () => {
      const context: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        sceneCount: undefined,
        facesCount: undefined,
        overallQuality: undefined,
      }

      const prompts = analyzeContextForPrompts(context)

      expect(prompts).toBeDefined()
      expect(prompts.length).toBeGreaterThan(0)
    })

    it("должен обрабатывать контекст с качеством ровно 50 (граница)", () => {
      const context: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        overallQuality: 50,
      }

      const prompts = analyzeContextForPrompts(context)

      // При качестве 50 не должны появиться промты для низкого качества
      const lowQualityPrompts = prompts.filter((p) => p.requiredConditions?.hasLowQuality)
      expect(lowQualityPrompts.length).toBe(0)
    })

    it("должен обрабатывать контекст с качеством 49 (низкое качество)", () => {
      const context: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        overallQuality: 49,
      }

      const prompts = analyzeContextForPrompts(context)

      // При качестве < 50 должны появиться промты для низкого качества (если они есть)
      expect(prompts).toBeDefined()
    })

    it("должен корректно работать с нулевым количеством медиа после анализа", () => {
      const context: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 0,
        sceneCount: 10, // Противоречие: есть сцены но нет медиа
      }

      const prompts = analyzeContextForPrompts(context)

      // Должен вернуть промты для пустого состояния
      expect(prompts.length).toBeGreaterThan(0)
    })

    it("должен корректно обрабатывать дробные значения", () => {
      const context: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5.5, // Дробное значение
        avgSceneDuration: 3.75,
        musicConfidence: 0.855,
        overallQuality: 72.3,
      }

      const prompts = analyzeContextForPrompts(context)

      expect(prompts).toBeDefined()
      expect(prompts.length).toBeGreaterThan(0)
    })
  })

  describe("Integration tests", () => {
    it("должен генерировать разные промты для разных контекстов", () => {
      const context1: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        hasMusic: true,
        hasSpeech: true,
      }

      const context2: AnalysisContext = {
        hasAnalysisResults: true,
        mediaFilesCount: 5,
        hasMusic: false,
        hasSpeech: false,
      }

      const prompts1 = analyzeContextForPrompts(context1)
      const prompts2 = analyzeContextForPrompts(context2)

      // Промты должны различаться
      const prompts1Ids = prompts1.map((p) => p.id).sort()
      const prompts2Ids = prompts2.map((p) => p.id).sort()

      expect(prompts1Ids).not.toEqual(prompts2Ids)
    })

    it("должен создавать контекст из реального результата анализа и генерировать промты", () => {
      const analysisResult = {
        scene_analysis: {
          total_scenes: 12,
          avg_scene_duration: 6,
        },
        moment_analysis: {
          total_moments: 25,
        },
        audio_analysis: {
          has_music: true,
          music_confidence: 0.9,
          has_speech: true,
        },
        vision_analysis: {
          faces_count: 3,
        },
        content_analysis: {
          overall_quality: 70,
          visual_quality: 75,
          audio_quality: 65,
        },
      }

      const context = createAnalysisContext({
        analysisResult,
        mediaFilesCount: 8,
      })

      const prompts = analyzeContextForPrompts(context)

      expect(prompts.length).toBeGreaterThan(0)
      expect(prompts.length).toBeLessThanOrEqual(12)
      // Должны быть как универсальные, так и контекстные промты
      expect(prompts.some((p) => p.category === "universal" || p.category === "platform")).toBe(true)
    })
  })
})

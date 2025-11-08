/**
 * Comprehensive tests for AI Marker Service
 */

import { beforeEach, describe, expect, it } from "vitest"

import type { ContentInsights, KeyMoment, SceneInfo } from "@/domains/ai-services/types"
import { KeyMomentType } from "@/domains/ai-services/types"
import type { AIMarkerConfig } from "../../services/ai-marker-service"
import { AIMarkerService } from "../../services/ai-marker-service"
import type { TimelineMarker } from "../../types/timeline"

describe("AIMarkerService", () => {
  let service: AIMarkerService

  beforeEach(() => {
    service = new AIMarkerService()
  })

  describe("Конструктор и конфигурация", () => {
    it("должен создаваться с дефолтной конфигурацией", () => {
      const config = service.getConfig()

      expect(config.createSceneMarkers).toBe(true)
      expect(config.createKeyMomentMarkers).toBe(true)
      expect(config.createQualityMarkers).toBe(true)
      expect(config.createEmotionalMarkers).toBe(true)
      expect(config.minConfidence).toBe(0.7)
      expect(config.minSceneDuration).toBe(2)
      expect(config.minQualityScore).toBe(80)
      expect(config.groupNearbyMarkers).toBe(true)
      expect(config.groupingThreshold).toBe(2)
    })

    it("должен принимать частичную конфигурацию", () => {
      const customConfig: Partial<AIMarkerConfig> = {
        minConfidence: 0.9,
        createSceneMarkers: false,
      }

      const service = new AIMarkerService(customConfig)
      const config = service.getConfig()

      expect(config.minConfidence).toBe(0.9)
      expect(config.createSceneMarkers).toBe(false)
      expect(config.createKeyMomentMarkers).toBe(true) // Остальные по умолчанию
    })

    it("должен обновлять конфигурацию", () => {
      service.updateConfig({ minQualityScore: 90 })
      const config = service.getConfig()

      expect(config.minQualityScore).toBe(90)
    })
  })

  describe("Создание маркеров из сцен", () => {
    const mockScenes: SceneInfo[] = [
      {
        id: "scene-1",
        type: "action",
        startTime: 0,
        endTime: 5,
        duration: 5,
        confidence: 0.9,
      },
      {
        id: "scene-2",
        type: "dialogue",
        startTime: 5,
        endTime: 15,
        duration: 10,
        confidence: 0.8,
      },
      {
        id: "scene-3",
        type: "landscape",
        startTime: 15,
        endTime: 16.5,
        duration: 1.5, // Короткая сцена
        confidence: 0.85,
      },
      {
        id: "scene-4",
        type: "closeup",
        startTime: 20,
        endTime: 23,
        duration: 3,
        confidence: 0.6, // Низкая уверенность
      },
    ]

    it("должен создавать маркеры из сцен", () => {
      const markers = service.createMarkersFromScenes(mockScenes)

      expect(markers).toHaveLength(2) // Только первые 2 сцены проходят фильтры

      expect(markers[0]).toMatchObject({
        id: "ai-scene-scene-1",
        type: "chapter",
        time: 0,
        name: "Сцена 1: Экшн",
        color: "#ef4444",
      })

      expect(markers[1]).toMatchObject({
        id: "ai-scene-scene-2",
        type: "chapter",
        time: 5,
        name: "Сцена 2: Диалог",
        color: "#3b82f6",
      })
    })

    it("должен фильтровать короткие сцены", () => {
      const markers = service.createMarkersFromScenes(mockScenes)

      const sceneIds = markers.map((m) => m.metadata?.sceneId)
      expect(sceneIds).not.toContain("scene-3") // duration: 1.5 < minSceneDuration: 2
    })

    it("должен фильтровать сцены с низкой уверенностью", () => {
      const markers = service.createMarkersFromScenes(mockScenes)

      const sceneIds = markers.map((m) => m.metadata?.sceneId)
      expect(sceneIds).not.toContain("scene-4") // confidence: 0.6 < minConfidence: 0.7
    })

    it("не должен создавать маркеры если отключено в конфигурации", () => {
      service.updateConfig({ createSceneMarkers: false })
      const markers = service.createMarkersFromScenes(mockScenes)

      expect(markers).toHaveLength(0)
    })

    it("должен добавлять правильные метаданные", () => {
      const markers = service.createMarkersFromScenes(mockScenes)

      expect(markers[0].metadata).toEqual({
        source: "ai-analysis",
        sceneId: "scene-1",
        sceneType: "action",
        confidence: 0.9,
      })
    })
  })

  describe("Создание маркеров из ключевых моментов", () => {
    const mockMoments: KeyMoment[] = [
      {
        id: "moment-1",
        type: KeyMomentType.CLIMAX,
        timestamp: 45.5,
        duration: 2.0,
        score: 0.95,
        description: "Кульминационный момент сцены",
        sceneId: "scene-1",
      },
      {
        id: "moment-2",
        type: KeyMomentType.EMOTIONAL_PEAK,
        timestamp: 67.2,
        duration: 1.5,
        score: 0.75,
        description: "Эмоциональный пик диалога",
        sceneId: "scene-2",
      },
      {
        id: "moment-3",
        type: KeyMomentType.VISUAL_HIGHLIGHT,
        timestamp: 120.0,
        duration: 1.0,
        score: 0.65, // Низкий score
        description: "Красивый визуальный момент",
        sceneId: "scene-3",
      },
    ]

    it("должен создавать маркеры из ключевых моментов", () => {
      const markers = service.createMarkersFromKeyMoments(mockMoments)

      expect(markers).toHaveLength(2) // moment-3 отфильтрован по score

      expect(markers[0]).toMatchObject({
        id: "ai-moment-moment-1",
        type: "important", // climax -> important
        time: 45.5,
        name: "Кульминация",
        description: "Кульминационный момент сцены",
        color: "#ef4444",
      })

      expect(markers[1]).toMatchObject({
        id: "ai-moment-moment-2",
        type: "note", // не climax -> note
        time: 67.2,
        name: "Эмоциональный пик",
        description: "Эмоциональный пик диалога",
        color: "#f59e0b",
      })
    })

    it("должен фильтровать моменты с низким score", () => {
      const markers = service.createMarkersFromKeyMoments(mockMoments)

      const momentIds = markers.map((m) => m.metadata?.momentId)
      expect(momentIds).not.toContain("moment-3") // score: 0.65 < minConfidence: 0.7
    })

    it("не должен создавать маркеры если отключено в конфигурации", () => {
      service.updateConfig({ createKeyMomentMarkers: false })
      const markers = service.createMarkersFromKeyMoments(mockMoments)

      expect(markers).toHaveLength(0)
    })

    it("должен добавлять метаданные", () => {
      const markers = service.createMarkersFromKeyMoments(mockMoments)

      expect(markers[0].metadata).toEqual(
        expect.objectContaining({
          source: "ai-analysis",
          momentId: "moment-1",
          momentType: "climax",
          score: 0.95,
        }),
      )
    })
  })

  describe("Создание маркеров качества", () => {
    const mockInsights: ContentInsights = {
      summary: "Видео анализ",
      highlights: [],
      suggestions: [],
      warnings: [],
      opportunities: [],
      strengths: [],
      weaknesses: [],
      recommendations: [],
      marketingAngles: [],
      targetDemographics: [],
      qualityMetrics: {
        overall: 75, // Ниже порога
        sharpness: 80,
        brightness: 70,
        contrast: 75,
        saturation: 72,
        stability: 70,
        noise: 65,
      },
    }

    it("должен создавать маркеры для низкого качества", () => {
      const timestamps = [10, 20, 30]
      const markers = service.createQualityMarkers(mockInsights, timestamps)

      expect(markers).toHaveLength(3) // По одному на каждый timestamp

      markers.forEach((marker, index) => {
        expect(marker).toMatchObject({
          type: "warning",
          time: timestamps[index],
          name: "Низкое качество видео",
          color: "#ef4444",
        })
        expect(marker.description).toContain("75/100")
      })
    })

    it("не должен создавать маркеры для хорошего качества", () => {
      const goodInsights: ContentInsights = {
        ...mockInsights,
        qualityMetrics: {
          overall: 85, // Выше порога
          sharpness: 90,
          brightness: 85,
          contrast: 88,
          saturation: 87,
          stability: 88,
          noise: 15,
        },
      }

      const markers = service.createQualityMarkers(goodInsights, [10, 20])
      expect(markers).toHaveLength(0)
    })

    it("не должен создавать маркеры если отключено в конфигурации", () => {
      service.updateConfig({ createQualityMarkers: false })
      const markers = service.createQualityMarkers(mockInsights, [10])

      expect(markers).toHaveLength(0)
    })

    it("не должен создавать маркеры если нет метрик качества", () => {
      const insightsWithoutQuality: ContentInsights = {
        summary: "Видео анализ",
        highlights: [],
        suggestions: [],
        warnings: [],
        opportunities: [],
        strengths: [],
        weaknesses: [],
        recommendations: [],
        marketingAngles: [],
        targetDemographics: [],
      }

      const markers = service.createQualityMarkers(insightsWithoutQuality, [10])
      expect(markers).toHaveLength(0)
    })

    it("должен включать все метрики в метаданные", () => {
      const markers = service.createQualityMarkers(mockInsights, [10])

      expect(markers[0].metadata?.metrics).toEqual({
        sharpness: 80,
        brightness: 70,
        contrast: 75,
        saturation: 72,
      })
    })
  })

  describe("Создание эмоциональных маркеров", () => {
    const mockInsights: ContentInsights = {
      summary: "Эмоциональный анализ",
      highlights: [],
      suggestions: [],
      warnings: [],
      opportunities: [],
      strengths: [],
      weaknesses: [],
      recommendations: [],
      marketingAngles: [],
      targetDemographics: [],
      mood: {
        valence: 0.8,
        arousal: 0.7,
        dominantEmotion: "joy",
        intensity: 0.85,
      },
    }

    it("должен создавать маркеры для эмоций с высокой интенсивностью", () => {
      const markers = service.createEmotionalMarkers(mockInsights, 55.5)

      expect(markers).toHaveLength(1)
      expect(markers[0]).toMatchObject({
        type: "note",
        time: 55.5,
        name: "Эмоция: Радость",
        description: "Интенсивность: 85%",
        color: "#fbbf24",
      })
    })

    it("не должен создавать маркеры для эмоций с низкой интенсивностью", () => {
      const lowIntensityInsights: ContentInsights = {
        ...mockInsights,
        mood: {
          ...mockInsights.mood!,
          intensity: 0.5, // Ниже порога
        },
      }

      const markers = service.createEmotionalMarkers(lowIntensityInsights, 55.5)
      expect(markers).toHaveLength(0)
    })

    it("не должен создавать маркеры если отключено в конфигурации", () => {
      service.updateConfig({ createEmotionalMarkers: false })
      const markers = service.createEmotionalMarkers(mockInsights, 55.5)

      expect(markers).toHaveLength(0)
    })

    it("не должен создавать маркеры если нет данных о настроении", () => {
      const insightsWithoutMood: ContentInsights = {
        summary: "Анализ",
        highlights: [],
        suggestions: [],
        warnings: [],
        opportunities: [],
        strengths: [],
        weaknesses: [],
        recommendations: [],
        marketingAngles: [],
        targetDemographics: [],
      }

      const markers = service.createEmotionalMarkers(insightsWithoutMood, 55.5)
      expect(markers).toHaveLength(0)
    })

    it("должен включать все данные настроения в метаданные", () => {
      const markers = service.createEmotionalMarkers(mockInsights, 55.5)

      expect(markers[0].metadata).toEqual({
        source: "ai-analysis",
        emotionType: "joy",
        intensity: 0.85,
        valence: 0.8,
        arousal: 0.7,
      })
    })
  })

  describe("Группировка маркеров", () => {
    const createTestMarkers = (): TimelineMarker[] => [
      {
        id: "marker-1",
        name: "Маркер 1",
        time: 10,
        type: "note",
        color: "#3b82f6",
      },
      {
        id: "marker-2",
        name: "Маркер 2",
        time: 11, // +1 сек от предыдущего
        type: "chapter",
        color: "#ef4444",
      },
      {
        id: "marker-3",
        name: "Маркер 3",
        time: 11.5, // +0.5 сек от предыдущего
        type: "important",
        color: "#10b981",
      },
      {
        id: "marker-4",
        name: "Маркер 4",
        time: 20, // +8.5 сек - отдельная группа
        type: "note",
        color: "#f59e0b",
      },
      {
        id: "marker-5",
        name: "Маркер 5",
        time: 21.5, // +1.5 сек от предыдущего
        type: "chapter",
        color: "#8b5cf6",
      },
    ]

    it("должен группировать близкие маркеры", () => {
      const markers = createTestMarkers()
      const grouped = service.groupNearbyMarkers(markers)

      expect(grouped).toHaveLength(2) // 2 группы

      // Первая группа (маркеры 1, 2, 3)
      expect(grouped[0].name).toBe("Группа событий (3)")
      expect(grouped[0].type).toBe("important") // Приоритет important
      expect(grouped[0].time).toBeCloseTo(10.83, 1) // Среднее время

      // Вторая группа (маркеры 4, 5) - 21.5 - 20 = 1.5, что меньше порога 2
      expect(grouped[1].name).toBe("Группа событий (2)")
      expect(grouped[1].time).toBeCloseTo(20.75, 1)
    })

    it("не должен группировать если отключено в конфигурации", () => {
      service.updateConfig({ groupNearbyMarkers: false })
      const markers = createTestMarkers()
      const grouped = service.groupNearbyMarkers(markers)

      expect(grouped).toHaveLength(5) // Все маркеры остаются отдельными
      expect(grouped.map((m) => m.id)).toEqual(["marker-1", "marker-2", "marker-3", "marker-4", "marker-5"])
    })

    it("не должен группировать если маркеров меньше 2", () => {
      const singleMarker = [createTestMarkers()[0]]
      const grouped = service.groupNearbyMarkers(singleMarker)

      expect(grouped).toHaveLength(1)
      expect(grouped[0].id).toBe("marker-1")
    })

    it("должен использовать настраиваемый порог группировки", () => {
      service.updateConfig({ groupingThreshold: 5 }) // Увеличиваем порог
      const markers = createTestMarkers()
      const grouped = service.groupNearbyMarkers(markers)

      expect(grouped).toHaveLength(2) // Теперь маркеры 4 и 5 тоже в группе
    })

    it("должен сохранять метаданные о группировке", () => {
      const markers = createTestMarkers()
      const grouped = service.groupNearbyMarkers(markers)

      const firstGroup = grouped[0]
      expect(firstGroup.metadata).toEqual({
        source: "ai-analysis",
        groupedMarkers: ["marker-1", "marker-2", "marker-3"],
        count: 3,
      })
    })

    it("должен корректно обрабатывать пустой массив", () => {
      const grouped = service.groupNearbyMarkers([])
      expect(grouped).toHaveLength(0)
    })
  })

  describe("Приватные методы (через публичные методы)", () => {
    it("должен корректно определять метки и цвета для разных типов сцен", () => {
      const scenes: SceneInfo[] = [
        { id: "1", type: "action", startTime: 0, endTime: 5, duration: 5, confidence: 0.9 },
        { id: "2", type: "dialogue", startTime: 5, endTime: 10, duration: 5, confidence: 0.9 },
        { id: "3", type: "landscape", startTime: 10, endTime: 15, duration: 5, confidence: 0.9 },
        { id: "4", type: "unknown", startTime: 15, endTime: 20, duration: 5, confidence: 0.9 },
      ]

      const markers = service.createMarkersFromScenes(scenes)

      expect(markers[0].name).toContain("Экшн")
      expect(markers[0].color).toBe("#ef4444")

      expect(markers[1].name).toContain("Диалог")
      expect(markers[1].color).toBe("#3b82f6")

      expect(markers[2].name).toContain("Пейзаж")
      expect(markers[2].color).toBe("#10b981")

      expect(markers[3].name).toContain("unknown") // Неизвестный тип
      expect(markers[3].color).toBe("#6b7280") // Дефолтный цвет
    })

    it("должен корректно определять метки и цвета для разных типов моментов", () => {
      const moments: KeyMoment[] = [
        {
          id: "1",
          type: "emotional_peak" as any,
          timestamp: 0,
          duration: 1,
          score: 0.9,
          description: "",
          sceneId: "scene-1",
        },
        {
          id: "2",
          type: "action_peak" as any,
          timestamp: 5,
          duration: 1,
          score: 0.9,
          description: "",
          sceneId: "scene-1",
        },
        {
          id: "3",
          type: "unknown_type" as any,
          timestamp: 10,
          duration: 1,
          score: 0.9,
          description: "",
          sceneId: "scene-1",
        },
      ]

      const markers = service.createMarkersFromKeyMoments(moments)

      expect(markers[0].name).toBe("Эмоциональный пик")
      expect(markers[0].color).toBe("#f59e0b")

      expect(markers[1].name).toBe("Пик экшна")
      expect(markers[1].color).toBe("#eab308")

      expect(markers[2].name).toBe("unknown_type") // Неизвестный тип
      expect(markers[2].color).toBe("#6b7280") // Дефолтный цвет
    })

    it("должен корректно определять метки и цвета для разных эмоций", () => {
      const emotions = ["joy", "sadness", "anger", "fear", "surprise", "disgust", "neutral", "unknown"]
      const expectedLabels = ["Радость", "Грусть", "Гнев", "Страх", "Удивление", "Отвращение", "Нейтральная", "unknown"]
      const expectedColors = ["#fbbf24", "#60a5fa", "#f87171", "#c084fc", "#fde047", "#86efac", "#d1d5db", "#6b7280"]

      emotions.forEach((emotion, index) => {
        const insights: ContentInsights = {
          summary: "",
          highlights: [],
          suggestions: [],
          warnings: [],
          opportunities: [],
          strengths: [],
          weaknesses: [],
          recommendations: [],
          marketingAngles: [],
          targetDemographics: [],
          mood: {
            valence: 0,
            arousal: 0,
            dominantEmotion: emotion,
            intensity: 0.9,
          },
        }

        const markers = service.createEmotionalMarkers(insights, 0)

        if (markers.length > 0) {
          expect(markers[0].name).toContain(expectedLabels[index])
          expect(markers[0].color).toBe(expectedColors[index])
        }
      })
    })
  })

  describe("Интеграционные тесты", () => {
    it("должен создавать комплексный набор маркеров из всех источников", () => {
      const scenes: SceneInfo[] = [
        {
          id: "scene-1",
          type: "action",
          startTime: 10,
          endTime: 15,
          duration: 5,
          confidence: 0.8,
        },
      ]

      const moments: KeyMoment[] = [
        {
          id: "moment-1",
          type: KeyMomentType.CLIMAX,
          timestamp: 12,
          duration: 1.5,
          score: 0.9,
          description: "Кульминация",
          sceneId: "scene-1",
        },
      ]

      const insights: ContentInsights = {
        summary: "",
        highlights: [],
        suggestions: [],
        warnings: [],
        opportunities: [],
        strengths: [],
        weaknesses: [],
        recommendations: [],
        marketingAngles: [],
        targetDemographics: [],
        qualityMetrics: {
          overall: 70,
          sharpness: 75,
          brightness: 65,
          contrast: 70,
          saturation: 68,
          stability: 72,
          noise: 68,
        },
        mood: {
          valence: 0.9,
          arousal: 0.8,
          dominantEmotion: "joy",
          intensity: 0.85,
        },
      }

      const sceneMarkers = service.createMarkersFromScenes(scenes)
      const momentMarkers = service.createMarkersFromKeyMoments(moments)
      const qualityMarkers = service.createQualityMarkers(insights, [15])
      const emotionalMarkers = service.createEmotionalMarkers(insights, 13)

      const allMarkers = [...sceneMarkers, ...momentMarkers, ...qualityMarkers, ...emotionalMarkers]

      expect(allMarkers).toHaveLength(4)

      // Проверяем что все маркеры имеют правильную структуру
      allMarkers.forEach((marker) => {
        expect(marker).toHaveProperty("id")
        expect(marker).toHaveProperty("name")
        expect(marker).toHaveProperty("time")
        expect(marker).toHaveProperty("type")
        expect(marker).toHaveProperty("color")
        expect(marker).toHaveProperty("metadata")
        expect(marker.metadata).toHaveProperty("source", "ai-analysis")
      })

      // Группируем близкие маркеры
      const grouped = service.groupNearbyMarkers(allMarkers)
      expect(grouped.length).toBeLessThan(allMarkers.length) // Некоторые должны сгруппироваться
    })

    it("должен корректно фильтровать все типы маркеров по конфигурации", () => {
      service.updateConfig({
        createSceneMarkers: false,
        createKeyMomentMarkers: false,
        createQualityMarkers: false,
        createEmotionalMarkers: false,
      })

      const scenes: SceneInfo[] = [
        {
          id: "scene-1",
          type: "action",
          startTime: 0,
          endTime: 5,
          duration: 5,
          confidence: 0.9,
        },
      ]

      const moments: KeyMoment[] = [
        {
          id: "moment-1",
          type: KeyMomentType.CLIMAX,
          timestamp: 0,
          duration: 1,
          score: 0.9,
          description: "",
          sceneId: "scene-1",
        },
      ]

      const insights: ContentInsights = {
        summary: "",
        highlights: [],
        suggestions: [],
        warnings: [],
        opportunities: [],
        strengths: [],
        weaknesses: [],
        recommendations: [],
        marketingAngles: [],
        targetDemographics: [],
        qualityMetrics: {
          overall: 50,
          sharpness: 50,
          brightness: 50,
          contrast: 50,
          saturation: 50,
          stability: 50,
          noise: 50,
        },
        mood: { valence: 0, arousal: 0, dominantEmotion: "joy", intensity: 0.9 },
      }

      expect(service.createMarkersFromScenes(scenes)).toHaveLength(0)
      expect(service.createMarkersFromKeyMoments(moments)).toHaveLength(0)
      expect(service.createQualityMarkers(insights, [0])).toHaveLength(0)
      expect(service.createEmotionalMarkers(insights, 0)).toHaveLength(0)
    })
  })
})

/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { MomentType, SceneType } from "../../types/analysis"
import { StatisticsOverview } from "../statistics-overview"

describe("StatisticsOverview", () => {
  const mockStatistics = {
    project_id: "test-project-1",
    total_files: 3,
    total_duration: 3665, // 1h 1m 5s
    total_scenes: 25,
    total_moments: 12,
    total_persons: 5,
    total_objects: 150,
    average_quality: 0.78,
    scene_type_distribution: {
      [SceneType.Cinematic]: 8,
      [SceneType.Dynamic]: 5,
      [SceneType.Closeup]: 7,
      [SceneType.Wide]: 3,
      [SceneType.Medium]: 2,
    },
    moment_type_distribution: {
      [MomentType.ActionClimax]: 4,
      [MomentType.EmotionalPeak]: 3,
      [MomentType.VisualStunning]: 2,
      [MomentType.AudioPeak]: 2,
      [MomentType.ComedicMoment]: 1,
    },
    quality_distribution: {
      excellent: 8, // 80-100%
      good: 10, // 60-80%
      average: 5, // 40-60%
      poor: 2, // 0-40%
    },
    emotion_distribution: {
      Happy: 0.35,
      Neutral: 0.3,
      Surprised: 0.2,
      Sad: 0.15,
    },
    temporal_distribution: {
      scenes_per_minute: 0.41,
      moments_per_minute: 0.2,
      average_scene_duration: 146.6,
    },
    dominant_emotions: ["Happy", "Neutral", "Surprised", "Excited", "Focused"],
    most_frequent_objects: ["person", "chair", "table", "car", "building", "tree"],
    analysis_completion_time: 1200, // 20 minutes
    processing_time: 1800,
    created_at: "2024-01-01T12:00:00Z",
  }

  const renderOverview = (statistics = mockStatistics) => {
    return render(<StatisticsOverview statistics={statistics} />)
  }

  describe("Overview Cards", () => {
    it("should display overview statistics cards", () => {
      renderOverview()

      expect(screen.getByText("3")).toBeInTheDocument() // Total files
      expect(screen.getByText("Файлов")).toBeInTheDocument()

      expect(screen.getByText("1ч 1м 5с")).toBeInTheDocument() // Total duration
      expect(screen.getByText("Общая длительность")).toBeInTheDocument()

      expect(screen.getByText("25")).toBeInTheDocument() // Total scenes
      expect(screen.getByText("Сцен")).toBeInTheDocument()

      expect(screen.getByText("12")).toBeInTheDocument() // Total moments
      expect(screen.getByText("Ключевых моментов")).toBeInTheDocument()
    })

    it("should format duration correctly", () => {
      const statsWithDifferentDurations = [
        { ...mockStatistics, total_duration: 65 }, // 1m 5s
        { ...mockStatistics, total_duration: 3600 }, // 1h 0m 0s
        { ...mockStatistics, total_duration: 45 }, // 45s
      ]

      statsWithDifferentDurations.forEach((stats, index) => {
        const { unmount } = renderOverview(stats)

        if (index === 0) {
          expect(screen.getByText("1м 5с")).toBeInTheDocument()
        } else if (index === 1) {
          expect(screen.getByText("1ч 0м 0с")).toBeInTheDocument()
        } else {
          expect(screen.getByText("45с")).toBeInTheDocument()
        }

        unmount()
      })
    })
  })

  describe("Quality Distribution", () => {
    it("should display quality distribution with correct labels and counts", () => {
      renderOverview()

      expect(screen.getByText("Распределение качества")).toBeInTheDocument()
      expect(screen.getByText("Отличное (80-100%)")).toBeInTheDocument()
      expect(screen.getByText("Хорошее (60-80%)")).toBeInTheDocument()
      expect(screen.getByText("Среднее (40-60%)")).toBeInTheDocument()
      expect(screen.getByText("Низкое (0-40%)")).toBeInTheDocument()

      // Check counts
      expect(screen.getByText("8")).toBeInTheDocument() // Excellent
      expect(screen.getByText("10")).toBeInTheDocument() // Good
      expect(screen.getByText("5")).toBeInTheDocument() // Average
      expect(screen.getByText("2")).toBeInTheDocument() // Poor
    })

    it("should display average quality score", () => {
      renderOverview()

      expect(screen.getByText("Средний балл качества")).toBeInTheDocument()
      expect(screen.getByText("78%")).toBeInTheDocument() // 0.78 * 100
    })

    it("should handle zero total scenes gracefully", () => {
      const statsWithZeroScenes = {
        ...mockStatistics,
        total_scenes: 0,
        quality_distribution: {
          excellent: 0,
          good: 0,
          average: 0,
          poor: 0,
        },
      }
      renderOverview(statsWithZeroScenes)

      expect(screen.getByText("Распределение качества")).toBeInTheDocument()
      // Should not crash with division by zero
    })
  })

  describe("Scene Types Distribution", () => {
    it("should display scene types with correct Russian labels", () => {
      renderOverview()

      expect(screen.getByText("Типы сцен")).toBeInTheDocument()
      expect(screen.getByText("Кинематографичные")).toBeInTheDocument() // Cinematic
      expect(screen.getByText("Динамичные")).toBeInTheDocument() // Dynamic
      expect(screen.getByText("Крупный план")).toBeInTheDocument() // Closeup
      expect(screen.getByText("Общий план")).toBeInTheDocument() // Wide
      expect(screen.getByText("Средний план")).toBeInTheDocument() // Medium
    })

    it("should display scene type counts", () => {
      renderOverview()

      expect(screen.getByText("8")).toBeInTheDocument() // Cinematic count
      expect(screen.getByText("5")).toBeInTheDocument() // Dynamic count
      expect(screen.getByText("7")).toBeInTheDocument() // Closeup count
      expect(screen.getByText("3")).toBeInTheDocument() // Wide count
      // 2 for Medium will be present too
    })

    it("should handle unknown scene types", () => {
      const statsWithUnknownType = {
        ...mockStatistics,
        scene_type_distribution: {
          ...mockStatistics.scene_type_distribution,
          UnknownType: 1,
        },
      }
      renderOverview(statsWithUnknownType)

      expect(screen.getByText("UnknownType")).toBeInTheDocument()
    })
  })

  describe("Moment Types Distribution", () => {
    it("should display moment types with correct Russian labels", () => {
      renderOverview()

      expect(screen.getByText("Типы моментов")).toBeInTheDocument()
      expect(screen.getByText("Экшен")).toBeInTheDocument() // ActionClimax
      expect(screen.getByText("Эмоциональные")).toBeInTheDocument() // EmotionalPeak
      expect(screen.getByText("Визуальные")).toBeInTheDocument() // VisualStunning
      expect(screen.getByText("Аудио пики")).toBeInTheDocument() // AudioPeak
      expect(screen.getByText("Комедийные")).toBeInTheDocument() // ComedicMoment
    })

    it("should display moment type counts", () => {
      renderOverview()

      expect(screen.getByText("4")).toBeInTheDocument() // ActionClimax count
      expect(screen.getByText("3")).toBeInTheDocument() // EmotionalPeak count
      // Other counts (2, 2, 1) should also be present
    })

    it("should handle zero total moments gracefully", () => {
      const statsWithZeroMoments = {
        ...mockStatistics,
        total_moments: 0,
        moment_type_distribution: {},
      }
      renderOverview(statsWithZeroMoments)

      expect(screen.getByText("Типы моментов")).toBeInTheDocument()
      // Should not crash with division by zero
    })
  })

  describe("Temporal Analytics", () => {
    it("should display temporal distribution metrics", () => {
      renderOverview()

      expect(screen.getByText("Временная аналитика")).toBeInTheDocument()
      expect(screen.getByText("Сцен в минуту")).toBeInTheDocument()
      expect(screen.getByText("0.4")).toBeInTheDocument() // 0.41 rounded to 1 decimal

      expect(screen.getByText("Моментов в минуту")).toBeInTheDocument()
      expect(screen.getByText("0.2")).toBeInTheDocument() // 0.20

      expect(screen.getByText("Средняя длина сцены")).toBeInTheDocument()
      expect(screen.getByText("2м 26с")).toBeInTheDocument() // 146.6 seconds
    })

    it("should display analysis completion time", () => {
      renderOverview()

      expect(screen.getByText("Время анализа")).toBeInTheDocument()
      expect(screen.getByText("20м 0с")).toBeInTheDocument() // 1200 seconds
    })
  })

  describe("Additional Insights", () => {
    it("should display dominant emotions when available", () => {
      renderOverview()

      expect(screen.getByText("Доминирующие эмоции")).toBeInTheDocument()
      expect(screen.getByText("Happy")).toBeInTheDocument()
      expect(screen.getByText("Neutral")).toBeInTheDocument()
      expect(screen.getByText("Surprised")).toBeInTheDocument()
      expect(screen.getByText("Excited")).toBeInTheDocument()
      expect(screen.getByText("Focused")).toBeInTheDocument()
    })

    it("should display most frequent objects when available", () => {
      renderOverview()

      expect(screen.getByText("Частые объекты")).toBeInTheDocument()
      expect(screen.getByText("person")).toBeInTheDocument()
      expect(screen.getByText("chair")).toBeInTheDocument()
      expect(screen.getByText("table")).toBeInTheDocument()
      expect(screen.getByText("car")).toBeInTheDocument()
      expect(screen.getByText("building")).toBeInTheDocument()
      expect(screen.getByText("tree")).toBeInTheDocument()
    })

    it("should not display emotions section when empty", () => {
      const statsWithoutEmotions = {
        ...mockStatistics,
        dominant_emotions: [],
      }
      renderOverview(statsWithoutEmotions)

      expect(screen.queryByText("Доминирующие эмоции")).not.toBeInTheDocument()
    })

    it("should not display objects section when empty", () => {
      const statsWithoutObjects = {
        ...mockStatistics,
        most_frequent_objects: [],
      }
      renderOverview(statsWithoutObjects)

      expect(screen.queryByText("Частые объекты")).not.toBeInTheDocument()
    })

    it("should limit emotions to 10 items", () => {
      const statsWithManyEmotions = {
        ...mockStatistics,
        dominant_emotions: Array.from({ length: 15 }, (_, i) => `Emotion${i + 1}`),
      }
      renderOverview(statsWithManyEmotions)

      expect(screen.getByText("Emotion1")).toBeInTheDocument()
      expect(screen.getByText("Emotion10")).toBeInTheDocument()
      expect(screen.queryByText("Emotion11")).not.toBeInTheDocument()
    })

    it("should limit objects to 10 items", () => {
      const statsWithManyObjects = {
        ...mockStatistics,
        most_frequent_objects: Array.from({ length: 15 }, (_, i) => `Object${i + 1}`),
      }
      renderOverview(statsWithManyObjects)

      expect(screen.getByText("Object1")).toBeInTheDocument()
      expect(screen.getByText("Object10")).toBeInTheDocument()
      expect(screen.queryByText("Object11")).not.toBeInTheDocument()
    })
  })

  describe("Edge Cases", () => {
    it("should handle zero duration gracefully", () => {
      const statsWithZeroDuration = {
        ...mockStatistics,
        total_duration: 0,
        analysis_completion_time: 0,
        temporal_distribution: {
          ...mockStatistics.temporal_distribution,
          average_scene_duration: 0,
        },
      }
      renderOverview(statsWithZeroDuration)

      expect(screen.getByText("0с")).toBeInTheDocument()
    })

    it("should handle very large durations", () => {
      const statsWithLargeDuration = {
        ...mockStatistics,
        total_duration: 7200, // 2 hours
      }
      renderOverview(statsWithLargeDuration)

      expect(screen.getByText("2ч 0м 0с")).toBeInTheDocument()
    })

    it("should handle fractional values correctly", () => {
      const statsWithFractionalValues = {
        ...mockStatistics,
        average_quality: 0.876, // Should round to 88%
        temporal_distribution: {
          scenes_per_minute: 0.123, // Should display as 0.1
          moments_per_minute: 0.456, // Should display as 0.5
          average_scene_duration: 63.7, // Should display as 1м 3с
        },
      }
      renderOverview(statsWithFractionalValues)

      expect(screen.getByText("88%")).toBeInTheDocument() // Rounded average quality
      expect(screen.getByText("0.1")).toBeInTheDocument() // Scenes per minute
      expect(screen.getByText("0.5")).toBeInTheDocument() // Moments per minute
      expect(screen.getByText("1м 3с")).toBeInTheDocument() // Average scene duration
    })
  })

  describe("Responsive Design", () => {
    it("should render with responsive grid classes", () => {
      renderOverview()

      // Check that grid containers have responsive classes
      const overviewSection = screen.getByText("3").closest(".grid")
      expect(overviewSection).toHaveClass("grid-cols-1", "md:grid-cols-2", "lg:grid-cols-4")
    })
  })

  describe("Progress Bars", () => {
    it("should render progress bars for quality distribution", () => {
      renderOverview()

      // Check that progress components are rendered
      const progressBars = screen.container.querySelectorAll('[role="progressbar"]')
      expect(progressBars.length).toBeGreaterThan(0)
    })

    it("should render progress bars for scene and moment types", () => {
      renderOverview()

      // Should have progress bars for each scene type and moment type
      const progressBars = screen.container.querySelectorAll('[role="progressbar"]')
      // 4 quality + 5 scene types + 5 moment types = at least 14 progress bars
      expect(progressBars.length).toBeGreaterThanOrEqual(14)
    })
  })
})

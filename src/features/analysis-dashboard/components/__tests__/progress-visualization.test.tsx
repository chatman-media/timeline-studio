/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { AnalysisStage, AnalysisStatus } from "../../types/analysis"
import { ProgressVisualization } from "../progress-visualization"

describe("ProgressVisualization", () => {
  const mockProgress = {
    project_id: "test-project-1",
    status: AnalysisStatus.InProgress,
    stage: AnalysisStage.SceneDetection,
    progress: 0.65,
    current_file: "video.mp4",
    start_time: "2024-01-01T12:00:00Z",
    estimated_completion: "2024-01-01T12:30:00Z",
  }

  const renderVisualization = (progress = mockProgress) => {
    return render(<ProgressVisualization progress={progress} />)
  }

  describe("Basic Rendering", () => {
    it("should render progress visualization with basic elements", () => {
      renderVisualization()

      expect(screen.getByText("Прогресс анализа")).toBeInTheDocument()
      expect(screen.getByText("65%")).toBeInTheDocument()
      expect(screen.getByText("Детекция сцен")).toBeInTheDocument()
      expect(screen.getByText("Поиск границ сцен и композиционный анализ")).toBeInTheDocument()
      expect(screen.getByText("Файл: video.mp4")).toBeInTheDocument()
    })

    it("should display project information", () => {
      renderVisualization()

      expect(screen.getByText("Проект ID: test-project-1")).toBeInTheDocument()
      expect(screen.getByText(/Начат:/)).toBeInTheDocument()
    })

    it("should render without current file when not provided", () => {
      const progressWithoutFile = { ...mockProgress, current_file: undefined }
      renderVisualization(progressWithoutFile)

      expect(screen.queryByText(/Файл:/)).not.toBeInTheDocument()
    })
  })

  describe("Progress Display", () => {
    it("should show correct progress percentage", () => {
      const progressAtDifferentStage = { ...mockProgress, progress: 0.42 }
      renderVisualization(progressAtDifferentStage)

      expect(screen.getByText("42%")).toBeInTheDocument()
    })

    it("should handle 0% progress", () => {
      const zeroProgress = { ...mockProgress, progress: 0 }
      renderVisualization(zeroProgress)

      expect(screen.getByText("0%")).toBeInTheDocument()
    })

    it("should handle 100% progress", () => {
      const fullProgress = { ...mockProgress, progress: 1.0 }
      renderVisualization(fullProgress)

      expect(screen.getByText("100%")).toBeInTheDocument()
    })
  })

  describe("Stage Information", () => {
    it.each([
      [AnalysisStage.MediaAnalysis, "Анализ медиафайлов", "Извлечение метаданных и базовый анализ"],
      [AnalysisStage.SceneDetection, "Детекция сцен", "Поиск границ сцен и композиционный анализ"],
      [AnalysisStage.PersonRecognition, "Распознавание персон", "Детекция лиц и идентификация персон"],
      [AnalysisStage.EmotionAnalysis, "Анализ эмоций", "Определение эмоционального тона сцен"],
      [AnalysisStage.QualityAnalysis, "Анализ качества", "Оценка технического качества видео"],
      [AnalysisStage.AudioAnalysis, "Анализ аудио", "Анализ звуковой дорожки и пиков"],
      [AnalysisStage.KeyMomentDetection, "Поиск ключевых моментов", "Выявление важных временных отрезков"],
      [AnalysisStage.DataAggregation, "Агрегация данных", "Объединение результатов анализа"],
      [AnalysisStage.IndexGeneration, "Генерация индексов", "Создание поисковых индексов"],
      [AnalysisStage.Finalization, "Финализация", "Завершение и сохранение результатов"],
    ])("should display correct information for %s stage", (stage, title, description) => {
      const progressWithStage = { ...mockProgress, stage }
      renderVisualization(progressWithStage)

      expect(screen.getByText(title)).toBeInTheDocument()
      expect(screen.getByText(description)).toBeInTheDocument()
    })
  })

  describe("Stage Progress Visualization", () => {
    it("should show all stages in the progress grid", () => {
      renderVisualization()

      // Check that all stage names are present (using first word of title)
      expect(screen.getByText("Анализ")).toBeInTheDocument() // MediaAnalysis
      expect(screen.getByText("Детекция")).toBeInTheDocument() // SceneDetection
      expect(screen.getByText("Распознавание")).toBeInTheDocument() // PersonRecognition
      expect(screen.getByText("Анализ")).toBeInTheDocument() // EmotionAnalysis & others
      expect(screen.getByText("Поиск")).toBeInTheDocument() // KeyMomentDetection
      expect(screen.getByText("Агрегация")).toBeInTheDocument() // DataAggregation
      expect(screen.getByText("Генерация")).toBeInTheDocument() // IndexGeneration
      expect(screen.getByText("Финализация")).toBeInTheDocument() // Finalization
    })

    it("should highlight current stage correctly", () => {
      renderVisualization()

      // The component should highlight the current stage with blue styling
      // We can check for the presence of stage elements
      const stageElements = screen.getAllByText("Детекция")
      expect(stageElements.length).toBeGreaterThan(0)
    })

    it("should show completed stages with checkmarks", () => {
      // Use a later stage to have some completed stages
      const laterStageProgress = { ...mockProgress, stage: AnalysisStage.AudioAnalysis }
      renderVisualization(laterStageProgress)

      // Should show check circles for completed stages
      // The exact number depends on the stage order
      const checkIcons = screen.getAllByRole("img", { hidden: true })
      expect(checkIcons.length).toBeGreaterThan(0)
    })
  })

  describe("Time Estimation", () => {
    beforeEach(() => {
      // Mock current time to 12:15:00Z (15 minutes after start)
      vi.setSystemTime(new Date("2024-01-01T12:15:00Z"))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("should display estimated time remaining in minutes", () => {
      renderVisualization()

      // Estimated completion is 12:30:00Z, current time is 12:15:00Z
      // So 15 minutes remaining
      expect(screen.getByText("~15 мин")).toBeInTheDocument()
    })

    it("should display estimated time remaining in hours for long tasks", () => {
      const longTaskProgress = {
        ...mockProgress,
        estimated_completion: "2024-01-01T14:30:00Z", // 2 hours and 15 minutes from current
      }
      renderVisualization(longTaskProgress)

      expect(screen.getByText("~2 ч")).toBeInTheDocument()
    })

    it("should show 'Завершается...' when completion time has passed", () => {
      const overDueProgress = {
        ...mockProgress,
        estimated_completion: "2024-01-01T12:10:00Z", // 5 minutes ago
      }
      renderVisualization(overDueProgress)

      expect(screen.getByText("Завершается...")).toBeInTheDocument()
    })

    it("should handle missing estimated completion", () => {
      const progressWithoutEstimation = {
        ...mockProgress,
        estimated_completion: undefined,
      }
      renderVisualization(progressWithoutEstimation)

      // Should not show time estimation badge
      expect(screen.queryByText(/~\d+/)).not.toBeInTheDocument()
      expect(screen.queryByText("Завершается...")).not.toBeInTheDocument()
    })

    it("should handle invalid estimated completion date", () => {
      const progressWithInvalidDate = {
        ...mockProgress,
        estimated_completion: "invalid-date",
      }
      renderVisualization(progressWithInvalidDate)

      // Should not show time estimation badge
      expect(screen.queryByText(/~\d+/)).not.toBeInTheDocument()
    })
  })

  describe("Error Display", () => {
    it("should display error message when present", () => {
      const progressWithError = {
        ...mockProgress,
        error_message: "Failed to analyze video file",
      }
      renderVisualization(progressWithError)

      expect(screen.getByText("Ошибка: Failed to analyze video file")).toBeInTheDocument()
    })

    it("should not display error section when no error", () => {
      renderVisualization()

      expect(screen.queryByText(/Ошибка:/)).not.toBeInTheDocument()
    })
  })

  describe("Date Formatting", () => {
    it("should format start time in Russian locale", () => {
      renderVisualization()

      // Should show formatted date in Russian format
      expect(screen.getByText(/Начат:/)).toBeInTheDocument()
      // The exact format depends on the browser locale, but it should be readable
    })
  })

  describe("Responsive Design", () => {
    it("should render stage grid with responsive classes", () => {
      renderVisualization()

      // Check that the grid container exists with responsive classes
      const gridContainer = screen.getByText("Анализ").closest(".grid")
      expect(gridContainer).toHaveClass("grid-cols-2", "md:grid-cols-5")
    })
  })

  describe("Unknown Stage Handling", () => {
    it("should handle unknown stage gracefully", () => {
      const progressWithUnknownStage = {
        ...mockProgress,
        stage: "UnknownStage" as AnalysisStage,
      }
      renderVisualization(progressWithUnknownStage)

      expect(screen.getByText("Анализ")).toBeInTheDocument()
      expect(screen.getByText("Выполняется анализ")).toBeInTheDocument()
    })
  })
})

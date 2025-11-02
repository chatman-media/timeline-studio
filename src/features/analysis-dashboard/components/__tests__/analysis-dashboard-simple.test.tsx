/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AnalysisStatus, MediaType } from "../../types/analysis"
import { AnalysisDashboard } from "../analysis-dashboard"

// Mock the useAnalysis hook with simpler data
const mockUseAnalysis = vi.fn()

vi.mock("../hooks/use-analysis", () => ({
  useAnalysis: mockUseAnalysis,
}))

// Mock child components
vi.mock("../create-project-dialog", () => ({
  CreateProjectDialog: ({ open }: any) =>
    open ? <div data-testid="create-project-dialog">Create Project Dialog</div> : null,
}))

vi.mock("../real-engine-panel", () => ({
  RealEnginePanel: () => <div data-testid="real-engine-panel">Real Engine Panel</div>,
}))

vi.mock("../project-card", () => ({
  ProjectCard: ({ project, onSelect, onStartAnalysis }: any) => (
    <div data-testid="project-card" onClick={onSelect}>
      <div>{project.name}</div>
      <button onClick={onStartAnalysis}>Запустить анализ</button>
    </div>
  ),
}))

vi.mock("../scene-browser", () => ({
  SceneBrowser: ({ scenes }: any) => <div data-testid="scene-browser">Обнаруженные сцены ({scenes.length})</div>,
}))

vi.mock("../moment-browser", () => ({
  MomentBrowser: ({ moments }: any) => <div data-testid="moment-browser">Ключевые моменты ({moments.length})</div>,
}))

vi.mock("../statistics-overview", () => ({
  StatisticsOverview: ({ statistics }: any) => (
    <div data-testid="statistics-overview">Statistics for {statistics.project_id}</div>
  ),
}))

vi.mock("../progress-visualization", () => ({
  ProgressVisualization: ({ _progress }: any) => <div data-testid="progress-visualization">Анализ выполняется</div>,
}))

describe("AnalysisDashboard - Simple Tests", () => {
  const defaultMockData = {
    dashboardData: {
      projects: [
        {
          id: "project-1",
          name: "Test Project 1",
          description: "First test project",
          status: AnalysisStatus.Created,
          config: {} as any,
          files: [
            {
              id: "file-1",
              project_id: "project-1",
              file_path: "/path/to/video.mp4",
              file_name: "video.mp4",
              file_size: 104857600,
              media_type: MediaType.Video,
              duration: 120,
              width: 1920,
              height: 1080,
              created_at: "2024-01-01T12:00:00Z",
            },
          ],
          created_at: "2024-01-01T12:00:00Z",
          updated_at: "2024-01-01T12:00:00Z",
        },
        {
          id: "project-2",
          name: "Test Project 2",
          description: "Second test project",
          status: AnalysisStatus.InProgress,
          config: {} as any,
          files: [],
          created_at: "2024-01-01T12:00:00Z",
          updated_at: "2024-01-01T12:00:00Z",
        },
      ],
      recentScenes: [
        {
          id: "scene-1",
          project_id: "project-1",
          file_id: "file-1",
          start_time: 10.5,
          end_time: 25.7,
          duration: 15.2,
          scene_type: "Cinematic" as any,
          confidence: 0.87,
          quality_score: 0.82,
          motion_level: 0.3,
          has_faces: true,
          has_text: false,
          auto_description: "Opening scene",
          tags: ["dramatic"],
          created_at: "2024-01-01T12:00:00Z",
        },
      ],
      topMoments: [
        {
          id: "moment-1",
          project_id: "project-1",
          file_id: "file-1",
          scene_id: "scene-1",
          timestamp: 23.5,
          duration: 3.0,
          moment_type: "ActionClimax" as any,
          importance_score: 0.89,
          description: "Action sequence",
          auto_description: "Auto detected action",
          is_bookmarked: false,
          content_tags: ["action"],
          involved_persons: [],
          created_at: "2024-01-01T12:00:00Z",
        },
      ],
      statistics: {
        project_id: "project-1",
        total_files: 1,
        total_duration: 120,
        total_scenes: 8,
        total_moments: 5,
        total_persons: 3,
        total_objects: 25,
        average_quality: 0.78,
        scene_type_distribution: { Cinematic: 3, Dynamic: 5 },
        moment_type_distribution: { ActionClimax: 2, EmotionalPeak: 3 },
        quality_distribution: { excellent: 2, good: 4, average: 2, poor: 0 },
        emotion_distribution: { Happy: 0.4, Neutral: 0.6 },
        temporal_distribution: {
          scenes_per_minute: 0.4,
          moments_per_minute: 0.25,
          average_scene_duration: 15,
        },
        dominant_emotions: ["Happy", "Neutral"],
        most_frequent_objects: ["person", "car"],
        analysis_completion_time: 300,
        processing_time: 600,
        created_at: "2024-01-01T12:00:00Z",
      },
      progress: {
        project_id: "project-2",
        status: AnalysisStatus.InProgress,
        stage: "SceneDetection" as any,
        progress: 0.65,
        current_file: "video.mp4",
        start_time: "2024-01-01T12:00:00Z",
        estimated_completion: "2024-01-01T12:30:00Z",
      },
      activeProject: null,
    },
    loading: false,
    error: null,
    startAnalysis: vi.fn(),
    getProject: vi.fn(),
    getProjectScenes: vi.fn(),
    getProjectMoments: vi.fn(),
    getProjectStatistics: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAnalysis.mockReturnValue(defaultMockData)
  })

  describe("Basic Rendering", () => {
    it("should render dashboard header", () => {
      render(<AnalysisDashboard />)

      expect(screen.getByText("AI Analysis Dashboard")).toBeInTheDocument()
      expect(screen.getByText("Анализ видео с помощью ИИ - сцены, моменты, персоны")).toBeInTheDocument()
    })

    it("should render new project button", () => {
      render(<AnalysisDashboard />)

      expect(screen.getByRole("button", { name: /новый проект/i })).toBeInTheDocument()
    })

    it("should render tab navigation", () => {
      render(<AnalysisDashboard />)

      expect(screen.getByRole("tab", { name: /проекты/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /сцены/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /моменты/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /статистика/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /real engine/i })).toBeInTheDocument()
    })

    it("should render search input", () => {
      render(<AnalysisDashboard />)

      expect(screen.getByPlaceholderText("Поиск по проектам...")).toBeInTheDocument()
    })
  })

  describe("Quick Stats Cards", () => {
    it("should display correct project count", () => {
      render(<AnalysisDashboard />)

      expect(screen.getByText("2")).toBeInTheDocument() // Projects count
      expect(screen.getByText("Проектов")).toBeInTheDocument()
    })

    it("should display correct scenes count", () => {
      render(<AnalysisDashboard />)

      expect(screen.getByText("1")).toBeInTheDocument() // Scenes count
      expect(screen.getByText("Сцен найдено")).toBeInTheDocument()
    })

    it("should display correct moments count", () => {
      render(<AnalysisDashboard />)

      expect(screen.getByText("1")).toBeInTheDocument() // Moments count
      expect(screen.getByText("Ключевых моментов")).toBeInTheDocument()
    })

    it("should display correct persons count", () => {
      render(<AnalysisDashboard />)

      expect(screen.getByText("3")).toBeInTheDocument() // Persons from statistics
      expect(screen.getByText("Персон")).toBeInTheDocument()
    })

    it("should handle zero counts gracefully", () => {
      mockUseAnalysis.mockReturnValue({
        ...defaultMockData,
        dashboardData: {
          ...defaultMockData.dashboardData,
          projects: [],
          recentScenes: [],
          topMoments: [],
          statistics: null,
        },
      })

      render(<AnalysisDashboard />)

      expect(screen.getByText("0")).toBeInTheDocument() // Projects count
    })
  })

  describe("Error Handling", () => {
    it("should display error message when error exists", () => {
      mockUseAnalysis.mockReturnValue({
        ...defaultMockData,
        error: "Something went wrong with the analysis",
      })

      render(<AnalysisDashboard />)

      expect(screen.getByText("Something went wrong with the analysis")).toBeInTheDocument()
    })

    it("should not display error section when no error", () => {
      render(<AnalysisDashboard />)

      expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument()
    })
  })

  describe("Projects Tab", () => {
    it("should display project cards", () => {
      render(<AnalysisDashboard />)

      expect(screen.getByText("Test Project 1")).toBeInTheDocument()
      expect(screen.getByText("Test Project 2")).toBeInTheDocument()
    })

    it("should show analysis progress when project is in progress", () => {
      render(<AnalysisDashboard />)

      expect(screen.getByTestId("progress-visualization")).toBeInTheDocument()
    })

    it("should show empty state when no projects", () => {
      mockUseAnalysis.mockReturnValue({
        ...defaultMockData,
        dashboardData: {
          ...defaultMockData.dashboardData,
          projects: [],
          progress: null,
        },
      })

      render(<AnalysisDashboard />)

      expect(screen.getByText("Нет проектов анализа")).toBeInTheDocument()
      expect(screen.getByText("Создайте первый проект для анализа ваших видео")).toBeInTheDocument()
    })
  })

  describe("Tab Navigation", () => {
    it("should display scenes when scenes tab is selected", async () => {
      const user = userEvent.setup()
      render(<AnalysisDashboard />)

      const scenesTab = screen.getByRole("tab", { name: /сцены/i })
      await user.click(scenesTab)

      expect(screen.getByTestId("scene-browser")).toBeInTheDocument()
    })

    it("should display moments when moments tab is selected", async () => {
      const user = userEvent.setup()
      render(<AnalysisDashboard />)

      const momentsTab = screen.getByRole("tab", { name: /моменты/i })
      await user.click(momentsTab)

      expect(screen.getByTestId("moment-browser")).toBeInTheDocument()
    })

    it("should display statistics when statistics tab is selected", async () => {
      const user = userEvent.setup()
      render(<AnalysisDashboard />)

      const statisticsTab = screen.getByRole("tab", { name: /статистика/i })
      await user.click(statisticsTab)

      expect(screen.getByTestId("statistics-overview")).toBeInTheDocument()
    })

    it("should show empty state when no statistics data", async () => {
      mockUseAnalysis.mockReturnValue({
        ...defaultMockData,
        dashboardData: {
          ...defaultMockData.dashboardData,
          statistics: null,
        },
      })

      const user = userEvent.setup()
      render(<AnalysisDashboard />)

      const statisticsTab = screen.getByRole("tab", { name: /статистика/i })
      await user.click(statisticsTab)

      expect(screen.getByText("Нет данных статистики")).toBeInTheDocument()
      expect(screen.getByText("Выберите проект для просмотра статистики анализа")).toBeInTheDocument()
    })

    it("should display real engine panel when real engine tab is selected", async () => {
      const user = userEvent.setup()
      render(<AnalysisDashboard />)

      const engineTab = screen.getByRole("tab", { name: /real engine/i })
      await user.click(engineTab)

      expect(screen.getByTestId("real-engine-panel")).toBeInTheDocument()
    })
  })

  describe("Create Project Dialog", () => {
    it("should open create project dialog when new project button is clicked", async () => {
      const user = userEvent.setup()
      render(<AnalysisDashboard />)

      const newProjectButton = screen.getByRole("button", { name: /новый проект/i })
      await user.click(newProjectButton)

      expect(screen.getByTestId("create-project-dialog")).toBeInTheDocument()
    })

    it("should open create project dialog from empty state", async () => {
      mockUseAnalysis.mockReturnValue({
        ...defaultMockData,
        dashboardData: {
          ...defaultMockData.dashboardData,
          projects: [],
          progress: null,
        },
      })

      const user = userEvent.setup()
      render(<AnalysisDashboard />)

      const createButton = screen.getByRole("button", { name: /создать проект/i })
      await user.click(createButton)

      expect(screen.getByTestId("create-project-dialog")).toBeInTheDocument()
    })
  })

  describe("Search Functionality", () => {
    it("should update search query when typing in search input", async () => {
      const user = userEvent.setup()
      render(<AnalysisDashboard />)

      const searchInput = screen.getByPlaceholderText("Поиск по проектам...")
      await user.type(searchInput, "test search")

      expect(searchInput).toHaveValue("test search")
    })

    it("should clear search when input is cleared", async () => {
      const user = userEvent.setup()
      render(<AnalysisDashboard />)

      const searchInput = screen.getByPlaceholderText("Поиск по проектам...")
      await user.type(searchInput, "test")
      await user.clear(searchInput)

      expect(searchInput).toHaveValue("")
    })
  })

  describe("Progress Visualization", () => {
    it("should show progress visualization only when analysis is in progress", () => {
      render(<AnalysisDashboard />)

      expect(screen.getByTestId("progress-visualization")).toBeInTheDocument()
    })

    it("should not show progress visualization when no active analysis", () => {
      mockUseAnalysis.mockReturnValue({
        ...defaultMockData,
        dashboardData: {
          ...defaultMockData.dashboardData,
          progress: null,
        },
      })

      render(<AnalysisDashboard />)

      expect(screen.queryByTestId("progress-visualization")).not.toBeInTheDocument()
    })

    it("should not show progress visualization when analysis is not in progress", () => {
      mockUseAnalysis.mockReturnValue({
        ...defaultMockData,
        dashboardData: {
          ...defaultMockData.dashboardData,
          progress: {
            ...defaultMockData.dashboardData.progress!,
            status: AnalysisStatus.Completed,
          },
        },
      })

      render(<AnalysisDashboard />)

      expect(screen.queryByTestId("progress-visualization")).not.toBeInTheDocument()
    })
  })

  describe("Responsive Design", () => {
    it("should render grid layouts with responsive classes", () => {
      render(<AnalysisDashboard />)

      // Check that main stats grid has responsive classes
      const statsGrid = screen.getByText("Проектов").closest(".grid")
      expect(statsGrid).toHaveClass("grid-cols-1", "md:grid-cols-4")
    })
  })

  describe("Loading States", () => {
    it("should handle loading state", () => {
      mockUseAnalysis.mockReturnValue({
        ...defaultMockData,
        loading: true,
      })

      render(<AnalysisDashboard />)

      // Should still render the dashboard structure during loading
      expect(screen.getByText("AI Analysis Dashboard")).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should have proper tab navigation", async () => {
      const user = userEvent.setup()
      render(<AnalysisDashboard />)

      const tabs = screen.getAllByRole("tab")
      expect(tabs).toHaveLength(5)

      // Should be able to navigate between tabs
      for (const tab of tabs) {
        await user.click(tab)
        expect(tab).toHaveAttribute("aria-selected", "true")
      }
    })

    it("should have proper button roles and labels", () => {
      render(<AnalysisDashboard />)

      expect(screen.getByRole("button", { name: /новый проект/i })).toBeInTheDocument()
    })

    it("should have proper form elements", () => {
      render(<AnalysisDashboard />)

      const searchInput = screen.getByPlaceholderText("Поиск по проектам...")
      expect(searchInput).toHaveAttribute("type", "text")
    })
  })

  describe("Hook Integration", () => {
    it("should call hook methods when project is selected", async () => {
      const user = userEvent.setup()
      render(<AnalysisDashboard />)

      const projectCard = screen.getByTestId("project-card")
      await user.click(projectCard)

      expect(defaultMockData.getProject).toHaveBeenCalledWith("project-1")
      expect(defaultMockData.getProjectScenes).toHaveBeenCalledWith("project-1")
      expect(defaultMockData.getProjectMoments).toHaveBeenCalledWith("project-1")
      expect(defaultMockData.getProjectStatistics).toHaveBeenCalledWith("project-1")
    })

    it("should call startAnalysis when start button is clicked", async () => {
      const user = userEvent.setup()
      render(<AnalysisDashboard />)

      const startButton = screen.getByRole("button", { name: /запустить анализ/i })
      await user.click(startButton)

      expect(defaultMockData.startAnalysis).toHaveBeenCalled()
    })
  })
})

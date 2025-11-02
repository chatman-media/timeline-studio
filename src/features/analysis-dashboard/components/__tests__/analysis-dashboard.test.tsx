/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AnalysisStatus, MediaType, QualityMode } from "../../types/analysis"
import { AnalysisDashboard } from "../analysis-dashboard"

// Mock the useAnalysis hook
const mockUseAnalysis = {
  dashboardData: {
    projects: [
      {
        id: "project-1",
        name: "Test Project 1",
        description: "First test project",
        status: AnalysisStatus.Created,
        config: {
          enable_scene_detection: true,
          enable_person_recognition: true,
          enable_object_detection: true,
          enable_emotion_analysis: true,
          enable_audio_analysis: true,
          enable_quality_analysis: true,
          enable_text_recognition: false,
          quality_mode: QualityMode.Balanced,
          frame_skip: 30,
          resolution_scale: 0.5,
          scene_change_threshold: 0.3,
          face_confidence_threshold: 0.7,
          object_confidence_threshold: 0.5,
          motion_detection_threshold: 0.1,
          max_processing_time: 3600,
          max_memory_usage: 2147483648,
          use_gpu: true,
          generate_thumbnails: true,
          generate_previews: true,
          save_keyframes: true,
          include_raw_data: false,
        },
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
        config: {
          enable_scene_detection: true,
          enable_person_recognition: true,
          enable_object_detection: true,
          enable_emotion_analysis: true,
          enable_audio_analysis: true,
          enable_quality_analysis: true,
          enable_text_recognition: false,
          quality_mode: QualityMode.Balanced,
          frame_skip: 30,
          resolution_scale: 0.5,
          scene_change_threshold: 0.3,
          face_confidence_threshold: 0.7,
          object_confidence_threshold: 0.5,
          motion_detection_threshold: 0.1,
          max_processing_time: 3600,
          max_memory_usage: 2147483648,
          use_gpu: true,
          generate_thumbnails: true,
          generate_previews: true,
          save_keyframes: true,
          include_raw_data: false,
        },
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

vi.mock("../hooks/use-analysis", () => ({
  useAnalysis: () => mockUseAnalysis,
}))

// Mock child components to focus on dashboard logic
vi.mock("../create-project-dialog", () => ({
  CreateProjectDialog: ({ open }: any) =>
    open ? <div data-testid="create-project-dialog">Create Project Dialog</div> : null,
}))

vi.mock("../real-engine-panel", () => ({
  RealEnginePanel: () => <div data-testid="real-engine-panel">Real Engine Panel</div>,
}))

describe("AnalysisDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderDashboard = () => {
    return render(<AnalysisDashboard />)
  }

  describe("Header and Navigation", () => {
    it("should render dashboard header with title and description", () => {
      renderDashboard()

      expect(screen.getByText("AI Analysis Dashboard")).toBeInTheDocument()
      expect(screen.getByText("Анализ видео с помощью ИИ - сцены, моменты, персоны")).toBeInTheDocument()
    })

    it("should render new project button", () => {
      renderDashboard()

      expect(screen.getByRole("button", { name: /новый проект/i })).toBeInTheDocument()
    })

    it("should render tab navigation", () => {
      renderDashboard()

      expect(screen.getByRole("tab", { name: /проекты/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /сцены/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /моменты/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /статистика/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /real engine/i })).toBeInTheDocument()
    })

    it("should render search input", () => {
      renderDashboard()

      expect(screen.getByPlaceholderText("Поиск по проектам...")).toBeInTheDocument()
    })
  })

  describe("Quick Stats Cards", () => {
    it("should display quick statistics correctly", () => {
      renderDashboard()

      expect(screen.getByText("2")).toBeInTheDocument() // Projects count
      expect(screen.getByText("Проектов")).toBeInTheDocument()

      expect(screen.getByText("1")).toBeInTheDocument() // Scenes count
      expect(screen.getByText("Сцен найдено")).toBeInTheDocument()

      expect(screen.getByText("1")).toBeInTheDocument() // Moments count
      expect(screen.getByText("Ключевых моментов")).toBeInTheDocument()

      expect(screen.getByText("3")).toBeInTheDocument() // Persons count
      expect(screen.getByText("Персон")).toBeInTheDocument()
    })

    it("should handle zero counts gracefully", () => {
      // Update the mock data directly
      mockUseAnalysis.dashboardData = {
        ...mockUseAnalysis.dashboardData,
        projects: [],
        recentScenes: [],
        topMoments: [],
        statistics: null,
      }

      renderDashboard()

      expect(screen.getByText("0")).toBeInTheDocument() // Projects

      // Reset mock data
      mockUseAnalysis.dashboardData.projects = [
        {
          id: "project-1",
          name: "Test Project 1",
          description: "First test project",
          status: AnalysisStatus.Created,
          config: {} as any,
          files: [],
          created_at: "2024-01-01T12:00:00Z",
          updated_at: "2024-01-01T12:00:00Z",
        },
      ]
    })
  })

  describe("Error Handling", () => {
    it("should display error message when error exists", () => {
      mockUseAnalysis.error = "Something went wrong with the analysis"

      renderDashboard()

      expect(screen.getByText("Something went wrong with the analysis")).toBeInTheDocument()

      // Reset
      mockUseAnalysis.error = null
    })

    it("should not display error section when no error", () => {
      mockUseAnalysis.error = null
      renderDashboard()

      expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument()
    })
  })

  describe("Projects Tab", () => {
    it("should display project cards", () => {
      renderDashboard()

      expect(screen.getByText("Test Project 1")).toBeInTheDocument()
      expect(screen.getByText("Test Project 2")).toBeInTheDocument()
    })

    it("should show analysis progress when project is in progress", () => {
      renderDashboard()

      expect(screen.getByText("Анализ выполняется")).toBeInTheDocument()
    })

    it("should handle project selection", async () => {
      const user = userEvent.setup()
      renderDashboard()

      const projectCard = screen.getByText("Test Project 1").closest(".cursor-pointer")!
      await user.click(projectCard)

      expect(mockUseAnalysis.getProject).toHaveBeenCalledWith("project-1")
      expect(mockUseAnalysis.getProjectScenes).toHaveBeenCalledWith("project-1")
      expect(mockUseAnalysis.getProjectMoments).toHaveBeenCalledWith("project-1")
      expect(mockUseAnalysis.getProjectStatistics).toHaveBeenCalledWith("project-1")
    })

    it("should handle start analysis", async () => {
      const user = userEvent.setup()
      renderDashboard()

      const startButton = screen.getByRole("button", { name: /запустить анализ/i })
      await user.click(startButton)

      expect(mockUseAnalysis.startAnalysis).toHaveBeenCalledWith("project-1")
    })

    it("should show empty state when no projects", () => {
      const emptyMockAnalysis = {
        ...mockUseAnalysis,
        dashboardData: {
          ...mockUseAnalysis.dashboardData,
          projects: [],
        },
      }

      vi.doMock("../hooks/use-analysis", () => ({
        useAnalysis: () => emptyMockAnalysis,
      }))

      renderDashboard()

      expect(screen.getByText("Нет проектов анализа")).toBeInTheDocument()
      expect(screen.getByText("Создайте первый проект для анализа ваших видео")).toBeInTheDocument()
    })
  })

  describe("Scenes Tab", () => {
    it("should display scenes when tab is selected", async () => {
      const user = userEvent.setup()
      renderDashboard()

      const scenesTab = screen.getByRole("tab", { name: /сцены/i })
      await user.click(scenesTab)

      await waitFor(() => {
        expect(screen.getByText("Обнаруженные сцены (1)")).toBeInTheDocument()
      })
    })
  })

  describe("Moments Tab", () => {
    it("should display moments when tab is selected", async () => {
      const user = userEvent.setup()
      renderDashboard()

      const momentsTab = screen.getByRole("tab", { name: /моменты/i })
      await user.click(momentsTab)

      await waitFor(() => {
        expect(screen.getByText("Ключевые моменты (1)")).toBeInTheDocument()
      })
    })
  })

  describe("Statistics Tab", () => {
    it("should display statistics when tab is selected and data exists", async () => {
      const user = userEvent.setup()
      renderDashboard()

      const statisticsTab = screen.getByRole("tab", { name: /статистика/i })
      await user.click(statisticsTab)

      await waitFor(() => {
        expect(screen.getByText("1")).toBeInTheDocument() // Total files from statistics
      })
    })

    it("should show empty state when no statistics data", async () => {
      const noStatsMockAnalysis = {
        ...mockUseAnalysis,
        dashboardData: {
          ...mockUseAnalysis.dashboardData,
          statistics: null,
        },
      }

      vi.doMock("../hooks/use-analysis", () => ({
        useAnalysis: () => noStatsMockAnalysis,
      }))

      const user = userEvent.setup()
      renderDashboard()

      const statisticsTab = screen.getByRole("tab", { name: /статистика/i })
      await user.click(statisticsTab)

      await waitFor(() => {
        expect(screen.getByText("Нет данных статистики")).toBeInTheDocument()
        expect(screen.getByText("Выберите проект для просмотра статистики анализа")).toBeInTheDocument()
      })
    })
  })

  describe("Real Engine Tab", () => {
    it("should display real engine panel when tab is selected", async () => {
      const user = userEvent.setup()
      renderDashboard()

      const engineTab = screen.getByRole("tab", { name: /real engine/i })
      await user.click(engineTab)

      await waitFor(() => {
        expect(screen.getByTestId("real-engine-panel")).toBeInTheDocument()
      })
    })
  })

  describe("Create Project Dialog", () => {
    it("should open create project dialog when new project button is clicked", async () => {
      const user = userEvent.setup()
      renderDashboard()

      const newProjectButton = screen.getByRole("button", { name: /новый проект/i })
      await user.click(newProjectButton)

      expect(screen.getByTestId("create-project-dialog")).toBeInTheDocument()
    })

    it("should open create project dialog from empty state", async () => {
      const emptyMockAnalysis = {
        ...mockUseAnalysis,
        dashboardData: {
          ...mockUseAnalysis.dashboardData,
          projects: [],
        },
      }

      vi.doMock("../hooks/use-analysis", () => ({
        useAnalysis: () => emptyMockAnalysis,
      }))

      const user = userEvent.setup()
      renderDashboard()

      const createButton = screen.getByRole("button", { name: /создать проект/i })
      await user.click(createButton)

      expect(screen.getByTestId("create-project-dialog")).toBeInTheDocument()
    })
  })

  describe("Search Functionality", () => {
    it("should update search query when typing in search input", async () => {
      const user = userEvent.setup()
      renderDashboard()

      const searchInput = screen.getByPlaceholderText("Поиск по проектам...")
      await user.type(searchInput, "test search")

      expect(searchInput).toHaveValue("test search")
    })

    it("should clear search when input is cleared", async () => {
      const user = userEvent.setup()
      renderDashboard()

      const searchInput = screen.getByPlaceholderText("Поиск по проектам...")
      await user.type(searchInput, "test")
      await user.clear(searchInput)

      expect(searchInput).toHaveValue("")
    })
  })

  describe("Progress Visualization", () => {
    it("should show progress visualization only when analysis is in progress", () => {
      renderDashboard()

      expect(screen.getByText("Анализ выполняется")).toBeInTheDocument()
    })

    it("should not show progress visualization when no active analysis", () => {
      const noProgressMockAnalysis = {
        ...mockUseAnalysis,
        dashboardData: {
          ...mockUseAnalysis.dashboardData,
          progress: null,
        },
      }

      vi.doMock("../hooks/use-analysis", () => ({
        useAnalysis: () => noProgressMockAnalysis,
      }))

      renderDashboard()

      expect(screen.queryByText("Анализ выполняется")).not.toBeInTheDocument()
    })

    it("should not show progress visualization when analysis is not in progress", () => {
      const completedProgressMockAnalysis = {
        ...mockUseAnalysis,
        dashboardData: {
          ...mockUseAnalysis.dashboardData,
          progress: {
            ...mockUseAnalysis.dashboardData.progress!,
            status: AnalysisStatus.Completed,
          },
        },
      }

      vi.doMock("../hooks/use-analysis", () => ({
        useAnalysis: () => completedProgressMockAnalysis,
      }))

      renderDashboard()

      expect(screen.queryByText("Анализ выполняется")).not.toBeInTheDocument()
    })
  })

  describe("Responsive Design", () => {
    it("should render grid layouts with responsive classes", () => {
      renderDashboard()

      // Check that main stats grid has responsive classes
      const statsGrid = screen.getByText("Проектов").closest(".grid")
      expect(statsGrid).toHaveClass("grid-cols-1", "md:grid-cols-4")
    })
  })

  describe("Loading States", () => {
    it("should handle loading state", () => {
      const loadingMockAnalysis = {
        ...mockUseAnalysis,
        loading: true,
      }

      vi.doMock("../hooks/use-analysis", () => ({
        useAnalysis: () => loadingMockAnalysis,
      }))

      renderDashboard()

      // Should still render the dashboard structure during loading
      expect(screen.getByText("AI Analysis Dashboard")).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should have proper tab navigation", async () => {
      const user = userEvent.setup()
      renderDashboard()

      const tabs = screen.getAllByRole("tab")
      expect(tabs).toHaveLength(5)

      // Should be able to navigate between tabs
      for (const tab of tabs) {
        await user.click(tab)
        expect(tab).toHaveAttribute("aria-selected", "true")
      }
    })

    it("should have proper button roles and labels", () => {
      renderDashboard()

      expect(screen.getByRole("button", { name: /новый проект/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /запустить анализ/i })).toBeInTheDocument()
    })

    it("should have proper form elements", () => {
      renderDashboard()

      const searchInput = screen.getByPlaceholderText("Поиск по проектам...")
      expect(searchInput).toHaveAttribute("type", "text")
    })
  })

  describe("Console Logging", () => {
    it("should log scene selection", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})
      const user = userEvent.setup()
      renderDashboard()

      const scenesTab = screen.getByRole("tab", { name: /сцены/i })
      await user.click(scenesTab)

      await waitFor(() => {
        const sceneCard = screen.getByText("Сцена 10.5с - 25.7с").closest(".cursor-pointer")!
        return user.click(sceneCard)
      })

      expect(consoleSpy).toHaveBeenCalledWith("Selected scene:", expect.any(Object))
      consoleSpy.mockRestore()
    })

    it("should log moment selection", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})
      const user = userEvent.setup()
      renderDashboard()

      const momentsTab = screen.getByRole("tab", { name: /моменты/i })
      await user.click(momentsTab)

      await waitFor(() => {
        const momentCard = screen.getByText("23.5с").closest(".cursor-pointer")!
        return user.click(momentCard)
      })

      expect(consoleSpy).toHaveBeenCalledWith("Selected moment:", expect.any(Object))
      consoleSpy.mockRestore()
    })
  })
})

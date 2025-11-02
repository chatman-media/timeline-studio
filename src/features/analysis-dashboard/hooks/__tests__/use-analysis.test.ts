/**
 * @vitest-environment jsdom
 */

import { invoke } from "@tauri-apps/api/core"
import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  AnalysisConfig,
  AnalysisProgress,
  AnalysisProject,
  AnalysisScene,
  AnalysisStatus,
  KeyMoment,
  MediaType,
  ProjectStatistics,
  QualityMode,
} from "../../types/analysis"
import { useAnalysis } from "../use-analysis"

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

const mockInvoke = vi.mocked(invoke)

describe("useAnalysis Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Only run timer cleanup if fake timers are active
    if (vi.isFakeTimers()) {
      vi.runOnlyPendingTimers()
      vi.useRealTimers()
    }
  })

  const mockProject: AnalysisProject = {
    id: "test-project-1",
    name: "Test Project",
    description: "Test project description",
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
        project_id: "test-project-1",
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
  }

  const mockProgress: AnalysisProgress = {
    project_id: "test-project-1",
    status: AnalysisStatus.InProgress,
    stage: "MediaAnalysis",
    progress: 0.65,
    current_file: "video.mp4",
    start_time: "2024-01-01T12:00:00Z",
    estimated_completion: "2024-01-01T12:30:00Z",
  }

  const mockScene: AnalysisScene = {
    id: "scene-1",
    project_id: "test-project-1",
    file_id: "file-1",
    start_time: 0.0,
    end_time: 15.2,
    duration: 15.2,
    scene_type: "Opening",
    confidence: 0.87,
    quality_score: 0.82,
    motion_level: 0.3,
    has_faces: true,
    has_text: false,
    auto_description: "Opening scene with low motion and good quality",
    created_at: "2024-01-01T12:00:00Z",
  }

  const mockMoment: KeyMoment = {
    id: "moment-1",
    project_id: "test-project-1",
    file_id: "file-1",
    scene_id: "scene-1",
    timestamp: 23.5,
    duration: 3.0,
    moment_type: "Highlight",
    importance_score: 0.89,
    description: "Key moment with high visual interest",
    auto_description: "Automatically detected highlight moment",
    is_bookmarked: false,
    created_at: "2024-01-01T12:00:00Z",
  }

  const mockStatistics: ProjectStatistics = {
    project_id: "test-project-1",
    total_files: 1,
    total_duration: 120,
    total_scenes: 8,
    total_moments: 12,
    total_persons: 3,
    total_objects: 45,
    average_quality: 0.78,
    scene_type_distribution: {
      Opening: 1,
      Content: 5,
      Transition: 2,
    },
    emotion_distribution: {
      Happy: 0.4,
      Neutral: 0.35,
      Surprised: 0.25,
    },
    quality_distribution: {
      High: 0.6,
      Medium: 0.3,
      Low: 0.1,
    },
    processing_time: 1200,
    created_at: "2024-01-01T12:00:00Z",
  }

  describe("Initial State", () => {
    it("should initialize with empty dashboard data", async () => {
      mockInvoke.mockResolvedValueOnce([]) // get_active_analysis_projects

      const { result } = renderHook(() => useAnalysis())

      expect(result.current.dashboardData).toEqual({
        projects: [],
        recentScenes: [],
        topMoments: [],
      })

      // Wait for useEffect to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.error).toBe(null)
    })

    it("should load active projects on mount", async () => {
      mockInvoke.mockResolvedValueOnce([mockProgress])

      renderHook(() => useAnalysis())

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("get_active_analysis_projects")
      })
    })
  })

  describe("Project Management", () => {
    it("should create a new project successfully", async () => {
      const projectId = "new-project-123"
      mockInvoke
        .mockResolvedValueOnce([]) // get_active_analysis_projects (initial)
        .mockResolvedValueOnce(projectId) // create_analysis_project
        .mockResolvedValueOnce([mockProgress]) // get_active_analysis_projects (refresh)

      const { result } = renderHook(() => useAnalysis())

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createdProjectId: string | null = null
      await act(async () => {
        createdProjectId = await result.current.createProject("New Project", "Test description", mockProject.config, [
          "/path/to/video.mp4",
        ])
      })

      expect(createdProjectId).toBe(projectId)
      expect(mockInvoke).toHaveBeenCalledWith("create_analysis_project", {
        name: "New Project",
        description: "Test description",
        config: mockProject.config,
        files: ["/path/to/video.mp4"],
      })
    })

    it("should handle project creation errors", async () => {
      const errorMessage = "Failed to create project"
      mockInvoke
        .mockResolvedValueOnce([]) // get_active_analysis_projects (initial)
        .mockRejectedValueOnce(new Error(errorMessage)) // create_analysis_project

      const { result } = renderHook(() => useAnalysis())

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createdProjectId: string | null = null
      await act(async () => {
        createdProjectId = await result.current.createProject("New Project", undefined, mockProject.config, [
          "/path/to/video.mp4",
        ])
      })

      expect(createdProjectId).toBe(null)
      expect(result.current.error).toContain(errorMessage)
    })

    it("should get project details", async () => {
      mockInvoke.mockResolvedValueOnce(mockProject)

      const { result } = renderHook(() => useAnalysis())

      let project: AnalysisProject | null = null
      await act(async () => {
        project = await result.current.getProject("test-project-1")
      })

      expect(project).toEqual(mockProject)
      expect(result.current.dashboardData.activeProject).toEqual(mockProject)
      expect(mockInvoke).toHaveBeenCalledWith("get_analysis_project", {
        projectId: "test-project-1",
      })
    })
  })

  describe("Progress Tracking", () => {
    it("should get project progress", async () => {
      mockInvoke.mockResolvedValueOnce(mockProgress)

      const { result } = renderHook(() => useAnalysis())

      let progress: AnalysisProgress | null = null
      await act(async () => {
        progress = await result.current.getProgress("test-project-1")
      })

      expect(progress).toEqual(mockProgress)
      expect(result.current.dashboardData.progress).toEqual(mockProgress)
    })

    it("should start analysis and begin polling", async () => {
      vi.useFakeTimers()
      mockInvoke
        .mockResolvedValueOnce("success") // start_project_analysis
        .mockResolvedValueOnce({ ...mockProgress, status: AnalysisStatus.InProgress }) // first poll
        .mockResolvedValueOnce({ ...mockProgress, status: AnalysisStatus.Completed }) // second poll
        .mockResolvedValueOnce(mockProject) // get project when completed
        .mockResolvedValueOnce(mockStatistics) // get statistics when completed

      const { result } = renderHook(() => useAnalysis())

      let analysisStarted = false
      await act(async () => {
        analysisStarted = await result.current.startAnalysis("test-project-1")
      })

      expect(analysisStarted).toBe(true)
      expect(mockInvoke).toHaveBeenCalledWith("start_project_analysis", {
        projectId: "test-project-1",
      })

      // Fast-forward polling
      await act(async () => {
        vi.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("get_analysis_project_progress", {
          projectId: "test-project-1",
        })
      })

      vi.useRealTimers()
    })
  })

  describe("Data Retrieval", () => {
    it("should get project scenes", async () => {
      const scenes = [mockScene]
      mockInvoke.mockResolvedValueOnce(scenes)

      const { result } = renderHook(() => useAnalysis())

      let projectScenes: AnalysisScene[] = []
      await act(async () => {
        projectScenes = await result.current.getProjectScenes("test-project-1")
      })

      expect(projectScenes).toEqual(scenes)
      expect(result.current.dashboardData.recentScenes).toEqual(scenes)
    })

    it("should get project key moments and sort by importance", async () => {
      const moments = [
        mockMoment,
        { ...mockMoment, id: "moment-2", importance_score: 0.95 },
        { ...mockMoment, id: "moment-3", importance_score: 0.75 },
      ]
      mockInvoke.mockResolvedValueOnce(moments)

      const { result } = renderHook(() => useAnalysis())

      let projectMoments: KeyMoment[] = []
      await act(async () => {
        projectMoments = await result.current.getProjectMoments("test-project-1")
      })

      expect(projectMoments).toEqual(moments)
      // Check that top moments are sorted by importance (highest first)
      const topMoments = result.current.dashboardData.topMoments
      expect(topMoments[0].importance_score).toBe(0.95)
      expect(topMoments[1].importance_score).toBe(0.89)
      expect(topMoments[2].importance_score).toBe(0.75)
    })

    it("should get project statistics", async () => {
      mockInvoke.mockResolvedValueOnce(mockStatistics)

      const { result } = renderHook(() => useAnalysis())

      let statistics: ProjectStatistics | null = null
      await act(async () => {
        statistics = await result.current.getProjectStatistics("test-project-1")
      })

      expect(statistics).toEqual(mockStatistics)
      expect(result.current.dashboardData.statistics).toEqual(mockStatistics)
    })
  })

  describe("Configuration Management", () => {
    it("should get default analysis config", async () => {
      mockInvoke.mockResolvedValueOnce(mockProject.config)

      const { result } = renderHook(() => useAnalysis())

      let config: AnalysisConfig | null = null
      await act(async () => {
        config = await result.current.getDefaultConfig()
      })

      expect(config).toEqual(mockProject.config)
      expect(mockInvoke).toHaveBeenCalledWith("get_default_analysis_config")
    })

    it("should return fallback config when API fails", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("API Error"))

      const { result } = renderHook(() => useAnalysis())

      let config: AnalysisConfig | null = null
      await act(async () => {
        config = await result.current.getDefaultConfig()
      })

      expect(config).toBeDefined()
      expect(config?.quality_mode).toBe(QualityMode.Balanced)
      expect(config?.enable_scene_detection).toBe(true)
    })
  })

  describe("Search Functionality", () => {
    it("should search project data", async () => {
      const searchResults = [
        {
          id: "result-1",
          project_id: "test-project-1",
          result_type: "scene",
          title: "Opening Scene",
          description: "Scene with high visual interest",
          confidence: 0.89,
          timestamp: 23.5,
          data: mockScene,
        },
      ]
      mockInvoke.mockResolvedValueOnce(searchResults)

      const { result } = renderHook(() => useAnalysis())

      let results: any[] = []
      await act(async () => {
        results = await result.current.searchProjectData("test-project-1", "opening", ["scene"])
      })

      expect(results).toEqual(searchResults)
      expect(mockInvoke).toHaveBeenCalledWith("search_project_data", {
        projectId: "test-project-1",
        query: "opening",
        resultTypes: ["scene"],
      })
    })
  })

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Network error"))

      const { result } = renderHook(() => useAnalysis())

      await act(async () => {
        await result.current.getProject("test-project-1")
      })

      expect(result.current.error).toContain("Network error")
    })

    it("should allow manual error clearing", async () => {
      const { result } = renderHook(() => useAnalysis())

      await act(async () => {
        result.current.setError("Test error")
      })

      expect(result.current.error).toBe("Test error")

      await act(async () => {
        result.current.setError(null)
      })

      expect(result.current.error).toBe(null)
    })
  })

  describe("Loading States", () => {
    it("should show loading state during async operations", async () => {
      let resolvePromise: (value: any) => void
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockInvoke.mockReturnValueOnce(pendingPromise)

      const { result } = renderHook(() => useAnalysis())

      let projectPromise: Promise<AnalysisProject | null>
      await act(async () => {
        projectPromise = result.current.getProject("test-project-1")
      })

      expect(result.current.loading).toBe(true)

      await act(async () => {
        resolvePromise!(mockProject)
        await projectPromise
      })

      expect(result.current.loading).toBe(false)
    })
  })
})

// Hook for managing analysis projects and data

import { invoke } from "@tauri-apps/api/core"
import { useCallback, useEffect, useState } from "react"
import {
  AnalysisConfig,
  AnalysisProgress,
  AnalysisProject,
  AnalysisScene,
  AnalysisSearchResult,
  DashboardData,
  KeyMoment,
  ProjectStatistics,
  QualityMode,
  SearchResultType,
} from "../types/analysis"

export function useAnalysis() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    projects: [],
    recentScenes: [],
    topMoments: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get all active analysis projects
  const getActiveProjects = useCallback(async () => {
    try {
      setLoading(true)
      const projects = await invoke<AnalysisProgress[]>("get_active_analysis_projects")

      // Convert progress to projects (simplified for now)
      const projectData = projects.map((progress) => ({
        id: progress.project_id,
        name: `Analysis Project ${progress.project_id.slice(0, 8)}`,
        status: progress.status,
        config: {} as AnalysisConfig, // Will be filled separately
        files: [],
        created_at: progress.start_time,
        updated_at: progress.start_time,
      })) as AnalysisProject[]

      setDashboardData((prev) => ({ ...prev, projects: projectData }))
      setError(null)
    } catch (err) {
      setError(`Failed to get active projects: ${err}`)
      console.error("Failed to get active projects:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create new analysis project
  const createProject = useCallback(
    async (
      name: string,
      description: string | undefined,
      config: AnalysisConfig,
      files: string[],
    ): Promise<string | null> => {
      try {
        setLoading(true)
        const projectId = await invoke<string>("create_analysis_project", {
          name,
          description,
          config,
          files,
        })

        // Refresh projects list
        await getActiveProjects()
        setError(null)
        return projectId
      } catch (err) {
        setError(`Failed to create project: ${err}`)
        console.error("Failed to create project:", err)
        return null
      } finally {
        setLoading(false)
      }
    },
    [getActiveProjects],
  )

  // Get specific project details
  const getProject = useCallback(async (projectId: string): Promise<AnalysisProject | null> => {
    try {
      setLoading(true)
      const project = await invoke<AnalysisProject | null>("get_analysis_project", {
        projectId,
      })

      if (project) {
        setDashboardData((prev) => ({ ...prev, activeProject: project }))
      }
      setError(null)
      return project
    } catch (err) {
      setError(`Failed to get project: ${err}`)
      console.error("Failed to get project:", err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get project progress
  const getProgress = useCallback(async (projectId: string): Promise<AnalysisProgress | null> => {
    try {
      const progress = await invoke<AnalysisProgress | null>("get_analysis_project_progress", {
        projectId,
      })

      if (progress) {
        setDashboardData((prev) => ({ ...prev, progress }))
      }
      return progress
    } catch (err) {
      console.error("Failed to get progress:", err)
      return null
    }
  }, [])

  // Start analysis for a project
  const startAnalysis = useCallback(async (projectId: string): Promise<boolean> => {
    try {
      setLoading(true)
      await invoke<string>("start_project_analysis", { projectId })

      // Start polling for progress
      pollProgress(projectId)
      setError(null)
      return true
    } catch (err) {
      setError(`Failed to start analysis: ${err}`)
      console.error("Failed to start analysis:", err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Poll for progress updates
  const pollProgress = useCallback(
    async (projectId: string) => {
      const poll = async () => {
        const progress = await getProgress(projectId)

        if (progress && progress.status === "InProgress") {
          // Continue polling every 2 seconds
          setTimeout(poll, 2000)
        } else if (progress && progress.status === "Completed") {
          // Refresh project data when completed
          await getProject(projectId)
          await getProjectStatistics(projectId)
        }
      }

      poll()
    },
    [getProgress, getProject],
  )

  // Get project scenes
  const getProjectScenes = useCallback(async (projectId: string): Promise<AnalysisScene[]> => {
    try {
      const scenes = await invoke<AnalysisScene[]>("get_project_scenes", {
        projectId,
      })

      setDashboardData((prev) => ({
        ...prev,
        recentScenes: scenes.slice(0, 10), // Show recent 10
      }))
      return scenes
    } catch (err) {
      console.error("Failed to get project scenes:", err)
      return []
    }
  }, [])

  // Get project key moments
  const getProjectMoments = useCallback(async (projectId: string): Promise<KeyMoment[]> => {
    try {
      const moments = await invoke<KeyMoment[]>("get_project_key_moments", {
        projectId,
      })

      // Sort by importance and take top 10
      const topMoments = moments.sort((a, b) => b.importance_score - a.importance_score).slice(0, 10)

      setDashboardData((prev) => ({ ...prev, topMoments }))
      return moments
    } catch (err) {
      console.error("Failed to get project moments:", err)
      return []
    }
  }, [])

  // Get project statistics
  const getProjectStatistics = useCallback(async (projectId: string): Promise<ProjectStatistics | null> => {
    try {
      const statistics = await invoke<ProjectStatistics>("get_project_statistics", {
        projectId,
      })

      setDashboardData((prev) => ({ ...prev, statistics }))
      return statistics
    } catch (err) {
      console.error("Failed to get project statistics:", err)
      return null
    }
  }, [])

  // Search project data
  const searchProjectData = useCallback(
    async (projectId: string, query: string, resultTypes?: SearchResultType[]): Promise<AnalysisSearchResult[]> => {
      try {
        const results = await invoke<AnalysisSearchResult[]>("search_project_data", {
          projectId,
          query,
          resultTypes,
        })
        return results
      } catch (err) {
        console.error("Failed to search project data:", err)
        return []
      }
    },
    [],
  )

  // Get default analysis config
  const getDefaultConfig = useCallback(async (): Promise<AnalysisConfig> => {
    try {
      const config = await invoke<AnalysisConfig>("get_default_analysis_config")
      return config
    } catch (err) {
      console.error("Failed to get default config:", err)
      // Return sensible defaults
      return {
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
      }
    }
  }, [])

  // Load dashboard data on mount
  useEffect(() => {
    getActiveProjects()
  }, [getActiveProjects])

  return {
    // State
    dashboardData,
    loading,
    error,

    // Actions
    createProject,
    getProject,
    getProgress,
    startAnalysis,
    getProjectScenes,
    getProjectMoments,
    getProjectStatistics,
    searchProjectData,
    getDefaultConfig,
    getActiveProjects,

    // Utilities
    setError: (error: string | null) => setError(error),
  }
}

export type UseAnalysisReturn = ReturnType<typeof useAnalysis>

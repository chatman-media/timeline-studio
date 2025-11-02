// Updated Timeline Analysis Hook that integrates with Analysis Dashboard system

import { useCallback, useEffect, useState } from "react"
import { useAnalysis } from "@/features/analysis-dashboard/hooks/use-analysis"
import { AnalysisProject, AnalysisScene, KeyMoment } from "@/features/analysis-dashboard/types/analysis"
import { useTimeline } from "./use-timeline"

interface TimelineAnalysisState {
  isAnalyzing: boolean
  analysisProgress: number
  activeProject: AnalysisProject | null
  scenes: AnalysisScene[]
  keyMoments: KeyMoment[]
  error: string | null
  lastAnalyzedFiles: string[]
}

interface TimelineAnalysisMarker {
  id: string
  type: "scene" | "moment" | "person" | "quality"
  timestamp: number
  duration?: number
  title: string
  description?: string
  color: string
  confidence: number
  data: any
}

export interface TimelineAnalysisHook {
  // State
  state: TimelineAnalysisState

  // Project management
  createProjectFromTimeline: (name?: string) => Promise<string | null>
  linkTimelineToProject: (projectId: string) => Promise<void>
  unlinkFromProject: () => void

  // Analysis actions
  startAnalysis: () => Promise<void>
  stopAnalysis: () => Promise<void>
  refreshAnalysis: () => Promise<void>

  // Timeline integration
  markers: TimelineAnalysisMarker[]
  jumpToScene: (sceneId: string) => void
  jumpToMoment: (momentId: string) => void

  // Filtering and search
  visibleMarkerTypes: Set<string>
  toggleMarkerType: (type: string) => void
  searchInAnalysis: (query: string) => Promise<void>

  // Settings
  autoAnalyzeNewClips: boolean
  setAutoAnalyzeNewClips: (enabled: boolean) => void
  markerOpacity: number
  setMarkerOpacity: (opacity: number) => void
}

export function useTimelineAnalysis(): TimelineAnalysisHook {
  const { project: timelineProject, send } = useTimeline()
  const analysis = useAnalysis()

  const [state, setState] = useState<TimelineAnalysisState>({
    isAnalyzing: false,
    analysisProgress: 0,
    activeProject: null,
    scenes: [],
    keyMoments: [],
    error: null,
    lastAnalyzedFiles: [],
  })

  const [markers, setMarkers] = useState<TimelineAnalysisMarker[]>([])
  const [visibleMarkerTypes, setVisibleMarkerTypes] = useState<Set<string>>(new Set(["scene", "moment", "quality"]))
  const [autoAnalyzeNewClips, setAutoAnalyzeNewClips] = useState(true)
  const [markerOpacity, setMarkerOpacity] = useState(0.8)

  // Create analysis project from current timeline
  const createProjectFromTimeline = useCallback(
    async (name?: string): Promise<string | null> => {
      if (!timelineProject) {
        setState((prev) => ({ ...prev, error: "Нет активного проекта Timeline" }))
        return null
      }

      // Collect all media files from timeline
      const mediaFiles = new Set<string>()

      timelineProject.sections.forEach((section) => {
        section.tracks.forEach((track) => {
          track.clips.forEach((clip) => {
            if (clip.source?.path) {
              mediaFiles.add(clip.source.path)
            }
          })
        })
      })

      timelineProject.globalTracks.forEach((track) => {
        track.clips.forEach((clip) => {
          if (clip.source?.path) {
            mediaFiles.add(clip.source.path)
          }
        })
      })

      const filePaths = Array.from(mediaFiles)

      if (filePaths.length === 0) {
        setState((prev) => ({ ...prev, error: "В Timeline нет медиафайлов для анализа" }))
        return null
      }

      // Create analysis config with balanced settings
      const config = await analysis.getDefaultConfig()

      const projectName = name || `Timeline Analysis - ${timelineProject.name || "Проект"}`
      const description = `Автоматический анализ из проекта Timeline (${filePaths.length} файлов)`

      const projectId = await analysis.createProject(projectName, description, config, filePaths)

      if (projectId) {
        setState((prev) => ({ ...prev, lastAnalyzedFiles: filePaths }))
      }

      return projectId
    },
    [timelineProject, analysis],
  )

  // Link timeline to existing analysis project
  const linkTimelineToProject = useCallback(
    async (projectId: string) => {
      const project = await analysis.getProject(projectId)
      if (project) {
        setState((prev) => ({ ...prev, activeProject: project, error: null }))
        await refreshAnalysis()
      }
    },
    [analysis],
  )

  // Unlink from analysis project
  const unlinkFromProject = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeProject: null,
      scenes: [],
      keyMoments: [],
      isAnalyzing: false,
      error: null,
    }))
    setMarkers([])
  }, [])

  // Start analysis of current project
  const startAnalysis = useCallback(async () => {
    let projectId = state.activeProject?.id

    if (!projectId) {
      // Create project if none exists
      projectId = await createProjectFromTimeline()
      if (!projectId) return
    }

    setState((prev) => ({ ...prev, isAnalyzing: true, error: null }))

    const success = await analysis.startAnalysis(projectId)
    if (!success) {
      setState((prev) => ({ ...prev, isAnalyzing: false }))
    }
  }, [state.activeProject, createProjectFromTimeline, analysis])

  // Stop analysis
  const stopAnalysis = useCallback(async () => {
    // TODO: Implement stop analysis in backend
    setState((prev) => ({ ...prev, isAnalyzing: false }))
  }, [])

  // Refresh analysis data
  const refreshAnalysis = useCallback(async () => {
    if (!state.activeProject) return

    const [scenes, moments] = await Promise.all([
      analysis.getProjectScenes(state.activeProject.id),
      analysis.getProjectMoments(state.activeProject.id),
    ])

    setState((prev) => ({
      ...prev,
      scenes,
      keyMoments: moments,
    }))
  }, [state.activeProject, analysis])

  // Generate timeline markers from analysis data
  useEffect(() => {
    const newMarkers: TimelineAnalysisMarker[] = []

    // Scene markers
    if (visibleMarkerTypes.has("scene")) {
      state.scenes.forEach((scene) => {
        newMarkers.push({
          id: `scene-${scene.id}`,
          type: "scene",
          timestamp: scene.start_time,
          duration: scene.duration,
          title: `${getSceneTypeLabel(scene.scene_type)}`,
          description: scene.auto_description || `${scene.scene_type} сцена`,
          color: getSceneTypeColor(scene.scene_type),
          confidence: scene.confidence,
          data: scene,
        })
      })
    }

    // Key moment markers
    if (visibleMarkerTypes.has("moment")) {
      state.keyMoments.forEach((moment) => {
        newMarkers.push({
          id: `moment-${moment.id}`,
          type: "moment",
          timestamp: moment.timestamp,
          duration: moment.duration,
          title: getMomentTypeLabel(moment.moment_type),
          description: moment.description || moment.auto_description,
          color: getMomentTypeColor(moment.moment_type),
          confidence: moment.importance_score,
          data: moment,
        })
      })
    }

    // Quality markers (show low quality areas)
    if (visibleMarkerTypes.has("quality")) {
      state.scenes
        .filter((scene) => scene.quality_score < 0.6)
        .forEach((scene) => {
          newMarkers.push({
            id: `quality-${scene.id}`,
            type: "quality",
            timestamp: scene.start_time,
            duration: scene.duration,
            title: "Низкое качество",
            description: `Качество: ${Math.round(scene.quality_score * 100)}%`,
            color: "#ef4444",
            confidence: 1 - scene.quality_score,
            data: scene,
          })
        })
    }

    setMarkers(newMarkers)
  }, [state.scenes, state.keyMoments, visibleMarkerTypes])

  // Jump to scene
  const jumpToScene = useCallback(
    (sceneId: string) => {
      const scene = state.scenes.find((s) => s.id === sceneId)
      if (scene) {
        send({
          type: "SEEK_TO",
          time: scene.start_time,
        })
      }
    },
    [state.scenes, send],
  )

  // Jump to moment
  const jumpToMoment = useCallback(
    (momentId: string) => {
      const moment = state.keyMoments.find((m) => m.id === momentId)
      if (moment) {
        send({
          type: "SEEK_TO",
          time: moment.timestamp,
        })
      }
    },
    [state.keyMoments, send],
  )

  // Toggle marker type visibility
  const toggleMarkerType = useCallback((type: string) => {
    setVisibleMarkerTypes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }, [])

  // Search in analysis
  const searchInAnalysis = useCallback(
    async (query: string) => {
      if (!state.activeProject || !query.trim()) return

      try {
        const results = await analysis.searchProjectData(state.activeProject.id, query.trim())

        // Filter markers based on search results
        const resultIds = new Set(results.map((r) => r.id))
        const filteredMarkers = markers.filter(
          (marker) =>
            resultIds.has(marker.data?.id) ||
            marker.title.toLowerCase().includes(query.toLowerCase()) ||
            marker.description?.toLowerCase().includes(query.toLowerCase()),
        )

        // Temporarily override markers with search results
        setMarkers(filteredMarkers)
      } catch (error) {
        console.error("Search failed:", error)
      }
    },
    [state.activeProject, analysis, markers],
  )

  // Monitor analysis progress
  useEffect(() => {
    if (!state.activeProject || !analysis.dashboardData.progress) return

    const progress = analysis.dashboardData.progress

    setState((prev) => ({
      ...prev,
      isAnalyzing: progress.status === "InProgress",
      analysisProgress: Math.round(progress.progress * 100),
      error: progress.error_message || null,
    }))

    // Refresh data when analysis completes
    if (progress.status === "Completed") {
      refreshAnalysis()
    }
  }, [analysis.dashboardData.progress, state.activeProject, refreshAnalysis])

  // Auto-analyze new clips
  useEffect(() => {
    if (!autoAnalyzeNewClips || !timelineProject || state.isAnalyzing) return

    // Check for new media files
    const currentFiles = new Set<string>()

    timelineProject.sections.forEach((section) => {
      section.tracks.forEach((track) => {
        track.clips.forEach((clip) => {
          if (clip.source?.path) {
            currentFiles.add(clip.source.path)
          }
        })
      })
    })

    const currentFilesArray = Array.from(currentFiles)
    const hasNewFiles = currentFilesArray.some((file) => !state.lastAnalyzedFiles.includes(file))

    if (hasNewFiles && currentFilesArray.length > 0) {
      // Debounce auto-analysis
      const timer = setTimeout(() => {
        if (state.activeProject) {
          startAnalysis()
        } else {
          createProjectFromTimeline().then((projectId) => {
            if (projectId) {
              analysis.startAnalysis(projectId)
            }
          })
        }
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [
    timelineProject,
    autoAnalyzeNewClips,
    state.isAnalyzing,
    state.lastAnalyzedFiles,
    state.activeProject,
    startAnalysis,
    createProjectFromTimeline,
    analysis,
  ])

  return {
    state,
    createProjectFromTimeline,
    linkTimelineToProject,
    unlinkFromProject,
    startAnalysis,
    stopAnalysis,
    refreshAnalysis,
    markers,
    jumpToScene,
    jumpToMoment,
    visibleMarkerTypes,
    toggleMarkerType,
    searchInAnalysis,
    autoAnalyzeNewClips,
    setAutoAnalyzeNewClips,
    markerOpacity,
    setMarkerOpacity,
  }
}

// Helper functions for labels and colors
function getSceneTypeLabel(type: string): string {
  switch (type) {
    case "Wide":
      return "Общий план"
    case "Medium":
      return "Средний план"
    case "Closeup":
      return "Крупный план"
    case "Dynamic":
      return "Динамичная"
    case "Static":
      return "Статичная"
    case "Cinematic":
      return "Кинематографичная"
    default:
      return "Сцена"
  }
}

function getSceneTypeColor(type: string): string {
  switch (type) {
    case "Wide":
      return "#10b981"
    case "Medium":
      return "#f59e0b"
    case "Closeup":
      return "#3b82f6"
    case "Dynamic":
      return "#ef4444"
    case "Static":
      return "#6b7280"
    case "Cinematic":
      return "#8b5cf6"
    default:
      return "#6b7280"
  }
}

function getMomentTypeLabel(type: string): string {
  switch (type) {
    case "ActionClimax":
      return "Экшен"
    case "EmotionalPeak":
      return "Эмоциональный пик"
    case "VisualStunning":
      return "Визуальный"
    case "AudioPeak":
      return "Аудио пик"
    case "QualityPeak":
      return "Качественный"
    case "ComedicMoment":
      return "Комедийный"
    case "DialogueHighlight":
      return "Диалог"
    case "SceneTransition":
      return "Переход"
    case "MotionPeak":
      return "Движение"
    case "DramaticPause":
      return "Драматичный"
    case "UserDefined":
      return "Пользовательский"
    default:
      return "Момент"
  }
}

function getMomentTypeColor(type: string): string {
  switch (type) {
    case "ActionClimax":
      return "#ef4444"
    case "EmotionalPeak":
      return "#f59e0b"
    case "VisualStunning":
      return "#8b5cf6"
    case "AudioPeak":
      return "#3b82f6"
    case "QualityPeak":
      return "#10b981"
    case "ComedicMoment":
      return "#fbbf24"
    case "DialogueHighlight":
      return "#06b6d4"
    case "SceneTransition":
      return "#6b7280"
    case "MotionPeak":
      return "#ec4899"
    case "DramaticPause":
      return "#7c3aed"
    case "UserDefined":
      return "#374151"
    default:
      return "#6b7280"
  }
}

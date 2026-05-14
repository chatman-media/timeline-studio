/**
 * Hook для получения фрагментов из AI Director анализа
 */

import { useMemo, useState } from "react"

import type { FragmentFilters, ScriptFragment } from "@/features/timeline/types/script"

import { useTimelineAnalysis } from "../../../hooks/state/use-timeline-analysis"

/** Shape of one scene entry produced by the AI Director analysis pipeline */
interface AIScene {
  start_time?: number
  end_time?: number
  thumbnail?: string
  quality_score?: number
  tags?: string[]
  emotions?: string[]
  objects?: string[]
  faces_count?: number
}

/** Shape of the analysis result stored in FileAnalysisProgress.result */
interface AIAnalysisResult {
  scene_analysis?: {
    scenes?: AIScene[]
  }
}

export function useFragmentLibrary() {
  const { filesProgress } = useTimelineAnalysis()
  const [filters, setFilters] = useState<FragmentFilters>({})

  // Конвертируем результаты анализа в фрагменты
  const allFragments = useMemo((): ScriptFragment[] => {
    if (!filesProgress || filesProgress.length === 0) return []

    return filesProgress
      .filter((f) => f.status === "completed" && f.result)
      .flatMap((file) => {
        const analysis = file.result as AIAnalysisResult
        if (!analysis?.scene_analysis?.scenes) return []

        // Конвертируем сцены из анализа в фрагменты
        return analysis.scene_analysis.scenes.map((scene, index) => {
          const fragment: ScriptFragment = {
            id: `${file.fileId}-scene-${index}`,
            fileId: file.fileId,
            startTime: scene.start_time || 0,
            endTime: scene.end_time || 0,
            duration: (scene.end_time || 0) - (scene.start_time || 0),
            thumbnail: scene.thumbnail,
            qualityScore: scene.quality_score || 0,
            tags: scene.tags || [],
            emotions: scene.emotions || [],
            objects: scene.objects || [],
            facesCount: scene.faces_count,
          }
          return fragment
        })
      })
  }, [filesProgress])

  // Применяем фильтры
  const filteredFragments = useMemo(() => {
    return allFragments.filter((fragment) => {
      // Минимальное качество
      if (filters.minQuality && fragment.qualityScore < filters.minQuality) {
        return false
      }

      // Эмоции
      if (filters.emotions && filters.emotions.length > 0) {
        const hasEmotion = filters.emotions.some((emotion) => fragment.emotions.includes(emotion))
        if (!hasEmotion) return false
      }

      // Теги
      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some((tag) => fragment.tags.includes(tag))
        if (!hasTag) return false
      }

      // Длительность
      if (filters.minDuration && fragment.duration < filters.minDuration) {
        return false
      }
      if (filters.maxDuration && fragment.duration > filters.maxDuration) {
        return false
      }

      // Только с лицами
      if (filters.onlyWithFaces && (!fragment.facesCount || fragment.facesCount === 0)) {
        return false
      }

      return true
    })
  }, [allFragments, filters])

  return {
    fragments: filteredFragments,
    allFragments,
    filters,
    setFilters,
    hasFragments: allFragments.length > 0,
    totalCount: allFragments.length,
    filteredCount: filteredFragments.length,
  }
}

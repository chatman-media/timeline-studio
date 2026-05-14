/**
 * Hook для управления состоянием плана монтажа
 */

import { useCallback, useState } from "react"

import type {
  MontageStyle,
  PlanSettings,
  ScriptFragment,
  ScriptPlan,
  ScriptScene,
  TransitionType,
} from "@/features/timeline/types/script"

export function useScriptPlan() {
  const [plan, setPlan] = useState<ScriptPlan | null>(null)

  // Создать новый план
  const createPlan = useCallback((name: string, style: MontageStyle, targetDuration: number) => {
    const newPlan: ScriptPlan = {
      id: `plan-${Date.now()}`,
      name,
      targetDuration,
      style,
      scenes: [],
      settings: {
        prioritizeQuality: true,
        prioritizeEngagement: true,
        syncWithMusic: false,
        includeFaces: true,
        includeDynamic: true,
        paceLevel: 50,
        transitionComplexity: 50,
      },
      stats: {
        totalScenes: 0,
        totalTransitions: 0,
        totalDuration: 0,
        qualityScore: 0,
        engagementScore: 0,
        coherenceScore: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setPlan(newPlan)
    return newPlan
  }, [])

  // Обновить план
  const updatePlan = useCallback((updates: Partial<ScriptPlan>) => {
    setPlan((prev) => {
      if (!prev) return null
      return {
        ...prev,
        ...updates,
        updatedAt: new Date(),
      }
    })
  }, [])

  // Добавить сцену в план
  const addScene = useCallback((fragment: ScriptFragment, transition: TransitionType = "CUT") => {
    setPlan((prev) => {
      if (!prev) return null

      const newScene: ScriptScene = {
        id: `scene-${Date.now()}`,
        order: prev.scenes.length,
        fragmentId: fragment.id,
        startTime: fragment.startTime,
        endTime: fragment.endTime,
        duration: fragment.duration,
        transition,
      }

      const newScenes = [...prev.scenes, newScene]
      const totalDuration = newScenes.reduce((sum, s) => sum + s.duration, 0)

      return {
        ...prev,
        scenes: newScenes,
        stats: {
          ...prev.stats,
          totalScenes: newScenes.length,
          totalTransitions: newScenes.length - 1,
          totalDuration,
        },
        updatedAt: new Date(),
      }
    })
  }, [])

  // Удалить сцену
  const removeScene = useCallback((sceneId: string) => {
    setPlan((prev) => {
      if (!prev) return null

      const newScenes = prev.scenes.filter((s) => s.id !== sceneId).map((s, index) => ({ ...s, order: index }))

      const totalDuration = newScenes.reduce((sum, s) => sum + s.duration, 0)

      return {
        ...prev,
        scenes: newScenes,
        stats: {
          ...prev.stats,
          totalScenes: newScenes.length,
          totalTransitions: Math.max(0, newScenes.length - 1),
          totalDuration,
        },
        updatedAt: new Date(),
      }
    })
  }, [])

  // Переместить сцену
  const reorderScenes = useCallback((sceneIds: string[]) => {
    setPlan((prev) => {
      if (!prev) return null

      const sceneMap = new Map(prev.scenes.map((s) => [s.id, s]))
      const newScenes = sceneIds
        .map((id) => sceneMap.get(id))
        .filter((s): s is ScriptScene => s !== undefined)
        .map((s, index) => ({ ...s, order: index }))

      return {
        ...prev,
        scenes: newScenes,
        updatedAt: new Date(),
      }
    })
  }, [])

  // Обновить настройки плана
  const updateSettings = useCallback((settings: Partial<PlanSettings>) => {
    setPlan((prev) => {
      if (!prev) return null
      return {
        ...prev,
        settings: { ...prev.settings, ...settings },
        updatedAt: new Date(),
      }
    })
  }, [])

  // Очистить план
  const clearPlan = useCallback(() => {
    setPlan(null)
  }, [])

  return {
    plan,
    createPlan,
    updatePlan,
    addScene,
    removeScene,
    reorderScenes,
    updateSettings,
    clearPlan,
  }
}

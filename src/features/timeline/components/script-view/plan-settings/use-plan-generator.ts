/**
 * Hook для генерации плана монтажа через AI
 */

import { useCallback, useState } from "react"

import type { MontageStyle, ScriptFragment, ScriptPlan } from "@/features/timeline/types/script"

export interface GeneratePlanOptions {
  style: MontageStyle
  targetDuration: number
  fragments: ScriptFragment[]
  prioritizeQuality?: boolean
  prioritizeEngagement?: boolean
  syncWithMusic?: boolean
}

export function usePlanGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Генерация плана (пока простая логика, позже подключим Montage Planner backend)
  const generatePlan = useCallback(async (options: GeneratePlanOptions): Promise<ScriptPlan> => {
    setIsGenerating(true)
    setError(null)

    try {
      // Сортируем фрагменты по качеству
      const sortedFragments = [...options.fragments].sort((a, b) => b.qualityScore - a.qualityScore)

      // Выбираем фрагменты до достижения целевой длительности
      const selectedFragments: ScriptFragment[] = []
      let totalDuration = 0

      for (const fragment of sortedFragments) {
        if (totalDuration >= options.targetDuration) break
        selectedFragments.push(fragment)
        totalDuration += fragment.duration
      }

      // Создаём план
      const plan: ScriptPlan = {
        id: `plan-${Date.now()}`,
        name: `${options.style} план`,
        targetDuration: options.targetDuration,
        style: options.style,
        scenes: selectedFragments.map((fragment, index) => ({
          id: `scene-${Date.now()}-${index}`,
          order: index,
          fragmentId: fragment.id,
          startTime: fragment.startTime,
          endTime: fragment.endTime,
          duration: fragment.duration,
          transition: index === 0 ? "CUT" : getTransitionForStyle(options.style),
        })),
        settings: {
          prioritizeQuality: options.prioritizeQuality ?? true,
          prioritizeEngagement: options.prioritizeEngagement ?? true,
          syncWithMusic: options.syncWithMusic ?? false,
          includeFaces: true,
          includeDynamic: true,
          paceLevel: getPaceLevelForStyle(options.style),
          transitionComplexity: 50,
        },
        stats: {
          totalScenes: selectedFragments.length,
          totalTransitions: selectedFragments.length - 1,
          totalDuration,
          qualityScore: calculateAverageQuality(selectedFragments),
          engagementScore: 85, // TODO: расчитать на основе анализа
          coherenceScore: 80, // TODO: расчитать на основе последовательности
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setIsGenerating(false)
      return plan
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка генерации плана"
      setError(message)
      setIsGenerating(false)
      throw err
    }
  }, [])

  return {
    generatePlan,
    isGenerating,
    error,
  }
}

// Вспомогательные функции
function getTransitionForStyle(style: MontageStyle): "CUT" | "FADE" | "DISSOLVE" {
  switch (style) {
    case "dynamic-action":
    case "social-media":
      return "CUT"
    case "cinematic-drama":
    case "documentary":
      return "DISSOLVE"
    case "music-video":
    case "corporate":
      return "FADE"
    default:
      return "CUT"
  }
}

function getPaceLevelForStyle(style: MontageStyle): number {
  switch (style) {
    case "dynamic-action":
    case "social-media":
      return 80 // Быстрый темп
    case "music-video":
      return 70
    case "corporate":
      return 50
    case "documentary":
      return 40
    case "cinematic-drama":
      return 30 // Медленный темп
    default:
      return 50
  }
}

function calculateAverageQuality(fragments: ScriptFragment[]): number {
  if (fragments.length === 0) return 0
  const sum = fragments.reduce((acc, f) => acc + f.qualityScore, 0)
  return Math.round(sum / fragments.length)
}

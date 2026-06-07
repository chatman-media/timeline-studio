/**
 * Хук для генерации превью видео для эффектов
 */

import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNotifications } from "@/core/hooks"
import type { BaseEffect } from "../types"
import {
  type EffectPreviewConfig,
  generateAllEffectPreviews,
  updateEffectsWithPreviews,
} from "../utils/generate-effect-previews"
import { savePreviewPaths } from "../utils/preview-storage"

export interface PreviewGenerationState {
  isGenerating: boolean
  progress: number
  total: number
  currentEffectId?: string
  completed: number
  failed: number
  error?: string
  updatedEffects?: BaseEffect[]
}

export function useEffectPreviewGenerator() {
  const { t } = useTranslation()
  const { showSuccess, showError, showInfo } = useNotifications()
  const [state, setState] = useState<PreviewGenerationState>({
    isGenerating: false,
    progress: 0,
    total: 0,
    completed: 0,
    failed: 0,
  })

  /**
   * Сгенерировать превью для всех эффектов
   */
  const generatePreviews = useCallback(
    async (effects: BaseEffect[], config: Partial<EffectPreviewConfig> = {}) => {
      const fullConfig: EffectPreviewConfig = {
        sourceVideoPath: config.sourceVideoPath || "/t1.mp4",
        duration: config.duration || 3, // 3 секунды по умолчанию
        quality: config.quality || 75,
        outputDir: config.outputDir || "preview-videos/effects",
      }

      setState({
        isGenerating: true,
        progress: 0,
        total: effects.length,
        completed: 0,
        failed: 0,
      })

      showInfo(t("effects.preview.generating"), t("effects.preview.generatingMessage", { count: effects.length }))

      try {
        const results = await generateAllEffectPreviews(effects, fullConfig, (current, total, effectId) => {
          setState((prev) => ({
            ...prev,
            progress: (current / total) * 100,
            currentEffectId: effectId,
          }))
        })

        const completed = results.size
        const failed = effects.length - completed

        // Обновляем эффекты с путями к превью
        const updatedEffects = updateEffectsWithPreviews(effects, results)

        // Сохраняем пути к превью в localStorage
        savePreviewPaths(results)

        setState({
          isGenerating: false,
          progress: 100,
          total: effects.length,
          completed,
          failed,
          updatedEffects,
        })

        if (failed > 0) {
          showSuccess(
            t("effects.preview.completedWithErrors"),
            t("effects.preview.completedMessage", { completed, failed }),
          )
        } else {
          showSuccess(t("effects.preview.completed"), t("effects.preview.allCompletedMessage", { count: completed }))
        }

        return results
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t("common.unknownError")

        setState({
          isGenerating: false,
          progress: 0,
          total: effects.length,
          completed: 0,
          failed: effects.length,
          error: errorMessage,
        })

        showError(t("effects.preview.error"), errorMessage)
        return new Map<string, string>()
      }
    },
    [t, showSuccess, showError, showInfo],
  )

  /**
   * Отменить генерацию
   */
  const cancelGeneration = useCallback(() => {
    setState({
      isGenerating: false,
      progress: 0,
      total: 0,
      completed: 0,
      failed: 0,
    })
  }, [])

  return {
    ...state,
    generatePreviews,
    cancelGeneration,
  }
}

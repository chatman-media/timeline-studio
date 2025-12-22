/**
 * Хук для загрузки эффектов с сохраненными превью
 * Автоматически загружает пути к превью из localStorage и применяет к эффектам
 */

import { useMemo } from "react"
import type { BaseEffect } from "../types"
import { loadPreviewPaths } from "../utils/preview-storage"

/**
 * Добавляет сохраненные пути к превью к списку эффектов
 */
export function useEffectsWithPreviews(effects: BaseEffect[]): BaseEffect[] {
  return useMemo(() => {
    // Загружаем сохраненные пути
    const previewPaths = loadPreviewPaths()

    // Если нет сохраненных превью, возвращаем эффекты как есть
    if (previewPaths.size === 0) {
      return effects
    }

    // Добавляем пути к превью к эффектам
    return effects.map((effect) => {
      const previewPath = previewPaths.get(effect.id)
      if (previewPath) {
        return {
          ...effect,
          preview: previewPath,
        }
      }
      return effect
    })
  }, [effects])
}

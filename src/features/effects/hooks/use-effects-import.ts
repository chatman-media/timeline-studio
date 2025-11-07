import { open } from "@tauri-apps/plugin-dialog"
import { useCallback, useState } from "react"

import { logError, logInfo } from "@/lib/tauri-logger"
import type { BaseEffect } from "@/features/effects/types"

import { EffectManager } from "../services/effect-manager"
import { loadEffectsCollection, loadUserEffect } from "../utils/user-effects"

/**
 * Интерфейс для результата импорта эффектов
 */
interface ImportResult {
  success: boolean
  message: string
  effects: BaseEffect[]
  imported?: number
  failed?: number
}

/**
 * Хук для импорта пользовательских эффектов
 * Позволяет импортировать JSON файлы с эффектами или отдельные файлы эффектов
 */
export function useEffectsImport() {
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)

  /**
   * Валидация структуры эффекта
   */
  const validateEffect = (effect: any): effect is BaseEffect => {
    return (
      effect &&
      typeof effect.id === "string" &&
      effect.name &&
      (typeof effect.name === "string" || typeof effect.name === "object") &&
      typeof effect.category === "string" &&
      (typeof effect.scope === "string" || Array.isArray(effect.scope)) &&
      Array.isArray(effect.parameters) &&
      effect.processors &&
      typeof effect.processors === "object"
    )
  }

  /**
   * Импорт JSON файла с эффектами
   */
  const importEffectsFile = useCallback(async (): Promise<ImportResult> => {
    logInfo("useEffectsImport", "Starting effects file import")

    if (isImporting) {
      logInfo("useEffectsImport", "Import already in progress")
      return {
        success: false,
        message: "Импорт уже выполняется",
        effects: [],
      }
    }

    setIsImporting(true)
    setProgress(0)

    try {
      // Открываем диалог выбора файла эффектов
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Effect Files",
            extensions: ["json", "effect", "effects"],
          },
        ],
      })

      if (!selected) {
        setIsImporting(false)
        return {
          success: false,
          message: "Файл не выбран",
          effects: [],
        }
      }

      setProgress(25)

      // Определяем тип файла
      const fileExtension = selected.split(".").pop()?.toLowerCase()
      let effects: BaseEffect[] = []
      let imported = 0
      let failed = 0

      try {
        if (fileExtension === "effect") {
          // Пользовательский эффект
          const userEffect = await loadUserEffect(selected)
          if (userEffect && validateEffect(userEffect)) {
            effects = [userEffect]
            imported = 1
          } else {
            failed = 1
          }
        } else if (fileExtension === "effects") {
          // Коллекция эффектов
          const collection = await loadEffectsCollection(selected)
          if (collection && collection.effects && Array.isArray(collection.effects)) {
            collection.effects.forEach((effect) => {
              if (validateEffect(effect)) {
                effects.push(effect)
                imported++
              } else {
                failed++
              }
            })
          }
        } else {
          // Обычный JSON
          const response = await fetch(`file://${selected}`)
          const data = await response.json()

          if (Array.isArray(data)) {
            data.forEach((item) => {
              if (validateEffect(item)) {
                effects.push(item)
                imported++
              } else {
                failed++
              }
            })
          } else if (data.effects && Array.isArray(data.effects)) {
            data.effects.forEach((item: any) => {
              if (validateEffect(item)) {
                effects.push(item)
                imported++
              } else {
                failed++
              }
            })
          } else if (validateEffect(data)) {
            effects = [data]
            imported = 1
          } else {
            failed = 1
          }
        }
      } catch (error) {
        logError("useEffectsImport", "Error reading effects file", error)
        setIsImporting(false)
        return {
          success: false,
          message: "Ошибка чтения файла эффектов",
          effects: [],
        }
      }

      setProgress(50)

      setProgress(75)

      if (effects.length === 0) {
        setIsImporting(false)
        return {
          success: false,
          message:
            failed > 0
              ? `Не удалось импортировать ${failed} эффектов. Проверьте формат файла.`
              : "В файле не найдено валидных эффектов",
          effects: [],
          imported: 0,
          failed,
        }
      }

      // Регистрируем эффекты в EffectManager
      const effectManager = new EffectManager()
      effects.forEach((effect) => {
        try {
          effectManager.registerEffect(effect)
        } catch (error) {
          logError("useEffectsImport", `Failed to register effect ${effect.id}`, error)
        }
      })

      setProgress(100)
      setIsImporting(false)

      const message =
        failed > 0
          ? `Успешно импортировано ${imported} эффектов. Не удалось импортировать: ${failed}`
          : `Успешно импортировано ${imported} эффектов`

      logInfo("useEffectsImport", `Effects import completed: ${imported} imported, ${failed} failed`)
      return {
        success: true,
        message,
        effects,
        imported,
        failed,
      }
    } catch (error) {
      logError("useEffectsImport", "Error during effects import", error)
      setIsImporting(false)
      return {
        success: false,
        message: `Ошибка при импорте: ${String(error)}`,
        effects: [],
      }
    }
  }, [isImporting])

  /**
   * Импорт отдельного файла эффекта (например, .cube для LUT)
   */
  const importEffectFile = useCallback(async (): Promise<ImportResult> => {
    logInfo("useEffectsImport", "Starting effect file import")

    if (isImporting) {
      logInfo("useEffectsImport", "Import already in progress")
      return {
        success: false,
        message: "Импорт уже выполняется",
        effects: [],
      }
    }

    setIsImporting(true)
    setProgress(0)

    try {
      // Открываем диалог выбора файла эффекта
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Effect Files",
            extensions: ["cube", "3dl", "lut", "json", "preset"],
          },
        ],
      })

      if (!selected) {
        setIsImporting(false)
        return {
          success: false,
          message: "Файлы не выбраны",
          effects: [],
        }
      }

      const files = Array.isArray(selected) ? selected : [selected]
      setProgress(25)

      const importedEffects: BaseEffect[] = []
      let imported = 0

      for (let i = 0; i < files.length; i++) {
        const filePath = files[i]
        const fileName = filePath.split("/").pop() || filePath.split("\\").pop() || "unknown"
        const extension = fileName.split(".").pop()?.toLowerCase()
        const baseName = fileName.replace(/\.[^/.]+$/, "")

        // Определяем категорию на основе типа файла
        let category = "stylize"
        if (extension === "cube" || extension === "3dl") {
          category = "luts"
        }

        // Создаем базовый эффект на основе файла
        const effect: BaseEffect = {
          id: `user_lut_${Date.now()}_${i}`,
          name: {
            en: baseName,
            ru: baseName,
          },
          category: category as any,
          scope: ["clip"],
          processingType: "render",
          complexity: "low",
          gpuAccelerated: false,
          version: "1.0.0",
          author: "User",
          description: {
            en: `Custom LUT effect from ${fileName}`,
            ru: `Пользовательский LUT эффект из ${fileName}`,
          },
          tags: ["custom", "lut", "imported"],
          parameters: [
            {
              id: "intensity",
              name: { en: "Intensity", ru: "Интенсивность" },
              type: "number",
              defaultValue: 1.0,
              min: 0,
              max: 1,
              step: 0.01,
            },
          ],
          processors: {
            ffmpeg: {
              filter: (params) => {
                const intensity = params.intensity || 1.0
                return extension === "cube" || extension === "3dl"
                  ? `lut3d=${filePath}:interp=trilinear:amount=${intensity}`
                  : `custom=${filePath}:intensity=${intensity}`
              },
            },
          },
          presets: [],
          thumbnail: "/effects/lut-preview.jpg",
          preview: "/t1.mp4",
          // compatibility: {
          //   webgl: false,
          //   css: false,
          //   ffmpeg: true,
          // },
        }

        importedEffects.push(effect)
        imported++
        setProgress(25 + (i + 1) * (50 / files.length))
      }

      // Регистрируем эффекты в EffectManager
      const effectManager = new EffectManager()
      importedEffects.forEach((effect) => {
        try {
          effectManager.registerEffect(effect)
        } catch (error) {
          logError("useEffectsImport", `Failed to register LUT effect ${effect.id}`, error)
        }
      })

      setProgress(100)
      setIsImporting(false)

      logInfo("useEffectsImport", `Imported ${imported} effect files`)
      return {
        success: true,
        message: `Успешно импортировано ${imported} файлов эффектов`,
        effects: importedEffects,
        imported,
      }
    } catch (error) {
      logError("useEffectsImport", "Error during effect files import", error)
      setIsImporting(false)
      return {
        success: false,
        message: `Ошибка при импорте: ${String(error)}`,
        effects: [],
      }
    }
  }, [isImporting])

  return {
    importEffectsFile,
    importEffectFile,
    isImporting,
    progress,
  }
}

/**
 * Hook для применения montage планов к timeline
 *
 * Uses core services instead of direct invoke() calls.
 */

import { useCallback, useState } from "react"
import { fileSystemService } from "@timeline-studio/core/services"

import type { MontagePlan } from "../types/montage-plan"
import { validateMontagePlan } from "../utils/montage-plan-parser"

interface ApplyProgress {
  percent: number
  step: string
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  missingFiles: string[]
}

interface PreviewData {
  clips: MontagePlan["clips"]
  transitions: MontagePlan["transitions"]
  timelineRepresentation: string
  totalDuration: number
}

interface PartialOptions {
  clips: boolean
  transitions: boolean
  music: boolean
  text: boolean
}

interface ApplicatorCallbacks {
  onProgress?: (progress: ApplyProgress) => void
  onComplete?: (result: { success: boolean; plan: MontagePlan }) => void
  onError?: (error: Error) => void
}

export function useMontageApplicator(callbacks?: ApplicatorCallbacks) {
  const [isApplying, setIsApplying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [history, setHistory] = useState<MontagePlan[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  // Helper to get clips array (handles undefined)
  const getClips = (p: MontagePlan) => p.clips || p.fragments || []

  // Применить план к timeline
  const applyToTimeline = useCallback(
    async (plan: MontagePlan) => {
      setIsApplying(true)
      setProgress(0)
      setError(null)

      try {
        // Валидация плана
        const validation = validateMontagePlan(plan)
        if (!validation.isValid) {
          throw new Error(`Plan validation failed: ${validation.errors.join(", ")}`)
        }

        // Шаг 1: Добавление клипов (40%)
        setCurrentStep("Adding clips")
        setProgress(10)
        callbacks?.onProgress?.({ percent: 10, step: "Adding clips" })

        const clips = getClips(plan)
        for (let i = 0; i < clips.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 10)) // Симуляция
          const clipProgress = 10 + Math.floor((i / clips.length) * 30)
          setProgress(clipProgress)
        }

        // Шаг 2: Добавление переходов (20%)
        setCurrentStep("Adding transitions")
        setProgress(50)
        callbacks?.onProgress?.({ percent: 50, step: "Adding transitions" })

        for (let i = 0; i < plan.transitions.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 5))
          const transitionProgress = 50 + Math.floor((i / Math.max(plan.transitions.length, 1)) * 20)
          setProgress(transitionProgress)
        }

        // Шаг 3: Музыка (20%)
        if (plan.music) {
          setCurrentStep("Adding music")
          setProgress(70)
          callbacks?.onProgress?.({ percent: 70, step: "Adding music" })
          await new Promise((resolve) => setTimeout(resolve, 50))
        }

        // Шаг 4: Текстовые overlay (20%)
        if (plan.texts) {
          setCurrentStep("Adding text overlays")
          setProgress(85)
          callbacks?.onProgress?.({ percent: 85, step: "Adding text overlays" })
          await new Promise((resolve) => setTimeout(resolve, 30))
        }

        // Завершение
        setProgress(100)
        setCurrentStep(null)
        setIsApplying(false)

        // Сохраняем в историю
        setHistory((prev) => [...prev.slice(0, currentIndex + 1), plan])
        setCurrentIndex((prev) => prev + 1)

        callbacks?.onComplete?.({ success: true, plan })
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err))
        setError(errorObj)
        setIsApplying(false)
        callbacks?.onError?.(errorObj)
        throw errorObj
      }
    },
    [callbacks, currentIndex],
  )

  // Генерация preview
  const generatePreview = useCallback(async (plan: MontagePlan) => {
    const clips = getClips(plan)
    const preview: PreviewData = {
      clips,
      transitions: plan.transitions,
      timelineRepresentation: `Timeline with ${clips.length} clips`,
      totalDuration: plan.actualDuration || plan.targetDuration || plan.totalDuration || 0,
    }

    setPreview(preview)
  }, [])

  // Валидация плана
  const validatePlan = useCallback(async (plan: MontagePlan) => {
    const validation = validateMontagePlan(plan)

    const result: ValidationResult = {
      ...validation,
      missingFiles: [],
    }

    setValidationResult(result)
  }, [])

  // Проверка существования файлов
  const validateFiles = useCallback(async (plan: MontagePlan) => {
    const missingFiles: string[] = []
    const clips = getClips(plan)

    for (const clip of clips) {
      try {
        // Проверяем существование файла через platform-backed service
        const sourceFile = clip.sourceFile
        const sourceFilePath = typeof sourceFile === "string" ? sourceFile : sourceFile?.path
        const filePath = clip.filePath || sourceFilePath || ""
        if (!filePath) continue

        const exists = await fileSystemService.fileExists(filePath)
        if (!exists) {
          missingFiles.push(filePath)
        }
      } catch {
        const sourceFile = clip.sourceFile
        const sourceFilePath = typeof sourceFile === "string" ? sourceFile : sourceFile?.path
        const filePath = clip.filePath || sourceFilePath || ""
        if (filePath) {
          missingFiles.push(filePath)
        }
      }
    }

    const validation = validateMontagePlan(plan)
    setValidationResult({
      ...validation,
      missingFiles,
    })
  }, [])

  // Частичное применение
  const applyPartial = useCallback(async (plan: MontagePlan, options: PartialOptions) => {
    setIsApplying(true)
    setProgress(0)

    try {
      if (options.clips) {
        setCurrentStep("Adding clips")
        // Добавляем только клипы
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      if (options.transitions) {
        setCurrentStep("Adding transitions")
        // Добавляем только переходы
        await new Promise((resolve) => setTimeout(resolve, 30))
      }

      if (options.music && plan.music) {
        setCurrentStep("Adding music")
        await new Promise((resolve) => setTimeout(resolve, 30))
      }

      if (options.text && plan.texts) {
        setCurrentStep("Adding text")
        await new Promise((resolve) => setTimeout(resolve, 20))
      }

      setProgress(100)
      setIsApplying(false)
      setCurrentStep(null)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      setError(errorObj)
      setIsApplying(false)
    }
  }, [])

  // Undo
  const undo = useCallback(async () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setProgress(0)
    }
  }, [currentIndex])

  // Redo
  const redo = useCallback(async () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setProgress(100)
    }
  }, [currentIndex, history.length])

  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1

  return {
    // State
    isApplying,
    progress,
    currentStep,
    error,
    preview,
    validationResult,
    canUndo,
    canRedo,

    // Actions
    applyToTimeline,
    generatePreview,
    validatePlan,
    validateFiles,
    applyPartial,
    undo,
    redo,
  }
}

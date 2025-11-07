/**
 * Хук для интеграции Enhanced Subtitle Automation с TranscriptionPanel
 * Расширяет существующую функциональность транскрипции
 */

import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { logError, logInfo } from "@/lib/tauri-logger"

// Импортируем новый enhanced инструмент
import {
  autoGenerateSubtitlesFromVideo,
  type EnhancedSubtitleInput,
  type EnhancedSubtitleResult,
  enhancedSubtitleAutomation,
  extractSubtitlesFromScreenText,
  generateMultilingualSubtitles,
} from "../../ai-chat/tools/automation/enhanced-subtitle-automation"

// Базовые типы из транскрипции
import type { TranscriptionResult, TranscriptionSegment } from "../types"

// Расширенные опции для автоматизации субтитров
export interface EnhancedSubtitleOptions {
  // Базовые настройки из транскрипции
  language?: string
  task?: "transcribe" | "translate"

  // Новые AI опции
  useContentIntelligence?: boolean // Использовать ai-content-intelligence
  useSpeechRecognition?: boolean // Распознавание речи
  useOCR?: boolean // Оптическое распознавание текста
  useSceneAnalysis?: boolean // Анализ сцен
  usePersonIdentification?: boolean // Идентификация говорящих

  // Настройки обработки
  autoCorrectGrammar?: boolean
  autoCapitalization?: boolean
  removeFiller?: boolean
  optimizeReading?: boolean

  // Мультиязычность
  outputLanguages?: string[]
  detectMultipleLanguages?: boolean

  // Стилизация
  includeEmotionalCues?: boolean
  includeSpeakerLabels?: boolean
  includeSceneDescriptions?: boolean
  styleTemplate?: "standard" | "broadcast" | "social" | "accessibility"

  // Качество и производительность
  confidenceThreshold?: number
  maxSubtitleLength?: number
  minSubtitleDuration?: number
  maxSubtitleDuration?: number

  // AI провайдер
  aiProvider?: "whisper" | "azure" | "google" | "unified"
}

export interface EnhancedSubtitleProgress {
  stage:
    | "initializing"
    | "analyzing"
    | "speech_recognition"
    | "ocr"
    | "scene_analysis"
    | "optimizing"
    | "finalizing"
    | "completed"
    | "error"
  progress: number // 0-100
  message?: string
  details?: {
    speechProgress?: number
    ocrProgress?: number
    sceneProgress?: number
    optimizationProgress?: number
  }
}

export function useEnhancedSubtitleAutomation() {
  const { t } = useTranslation()
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<EnhancedSubtitleProgress>({
    stage: "initializing",
    progress: 0,
  })
  const [result, setResult] = useState<EnhancedSubtitleResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Для отмены операций
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Автоматическая генерация субтитров с использованием всех AI возможностей
   */
  const generateEnhancedSubtitles = useCallback(
    async (
      _mediaPath: string,
      clipId: string,
      options: EnhancedSubtitleOptions = {},
    ): Promise<EnhancedSubtitleResult | null> => {
      logInfo("[useEnhancedSubtitleAutomation] Начало генерации улучшенных субтитров", { clipId, options })
      setIsProcessing(true)
      setError(null)
      setResult(null)

      // Создаем контроллер для отмены
      abortControllerRef.current = new AbortController()

      try {
        logInfo("[useEnhancedSubtitleAutomation] Инициализация обработки")
        setProgress({ stage: "initializing", progress: 0 })

        // Определяем операцию на основе опций
        let operation: EnhancedSubtitleInput["operation"] = "auto_generate_from_video"

        if (options.useOCR && !options.useSpeechRecognition) {
          operation = "extract_from_visual_text"
        } else if (options.useSpeechRecognition && !options.useOCR) {
          operation = "generate_from_audio"
        } else if (options.detectMultipleLanguages) {
          operation = "multilingual_detection"
        } else if (options.includeSpeakerLabels) {
          operation = "speaker_identification"
        }

        const input: EnhancedSubtitleInput = {
          operation,
          clipId,
          language: options.language,
          outputLanguages: options.outputLanguages,

          // AI настройки
          useSpeechRecognition: options.useSpeechRecognition ?? true,
          useOCR: options.useOCR ?? true,
          useSceneAnalysis: options.useSceneAnalysis ?? true,
          usePersonIdentification: options.usePersonIdentification ?? false,

          // Обработка текста
          autoCorrectGrammar: options.autoCorrectGrammar ?? true,
          autoCapitalization: options.autoCapitalization ?? true,
          removeFiller: options.removeFiller ?? false,
          optimizeReading: options.optimizeReading ?? true,

          // Стилизация
          includeEmotionalCues: options.includeEmotionalCues ?? false,
          includeSpeakerLabels: options.includeSpeakerLabels ?? false,
          includeSceneDescriptions: options.includeSceneDescriptions ?? false,
          styleTemplate: options.styleTemplate ?? "standard",

          // Параметры качества
          confidenceThreshold: options.confidenceThreshold ?? 0.7,
          maxSubtitleLength: options.maxSubtitleLength ?? 80,
          minSubtitleDuration: options.minSubtitleDuration ?? 1000,
          maxSubtitleDuration: options.maxSubtitleDuration ?? 6000,

          aiProvider: options.aiProvider ?? "unified",
        }

        // Симуляция прогресса для разных этапов
        setProgress({ stage: "analyzing", progress: 10 })
        await new Promise((resolve) => setTimeout(resolve, 500))

        if (input.useSpeechRecognition) {
          setProgress({ stage: "speech_recognition", progress: 25 })
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        if (input.useOCR) {
          setProgress({ stage: "ocr", progress: 50 })
          await new Promise((resolve) => setTimeout(resolve, 800))
        }

        if (input.useSceneAnalysis) {
          setProgress({ stage: "scene_analysis", progress: 70 })
          await new Promise((resolve) => setTimeout(resolve, 600))
        }

        setProgress({ stage: "optimizing", progress: 85 })
        await new Promise((resolve) => setTimeout(resolve, 400))

        // Вызов enhanced subtitle automation
        logInfo("[useEnhancedSubtitleAutomation] Вызов enhanced subtitle automation", { input })
        const toolResult = await enhancedSubtitleAutomation.processEnhancedSubtitles(input, {
          timeout: 300000, // 5 минут
          enableLogging: true,
        })

        if (!toolResult.success) {
          const error = toolResult.errors?.[0] || "Ошибка обработки субтитров"
          logError("[useEnhancedSubtitleAutomation] Ошибка обработки", new Error(error))
          throw new Error(error)
        }

        setProgress({ stage: "finalizing", progress: 95 })
        await new Promise((resolve) => setTimeout(resolve, 200))

        const enhancedResult = toolResult.data!
        setResult(enhancedResult)
        setProgress({ stage: "completed", progress: 100 })

        logInfo("[useEnhancedSubtitleAutomation] Субтитры успешно созданы", {
          count: enhancedResult.subtitles.length,
          confidence: enhancedResult.quality.overallConfidence,
        })

        toast.success(t("subtitles.enhanced.success", "Субтитры созданы"), {
          description: t(
            "subtitles.enhanced.successDesc",
            "Обработано {{count}} субтитров с уверенностью {{confidence}}%",
            {
              count: enhancedResult.subtitles.length,
              confidence: Math.round(enhancedResult.quality.overallConfidence * 100),
            },
          ),
        })

        return enhancedResult
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка"
        logError("[useEnhancedSubtitleAutomation] Критическая ошибка при генерации", err)
        setError(errorMessage)
        setProgress({ stage: "error", progress: 0, message: errorMessage })

        toast.error(t("subtitles.enhanced.error", "Ошибка создания субтитров"), {
          description: errorMessage,
        })

        return null
      } finally {
        setIsProcessing(false)
        abortControllerRef.current = null
        logInfo("[useEnhancedSubtitleAutomation] Обработка завершена")
      }
    },
    [t],
  )

  /**
   * Быстрая генерация субтитров только из видео
   */
  const quickGenerateFromVideo = useCallback(
    async (clipId: string, language?: string): Promise<EnhancedSubtitleResult | null> => {
      logInfo("[useEnhancedSubtitleAutomation] Быстрая генерация субтитров из видео", { clipId, language })
      try {
        const toolResult = await autoGenerateSubtitlesFromVideo(clipId, { language })

        if (toolResult.success) {
          setResult(toolResult.data!)
          logInfo("[useEnhancedSubtitleAutomation] Субтитры успешно сгенерированы", { clipId })
          return toolResult.data!
        }
        const error = toolResult.errors?.[0] || "Ошибка генерации"
        logError("[useEnhancedSubtitleAutomation] Ошибка быстрой генерации", new Error(error))
        setError(error)
        return null
      } catch (err) {
        logError("[useEnhancedSubtitleAutomation] Исключение при быстрой генерации", err)
        throw err
      }
    },
    [],
  )

  /**
   * Извлечение субтитров из текста на экране
   */
  const extractFromScreenText = useCallback(
    async (clipId: string, language?: string): Promise<EnhancedSubtitleResult | null> => {
      logInfo("[useEnhancedSubtitleAutomation] Извлечение субтитров из текста на экране", { clipId, language })
      try {
        const toolResult = await extractSubtitlesFromScreenText(clipId, language)

        if (toolResult.success) {
          setResult(toolResult.data!)
          logInfo("[useEnhancedSubtitleAutomation] Текст успешно извлечен", { clipId })
          return toolResult.data!
        }
        const error = toolResult.errors?.[0] || "Ошибка OCR"
        logError("[useEnhancedSubtitleAutomation] Ошибка извлечения текста", new Error(error))
        setError(error)
        return null
      } catch (err) {
        logError("[useEnhancedSubtitleAutomation] Исключение при извлечении текста", err)
        throw err
      }
    },
    [],
  )

  /**
   * Генерация мультиязычных субтитров
   */
  const generateMultilingual = useCallback(
    async (clipId: string, languages: string[]): Promise<EnhancedSubtitleResult | null> => {
      logInfo("[useEnhancedSubtitleAutomation] Генерация мультиязычных субтитров", { clipId, languages })
      try {
        const toolResult = await generateMultilingualSubtitles(clipId, languages)

        if (toolResult.success) {
          setResult(toolResult.data!)
          logInfo("[useEnhancedSubtitleAutomation] Мультиязычные субтитры созданы", { clipId, count: languages.length })
          return toolResult.data!
        }
        const error = toolResult.errors?.[0] || "Ошибка многоязычной генерации"
        logError("[useEnhancedSubtitleAutomation] Ошибка многоязычной генерации", new Error(error))
        setError(error)
        return null
      } catch (err) {
        logError("[useEnhancedSubtitleAutomation] Исключение при многоязычной генерации", err)
        throw err
      }
    },
    [],
  )

  /**
   * Конвертация EnhancedSubtitleResult в формат для транскрипции
   */
  const convertToTranscriptionResult = useCallback((enhancedResult: EnhancedSubtitleResult): TranscriptionResult => {
    const segments: TranscriptionSegment[] = enhancedResult.subtitles.map((subtitle, index) => ({
      id: index,
      start: subtitle.startTime / 1000, // конвертируем мс в секунды
      end: subtitle.endTime / 1000,
      text: subtitle.text,
      confidence: enhancedResult.quality.overallConfidence,
      // Дополнительная информация
      speaker: subtitle.speaker,
    }))

    return {
      segments,
      language: enhancedResult.processing.detectedLanguages[0] || "ru",
      languageProbability: enhancedResult.quality.languageDetectionAccuracy || 0.9,
      duration: segments[segments.length - 1]?.end || 0,
      text: segments.map((s) => s.text).join(" "),
      processingTime: enhancedResult.processing.totalProcessingTime,
    }
  }, [])

  /**
   * Отмена текущей операции
   */
  const cancel = useCallback(() => {
    logInfo("[useEnhancedSubtitleAutomation] Отмена операции")
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsProcessing(false)
      setProgress({ stage: "initializing", progress: 0 })
      logInfo("[useEnhancedSubtitleAutomation] Операция отменена пользователем")
      toast.info(t("subtitles.enhanced.cancelled", "Операция отменена"))
    }
  }, [t])

  /**
   * Сброс состояния
   */
  const reset = useCallback(() => {
    logInfo("[useEnhancedSubtitleAutomation] Сброс состояния")
    setIsProcessing(false)
    setProgress({ stage: "initializing", progress: 0 })
    setResult(null)
    setError(null)
  }, [])

  return {
    // Состояние
    isProcessing,
    progress,
    result,
    error,

    // Основные методы
    generateEnhancedSubtitles,
    quickGenerateFromVideo,
    extractFromScreenText,
    generateMultilingual,

    // Утилиты
    convertToTranscriptionResult,
    cancel,
    reset,

    // Прямой доступ к enhanced automation tool
    enhancedTool: enhancedSubtitleAutomation,
  }
}

/**
 * Legacy hook for Timeline AI operations.
 *
 * The old TimelineAIService depends on domain-level AI tools and is no longer
 * wired into the feature runtime. Keep this hook as a compatibility surface,
 * but route callers to the active timeline integration instead of importing
 * the legacy domain service.
 */

import { useCallback, useMemo } from "react"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "UseTimelineAi" })
const legacyUnsupportedMessage =
  "Legacy TimelineAIService is disabled. Use useTimelineAIIntegration with AI chat tools instead."

// Заглушка для sendTimelineEvent, пока не реализован useChat
const mockSendTimelineEvent = (event: any) => {
  logger.info("Timeline event:", event)
}

function createUnsupportedResult(operation: TimelineAIOperation): TimelineAIOperationResult {
  return {
    operation,
    success: false,
    message: legacyUnsupportedMessage,
    errors: [legacyUnsupportedMessage],
    warnings: ["useTimelineAI is kept for compatibility only"],
    executionTime: 0,
  }
}

/**
 * Типы Timeline AI операций
 */
export type TimelineAIOperation = "create-timeline" | "analyze-resources" | "execute-command"

/**
 * Результат Timeline AI операции
 */
export interface TimelineAIOperationResult {
  operation: TimelineAIOperation
  success: boolean
  message: string
  data?: any
  errors?: string[]
  warnings?: string[]
  executionTime: number
}

/**
 * Hook для работы с Timeline AI
 */
export function useTimelineAI() {
  const sendTimelineEvent = mockSendTimelineEvent
  /**
   * Создает timeline проект из текстового промпта
   */
  const createTimelineFromPrompt = useCallback(
    async (prompt: string): Promise<TimelineAIOperationResult> => {
      sendTimelineEvent({ type: "CREATE_TIMELINE_FROM_PROMPT", prompt })
      logger.warn(legacyUnsupportedMessage, { operation: "create-timeline" })
      const result = createUnsupportedResult("create-timeline")
      sendTimelineEvent({ type: "TIMELINE_OPERATION_ERROR", error: result.message })
      return result
    },
    [sendTimelineEvent],
  )

  /**
   * Анализирует ресурсы и предлагает улучшения
   */
  const analyzeResources = useCallback(
    async (query: string): Promise<TimelineAIOperationResult> => {
      sendTimelineEvent({ type: "ANALYZE_RESOURCES", query })
      logger.warn(legacyUnsupportedMessage, { operation: "analyze-resources" })
      const result = createUnsupportedResult("analyze-resources")
      sendTimelineEvent({ type: "TIMELINE_OPERATION_ERROR", error: result.message })
      return result
    },
    [sendTimelineEvent],
  )

  /**
   * Выполняет произвольную AI команду
   */
  const executeCommand = useCallback(
    async (command: string, params?: any): Promise<TimelineAIOperationResult> => {
      sendTimelineEvent({ type: "EXECUTE_AI_COMMAND", command, params })
      logger.warn(legacyUnsupportedMessage, { operation: "execute-command" })
      const result = createUnsupportedResult("execute-command")
      sendTimelineEvent({ type: "TIMELINE_OPERATION_ERROR", error: result.message })
      return result
    },
    [sendTimelineEvent],
  )

  /**
   * Инициализирует API ключ для Claude из безопасного хранилища
   * @returns Promise<boolean> - успешность загрузки ключа
   */
  const initializeApiKey = useCallback(async () => {
    logger.warn(legacyUnsupportedMessage, { operation: "initialize-api-key" })
    return false
  }, [])

  /**
   * Устанавливает API ключ для провайдера
   * @param provider Провайдер AI (claude, openai, и т.д.)
   * @param apiKey API ключ
   */
  const setApiKey = useCallback(
    (provider: string, apiKey: string) => {
      logger.warn(legacyUnsupportedMessage, {
        hasApiKey: apiKey.length > 0,
        operation: "set-api-key",
        provider,
      })
    },
    [],
  )

  const timelineAI = useMemo(
    () => ({
      analyzeAndSuggestResources: analyzeResources,
      createTimelineFromPrompt,
      executeCommand,
      initializeApiKey,
      setApiKey,
    }),
    [analyzeResources, createTimelineFromPrompt, executeCommand, initializeApiKey, setApiKey],
  )

  /**
   * Быстрые команды для распространенных операций
   */
  const quickCommands = {
    /**
     * Добавить все видео из браузера в ресурсы
     */
    addAllVideosToResources: () => executeCommand("Добавь все видеофайлы из браузера в ресурсы проекта"),

    /**
     * Создать простой хронологический timeline
     */
    createChronologicalTimeline: () =>
      createTimelineFromPrompt(
        "Создай хронологический timeline из всех доступных видео, упорядочив их по времени создания",
      ),

    /**
     * Проанализировать качество медиа
     */
    analyzeMediaQuality: () => analyzeResources("Проанализируй качество всех медиафайлов и предложи улучшения"),

    /**
     * Создать свадебное видео
     */
    createWeddingVideo: () =>
      createTimelineFromPrompt("Создай свадебное видео из доступных материалов с романтичной музыкой и переходами"),

    /**
     * Создать тревел-видео
     */
    createTravelVideo: () =>
      createTimelineFromPrompt("Создай динамичное тревел-видео с энергичной музыкой и быстрыми переходами"),

    /**
     * Создать корпоративное видео
     */
    createCorporateVideo: () =>
      createTimelineFromPrompt("Создай профессиональное корпоративное видео с титрами и спокойными переходами"),

    /**
     * Применить цветокоррекцию ко всем видео
     */
    applyColorCorrection: () => executeCommand("Примени автоматическую цветокоррекцию ко всем видео в ресурсах"),

    /**
     * Добавить переходы между всеми клипами
     */
    addTransitionsBetweenClips: () => executeCommand("Добавь плавные переходы между всеми клипами на timeline"),

    /**
     * Синхронизировать видео с музыкой
     */
    syncVideoWithMusic: () => executeCommand("Синхронизируй видео клипы с ритмом музыкального сопровождения"),
  }

  return {
    // Основные методы
    createTimelineFromPrompt,
    analyzeResources,
    executeCommand,
    initializeApiKey,
    setApiKey,

    // Быстрые команды
    quickCommands,

    // Утилиты
    timelineAI, // Для прямого доступа к сервису при необходимости
  }
}

/**
 * Hook только для быстрых команд (упрощенный интерфейс)
 */
export function useTimelineAIQuick() {
  const { quickCommands } = useTimelineAI()
  return quickCommands
}

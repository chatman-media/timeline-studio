/**
 * Hook для интеграции AI с Timeline Studio
 *
 * Предоставляет методы для создания timeline проектов,
 * анализа ресурсов и выполнения AI команд
 */

import { useCallback } from "react"
import { TimelineAIService } from "@/domains/ai-services/services/timeline-ai-service"
import { useResources } from "@/features/resources/services/resources-provider"

// Заглушка для sendTimelineEvent, пока не реализован useChat
const mockSendTimelineEvent = (event: any) => {
  console.log("Timeline event:", event)
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
  const resourcesProvider = useResources()

  // Создаем экземпляр TimelineAI сервиса
  // Пока используем заглушки для state machines
  const timelineAI = new TimelineAIService(
    resourcesProvider,
    {}, // browserState - заглушка
    {}, // playerState - заглушка
    {}, // timelineState - заглушка
  )

  /**
   * Создает timeline проект из текстового промпта
   */
  const createTimelineFromPrompt = useCallback(
    async (prompt: string): Promise<TimelineAIOperationResult> => {
      try {
        // Отправляем событие в chat-machine
        sendTimelineEvent({ type: "CREATE_TIMELINE_FROM_PROMPT", prompt })

        // Выполняем операцию через Timeline AI сервис
        const result = await timelineAI.createTimelineFromPrompt(prompt)

        // Уведомляем chat-machine о результате
        if (result.success) {
          sendTimelineEvent({ type: "TIMELINE_OPERATION_SUCCESS", result })
        } else {
          sendTimelineEvent({ type: "TIMELINE_OPERATION_ERROR", error: result.message })
        }

        return {
          operation: "create-timeline",
          success: result.success,
          message: result.message,
          data: result.data,
          errors: result.errors,
          warnings: result.warnings,
          executionTime: result.executionTime,
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка"

        sendTimelineEvent({ type: "TIMELINE_OPERATION_ERROR", error: errorMessage })

        return {
          operation: "create-timeline",
          success: false,
          message: errorMessage,
          errors: [errorMessage],
          executionTime: 0,
        }
      }
    },
    [sendTimelineEvent, timelineAI],
  )

  /**
   * Анализирует ресурсы и предлагает улучшения
   */
  const analyzeResources = useCallback(
    async (query: string): Promise<TimelineAIOperationResult> => {
      try {
        sendTimelineEvent({ type: "ANALYZE_RESOURCES", query })

        const result = await timelineAI.analyzeAndSuggestResources(query)

        if (result.success) {
          sendTimelineEvent({ type: "TIMELINE_OPERATION_SUCCESS", result })
        } else {
          sendTimelineEvent({ type: "TIMELINE_OPERATION_ERROR", error: result.message })
        }

        return {
          operation: "analyze-resources",
          success: result.success,
          message: result.message,
          data: result.data,
          errors: result.errors,
          warnings: result.warnings,
          executionTime: result.executionTime,
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка"

        sendTimelineEvent({ type: "TIMELINE_OPERATION_ERROR", error: errorMessage })

        return {
          operation: "analyze-resources",
          success: false,
          message: errorMessage,
          errors: [errorMessage],
          executionTime: 0,
        }
      }
    },
    [sendTimelineEvent, timelineAI],
  )

  /**
   * Выполняет произвольную AI команду
   */
  const executeCommand = useCallback(
    async (command: string, params?: any): Promise<TimelineAIOperationResult> => {
      try {
        sendTimelineEvent({ type: "EXECUTE_AI_COMMAND", command, params })

        const result = await timelineAI.executeCommand(command, params)

        if (result.success) {
          sendTimelineEvent({ type: "TIMELINE_OPERATION_SUCCESS", result })
        } else {
          sendTimelineEvent({ type: "TIMELINE_OPERATION_ERROR", error: result.message })
        }

        return {
          operation: "execute-command",
          success: result.success,
          message: result.message,
          data: result.data,
          errors: result.errors,
          warnings: result.warnings,
          executionTime: result.executionTime,
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка"

        sendTimelineEvent({ type: "TIMELINE_OPERATION_ERROR", error: errorMessage })

        return {
          operation: "execute-command",
          success: false,
          message: errorMessage,
          errors: [errorMessage],
          executionTime: 0,
        }
      }
    },
    [sendTimelineEvent, timelineAI],
  )

  /**
   * Инициализирует API ключ для Claude из безопасного хранилища
   * @returns Promise<boolean> - успешность загрузки ключа
   */
  const initializeApiKey = useCallback(async () => {
    return await timelineAI.initializeApiKey()
  }, [timelineAI])

  /**
   * Устанавливает API ключ для Claude
   * @param apiKey API ключ
   */
  const setApiKey = useCallback(
    (apiKey: string) => {
      timelineAI.setApiKey(apiKey)
    },
    [timelineAI],
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

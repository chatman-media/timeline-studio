/**
 * Hook для работы с задачами AI анализа видео
 */

import { useCallback, useEffect, useRef, useState } from "react"

import { analysisStorageService } from "@/core/services/analysis-storage-service"
import { formatDurationSeconds } from "@/lib/duration-formatter"
import { createLogger } from "@/lib/tauri-logger"

import { analysisTaskBridge } from "../services/analysis-task-bridge"
import type { AnalysisTask, AnalysisTaskStatus } from "../types/analysis-task"

const logger = createLogger("UseAnalysisTasks")

interface UseAnalysisTasksReturn {
  tasks: AnalysisTask[]
  isLoading: boolean
  error: string | null
  refreshTasks: () => Promise<void>
  getTask: (taskId: string) => Promise<AnalysisTask | null>
  cancelTask: (taskId: string) => Promise<boolean>
  createTask: (videoPath: string, videoName: string) => Promise<AnalysisTask>
  clearHistory: () => Promise<void>
}

/**
 * Hook для работы с задачами AI анализа видео
 *
 * Управляет списком задач анализа, их статусом и прогрессом
 * Автоматически обновляет список каждые 5 секунд
 */
export function useAnalysisTasks(): UseAnalysisTasksReturn {
  const [tasks, setTasks] = useState<AnalysisTask[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isRefreshingRef = useRef(false)

  // Получить список активных задач анализа
  const refreshTasks = useCallback(async () => {
    // Пропускаем запрос, если предыдущий еще выполняется
    if (isRefreshingRef.current) {
      return
    }

    isRefreshingRef.current = true
    void logger.info("Запрос списка задач анализа")

    try {
      setIsLoading(true)
      setError(null)

      // Получаем задачи через AnalysisTaskBridge
      const analysisTasks = await analysisTaskBridge.getActiveTasks()

      setTasks(analysisTasks)
      void logger.info("Список задач анализа получен успешно", {
        tasksCount: analysisTasks.length,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      void logger.error("Ошибка получения списка задач анализа", { error: err })
      setError(errorMessage)
      setTasks([])
    } finally {
      setIsLoading(false)
      isRefreshingRef.current = false
    }
  }, [])

  // Получить конкретную задачу по ID
  const getTask = useCallback(async (taskId: string): Promise<AnalysisTask | null> => {
    void logger.info("Запрос задачи анализа по ID", { taskId })

    try {
      const task = await analysisTaskBridge.getTask(taskId)

      if (task) {
        void logger.info("Задача анализа получена успешно", {
          taskId,
          status: task.status,
        })
      } else {
        void logger.info("Задача анализа не найдена", { taskId })
      }
      return task
    } catch (err) {
      void logger.error("Ошибка получения задачи анализа", { error: err })
      return null
    }
  }, [])

  // Создать новую задачу анализа
  const createTask = useCallback(
    async (videoPath: string, videoName: string): Promise<AnalysisTask> => {
      void logger.info("Создание задачи анализа", { videoPath, videoName })

      try {
        // Запускаем анализ через bridge
        const taskId = await analysisTaskBridge.startAnalysis(videoPath)

        // Получаем созданную задачу
        const task = await analysisTaskBridge.getTask(taskId)
        if (!task) {
          throw new Error("Failed to retrieve created task")
        }

        await refreshTasks()

        void logger.info("Задача анализа создана успешно", { taskId })

        return task
      } catch (err) {
        void logger.error("Ошибка создания задачи анализа", { error: err })
        throw err
      }
    },
    [refreshTasks],
  )

  // Отменить задачу
  const cancelTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      void logger.info("Отмена задачи анализа", { taskId })

      try {
        const success = await analysisTaskBridge.cancelTask(taskId)

        if (success) {
          void logger.info("Задача анализа отменена успешно", { taskId })
          await refreshTasks()
        } else {
          void logger.warn("Не удалось отменить задачу анализа", { taskId })
        }

        return success
      } catch (err) {
        void logger.error("Ошибка отмены задачи анализа", { error: err })
        return false
      }
    },
    [refreshTasks],
  )

  // Очистка истории анализов
  const clearHistory = useCallback(async () => {
    void logger.info("Очистка истории анализов")
    try {
      await analysisStorageService.clearAll()
      analysisTaskBridge.clearCache()
      setTasks([])
      void logger.info("История анализов очищена")
    } catch (err) {
      void logger.error("Ошибка очистки истории", { error: err })
    }
  }, [])

  // Автоматическое обновление списка задач и подписка на прогресс
  useEffect(() => {
    void logger.info("Инициализация useAnalysisTasks хука")
    void refreshTasks()

    // Подписываемся на события прогресса
    const unsubscribe = analysisTaskBridge.subscribeToProgress((updatedTask) => {
      void logger.debug("Получено обновление прогресса задачи", {
        taskId: updatedTask.id,
        status: updatedTask.status,
        progress: updatedTask.progress.percentage,
      })

      setTasks((prevTasks) => {
        const index = prevTasks.findIndex((t) => t.id === updatedTask.id)
        if (index !== -1) {
          // Обновляем существующую задачу
          const newTasks = [...prevTasks]
          newTasks[index] = updatedTask
          void logger.debug("Задача обновлена в списке", { taskId: updatedTask.id, index })
          return newTasks
        }
        // Добавляем новую задачу
        void logger.debug("Новая задача добавлена в список", { taskId: updatedTask.id })
        return [...prevTasks, updatedTask]
      })
    })

    // Обновляем список каждые 5 секунд для синхронизации
    // (события прогресса уже обновляют список в реальном времени, но для надежности делаем polling)
    const interval = setInterval(() => {
      void logger.debug("Polling обновление списка задач")
      void refreshTasks()
    }, 5000) // Уменьшено с 30s до 5s для более быстрой реакции

    return () => {
      void logger.info("Размонтирование useAnalysisTasks хука")
      unsubscribe()
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    tasks,
    isLoading,
    error,
    refreshTasks,
    getTask,
    cancelTask,
    createTask,
    clearHistory,
  }
}

/**
 * Получить локализованный статус задачи
 */
export function getAnalysisTaskStatusLabel(status: AnalysisTaskStatus, t: (key: string) => string): string {
  switch (status) {
    case "pending":
      return t("montagePlanner.status.pending")
    case "initializing":
      return t("montagePlanner.status.initializing")
    case "analyzing_video":
      return t("montagePlanner.status.analyzingVideo")
    case "analyzing_audio":
      return t("montagePlanner.status.analyzingAudio")
    case "detecting_moments":
      return t("montagePlanner.status.detectingMoments")
    case "generating_plan":
      return t("montagePlanner.status.generatingPlan")
    case "completed":
      return t("montagePlanner.status.completed")
    case "failed":
      return t("montagePlanner.status.failed")
    case "cancelled":
      return t("montagePlanner.status.cancelled")
    default:
      return t("montagePlanner.status.unknown")
  }
}

/**
 * Получить цвет для статуса задачи
 */
export function getAnalysisTaskStatusColor(status: AnalysisTaskStatus): string {
  switch (status) {
    case "pending":
      return "text-gray-600 dark:text-gray-400"
    case "initializing":
      return "text-yellow-600 dark:text-yellow-400"
    case "analyzing_video":
    case "analyzing_audio":
    case "detecting_moments":
    case "generating_plan":
      return "text-blue-600 dark:text-blue-400"
    case "completed":
      return "text-green-600 dark:text-green-400"
    case "failed":
      return "text-red-600 dark:text-red-400"
    case "cancelled":
      return "text-gray-600 dark:text-gray-400"
    default:
      return "text-gray-500"
  }
}

/**
 * Форматировать время задачи
 */
export function formatAnalysisTaskDuration(startTime: string, endTime?: string, t?: (key: string) => string): string {
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : Date.now()
  const duration = Math.floor((end - start) / 1000)

  if (duration < 60) {
    return t ? t("montagePlanner.duration.seconds").replace("{{count}}", duration.toString()) : `${duration} sec`
  }
  // Используем стандартный форматер для остальных случаев
  return formatDurationSeconds(duration)
}

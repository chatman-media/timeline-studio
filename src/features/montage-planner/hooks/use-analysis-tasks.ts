/**
 * Hook для работы с задачами AI анализа видео
 */

import { useCallback, useEffect, useRef, useState } from "react"

import { formatDurationSeconds } from "@/lib/duration-formatter"
import { createLogger } from "@/lib/tauri-logger"

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

      // TODO: Заменить на реальный backend вызов
      // Пока используем mock данные из localStorage
      const storedTasks = localStorage.getItem("analysis-tasks")
      const analysisTasks: AnalysisTask[] = storedTasks ? JSON.parse(storedTasks) : []

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
  const getTask = useCallback(
    async (taskId: string): Promise<AnalysisTask | null> => {
      void logger.info("Запрос задачи анализа по ID", { taskId })

      try {
        const storedTasks = localStorage.getItem("analysis-tasks")
        const analysisTasks: AnalysisTask[] = storedTasks ? JSON.parse(storedTasks) : []
        const task = analysisTasks.find((t) => t.id === taskId)

        if (task) {
          void logger.info("Задача анализа получена успешно", {
            taskId,
            status: task.status,
          })
        } else {
          void logger.info("Задача анализа не найдена", { taskId })
        }
        return task || null
      } catch (err) {
        void logger.error("Ошибка получения задачи анализа", { error: err })
        return null
      }
    },
    [],
  )

  // Создать новую задачу анализа
  const createTask = useCallback(
    async (videoPath: string, videoName: string): Promise<AnalysisTask> => {
      void logger.info("Создание задачи анализа", { videoPath, videoName })

      try {
        const newTask: AnalysisTask = {
          id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          video_path: videoPath,
          video_name: videoName,
          status: "pending" as AnalysisTaskStatus,
          created_at: new Date().toISOString(),
          progress: {
            percentage: 0,
            phase: "initializing",
          },
        }

        // TODO: Заменить на реальный backend вызов
        const storedTasks = localStorage.getItem("analysis-tasks")
        const analysisTasks: AnalysisTask[] = storedTasks ? JSON.parse(storedTasks) : []
        analysisTasks.push(newTask)
        localStorage.setItem("analysis-tasks", JSON.stringify(analysisTasks))

        await refreshTasks()

        void logger.info("Задача анализа создана успешно", {
          taskId: newTask.id,
        })

        return newTask
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
        // TODO: Заменить на реальный backend вызов
        const storedTasks = localStorage.getItem("analysis-tasks")
        const analysisTasks: AnalysisTask[] = storedTasks ? JSON.parse(storedTasks) : []

        const taskIndex = analysisTasks.findIndex((t) => t.id === taskId)
        if (taskIndex !== -1) {
          analysisTasks[taskIndex].status = "cancelled" as AnalysisTaskStatus
          analysisTasks[taskIndex].completed_at = new Date().toISOString()
          localStorage.setItem("analysis-tasks", JSON.stringify(analysisTasks))

          void logger.info("Задача анализа отменена успешно", { taskId })
          await refreshTasks()
          return true
        }

        void logger.warn("Задача анализа не найдена", { taskId })
        return false
      } catch (err) {
        void logger.error("Ошибка отмены задачи анализа", { error: err })
        return false
      }
    },
    [refreshTasks],
  )

  // Автоматическое обновление списка задач
  useEffect(() => {
    void logger.info("Инициализация useAnalysisTasks хука")
    void refreshTasks()

    // Обновляем список каждые 5 секунд
    const interval = setInterval(() => {
      void refreshTasks()
    }, 5000)

    return () => {
      void logger.info("Размонтирование useAnalysisTasks хука")
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
export function formatAnalysisTaskDuration(
  startTime: string,
  endTime?: string,
  t?: (key: string) => string,
): string {
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : Date.now()
  const duration = Math.floor((end - start) / 1000)

  if (duration < 60) {
    return t ? t("montagePlanner.duration.seconds").replace("{{count}}", duration.toString()) : `${duration} sec`
  }
  // Используем стандартный форматер для остальных случаев
  return formatDurationSeconds(duration)
}

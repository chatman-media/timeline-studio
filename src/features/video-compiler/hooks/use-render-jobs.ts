import { useCallback, useEffect, useRef, useState } from "react"

import { videoCompilerRenderService } from "@/domains/video-editing/services/video-compiler-render-service"
import { formatDurationSeconds } from "@/lib/duration-formatter"
import { createLogger } from "@/lib/tauri-logger"

import { type VideoRenderJob as RenderJob, RenderStatus } from "../types/render"

const logger = createLogger("UseRenderJobs")

interface UseRenderJobsReturn {
  jobs: RenderJob[]
  isLoading: boolean
  error: string | null
  refreshJobs: () => Promise<void>
  getJob: (jobId: string) => Promise<RenderJob | null>
  cancelJob: (jobId: string) => Promise<boolean>
}

export function useRenderJobs(): UseRenderJobsReturn {
  const [jobs, setJobs] = useState<RenderJob[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isRefreshingRef = useRef(false)

  // Получить список активных задач
  const refreshJobs = useCallback(async () => {
    // Пропускаем запрос, если предыдущий еще выполняется
    if (isRefreshingRef.current) {
      return
    }

    isRefreshingRef.current = true
    void logger.info("Запрос списка активных задач")

    try {
      setIsLoading(true)
      setError(null)
      const activeJobs = await videoCompilerRenderService.getActiveJobs()
      setJobs(activeJobs as RenderJob[])
      void logger.info("Список активных задач получен успешно", { jobsCount: activeJobs.length })
    } catch (err) {
      void logger.error("Ошибка получения списка активных задач", { error: err })
      setError(err instanceof Error ? err.message : "Не удалось получить список задач")
    } finally {
      setIsLoading(false)
      isRefreshingRef.current = false
    }
  }, [])

  // Получить конкретную задачу по ID
  const getJob = useCallback(async (jobId: string): Promise<RenderJob | null> => {
    void logger.info("Запрос задачи по ID", { jobId })

    try {
      const job = await videoCompilerRenderService.getRenderJob(jobId)
      if (job) {
        void logger.info("Задача получена успешно", { jobId, status: job.status })
      } else {
        void logger.info("Задача не найдена", { jobId })
      }
      return job
    } catch (err) {
      void logger.error("Ошибка получения задачи", { error: err })
      return null
    }
  }, [])

  // Отменить задачу
  const cancelJob = useCallback(
    async (jobId: string): Promise<boolean> => {
      void logger.info("Отмена задачи", { jobId })

      try {
        const success = await videoCompilerRenderService.cancelRender(jobId)
        if (success) {
          void logger.info("Задача отменена успешно", { jobId })
          // Обновляем список после отмены
          await refreshJobs()
        } else {
          void logger.error("Не удалось отменить задачу", { jobId })
        }
        return success
      } catch (err) {
        void logger.error("Ошибка отмены задачи", { error: err })
        return false
      }
    },
    [refreshJobs],
  )

  // Автоматическое обновление списка задач
  useEffect(() => {
    void logger.info("Инициализация useRenderJobs хука")
    void refreshJobs()

    // Обновляем список каждые 5 секунд (увеличено с 2 для снижения нагрузки)
    const interval = setInterval(() => {
      void refreshJobs()
    }, 5000)

    return () => {
      void logger.info("Размонтирование useRenderJobs хука")
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    jobs,
    isLoading,
    error,
    refreshJobs,
    getJob,
    cancelJob,
  }
}

// Вспомогательные функции для работы с задачами

export function getJobStatusLabel(status: RenderStatus, t: (key: string) => string): string {
  switch (status) {
    case RenderStatus.Pending:
      return t("videoCompiler.status.pending")
    case RenderStatus.Processing:
      return t("videoCompiler.status.processing")
    case RenderStatus.Completed:
      return t("videoCompiler.status.completed")
    case RenderStatus.Failed:
      return t("videoCompiler.status.failed")
    case RenderStatus.Cancelled:
      return t("videoCompiler.status.cancelled")
    default:
      return t("videoCompiler.status.unknown")
  }
}

export function getJobStatusColor(status: RenderStatus): string {
  switch (status) {
    case RenderStatus.Pending:
      return "text-yellow-600 dark:text-yellow-400"
    case RenderStatus.Processing:
      return "text-blue-600 dark:text-blue-400"
    case RenderStatus.Completed:
      return "text-green-600 dark:text-green-400"
    case RenderStatus.Failed:
      return "text-red-600 dark:text-red-400"
    case RenderStatus.Cancelled:
      return "text-gray-600 dark:text-gray-400"
    default:
      return "text-gray-500"
  }
}

export function formatJobDuration(startTime: string, endTime?: string, t?: (key: string) => string): string {
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : Date.now()
  const duration = Math.floor((end - start) / 1000)

  if (duration < 60) {
    return t ? t("videoCompiler.duration.seconds").replace("{{count}}", duration.toString()) : `${duration} sec`
  }
  // Используем стандартный форматер для остальных случаев
  return formatDurationSeconds(duration)
}

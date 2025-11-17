import { invoke } from "@tauri-apps/api/core"
import { useCallback, useEffect, useRef, useState } from "react"

import { createLogger } from "@/lib/tauri-logger"

import { PublicationPlatform, PublicationStatus, type PublicationTask } from "../types/publication"

const logger = createLogger("UsePublicationTasks")

const YOUTUBE_PLUGIN_ID = "youtube-uploader"

interface UsePublicationTasksReturn {
  tasks: PublicationTask[]
  isLoading: boolean
  error: string | null
  refreshTasks: () => Promise<void>
  getTask: (taskId: string) => Promise<PublicationTask | null>
  cancelTask: (taskId: string) => Promise<boolean>
}

/**
 * Hook для работы с задачами публикации
 *
 * Использует plugin систему для взаимодействия с YouTube uploader и другими платформами
 */
export function usePublicationTasks(): UsePublicationTasksReturn {
  const [tasks, setTasks] = useState<PublicationTask[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isRefreshingRef = useRef(false)
  const pluginUnavailableRef = useRef(false)

  // Получить список активных задач публикации
  const refreshTasks = useCallback(async () => {
    // Пропускаем запрос, если предыдущий еще выполняется
    if (isRefreshingRef.current) {
      return
    }

    // Пропускаем запрос, если плагин недоступен
    if (pluginUnavailableRef.current) {
      return
    }

    isRefreshingRef.current = true
    void logger.info("Запрос списка задач публикации")

    try {
      setIsLoading(true)
      setError(null)

      // Вызываем команду plugin через send_plugin_command
      const response = await invoke<{
        command_id: string
        success: boolean
        data?: { uploads: Array<any> }
        error?: string
      }>("send_plugin_command", {
        pluginId: YOUTUBE_PLUGIN_ID,
        command: "list_uploads",
        params: {},
      })

      if (response.success && response.data?.uploads) {
        // Преобразуем формат plugin в наш тип PublicationTask
        const publicationTasks: PublicationTask[] = response.data.uploads.map((upload: any) => ({
          id: upload.upload_id,
          platform: PublicationPlatform.YouTube,
          project_name: "", // TODO: Получать из контекста
          video_path: "", // TODO: Получать из upload
          title: "", // TODO: Получать из upload settings
          status: mapUploadStatusToPublicationStatus(upload.status),
          progress: upload.progress
            ? {
                percentage: upload.progress,
                stage: upload.status,
                uploaded_bytes: 0, // TODO: Получать из plugin
                total_bytes: 0, // TODO: Получать из plugin
              }
            : undefined,
          created_at: new Date().toISOString(), // TODO: Получать из plugin
          video_url: upload.video_url,
        }))

        setTasks(publicationTasks)
        void logger.info("Список задач публикации получен успешно", {
          tasksCount: publicationTasks.length,
        })
      } else {
        throw new Error(response.error || "Failed to get uploads list")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)

      // Проверяем, является ли это ошибкой отсутствия плагина
      if (errorMessage.includes("is not loaded") || errorMessage.includes("Plugin")) {
        // Плагин недоступен - больше не пытаемся его вызывать
        pluginUnavailableRef.current = true
        void logger.info("YouTube Uploader плагин недоступен, публикация отключена")
        // Не устанавливаем error, просто оставляем пустой список
        setTasks([])
      } else {
        // Другая ошибка - логируем и показываем пользователю
        void logger.error("Ошибка получения списка задач публикации", { error: err })
        setError(errorMessage)
        setTasks([])
      }
    } finally {
      setIsLoading(false)
      isRefreshingRef.current = false
    }
  }, [])

  // Получить конкретную задачу по ID
  const getTask = useCallback(async (taskId: string): Promise<PublicationTask | null> => {
    // Если плагин недоступен, возвращаем null
    if (pluginUnavailableRef.current) {
      return null
    }

    void logger.info("Запрос задачи публикации по ID", { taskId })

    try {
      const response = await invoke<{
        command_id: string
        success: boolean
        data?: any
        error?: string
      }>("send_plugin_command", {
        pluginId: YOUTUBE_PLUGIN_ID,
        command: "get_status",
        params: { upload_id: taskId },
      })

      if (response.success && response.data) {
        const upload = response.data
        const task: PublicationTask = {
          id: upload.upload_id,
          platform: PublicationPlatform.YouTube,
          project_name: "",
          video_path: "",
          title: "",
          status: mapUploadStatusToPublicationStatus(upload.status),
          progress: upload.progress
            ? {
                percentage: upload.progress,
                stage: upload.status,
                uploaded_bytes: 0,
                total_bytes: 0,
              }
            : undefined,
          created_at: new Date().toISOString(),
          video_url: upload.video_url,
        }

        void logger.info("Задача публикации получена успешно", { taskId, status: task.status })
        return task
      }

      void logger.info("Задача публикации не найдена", { taskId })
      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (errorMessage.includes("is not loaded") || errorMessage.includes("Plugin")) {
        pluginUnavailableRef.current = true
        void logger.info("YouTube Uploader плагин недоступен")
      } else {
        void logger.error("Ошибка получения задачи публикации", { error: err })
      }
      return null
    }
  }, [])

  // Отменить задачу
  const cancelTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      // Если плагин недоступен, возвращаем false
      if (pluginUnavailableRef.current) {
        return false
      }

      void logger.info("Отмена задачи публикации", { taskId })

      try {
        // TODO: Добавить команду cancel в plugin
        void logger.warn("Отмена задач публикации пока не реализована")

        // Обновляем список после попытки отмены
        await refreshTasks()
        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        if (errorMessage.includes("is not loaded") || errorMessage.includes("Plugin")) {
          pluginUnavailableRef.current = true
          void logger.info("YouTube Uploader плагин недоступен")
        } else {
          void logger.error("Ошибка отмены задачи публикации", { error: err })
        }
        return false
      }
    },
    [refreshTasks],
  )

  // Автоматическое обновление списка задач
  useEffect(() => {
    void logger.info("Инициализация usePublicationTasks хука")
    void refreshTasks()

    // Обновляем список каждые 5 секунд
    const interval = setInterval(() => {
      void refreshTasks()
    }, 5000)

    return () => {
      void logger.info("Размонтирование usePublicationTasks хука")
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
  }
}

/**
 * Маппинг статуса загрузки plugin в статус публикации
 */
function mapUploadStatusToPublicationStatus(pluginStatus: string): PublicationStatus {
  switch (pluginStatus.toLowerCase()) {
    case "preparing":
      return PublicationStatus.Preparing
    case "uploading":
      return PublicationStatus.Uploading
    case "processing":
      return PublicationStatus.Processing
    case "completed":
      return PublicationStatus.Completed
    case "failed":
      return PublicationStatus.Failed
    default:
      return PublicationStatus.Preparing
  }
}

/**
 * Получить локализованный статус
 */
export function getPublicationStatusLabel(status: PublicationStatus, t: (key: string) => string): string {
  switch (status) {
    case PublicationStatus.Preparing:
      return t("publication.status.preparing")
    case PublicationStatus.Uploading:
      return t("publication.status.uploading")
    case PublicationStatus.Processing:
      return t("publication.status.processing")
    case PublicationStatus.Completed:
      return t("publication.status.completed")
    case PublicationStatus.Failed:
      return t("publication.status.failed")
    case PublicationStatus.Cancelled:
      return t("publication.status.cancelled")
    default:
      return t("publication.status.unknown")
  }
}

/**
 * Получить цвет для статуса
 */
export function getPublicationStatusColor(status: PublicationStatus): string {
  switch (status) {
    case PublicationStatus.Preparing:
      return "text-yellow-600 dark:text-yellow-400"
    case PublicationStatus.Uploading:
      return "text-blue-600 dark:text-blue-400"
    case PublicationStatus.Processing:
      return "text-purple-600 dark:text-purple-400"
    case PublicationStatus.Completed:
      return "text-green-600 dark:text-green-400"
    case PublicationStatus.Failed:
      return "text-red-600 dark:text-red-400"
    case PublicationStatus.Cancelled:
      return "text-gray-600 dark:text-gray-400"
    default:
      return "text-gray-500"
  }
}

/**
 * Форматировать время публикации
 */
export function formatPublicationDuration(startTime: string, endTime?: string, t?: (key: string) => string): string {
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : Date.now()
  const duration = Math.floor((end - start) / 1000)

  if (duration < 60) {
    return t ? t("publication.duration.seconds").replace("{{count}}", duration.toString()) : `${duration} sec`
  }
  if (duration < 3600) {
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }
  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  return `${hours}:${minutes.toString().padStart(2, "0")}:${(duration % 60).toString().padStart(2, "0")}`
}

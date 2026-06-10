import { container } from "@timeline-studio/core"
import { useRenderQueue as useCoreRenderQueue, useProjectLoader } from "@timeline-studio/core/hooks"
import type { ProjectSchema, RenderJob } from "@timeline-studio/core/types"
import { OutputFormat } from "@timeline-studio/core/types"
import { useCallback, useEffect, useMemo, useState } from "react"
import { calculateAspectRatio } from "@/features/project-settings/utils/aspect-ratio-utils"
import { createLogger, logError, logInfo } from "@/lib/tauri-logger"

const logger = createLogger({ module: "UseRenderQueue" })

function calculateProjectDuration(projectFile: any): number {
  try {
    // Пытаемся получить длительность из project.duration
    if (projectFile.project?.duration) {
      return projectFile.project.duration
    }

    // Если нет duration, вычисляем из секций
    if (projectFile.project?.sections) {
      const maxEndTime = Math.max(...projectFile.project.sections.map((s: any) => s.endTime || 0))
      if (maxEndTime > 0) return maxEndTime
    }

    // Если нет секций, пытаемся вычислить из timeline
    if (projectFile.timeline?.duration) {
      return projectFile.timeline.duration
    }

    // Fallback - стандартная длительность
    return 30
  } catch (error) {
    logger.warn(`Failed to calculate project duration: ${String(error)}`)
    return 30
  }
}

interface UseRenderQueueReturn {
  // Состояние очереди
  renderJobs: RenderJob[]
  isProcessing: boolean
  activeJobsCount: number

  // Методы управления
  addProjectsToQueue: () => Promise<string[]>
  startRenderQueue: (projects: Array<{ path: string; outputPath: string }>) => Promise<void>
  cancelJob: (jobId: string) => Promise<void>
  cancelAllJobs: () => Promise<void>
  clearCompleted: () => void

  // Обновление очереди
  refreshQueue: () => Promise<void>
}

export function useRenderQueue(): UseRenderQueueReturn {
  logInfo("[useRenderQueue] Инициализация хука")

  const [renderJobs, setRenderJobs] = useState<RenderJob[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const platform = useMemo(() => {
    try {
      return container.hasPlatform() ? container.getPlatform() : null
    } catch {
      return null
    }
  }, [])
  const { loadProject } = useProjectLoader()
  const { renderProject, cancelRender, getActiveJobs } = useCoreRenderQueue()

  // Обновление списка задач
  const refreshQueue = useCallback(async () => {
    try {
      const jobs = (await getActiveJobs()) as RenderJob[]
      setRenderJobs(jobs)

      // Проверяем, есть ли активные задачи
      const hasActiveJobs = jobs.some(
        (job) => (job.status as any) === "Processing" || (job.status as any) === "Pending",
      )
      setIsProcessing(hasActiveJobs)
    } catch (error) {
      logError(`[useRenderQueue] Ошибка получения задач рендеринга: ${String(error)}`)
    }
  }, [getActiveJobs])

  // Загрузка активных задач при монтировании
  useEffect(() => {
    void refreshQueue()

    // Обновляем каждые 500ms пока идет рендеринг
    const interval = setInterval(() => {
      if (isProcessing) {
        void refreshQueue()
      }
    }, 500)

    return () => clearInterval(interval)
  }, [isProcessing, refreshQueue])

  // Добавление проектов в очередь (выбор файлов)
  const addProjectsToQueue = useCallback(async (): Promise<string[]> => {
    try {
      if (!platform) {
        logError("[useRenderQueue] Platform service not available")
        return []
      }

      const selected = await platform.showOpenDialog({
        multiple: true,
        filters: [
          {
            name: "Timeline Studio Projects",
            extensions: ["tls", "json"],
          },
        ],
        title: "Select Projects to Export",
      })

      if (!selected) return []

      return selected
    } catch (error) {
      logError(`[useRenderQueue] Ошибка выбора проектов: ${String(error)}`)
      return []
    }
  }, [platform])

  // Запуск рендеринга для списка проектов
  const startRenderQueue = useCallback(
    async (projects: Array<{ path: string; outputPath: string }>) => {
      try {
        // Загружаем и запускаем рендеринг для каждого проекта
        for (const project of projects) {
          try {
            // Загружаем проект из файла
            const projectFile = await loadProject(project.path)

            // Создаем схему проекта из реальных данных timeline
            const resolution = projectFile.settings.resolution.split("x").map(Number) as [number, number]
            const aspectRatio = calculateAspectRatio(resolution[0], resolution[1])
            const totalDuration = calculateProjectDuration(projectFile)

            const projectSchema: ProjectSchema = {
              version: "1.0.0",
              metadata: {
                name: project.path.split("/").pop()?.replace(".tls", "") || "Untitled",
                created_at: new Date().toISOString(),
                modified_at: new Date().toISOString(),
              },
              timeline: {
                duration: totalDuration,
                fps: Number.parseInt(projectFile.settings.frameRate, 10) || 30,
                resolution: resolution,
                sample_rate: 48000,
                aspect_ratio: aspectRatio,
              },
              tracks: [],
              effects: [],
              transitions: [],
              filters: [],
              templates: [],
              style_templates: [],
              subtitles: [],
              settings: {
                export: {
                  format: OutputFormat.Mp4,
                  quality: 85,
                  video_bitrate: 8000,
                  audio_bitrate: 192,
                  hardware_acceleration: true,
                  ffmpeg_args: [],
                },
                preview: {
                  resolution: [1280, 720],
                  fps: 30,
                  quality: 75,
                },
                custom: {},
              },
            }

            // Запускаем рендеринг
            const jobId = await renderProject(projectSchema, project.outputPath)

            logInfo(`[useRenderQueue] Запущена задача рендеринга: ${jobId} для ${project.path}`)
          } catch (error) {
            logError(`[useRenderQueue] Ошибка запуска рендеринга для ${project.path}: ${String(error)}`)
          }
        }

        // Обновляем список задач
        await refreshQueue()
      } catch (error) {
        logError(`[useRenderQueue] Ошибка запуска очереди рендеринга: ${String(error)}`)
      }
    },
    [refreshQueue],
  )

  // Отмена конкретной задачи
  const cancelJob = useCallback(
    async (jobId: string) => {
      try {
        const success = await cancelRender(jobId)
        if (success) {
          await refreshQueue()
        }
      } catch (error) {
        logError(`[useRenderQueue] Ошибка отмены задачи ${jobId}: ${String(error)}`)
      }
    },
    [cancelRender, refreshQueue],
  )

  // Отмена всех активных задач
  const cancelAllJobs = useCallback(async () => {
    const activeJobs = renderJobs.filter(
      (job) => (job.status as any) === "Processing" || (job.status as any) === "Pending",
    )

    for (const job of activeJobs) {
      await cancelJob(job.id)
    }
  }, [renderJobs, cancelJob])

  // Очистка завершенных задач
  const clearCompleted = useCallback(() => {
    setRenderJobs((prev) =>
      prev.filter((job) => (job.status as any) === "Processing" || (job.status as any) === "Pending"),
    )
  }, [])

  const activeJobsCount = renderJobs.filter(
    (job) => (job.status as any) === "Processing" || (job.status as any) === "Pending",
  ).length

  return {
    renderJobs,
    isProcessing,
    activeJobsCount,
    addProjectsToQueue,
    startRenderQueue,
    cancelJob,
    cancelAllJobs,
    clearCompleted,
    refreshQueue,
  }
}

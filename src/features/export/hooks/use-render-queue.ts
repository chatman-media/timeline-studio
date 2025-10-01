import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"
import { useCallback, useEffect, useState } from "react"
import { OutputFormat, ProjectSchema, RenderJob, RenderStatus } from "@/domains/video-editing"
import { loadProject } from "@/features/app-state/services/project-file-service"
import { calculateAspectRatio } from "@/features/project-settings/utils/aspect-ratio-utils"

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
    console.warn("Failed to calculate project duration:", error)
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
  const [renderJobs, setRenderJobs] = useState<RenderJob[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

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
  }, [isProcessing])

  // Обновление списка задач
  const refreshQueue = useCallback(async () => {
    try {
      const jobs = await invoke<RenderJob[]>("get_active_jobs")
      setRenderJobs(jobs)

      // Проверяем, есть ли активные задачи
      const hasActiveJobs = jobs.some(
        (job) => job.status === RenderStatus.Processing || job.status === RenderStatus.Pending,
      )
      setIsProcessing(hasActiveJobs)
    } catch (error) {
      console.error("Failed to get render jobs:", error)
    }
  }, [])

  // Добавление проектов в очередь (выбор файлов)
  const addProjectsToQueue = useCallback(async (): Promise<string[]> => {
    try {
      const selected = await open({
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

      // Возвращаем массив путей
      if (Array.isArray(selected)) {
        return selected
      }
      return [selected]
    } catch (error) {
      console.error("Failed to select projects:", error)
      return []
    }
  }, [])

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
                fps: Number.parseInt(projectFile.settings.frameRate) || 30,
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
            const jobId = await invoke<string>("compile_video", {
              projectSchema: projectSchema,
              outputPath: project.outputPath,
            })

            console.log(`Started render job: ${jobId} for ${project.path}`)
          } catch (error) {
            console.error(`Failed to start render for ${project.path}:`, error)
          }
        }

        // Обновляем список задач
        await refreshQueue()
      } catch (error) {
        console.error("Failed to start render queue:", error)
      }
    },
    [refreshQueue],
  )

  // Отмена конкретной задачи
  const cancelJob = useCallback(
    async (jobId: string) => {
      try {
        const success = await invoke<boolean>("cancel_render", { jobId })
        if (success) {
          await refreshQueue()
        }
      } catch (error) {
        console.error(`Failed to cancel job ${jobId}:`, error)
      }
    },
    [refreshQueue],
  )

  // Отмена всех активных задач
  const cancelAllJobs = useCallback(async () => {
    const activeJobs = renderJobs.filter(
      (job) => job.status === RenderStatus.Processing || job.status === RenderStatus.Pending,
    )

    for (const job of activeJobs) {
      await cancelJob(job.id)
    }
  }, [renderJobs, cancelJob])

  // Очистка завершенных задач
  const clearCompleted = useCallback(() => {
    setRenderJobs((prev) =>
      prev.filter((job) => job.status === RenderStatus.Processing || job.status === RenderStatus.Pending),
    )
  }, [])

  const activeJobsCount = renderJobs.filter(
    (job) => job.status === RenderStatus.Processing || job.status === RenderStatus.Pending,
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

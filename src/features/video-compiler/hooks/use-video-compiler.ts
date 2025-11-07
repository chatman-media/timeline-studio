import { invoke } from "@tauri-apps/api/core"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ProjectSchema } from "@/domains/video-editing/types/video-compiler"
import { logError, logInfo } from "@/lib/tauri-logger"
import { renderProject, trackRenderProgress } from "../services/video-compiler-service"
import type { RenderProgress, VideoRenderJob } from "../types/render"
import { RenderStatus } from "../types/render"

interface UseVideoCompilerReturn {
  // Состояние
  isRendering: boolean
  renderProgress: RenderProgress | null
  activeJobs: VideoRenderJob[]

  // Методы
  startRender: (project: ProjectSchema, outputPath: string) => Promise<string>
  cancelRender: (jobId: string) => Promise<void>
  generatePreview: (project: ProjectSchema, timestamp: number) => Promise<Blob>
  refreshActiveJobs: () => Promise<void>
}

export function useVideoCompiler(): UseVideoCompilerReturn {
  logInfo("[useVideoCompiler] Инициализация useVideoCompiler хука")

  const { t } = useTranslation()
  const [isRendering, setIsRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null)
  const [activeJobs, setActiveJobs] = useState<VideoRenderJob[]>([])
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)

  // Запуск рендеринга
  const startRender = useCallback(async (project: ProjectSchema, outputPath: string): Promise<string> => {
    logInfo("[useVideoCompiler] Запуск рендеринга проекта", {
      projectName: project.metadata.name,
      outputPath,
      duration: project.timeline.duration,
    })

    try {
      setIsRendering(true)

      // Запускаем рендеринг
      const jobId = await renderProject(project, outputPath)
      setCurrentJobId(jobId)

      logInfo("[useVideoCompiler] Рендеринг запущен успешно", { jobId })

      toast.success(t("videoCompiler.render.started"), {
        description: t("videoCompiler.render.project", { name: project.metadata.name }),
      })

      // Отслеживаем прогресс
      void trackRenderProgress(jobId, (progress) => {
        setRenderProgress(progress)

        // Обновляем состояние при завершении
        if (progress.status === RenderStatus.Completed) {
          logInfo("[useVideoCompiler] Рендеринг завершен успешно", {
            jobId,
            outputPath,
            progress: progress.progress,
          })
          setIsRendering(false)
          toast.success(t("videoCompiler.render.completed"), {
            description: t("videoCompiler.render.saved", { path: outputPath }),
          })
        } else if (progress.status === RenderStatus.Failed) {
          logError("[useVideoCompiler] Рендеринг завершен с ошибкой", {
            jobId,
            message: progress.message,
          })
          setIsRendering(false)
          toast.error(t("videoCompiler.render.error"), {
            description: progress.message || t("common.unknownError"),
          })
        } else if (progress.status === RenderStatus.Cancelled) {
          logInfo("[useVideoCompiler] Рендеринг отменен", { jobId })
          setIsRendering(false)
          toast.info(t("videoCompiler.render.cancelled"))
        }
      })

      return jobId
    } catch (error) {
      logError("[useVideoCompiler] Ошибка запуска рендеринга", error)
      setIsRendering(false)
      toast.error(t("videoCompiler.render.failedToStart"), {
        description: error instanceof Error ? error.message : t("common.unknownError"),
      })
      throw error
    }
  }, [])

  // Отмена рендеринга
  const cancelRender = useCallback(async (jobId: string) => {
    logInfo("[useVideoCompiler] Отмена рендеринга", { jobId })

    try {
      const success = await invoke<boolean>("cancel_render", { jobId })

      if (success) {
        logInfo("[useVideoCompiler] Рендеринг успешно отменен", { jobId })
        toast.info("Рендеринг отменен")
        setIsRendering(false)
        setRenderProgress(null)
      } else {
        logError("[useVideoCompiler] Не удалось отменить рендеринг", { jobId })
        toast.error(t("videoCompiler.render.failedToCancel"))
      }
    } catch (error) {
      logError("[useVideoCompiler] Ошибка при отмене рендеринга", error)
      toast.error(t("videoCompiler.render.errorCancelling"))
    }
  }, [])

  // Генерация превью кадра
  const generatePreview = useCallback(async (project: ProjectSchema, timestamp: number): Promise<Blob> => {
    logInfo("[useVideoCompiler] Генерация превью кадра", {
      projectName: project.metadata.name,
      timestamp,
    })

    try {
      const jpegData = await invoke<number[]>("generate_preview", {
        projectSchema: project,
        timestamp,
      })

      // Конвертируем массив байтов в Blob
      const uint8Array = new Uint8Array(jpegData)
      const blob = new Blob([uint8Array], { type: "image/jpeg" })

      logInfo("[useVideoCompiler] Превью кадра сгенерировано успешно", {
        timestamp,
        size: blob.size,
      })

      return blob
    } catch (error) {
      logError("[useVideoCompiler] Ошибка генерации превью кадра", error)
      toast.error(t("videoCompiler.render.failedToGeneratePreview"))
      throw error
    }
  }, [])

  // Получение списка активных задач
  const refreshActiveJobs = useCallback(async () => {
    logInfo("[useVideoCompiler] Обновление списка активных задач")

    try {
      const jobs = await invoke<VideoRenderJob[]>("get_active_jobs")
      setActiveJobs(jobs)
      logInfo("[useVideoCompiler] Список активных задач обновлен", { jobsCount: jobs.length })
    } catch (error) {
      logError("[useVideoCompiler] Ошибка получения активных задач", error)
    }
  }, [])

  return {
    isRendering,
    renderProgress,
    activeJobs,
    startRender,
    cancelRender,
    generatePreview,
    refreshActiveJobs,
  }
}

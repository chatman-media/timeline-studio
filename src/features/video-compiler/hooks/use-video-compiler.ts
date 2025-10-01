import { invoke } from "@tauri-apps/api/core"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ProjectSchema } from "@/domains/video-editing/types/video-compiler"
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
  const { t } = useTranslation()
  const [isRendering, setIsRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null)
  const [activeJobs, setActiveJobs] = useState<VideoRenderJob[]>([])
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)

  // Запуск рендеринга
  const startRender = useCallback(async (project: ProjectSchema, outputPath: string): Promise<string> => {
    try {
      setIsRendering(true)

      // Запускаем рендеринг
      const jobId = await renderProject(project, outputPath)
      setCurrentJobId(jobId)

      toast.success(t("videoCompiler.render.started"), {
        description: t("videoCompiler.render.project", { name: project.metadata.name }),
      })

      // Отслеживаем прогресс
      void trackRenderProgress(jobId, (progress) => {
        setRenderProgress(progress)

        // Обновляем состояние при завершении
        if (progress.status === RenderStatus.Completed) {
          setIsRendering(false)
          toast.success(t("videoCompiler.render.completed"), {
            description: t("videoCompiler.render.saved", { path: outputPath }),
          })
        } else if (progress.status === RenderStatus.Failed) {
          setIsRendering(false)
          toast.error(t("videoCompiler.render.error"), {
            description: progress.message || t("common.unknownError"),
          })
        } else if (progress.status === RenderStatus.Cancelled) {
          setIsRendering(false)
          toast.info(t("videoCompiler.render.cancelled"))
        }
      })

      return jobId
    } catch (error) {
      setIsRendering(false)
      toast.error(t("videoCompiler.render.failedToStart"), {
        description: error instanceof Error ? error.message : t("common.unknownError"),
      })
      throw error
    }
  }, [])

  // Отмена рендеринга
  const cancelRender = useCallback(async (jobId: string) => {
    try {
      const success = await invoke<boolean>("cancel_render", { jobId })

      if (success) {
        toast.info("Рендеринг отменен")
        setIsRendering(false)
        setRenderProgress(null)
      } else {
        toast.error(t("videoCompiler.render.failedToCancel"))
      }
    } catch (error) {
      console.error("Failed to cancel render:", error)
      toast.error(t("videoCompiler.render.errorCancelling"))
    }
  }, [])

  // Генерация превью кадра
  const generatePreview = useCallback(async (project: ProjectSchema, timestamp: number): Promise<Blob> => {
    try {
      const jpegData = await invoke<number[]>("generate_preview", {
        projectSchema: project,
        timestamp,
      })

      // Конвертируем массив байтов в Blob
      const uint8Array = new Uint8Array(jpegData)
      return new Blob([uint8Array], { type: "image/jpeg" })
    } catch (error) {
      console.error("Failed to generate preview:", error)
      toast.error(t("videoCompiler.render.failedToGeneratePreview"))
      throw error
    }
  }, [])

  // Получение списка активных задач
  const refreshActiveJobs = useCallback(async () => {
    try {
      const jobs = await invoke<VideoRenderJob[]>("get_active_jobs")
      setActiveJobs(jobs)
    } catch (error) {
      console.error("Failed to get active jobs:", error)
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

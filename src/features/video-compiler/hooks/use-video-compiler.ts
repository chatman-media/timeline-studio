import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNotifications } from "@/domains/system-integration"
import { renderProject, trackRenderProgress } from "@/domains/video-editing/services/compiler"
import { videoCompilerRenderService } from "@/domains/video-editing/services/video-compiler-render-service"
import { ProjectSchema } from "@/domains/video-editing/types/video-compiler"
import { createLogger } from "@/lib/tauri-logger"
import type { RenderProgress, VideoRenderJob } from "../types/render"
import { RenderStatus } from "../types/render"

const logger = createLogger("UseVideoCompiler")

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
  void logger.info("Инициализация useVideoCompiler хука")

  const { t } = useTranslation()
  const { showSuccess, showError, showInfo } = useNotifications()
  const [isRendering, setIsRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null)
  const [activeJobs, setActiveJobs] = useState<VideoRenderJob[]>([])
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)

  // Запуск рендеринга
  const startRender = useCallback(
    async (project: ProjectSchema, outputPath: string): Promise<string> => {
      void logger.info("Запуск рендеринга проекта", {
        projectName: project.metadata.name,
        outputPath,
        duration: project.timeline.duration,
      })

      try {
        setIsRendering(true)

        // Запускаем рендеринг
        const jobId = await renderProject(project, outputPath)
        setCurrentJobId(jobId)

        void logger.info("Рендеринг запущен успешно", { jobId })

        showSuccess(
          t("videoCompiler.render.started"),
          t("videoCompiler.render.project", { name: project.metadata.name }),
        )

        // Отслеживаем прогресс
        void trackRenderProgress(jobId, (progress) => {
          setRenderProgress(progress)

          // Обновляем состояние при завершении
          if (progress.status === RenderStatus.Completed) {
            void logger.info("Рендеринг завершен успешно", {
              jobId,
              outputPath,
              percentage: progress.percentage,
            })
            setIsRendering(false)
            showSuccess(t("videoCompiler.render.completed"), t("videoCompiler.render.saved", { path: outputPath }))
          } else if (progress.status === RenderStatus.Failed) {
            void logger.error("Рендеринг завершен с ошибкой", {
              jobId,
              message: progress.message,
            })
            setIsRendering(false)
            showError(t("videoCompiler.render.error"), progress.message || t("common.unknownError"))
          } else if (progress.status === RenderStatus.Cancelled) {
            void logger.info("Рендеринг отменен", { jobId })
            setIsRendering(false)
            showInfo(t("videoCompiler.render.cancelled"), "")
          }
        })

        return jobId
      } catch (error) {
        void logger.error("Ошибка запуска рендеринга", { error })
        setIsRendering(false)
        showError(
          t("videoCompiler.render.failedToStart"),
          error instanceof Error ? error.message : t("common.unknownError"),
        )
        throw error
      }
    },
    [showSuccess, showError, showInfo, t],
  )

  // Отмена рендеринга
  const cancelRender = useCallback(
    async (jobId: string) => {
      void logger.info("Отмена рендеринга", { jobId })

      try {
        const success = await videoCompilerRenderService.cancelRender(jobId)

        if (success) {
          void logger.info("Рендеринг успешно отменен", { jobId })
          showInfo(t("videoCompiler.render.cancelled"), "")
          setIsRendering(false)
          setRenderProgress(null)
        } else {
          void logger.error("Не удалось отменить рендеринг", { jobId })
          showError(t("videoCompiler.render.failedToCancel"), "")
        }
      } catch (error) {
        void logger.error("Ошибка при отмене рендеринга", { error })
        showError(t("videoCompiler.render.errorCancelling"), error instanceof Error ? error.message : String(error))
      }
    },
    [showInfo, showError, t],
  )

  // Генерация превью кадра
  const generatePreview = useCallback(
    async (project: ProjectSchema, timestamp: number): Promise<Blob> => {
      void logger.info("Генерация превью кадра", {
        projectName: project.metadata.name,
        timestamp,
      })

      try {
        const jpegData = await videoCompilerRenderService.generatePreview(project, timestamp)

        // Конвертируем массив байтов в Blob
        const uint8Array = new Uint8Array(jpegData)
        const blob = new Blob([uint8Array], { type: "image/jpeg" })

        void logger.info("Превью кадра сгенерировано успешно", {
          timestamp,
          size: blob.size,
        })

        return blob
      } catch (error) {
        void logger.error("Ошибка генерации превью кадра", { error })
        showError(
          t("videoCompiler.render.failedToGeneratePreview"),
          error instanceof Error ? error.message : String(error),
        )
        throw error
      }
    },
    [showError, t],
  )

  // Получение списка активных задач
  const refreshActiveJobs = useCallback(async () => {
    void logger.info("Обновление списка активных задач")

    try {
      void logger.info("Список активных задач обновлен", {
        jobsCount: activeJobs.length,
      })
    } catch (error) {
      void logger.error("Ошибка получения активных задач", { error })
    }
  }, [activeJobs])

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

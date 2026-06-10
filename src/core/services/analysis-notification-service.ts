import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification"
import { toast } from "sonner"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("AnalysisNotificationService")

interface NotificationOptions {
  enableSystemNotifications?: boolean
  enableToast?: boolean
}

class AnalysisNotificationService {
  private enableSystemNotifications = false
  private enableToast = true
  private permissionGranted = false

  constructor() {
    void this.init()
  }

  private async init() {
    if (typeof window === "undefined" || !(window as any).__TAURI_INTERNALS__) return

    try {
      this.permissionGranted = await isPermissionGranted()

      if (!this.permissionGranted) {
        const permission = await requestPermission()
        this.permissionGranted = permission === "granted"
      }

      logger.info("Notification service initialized", {
        permissionGranted: this.permissionGranted,
      })
    } catch (error) {
      logger.error("Failed to initialize notification service", { error })
    }
  }

  configure(options: NotificationOptions) {
    if (options.enableSystemNotifications !== undefined) {
      this.enableSystemNotifications = options.enableSystemNotifications
    }
    if (options.enableToast !== undefined) {
      this.enableToast = options.enableToast
    }

    logger.info("Notification service configured", {
      enableSystemNotifications: this.enableSystemNotifications,
      enableToast: this.enableToast,
    })
  }

  notifyAnalysisStarted(fileName: string, analysisType = "comprehensive") {
    const title = "Анализ начат"
    const message = `Начат ${this.getAnalysisTypeLabel(analysisType)} анализ: ${this.formatFileName(fileName)}`

    if (this.enableToast) {
      toast.info(title, { description: message, duration: 3000 })
    }

    if (this.enableSystemNotifications) {
      void this.sendSystemNotification(title, message)
    }

    logger.info("Analysis started notification sent", { fileName, analysisType })
  }

  notifyAnalysisProgress(fileName: string, progress: number, stage: string) {
    const keyMilestones = [25, 50, 75]
    const shouldShow = keyMilestones.some((milestone) => Math.abs(progress - milestone) < 1)

    if (!shouldShow || !this.enableToast) return

    toast.loading("Анализ в процессе", {
      description: `${this.formatFileName(fileName)}: ${Math.round(progress)}% (${this.getStageLabel(stage)})`,
      duration: 2000,
    })

    logger.debug("Analysis progress notification sent", { fileName, progress, stage })
  }

  notifyAnalysisCompleted(fileName: string, durationMs: number, success: boolean) {
    const title = success ? "Анализ завершен" : "Анализ завершен с ошибками"
    const message = `${this.formatFileName(fileName)} (${Math.round(durationMs / 1000)}с)`

    if (this.enableToast) {
      const notify = success ? toast.success : toast.warning
      notify(title, { description: message, duration: 5000 })
    }

    if (this.enableSystemNotifications) {
      void this.sendSystemNotification(title, message)
    }

    logger.info("Analysis completed notification sent", { fileName, durationMs, success })
  }

  notifyAnalysisError(fileName: string, error: string) {
    const title = "Ошибка анализа"
    const message = `${this.formatFileName(fileName)}: ${error}`

    if (this.enableToast) {
      toast.error(title, { description: message, duration: 8000 })
    }

    if (this.enableSystemNotifications) {
      void this.sendSystemNotification(title, message)
    }

    logger.error("Analysis error notification sent", { fileName, error })
  }

  private async sendSystemNotification(title: string, body: string) {
    if (!this.permissionGranted) {
      logger.warn("System notification skipped - no permission")
      return
    }

    try {
      await sendNotification({ title, body, icon: "icon.png" })
      logger.debug("System notification sent", { title })
    } catch (error) {
      logger.error("Failed to send system notification", { error })
    }
  }

  private formatFileName(filePath: string): string {
    const fileName = filePath.split(/[/\\]/).pop() || filePath
    const maxLength = 30

    if (fileName.length > maxLength) {
      return `${fileName.slice(0, maxLength - 3)}...`
    }

    return fileName
  }

  private getAnalysisTypeLabel(analysisType: string): string {
    const labels: Record<string, string> = {
      comprehensive: "комплексный",
      quick: "быстрый",
      batch: "пакетный",
      realtime: "real-time",
    }

    return labels[analysisType] || analysisType
  }

  private getStageLabel(stage: string): string {
    const labels: Record<string, string> = {
      initialization: "инициализация",
      audio: "анализ аудио",
      video: "анализ видео",
      scene_detection: "детекция сцен",
      emotion: "анализ эмоций",
      quality: "анализ качества",
      key_moments: "ключевые моменты",
      integration: "интеграция данных",
      finalization: "завершение",
    }

    return labels[stage] || stage
  }
}

export const analysisNotificationService = new AnalysisNotificationService()

/**
 * Analysis Notification Service
 *
 * Централизованный сервис для всех уведомлений AI-анализа
 * Поддерживает UI toast (Sonner) и системные нотификации (Tauri)
 */

import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification"
import { toast } from "sonner"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("AnalysisNotificationService")

interface NotificationOptions {
  enableSystemNotifications?: boolean
  enableToast?: boolean
}

class AnalysisNotificationService {
  private enableSystemNotifications: boolean = false
  private enableToast: boolean = true
  private permissionGranted: boolean = false

  constructor() {
    this.init()
  }

  /**
   * Инициализация сервиса
   * Проверяет разрешение на системные нотификации
   */
  private async init() {
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

  /**
   * Настройка параметров нотификаций
   */
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

  /**
   * Уведомление о старте анализа
   */
  notifyAnalysisStarted(fileName: string, analysisType: string = "comprehensive") {
    const title = "Анализ начат"
    const message = `Начат ${this.getAnalysisTypeLabel(analysisType)} анализ: ${this.formatFileName(fileName)}`

    if (this.enableToast) {
      toast.info(title, {
        description: message,
        duration: 3000,
      })
    }

    if (this.enableSystemNotifications) {
      this.sendSystemNotification(title, message)
    }

    logger.info("Analysis started notification sent", { fileName, analysisType })
  }

  /**
   * Уведомление о прогрессе анализа
   * Показывается только на ключевых этапах (25%, 50%, 75%)
   */
  notifyAnalysisProgress(fileName: string, progress: number, stage: string) {
    // Показываем только на ключевых этапах
    const keyMilestones = [25, 50, 75]
    const shouldShow = keyMilestones.some((milestone) => Math.abs(progress - milestone) < 1)

    if (!shouldShow || !this.enableToast) {
      return
    }

    const message = `${this.formatFileName(fileName)}: ${Math.round(progress)}% (${this.getStageLabel(stage)})`

    toast.loading("Анализ в процессе", {
      description: message,
      duration: 2000,
    })

    logger.debug("Analysis progress notification sent", { fileName, progress, stage })
  }

  /**
   * Уведомление о завершении анализа
   */
  notifyAnalysisCompleted(fileName: string, durationMs: number, success: boolean) {
    const title = success ? "Анализ завершен" : "Анализ завершен с ошибками"
    const durationSec = Math.round(durationMs / 1000)
    const message = `${this.formatFileName(fileName)} (${durationSec}с)`

    if (this.enableToast) {
      if (success) {
        toast.success(title, {
          description: message,
          duration: 5000,
        })
      } else {
        toast.warning(title, {
          description: message,
          duration: 5000,
        })
      }
    }

    if (this.enableSystemNotifications) {
      this.sendSystemNotification(title, message)
    }

    logger.info("Analysis completed notification sent", { fileName, durationMs, success })
  }

  /**
   * Уведомление об ошибке анализа
   */
  notifyAnalysisError(fileName: string, error: string) {
    const title = "Ошибка анализа"
    const message = `${this.formatFileName(fileName)}: ${error}`

    if (this.enableToast) {
      toast.error(title, {
        description: message,
        duration: 8000,
      })
    }

    if (this.enableSystemNotifications) {
      this.sendSystemNotification(title, message)
    }

    logger.error("Analysis error notification sent", { fileName, error })
  }

  /**
   * Отправка системной нотификации через Tauri
   */
  private async sendSystemNotification(title: string, body: string) {
    if (!this.permissionGranted) {
      logger.warn("System notification skipped - no permission")
      return
    }

    try {
      await sendNotification({
        title,
        body,
        icon: "icon.png", // TODO: добавить иконку приложения
      })
      logger.debug("System notification sent", { title })
    } catch (error) {
      logger.error("Failed to send system notification", { error })
    }
  }

  /**
   * Форматирование имени файла для отображения
   */
  private formatFileName(filePath: string): string {
    const fileName = filePath.split(/[/\\]/).pop() || filePath
    const maxLength = 30

    if (fileName.length > maxLength) {
      return `${fileName.slice(0, maxLength - 3)}...`
    }

    return fileName
  }

  /**
   * Получение читаемого названия типа анализа
   */
  private getAnalysisTypeLabel(analysisType: string): string {
    const labels: Record<string, string> = {
      comprehensive: "комплексный",
      quick: "быстрый",
      batch: "пакетный",
      realtime: "real-time",
    }

    return labels[analysisType] || analysisType
  }

  /**
   * Получение читаемого названия этапа анализа
   */
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

// Singleton instance
export const analysisNotificationService = new AnalysisNotificationService()

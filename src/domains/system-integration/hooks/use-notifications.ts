/**
 * Hook для работы с системными уведомлениями
 */

import { useCallback, useEffect, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { isServiceEnabled } from "@/shared/config/service-config"
import { getSystemIntegrationOrchestrator } from "../services/system-integration-orchestrator"
import type { NotificationAction, SystemNotification } from "../types"

const logger = createLogger("UseNotifications")

export function useNotifications() {
  const [orchestrator] = useState(() => getSystemIntegrationOrchestrator())
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => orchestrator.getNotifications())

  // Периодическое обновление списка уведомлений
  useEffect(() => {
    // Проверяем, разрешены ли уведомления
    if (!isServiceEnabled("NOTIFICATIONS")) {
      logger.info("[useNotifications] Notifications are disabled by service config")
      return
    }

    logger.info("[useNotifications] Setting up notifications update interval")
    let updateCount = 0
    let lastNotificationCount = 0

    const interval = setInterval(() => {
      const startTime = performance.now()
      updateCount++

      const currentNotifications = orchestrator.getNotifications()
      const currentCount = currentNotifications.length

      // Обновляем только если количество уведомлений изменилось или первый запуск
      if (currentCount !== lastNotificationCount || updateCount === 1) {
        setNotifications(currentNotifications)
        lastNotificationCount = currentCount

        const duration = performance.now() - startTime
        if (duration > 5) {
          logger.warn(`[useNotifications] Notification update #${updateCount} took ${duration.toFixed(2)}ms`)
        }
      }

      // Логируем каждые 100 обновлений для отладки
      if (updateCount % 100 === 0) {
        logger.info("[useNotifications] Processed ${updateCount} notification updates, current count:", {
          currentCount,
        })
      }
    }, 100) // Обновляем каждые 100ms

    return () => {
      logger.info("[useNotifications] Cleaning up notifications interval (processed", { updateCount })
      clearInterval(interval)
    }
  }, [orchestrator])

  // Показать уведомление
  const showNotification = useCallback(
    (
      type: SystemNotification["type"],
      title: string,
      message: string,
      options?: {
        duration?: number
        actions?: NotificationAction[]
      },
    ) => {
      return orchestrator.showNotification({
        type,
        title,
        message,
        duration: options?.duration,
        actions: options?.actions,
      })
    },
    [orchestrator],
  )

  // Удобные методы для разных типов уведомлений
  const showInfo = useCallback(
    (title: string, message: string, duration?: number) => {
      return showNotification("info", title, message, { duration })
    },
    [showNotification],
  )

  const showSuccess = useCallback(
    (title: string, message: string, duration = 3000) => {
      return showNotification("success", title, message, { duration })
    },
    [showNotification],
  )

  const showWarning = useCallback(
    (title: string, message: string, duration?: number) => {
      return showNotification("warning", title, message, { duration })
    },
    [showNotification],
  )

  const showError = useCallback(
    (title: string, message: string, duration?: number) => {
      return showNotification("error", title, message, { duration })
    },
    [showNotification],
  )

  // Закрыть уведомление
  const dismissNotification = useCallback(
    (id: string) => {
      orchestrator.dismissNotification(id)
    },
    [orchestrator],
  )

  // Очистить все уведомления
  const clearNotifications = useCallback(() => {
    orchestrator.clearNotifications()
  }, [orchestrator])

  return {
    // Состояние
    notifications,
    hasNotifications: notifications.length > 0,

    // Общие методы
    showNotification,
    dismissNotification,
    clearNotifications,

    // Удобные методы
    showInfo,
    showSuccess,
    showWarning,
    showError,
  }
}

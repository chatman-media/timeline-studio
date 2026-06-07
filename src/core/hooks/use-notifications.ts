import { useCallback, useEffect, useRef, useState } from "react"
import { container } from "../container"

export type CoreNotificationType = "info" | "success" | "warning" | "error"

export interface NotificationAction {
  label: string
  action: () => void
  style?: "primary" | "secondary" | "danger"
}

export interface SystemNotification {
  id: string
  notification_type: CoreNotificationType
  type: CoreNotificationType
  title: string
  message: string
  timestamp: Date
  duration?: number
  actions?: NotificationAction[]
}

let notificationCounter = 0

export function useNotifications() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([])
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  useEffect(() => {
    const timeouts = timeoutsRef.current

    return () => {
      for (const timeout of timeouts) {
        clearTimeout(timeout)
      }

      timeouts.clear()
    }
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id))
  }, [])

  const showNotification = useCallback(
    (
      type: CoreNotificationType,
      title: string,
      message: string,
      options?: {
        duration?: number
        actions?: NotificationAction[]
      },
    ) => {
      const id = `notification-${++notificationCounter}`
      const notification: SystemNotification = {
        id,
        notification_type: type,
        type,
        title,
        message,
        timestamp: new Date(),
        duration: options?.duration,
        actions: options?.actions,
      }

      setNotifications((current) => [...current, notification])

      if (container.hasPlatform()) {
        void container
          .getPlatform()
          .showNotification({ title, body: message })
          .catch(() => {
            // UI notifications must not fail because native notifications are unavailable.
          })
      }

      if (options?.duration) {
        const timeout = setTimeout(() => {
          dismissNotification(id)
          timeoutsRef.current.delete(timeout)
        }, options.duration)

        timeoutsRef.current.add(timeout)
      }

      return id
    },
    [dismissNotification],
  )

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

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    hasNotifications: notifications.length > 0,
    showNotification,
    dismissNotification,
    clearNotifications,
    showInfo,
    showSuccess,
    showWarning,
    showError,
  }
}

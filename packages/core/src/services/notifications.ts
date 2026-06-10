import { container } from "@timeline-studio/core/container"

export type CoreNotificationType = "info" | "success" | "warning" | "error"

export interface CoreNotificationAction {
  label: string
  action: () => void
  style?: "primary" | "secondary" | "danger"
}

export interface CoreSystemNotification {
  notification_type?: CoreNotificationType
  type: CoreNotificationType
  title: string
  message: string
  duration?: number
  actions?: CoreNotificationAction[]
}

let notificationCounter = 0

export function showSystemNotification(notification: CoreSystemNotification): string {
  const id = `notification-${++notificationCounter}`

  if (container.hasPlatform()) {
    void container
      .getPlatform()
      .showNotification({ title: notification.title, body: notification.message })
      .catch(() => {
        // Native notifications are best-effort and should not break feature flows.
      })
  }

  return id
}

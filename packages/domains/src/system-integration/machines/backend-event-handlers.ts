/**
 * Backend Event Handlers для System Integration
 *
 * Обрабатывает события от Rust backend и обновляет состояние системной интеграции
 * Используется паттерн Command-Event для синхронизации
 */

import { createLogger } from "@/lib/tauri-logger"
import type { SystemNotification as BackendSystemNotification, ProjectEvent } from "@/types/generated/tauri-bindings"
import type { SystemNotification } from "../types"

const logger = createLogger("SystemIntegrationBackendEventHandlers")

/**
 * Converts backend SystemNotification to frontend SystemNotification
 * Adds the 'type' field based on notification_type
 */
function convertBackendNotification(backendNotification: BackendSystemNotification): SystemNotification {
  // Map notification_type string to type field
  let type: "info" | "success" | "warning" | "error" = "info"
  const notifType = backendNotification.notification_type.toLowerCase()

  if (notifType.includes("error") || notifType.includes("failed")) {
    type = "error"
  } else if (notifType.includes("warn")) {
    type = "warning"
  } else if (notifType.includes("success") || notifType.includes("complete")) {
    type = "success"
  }

  return {
    ...backendNotification,
    type,
    timestamp: new Date(backendNotification.timestamp),
    duration: backendNotification.duration ?? undefined,
    actions: backendNotification.actions
      ? backendNotification.actions.map((action) => {
          const { style, ...rest } = action as any
          // Удаляем null/undefined поля
          return style !== null && style !== undefined ? { ...rest, style } : rest
        })
      : undefined,
  }
}

/**
 * Контекст для системной интеграции
 */
export interface SystemIntegrationContext {
  // Feature flags
  features: Record<string, boolean>
  // Notifications
  notifications: SystemNotification[]
  // Update state
  updateAvailable: boolean
  updateInfo: any | null
  // Connection state
  isConnected: boolean
  error: string | null
}

/**
 * Главный обработчик backend событий для системной интеграции
 */
export function handleBackendEvent(
  context: SystemIntegrationContext,
  event: ProjectEvent,
): Partial<SystemIntegrationContext> {
  logger.info("Handling backend event:", { event: event.type })

  switch (event.type) {
    // Feature flags events
    case "FeatureToggled":
      return handleFeatureToggled(context, event)

    // Notification events
    case "NotificationShown":
      return handleNotificationShown(context, event)
    case "NotificationDismissed":
      return handleNotificationDismissed(context, event)
    case "NotificationsCleared":
      return handleNotificationsCleared(context, event)

    // Update events
    case "UpdateCheckStarted":
      return handleUpdateCheckStarted(context, event)
    case "UpdateCheckCompleted":
      return handleUpdateCheckCompleted(context, event)
    case "UpdateAvailable":
      return handleUpdateAvailable(context, event)
    case "UpdateDownloadStarted":
      return handleUpdateDownloadStarted(context, event)
    case "UpdateDownloadCompleted":
      return handleUpdateDownloadCompleted(context, event)
    case "UpdateInstallStarted":
      return handleUpdateInstallStarted(context, event)
    case "UpdateDismissed":
      return handleUpdateDismissed(context, event)
    case "AutoUpdateEnabled":
      return handleAutoUpdateEnabled(context, event)
    case "AutoUpdateDisabled":
      return handleAutoUpdateDisabled(context, event)

    // Modal events (handled by orchestrator's modal machine)
    case "ModalOpened":
    case "ModalClosed":
    case "ModalSubmitted":
      logger.debug("Modal event handled by modal machine:", { type: event.type })
      return {}

    default:
      logger.debug("Unhandled backend event type:", { type: event.type })
      return {}
  }
}

// ============================================================================
// Feature Flags Handlers
// ============================================================================

function handleFeatureToggled(
  context: SystemIntegrationContext,
  event: Extract<ProjectEvent, { type: "FeatureToggled" }>,
): Partial<SystemIntegrationContext> {
  const { feature, enabled } = event.payload

  logger.info("Feature toggled:", { feature, enabled })

  return {
    features: {
      ...context.features,
      [feature]: enabled,
    },
  }
}

// ============================================================================
// Notification Handlers
// ============================================================================

function handleNotificationShown(
  context: SystemIntegrationContext,
  event: Extract<ProjectEvent, { type: "NotificationShown" }>,
): Partial<SystemIntegrationContext> {
  const { notification: backendNotification } = event.payload

  // Convert backend notification to frontend format
  const notification = convertBackendNotification(backendNotification)

  logger.info("Notification shown:", { id: notification.id, title: notification.title })

  // Проверяем, не существует ли уже уведомление с таким ID
  const existingIndex = context.notifications.findIndex((n) => n.id === notification.id)

  let updatedNotifications: SystemNotification[]
  if (existingIndex !== -1) {
    // Обновляем существующее уведомление
    updatedNotifications = [...context.notifications]
    updatedNotifications[existingIndex] = notification
  } else {
    // Добавляем новое уведомление
    updatedNotifications = [...context.notifications, notification]
  }

  return {
    notifications: updatedNotifications,
  }
}

function handleNotificationDismissed(
  context: SystemIntegrationContext,
  event: Extract<ProjectEvent, { type: "NotificationDismissed" }>,
): Partial<SystemIntegrationContext> {
  const { id } = event.payload

  logger.info("Notification dismissed:", { id })

  return {
    notifications: context.notifications.filter((n) => n.id !== id),
  }
}

function handleNotificationsCleared(
  _context: SystemIntegrationContext,
  _event: Extract<ProjectEvent, { type: "NotificationsCleared" }>,
): Partial<SystemIntegrationContext> {
  logger.info("All notifications cleared")

  return {
    notifications: [],
  }
}

// ============================================================================
// Update Handlers
// ============================================================================

function handleUpdateCheckStarted(
  _context: SystemIntegrationContext,
  _event: Extract<ProjectEvent, { type: "UpdateCheckStarted" }>,
): Partial<SystemIntegrationContext> {
  logger.info("Update check started")

  return {
    // Можно добавить флаг isCheckingForUpdates если нужно
  }
}

function handleUpdateCheckCompleted(
  _context: SystemIntegrationContext,
  event: Extract<ProjectEvent, { type: "UpdateCheckCompleted" }>,
): Partial<SystemIntegrationContext> {
  const { has_update } = event.payload

  logger.info("Update check completed:", { hasUpdate: has_update })

  return {
    updateAvailable: has_update,
  }
}

function handleUpdateAvailable(
  _context: SystemIntegrationContext,
  event: Extract<ProjectEvent, { type: "UpdateAvailable" }>,
): Partial<SystemIntegrationContext> {
  const { update_info } = event.payload

  logger.info("Update available:", { version: update_info.version })

  return {
    updateAvailable: true,
    updateInfo: update_info,
  }
}

function handleUpdateDownloadStarted(
  _context: SystemIntegrationContext,
  _event: Extract<ProjectEvent, { type: "UpdateDownloadStarted" }>,
): Partial<SystemIntegrationContext> {
  logger.info("Update download started")

  return {
    // Можно добавить флаг isDownloadingUpdate если нужно
  }
}

function handleUpdateDownloadCompleted(
  _context: SystemIntegrationContext,
  _event: Extract<ProjectEvent, { type: "UpdateDownloadCompleted" }>,
): Partial<SystemIntegrationContext> {
  logger.info("Update download completed")

  return {
    // Можно добавить флаг updateReadyToInstall если нужно
  }
}

function handleUpdateInstallStarted(
  _context: SystemIntegrationContext,
  _event: Extract<ProjectEvent, { type: "UpdateInstallStarted" }>,
): Partial<SystemIntegrationContext> {
  logger.info("Update installation started")

  return {
    // Можно добавить флаг isInstallingUpdate если нужно
  }
}

function handleUpdateDismissed(
  _context: SystemIntegrationContext,
  _event: Extract<ProjectEvent, { type: "UpdateDismissed" }>,
): Partial<SystemIntegrationContext> {
  logger.info("Update dismissed")

  return {
    updateAvailable: false,
    updateInfo: null,
  }
}

function handleAutoUpdateEnabled(
  _context: SystemIntegrationContext,
  event: Extract<ProjectEvent, { type: "AutoUpdateEnabled" }>,
): Partial<SystemIntegrationContext> {
  const { interval_minutes } = event.payload

  logger.info("Auto-update enabled:", { intervalMinutes: interval_minutes })

  return {
    // Можно добавить autoUpdateEnabled и autoUpdateInterval если нужно хранить в контексте
  }
}

function handleAutoUpdateDisabled(
  _context: SystemIntegrationContext,
  _event: Extract<ProjectEvent, { type: "AutoUpdateDisabled" }>,
): Partial<SystemIntegrationContext> {
  logger.info("Auto-update disabled")

  return {
    // Можно добавить autoUpdateEnabled: false если нужно хранить в контексте
  }
}

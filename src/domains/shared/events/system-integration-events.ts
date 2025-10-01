/**
 * System Integration Domain Events
 *
 * События домена системной интеграции
 */

// === Modal Events ===

export interface ModalOpenedEvent {
  modalType: string
  modalData?: any
  triggeredBy?: string
}

export interface ModalClosedEvent {
  modalType: string
  closedBy: "user" | "submit" | "cancel" | "escape"
  duration: number
}

export interface ModalSubmittedEvent {
  modalType: string
  data: any
  validationPassed: boolean
}

// === Update Events ===

export interface UpdateCheckStartedEvent {
  currentVersion: string
  channel: "stable" | "beta" | "alpha"
}

export interface UpdateAvailableEvent {
  currentVersion: string
  newVersion: string
  releaseNotes?: string
  downloadSize: number
  isCritical: boolean
}

export interface UpdateDownloadStartedEvent {
  version: string
  totalSize: number
}

export interface UpdateDownloadProgressEvent {
  version: string
  downloaded: number
  total: number
  speed: number // bytes per second
  eta: number // seconds
}

export interface UpdateInstalledEvent {
  version: string
  success: boolean
  error?: string
  requiresRestart: boolean
}

// === Keyboard Shortcuts Events ===

export interface ShortcutTriggeredEvent {
  shortcut: string
  action: string
  source: "keyboard" | "menu" | "toolbar"
}

export interface ShortcutChangedEvent {
  action: string
  oldShortcut: string
  newShortcut: string
}

// === System Events ===

export interface AppStartedEvent {
  version: string
  platform: string
  startupTime: number
  launchMode: "normal" | "debug" | "safe"
}

export interface AppShutdownEvent {
  reason: "user" | "update" | "crash" | "system"
  sessionDuration: number
  unsavedChanges: boolean
}

export interface WindowFocusChangedEvent {
  focused: boolean
  windowId: string
}

export interface SystemResourcesEvent {
  cpu: number
  memory: {
    used: number
    total: number
  }
  gpu?: {
    usage: number
    memory: number
  }
}

// === Notification Events ===

export interface NotificationShownEvent {
  id: string
  type: "info" | "success" | "warning" | "error"
  title: string
  message: string
  duration?: number
}

export interface NotificationClickedEvent {
  id: string
  action?: string
}

// === Event Type Constants ===

export const SYSTEM_INTEGRATION_EVENTS = {
  // Modal
  MODAL_OPENED: "system.modal.opened",
  MODAL_CLOSED: "system.modal.closed",
  MODAL_SUBMITTED: "system.modal.submitted",

  // Update
  UPDATE_CHECK_STARTED: "system.update.check-started",
  UPDATE_AVAILABLE: "system.update.available",
  UPDATE_DOWNLOAD_STARTED: "system.update.download-started",
  UPDATE_DOWNLOAD_PROGRESS: "system.update.download-progress",
  UPDATE_INSTALLED: "system.update.installed",

  // Shortcuts
  SHORTCUT_TRIGGERED: "system.shortcut.triggered",
  SHORTCUT_CHANGED: "system.shortcut.changed",

  // System
  APP_STARTED: "system.app.started",
  APP_SHUTDOWN: "system.app.shutdown",
  WINDOW_FOCUS_CHANGED: "system.window.focus-changed",
  SYSTEM_RESOURCES: "system.resources.status",

  // Notification
  NOTIFICATION_SHOWN: "system.notification.shown",
  NOTIFICATION_CLICKED: "system.notification.clicked",
} as const

/**
 * System Integration Domain Types
 *
 * Центральное место для всех типов домена системной интеграции
 */

// Import and re-export all update types from features
import type {
  AutoCheckSettings,
  UpdateAvailability,
  UpdateCheckResult,
  UpdateEventPayload,
  UpdateInfo,
  UpdateMachineContext,
  UpdateMachineEvent,
  UpdateProgress,
  UpdateProgressWithPercentage,
  UpdateStatus,
} from "@/features/updates/types"

export type {
  AutoCheckSettings,
  UpdateAvailability,
  UpdateCheckResult,
  UpdateEventPayload,
  UpdateInfo,
  UpdateMachineContext,
  UpdateMachineEvent,
  UpdateProgress,
  UpdateProgressWithPercentage,
  UpdateStatus,
}

// Import modal types
import type { ModalData as MachineModalData, ModalType as MachineModalType } from "../machines/modal-machine"

// Re-export modal types
export type ModalData = MachineModalData
export type ModalType = MachineModalType

// Import types from update machine
export type {
  UpdateMachine,
  UpdateMachineActor,
} from "../machines/update-machine"

// System integration orchestrator context
export interface SystemIntegrationContext {
  // Modal state
  activeModal: ModalType
  modalData: ModalData | null
  modalStack: ModalType[]

  // Update state
  updateStatus: UpdateStatus
  currentVersion: string
  availableUpdate: UpdateInfo | null
  updateProgress: UpdateProgressWithPercentage | null

  // Notifications
  notifications: SystemNotification[]

  // System status
  isOnline: boolean
  systemResources: SystemResources

  // Feature flags
  features: Record<string, boolean>
}

// System notification type
// Extends backend SystemNotification with frontend-specific fields
export interface SystemNotification {
  id: string
  notification_type: string // Backend field name
  type: "info" | "success" | "warning" | "error" // Frontend convenience field
  title: string
  message: string
  timestamp: Date
  duration?: number
  actions?: NotificationAction[]
  read?: boolean // Track read status on frontend
}

export interface NotificationAction {
  label: string
  action: () => void
  style?: "primary" | "secondary" | "danger"
}

// System resources
export interface SystemResources {
  cpuUsage: number
  memoryUsage: number
  diskSpace: {
    used: number
    total: number
  }
  gpuAvailable: boolean
  gpuMemory?: {
    used: number
    total: number
  }
}

// System integration events
export type SystemIntegrationEvent =
  // Modal events
  | { type: "OPEN_MODAL"; modal: ModalType; data?: ModalData }
  | { type: "CLOSE_MODAL" }
  | { type: "CLOSE_ALL_MODALS" }

  // Update events
  | { type: "CHECK_FOR_UPDATES" }
  | { type: "DOWNLOAD_UPDATE" }
  | { type: "INSTALL_UPDATE" }
  | { type: "DISMISS_UPDATE" }

  // Notification events
  | { type: "SHOW_NOTIFICATION"; notification: Omit<SystemNotification, "id" | "timestamp"> }
  | { type: "DISMISS_NOTIFICATION"; id: string }
  | { type: "CLEAR_NOTIFICATIONS" }

  // System events
  | { type: "UPDATE_ONLINE_STATUS"; isOnline: boolean }
  | { type: "UPDATE_SYSTEM_RESOURCES"; resources: SystemResources }
  | { type: "TOGGLE_FEATURE"; feature: string; enabled: boolean }

// System integration service interface
export interface SystemIntegrationService {
  // Modal management
  openModal(modal: ModalType, data?: ModalData): void
  closeModal(): void
  closeAllModals(): void

  // Update management
  checkForUpdates(): Promise<void>
  downloadUpdate(): Promise<void>
  installUpdate(): Promise<void>

  // Notification management
  showNotification(notification: Omit<SystemNotification, "id" | "timestamp">): void
  dismissNotification(id: string): void
  clearNotifications(): void

  // System monitoring
  updateOnlineStatus(isOnline: boolean): void
  updateSystemResources(resources: SystemResources): void

  // Feature flags
  toggleFeature(feature: string, enabled: boolean): void
  isFeatureEnabled(feature: string): boolean
}

/**
 * System Integration Domain Types
 *
 * Центральное место для всех типов домена системной интеграции
 */

// Re-export update types
export type {
  UpdateCheckResult,
  UpdateProgress,
} from "@/features/updates/types"

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

// Import types needed from features
import type {
  UpdateInfo as FeatureUpdateInfo,
  UpdateMachineContext as FeatureUpdateMachineContext,
  UpdateMachineEvent as FeatureUpdateMachineEvent,
  UpdateProgressWithPercentage as FeatureUpdateProgressWithPercentage,
  UpdateStatus as FeatureUpdateStatus,
} from "@/features/updates/types"

// Re-export with proper types
export type UpdateInfo = FeatureUpdateInfo
export type UpdateProgressWithPercentage = FeatureUpdateProgressWithPercentage
export type UpdateStatus = FeatureUpdateStatus
export type UpdateMachineContext = FeatureUpdateMachineContext
export type UpdateMachineEvent = FeatureUpdateMachineEvent

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
export interface SystemNotification {
  id: string
  type: "info" | "success" | "warning" | "error"
  title: string
  message: string
  timestamp: Date
  duration?: number
  actions?: NotificationAction[]
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

/**
 * Типы для модуля обновлений приложения
 * Canonical source in domains/system-integration/types
 */

/**
 * Информация об обновлении
 */
export interface UpdateInfo {
  version: string
  notes?: string
  pub_date?: string
  signature: string
  url: string
}

/**
 * Результат проверки обновлений
 */
export interface UpdateCheckResult {
  available: boolean
  current_version: string
  update_info?: UpdateInfo
}

/**
 * Прогресс загрузки обновления
 */
export interface UpdateProgress {
  chunk_length: number
  content_length?: number
  downloaded: number
}

/**
 * Расширенный прогресс с процентами (для UI)
 */
export interface UpdateProgressWithPercentage extends UpdateProgress {
  percentage: number
  total?: number
}

/**
 * Статус обновления
 */
export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "installing"
  | "installed"
  | "error"

/**
 * Payload события обновления
 */
export interface UpdateEventPayload {
  status: UpdateStatus
  progress?: UpdateProgress
  error?: string
  update_info?: UpdateInfo
}

/**
 * Контекст машины состояний обновлений
 */
export interface UpdateMachineContext {
  currentVersion: string
  availableUpdate?: UpdateInfo
  error?: string
  progress?: UpdateProgressWithPercentage
  autoCheckEnabled: boolean
  autoCheckInterval: number
  lastCheckTime?: Date
}

/**
 * События машины состояний
 */
export type UpdateMachineEvent =
  | { type: "CHECK_FOR_UPDATES" }
  | { type: "DOWNLOAD_UPDATE" }
  | { type: "INSTALL_UPDATE" }
  | { type: "CANCEL_UPDATE" }
  | { type: "RETRY" }
  | { type: "DISMISS" }
  | { type: "ENABLE_AUTO_CHECK"; intervalMinutes: number }
  | { type: "DISABLE_AUTO_CHECK" }
  | { type: "UPDATE_PROGRESS"; progress: UpdateProgressWithPercentage }

/**
 * Настройки автоматической проверки обновлений
 */
export interface AutoCheckSettings {
  enabled: boolean
  intervalMinutes: number
}

/**
 * Упрощенная информация о доступности обновления
 */
export interface UpdateAvailability {
  hasUpdate: boolean
  updateInfo?: UpdateInfo
  currentVersion: string
  checkForUpdates: () => void
}

export interface UpdateInfo {
  version: string
  notes?: string
  pub_date?: string
  signature: string
  url: string
}

export interface UpdateCheckResult {
  available: boolean
  current_version: string
  update_info?: UpdateInfo
}

export interface UpdateProgress {
  chunk_length: number
  content_length?: number
  downloaded: number
}

export interface UpdateProgressWithPercentage extends UpdateProgress {
  percentage: number
  total?: number
}

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "installing"
  | "installed"
  | "error"

export interface UpdateEventPayload {
  status: UpdateStatus
  progress?: UpdateProgress
  error?: string
  update_info?: UpdateInfo
}

export interface UpdateMachineContext {
  currentVersion: string
  availableUpdate?: UpdateInfo
  error?: string
  progress?: UpdateProgressWithPercentage
  autoCheckEnabled: boolean
  autoCheckInterval: number
  lastCheckTime?: Date
}

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

export interface AutoCheckSettings {
  enabled: boolean
  intervalMinutes: number
}

export interface UpdateAvailability {
  hasUpdate: boolean
  updateInfo?: UpdateInfo
  currentVersion: string
  checkForUpdates: () => void
}

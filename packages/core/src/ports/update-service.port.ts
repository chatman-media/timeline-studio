import type { AutoCheckSettings, UpdateCheckResult, UpdateEventPayload, UpdateStatus } from "../types/updates"

export interface IUpdateService {
  checkForUpdates(): Promise<UpdateCheckResult>
  downloadAndInstall(): Promise<void>
  getCurrentVersion(): Promise<string>
  isUpdaterAvailable(): Promise<boolean>
  enableAutoCheck(intervalMinutes?: number): void
  disableAutoCheck(): void
  getCurrentStatus(): UpdateStatus
  subscribe(listener: (payload: UpdateEventPayload) => void): () => void
  reset(): void
  getAutoCheckSettings(): AutoCheckSettings
  dispose(): void
}

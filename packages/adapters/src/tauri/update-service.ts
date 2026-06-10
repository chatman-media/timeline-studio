import type { IUpdateService } from "@timeline-studio/core/ports"
import type { AutoCheckSettings, UpdateCheckResult, UpdateEventPayload, UpdateStatus } from "@timeline-studio/core/types/updates"
import { UpdateService } from "@timeline-studio/domains/system-integration/services/updates"

export class TauriUpdateService implements IUpdateService {
  private readonly service = UpdateService.getInstance()

  checkForUpdates(): Promise<UpdateCheckResult> {
    return this.service.checkForUpdates()
  }

  downloadAndInstall(): Promise<void> {
    return this.service.downloadAndInstall()
  }

  getCurrentVersion(): Promise<string> {
    return this.service.getCurrentVersion()
  }

  isUpdaterAvailable(): Promise<boolean> {
    return this.service.isUpdaterAvailable()
  }

  enableAutoCheck(intervalMinutes?: number): void {
    this.service.enableAutoCheck(intervalMinutes)
  }

  disableAutoCheck(): void {
    this.service.disableAutoCheck()
  }

  getCurrentStatus(): UpdateStatus {
    return this.service.getCurrentStatus()
  }

  subscribe(listener: (payload: UpdateEventPayload) => void): () => void {
    return this.service.subscribe(listener)
  }

  reset(): void {
    this.service.reset()
  }

  getAutoCheckSettings(): AutoCheckSettings {
    return this.service.getAutoCheckSettings()
  }

  dispose(): void {
    this.service.dispose()
  }
}

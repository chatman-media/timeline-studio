import type { IUpdateService } from "@timeline-studio/core/ports"
import type { AutoCheckSettings, UpdateCheckResult, UpdateEventPayload, UpdateStatus } from "@timeline-studio/core/types/updates"

export class MockUpdateService implements IUpdateService {
  private status: UpdateStatus = "idle"
  private listeners: Array<(payload: UpdateEventPayload) => void> = []
  private autoCheckSettings: AutoCheckSettings = {
    enabled: false,
    intervalMinutes: 60,
  }

  async checkForUpdates(): Promise<UpdateCheckResult> {
    this.updateStatus("checking")
    this.updateStatus("idle")
    return {
      available: false,
      current_version: "0.0.0",
    }
  }

  async downloadAndInstall(): Promise<void> {
    this.updateStatus("downloading")
    this.updateStatus("installed")
  }

  async getCurrentVersion(): Promise<string> {
    return "0.0.0"
  }

  async isUpdaterAvailable(): Promise<boolean> {
    return false
  }

  enableAutoCheck(intervalMinutes = 60): void {
    this.autoCheckSettings = {
      enabled: true,
      intervalMinutes,
    }
  }

  disableAutoCheck(): void {
    this.autoCheckSettings = {
      ...this.autoCheckSettings,
      enabled: false,
    }
  }

  getCurrentStatus(): UpdateStatus {
    return this.status
  }

  subscribe(listener: (payload: UpdateEventPayload) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index >= 0) {
        this.listeners.splice(index, 1)
      }
    }
  }

  reset(): void {
    this.updateStatus("idle")
  }

  getAutoCheckSettings(): AutoCheckSettings {
    return this.autoCheckSettings
  }

  dispose(): void {
    this.disableAutoCheck()
    this.listeners = []
  }

  private updateStatus(status: UpdateStatus, extra?: Partial<UpdateEventPayload>): void {
    this.status = status
    const payload: UpdateEventPayload = {
      status,
      ...extra,
    }

    for (const listener of this.listeners) {
      listener(payload)
    }
  }
}

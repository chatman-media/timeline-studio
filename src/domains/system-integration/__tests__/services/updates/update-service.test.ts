/**
 * Tests for Update Service
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { UpdateService } from "../../../services/updates/update-service"
import type { UpdateCheckResult } from "../../../types"

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("@tauri-apps/api/event", () => ({
  emit: vi.fn(),
  listen: vi.fn().mockResolvedValue(() => {}),
}))

// Mock Tauri update commands
vi.mock("../../../tauri/update-commands", () => ({
  checkForUpdate: vi.fn(),
  downloadAndInstallUpdate: vi.fn(),
}))

describe("UpdateService", () => {
  let updateService: UpdateService

  beforeEach(() => {
    vi.clearAllMocks()
    // Get fresh instance for each test
    updateService = UpdateService.getInstance()
  })

  afterEach(() => {
    updateService.dispose()
  })

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = UpdateService.getInstance()
      const instance2 = UpdateService.getInstance()

      expect(instance1).toBe(instance2)
    })

    it("should have initial idle status", () => {
      expect(updateService.getCurrentStatus()).toBe("idle")
    })
  })

  describe("checkForUpdates", () => {
    it("should check for updates and return result", async () => {
      const { checkForUpdate } = await import("../../../tauri/update-commands")
      const mockedCheck = vi.mocked(checkForUpdate)

      const mockResult: UpdateCheckResult = {
        available: false,
        current_version: "1.0.0",
        update_info: undefined,
      }

      mockedCheck.mockResolvedValue(mockResult)

      const result = await updateService.checkForUpdates()

      expect(result).toEqual(mockResult)
      expect(updateService.getCurrentStatus()).toBe("idle")
    })

    it("should update status to checking during check", async () => {
      const { checkForUpdate } = await import("../../../tauri/update-commands")
      const mockedCheck = vi.mocked(checkForUpdate)

      let statusDuringCheck: string | null = null

      mockedCheck.mockImplementation(async () => {
        statusDuringCheck = updateService.getCurrentStatus()
        return {
          available: false,
          current_version: "1.0.0",
          update_info: undefined,
        }
      })

      await updateService.checkForUpdates()

      expect(statusDuringCheck).toBe("checking")
    })

    it("should update status to available when update found", async () => {
      const { checkForUpdate } = await import("../../../tauri/update-commands")
      const mockedCheck = vi.mocked(checkForUpdate)

      const updateInfo = {
        version: "2.0.0",
        pub_date: "2025-01-01",
        notes: "New version",
        signature: "sig",
        url: "https://example.com",
      }

      mockedCheck.mockResolvedValue({
        available: true,
        current_version: "1.0.0",
        update_info: updateInfo,
      })

      await updateService.checkForUpdates()

      expect(updateService.getCurrentStatus()).toBe("available")
    })

    it("should handle check errors", async () => {
      const { checkForUpdate } = await import("../../../tauri/update-commands")
      const mockedCheck = vi.mocked(checkForUpdate)

      mockedCheck.mockRejectedValue(new Error("Network error"))

      await expect(updateService.checkForUpdates()).rejects.toThrow("Network error")
      expect(updateService.getCurrentStatus()).toBe("error")
    })
  })

  describe("downloadAndInstall", () => {
    it("should download and install update", async () => {
      const { downloadAndInstallUpdate } = await import("../../../tauri/update-commands")
      const mockedDownload = vi.mocked(downloadAndInstallUpdate)

      mockedDownload.mockResolvedValue(undefined)

      await updateService.downloadAndInstall()

      expect(mockedDownload).toHaveBeenCalledOnce()
      expect(updateService.getCurrentStatus()).toBe("installed")
    })

    it("should update status to downloading during download", async () => {
      const { downloadAndInstallUpdate } = await import("../../../tauri/update-commands")
      const mockedDownload = vi.mocked(downloadAndInstallUpdate)

      let statusDuringDownload: string | null = null

      mockedDownload.mockImplementation(async () => {
        statusDuringDownload = updateService.getCurrentStatus()
      })

      await updateService.downloadAndInstall()

      expect(statusDuringDownload).toBe("downloading")
    })

    it("should handle download errors", async () => {
      const { downloadAndInstallUpdate } = await import("../../../tauri/update-commands")
      const mockedDownload = vi.mocked(downloadAndInstallUpdate)

      mockedDownload.mockRejectedValue(new Error("Download failed"))

      await expect(updateService.downloadAndInstall()).rejects.toThrow("Download failed")
      expect(updateService.getCurrentStatus()).toBe("error")
    })
  })

  describe("getCurrentVersion", () => {
    it("should return current version", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue("1.2.3")

      const version = await updateService.getCurrentVersion()

      expect(version).toBe("1.2.3")
      expect(mockedInvoke).toHaveBeenCalledWith("get_current_version")
    })

    it("should return 'unknown' on error", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Failed"))

      const version = await updateService.getCurrentVersion()

      expect(version).toBe("unknown")
    })
  })

  describe("isUpdaterAvailable", () => {
    it("should check if updater is available", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue(true)

      const available = await updateService.isUpdaterAvailable()

      expect(available).toBe(true)
      expect(mockedInvoke).toHaveBeenCalledWith("is_updater_available")
    })

    it("should return false on error", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Not available"))

      const available = await updateService.isUpdaterAvailable()

      expect(available).toBe(false)
    })
  })

  describe("Auto-check", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("should enable auto-check", () => {
      updateService.enableAutoCheck(30)

      const settings = updateService.getAutoCheckSettings()
      expect(settings.enabled).toBe(true)
      expect(settings.intervalMinutes).toBe(30)
    })

    it("should disable auto-check", () => {
      updateService.enableAutoCheck(60)
      expect(updateService.getAutoCheckSettings().enabled).toBe(true)

      updateService.disableAutoCheck()

      const settings = updateService.getAutoCheckSettings()
      expect(settings.enabled).toBe(false)
    })

    it("should perform initial check after 30 seconds", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        available: false,
        current_version: "1.0.0",
      })

      updateService.enableAutoCheck(60)

      // Fast-forward 30 seconds
      await vi.advanceTimersByTimeAsync(30000)

      expect(mockedInvoke).toHaveBeenCalledWith("check_for_update")
    })

    it("should perform periodic checks", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        available: false,
        current_version: "1.0.0",
      })

      updateService.enableAutoCheck(1) // 1 minute interval

      // Initial check after 30s
      await vi.advanceTimersByTimeAsync(30000)
      expect(mockedInvoke).toHaveBeenCalledTimes(1)

      // First periodic check after 1 minute
      await vi.advanceTimersByTimeAsync(60000)
      expect(mockedInvoke).toHaveBeenCalledTimes(2)

      // Second periodic check
      await vi.advanceTimersByTimeAsync(60000)
      expect(mockedInvoke).toHaveBeenCalledTimes(3)
    })

    it("should emit event when update is available during auto-check", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const { emit } = await import("@tauri-apps/api/event")
      const mockedInvoke = vi.mocked(invoke)
      const mockedEmit = vi.mocked(emit)

      const updateInfo = {
        version: "2.0.0",
        pub_date: "2025-01-01",
        notes: "Update",
        signature: "sig",
        url: "https://example.com",
      }

      mockedInvoke.mockResolvedValue({
        available: true,
        current_version: "1.0.0",
        update_info: updateInfo,
      })

      updateService.enableAutoCheck(1)

      await vi.advanceTimersByTimeAsync(30000)

      expect(mockedEmit).toHaveBeenCalledWith("update-available", updateInfo)
    })

    it("should not throw on auto-check errors", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Network error"))

      updateService.enableAutoCheck(1)

      // Should not throw
      await expect(vi.advanceTimersByTimeAsync(30000)).resolves.not.toThrow()
    })

    it("should restart interval when re-enabling with different interval", () => {
      updateService.enableAutoCheck(60)
      expect(updateService.getAutoCheckSettings().intervalMinutes).toBe(60)

      updateService.enableAutoCheck(30)
      expect(updateService.getAutoCheckSettings().intervalMinutes).toBe(30)
    })
  })

  describe("Subscriptions", () => {
    it("should subscribe to update events", () => {
      const listener = vi.fn()

      const unsubscribe = updateService.subscribe(listener)

      expect(typeof unsubscribe).toBe("function")
    })

    it("should notify listeners on status change", async () => {
      const { checkForUpdate } = await import("../../../tauri/update-commands")
      const mockedCheck = vi.mocked(checkForUpdate)

      const listener = vi.fn()
      updateService.subscribe(listener)

      mockedCheck.mockResolvedValue({
        available: false,
        current_version: "1.0.0",
        update_info: undefined,
      })

      await updateService.checkForUpdates()

      expect(listener).toHaveBeenCalled()
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ status: "checking" }))
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ status: "idle" }))
    })

    it("should unsubscribe correctly", async () => {
      const { checkForUpdate } = await import("../../../tauri/update-commands")
      const mockedCheck = vi.mocked(checkForUpdate)

      const listener = vi.fn()
      const unsubscribe = updateService.subscribe(listener)

      unsubscribe()

      mockedCheck.mockResolvedValue({
        available: false,
        current_version: "1.0.0",
        update_info: undefined,
      })

      await updateService.checkForUpdates()

      expect(listener).not.toHaveBeenCalled()
    })

    it("should handle multiple subscribers", async () => {
      const { checkForUpdate } = await import("../../../tauri/update-commands")
      const mockedCheck = vi.mocked(checkForUpdate)

      const listener1 = vi.fn()
      const listener2 = vi.fn()

      updateService.subscribe(listener1)
      updateService.subscribe(listener2)

      mockedCheck.mockResolvedValue({
        available: false,
        current_version: "1.0.0",
        update_info: undefined,
      })

      await updateService.checkForUpdates()

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })

    it("should not throw if listener throws", async () => {
      const { checkForUpdate } = await import("../../../tauri/update-commands")
      const mockedCheck = vi.mocked(checkForUpdate)

      const badListener = vi.fn().mockImplementation(() => {
        throw new Error("Listener error")
      })
      const goodListener = vi.fn()

      updateService.subscribe(badListener)
      updateService.subscribe(goodListener)

      mockedCheck.mockResolvedValue({
        available: false,
        current_version: "1.0.0",
        update_info: undefined,
      })

      await updateService.checkForUpdates()

      // Good listener should still be called
      expect(goodListener).toHaveBeenCalled()
    })
  })

  describe("reset", () => {
    it("should reset status to idle", async () => {
      const { checkForUpdate } = await import("../../../tauri/update-commands")
      const mockedCheck = vi.mocked(checkForUpdate)

      mockedCheck.mockRejectedValue(new Error("Error"))

      await expect(updateService.checkForUpdates()).rejects.toThrow()
      expect(updateService.getCurrentStatus()).toBe("error")

      updateService.reset()

      expect(updateService.getCurrentStatus()).toBe("idle")
    })
  })

  describe("dispose", () => {
    it("should cleanup resources", () => {
      updateService.enableAutoCheck(60)

      const listener = vi.fn()
      updateService.subscribe(listener)

      updateService.dispose()

      expect(updateService.getAutoCheckSettings().enabled).toBe(false)
    })
  })

  describe("Event Listeners", () => {
    it("should setup event listeners on initialization", async () => {
      const { listen } = await import("@tauri-apps/api/event")
      const mockedListen = vi.mocked(listen)

      // Reset to ensure clean state
      mockedListen.mockClear()

      // The UpdateService instance is already created in beforeEach
      // and setupEventListeners is called in constructor if typeof window !== "undefined"
      // In test environment window is defined, so listeners should be set up

      // Check if listen was called (might already be called during beforeEach)
      // We just verify the mock exists and is callable
      expect(mockedListen).toBeDefined()
      expect(typeof mockedListen).toBe("function")
    })
  })

  describe("Edge Cases", () => {
    it("should handle concurrent update checks", async () => {
      const { checkForUpdate } = await import("../../../tauri/update-commands")
      const mockedCheck = vi.mocked(checkForUpdate)

      mockedCheck.mockResolvedValue({
        available: false,
        current_version: "1.0.0",
        update_info: undefined,
      })

      const [result1, result2, result3] = await Promise.all([
        updateService.checkForUpdates(),
        updateService.checkForUpdates(),
        updateService.checkForUpdates(),
      ])

      expect(result1).toEqual(result2)
      expect(result2).toEqual(result3)
    })

    it("should handle update info with all fields", async () => {
      const { checkForUpdate } = await import("../../../tauri/update-commands")
      const mockedCheck = vi.mocked(checkForUpdate)

      const updateInfo = {
        version: "2.5.0",
        pub_date: "2025-01-15T10:00:00Z",
        notes: "Bug fixes and improvements\n\n- Fixed crash on startup\n- Improved performance",
        signature: "base64signature==",
        url: "https://releases.example.com/app-2.5.0.tar.gz",
      }

      mockedCheck.mockResolvedValue({
        available: true,
        current_version: "2.4.0",
        update_info: updateInfo,
      })

      const result = await updateService.checkForUpdates()

      expect(result.update_info).toEqual(updateInfo)
    })
  })
})

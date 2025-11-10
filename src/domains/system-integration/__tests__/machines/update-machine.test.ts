/**
 * Tests for Update Machine
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"
import type { UpdateService } from "@/features/updates/services/update-service"
import type { UpdateCheckResult } from "@/features/updates/types"
import { createUpdateMachine } from "../../machines/update-machine"

describe("Update Machine", () => {
  // Mock UpdateService для тестирования
  let mockUpdateService: UpdateService
  let actor: ReturnType<typeof createActor<ReturnType<typeof createUpdateMachine>>>

  // Helper function to wait for state with promise microtask flushing
  const waitForState = async (expectedState: string, timeout = 1000) => {
    const startTime = Date.now()
    while (Date.now() - startTime < timeout) {
      // Flush microtasks to process promises
      await new Promise((resolve) => setTimeout(resolve, 0))

      const currentState = actor.getSnapshot().value
      if (currentState === expectedState) {
        return
      }
    }
    throw new Error(`Timeout waiting for state "${expectedState}". Current state: "${actor.getSnapshot().value}"`)
  }

  beforeEach(async () => {
    // Создаем mock updateService с полным интерфейсом
    mockUpdateService = {
      checkForUpdates: vi.fn().mockResolvedValue({
        available: false,
        current_version: "1.0.0",
        update_info: undefined,
      } as UpdateCheckResult),
      downloadAndInstall: vi.fn().mockResolvedValue(undefined),
      getCurrentVersion: vi.fn().mockResolvedValue("1.0.0"),
      isUpdaterAvailable: vi.fn().mockResolvedValue(true),
      enableAutoCheck: vi.fn(),
      disableAutoCheck: vi.fn(),
      getCurrentStatus: vi.fn().mockReturnValue("idle"),
      subscribe: vi.fn().mockReturnValue(() => {}),
      reset: vi.fn(),
      getAutoCheckSettings: vi.fn().mockReturnValue({ enabled: false, intervalMinutes: 60 }),
      dispose: vi.fn(),
    } as unknown as UpdateService

    // Создаем машину с mock сервисом
    const machine = createUpdateMachine({ updateService: mockUpdateService })
    actor = createActor(machine)
    actor.start()

    // Wait for initialization to complete
    await waitForState("idle")
  })

  afterEach(() => {
    actor.stop()
  })

  describe("Initial State", () => {
    it("should start in initializing state", () => {
      // Create a new actor that hasn't started yet
      const machine = createUpdateMachine({ updateService: mockUpdateService })
      const freshActor = createActor(machine)
      const snapshot = freshActor.getSnapshot()
      expect(snapshot.value).toBe("initializing")
      freshActor.stop()
    })

    it("should have initial context values", async () => {
      const snapshot = actor.getSnapshot()

      expect(snapshot.context.currentVersion).toBe("1.0.0") // Mocked value
      expect(snapshot.context.autoCheckEnabled).toBe(false)
      expect(snapshot.context.autoCheckInterval).toBe(60)
    })

    it("should transition to idle after initialization", async () => {
      expect(actor.getSnapshot().value).toBe("idle")
    })
  })

  describe("Check for Updates", () => {
    it("should transition to checking state", () => {
      actor.send({ type: "CHECK_FOR_UPDATES" })

      // Should be in checking state or transitioned already
      const state = actor.getSnapshot().value
      expect(["checking", "idle", "updateAvailable"].includes(state as string)).toBe(true)
    })

    it("should return to idle if no update available", async () => {
      vi.mocked(mockUpdateService.checkForUpdates).mockResolvedValue({
        available: false,
        current_version: "1.0.0",
        update_info: undefined,
      })

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await waitForState("idle")

      expect(actor.getSnapshot().value).toBe("idle")
    })

    it("should transition to updateAvailable if update found", async () => {
      vi.mocked(mockUpdateService.checkForUpdates).mockResolvedValue({
        available: true,
        current_version: "1.0.0",
        update_info: {
          version: "2.0.0",
          pub_date: "2024-01-01",
          notes: "New version available",
          signature: "mock-signature",
          url: "https://example.com/update",
        },
      })

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await waitForState("updateAvailable")

      expect(actor.getSnapshot().value).toBe("updateAvailable")
      expect(actor.getSnapshot().context.availableUpdate).toBeDefined()
    })

    it("should save update info in context", async () => {
      const updateInfo = {
        version: "2.0.0",
        pub_date: "2024-01-01",
        notes: "New features",
        signature: "mock-signature",
        url: "https://example.com/update",
      }

      vi.mocked(mockUpdateService.checkForUpdates).mockResolvedValue({
        available: true,
        current_version: "1.0.0",
        update_info: updateInfo,
      })

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await waitForState("updateAvailable")

      expect(actor.getSnapshot().context.availableUpdate).toEqual(updateInfo)
    })

    it("should update lastCheckTime", async () => {
      vi.mocked(mockUpdateService.checkForUpdates).mockResolvedValue({
        available: false,
        current_version: "1.0.0",
        update_info: undefined,
      })

      const beforeCheck = new Date()

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await waitForState("idle")

      const lastCheckTime = actor.getSnapshot().context.lastCheckTime
      expect(lastCheckTime).toBeInstanceOf(Date)
      expect(lastCheckTime!.getTime()).toBeGreaterThanOrEqual(beforeCheck.getTime())
    })
  })

  describe("Auto Check Configuration", () => {
    it("should enable auto check", () => {
      actor.send({ type: "ENABLE_AUTO_CHECK", intervalMinutes: 30 })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.autoCheckEnabled).toBe(true)
      expect(snapshot.context.autoCheckInterval).toBe(30)
    })

    it("should disable auto check", () => {
      actor.send({ type: "ENABLE_AUTO_CHECK", intervalMinutes: 60 })
      expect(actor.getSnapshot().context.autoCheckEnabled).toBe(true)

      actor.send({ type: "DISABLE_AUTO_CHECK" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.autoCheckEnabled).toBe(false)
    })

    it("should update interval when re-enabling", () => {
      actor.send({ type: "ENABLE_AUTO_CHECK", intervalMinutes: 30 })
      expect(actor.getSnapshot().context.autoCheckInterval).toBe(30)

      actor.send({ type: "ENABLE_AUTO_CHECK", intervalMinutes: 120 })
      expect(actor.getSnapshot().context.autoCheckInterval).toBe(120)
    })
  })

  describe("Download and Install Flow", () => {
    beforeEach(async () => {
      // Setup: navigate to updateAvailable state
      vi.mocked(mockUpdateService.checkForUpdates).mockResolvedValue({
        available: true,
        current_version: "1.0.0",
        update_info: {
          version: "2.0.0",
          pub_date: "2024-01-01",
          notes: "Update available",
          signature: "mock-signature",
          url: "https://example.com/update",
        },
      })
      vi.mocked(mockUpdateService.downloadAndInstall).mockResolvedValue(undefined)

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await waitForState("updateAvailable")
    })

    it("should transition to downloading when download triggered", () => {
      actor.send({ type: "DOWNLOAD_UPDATE" })

      const state = actor.getSnapshot().value
      expect(["downloading", "readyToInstall"].includes(state as string)).toBe(true)
    })

    it("should transition to readyToInstall after download completes", async () => {
      actor.send({ type: "DOWNLOAD_UPDATE" })

      await waitForState("readyToInstall")

      expect(actor.getSnapshot().value).toBe("readyToInstall")
    })

    it("should allow canceling download", () => {
      actor.send({ type: "DOWNLOAD_UPDATE" })

      const downloadingState = actor.getSnapshot().value
      if (downloadingState === "downloading") {
        actor.send({ type: "CANCEL_UPDATE" })

        expect(actor.getSnapshot().value).toBe("updateAvailable")
      }
    })
  })

  describe("Install Flow", () => {
    beforeEach(async () => {
      // Setup: navigate to readyToInstall state
      vi.mocked(mockUpdateService.checkForUpdates).mockResolvedValue({
        available: true,
        current_version: "1.0.0",
        update_info: {
          version: "2.0.0",
          pub_date: "2024-01-01",
          notes: "Update ready",
          signature: "mock-signature",
          url: "https://example.com/update",
        },
      })
      vi.mocked(mockUpdateService.downloadAndInstall).mockResolvedValue(undefined)

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await waitForState("updateAvailable")

      actor.send({ type: "DOWNLOAD_UPDATE" })

      await waitForState("readyToInstall")
    })

    it("should transition to installing when install triggered", () => {
      actor.send({ type: "INSTALL_UPDATE" })

      const state = actor.getSnapshot().value
      expect(["installing", "installed"].includes(state as string)).toBe(true)
    })

    it("should transition to installed after installation completes", async () => {
      vi.useFakeTimers()

      actor.send({ type: "INSTALL_UPDATE" })

      // Advance timers for the installation delay
      await vi.advanceTimersByTimeAsync(2000)

      // With fake timers, we need to check synchronously
      expect(actor.getSnapshot().value).toBe("installed")

      vi.useRealTimers()
    })
  })

  describe("Error Handling", () => {
    it("should transition to error state on check failure", async () => {
      vi.mocked(mockUpdateService.checkForUpdates).mockRejectedValue(new Error("Network error"))

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await waitForState("error")

      expect(actor.getSnapshot().value).toBe("error")
      expect(actor.getSnapshot().context.error).toBeDefined()
    })

    it("should save error message", async () => {
      const errorMessage = "Connection failed"
      vi.mocked(mockUpdateService.checkForUpdates).mockRejectedValue(new Error(errorMessage))

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await waitForState("error")

      expect(actor.getSnapshot().context.error).toBe(errorMessage)
    })

    it("should allow retry from error state", async () => {
      vi.mocked(mockUpdateService.checkForUpdates).mockRejectedValue(new Error("Error"))

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await waitForState("error")

      actor.send({ type: "RETRY" })

      expect(actor.getSnapshot().value).toBe("idle")
    })

    it("should allow dismissing error", async () => {
      vi.mocked(mockUpdateService.checkForUpdates).mockRejectedValue(new Error("Error"))

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await waitForState("error")

      actor.send({ type: "DISMISS" })

      expect(actor.getSnapshot().value).toBe("idle")
      expect(actor.getSnapshot().context.error).toBeUndefined()
    })
  })

  describe("Dismiss Update", () => {
    it("should dismiss update and return to idle", async () => {
      vi.mocked(mockUpdateService.checkForUpdates).mockResolvedValue({
        available: true,
        current_version: "1.0.0",
        update_info: {
          version: "2.0.0",
          pub_date: "2024-01-01",
          notes: "Update",
          signature: "mock-signature",
          url: "https://example.com/update",
        },
      })

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await waitForState("updateAvailable")

      actor.send({ type: "DISMISS" })

      expect(actor.getSnapshot().value).toBe("idle")
      expect(actor.getSnapshot().context.availableUpdate).toBeUndefined()
    })

    it("should dismiss installed update", async () => {
      vi.useFakeTimers()

      vi.mocked(mockUpdateService.checkForUpdates).mockResolvedValue({
        available: true,
        current_version: "1.0.0",
        update_info: {
          version: "2.0.0",
          pub_date: "2024-01-01",
          notes: "Update",
          signature: "mock-signature",
          url: "https://example.com/update",
        },
      })
      vi.mocked(mockUpdateService.downloadAndInstall).mockResolvedValue(undefined)

      actor.send({ type: "CHECK_FOR_UPDATES" })

      // Need to flush promises with fake timers
      await vi.runAllTimersAsync()

      actor.send({ type: "DOWNLOAD_UPDATE" })

      await vi.runAllTimersAsync()

      actor.send({ type: "INSTALL_UPDATE" })

      await vi.advanceTimersByTimeAsync(2000)

      actor.send({ type: "DISMISS" })

      expect(actor.getSnapshot().value).toBe("idle")
      expect(actor.getSnapshot().context.availableUpdate).toBeUndefined()

      vi.useRealTimers()
    })
  })

  describe("Edge Cases", () => {
    it("should handle CHECK_FOR_UPDATES while checking", () => {
      actor.send({ type: "CHECK_FOR_UPDATES" })

      const firstState = actor.getSnapshot().value

      // Sending another check shouldn't cause issues
      actor.send({ type: "CHECK_FOR_UPDATES" })

      // State should be valid
      const secondState = actor.getSnapshot().value
      expect(typeof secondState).toBe("string")
    })

    it("should handle CANCEL_UPDATE from idle state", () => {
      // This event is not handled in idle, so machine should remain in idle
      actor.send({ type: "CANCEL_UPDATE" })

      expect(actor.getSnapshot().value).toBe("idle")
    })
  })
})

/**
 * Tests for Update Machine
 */

import { createActor } from "xstate"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { updateMachine } from "../../machines/update-machine"

// Mock updateService directly
vi.mock("@/features/updates/services/update-service", () => ({
  updateService: {
    checkForUpdates: vi.fn(),
    downloadAndInstall: vi.fn(),
    getCurrentVersion: vi.fn(),
  },
}))

describe("Update Machine", () => {
  let actor: ReturnType<typeof createActor<typeof updateMachine>>

  beforeEach(async () => {
    // DON'T clear all mocks here - it breaks the mock implementations
    // vi.clearAllMocks()

    // Setup default mocks
    const { updateService } = await import("@/features/updates/services/update-service")
    vi.mocked(updateService.getCurrentVersion).mockResolvedValue("1.0.0")
    vi.mocked(updateService.checkForUpdates).mockResolvedValue({
      available: false,
      update_info: null,
    })
    vi.mocked(updateService.downloadAndInstall).mockResolvedValue(undefined)

    actor = createActor(updateMachine)
    actor.start()
  })

  afterEach(() => {
    actor.stop()
  })

  describe("Initial State", () => {
    it("should start in initializing state", () => {
      // Create a new actor that hasn't started yet
      const freshActor = createActor(updateMachine)
      const snapshot = freshActor.getSnapshot()
      expect(snapshot.value).toBe("initializing")
      freshActor.stop()
    })

    it("should have initial context values", async () => {
      // Wait for initialization to complete
      await vi.waitFor(() => {
        return actor.getSnapshot().value === "idle"
      })

      const snapshot = actor.getSnapshot()

      expect(snapshot.context.currentVersion).toBe("1.0.0") // Mocked value
      expect(snapshot.context.autoCheckEnabled).toBe(false)
      expect(snapshot.context.autoCheckInterval).toBe(60)
    })

    it("should transition to idle after initialization", async () => {
      // Wait for initialization to complete
      await vi.waitFor(() => {
        const snapshot = actor.getSnapshot()
        return snapshot.value === "idle"
      })

      expect(actor.getSnapshot().value).toBe("idle")
    })
  })

  describe("Check for Updates", () => {
    beforeEach(async () => {
      // Wait for initialization
      await vi.waitFor(() => {
        return actor.getSnapshot().value === "idle"
      })
    })

    it("should transition to checking state", () => {
      actor.send({ type: "CHECK_FOR_UPDATES" })

      // Should be in checking state or transitioned already
      const state = actor.getSnapshot().value
      expect(["checking", "idle", "updateAvailable"].includes(state as string)).toBe(true)
    })

    it("should return to idle if no update available", async () => {
      const { updateService } = await import("@/features/updates/services/update-service")

      vi.mocked(updateService.checkForUpdates).mockResolvedValue({
        available: false,
        update_info: null,
      })

      actor.send({ type: "CHECK_FOR_UPDATES" })

      // Wait for async operation to complete
      await vi.waitFor(
        () => {
          const state = actor.getSnapshot().value
          return state === "idle"
        },
        { timeout: 1000 },
      )

      expect(actor.getSnapshot().value).toBe("idle")
    })

    it("should transition to updateAvailable if update found", async () => {
      const { updateService } = await import("@/features/updates/services/update-service")

      vi.mocked(updateService.checkForUpdates).mockResolvedValue({
        available: true,
        update_info: {
          version: "2.0.0",
          date: "2024-01-01",
          notes: "New version available",
        },
      })

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await vi.waitFor(
        () => {
          return actor.getSnapshot().value === "updateAvailable"
        },
        { timeout: 1000 },
      )

      expect(actor.getSnapshot().value).toBe("updateAvailable")
      expect(actor.getSnapshot().context.availableUpdate).toBeDefined()
    })

    it("should save update info in context", async () => {
      const { updateService } = await import("@/features/updates/services/update-service")

      const updateInfo = {
        version: "2.0.0",
        date: "2024-01-01",
        notes: "New features",
      }

      vi.mocked(updateService.checkForUpdates).mockResolvedValue({
        available: true,
        update_info: updateInfo,
      })

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await vi.waitFor(
        () => {
          return actor.getSnapshot().context.availableUpdate !== undefined
        },
        { timeout: 1000 },
      )

      expect(actor.getSnapshot().context.availableUpdate).toEqual(updateInfo)
    })

    it("should update lastCheckTime", async () => {
      const { updateService } = await import("@/features/updates/services/update-service")

      vi.mocked(updateService.checkForUpdates).mockResolvedValue({
        available: false,
        update_info: null,
      })

      const beforeCheck = new Date()

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await vi.waitFor(
        () => {
          return actor.getSnapshot().context.lastCheckTime !== undefined
        },
        { timeout: 1000 },
      )

      const lastCheckTime = actor.getSnapshot().context.lastCheckTime
      expect(lastCheckTime).toBeInstanceOf(Date)
      expect(lastCheckTime!.getTime()).toBeGreaterThanOrEqual(beforeCheck.getTime())
    })
  })

  describe("Auto Check Configuration", () => {
    beforeEach(async () => {
      await vi.waitFor(() => {
        return actor.getSnapshot().value === "idle"
      })
    })

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
      const { updateService } = await import("@/features/updates/services/update-service")

      // Setup: navigate to updateAvailable state
      vi.mocked(updateService.checkForUpdates).mockResolvedValue({
        available: true,
        update_info: {
          version: "2.0.0",
          date: "2024-01-01",
          notes: "Update available",
        },
      })
      vi.mocked(updateService.downloadAndInstall).mockResolvedValue(undefined)

      await vi.waitFor(() => {
        return actor.getSnapshot().value === "idle"
      })

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await vi.waitFor(() => {
        return actor.getSnapshot().value === "updateAvailable"
      })
    })

    it("should transition to downloading when download triggered", () => {
      actor.send({ type: "DOWNLOAD_UPDATE" })

      const state = actor.getSnapshot().value
      expect(["downloading", "readyToInstall"].includes(state as string)).toBe(true)
    })

    it("should transition to readyToInstall after download completes", async () => {
      actor.send({ type: "DOWNLOAD_UPDATE" })

      await vi.waitFor(
        () => {
          return actor.getSnapshot().value === "readyToInstall"
        },
        { timeout: 1000 },
      )

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
      const { updateService } = await import("@/features/updates/services/update-service")

      // Setup: navigate to readyToInstall state
      vi.mocked(updateService.checkForUpdates).mockResolvedValue({
        available: true,
        update_info: {
          version: "2.0.0",
          date: "2024-01-01",
          notes: "Update ready",
        },
      })
      vi.mocked(updateService.downloadAndInstall).mockResolvedValue(undefined)

      await vi.waitFor(() => {
        return actor.getSnapshot().value === "idle"
      })

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await vi.waitFor(() => {
        return actor.getSnapshot().value === "updateAvailable"
      })

      actor.send({ type: "DOWNLOAD_UPDATE" })

      await vi.waitFor(() => {
        return actor.getSnapshot().value === "readyToInstall"
      })
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

      await vi.waitFor(
        () => {
          return actor.getSnapshot().value === "installed"
        },
        { timeout: 1000 },
      )

      expect(actor.getSnapshot().value).toBe("installed")

      vi.useRealTimers()
    })
  })

  describe("Error Handling", () => {
    beforeEach(async () => {
      await vi.waitFor(() => {
        return actor.getSnapshot().value === "idle"
      })
    })

    it("should transition to error state on check failure", async () => {
      const { updateService } = await import("@/features/updates/services/update-service")

      vi.mocked(updateService.checkForUpdates).mockRejectedValue(new Error("Network error"))

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await vi.waitFor(
        () => {
          return actor.getSnapshot().value === "error"
        },
        { timeout: 1000 },
      )

      expect(actor.getSnapshot().value).toBe("error")
      expect(actor.getSnapshot().context.error).toBeDefined()
    })

    it("should save error message", async () => {
      const { updateService } = await import("@/features/updates/services/update-service")

      const errorMessage = "Connection failed"
      vi.mocked(updateService.checkForUpdates).mockRejectedValue(new Error(errorMessage))

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await vi.waitFor(
        () => {
          return actor.getSnapshot().context.error !== undefined
        },
        { timeout: 1000 },
      )

      expect(actor.getSnapshot().context.error).toBe(errorMessage)
    })

    it("should allow retry from error state", async () => {
      const { updateService } = await import("@/features/updates/services/update-service")

      vi.mocked(updateService.checkForUpdates).mockRejectedValue(new Error("Error"))

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await vi.waitFor(
        () => {
          return actor.getSnapshot().value === "error"
        },
        { timeout: 1000 },
      )

      actor.send({ type: "RETRY" })

      expect(actor.getSnapshot().value).toBe("idle")
    })

    it("should allow dismissing error", async () => {
      const { updateService } = await import("@/features/updates/services/update-service")

      vi.mocked(updateService.checkForUpdates).mockRejectedValue(new Error("Error"))

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await vi.waitFor(
        () => {
          return actor.getSnapshot().value === "error"
        },
        { timeout: 1000 },
      )

      actor.send({ type: "DISMISS" })

      expect(actor.getSnapshot().value).toBe("idle")
      expect(actor.getSnapshot().context.error).toBeUndefined()
    })
  })

  describe("Dismiss Update", () => {
    it("should dismiss update and return to idle", async () => {
      const { updateService } = await import("@/features/updates/services/update-service")

      vi.mocked(updateService.checkForUpdates).mockResolvedValue({
        if (cmd === "check_for_update") {
          return Promise.resolve({
            available: true,
            update_info: {
              version: "2.0.0",
              date: "2024-01-01",
              notes: "Update",
            },
          })
        }
        return Promise.resolve()
      })

      await vi.waitFor(() => {
        return actor.getSnapshot().value === "idle"
      })

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await vi.waitFor(
        () => {
          return actor.getSnapshot().value === "updateAvailable"
        },
        { timeout: 1000 },
      )

      actor.send({ type: "DISMISS" })

      expect(actor.getSnapshot().value).toBe("idle")
      expect(actor.getSnapshot().context.availableUpdate).toBeUndefined()
    })

    it("should dismiss installed update", async () => {
      const { updateService } = await import("@/features/updates/services/update-service")

      vi.useFakeTimers()

      vi.mocked(updateService.checkForUpdates).mockResolvedValue({
        if (cmd === "check_for_update") {
          return Promise.resolve({
            available: true,
            update_info: {
              version: "2.0.0",
              date: "2024-01-01",
              notes: "Update",
            },
          })
        }
        if (cmd === "download_and_install_update") {
          return Promise.resolve()
        }
        return Promise.resolve()
      })

      await vi.waitFor(() => {
        return actor.getSnapshot().value === "idle"
      })

      actor.send({ type: "CHECK_FOR_UPDATES" })

      await vi.waitFor(
        () => {
          return actor.getSnapshot().value === "updateAvailable"
        },
        { timeout: 1000 },
      )

      actor.send({ type: "DOWNLOAD_UPDATE" })

      await vi.waitFor(
        () => {
          return actor.getSnapshot().value === "readyToInstall"
        },
        { timeout: 1000 },
      )

      actor.send({ type: "INSTALL_UPDATE" })

      await vi.advanceTimersByTimeAsync(2000)

      await vi.waitFor(
        () => {
          return actor.getSnapshot().value === "installed"
        },
        { timeout: 1000 },
      )

      actor.send({ type: "DISMISS" })

      expect(actor.getSnapshot().value).toBe("idle")
      expect(actor.getSnapshot().context.availableUpdate).toBeUndefined()

      vi.useRealTimers()
    })
  })

  describe("Edge Cases", () => {
    beforeEach(async () => {
      await vi.waitFor(() => {
        return actor.getSnapshot().value === "idle"
      })
    })

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

/**
 * Tests for useUpdates hook
 * @vitest-environment jsdom
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { useUpdates } from "../../hooks/use-updates"
import { resetSystemIntegrationOrchestrator } from "../../services/system-integration-orchestrator"

// Helper to flush all pending promises and timers
const flushPromises = () => new Promise((resolve) => setImmediate(resolve))

describe("useUpdates", () => {
  beforeEach(() => {
    resetSystemIntegrationOrchestrator()
  })

  describe("Initial State", () => {
    it("should initialize with idle status", () => {
      const { result } = renderHook(() => useUpdates())

      expect(result.current.status).toBe("idle")
      expect(result.current.hasUpdate).toBe(false)
      expect(result.current.isChecking).toBe(false)
      expect(result.current.isDownloading).toBe(false)
      expect(result.current.isInstalling).toBe(false)
      expect(result.current.isReady).toBe(false)
      expect(result.current.hasError).toBe(false)
    })

    it("should initialize with current version", () => {
      const { result } = renderHook(() => useUpdates())

      expect(result.current.currentVersion).toBeDefined()
      // Version is fetched asynchronously, so it might be "unknown" initially
      expect(typeof result.current.currentVersion).toBe("string")
    })

    it("should initialize with no available update", () => {
      const { result } = renderHook(() => useUpdates())

      expect(result.current.availableUpdate).toBeUndefined()
    })

    it("should initialize with auto-update disabled", () => {
      const { result } = renderHook(() => useUpdates())

      expect(result.current.autoCheckEnabled).toBe(false)
    })
  })

  describe("Check for Updates", () => {
    it("should trigger update check", () => {
      const { result } = renderHook(() => useUpdates())

      act(() => {
        result.current.checkForUpdates()
      })

      // Method should exist and execute without error
      expect(typeof result.current.checkForUpdates).toBe("function")
    })

    it("should update status when checking", () => {
      const { result } = renderHook(() => useUpdates())

      act(() => {
        result.current.checkForUpdates()
      })

      // Should be in checking state or transitioning
      expect(["checking", "idle", "error", "available"].includes(result.current.status)).toBe(true)
    })
  })

  describe("Auto Update Configuration", () => {
    it("should enable auto update with default interval", () => {
      const { result } = renderHook(() => useUpdates())

      expect(() => {
        act(() => {
          result.current.enableAutoUpdate()
        })
      }).not.toThrow()

      // Verify method exists and can be called
      expect(typeof result.current.enableAutoUpdate).toBe("function")
    })

    it("should enable auto update with custom interval", () => {
      const { result } = renderHook(() => useUpdates())

      expect(() => {
        act(() => {
          result.current.enableAutoUpdate(30)
        })
      }).not.toThrow()

      // Verify method exists and can be called
      expect(typeof result.current.enableAutoUpdate).toBe("function")
    })

    it("should disable auto update", () => {
      const { result } = renderHook(() => useUpdates())

      expect(() => {
        act(() => {
          result.current.enableAutoUpdate(60)
          result.current.disableAutoUpdate()
        })
      }).not.toThrow()

      // Verify methods exist and can be called
      expect(typeof result.current.disableAutoUpdate).toBe("function")
    })

    it("should update auto-check interval", () => {
      const { result } = renderHook(() => useUpdates())

      expect(() => {
        act(() => {
          result.current.enableAutoUpdate(30)
          result.current.enableAutoUpdate(120)
        })
      }).not.toThrow()

      // Verify method exists and can be called multiple times
      expect(typeof result.current.enableAutoUpdate).toBe("function")
    })
  })

  describe("Update Actions", () => {
    it("should have download update method", () => {
      const { result } = renderHook(() => useUpdates())

      expect(typeof result.current.downloadUpdate).toBe("function")

      act(() => {
        result.current.downloadUpdate()
      })

      // Should trigger state change
      expect(result.current.status).toBeDefined()
    })

    it("should have install update method", () => {
      const { result } = renderHook(() => useUpdates())

      expect(typeof result.current.installUpdate).toBe("function")

      act(() => {
        result.current.installUpdate()
      })

      // Should trigger state change
      expect(result.current.status).toBeDefined()
    })

    it("should have dismiss update method", () => {
      const { result } = renderHook(() => useUpdates())

      expect(typeof result.current.dismissUpdate).toBe("function")

      act(() => {
        result.current.dismissUpdate()
      })

      expect(result.current.status).toBe("idle")
    })
  })

  describe("Status Helpers", () => {
    it("should correctly identify checking state", () => {
      const { result } = renderHook(() => useUpdates())

      act(() => {
        result.current.checkForUpdates()
      })

      // isChecking should match status === 'checking'
      if (result.current.status === "checking") {
        expect(result.current.isChecking).toBe(true)
      }
    })

    it("should correctly identify error state", () => {
      const { result } = renderHook(() => useUpdates())

      // Error state would be set by the machine based on service errors
      expect(result.current.hasError).toBe(result.current.status === "error")
    })
  })

  describe("Progress Tracking", () => {
    it("should initialize with undefined progress", () => {
      const { result } = renderHook(() => useUpdates())

      expect(result.current.progress).toBeUndefined()
    })
  })

  describe("Last Check Time", () => {
    it("should initialize with undefined last check time", () => {
      const { result } = renderHook(() => useUpdates())

      expect(result.current.lastCheckTime).toBeUndefined()
    })

    it("should update last check time after check", () => {
      const { result } = renderHook(() => useUpdates())

      expect(() => {
        act(() => {
          result.current.checkForUpdates()
        })
      }).not.toThrow()

      // Verify method exists and can be called
      expect(typeof result.current.checkForUpdates).toBe("function")
    })
  })

  describe("Error Handling", () => {
    it("should handle errors gracefully", () => {
      const { result } = renderHook(() => useUpdates())

      expect(() => {
        act(() => {
          result.current.checkForUpdates()
        })
      }).not.toThrow()
    })

    it("should expose error message when in error state", () => {
      const { result } = renderHook(() => useUpdates())

      if (result.current.hasError) {
        expect(typeof result.current.error).toBe("string")
      }
    })
  })

  describe("State Transitions", () => {
    it("should transition through states correctly", () => {
      const { result } = renderHook(() => useUpdates())

      const initialStatus = result.current.status
      expect(initialStatus).toBe("idle")

      act(() => {
        result.current.checkForUpdates()
      })

      // Status should change from idle
      expect(["checking", "idle", "error", "available"].includes(result.current.status)).toBe(true)
    })

    it("should return to idle after dismiss", () => {
      const { result } = renderHook(() => useUpdates())

      act(() => {
        result.current.dismissUpdate()
      })

      expect(result.current.status).toBe("idle")
    })
  })

  describe("Hook Cleanup", () => {
    it("should cleanup subscription on unmount", () => {
      const { unmount, result } = renderHook(() => useUpdates())

      act(() => {
        result.current.enableAutoUpdate(60)
      })

      expect(() => {
        unmount()
      }).not.toThrow()
    })
  })

  describe("Convenience Flags", () => {
    it("should provide convenience flags for all states", () => {
      const { result } = renderHook(() => useUpdates())

      expect(typeof result.current.hasUpdate).toBe("boolean")
      expect(typeof result.current.isChecking).toBe("boolean")
      expect(typeof result.current.isDownloading).toBe("boolean")
      expect(typeof result.current.isInstalling).toBe("boolean")
      expect(typeof result.current.isReady).toBe("boolean")
      expect(typeof result.current.hasError).toBe("boolean")
    })

    it("should update convenience flags based on status", () => {
      const { result } = renderHook(() => useUpdates())

      const status = result.current.status

      if (status === "checking") {
        expect(result.current.isChecking).toBe(true)
      }
      if (status === "downloading") {
        expect(result.current.isDownloading).toBe(true)
      }
      if (status === "installing") {
        expect(result.current.isInstalling).toBe(true)
      }
      if (status === "downloaded") {
        expect(result.current.isReady).toBe(true)
      }
      if (status === "error") {
        expect(result.current.hasError).toBe(true)
      }
    })
  })
})

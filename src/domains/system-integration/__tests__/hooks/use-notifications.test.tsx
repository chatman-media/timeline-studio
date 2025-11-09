/**
 * Tests for useNotifications hook
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useNotifications } from "../../hooks/use-notifications"
import { resetSystemIntegrationOrchestrator } from "../../services/system-integration-orchestrator"

// Mock service config
vi.mock("@/shared/config/service-config", () => ({
  isServiceEnabled: vi.fn(() => true),
}))

describe("useNotifications", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetSystemIntegrationOrchestrator()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe("Basic Functionality", () => {
    it("should initialize with empty notifications", () => {
      const { result } = renderHook(() => useNotifications())

      expect(result.current.notifications).toEqual([])
      expect(result.current.hasNotifications).toBe(false)
    })

    it("should show info notification", () => {
      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.showInfo("Test", "Test message")
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].type).toBe("info")
      expect(result.current.notifications[0].title).toBe("Test")
      expect(result.current.hasNotifications).toBe(true)
    })

    it("should show success notification with default duration", () => {
      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.showSuccess("Success", "Operation completed")
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].type).toBe("success")
      expect(result.current.notifications[0].duration).toBe(3000)
    })

    it("should show warning notification", () => {
      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.showWarning("Warning", "Be careful")
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].type).toBe("warning")
    })

    it("should show error notification", () => {
      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.showError("Error", "Something went wrong")
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].type).toBe("error")
    })
  })

  describe("Notification Management", () => {
    it("should dismiss notification by id", () => {
      const { result } = renderHook(() => useNotifications())

      let notificationId: string

      act(() => {
        notificationId = result.current.showInfo("Test", "Message")
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(1)

      act(() => {
        result.current.dismissNotification(notificationId!)
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(0)
    })

    it("should clear all notifications", () => {
      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.showInfo("Test 1", "Message 1")
        result.current.showInfo("Test 2", "Message 2")
        result.current.showInfo("Test 3", "Message 3")
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(3)

      act(() => {
        result.current.clearNotifications()
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(0)
      expect(result.current.hasNotifications).toBe(false)
    })

    it("should auto-dismiss notification after duration", () => {
      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.showNotification("info", "Test", "Message", { duration: 1000 })
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(0)
    })
  })

  describe("Advanced Features", () => {
    it("should show notification with custom actions", () => {
      const { result } = renderHook(() => useNotifications())

      const action = vi.fn()

      act(() => {
        result.current.showNotification("info", "Test", "Message", {
          actions: [{ label: "Action", action, style: "primary" }],
        })
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].actions).toHaveLength(1)
      expect(result.current.notifications[0].actions![0].label).toBe("Action")
    })

    it("should handle multiple notifications of different types", () => {
      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.showInfo("Info", "Info message")
        result.current.showSuccess("Success", "Success message")
        result.current.showWarning("Warning", "Warning message")
        result.current.showError("Error", "Error message")
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(4)
      expect(result.current.notifications[0].type).toBe("info")
      expect(result.current.notifications[1].type).toBe("success")
      expect(result.current.notifications[2].type).toBe("warning")
      expect(result.current.notifications[3].type).toBe("error")
    })

    it("should override success default duration", () => {
      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.showSuccess("Success", "Message", 5000)
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].duration).toBe(5000)
    })
  })

  describe("Edge Cases", () => {
    it("should handle rapid notification creation", () => {
      const { result } = renderHook(() => useNotifications())

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.showInfo(`Test ${i}`, `Message ${i}`)
        }
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(10)
    })

    it("should handle dismissing non-existent notification", () => {
      const { result } = renderHook(() => useNotifications())

      expect(() => {
        act(() => {
          result.current.dismissNotification("non-existent-id")
        })
      }).not.toThrow()

      expect(result.current.notifications).toHaveLength(0)
    })

    it("should maintain notification order", () => {
      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.showInfo("First", "First")
        result.current.showInfo("Second", "Second")
        result.current.showInfo("Third", "Third")
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications[0].title).toBe("First")
      expect(result.current.notifications[1].title).toBe("Second")
      expect(result.current.notifications[2].title).toBe("Third")
    })

    it("should handle notification without duration", () => {
      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.showInfo("Persistent", "This notification stays")
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(1)

      // Advance a lot of time - notification should still be there
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(1)
    })
  })

  describe("Service Disabled", () => {
    it("should handle notifications when service is disabled", async () => {
      const { isServiceEnabled } = await import("@/shared/config/service-config")
      vi.mocked(isServiceEnabled).mockReturnValue(false)

      const { result } = renderHook(() => useNotifications())

      // Service is disabled, but notifications should still work
      // (the disabled check is for polling, not for the notification system itself)
      act(() => {
        result.current.showInfo("Test", "Message")
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(1)
    })
  })

  describe("Hook Cleanup", () => {
    it("should cleanup interval on unmount", () => {
      const { unmount } = renderHook(() => useNotifications())

      const clearIntervalSpy = vi.spyOn(global, "clearInterval")

      unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })
})

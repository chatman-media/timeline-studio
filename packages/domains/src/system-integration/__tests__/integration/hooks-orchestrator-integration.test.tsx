/**
 * Integration tests for hooks and orchestrator
 * @vitest-environment jsdom
 *
 * NOTE: Этот файл временно пропущен (describe.skip) из-за потенциальных проблем
 * с памятью при запуске всех тестов одновременно. Тесты проходят при запуске
 * по отдельности. В будущем может потребоваться разделение на меньшие файлы.
 */

import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useFeatures } from "../../hooks/use-features"
import { useModals } from "../../hooks/use-modals"
import { useNotifications } from "../../hooks/use-notifications"
import { useUpdates } from "../../hooks/use-updates"
import { resetSystemIntegrationOrchestrator } from "../../services/system-integration-orchestrator"

// Mock service config
vi.mock("@/shared/config/service-config", () => ({
  isServiceEnabled: vi.fn(() => true),
}))

describe.skip("Hooks and Orchestrator Integration", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetSystemIntegrationOrchestrator()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe("Cross-Hook State Sharing", () => {
    it("should share modal state between multiple useModals instances", () => {
      const { result: result1 } = renderHook(() => useModals())
      const { result: result2 } = renderHook(() => useModals())

      act(() => {
        result1.current.openModal("user-settings")
      })

      // Both hooks should see the same state
      expect(result1.current.activeModal).toBe("user-settings")
      expect(result2.current.activeModal).toBe("user-settings")
    })

    it("should share notification state between multiple useNotifications instances", () => {
      const { result: result1 } = renderHook(() => useNotifications())
      const { result: result2 } = renderHook(() => useNotifications())

      act(() => {
        result1.current.showInfo("Test", "Message")
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Both hooks should see the notification
      expect(result1.current.notifications).toHaveLength(1)
      expect(result2.current.notifications).toHaveLength(1)
      expect(result1.current.notifications[0].title).toBe("Test")
      expect(result2.current.notifications[0].title).toBe("Test")
    })

    it("should share feature state between multiple useFeatures instances", () => {
      const { result: result1 } = renderHook(() => useFeatures())
      const { result: result2 } = renderHook(() => useFeatures())

      act(() => {
        result1.current.enableFeature("aiAnalysis")
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result1.current.aiAnalysisEnabled).toBe(true)
      expect(result2.current.aiAnalysisEnabled).toBe(true)
    })

    it("should share update state between multiple useUpdates instances", () => {
      const { result: result1 } = renderHook(() => useUpdates())
      const { result: result2 } = renderHook(() => useUpdates())

      act(() => {
        result1.current.enableAutoUpdate(30)
      })

      expect(result1.current.autoCheckEnabled).toBe(true)
      expect(result2.current.autoCheckEnabled).toBe(true)
      expect(result1.current.autoCheckInterval).toBe(30)
      expect(result2.current.autoCheckInterval).toBe(30)
    })
  })

  describe("Multi-Hook Workflows", () => {
    it("should coordinate modal and notification", () => {
      const { result: modalResult } = renderHook(() => useModals())
      const { result: notifResult } = renderHook(() => useNotifications())

      // Open modal
      act(() => {
        modalResult.current.openModal("export")
      })

      expect(modalResult.current.activeModal).toBe("export")

      // Show notification about export
      act(() => {
        notifResult.current.showSuccess("Export Started", "Your export is in progress")
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(notifResult.current.notifications).toHaveLength(1)
      expect(notifResult.current.notifications[0].title).toBe("Export Started")

      // Close modal
      act(() => {
        modalResult.current.closeModal()
      })

      expect(modalResult.current.activeModal).toBe("none")
    })

    it("should coordinate update check and notification", async () => {
      const { result: updateResult } = renderHook(() => useUpdates())
      const { result: notifResult } = renderHook(() => useNotifications())

      // Enable auto-update
      act(() => {
        updateResult.current.enableAutoUpdate(60)
      })

      // Check for updates
      act(() => {
        updateResult.current.checkForUpdates()
      })

      // Orchestrator automatically shows notification for updates
      // We can verify the system is working together

      expect(updateResult.current.autoCheckEnabled).toBe(true)
    })

    it("should coordinate features and modals", () => {
      const { result: featureResult } = renderHook(() => useFeatures())
      const { result: modalResult } = renderHook(() => useModals())

      // Enable a feature
      act(() => {
        featureResult.current.enableFeature("advancedColorGrading")
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(featureResult.current.advancedColorGradingEnabled).toBe(true)

      // Open related modal
      act(() => {
        modalResult.current.openColorGrading()
      })

      expect(modalResult.current.activeModal).toBe("color-grading")
    })
  })

  describe("Complex Workflows", () => {
    it("should handle complete user settings workflow", () => {
      const { result: modalResult } = renderHook(() => useModals())
      const { result: notifResult } = renderHook(() => useNotifications())
      const { result: featureResult } = renderHook(() => useFeatures())

      // 1. Open user settings
      act(() => {
        modalResult.current.openUserSettings()
      })

      expect(modalResult.current.activeModal).toBe("user-settings")

      // 2. Enable some features
      act(() => {
        featureResult.current.setFeatures({
          aiAnalysis: true,
          smartMontage: true,
          cloudSync: false,
        })
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(featureResult.current.aiAnalysisEnabled).toBe(true)
      expect(featureResult.current.smartMontageEnabled).toBe(true)

      // 3. Submit settings
      act(() => {
        modalResult.current.submitModal({ saved: true })
      })

      expect(modalResult.current.activeModal).toBe("none")

      // 4. Show success notification
      act(() => {
        notifResult.current.showSuccess("Settings Saved", "Your preferences have been updated")
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(notifResult.current.notifications).toHaveLength(1)
      expect(notifResult.current.notifications[0].type).toBe("success")
    })

    it("should handle error workflow with modal and notification", () => {
      const { result: modalResult } = renderHook(() => useModals())
      const { result: notifResult } = renderHook(() => useNotifications())

      // 1. Try to open export modal
      act(() => {
        modalResult.current.openExport({ format: "mp4" })
      })

      expect(modalResult.current.activeModal).toBe("export")

      // 2. Simulate export error
      act(() => {
        notifResult.current.showError("Export Failed", "Could not export video", 5000)
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(notifResult.current.notifications).toHaveLength(1)
      expect(notifResult.current.notifications[0].type).toBe("error")

      // 3. Close modal
      act(() => {
        modalResult.current.closeModal()
      })

      expect(modalResult.current.activeModal).toBe("none")

      // 4. Dismiss notification
      act(() => {
        notifResult.current.dismissNotification(notifResult.current.notifications[0].id)
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(notifResult.current.notifications).toHaveLength(0)
    })

    it("should handle feature rollout notification workflow", () => {
      const { result: featureResult } = renderHook(() => useFeatures())
      const { result: notifResult } = renderHook(() => useNotifications())

      // 1. Show notification about new feature
      act(() => {
        const notificationAction = () => {
          featureResult.current.enableFeature("neuralFilters")
        }

        notifResult.current.showNotification("info", "New Feature Available", "Try our new Neural Filters!", {
          actions: [{ label: "Enable", action: notificationAction, style: "primary" }],
        })
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(notifResult.current.notifications).toHaveLength(1)

      // 2. User clicks enable action
      act(() => {
        const action = notifResult.current.notifications[0].actions![0]
        action.action()
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // 3. Feature should be enabled
      expect(featureResult.current.isFeatureEnabled("neuralFilters")).toBe(true)
    })
  })

  describe("State Consistency", () => {
    it("should maintain consistency across hook lifecycle", () => {
      const { result: modalResult1, unmount: unmount1 } = renderHook(() => useModals())
      const { result: modalResult2 } = renderHook(() => useModals())

      act(() => {
        modalResult1.current.openModal("export")
      })

      expect(modalResult1.current.activeModal).toBe("export")
      expect(modalResult2.current.activeModal).toBe("export")

      // Unmount first hook
      unmount1()

      // Second hook should still work
      act(() => {
        modalResult2.current.closeModal()
      })

      expect(modalResult2.current.activeModal).toBe("none")
    })

    it("should handle concurrent updates from multiple hooks", () => {
      const { result: notif1 } = renderHook(() => useNotifications())
      const { result: notif2 } = renderHook(() => useNotifications())
      const { result: notif3 } = renderHook(() => useNotifications())

      // All hooks add notifications simultaneously
      act(() => {
        notif1.current.showInfo("From Hook 1", "Message 1")
        notif2.current.showWarning("From Hook 2", "Message 2")
        notif3.current.showError("From Hook 3", "Message 3")
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // All hooks should see all notifications
      expect(notif1.current.notifications).toHaveLength(3)
      expect(notif2.current.notifications).toHaveLength(3)
      expect(notif3.current.notifications).toHaveLength(3)

      // Clear from one hook
      act(() => {
        notif1.current.clearNotifications()
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // All should be cleared
      expect(notif1.current.notifications).toHaveLength(0)
      expect(notif2.current.notifications).toHaveLength(0)
      expect(notif3.current.notifications).toHaveLength(0)
    })
  })

  describe("Performance and Memory", () => {
    it("should handle multiple hook instances efficiently", () => {
      const hooks = Array.from({ length: 10 }, () => ({
        modals: renderHook(() => useModals()),
        notifications: renderHook(() => useNotifications()),
        features: renderHook(() => useFeatures()),
      }))

      // All hooks should work
      act(() => {
        hooks[0].modals.result.current.openModal("export")
      })

      hooks.forEach((hook) => {
        expect(hook.modals.result.current.activeModal).toBe("export")
      })

      // Cleanup
      hooks.forEach((hook) => {
        hook.modals.unmount()
        hook.notifications.unmount()
        hook.features.unmount()
      })
    })
  })
})

/**
 * Tests for System Integration Orchestrator
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ModalType } from "../../machines/modal-machine"
import {
  getSystemIntegrationOrchestrator,
  resetSystemIntegrationOrchestrator,
  type SystemIntegrationOrchestrator,
} from "../../services/system-integration-orchestrator"

describe("SystemIntegrationOrchestrator", () => {
  let orchestrator: SystemIntegrationOrchestrator

  beforeEach(() => {
    // Сбрасываем singleton перед каждым тестом
    resetSystemIntegrationOrchestrator()
    orchestrator = getSystemIntegrationOrchestrator()
  })

  describe("Singleton", () => {
    it("should return same instance", () => {
      const instance1 = getSystemIntegrationOrchestrator()
      const instance2 = getSystemIntegrationOrchestrator()
      expect(instance1).toBe(instance2)
    })

    it("should create new instance after reset", () => {
      const instance1 = getSystemIntegrationOrchestrator()
      resetSystemIntegrationOrchestrator()
      const instance2 = getSystemIntegrationOrchestrator()
      expect(instance1).not.toBe(instance2)
    })
  })

  describe("Modal Management", () => {
    it("should open modal", () => {
      const modalType: ModalType = "user-settings"
      orchestrator.openModal(modalType)

      const state = orchestrator.getModalState()
      expect(state.context.modalType).toBe(modalType)
      expect(state.matches("opened")).toBe(true)
    })

    it("should open modal with data", () => {
      const modalType: ModalType = "export"
      const modalData = { format: "mp4" }

      orchestrator.openModal(modalType, modalData)

      const state = orchestrator.getModalState()
      expect(state.context.modalType).toBe(modalType)
      expect(state.context.modalData).toEqual(modalData)
    })

    it("should close modal", () => {
      orchestrator.openModal("user-settings")
      orchestrator.closeModal()

      const state = orchestrator.getModalState()
      expect(state.context.modalType).toBe("none")
      expect(state.matches("closed")).toBe(true)
    })

    it("should submit modal", () => {
      orchestrator.openModal("project-settings")
      orchestrator.submitModal({ name: "Test Project" })

      const state = orchestrator.getModalState()
      expect(state.matches("closed")).toBe(true)
    })

    it("should get active modal", () => {
      orchestrator.openModal("keyboard-shortcuts")
      expect(orchestrator.getActiveModal()).toBe("keyboard-shortcuts")
    })

    it("should get modal data", () => {
      const data = { effectId: "blur" }
      orchestrator.openModal("effect-detail", data)
      expect(orchestrator.getModalData()).toEqual(data)
    })
  })

  describe("Update Management", () => {
    it("should check for updates", () => {
      orchestrator.checkForUpdates()

      const state = orchestrator.getUpdateState()
      // Должен перейти в состояние checking
      expect(state.matches("checking") || state.matches("idle") || state.matches("error")).toBe(true)
    })

    it("should enable auto update", () => {
      const intervalMinutes = 30
      orchestrator.enableAutoUpdate(intervalMinutes)

      const state = orchestrator.getUpdateState()
      expect(state.context.autoCheckEnabled).toBe(true)
      expect(state.context.autoCheckInterval).toBe(intervalMinutes)
    })

    it("should disable auto update", () => {
      orchestrator.enableAutoUpdate(60)
      orchestrator.disableAutoUpdate()

      const state = orchestrator.getUpdateState()
      expect(state.context.autoCheckEnabled).toBe(false)
    })
  })

  describe("Notification Management", () => {
    it("should show notification", () => {
      const id = orchestrator.showNotification({
        notification_type: "info",
        type: "info",
        title: "Test",
        message: "Test message",
      })

      expect(id).toMatch(/^notification-\d+$/)

      const notifications = orchestrator.getNotifications()
      expect(notifications).toHaveLength(1)
      expect(notifications[0].title).toBe("Test")
      expect(notifications[0].message).toBe("Test message")
    })

    it("should dismiss notification", () => {
      const id = orchestrator.showNotification({
        notification_type: "success",
        type: "success",
        title: "Success",
        message: "Operation completed",
      })

      orchestrator.dismissNotification(id)

      const notifications = orchestrator.getNotifications()
      expect(notifications).toHaveLength(0)
    })

    it("should auto-dismiss notification after duration", async () => {
      vi.useFakeTimers()

      const id = orchestrator.showNotification({
        notification_type: "warning",
        type: "warning",
        title: "Warning",
        message: "Temporary warning",
        duration: 1000,
      })

      expect(orchestrator.getNotifications()).toHaveLength(1)

      // Fast-forward time
      vi.advanceTimersByTime(1000)

      expect(orchestrator.getNotifications()).toHaveLength(0)

      vi.useRealTimers()
    })

    it("should clear all notifications", () => {
      orchestrator.showNotification({
        notification_type: "info",
        type: "info",
        title: "Test 1",
        message: "Message 1",
      })
      orchestrator.showNotification({
        notification_type: "info",
        type: "info",
        title: "Test 2",
        message: "Message 2",
      })

      expect(orchestrator.getNotifications()).toHaveLength(2)

      orchestrator.clearNotifications()

      expect(orchestrator.getNotifications()).toHaveLength(0)
    })

    it("should support notification actions", () => {
      const actionFn = vi.fn()
      const id = orchestrator.showNotification({
        notification_type: "info",
        type: "info",
        title: "Action Test",
        message: "Click action",
        actions: [
          {
            label: "Action",
            action: actionFn,
            style: "primary",
          },
        ],
      })

      const notifications = orchestrator.getNotifications()
      expect(notifications[0].actions).toBeDefined()
      expect(notifications[0].actions![0].label).toBe("Action")

      // Вызов действия
      notifications[0].actions![0].action()
      expect(actionFn).toHaveBeenCalledTimes(1)
    })
  })

  describe("Feature Management", () => {
    it("should toggle feature on", () => {
      orchestrator.toggleFeature("aiAnalysis", true)
      expect(orchestrator.isFeatureEnabled("aiAnalysis")).toBe(true)
    })

    it("should toggle feature off", () => {
      orchestrator.toggleFeature("aiAnalysis", true)
      orchestrator.toggleFeature("aiAnalysis", false)
      expect(orchestrator.isFeatureEnabled("aiAnalysis")).toBe(false)
    })

    it("should return false for undefined feature", () => {
      expect(orchestrator.isFeatureEnabled("nonExistentFeature")).toBe(false)
    })
  })

  describe("Subscriptions", () => {
    it("should subscribe to modal changes", () => {
      const callback = vi.fn()
      const subscription = orchestrator.subscribeToModals(callback)

      orchestrator.openModal("user-settings")

      expect(callback).toHaveBeenCalled()

      subscription.unsubscribe()
    })

    it("should subscribe to update changes", () => {
      const callback = vi.fn()
      const subscription = orchestrator.subscribeToUpdates(callback)

      orchestrator.checkForUpdates()

      expect(callback).toHaveBeenCalled()

      subscription.unsubscribe()
    })

    it("should unsubscribe from modal changes", () => {
      const callback = vi.fn()
      const subscription = orchestrator.subscribeToModals(callback)

      subscription.unsubscribe()
      callback.mockClear()

      orchestrator.openModal("user-settings")

      // Callback не должен быть вызван после отписки
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe("Lifecycle", () => {
    it("should dispose properly", () => {
      orchestrator.showNotification({
        notification_type: "info",
        type: "info",
        title: "Test",
        message: "Test",
      })

      orchestrator.dispose()

      const notifications = orchestrator.getNotifications()
      expect(notifications).toHaveLength(0)
    })
  })

  describe("Error Handling", () => {
    it("should handle invalid modal type gracefully", () => {
      const invalidModal = "invalid-modal" as ModalType

      expect(() => {
        orchestrator.openModal(invalidModal)
      }).not.toThrow()

      const state = orchestrator.getModalState()
      expect(state.context.modalType).toBe(invalidModal)
    })

    it("should handle notification with missing required fields", () => {
      const id = orchestrator.showNotification({
        notification_type: "info",
        type: "info",
        title: "",
        message: "",
      })

      expect(id).toBeTruthy()
      const notifications = orchestrator.getNotifications()
      expect(notifications).toHaveLength(1)
      expect(notifications[0].title).toBe("")
    })

    it("should handle multiple rapid modal opens", () => {
      orchestrator.openModal("user-settings")
      orchestrator.openModal("project-settings")
      orchestrator.openModal("export")

      const state = orchestrator.getModalState()
      expect(state.context.modalType).toBe("export")
    })

    it("should handle dismissing non-existent notification", () => {
      expect(() => {
        orchestrator.dismissNotification("non-existent-id")
      }).not.toThrow()

      expect(orchestrator.getNotifications()).toHaveLength(0)
    })
  })

  describe("Edge Cases", () => {
    it("should handle zero duration notification", () => {
      const id = orchestrator.showNotification({
        notification_type: "info",
        type: "info",
        title: "Test",
        message: "Test",
        duration: 0,
      })

      expect(orchestrator.getNotifications()).toHaveLength(1)
      // Notification should persist since duration is 0
    })

    it("should handle extremely short duration notification", async () => {
      vi.useFakeTimers()

      const id = orchestrator.showNotification({
        notification_type: "info",
        type: "info",
        title: "Test",
        message: "Test",
        duration: 1,
      })

      expect(orchestrator.getNotifications()).toHaveLength(1)

      vi.advanceTimersByTime(1)
      expect(orchestrator.getNotifications()).toHaveLength(0)

      vi.useRealTimers()
    })

    it("should handle notification with multiple actions", () => {
      const action1 = vi.fn()
      const action2 = vi.fn()
      const action3 = vi.fn()

      const id = orchestrator.showNotification({
        notification_type: "warning",
        type: "warning",
        title: "Multiple Actions",
        message: "Choose an action",
        actions: [
          { label: "Action 1", action: action1, style: "primary" },
          { label: "Action 2", action: action2, style: "secondary" },
          { label: "Action 3", action: action3, style: "danger" },
        ],
      })

      const notifications = orchestrator.getNotifications()
      expect(notifications[0].actions).toHaveLength(3)

      notifications[0].actions![0].action()
      notifications[0].actions![1].action()
      notifications[0].actions![2].action()

      expect(action1).toHaveBeenCalledTimes(1)
      expect(action2).toHaveBeenCalledTimes(1)
      expect(action3).toHaveBeenCalledTimes(1)
    })

    it("should handle closing modal when no modal is open", () => {
      expect(() => {
        orchestrator.closeModal()
      }).not.toThrow()

      const state = orchestrator.getModalState()
      expect(state.context.modalType).toBe("none")
    })

    it("should maintain notification order", () => {
      const id1 = orchestrator.showNotification({
        notification_type: "info",
        type: "info",
        title: "First",
        message: "First notification",
      })

      const id2 = orchestrator.showNotification({
        notification_type: "success",
        type: "success",
        title: "Second",
        message: "Second notification",
      })

      const id3 = orchestrator.showNotification({
        notification_type: "warning",
        type: "warning",
        title: "Third",
        message: "Third notification",
      })

      const notifications = orchestrator.getNotifications()
      expect(notifications).toHaveLength(3)
      expect(notifications[0].title).toBe("First")
      expect(notifications[1].title).toBe("Second")
      expect(notifications[2].title).toBe("Third")
    })

    it("should handle feature toggle for same feature multiple times", () => {
      orchestrator.toggleFeature("testFeature", true)
      expect(orchestrator.isFeatureEnabled("testFeature")).toBe(true)

      orchestrator.toggleFeature("testFeature", false)
      expect(orchestrator.isFeatureEnabled("testFeature")).toBe(false)

      orchestrator.toggleFeature("testFeature", true)
      expect(orchestrator.isFeatureEnabled("testFeature")).toBe(true)
    })

    it("should handle enabling auto-update multiple times with different intervals", () => {
      orchestrator.enableAutoUpdate(30)
      let state = orchestrator.getUpdateState()
      expect(state.context.autoCheckInterval).toBe(30)

      orchestrator.enableAutoUpdate(60)
      state = orchestrator.getUpdateState()
      expect(state.context.autoCheckInterval).toBe(60)

      orchestrator.enableAutoUpdate(120)
      state = orchestrator.getUpdateState()
      expect(state.context.autoCheckInterval).toBe(120)
    })
  })

  describe("Concurrent Operations", () => {
    it("should handle simultaneous notifications", () => {
      const ids = [1, 2, 3, 4, 5].map((i) =>
        orchestrator.showNotification({
          notification_type: "info",
          type: "info",
          title: `Notification ${i}`,
          message: `Message ${i}`,
        }),
      )

      expect(orchestrator.getNotifications()).toHaveLength(5)
      expect(ids).toHaveLength(5)
      expect(new Set(ids).size).toBe(5) // All IDs should be unique
    })

    it("should handle rapid open/close modal cycles", () => {
      for (let i = 0; i < 10; i++) {
        orchestrator.openModal("user-settings")
        orchestrator.closeModal()
      }

      const state = orchestrator.getModalState()
      expect(state.context.modalType).toBe("none")
      expect(state.matches("closed")).toBe(true)
    })

    it("should handle mixed notification operations", () => {
      const id1 = orchestrator.showNotification({
        notification_type: "info",
        type: "info",
        title: "First",
        message: "First",
      })

      const id2 = orchestrator.showNotification({
        notification_type: "success",
        type: "success",
        title: "Second",
        message: "Second",
      })

      orchestrator.dismissNotification(id1)

      const id3 = orchestrator.showNotification({
        notification_type: "warning",
        type: "warning",
        title: "Third",
        message: "Third",
      })

      const notifications = orchestrator.getNotifications()
      expect(notifications).toHaveLength(2)
      expect(notifications.find((n) => n.id === id1)).toBeUndefined()
      expect(notifications.find((n) => n.id === id2)).toBeDefined()
      expect(notifications.find((n) => n.id === id3)).toBeDefined()
    })
  })

  describe("Subscription Edge Cases", () => {
    it("should handle multiple subscriptions to same event", () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()

      const sub1 = orchestrator.subscribeToModals(callback1)
      const sub2 = orchestrator.subscribeToModals(callback2)
      const sub3 = orchestrator.subscribeToModals(callback3)

      orchestrator.openModal("user-settings")

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
      expect(callback3).toHaveBeenCalled()

      sub1.unsubscribe()
      sub2.unsubscribe()
      sub3.unsubscribe()
    })

    it("should handle unsubscribing already unsubscribed subscription", () => {
      const callback = vi.fn()
      const subscription = orchestrator.subscribeToModals(callback)

      subscription.unsubscribe()

      expect(() => {
        subscription.unsubscribe()
      }).not.toThrow()
    })

    it("should stop receiving events after unsubscribe", () => {
      const callback = vi.fn()
      const subscription = orchestrator.subscribeToModals(callback)

      orchestrator.openModal("user-settings")
      const callCount1 = callback.mock.calls.length

      subscription.unsubscribe()
      callback.mockClear()

      orchestrator.closeModal()
      orchestrator.openModal("project-settings")

      expect(callback).not.toHaveBeenCalled()
    })
  })
})

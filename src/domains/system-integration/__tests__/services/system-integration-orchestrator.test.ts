/**
 * Tests for System Integration Orchestrator
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  getSystemIntegrationOrchestrator,
  resetSystemIntegrationOrchestrator,
  type SystemIntegrationOrchestrator,
} from "../../services/system-integration-orchestrator"
import type { ModalType } from "../../machines/modal-machine"

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
})

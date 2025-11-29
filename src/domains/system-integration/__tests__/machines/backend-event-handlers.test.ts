/**
 * Tests for Backend Event Handlers
 */

import { beforeEach, describe, expect, it } from "vitest"
import type { SystemNotification as BackendSystemNotification, ProjectEvent } from "@/types/generated/tauri-bindings"
import { handleBackendEvent, type SystemIntegrationContext } from "../../machines/backend-event-handlers"

describe("Backend Event Handlers", () => {
  let mockContext: SystemIntegrationContext

  beforeEach(() => {
    mockContext = {
      features: {},
      notifications: [],
      updateAvailable: false,
      updateInfo: null,
      isConnected: true,
      error: null,
    }
  })

  describe("Feature Events", () => {
    it("should handle FeatureToggled event", () => {
      const event: ProjectEvent = {
        type: "FeatureToggled",
        payload: {
          feature: "darkMode",
          enabled: true,
        },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.features).toEqual({
        darkMode: true,
      })
    })

    it("should update existing feature", () => {
      mockContext.features = {
        darkMode: false,
        autoSave: true,
      }

      const event: ProjectEvent = {
        type: "FeatureToggled",
        payload: {
          feature: "darkMode",
          enabled: true,
        },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.features).toEqual({
        darkMode: true,
        autoSave: true,
      })
    })

    it("should disable feature", () => {
      mockContext.features = {
        darkMode: true,
      }

      const event: ProjectEvent = {
        type: "FeatureToggled",
        payload: {
          feature: "darkMode",
          enabled: false,
        },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.features).toEqual({
        darkMode: false,
      })
    })
  })

  describe("Notification Events", () => {
    it("should handle NotificationShown event", () => {
      const backendNotification: BackendSystemNotification = {
        id: "notif-1",
        title: "Test Notification",
        message: "Test message",
        notification_type: "info",
        timestamp: new Date().toISOString(),
        duration: null,
        actions: null,
      }

      const event: ProjectEvent = {
        type: "NotificationShown",
        payload: {
          notification: backendNotification,
        },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.notifications).toHaveLength(1)
      expect(result.notifications?.[0]).toMatchObject({
        id: "notif-1",
        title: "Test Notification",
        message: "Test message",
        type: "info",
      })
      expect(result.notifications?.[0].timestamp).toBeInstanceOf(Date)
    })

    it("should convert notification_type to type correctly", () => {
      const testCases: Array<{ notificationType: string; expectedType: "info" | "success" | "warning" | "error" }> = [
        { notificationType: "info", expectedType: "info" },
        { notificationType: "success", expectedType: "success" },
        { notificationType: "complete", expectedType: "success" },
        { notificationType: "warning", expectedType: "warning" },
        { notificationType: "warn", expectedType: "warning" },
        { notificationType: "error", expectedType: "error" },
        { notificationType: "failed", expectedType: "error" },
      ]

      testCases.forEach(({ notificationType, expectedType }) => {
        const backendNotification: BackendSystemNotification = {
          id: `notif-${notificationType}`,
          title: "Test",
          message: "Test",
          notification_type: notificationType,
          timestamp: new Date().toISOString(),
          duration: null,
          actions: null,
        }

        const event: ProjectEvent = {
          type: "NotificationShown",
          payload: { notification: backendNotification },
        }

        const result = handleBackendEvent(mockContext, event)
        expect(result.notifications?.[0].type).toBe(expectedType)
      })
    })

    it("should update existing notification with same id", () => {
      mockContext.notifications = [
        {
          id: "notif-1",
          notification_type: "info",
          title: "Old Title",
          message: "Old message",
          type: "info",
          timestamp: new Date(),
        },
      ]

      const backendNotification: BackendSystemNotification = {
        id: "notif-1",
        title: "Updated Title",
        message: "Updated message",
        notification_type: "success",
        timestamp: new Date().toISOString(),
        duration: null,
        actions: null,
      }

      const event: ProjectEvent = {
        type: "NotificationShown",
        payload: { notification: backendNotification },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.notifications).toHaveLength(1)
      expect(result.notifications?.[0]).toMatchObject({
        id: "notif-1",
        title: "Updated Title",
        message: "Updated message",
        type: "success",
      })
    })

    it("should handle NotificationDismissed event", () => {
      mockContext.notifications = [
        {
          id: "notif-1",
          notification_type: "info",
          title: "First",
          message: "Message 1",
          type: "info",
          timestamp: new Date(),
        },
        {
          id: "notif-2",
          notification_type: "success",
          title: "Second",
          message: "Message 2",
          type: "success",
          timestamp: new Date(),
        },
      ]

      const event: ProjectEvent = {
        type: "NotificationDismissed",
        payload: { id: "notif-1" },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.notifications).toHaveLength(1)
      expect(result.notifications?.[0].id).toBe("notif-2")
    })

    it("should handle NotificationsCleared event", () => {
      mockContext.notifications = [
        {
          id: "notif-1",
          notification_type: "info",
          title: "First",
          message: "Message 1",
          type: "info",
          timestamp: new Date(),
        },
        {
          id: "notif-2",
          notification_type: "success",
          title: "Second",
          message: "Message 2",
          type: "success",
          timestamp: new Date(),
        },
      ]

      const event: ProjectEvent = {
        type: "NotificationsCleared",
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.notifications).toEqual([])
    })

    it("should preserve notification duration and actions", () => {
      const backendNotification: BackendSystemNotification = {
        id: "notif-1",
        title: "Test",
        message: "Test message",
        notification_type: "info",
        timestamp: new Date().toISOString(),
        duration: 5000,
        actions: [{ label: "Dismiss", action: "dismiss", style: null }],
      }

      const event: ProjectEvent = {
        type: "NotificationShown",
        payload: { notification: backendNotification },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.notifications?.[0].duration).toBe(5000)
      expect(result.notifications?.[0].actions).toEqual([{ label: "Dismiss", action: "dismiss" }])
    })
  })

  describe("Update Events", () => {
    it("should handle UpdateCheckStarted event", () => {
      const event: ProjectEvent = {
        type: "UpdateCheckStarted",
      }

      const result = handleBackendEvent(mockContext, event)

      // UpdateCheckStarted currently returns empty object
      expect(result).toEqual({})
    })

    it("should handle UpdateCheckCompleted event with no update", () => {
      const event: ProjectEvent = {
        type: "UpdateCheckCompleted",
        payload: { has_update: false },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.updateAvailable).toBe(false)
    })

    it("should handle UpdateCheckCompleted event with update available", () => {
      const event: ProjectEvent = {
        type: "UpdateCheckCompleted",
        payload: { has_update: true },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.updateAvailable).toBe(true)
    })

    it("should handle UpdateAvailable event", () => {
      const updateInfo = {
        version: "2.0.0",
        release_notes: "New version",
        download_url: "https://example.com",
        size: 1024000,
      }

      const event: ProjectEvent = {
        type: "UpdateAvailable",
        payload: { update_info: updateInfo },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.updateAvailable).toBe(true)
      expect(result.updateInfo).toEqual(updateInfo)
    })

    it("should handle UpdateDownloadStarted event", () => {
      const event: ProjectEvent = {
        type: "UpdateDownloadStarted",
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result).toEqual({})
    })

    it("should handle UpdateDownloadCompleted event", () => {
      const event: ProjectEvent = {
        type: "UpdateDownloadCompleted",
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result).toEqual({})
    })

    it("should handle UpdateInstallStarted event", () => {
      const event: ProjectEvent = {
        type: "UpdateInstallStarted",
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result).toEqual({})
    })

    it("should handle UpdateDismissed event", () => {
      mockContext.updateAvailable = true
      mockContext.updateInfo = { version: "2.0.0" }

      const event: ProjectEvent = {
        type: "UpdateDismissed",
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.updateAvailable).toBe(false)
      expect(result.updateInfo).toBeNull()
    })

    it("should handle AutoUpdateEnabled event", () => {
      const event: ProjectEvent = {
        type: "AutoUpdateEnabled",
        payload: { interval_minutes: 30 },
      }

      const result = handleBackendEvent(mockContext, event)

      // Currently returns empty object
      expect(result).toEqual({})
    })

    it("should handle AutoUpdateDisabled event", () => {
      const event: ProjectEvent = {
        type: "AutoUpdateDisabled",
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result).toEqual({})
    })
  })

  describe("Modal Events", () => {
    it("should handle ModalOpened event", () => {
      const event: ProjectEvent = {
        type: "ModalOpened",
        payload: {
          modal_type: "export",
          modal_data: null,
        },
      }

      const result = handleBackendEvent(mockContext, event)

      // Modal events are handled by modal machine
      expect(result).toEqual({})
    })

    it("should handle ModalClosed event", () => {
      const event: ProjectEvent = {
        type: "ModalClosed",
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result).toEqual({})
    })

    it("should handle ModalSubmitted event", () => {
      const event: ProjectEvent = {
        type: "ModalSubmitted",
        payload: { data: null },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result).toEqual({})
    })
  })

  describe("Unhandled Events", () => {
    it("should return empty object for unknown event types", () => {
      const event = {
        type: "UnknownEventType",
        payload: {},
      } as any

      const result = handleBackendEvent(mockContext, event)

      expect(result).toEqual({})
    })
  })

  describe("Context Immutability", () => {
    it("should not mutate original context", () => {
      const originalFeatures = { ...mockContext.features }

      const event: ProjectEvent = {
        type: "FeatureToggled",
        payload: {
          feature: "newFeature",
          enabled: true,
        },
      }

      handleBackendEvent(mockContext, event)

      expect(mockContext.features).toEqual(originalFeatures)
    })

    it("should not mutate original notifications array", () => {
      mockContext.notifications = [
        {
          id: "notif-1",
          notification_type: "info",
          title: "Test",
          message: "Message",
          type: "info",
          timestamp: new Date(),
        },
      ]
      const originalLength = mockContext.notifications.length

      const backendNotification: BackendSystemNotification = {
        id: "notif-2",
        title: "New",
        message: "New message",
        notification_type: "success",
        timestamp: new Date().toISOString(),
        duration: null,
        actions: null,
      }

      const event: ProjectEvent = {
        type: "NotificationShown",
        payload: { notification: backendNotification },
      }

      handleBackendEvent(mockContext, event)

      expect(mockContext.notifications.length).toBe(originalLength)
    })
  })
})

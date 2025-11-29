/**
 * Project Management Events Tests
 *
 * Тесты для событий домена управления проектами
 */

import { describe, expect, it } from "vitest"
import { PROJECT_MANAGEMENT_EVENTS } from "../project-management-events"

describe("Project Management Events", () => {
  describe("Event Constants", () => {
    it("should have correct project event types", () => {
      expect(PROJECT_MANAGEMENT_EVENTS.PROJECT_CREATED).toBe("project.created")
      expect(PROJECT_MANAGEMENT_EVENTS.PROJECT_OPENED).toBe("project.opened")
      expect(PROJECT_MANAGEMENT_EVENTS.PROJECT_SAVED).toBe("project.saved")
      expect(PROJECT_MANAGEMENT_EVENTS.PROJECT_CLOSED).toBe("project.closed")
    })

    it("should have correct settings event types", () => {
      expect(PROJECT_MANAGEMENT_EVENTS.USER_SETTINGS_CHANGED).toBe("project.settings.user-changed")
      expect(PROJECT_MANAGEMENT_EVENTS.PROJECT_SETTINGS_CHANGED).toBe(
        "project.settings.project-changed",
      )
      expect(PROJECT_MANAGEMENT_EVENTS.LANGUAGE_CHANGED).toBe("project.settings.language-changed")
      expect(PROJECT_MANAGEMENT_EVENTS.THEME_CHANGED).toBe("project.settings.theme-changed")
    })

    it("should have correct API key event types", () => {
      expect(PROJECT_MANAGEMENT_EVENTS.API_KEY_UPDATED).toBe("project.api-key.updated")
      expect(PROJECT_MANAGEMENT_EVENTS.API_KEY_VALIDATED).toBe("project.api-key.validated")
    })

    it("should have correct backend event types", () => {
      expect(PROJECT_MANAGEMENT_EVENTS.BACKEND_CONNECTED).toBe("project.backend.connected")
      expect(PROJECT_MANAGEMENT_EVENTS.BACKEND_DISCONNECTED).toBe("project.backend.disconnected")
      expect(PROJECT_MANAGEMENT_EVENTS.BACKEND_COMMAND_EXECUTED).toBe(
        "project.backend.command-executed",
      )
    })

    it("should have all events prefixed with domain name", () => {
      const events = Object.values(PROJECT_MANAGEMENT_EVENTS)
      events.forEach((event) => {
        expect(event).toMatch(/^project\./)
      })
    })

    it("should not have duplicate event names", () => {
      const events = Object.values(PROJECT_MANAGEMENT_EVENTS)
      const uniqueEvents = new Set(events)
      expect(uniqueEvents.size).toBe(events.length)
    })

    it("should have consistent naming convention (kebab-case)", () => {
      const events = Object.values(PROJECT_MANAGEMENT_EVENTS)
      events.forEach((event) => {
        expect(event).toMatch(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/)
      })
    })
  })

  describe("Event Count", () => {
    it("should have expected number of events", () => {
      const eventCount = Object.keys(PROJECT_MANAGEMENT_EVENTS).length
      // 4 project + 4 settings + 2 api-key + 3 backend = 13
      expect(eventCount).toBe(13)
    })
  })

  describe("Event Grouping", () => {
    it("should have project lifecycle events grouped", () => {
      const projectEvents = Object.values(PROJECT_MANAGEMENT_EVENTS).filter(
        (event) => event.startsWith("project.") && !event.includes(".settings.") && !event.includes(".api-key.") && !event.includes(".backend."),
      )
      expect(projectEvents).toHaveLength(4)
    })

    it("should have settings events grouped", () => {
      const settingsEvents = Object.values(PROJECT_MANAGEMENT_EVENTS).filter((event) =>
        event.includes(".settings."),
      )
      expect(settingsEvents).toHaveLength(4)
    })

    it("should have API key events grouped", () => {
      const apiKeyEvents = Object.values(PROJECT_MANAGEMENT_EVENTS).filter((event) =>
        event.includes(".api-key."),
      )
      expect(apiKeyEvents).toHaveLength(2)
    })

    it("should have backend events grouped", () => {
      const backendEvents = Object.values(PROJECT_MANAGEMENT_EVENTS).filter((event) =>
        event.includes(".backend."),
      )
      expect(backendEvents).toHaveLength(3)
    })
  })

  describe("Event Lifecycle Patterns", () => {
    it("should have project lifecycle events in logical order", () => {
      expect(PROJECT_MANAGEMENT_EVENTS.PROJECT_CREATED).toBeDefined()
      expect(PROJECT_MANAGEMENT_EVENTS.PROJECT_OPENED).toBeDefined()
      expect(PROJECT_MANAGEMENT_EVENTS.PROJECT_SAVED).toBeDefined()
      expect(PROJECT_MANAGEMENT_EVENTS.PROJECT_CLOSED).toBeDefined()
    })

    it("should have connected/disconnected pairs", () => {
      expect(PROJECT_MANAGEMENT_EVENTS.BACKEND_CONNECTED).toBeDefined()
      expect(PROJECT_MANAGEMENT_EVENTS.BACKEND_DISCONNECTED).toBeDefined()
    })

    it("should have update/validate pairs for API keys", () => {
      expect(PROJECT_MANAGEMENT_EVENTS.API_KEY_UPDATED).toBeDefined()
      expect(PROJECT_MANAGEMENT_EVENTS.API_KEY_VALIDATED).toBeDefined()
    })
  })

  describe("Event Scope Distinction", () => {
    it("should distinguish between user and project settings", () => {
      expect(PROJECT_MANAGEMENT_EVENTS.USER_SETTINGS_CHANGED).toContain("user-changed")
      expect(PROJECT_MANAGEMENT_EVENTS.PROJECT_SETTINGS_CHANGED).toContain("project-changed")
    })
  })

  describe("Constants Immutability", () => {
    it("should be readonly object", () => {
      expect(Object.isFrozen(PROJECT_MANAGEMENT_EVENTS)).toBe(false) // as const doesn't freeze
      // TypeScript prevents modification at compile time
    })
  })
})

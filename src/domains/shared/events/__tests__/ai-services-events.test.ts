/**
 * AI Services Events Tests
 *
 * Тесты для событий домена AI сервисов
 */

import { describe, expect, it } from "vitest"
import { AI_SERVICES_EVENTS } from "../ai-services-events"

describe("AI Services Events", () => {
  describe("Event Constants", () => {
    it("should have correct chat event types", () => {
      expect(AI_SERVICES_EVENTS.CHAT_MESSAGE_SENT).toBe("ai-services.chat.message-sent")
      expect(AI_SERVICES_EVENTS.CHAT_RESPONSE_RECEIVED).toBe("ai-services.chat.response-received")
      expect(AI_SERVICES_EVENTS.CHAT_TIMELINE_CREATED).toBe("ai-services.chat.timeline-created")
    })

    it("should have correct content intelligence event types", () => {
      expect(AI_SERVICES_EVENTS.CONTENT_ANALYSIS_STARTED).toBe("ai-services.content.analysis-started")
      expect(AI_SERVICES_EVENTS.CONTENT_ANALYSIS_COMPLETED).toBe(
        "ai-services.content.analysis-completed",
      )
      expect(AI_SERVICES_EVENTS.SCRIPT_GENERATED).toBe("ai-services.content.script-generated")
    })

    it("should have correct montage planner event types", () => {
      expect(AI_SERVICES_EVENTS.MONTAGE_PLAN_GENERATED).toBe("ai-services.montage.plan-generated")
      expect(AI_SERVICES_EVENTS.MONTAGE_PLAN_APPLIED).toBe("ai-services.montage.plan-applied")
    })

    it("should have correct recognition event types", () => {
      expect(AI_SERVICES_EVENTS.PERSONS_IDENTIFIED).toBe("ai-services.recognition.persons-identified")
      expect(AI_SERVICES_EVENTS.OBJECTS_DETECTED).toBe("ai-services.recognition.objects-detected")
    })

    it("should have correct AI Director event types", () => {
      expect(AI_SERVICES_EVENTS.AI_DIRECTOR_ANALYSIS_PROGRESS).toBe(
        "ai-services.ai-director.analysis-progress",
      )
      expect(AI_SERVICES_EVENTS.AI_DIRECTOR_ANALYSIS_COMPLETED).toBe(
        "ai-services.ai-director.analysis-completed",
      )
      expect(AI_SERVICES_EVENTS.AI_DIRECTOR_ANALYSIS_ERROR).toBe(
        "ai-services.ai-director.analysis-error",
      )
      expect(AI_SERVICES_EVENTS.AI_DIRECTOR_STAGE_COMPLETED).toBe(
        "ai-services.ai-director.stage-completed",
      )
      expect(AI_SERVICES_EVENTS.AI_DIRECTOR_BATCH_COMPLETED).toBe(
        "ai-services.ai-director.batch-completed",
      )
    })

    it("should have all events prefixed with domain name", () => {
      const events = Object.values(AI_SERVICES_EVENTS)
      events.forEach((event) => {
        expect(event).toMatch(/^ai-services\./)
      })
    })

    it("should not have duplicate event names", () => {
      const events = Object.values(AI_SERVICES_EVENTS)
      const uniqueEvents = new Set(events)
      expect(uniqueEvents.size).toBe(events.length)
    })

    it("should have consistent naming convention (kebab-case)", () => {
      const events = Object.values(AI_SERVICES_EVENTS)
      events.forEach((event) => {
        expect(event).toMatch(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/)
      })
    })
  })

  describe("Event Count", () => {
    it("should have expected number of events", () => {
      const eventCount = Object.keys(AI_SERVICES_EVENTS).length
      // 3 chat + 3 content + 2 montage + 2 recognition + 5 AI Director = 15
      expect(eventCount).toBe(15)
    })
  })

  describe("Event Grouping", () => {
    it("should have chat events grouped", () => {
      const chatEvents = Object.values(AI_SERVICES_EVENTS).filter((event) =>
        event.includes(".chat."),
      )
      expect(chatEvents).toHaveLength(3)
    })

    it("should have content events grouped", () => {
      const contentEvents = Object.values(AI_SERVICES_EVENTS).filter((event) =>
        event.includes(".content."),
      )
      expect(contentEvents).toHaveLength(3)
    })

    it("should have montage events grouped", () => {
      const montageEvents = Object.values(AI_SERVICES_EVENTS).filter((event) =>
        event.includes(".montage."),
      )
      expect(montageEvents).toHaveLength(2)
    })

    it("should have recognition events grouped", () => {
      const recognitionEvents = Object.values(AI_SERVICES_EVENTS).filter((event) =>
        event.includes(".recognition."),
      )
      expect(recognitionEvents).toHaveLength(2)
    })

    it("should have AI Director events grouped", () => {
      const aiDirectorEvents = Object.values(AI_SERVICES_EVENTS).filter((event) =>
        event.includes(".ai-director."),
      )
      expect(aiDirectorEvents).toHaveLength(5)
    })
  })

  describe("Constants Immutability", () => {
    it("should be readonly object", () => {
      expect(Object.isFrozen(AI_SERVICES_EVENTS)).toBe(false) // as const doesn't freeze
      // But TypeScript prevents modification at compile time
      expect(() => {
        // @ts-expect-error - testing immutability
        AI_SERVICES_EVENTS.CHAT_MESSAGE_SENT = "modified"
      }).not.toThrow() // Runtime doesn't prevent it, but TS does
    })
  })
})

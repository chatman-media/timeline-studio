/**
 * Unit tests for service configuration
 */

import { describe, expect, it } from "vitest"
import { SERVICE_CONFIG, isServiceEnabled } from "../service-config"

describe("SERVICE_CONFIG", () => {
  it("should have DISABLE_ALL_DOMAIN_SERVICES flag", () => {
    expect(SERVICE_CONFIG).toHaveProperty("DISABLE_ALL_DOMAIN_SERVICES")
    expect(typeof SERVICE_CONFIG.DISABLE_ALL_DOMAIN_SERVICES).toBe("boolean")
  })

  it("should have SERVICES object", () => {
    expect(SERVICE_CONFIG).toHaveProperty("SERVICES")
    expect(typeof SERVICE_CONFIG.SERVICES).toBe("object")
  })

  describe("SERVICES configuration", () => {
    it("should have AUTO_SAVE service", () => {
      expect(SERVICE_CONFIG.SERVICES).toHaveProperty("AUTO_SAVE")
      expect(typeof SERVICE_CONFIG.SERVICES.AUTO_SAVE).toBe("boolean")
    })

    it("should have AUTO_SNAPSHOT service", () => {
      expect(SERVICE_CONFIG.SERVICES).toHaveProperty("AUTO_SNAPSHOT")
      expect(typeof SERVICE_CONFIG.SERVICES.AUTO_SNAPSHOT).toBe("boolean")
    })

    it("should have AUTO_UPDATE service", () => {
      expect(SERVICE_CONFIG.SERVICES).toHaveProperty("AUTO_UPDATE")
      expect(typeof SERVICE_CONFIG.SERVICES.AUTO_UPDATE).toBe("boolean")
    })

    it("should have NOTIFICATIONS service", () => {
      expect(SERVICE_CONFIG.SERVICES).toHaveProperty("NOTIFICATIONS")
      expect(typeof SERVICE_CONFIG.SERVICES.NOTIFICATIONS).toBe("boolean")
    })

    it("should have FEATURES service", () => {
      expect(SERVICE_CONFIG.SERVICES).toHaveProperty("FEATURES")
      expect(typeof SERVICE_CONFIG.SERVICES.FEATURES).toBe("boolean")
    })

    it("should have UNDO_REDO service", () => {
      expect(SERVICE_CONFIG.SERVICES).toHaveProperty("UNDO_REDO")
      expect(typeof SERVICE_CONFIG.SERVICES.UNDO_REDO).toBe("boolean")
    })

    it("should have AI_SERVICES service", () => {
      expect(SERVICE_CONFIG.SERVICES).toHaveProperty("AI_SERVICES")
      expect(typeof SERVICE_CONFIG.SERVICES.AI_SERVICES).toBe("boolean")
    })

    it("should have BACKGROUND_SYNC service", () => {
      expect(SERVICE_CONFIG.SERVICES).toHaveProperty("BACKGROUND_SYNC")
      expect(typeof SERVICE_CONFIG.SERVICES.BACKGROUND_SYNC).toBe("boolean")
    })

    it("should have VIDEO_PLAYER service", () => {
      expect(SERVICE_CONFIG.SERVICES).toHaveProperty("VIDEO_PLAYER")
      expect(typeof SERVICE_CONFIG.SERVICES.VIDEO_PLAYER).toBe("boolean")
    })

    it("should have TIMELINE_PLAYER service", () => {
      expect(SERVICE_CONFIG.SERVICES).toHaveProperty("TIMELINE_PLAYER")
      expect(typeof SERVICE_CONFIG.SERVICES.TIMELINE_PLAYER).toBe("boolean")
    })
  })

  it("should be defined as const", () => {
    // The type should be readonly (verified at compile time)
    expect(SERVICE_CONFIG).toBeDefined()
  })
})

describe("isServiceEnabled", () => {
  describe("When DISABLE_ALL_DOMAIN_SERVICES is true", () => {
    it("should return false for AUTO_SAVE", () => {
      expect(isServiceEnabled("AUTO_SAVE")).toBe(false)
    })

    it("should return false for AUTO_SNAPSHOT", () => {
      expect(isServiceEnabled("AUTO_SNAPSHOT")).toBe(false)
    })

    it("should return false for AUTO_UPDATE", () => {
      expect(isServiceEnabled("AUTO_UPDATE")).toBe(false)
    })

    it("should return false for NOTIFICATIONS", () => {
      expect(isServiceEnabled("NOTIFICATIONS")).toBe(false)
    })

    it("should return false for FEATURES", () => {
      expect(isServiceEnabled("FEATURES")).toBe(false)
    })

    it("should return false for UNDO_REDO", () => {
      expect(isServiceEnabled("UNDO_REDO")).toBe(false)
    })

    it("should return false for AI_SERVICES", () => {
      expect(isServiceEnabled("AI_SERVICES")).toBe(false)
    })

    it("should return false for BACKGROUND_SYNC", () => {
      expect(isServiceEnabled("BACKGROUND_SYNC")).toBe(false)
    })

    it("should return false for VIDEO_PLAYER", () => {
      // When DISABLE_ALL_DOMAIN_SERVICES is true, all services return false
      expect(isServiceEnabled("VIDEO_PLAYER")).toBe(false)
    })

    it("should return false for TIMELINE_PLAYER", () => {
      // When DISABLE_ALL_DOMAIN_SERVICES is true, all services return false
      expect(isServiceEnabled("TIMELINE_PLAYER")).toBe(false)
    })
  })

  describe("Type safety", () => {
    it("should accept all valid service names", () => {
      const services: Array<keyof typeof SERVICE_CONFIG.SERVICES> = [
        "AUTO_SAVE",
        "AUTO_SNAPSHOT",
        "AUTO_UPDATE",
        "NOTIFICATIONS",
        "FEATURES",
        "UNDO_REDO",
        "AI_SERVICES",
        "BACKGROUND_SYNC",
        "VIDEO_PLAYER",
        "TIMELINE_PLAYER",
      ]

      services.forEach((service) => {
        expect(() => isServiceEnabled(service)).not.toThrow()
      })
    })
  })

  describe("Return type", () => {
    it("should always return a boolean", () => {
      const services: Array<keyof typeof SERVICE_CONFIG.SERVICES> = [
        "AUTO_SAVE",
        "NOTIFICATIONS",
        "VIDEO_PLAYER",
      ]

      services.forEach((service) => {
        const result = isServiceEnabled(service)
        expect(typeof result).toBe("boolean")
      })
    })
  })
})

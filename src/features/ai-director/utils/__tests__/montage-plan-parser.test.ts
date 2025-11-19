/**
 * Tests for montage plan parser utility
 */

import { describe, expect, it } from "vitest"
import type { MontagePlan } from "../../types/montage-plan"
import { parseMontagePlanFromAI, validateMontagePlan } from "../montage-plan-parser"

describe("montage-plan-parser", () => {
  describe("parseMontagePlanFromAI", () => {
    it("should parse valid JSON plan", () => {
      const validJson = JSON.stringify({
        id: "test-plan-123",
        name: "Test Plan",
        style: "dynamic",
        clips: [
          {
            sourceFile: "video1.mp4",
            startTime: 0,
            duration: 5,
            inPoint: 10,
            effects: [],
          },
        ],
        transitions: [],
        totalDuration: 5,
        createdAt: new Date().toISOString(),
      })

      const result = parseMontagePlanFromAI(validJson)

      expect(result.success).toBe(true)
      expect(result.plan).toBeDefined()
      expect(result.plan?.id).toBe("test-plan-123")
      expect(result.plan?.clips).toHaveLength(1)
    })

    it("should handle AI-generated text with JSON block", () => {
      const aiResponse = `Here is your montage plan:

\`\`\`json
{
  "id": "test-plan-456",
  "name": "AI Generated Plan",
  "style": "cinematic",
  "clips": [],
  "transitions": [],
  "totalDuration": 0,
  "createdAt": "${new Date().toISOString()}"
}
\`\`\`

This plan uses a cinematic style.`

      const result = parseMontagePlanFromAI(aiResponse)

      expect(result.success).toBe(true)
      expect(result.plan?.id).toBe("test-plan-456")
    })

    it("should extract JSON from markdown code blocks", () => {
      const markdown = `\`\`\`json
{
  "id": "markdown-plan",
  "name": "Markdown Plan",
  "style": "vlog",
  "clips": [],
  "transitions": [],
  "totalDuration": 0,
  "createdAt": "${new Date().toISOString()}"
}
\`\`\``

      const result = parseMontagePlanFromAI(markdown)

      expect(result.success).toBe(true)
      expect(result.plan?.id).toBe("markdown-plan")
    })

    it("should handle invalid JSON gracefully", () => {
      const invalidJson = "{ invalid json }"

      const result = parseMontagePlanFromAI(invalidJson)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.plan).toBeUndefined()
    })

    it("should handle empty string", () => {
      const result = parseMontagePlanFromAI("")

      expect(result.success).toBe(false)
      expect(result.error).toContain("empty")
    })

    it("should parse plan with transitions", () => {
      const planWithTransitions = JSON.stringify({
        id: "transition-plan",
        name: "Plan with Transitions",
        style: "dynamic",
        clips: [
          { sourceFile: "v1.mp4", startTime: 0, duration: 5, inPoint: 0, effects: [] },
          { sourceFile: "v2.mp4", startTime: 5, duration: 5, inPoint: 0, effects: [] },
        ],
        transitions: [{ type: "cross_dissolve", duration: 0.5, atTime: 5 }],
        totalDuration: 10,
        createdAt: new Date().toISOString(),
      })

      const result = parseMontagePlanFromAI(planWithTransitions)

      expect(result.success).toBe(true)
      expect(result.plan?.transitions).toHaveLength(1)
      expect(result.plan?.transitions[0].type).toBe("cross_dissolve")
    })

    it("should parse plan with music settings", () => {
      const planWithMusic = JSON.stringify({
        id: "music-plan",
        name: "Plan with Music",
        style: "dynamic",
        clips: [],
        transitions: [],
        totalDuration: 0,
        musicSettings: {
          trackPath: "music.mp3",
          volume: 0.3,
          fadeIn: 2,
          fadeOut: 3,
        },
        createdAt: new Date().toISOString(),
      })

      const result = parseMontagePlanFromAI(planWithMusic)

      expect(result.success).toBe(true)
      expect(result.plan?.musicSettings).toBeDefined()
      expect(result.plan?.musicSettings?.volume).toBe(0.3)
    })

    it("should parse plan with text overlays", () => {
      const planWithText = JSON.stringify({
        id: "text-plan",
        name: "Plan with Text",
        style: "dynamic",
        clips: [],
        transitions: [],
        totalDuration: 0,
        textSettings: {
          titleText: "My Video",
          titleDuration: 3,
          creditsText: "Created by...",
        },
        createdAt: new Date().toISOString(),
      })

      const result = parseMontagePlanFromAI(planWithText)

      expect(result.success).toBe(true)
      expect(result.plan?.textSettings).toBeDefined()
      expect(result.plan?.textSettings?.titleText).toBe("My Video")
    })

    it("should handle malformed JSON with helpful error", () => {
      const malformed = '{ "id": "test", "name": unclosed string }'

      const result = parseMontagePlanFromAI(malformed)

      expect(result.success).toBe(false)
      expect(result.error).toContain("parse")
    })
  })

  describe("validateMontagePlan", () => {
    const validPlan: MontagePlan = {
      id: "valid-plan",
      name: "Valid Plan",
      style: "dynamic",
      targetDuration: 5,
      clips: [
        {
          fileId: "file-1",
          filePath: "video.mp4",
          startTime: 0,
          endTime: 5,
          duration: 5,
          reason: "Test clip",
        },
      ],
      transitions: [],
      createdAt: new Date(),
    }

    it("should validate correct plan", () => {
      const result = validateMontagePlan(validPlan)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should detect missing required fields", () => {
      const invalidPlan = {
        id: "invalid",
        // Missing name and other required fields
      } as any

      const result = validateMontagePlan(invalidPlan)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it("should validate clip timing", () => {
      const planWithInvalidTiming: MontagePlan = {
        ...validPlan,
        clips: [
          {
            fileId: "file-1",
            filePath: "video.mp4",
            startTime: 0,
            endTime: -5,
            duration: -5, // Invalid negative duration
            reason: "Test",
          },
        ],
      }

      const result = validateMontagePlan(planWithInvalidTiming)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes("duration"))).toBe(true)
    })

    it("should validate transition timing", () => {
      const planWithInvalidTransition: MontagePlan = {
        ...validPlan,
        transitions: [
          {
            type: "cross_dissolve",
            duration: 0.5,
            atTime: 100, // Beyond total duration
          },
        ],
      }

      const result = validateMontagePlan(planWithInvalidTransition)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes("transition"))).toBe(true)
    })

    it("should validate total duration matches clips", () => {
      const planWithWrongDuration: MontagePlan = {
        ...validPlan,
        actualDuration: 100, // Doesn't match actual clip durations
      }

      const result = validateMontagePlan(planWithWrongDuration)

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some((w) => w.includes("duration"))).toBe(true)
    })

    it("should validate music volume range", () => {
      const planWithInvalidVolume: MontagePlan = {
        ...validPlan,
        musicSettings: {
          trackPath: "music.mp3",
          volume: 1.5, // Invalid > 1.0
          fadeIn: 0,
          fadeOut: 0,
        },
      }

      const result = validateMontagePlan(planWithInvalidVolume)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes("volume"))).toBe(true)
    })

    it("should validate style is valid enum", () => {
      const planWithInvalidStyle: MontagePlan = {
        ...validPlan,
        style: "invalid-style" as any,
      }

      const result = validateMontagePlan(planWithInvalidStyle)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes("style"))).toBe(true)
    })

    it("should warn about empty clips array", () => {
      const emptyPlan: MontagePlan = {
        ...validPlan,
        clips: [],
        totalDuration: 0,
      }

      const result = validateMontagePlan(emptyPlan)

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some((w) => w.includes("clip"))).toBe(true)
    })

    it("should validate clip overlaps", () => {
      const planWithOverlaps: MontagePlan = {
        ...validPlan,
        clips: [
          { fileId: "f1", filePath: "v1.mp4", startTime: 0, endTime: 10, duration: 10, reason: "Test" },
          { fileId: "f2", filePath: "v2.mp4", startTime: 5, endTime: 15, duration: 10, reason: "Test" }, // Overlaps
        ],
      }

      const result = validateMontagePlan(planWithOverlaps)

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some((w) => w.includes("overlap"))).toBe(true)
    })

    it("should validate source file paths", () => {
      const planWithEmptyPath: MontagePlan = {
        ...validPlan,
        clips: [{ fileId: "f1", filePath: "", startTime: 0, endTime: 5, duration: 5, reason: "Test" }],
      }

      const result = validateMontagePlan(planWithEmptyPath)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes("source"))).toBe(true)
    })
  })
})

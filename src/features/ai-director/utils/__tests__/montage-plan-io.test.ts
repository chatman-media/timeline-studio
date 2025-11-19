/**
 * Tests for montage plan import/export utilities
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MontagePlan } from "../../types/montage-plan"
import {
  exportMontagePlan,
  exportMultiplePlans,
  exportPlanAsTemplate,
  importMontagePlan,
  importMultiplePlans,
} from "../montage-plan-io"

// Mock Tauri dialog
vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: vi.fn(),
  open: vi.fn(),
}))

// Mock Tauri fs
vi.mock("@tauri-apps/plugin-fs", () => ({
  writeTextFile: vi.fn(),
  readTextFile: vi.fn(),
}))

describe("montage-plan-io", () => {
  const mockPlan: MontagePlan = {
    id: "test-plan-123",
    name: "Test Montage Plan",
    style: "dynamic",
    targetDuration: 8,
    clips: [
      {
        fileId: "file-1",
        filePath: "/path/to/video1.mp4",
        startTime: 10,
        endTime: 15,
        duration: 5,
        reason: "Test clip 1",
      },
      {
        fileId: "file-2",
        filePath: "/path/to/video2.mp4",
        startTime: 0,
        endTime: 3,
        duration: 3,
        reason: "Test clip 2",
      },
    ],
    transitions: [
      {
        type: "cross_dissolve",
        duration: 0.5,
        atTime: 5,
      },
    ],
    musicSettings: {
      trackPath: "/path/to/music.mp3",
      volume: 0.3,
      startTime: 0,
      fadeIn: 2,
      fadeOut: 2,
    },
    createdAt: new Date("2024-01-01T12:00:00Z"),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("exportMontagePlan", () => {
    it("should export plan to JSON file", async () => {
      const { save } = await import("@tauri-apps/plugin-dialog")
      const { writeTextFile } = await import("@tauri-apps/plugin-fs")

      vi.mocked(save).mockResolvedValueOnce("/path/to/export.json")

      await exportMontagePlan(mockPlan)

      expect(save).toHaveBeenCalledWith({
        defaultPath: "test-montage-plan.json",
        filters: [{ name: "Montage Plan", extensions: ["json"] }],
      })

      expect(writeTextFile).toHaveBeenCalled()
      const writtenData = vi.mocked(writeTextFile).mock.calls[0][1]
      const parsed = JSON.parse(writtenData)

      expect(parsed.id).toBe(mockPlan.id)
      expect(parsed.clips).toHaveLength(2)
    })

    it("should handle user cancellation", async () => {
      const { save } = await import("@tauri-apps/plugin-dialog")

      vi.mocked(save).mockResolvedValueOnce(null)

      const result = await exportMontagePlan(mockPlan)

      expect(result).toBeNull()
    })

    it("should preserve all plan properties", async () => {
      const { save } = await import("@tauri-apps/plugin-dialog")
      const { writeTextFile } = await import("@tauri-apps/plugin-fs")

      vi.mocked(save).mockResolvedValueOnce("/path/to/export.json")

      await exportMontagePlan(mockPlan)

      const writtenData = vi.mocked(writeTextFile).mock.calls[0][1]
      const parsed = JSON.parse(writtenData)

      expect(parsed.musicSettings).toEqual(mockPlan.musicSettings)
      expect(parsed.transitions).toHaveLength(1)
      expect(parsed.clips[1].effects).toContain("blur")
    })

    it("should handle write errors", async () => {
      const { save } = await import("@tauri-apps/plugin-dialog")
      const { writeTextFile } = await import("@tauri-apps/plugin-fs")

      vi.mocked(save).mockResolvedValueOnce("/path/to/export.json")
      vi.mocked(writeTextFile).mockRejectedValueOnce(new Error("Write failed"))

      await expect(exportMontagePlan(mockPlan)).rejects.toThrow("Write failed")
    })
  })

  describe("importMontagePlan", () => {
    it("should import plan from JSON file", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const { readTextFile } = await import("@tauri-apps/plugin-fs")

      vi.mocked(open).mockResolvedValueOnce("/path/to/import.json")
      vi.mocked(readTextFile).mockResolvedValueOnce(JSON.stringify(mockPlan))

      const result = await importMontagePlan()

      expect(open).toHaveBeenCalledWith({
        multiple: false,
        filters: [{ name: "Montage Plan", extensions: ["json"] }],
      })

      expect(result).toEqual(mockPlan)
    })

    it("should handle user cancellation", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")

      vi.mocked(open).mockResolvedValueOnce(null)

      const result = await importMontagePlan()

      expect(result).toBeNull()
    })

    it("should validate imported data", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const { readTextFile } = await import("@tauri-apps/plugin-fs")

      const invalidPlan = { id: "test", name: "Test" } // Missing required fields

      vi.mocked(open).mockResolvedValueOnce("/path/to/invalid.json")
      vi.mocked(readTextFile).mockResolvedValueOnce(JSON.stringify(invalidPlan))

      await expect(importMontagePlan()).rejects.toThrow()
    })

    it("should handle malformed JSON", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const { readTextFile } = await import("@tauri-apps/plugin-fs")

      vi.mocked(open).mockResolvedValueOnce("/path/to/malformed.json")
      vi.mocked(readTextFile).mockResolvedValueOnce("{ invalid json }")

      await expect(importMontagePlan()).rejects.toThrow()
    })
  })

  describe("exportMultiplePlans", () => {
    const multiplePlans: MontagePlan[] = [
      mockPlan,
      {
        ...mockPlan,
        id: "test-plan-456",
        name: "Second Plan",
      },
    ]

    it("should export multiple plans to single file", async () => {
      const { save } = await import("@tauri-apps/plugin-dialog")
      const { writeTextFile } = await import("@tauri-apps/plugin-fs")

      vi.mocked(save).mockResolvedValueOnce("/path/to/plans.json")

      await exportMultiplePlans(multiplePlans)

      const writtenData = vi.mocked(writeTextFile).mock.calls[0][1]
      const parsed = JSON.parse(writtenData)

      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(2)
      expect(parsed[0].id).toBe("test-plan-123")
      expect(parsed[1].id).toBe("test-plan-456")
    })

    it("should handle empty array", async () => {
      const { save } = await import("@tauri-apps/plugin-dialog")
      const { writeTextFile } = await import("@tauri-apps/plugin-fs")

      vi.mocked(save).mockResolvedValueOnce("/path/to/empty.json")

      await exportMultiplePlans([])

      const writtenData = vi.mocked(writeTextFile).mock.calls[0][1]
      const parsed = JSON.parse(writtenData)

      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(0)
    })
  })

  describe("importMultiplePlans", () => {
    it("should import multiple plans from file", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const { readTextFile } = await import("@tauri-apps/plugin-fs")

      const multiplePlans = [mockPlan, { ...mockPlan, id: "plan-2" }]

      vi.mocked(open).mockResolvedValueOnce("/path/to/plans.json")
      vi.mocked(readTextFile).mockResolvedValueOnce(JSON.stringify(multiplePlans))

      const result = await importMultiplePlans()

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
    })

    it("should handle single plan as array", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const { readTextFile } = await import("@tauri-apps/plugin-fs")

      vi.mocked(open).mockResolvedValueOnce("/path/to/single.json")
      vi.mocked(readTextFile).mockResolvedValueOnce(JSON.stringify(mockPlan))

      const result = await importMultiplePlans()

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockPlan)
    })
  })

  describe("exportPlanAsTemplate", () => {
    it("should convert plan to template format", async () => {
      const { save } = await import("@tauri-apps/plugin-dialog")
      const { writeTextFile } = await import("@tauri-apps/plugin-fs")

      vi.mocked(save).mockResolvedValueOnce("/path/to/template.json")

      await exportPlanAsTemplate(mockPlan, {
        category: "custom",
        tags: ["test", "custom"],
      })

      const writtenData = vi.mocked(writeTextFile).mock.calls[0][1]
      const parsed = JSON.parse(writtenData)

      expect(parsed.category).toBe("custom")
      expect(parsed.tags).toContain("test")
      expect(parsed.isBuiltIn).toBe(false)
      expect(parsed.clipRules).toBeDefined()
      expect(parsed.transitionRules).toBeDefined()
    })

    it("should derive parameters from plan", async () => {
      const { save } = await import("@tauri-apps/plugin-dialog")
      const { writeTextFile } = await import("@tauri-apps/plugin-fs")

      vi.mocked(save).mockResolvedValueOnce("/path/to/template.json")

      await exportPlanAsTemplate(mockPlan)

      const writtenData = vi.mocked(writeTextFile).mock.calls[0][1]
      const parsed = JSON.parse(writtenData)

      expect(parsed.parameters.targetDuration).toBe(mockPlan.totalDuration)
      expect(parsed.parameters.clipCount.preferred).toBe(mockPlan.clips.length)
    })

    it("should preserve music settings as template", async () => {
      const { save } = await import("@tauri-apps/plugin-dialog")
      const { writeTextFile } = await import("@tauri-apps/plugin-fs")

      vi.mocked(save).mockResolvedValueOnce("/path/to/template.json")

      await exportPlanAsTemplate(mockPlan)

      const writtenData = vi.mocked(writeTextFile).mock.calls[0][1]
      const parsed = JSON.parse(writtenData)

      expect(parsed.musicSettings).toBeDefined()
      expect(parsed.musicSettings.volume).toBe(0.3)
    })
  })
})

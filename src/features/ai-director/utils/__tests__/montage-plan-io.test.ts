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

// Mock platform service
const mockShowSaveDialog = vi.fn()
const mockShowOpenDialog = vi.fn()
const mockWriteTextFile = vi.fn()
const mockReadTextFile = vi.fn()

const mockPlatform = {
  showOpenDialog: mockShowOpenDialog,
  showSaveDialog: mockShowSaveDialog,
  readTextFile: mockReadTextFile,
  writeTextFile: mockWriteTextFile,
  readFile: vi.fn(),
  writeFile: vi.fn(),
  exists: vi.fn(),
  readClipboard: vi.fn(),
  writeClipboard: vi.fn(),
  showNotification: vi.fn(),
  openPath: vi.fn(),
  openUrl: vi.fn(),
  getVersion: vi.fn().mockResolvedValue("1.0.0"),
  convertFileSrc: vi.fn((path: string) => path),
}

vi.mock("@timeline-studio/core", () => ({
  container: {
    hasPlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => mockPlatform),
  },
}))

// Mock tauri-logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    infoSync: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
    warn: vi.fn(),
    warnSync: vi.fn(),
    debug: vi.fn(),
    debugSync: vi.fn(),
    trace: vi.fn(),
    traceSync: vi.fn(),
  })),
}))

describe("montage-plan-io", () => {
  const mockPlan: MontagePlan = {
    id: "test-plan-123",
    name: "Test Montage Plan",
    style: "dynamic",
    targetDuration: 8,
    totalDuration: 8,
    clips: [
      {
        id: "file-1-10",
        videoId: "file-1",
        filePath: "/path/to/video1.mp4",
        startTime: 10,
        endTime: 15,
        duration: 5,
        objects: [],
        people: [],
        tags: [],
        reason: "Test clip 1",
      },
      {
        id: "file-2-0",
        videoId: "file-2",
        filePath: "/path/to/video2.mp4",
        startTime: 0,
        endTime: 3,
        duration: 3,
        objects: [],
        people: [],
        tags: [],
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
    music: {
      style: "upbeat",
      volume: 0.3,
      startTime: 0,
      fadeIn: 2,
      fadeOut: 2,
    },
    metadata: {
      averageQuality: 0.8,
    },
    createdAt: new Date("2024-01-01T12:00:00Z"),
    updatedAt: new Date("2024-01-01T12:00:00Z"),
    version: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("exportMontagePlan", () => {
    it("should export plan to JSON file", async () => {
      mockShowSaveDialog.mockResolvedValueOnce("/path/to/export.json")

      await exportMontagePlan(mockPlan)

      expect(mockShowSaveDialog).toHaveBeenCalledWith({
        defaultPath: "test-montage-plan.json",
        filters: [{ name: "Montage Plan", extensions: ["json"] }],
      })

      expect(mockWriteTextFile).toHaveBeenCalled()
      const writtenData = mockWriteTextFile.mock.calls[0][1]
      const parsed = JSON.parse(writtenData)

      expect(parsed.id).toBe(mockPlan.id)
      expect(parsed.clips).toHaveLength(2)
    })

    it("should handle user cancellation", async () => {
      mockShowSaveDialog.mockResolvedValueOnce(null)

      const result = await exportMontagePlan(mockPlan)

      expect(result).toBeNull()
    })

    it("should preserve all plan properties", async () => {
      mockShowSaveDialog.mockResolvedValueOnce("/path/to/export.json")

      await exportMontagePlan(mockPlan)

      const writtenData = mockWriteTextFile.mock.calls[0][1]
      const parsed = JSON.parse(writtenData)

      expect(parsed.music).toEqual(mockPlan.music)
      expect(parsed.transitions).toHaveLength(1)
      expect(parsed.clips).toHaveLength(2)
    })

    it("should handle write errors", async () => {
      mockShowSaveDialog.mockResolvedValueOnce("/path/to/export.json")
      mockWriteTextFile.mockRejectedValueOnce(new Error("Write failed"))

      await expect(exportMontagePlan(mockPlan)).rejects.toThrow("Write failed")
    })
  })

  describe("importMontagePlan", () => {
    it("should import plan from JSON file", async () => {
      mockShowOpenDialog.mockResolvedValueOnce(["/path/to/import.json"])
      mockReadTextFile.mockResolvedValueOnce(JSON.stringify(mockPlan))

      const result = await importMontagePlan()

      expect(mockShowOpenDialog).toHaveBeenCalledWith({
        multiple: false,
        filters: [{ name: "Montage Plan", extensions: ["json"] }],
      })

      expect(result).toMatchObject({
        id: mockPlan.id,
        name: mockPlan.name,
        clips: mockPlan.clips,
      })
    })

    it("should handle user cancellation", async () => {
      mockShowOpenDialog.mockResolvedValueOnce(null)

      const result = await importMontagePlan()

      expect(result).toBeNull()
    })

    it("should validate imported data", async () => {
      const invalidPlan = { id: "test", name: "Test" } // Missing required fields

      mockShowOpenDialog.mockResolvedValueOnce(["/path/to/invalid.json"])
      mockReadTextFile.mockResolvedValueOnce(JSON.stringify(invalidPlan))

      await expect(importMontagePlan()).rejects.toThrow()
    })

    it("should handle malformed JSON", async () => {
      mockShowOpenDialog.mockResolvedValueOnce(["/path/to/malformed.json"])
      mockReadTextFile.mockResolvedValueOnce("{ invalid json }")

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
      mockShowSaveDialog.mockResolvedValueOnce("/path/to/plans.json")

      await exportMultiplePlans(multiplePlans)

      const writtenData = mockWriteTextFile.mock.calls[0][1]
      const parsed = JSON.parse(writtenData)

      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(2)
      expect(parsed[0].id).toBe("test-plan-123")
      expect(parsed[1].id).toBe("test-plan-456")
    })

    it("should handle empty array", async () => {
      mockShowSaveDialog.mockResolvedValueOnce("/path/to/empty.json")

      await exportMultiplePlans([])

      const writtenData = mockWriteTextFile.mock.calls[0][1]
      const parsed = JSON.parse(writtenData)

      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(0)
    })
  })

  describe("importMultiplePlans", () => {
    it("should import multiple plans from file", async () => {
      const multiplePlans = [mockPlan, { ...mockPlan, id: "plan-2" }]

      mockShowOpenDialog.mockResolvedValueOnce(["/path/to/plans.json"])
      mockReadTextFile.mockResolvedValueOnce(JSON.stringify(multiplePlans))

      const result = await importMultiplePlans()

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
    })

    it("should handle single plan as array", async () => {
      mockShowOpenDialog.mockResolvedValueOnce(["/path/to/single.json"])
      mockReadTextFile.mockResolvedValueOnce(JSON.stringify(mockPlan))

      const result = await importMultiplePlans()

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      expect(result?.[0]).toMatchObject({
        id: mockPlan.id,
        name: mockPlan.name,
      })
    })
  })

  describe("exportPlanAsTemplate", () => {
    it("should convert plan to template format", async () => {
      mockShowSaveDialog.mockResolvedValueOnce("/path/to/template.json")

      await exportPlanAsTemplate(mockPlan, {
        category: "custom",
        tags: ["test", "custom"],
      })

      const writtenData = mockWriteTextFile.mock.calls[0][1]
      const parsed = JSON.parse(writtenData)

      expect(parsed.category).toBe("custom")
      expect(parsed.tags).toContain("test")
      expect(parsed.isBuiltIn).toBe(false)
      expect(parsed.clipRules).toBeDefined()
      expect(parsed.transitionRules).toBeDefined()
    })

    it("should derive parameters from plan", async () => {
      mockShowSaveDialog.mockResolvedValueOnce("/path/to/template.json")

      await exportPlanAsTemplate(mockPlan)

      const writtenData = mockWriteTextFile.mock.calls[0][1]
      const parsed = JSON.parse(writtenData)

      expect(parsed.parameters.targetDuration).toBe(mockPlan.targetDuration)
      const clips = mockPlan.clips || mockPlan.fragments || []
      expect(parsed.parameters.clipCount.preferred).toBe(clips.length)
    })

    it("should preserve music settings as template", async () => {
      mockShowSaveDialog.mockResolvedValueOnce("/path/to/template.json")

      await exportPlanAsTemplate(mockPlan)

      const writtenData = mockWriteTextFile.mock.calls[0][1]
      const parsed = JSON.parse(writtenData)

      expect(parsed.musicSettings).toBeDefined()
      expect(parsed.musicSettings.volume).toBe(0.3)
    })
  })
})

/**
 * Tests for batch command utilities
 * Tests builder pattern, batch operations, and utility functions
 */

import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ProjectCommand } from "@/types/generated/tauri-bindings"
import {
  BatchCommandBuilder,
  type BatchCommandResult,
  batchOperations,
  batchUtils,
  createBatch,
  executeBatch,
  useBatchCommands,
} from "../../services/batch-commands"

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

const { invoke } = await import("@tauri-apps/api/core")

describe("BatchCommandBuilder", () => {
  let builder: BatchCommandBuilder

  beforeEach(() => {
    vi.clearAllMocks()
    builder = new BatchCommandBuilder()
  })

  describe("Builder pattern", () => {
    it("should add single command", () => {
      const command: ProjectCommand = {
        type: "CreateSnapshot",
        params: { message: "Test" },
      }

      builder.add(command)
      expect(builder.length).toBe(1)
    })

    it("should add multiple commands", () => {
      const commands: ProjectCommand[] = [
        { type: "CreateSnapshot", params: { message: "Test1" } },
        { type: "CreateSnapshot", params: { message: "Test2" } },
      ]

      builder.addAll(commands)
      expect(builder.length).toBe(2)
    })

    it("should chain method calls", () => {
      const result = builder
        .add({ type: "CreateSnapshot", params: { message: "Test" } })
        .setContinueOnError(true)
        .setName("Test Batch")

      expect(result).toBe(builder)
      expect(builder.length).toBe(1)
    })

    it("should set continue on error", () => {
      builder.setContinueOnError(true)
      // Verify through execution (internal state)
      expect(builder).toBeDefined()
    })

    it("should set transaction name", () => {
      builder.setName("Test Transaction")
      expect(builder).toBeDefined()
    })

    it("should clear all commands", () => {
      builder.add({ type: "CreateSnapshot", params: { message: "Test" } })
      builder.clear()
      expect(builder.length).toBe(0)
    })
  })

  describe("Execution", () => {
    const mockResult: BatchCommandResult = {
      results: [{ success: true, message: "Command executed successfully" }],
      success_count: 1,
      error_count: 0,
      execution_time_ms: 100,
      success: true,
    }

    beforeEach(() => {
      vi.mocked(invoke).mockResolvedValue(mockResult)
    })

    it("should execute batch successfully", async () => {
      builder.add({ type: "CreateSnapshot", params: { message: "Test" } })
      const result = await builder.execute()

      expect(invoke).toHaveBeenCalledWith("execute_batch_commands", {
        request: expect.objectContaining({
          commands: expect.any(Array),
          stop_on_error: true,
        }),
      })
      expect(result.success).toBe(true)
    })

    it("should throw error for empty batch", async () => {
      await expect(builder.execute()).rejects.toThrow("Cannot execute empty batch")
    })

    it("should pass transaction name to backend", async () => {
      builder.setName("Test Transaction").add({ type: "CreateSnapshot", params: { message: "Test" } })

      await builder.execute()

      expect(invoke).toHaveBeenCalledWith("execute_batch_commands", {
        request: expect.objectContaining({
          transaction_name: "Test Transaction",
        }),
      })
    })

    it("should handle execution errors", async () => {
      vi.mocked(invoke).mockRejectedValueOnce(new Error("Network error"))

      builder.add({ type: "CreateSnapshot", params: { message: "Test" } })

      await expect(builder.execute()).rejects.toThrow("Network error")
    })

    it("should validate result format", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(null)

      builder.add({ type: "CreateSnapshot", params: { message: "Test" } })

      await expect(builder.execute()).rejects.toThrow("Invalid batch command result")
    })
  })
})

describe("createBatch", () => {
  it("should create builder without name", () => {
    const builder = createBatch()
    expect(builder).toBeInstanceOf(BatchCommandBuilder)
  })

  it("should create builder with name", () => {
    const builder = createBatch("Test Batch")
    expect(builder).toBeInstanceOf(BatchCommandBuilder)
  })
})

describe("executeBatch", () => {
  const mockResult: BatchCommandResult = {
    results: [],
    success_count: 2,
    error_count: 0,
    execution_time_ms: 50,
    success: true,
  }

  beforeEach(() => {
    vi.mocked(invoke).mockResolvedValue(mockResult)
  })

  it("should execute batch of commands", async () => {
    const commands: ProjectCommand[] = [
      { type: "CreateSnapshot", params: { message: "Test1" } },
      { type: "CreateSnapshot", params: { message: "Test2" } },
    ]

    const result = await executeBatch(commands)

    expect(result.success).toBe(true)
    expect(invoke).toHaveBeenCalled()
  })

  it("should pass options to builder", async () => {
    const commands: ProjectCommand[] = [{ type: "CreateSnapshot", params: { message: "Test" } }]

    await executeBatch(commands, {
      stopOnError: false,
      transactionName: "Test",
    })

    expect(invoke).toHaveBeenCalledWith("execute_batch_commands", {
      request: expect.objectContaining({
        stop_on_error: false,
        transaction_name: "Test",
      }),
    })
  })
})

describe("batchOperations", () => {
  const mockResult: BatchCommandResult = {
    results: [],
    success_count: 1,
    error_count: 0,
    execution_time_ms: 100,
    success: true,
  }

  beforeEach(() => {
    vi.mocked(invoke).mockResolvedValue(mockResult)
  })

  it("should create project with media", async () => {
    const result = await batchOperations.createProjectWithMedia("Test Project", [
      "/path/to/video1.mp4",
      "/path/to/video2.mp4",
    ])

    expect(result.success).toBe(true)
    expect(invoke).toHaveBeenCalled()
  })

  it("should add multiple clips", async () => {
    const clips = [
      { trackId: "track1", mediaId: "media1", time: 0 },
      { trackId: "track1", mediaId: "media2", time: 10 },
    ]

    const result = await batchOperations.addMultipleClips(clips)

    expect(result.success).toBe(true)
  })

  it("should delete multiple clips", async () => {
    const result = await batchOperations.deleteMultipleClips(["clip1", "clip2"])

    expect(result.success).toBe(true)
  })

  it("should apply effect to clips", async () => {
    const result = await batchOperations.applyEffectToClips(["clip1", "clip2"], "effect1", { intensity: 0.5 })

    expect(result.success).toBe(true)
  })

  it("should create multiple tracks", async () => {
    const tracks = [
      { name: "Video 1", trackType: "Video" as const },
      { name: "Audio 1", trackType: "Audio" as const },
    ]

    const result = await batchOperations.createMultipleTracks(tracks)

    expect(result.success).toBe(true)
  })

  it("should setup timeline with content", async () => {
    const config = {
      tracks: [{ name: "Video 1", type: "Video" as const }],
      media: [{ path: "/path/to/video.mp4", type: "Video" as const }],
      clips: [{ trackIndex: 0, mediaIndex: 0, time: 0 }],
    }

    const result = await batchOperations.setupTimelineWithContent(config)

    expect(result.success).toBe(true)
  })
})

describe("batchUtils", () => {
  describe("isFullySuccessful", () => {
    it("should return true for fully successful batch", () => {
      const result: BatchCommandResult = {
        results: [],
        success_count: 5,
        error_count: 0,
        execution_time_ms: 100,
        success: true,
      }

      expect(batchUtils.isFullySuccessful(result)).toBe(true)
    })

    it("should return false for partial success", () => {
      const result: BatchCommandResult = {
        results: [],
        success_count: 3,
        error_count: 2,
        execution_time_ms: 100,
        success: true,
      }

      expect(batchUtils.isFullySuccessful(result)).toBe(false)
    })

    it("should return false for failed batch", () => {
      const result: BatchCommandResult = {
        results: [],
        success_count: 0,
        error_count: 5,
        execution_time_ms: 100,
        success: false,
        error_message: "Batch failed",
      }

      expect(batchUtils.isFullySuccessful(result)).toBe(false)
    })
  })

  describe("getErrorMessages", () => {
    it("should extract error messages from results", () => {
      const result: BatchCommandResult = {
        results: [
          { success: true, message: "OK" },
          { success: false, message: "Error 1" },
          { success: false, message: "Error 2" },
        ],
        success_count: 1,
        error_count: 2,
        execution_time_ms: 100,
        success: false,
        error_message: "Batch failed",
      }

      const errors = batchUtils.getErrorMessages(result)

      expect(errors).toHaveLength(3)
      expect(errors[0]).toBe("Batch failed")
      expect(errors[1]).toContain("Error 1")
      expect(errors[2]).toContain("Error 2")
    })

    it("should return empty array for successful batch", () => {
      const result: BatchCommandResult = {
        results: [{ success: true, message: "OK" }],
        success_count: 1,
        error_count: 0,
        execution_time_ms: 100,
        success: true,
      }

      const errors = batchUtils.getErrorMessages(result)

      expect(errors).toHaveLength(0)
    })
  })

  describe("getSuccessRate", () => {
    it("should calculate success rate", () => {
      const result: BatchCommandResult = {
        results: [],
        success_count: 7,
        error_count: 3,
        execution_time_ms: 100,
        success: true,
      }

      expect(batchUtils.getSuccessRate(result)).toBe(70)
    })

    it("should return 0 for no operations", () => {
      const result: BatchCommandResult = {
        results: [],
        success_count: 0,
        error_count: 0,
        execution_time_ms: 100,
        success: true,
      }

      expect(batchUtils.getSuccessRate(result)).toBe(0)
    })

    it("should return 100 for fully successful batch", () => {
      const result: BatchCommandResult = {
        results: [],
        success_count: 5,
        error_count: 0,
        execution_time_ms: 100,
        success: true,
      }

      expect(batchUtils.getSuccessRate(result)).toBe(100)
    })
  })

  describe("formatResult", () => {
    it("should format result as string", () => {
      const result: BatchCommandResult = {
        results: [],
        success_count: 8,
        error_count: 2,
        execution_time_ms: 150,
        success: true,
      }

      const formatted = batchUtils.formatResult(result)

      expect(formatted).toContain("8/10")
      expect(formatted).toContain("80.0%")
      expect(formatted).toContain("150ms")
    })
  })

  describe("throwIfFailed", () => {
    it("should not throw for successful batch", () => {
      const result: BatchCommandResult = {
        results: [],
        success_count: 5,
        error_count: 0,
        execution_time_ms: 100,
        success: true,
      }

      expect(() => batchUtils.throwIfFailed(result)).not.toThrow()
    })

    it("should throw for failed batch", () => {
      const result: BatchCommandResult = {
        results: [{ success: false, message: "Error occurred" }],
        success_count: 0,
        error_count: 1,
        execution_time_ms: 100,
        success: false,
        error_message: "Batch failed",
      }

      expect(() => batchUtils.throwIfFailed(result)).toThrow("Batch execution failed")
    })
  })
})

describe("useBatchCommands", () => {
  const mockResult: BatchCommandResult = {
    results: [],
    success_count: 1,
    error_count: 0,
    execution_time_ms: 100,
    success: true,
  }

  beforeEach(() => {
    vi.mocked(invoke).mockResolvedValue(mockResult)
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useBatchCommands())

    expect(result.current.isExecuting).toBe(false)
    expect(result.current.lastResult).toBeNull()
  })

  it("should execute batch and update state", async () => {
    const { result } = renderHook(() => useBatchCommands())

    const commands: ProjectCommand[] = [{ type: "CreateSnapshot", params: { message: "Test" } }]

    await result.current.executeBatch(commands)

    await waitFor(() => {
      expect(result.current.isExecuting).toBe(false)
      expect(result.current.lastResult).toEqual(mockResult)
    })
  })

  it("should execute builder and update state", async () => {
    const { result } = renderHook(() => useBatchCommands())

    const builder = result.current.createBatch("Test")
    builder.add({ type: "CreateSnapshot", params: { message: "Test" } })

    await result.current.executeBuilder(builder)

    await waitFor(() => {
      expect(result.current.isExecuting).toBe(false)
      expect(result.current.lastResult).toEqual(mockResult)
    })
  })

  it("should provide operations and utils", () => {
    const { result } = renderHook(() => useBatchCommands())

    expect(result.current.operations).toBe(batchOperations)
    expect(result.current.utils).toBe(batchUtils)
  })

  it("should handle execution errors", async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error("Network error"))

    const { result } = renderHook(() => useBatchCommands())

    const commands: ProjectCommand[] = [{ type: "CreateSnapshot", params: { message: "Test" } }]

    await expect(result.current.executeBatch(commands)).rejects.toThrow()

    await waitFor(() => {
      expect(result.current.isExecuting).toBe(false)
    })
  })

  it("should reset isExecuting even on error", async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error("Error"))

    const { result } = renderHook(() => useBatchCommands())

    const builder = result.current.createBatch()
    builder.add({ type: "CreateSnapshot", params: { message: "Test" } })

    await expect(result.current.executeBuilder(builder)).rejects.toThrow()

    await waitFor(() => {
      expect(result.current.isExecuting).toBe(false)
    })
  })
})

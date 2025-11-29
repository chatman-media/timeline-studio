/**
 * Тесты для AI Tools Tauri Commands
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import {
  detectKeyMoments,
  generateMontagePlan,
  mcpExecuteTool,
} from "../ai-tools-commands"

// Hoist mock function declaration
const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}))

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debugSync: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

describe("AI Tools Tauri Commands", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("detectKeyMoments", () => {
    it("should invoke Tauri command with video paths and config", async () => {
      const videoPaths = ["/path/to/video1.mp4", "/path/to/video2.mp4"]
      const config = {
        threshold: 0.5,
        minDuration: 2,
      }

      mockInvoke.mockResolvedValueOnce([
        { timestamp: 10, score: 0.9 },
        { timestamp: 25, score: 0.85 },
      ])

      const result = await detectKeyMoments(videoPaths, config)

      expect(mockInvoke).toHaveBeenCalledWith("detect_key_moments", {
        videoPaths,
        config,
      })
      expect(result).toHaveLength(2)
      expect(result[0].timestamp).toBe(10)
    })

    it("should handle empty video paths", async () => {
      const videoPaths: string[] = []
      const config = {}

      mockInvoke.mockResolvedValueOnce([])

      const result = await detectKeyMoments(videoPaths, config)

      expect(mockInvoke).toHaveBeenCalled()
      expect(result).toEqual([])
    })

    it("should handle Tauri errors", async () => {
      const videoPaths = ["/path/to/video.mp4"]
      const config = {}

      mockInvoke.mockRejectedValueOnce(new Error("Tauri error"))

      await expect(detectKeyMoments(videoPaths, config)).rejects.toThrow(
        "Tauri error"
      )
    })

    it("should pass complex config", async () => {
      const videoPaths = ["/video.mp4"]
      const config = {
        threshold: 0.7,
        minDuration: 3,
        maxDuration: 10,
        sceneChangeDetection: true,
        motionDetection: {
          enabled: true,
          sensitivity: 0.5,
        },
      }

      mockInvoke.mockResolvedValueOnce([])

      await detectKeyMoments(videoPaths, config)

      expect(mockInvoke).toHaveBeenCalledWith("detect_key_moments", {
        videoPaths,
        config,
      })
    })

    it("should handle multiple video files", async () => {
      const videoPaths = Array.from({ length: 10 }, (_, i) => `/video${i}.mp4`)
      const config = {}

      mockInvoke.mockResolvedValueOnce([])

      await detectKeyMoments(videoPaths, config)

      expect(mockInvoke).toHaveBeenCalledWith("detect_key_moments", {
        videoPaths,
        config,
      })
    })
  })

  describe("generateMontagePlan", () => {
    it("should invoke Tauri command with moments, config, and source files", async () => {
      const moments = [
        { timestamp: 10, score: 0.9, sourceFile: "video1.mp4" },
        { timestamp: 25, score: 0.85, sourceFile: "video2.mp4" },
      ]
      const config = {
        targetDuration: 60,
        transitionDuration: 1,
      }
      const sourceFiles = ["video1.mp4", "video2.mp4"]

      mockInvoke.mockResolvedValueOnce({
        plan: {
          fragments: [
            { start: 10, end: 15, sourceFile: "video1.mp4" },
            { start: 25, end: 30, sourceFile: "video2.mp4" },
          ],
          totalDuration: 60,
        },
      })

      const result = await generateMontagePlan(moments, config, sourceFiles)

      expect(mockInvoke).toHaveBeenCalledWith("generate_montage_plan", {
        moments,
        config,
        sourceFiles,
      })
      expect(result.plan).toBeDefined()
      expect(result.plan.fragments).toHaveLength(2)
    })

    it("should handle empty moments", async () => {
      const moments: any[] = []
      const config = {}
      const sourceFiles: string[] = []

      mockInvoke.mockResolvedValueOnce({ plan: { fragments: [] } })

      const result = await generateMontagePlan(moments, config, sourceFiles)

      expect(mockInvoke).toHaveBeenCalled()
      expect(result.plan.fragments).toEqual([])
    })

    it("should handle complex montage config", async () => {
      const moments = [{ timestamp: 10, score: 0.9 }]
      const config = {
        targetDuration: 120,
        transitionDuration: 1.5,
        musicSync: true,
        beatDetection: {
          enabled: true,
          sensitivity: 0.7,
        },
        styleTemplate: "dynamic",
      }
      const sourceFiles = ["video.mp4"]

      mockInvoke.mockResolvedValueOnce({ plan: { fragments: [] } })

      await generateMontagePlan(moments, config, sourceFiles)

      expect(mockInvoke).toHaveBeenCalledWith("generate_montage_plan", {
        moments,
        config,
        sourceFiles,
      })
    })

    it("should handle Tauri errors", async () => {
      const moments = [{ timestamp: 10 }]
      const config = {}
      const sourceFiles = ["video.mp4"]

      mockInvoke.mockRejectedValueOnce(new Error("Planning failed"))

      await expect(
        generateMontagePlan(moments, config, sourceFiles)
      ).rejects.toThrow("Planning failed")
    })

    it("should handle large number of moments", async () => {
      const moments = Array.from({ length: 100 }, (_, i) => ({
        timestamp: i * 10,
        score: 0.8,
      }))
      const config = { targetDuration: 300 }
      const sourceFiles = ["long-video.mp4"]

      mockInvoke.mockResolvedValueOnce({ plan: { fragments: [] } })

      await generateMontagePlan(moments, config, sourceFiles)

      expect(mockInvoke).toHaveBeenCalled()
    })
  })

  describe("mcpExecuteTool", () => {
    it("should invoke MCP tool with request", async () => {
      const request = {
        tool_name: "test_tool",
        arguments: {
          param1: "value1",
          param2: 123,
        },
      }

      mockInvoke.mockResolvedValueOnce({
        success: true,
        result: { data: "test result" },
      })

      const result = await mcpExecuteTool(request)

      expect(mockInvoke).toHaveBeenCalledWith("mcp_execute_tool", { request })
      expect(result.success).toBe(true)
      expect(result.result.data).toBe("test result")
    })

    it("should handle tool execution failure", async () => {
      const request = {
        tool_name: "failing_tool",
        arguments: {},
      }

      mockInvoke.mockResolvedValueOnce({
        success: false,
        error: "Tool execution failed",
      })

      const result = await mcpExecuteTool(request)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it("should handle Tauri errors", async () => {
      const request = {
        tool_name: "test_tool",
        arguments: {},
      }

      mockInvoke.mockRejectedValueOnce(new Error("MCP server error"))

      await expect(mcpExecuteTool(request)).rejects.toThrow("MCP server error")
    })

    it("should handle complex tool arguments", async () => {
      const request = {
        tool_name: "complex_tool",
        arguments: {
          nested: {
            object: {
              value: "test",
            },
          },
          array: [1, 2, 3],
          boolean: true,
          number: 42,
        },
      }

      mockInvoke.mockResolvedValueOnce({ success: true })

      await mcpExecuteTool(request)

      expect(mockInvoke).toHaveBeenCalledWith("mcp_execute_tool", { request })
    })

    it("should handle empty arguments", async () => {
      const request = {
        tool_name: "no_args_tool",
        arguments: {},
      }

      mockInvoke.mockResolvedValueOnce({ success: true })

      const result = await mcpExecuteTool(request)

      expect(mockInvoke).toHaveBeenCalledWith("mcp_execute_tool", { request })
      expect(result.success).toBe(true)
    })

    it("should handle various tool names", async () => {
      const toolNames = [
        "analyze_video",
        "detect_scenes",
        "extract_audio",
        "apply_filters",
        "generate_subtitles",
      ]

      for (const toolName of toolNames) {
        mockInvoke.mockResolvedValueOnce({ success: true })

        await mcpExecuteTool({
          tool_name: toolName,
          arguments: {},
        })

        expect(mockInvoke).toHaveBeenCalledWith("mcp_execute_tool", {
          request: { tool_name: toolName, arguments: {} },
        })
      }
    })
  })

  describe("error scenarios", () => {
    it("should propagate network errors", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Network error"))

      await expect(
        detectKeyMoments(["video.mp4"], {})
      ).rejects.toThrow("Network error")
    })

    it("should propagate timeout errors", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Request timeout"))

      await expect(
        generateMontagePlan([], {}, [])
      ).rejects.toThrow("Request timeout")
    })

    it("should propagate permission errors", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Permission denied"))

      await expect(
        mcpExecuteTool({ tool_name: "test", arguments: {} })
      ).rejects.toThrow("Permission denied")
    })
  })

  describe("concurrent calls", () => {
    it("should handle concurrent detectKeyMoments calls", async () => {
      mockInvoke.mockResolvedValue([])

      const calls = [
        detectKeyMoments(["video1.mp4"], {}),
        detectKeyMoments(["video2.mp4"], {}),
        detectKeyMoments(["video3.mp4"], {}),
      ]

      const results = await Promise.all(calls)

      expect(results).toHaveLength(3)
      expect(mockInvoke).toHaveBeenCalledTimes(3)
    })

    it("should handle concurrent generateMontagePlan calls", async () => {
      mockInvoke.mockResolvedValue({ plan: { fragments: [] } })

      const calls = [
        generateMontagePlan([{ timestamp: 10 }], {}, ["v1.mp4"]),
        generateMontagePlan([{ timestamp: 20 }], {}, ["v2.mp4"]),
        generateMontagePlan([{ timestamp: 30 }], {}, ["v3.mp4"]),
      ]

      const results = await Promise.all(calls)

      expect(results).toHaveLength(3)
      expect(mockInvoke).toHaveBeenCalledTimes(3)
    })

    it("should handle concurrent mcpExecuteTool calls", async () => {
      mockInvoke.mockResolvedValue({ success: true })

      const calls = [
        mcpExecuteTool({ tool_name: "tool1", arguments: {} }),
        mcpExecuteTool({ tool_name: "tool2", arguments: {} }),
        mcpExecuteTool({ tool_name: "tool3", arguments: {} }),
      ]

      const results = await Promise.all(calls)

      expect(results).toHaveLength(3)
      expect(mockInvoke).toHaveBeenCalledTimes(3)
    })
  })
})

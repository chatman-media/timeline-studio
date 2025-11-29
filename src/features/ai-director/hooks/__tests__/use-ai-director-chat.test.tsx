/**
 * @vitest-environment jsdom
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { FileAnalysisProgress } from "../../types/analysis-progress"
import { useAIDirectorChat } from "../use-ai-director-chat"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    infoSync: vi.fn(),
    errorSync: vi.fn(),
  }),
}))

// Mock container
const mockExecuteCommand = vi.fn()
vi.mock("@/core", () => ({
  container: {
    hasBackend: () => true,
    getBackend: () => ({
      executeCommand: mockExecuteCommand,
    }),
  },
}))

describe("useAIDirectorChat", () => {
  const mockFilesProgress: FileAnalysisProgress[] = [
    {
      fileId: "file-1",
      fileName: "video1.mp4",
      filePath: "/path/to/video1.mp4",
      status: "completed",
      progress: 100,
      startTime: new Date().toISOString(),
      analyzers: [
        {
          type: "scene_detection",
          status: "completed",
          progress: 100,
          result: {
            success: true,
            type: "scene_detection",
            metadata: {
              processingTime: 100,
              itemsFound: 5,
              confidence: 0.9,
            },
          },
        },
      ],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Initial State", () => {
    it("should initialize with empty messages", () => {
      const { result } = renderHook(() => useAIDirectorChat(mockFilesProgress))

      expect(result.current.messages).toEqual([])
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.lastMontagePlan).toBeNull()
    })
  })

  describe("Sending Messages", () => {
    it("should send message and receive response", async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        success: true,
        data: {
          response: "Here is your montage plan",
          message_id: "msg-123",
          model: "claude-3-5-sonnet-20241022",
        },
      })

      const { result } = renderHook(() => useAIDirectorChat(mockFilesProgress))

      await act(async () => {
        await result.current.sendMessage("Create a 2-minute montage")
      })

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2) // user + assistant
      })

      expect(result.current.messages[0].role).toBe("user")
      expect(result.current.messages[0].content).toBe("Create a 2-minute montage")
      expect(result.current.messages[1].role).toBe("assistant")
      expect(result.current.messages[1].content).toBe("Here is your montage plan")
    })

    it("should set isProcessing while sending", async () => {
      mockExecuteCommand.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: {
                  response: "Response",
                  message_id: "msg-123",
                },
              })
            }, 100)
          }),
      )

      const { result } = renderHook(() => useAIDirectorChat(mockFilesProgress))

      act(() => {
        result.current.sendMessage("Test message")
      })

      expect(result.current.isProcessing).toBe(true)

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })
    })

    it("should handle error responses", async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        success: false,
        error: "API error",
      })

      const { result } = renderHook(() => useAIDirectorChat(mockFilesProgress))

      await act(async () => {
        await result.current.sendMessage("Test message")
      })

      await waitFor(() => {
        expect(result.current.error).toBe("API error")
      })

      // Should add error message
      expect(result.current.messages).toHaveLength(2)
      expect(result.current.messages[1].role).toBe("assistant")
      expect(result.current.messages[1].content).toContain("ошибка")
    })

    it("should parse montage plan from response", async () => {
      const montagePlanJSON = {
        name: "Test Montage",
        style: "dynamic",
        target_duration: 120,
        clips: [
          {
            file: "video1.mp4",
            start: 10,
            end: 20,
            reason: "High quality",
          },
        ],
      }

      mockExecuteCommand.mockResolvedValueOnce({
        success: true,
        data: {
          response: `Here is your plan:\n\`\`\`json\n${JSON.stringify(montagePlanJSON)}\n\`\`\``,
          message_id: "msg-123",
        },
      })

      const onMontagePlanCreated = vi.fn()
      const { result } = renderHook(() => useAIDirectorChat(mockFilesProgress, { onMontagePlanCreated }))

      await act(async () => {
        await result.current.sendMessage("Create a montage")
      })

      await waitFor(() => {
        expect(result.current.lastMontagePlan).toBeTruthy()
      })

      expect(result.current.lastMontagePlan?.name).toBe("Test Montage")
      expect(onMontagePlanCreated).toHaveBeenCalled()
    })

    it("should include analysis context in request", async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        success: true,
        data: {
          response: "Response",
          message_id: "msg-123",
        },
      })

      const { result } = renderHook(() => useAIDirectorChat(mockFilesProgress))

      await act(async () => {
        await result.current.sendMessage("Test")
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "SendChatMessage",
          params: expect.objectContaining({
            project_context: expect.objectContaining({
              type: "ai_director_analysis",
              analysis_context: expect.any(String),
              files_analyzed: 1,
              completed_files: 1,
            }),
          }),
        }),
      )
    })

    it("should handle error responses from backend", async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        success: false,
        error: "Backend connection error",
      })

      const { result } = renderHook(() => useAIDirectorChat(mockFilesProgress))

      await act(async () => {
        await result.current.sendMessage("Test")
      })

      await waitFor(() => {
        expect(result.current.error).toContain("Backend connection error")
      })
    })
  })

  describe("Clearing Messages", () => {
    it("should clear messages and reset state", async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        success: true,
        data: {
          response: "Response",
          message_id: "msg-123",
        },
      })

      const { result } = renderHook(() => useAIDirectorChat(mockFilesProgress))

      await act(async () => {
        await result.current.sendMessage("Test")
      })

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2)
      })

      act(() => {
        result.current.clearMessages()
      })

      expect(result.current.messages).toEqual([])
      expect(result.current.error).toBeNull()
      expect(result.current.lastMontagePlan).toBeNull()
    })
  })

  describe("Analysis Context", () => {
    it("should wait for completed analysis", () => {
      const filesInProgress: FileAnalysisProgress[] = [
        {
          fileId: "file-1",
          fileName: "video1.mp4",
          filePath: "/path/to/video1.mp4",
          status: "analyzing",
          progress: 50,
          startTime: new Date().toISOString(),
          analyzers: [],
        },
      ]

      const { result } = renderHook(() => useAIDirectorChat(filesInProgress))

      expect(result.current.messages).toEqual([])
    })

    it("should use completed files only", async () => {
      const mixedProgress: FileAnalysisProgress[] = [
        {
          fileId: "file-1",
          fileName: "video1.mp4",
          filePath: "/path/to/video1.mp4",
          status: "completed",
          progress: 100,
          startTime: new Date().toISOString(),
          analyzers: [],
        },
        {
          fileId: "file-2",
          fileName: "video2.mp4",
          filePath: "/path/to/video2.mp4",
          status: "analyzing",
          progress: 50,
          startTime: new Date().toISOString(),
          analyzers: [],
        },
      ]

      mockExecuteCommand.mockResolvedValueOnce({
        success: true,
        data: {
          response: "Response",
          message_id: "msg-123",
        },
      })

      const { result } = renderHook(() => useAIDirectorChat(mixedProgress))

      await act(async () => {
        await result.current.sendMessage("Test")
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            project_context: expect.objectContaining({
              completed_files: 1,
              files_analyzed: 2,
            }),
          }),
        }),
      )
    })
  })
})

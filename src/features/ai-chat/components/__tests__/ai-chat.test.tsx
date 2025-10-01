import { fireEvent, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render } from "@/test/test-utils"
import { AiChat } from "../ai-chat"

// Мокаем зависимости
vi.mock("@/domains/ai-core/services", () => ({
  UnifiedAIService: {
    getInstance: () => ({
      getAvailableModels: vi.fn().mockResolvedValue([
        {
          id: "claude-4-sonnet-latest",
          name: "Claude 4 Sonnet",
          provider: "claude",
          supportsTools: true,
          supportsStreaming: true,
          maxTokens: 200000,
        },
        {
          id: "gpt-4",
          name: "GPT-4",
          provider: "openai",
          supportsTools: false,
          supportsStreaming: true,
          maxTokens: 8192,
        },
      ]),
      sendStreamingRequest: vi.fn().mockImplementation(async (_model, _messages, options) => {
        // Имитируем потоковый ответ
        const response = "This is a test response from AI"
        for (const char of response) {
          await new Promise((resolve) => setTimeout(resolve, 10))
          options.onContent?.(char)
        }
        options.onComplete?.(response)
      }),
    }),
  },
}))

vi.mock("../hooks/use-chat", () => ({
  useChat: () => ({
    chatMessages: [],
    sendChatMessage: vi.fn(),
    receiveChatMessage: vi.fn(),
    selectedAgentId: "claude-4-sonnet-latest",
    selectAgent: vi.fn(),
    isProcessing: false,
    setProcessing: vi.fn(),
    currentSessionId: "test-session",
    sessions: [],
    isCreatingNewChat: false,
    createNewChat: vi.fn(),
    switchSession: vi.fn(),
    deleteSession: vi.fn(),
    updateSessions: vi.fn(),
    clearMessages: vi.fn(),
  }),
}))

vi.mock("@/features/user-settings/hooks/use-api-keys", () => ({
  useApiKeys: () => ({
    getApiKeyInfo: vi.fn().mockReturnValue({
      has_value: true,
      is_valid: true,
    }),
  }),
}))

vi.mock("@/features/modals", () => ({
  useModal: () => ({
    openModal: vi.fn(),
  }),
}))

vi.mock("@/features/media/hooks/use-media-import", () => ({
  useMediaImport: () => ({
    importFile: vi.fn(),
  }),
}))

vi.mock("@/domains/video-editing/hooks", () => ({
  useTimeline: () => ({
    project: null,
    uiState: null,
  }),
}))

vi.mock("../hooks/use-resources-ai-integration", () => ({
  useResourcesAIIntegration: () => ({
    isIntegrated: false,
    resourceStats: null,
  }),
}))

vi.mock("../services/chat-storage-service", () => ({
  chatStorageService: {
    addMessage: vi.fn(),
    createSession: vi.fn(),
    getAllSessions: vi.fn().mockResolvedValue([]),
  },
}))

describe("AiChat", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render chat interface", async () => {
    const { getByPlaceholderText, getByTestId } = render(<AiChat />)

    // Wait for models to load
    await waitFor(() => {
      expect(getByPlaceholderText(/Type your message/i)).toBeInTheDocument()
    })
  })

  it("should load available models on mount", async () => {
    const { container } = render(<AiChat />)

    const UnifiedAIService = await import("@/domains/ai-core/services")
    const mockGetModels = UnifiedAIService.UnifiedAIService.getInstance().getAvailableModels as any

    await waitFor(() => {
      expect(mockGetModels).toHaveBeenCalled()
    })
  })

  it("should send message when enter is pressed", async () => {
    const { getByPlaceholderText } = render(<AiChat />)

    const input = getByPlaceholderText(/Type your message/i) as HTMLTextAreaElement

    // Type a message
    fireEvent.change(input, { target: { value: "Hello AI!" } })
    expect(input.value).toBe("Hello AI!")

    // Press Enter
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" })

    // Check that input was cleared
    await waitFor(() => {
      expect(input.value).toBe("")
    })
  })

  it("should not send empty messages", async () => {
    const { getByPlaceholderText } = render(<AiChat />)
    const UnifiedAIService = await import("@/domains/ai-core/services")
    const mockSendRequest = UnifiedAIService.UnifiedAIService.getInstance().sendStreamingRequest as any

    const input = getByPlaceholderText(/Type your message/i) as HTMLTextAreaElement

    // Try to send empty message
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" })

    expect(mockSendRequest).not.toHaveBeenCalled()
  })

  it("should show streaming response", async () => {
    const { getByPlaceholderText, getByText } = render(<AiChat />)

    const input = getByPlaceholderText(/Type your message/i) as HTMLTextAreaElement

    // Send a message
    fireEvent.change(input, { target: { value: "Test message" } })
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" })

    // Wait for streaming to start
    await waitFor(() => {
      // Check if streaming content appears
      expect(getByText(/This is a test/i)).toBeInTheDocument()
    })
  })

  it("should handle API key validation", async () => {
    const mockGetApiKeyInfo = vi.fn().mockReturnValue({
      has_value: false,
      is_valid: false,
    })

    vi.doMock("@/features/user-settings/hooks/use-api-keys", () => ({
      useApiKeys: () => ({
        getApiKeyInfo: mockGetApiKeyInfo,
      }),
    }))

    const mockOpenModal = vi.fn()
    vi.doMock("@/features/modals", () => ({
      useModal: () => ({
        openModal: mockOpenModal,
      }),
    }))

    const { getByPlaceholderText } = render(<AiChat />)

    const input = getByPlaceholderText(/Type your message/i) as HTMLTextAreaElement

    // Try to send message without API key
    fireEvent.change(input, { target: { value: "Test" } })
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" })

    await waitFor(() => {
      expect(mockOpenModal).toHaveBeenCalledWith("user-settings")
    })
  })

  it("should handle Shift+Enter for new line", () => {
    const { getByPlaceholderText } = render(<AiChat />)

    const input = getByPlaceholderText(/Type your message/i) as HTMLTextAreaElement

    fireEvent.change(input, { target: { value: "Line 1" } })
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", shiftKey: true })

    // Input should not be cleared with Shift+Enter
    expect(input.value).toBe("Line 1")
  })

  it("should cancel streaming with stop button", async () => {
    const { getByPlaceholderText, getByRole } = render(<AiChat />)

    const input = getByPlaceholderText(/Type your message/i) as HTMLTextAreaElement

    // Send a message to start streaming
    fireEvent.change(input, { target: { value: "Test" } })
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" })

    // Wait for streaming to start and find stop button
    await waitFor(() => {
      const stopButton = getByRole("button", { name: /stop/i })
      expect(stopButton).toBeInTheDocument()

      // Click stop button
      fireEvent.click(stopButton)
    })
  })
})

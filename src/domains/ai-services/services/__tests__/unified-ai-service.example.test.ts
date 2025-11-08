/**
 * Unified AI Service - Usage Examples
 *
 * Эти тесты показывают примеры использования UnifiedAIService.
 * Для реальных тестов требуется mock Tauri API.
 */

import { describe, expect, it } from "vitest"
import type { AIMessage, UnifiedAIRequest } from "../../../../types/generated/tauri-bindings"

describe("UnifiedAIService Usage Examples", () => {
  // Примеры структур данных

  it("should define correct UnifiedAIRequest structure", () => {
    const request: UnifiedAIRequest = {
      provider: "claude",
      model: "claude-sonnet-4",
      messages: [
        {
          role: "user",
          content: "Hello, how are you?",
        },
      ],
      maxTokens: 1024,
      temperature: 0.7,
      stream: false,
      system: "You are a helpful assistant.",
      tools: null,
      toolChoice: null,
    }

    expect(request.provider).toBe("claude")
    expect(request.messages).toHaveLength(1)
  })

  it("should define correct streaming request", () => {
    const streamingRequest: UnifiedAIRequest = {
      provider: "openai",
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a creative storyteller.",
        },
        {
          role: "user",
          content: "Tell me a story about a brave knight.",
        },
      ],
      maxTokens: 2048,
      temperature: 0.8,
      stream: true,
      system: null,
      tools: null,
      toolChoice: null,
    }

    expect(streamingRequest.stream).toBe(true)
    expect(streamingRequest.messages).toHaveLength(2)
  })

  it("should define correct request with tools", () => {
    const requestWithTools: UnifiedAIRequest = {
      provider: "claude",
      model: "claude-sonnet-4",
      messages: [
        {
          role: "user",
          content: "What's the weather in San Francisco?",
        },
      ],
      maxTokens: 1024,
      temperature: 0.5,
      stream: false,
      system: "You are a helpful assistant with access to weather information.",
      tools: [
        {
          name: "get_weather",
          description: "Get current weather information for a location",
          inputSchema: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "City name or coordinates",
              },
              units: {
                type: "string",
                enum: ["celsius", "fahrenheit"],
                description: "Temperature units",
              },
            },
            required: ["location"],
          },
        },
      ],
      toolChoice: { tool: { name: "get_weather" } },
    }

    expect(requestWithTools.tools).toBeDefined()
    expect(requestWithTools.tools).toHaveLength(1)
    expect(requestWithTools.tools?.[0].name).toBe("get_weather")
  })

  it("should define AIMessage structure", () => {
    const messages: AIMessage[] = [
      {
        role: "system",
        content: "You are a helpful AI assistant.",
      },
      {
        role: "user",
        content: "Hello!",
      },
      {
        role: "assistant",
        content: "Hello! How can I help you today?",
      },
      {
        role: "user",
        content: "What can you do?",
      },
    ]

    expect(messages).toHaveLength(4)
    expect(messages[0].role).toBe("system")
    expect(messages[1].role).toBe("user")
    expect(messages[2].role).toBe("assistant")
  })

  // Примеры использования (закомментированы, требуют mock)
  /*
  it("example: send simple request", async () => {
    const response = await unifiedAIService.sendRequest({
      provider: "claude",
      model: "claude-sonnet-4",
      messages: [{ role: "user", content: "Hello!" }],
      maxTokens: 100,
      temperature: 0.7,
      stream: false,
      system: null,
      tools: null,
      toolChoice: null,
    });

    expect(response.content).toBeDefined();
    expect(response.provider).toBe("claude");
  });

  it("example: send streaming request", async () => {
    const chunks: string[] = [];
    let fullContent = "";

    const requestId = await unifiedAIService.sendStreamingRequest(
      {
        provider: "claude",
        model: "claude-sonnet-4",
        messages: [{ role: "user", content: "Tell me a story" }],
        stream: true,
        maxTokens: null,
        temperature: null,
        system: null,
        tools: null,
        toolChoice: null,
      },
      {
        onChunk: (chunk) => chunks.push(chunk),
        onComplete: (content) => { fullContent = content },
        onError: (error) => console.error(error),
      }
    );

    expect(requestId).toBeDefined();
    // Wait for completion...
    // expect(chunks.length).toBeGreaterThan(0);
    // expect(fullContent).toBeTruthy();
  });

  it("example: get cache stats", async () => {
    const stats = await unifiedAIService.getCacheStats();

    expect(stats.totalEntries).toBeGreaterThanOrEqual(0);
    expect(stats.totalHits).toBeGreaterThanOrEqual(0);
    expect(stats.maxEntries).toBeGreaterThan(0);
  });

  it("example: validate provider", async () => {
    const status = await unifiedAIService.validateProvider(
      "claude",
      "sk-ant-test-key"
    );

    expect(status.provider).toBe("claude");
    expect(status.models).toBeDefined();
  });

  it("example: get supported providers", async () => {
    const providers = await unifiedAIService.getSupportedProviders();

    expect(providers).toContain("claude");
    expect(providers).toContain("openai");
    expect(providers).toContain("deepseek");
    expect(providers).toContain("ollama");
  });

  it("example: send request with fallback", async () => {
    const response = await unifiedAIService.sendRequestWithFallback(
      [
        ["claude", "sk-ant-..."],
        ["openai", "sk-..."],
        ["ollama", ""],
      ],
      {
        provider: "claude",
        model: "claude-sonnet-4",
        messages: [{ role: "user", content: "Hello" }],
        maxTokens: null,
        temperature: null,
        stream: false,
        system: null,
        tools: null,
        toolChoice: null,
      }
    );

    expect(response.content).toBeDefined();
  });
  */
})

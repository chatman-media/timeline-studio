/**
 * Unified AI Service - React Component Example
 *
 * Примеры использования UnifiedAIService в React компонентах.
 */

import { useState } from "react"
import { type CacheStats, type ProviderStatus, unifiedAIService } from "../unified-ai-service"

/**
 * Пример 1: Простой чат с AI
 */
export function SimpleAIChatExample() {
  const [message, setMessage] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!message.trim()) return

    setLoading(true)
    try {
      const result = await unifiedAIService.sendRequest({
        provider: "claude",
        model: "claude-sonnet-4",
        messages: [{ role: "user", content: message }],
        maxTokens: 1024,
        temperature: 0.7,
        stream: false,
        system: "You are a helpful assistant.",
        tools: null,
        toolChoice: null,
      })

      setResponse(result.content)
    } catch (error) {
      console.error("Error:", error)
      setResponse(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Simple AI Chat</h2>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="w-full p-2 border rounded"
        disabled={loading}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {loading ? "Sending..." : "Send"}
      </button>
      {response && (
        <div className="p-4 bg-gray-100 rounded">
          <p className="font-semibold">Response:</p>
          <p>{response}</p>
        </div>
      )}
    </div>
  )
}

/**
 * Пример 2: Streaming чат
 */
export function StreamingAIChatExample() {
  const [message, setMessage] = useState("")
  const [streamingText, setStreamingText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)

  const handleStream = async () => {
    if (!message.trim()) return

    setIsStreaming(true)
    setStreamingText("")

    try {
      await unifiedAIService.sendStreamingRequest(
        {
          provider: "claude",
          model: "claude-sonnet-4",
          messages: [{ role: "user", content: message }],
          stream: true,
          maxTokens: null,
          temperature: 0.8,
          system: null,
          tools: null,
          toolChoice: null,
        },
        {
          onChunk: (chunk) => {
            setStreamingText((prev) => prev + chunk)
          },
          onComplete: (fullContent) => {
            console.log("Streaming complete:", fullContent)
            setIsStreaming(false)
          },
          onError: (error) => {
            console.error("Streaming error:", error)
            setStreamingText(`Error: ${error}`)
            setIsStreaming(false)
          },
        },
      )
    } catch (error) {
      console.error("Error:", error)
      setIsStreaming(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Streaming AI Chat</h2>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="w-full p-2 border rounded"
        disabled={isStreaming}
      />
      <button
        type="button"
        onClick={handleStream}
        disabled={isStreaming}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        {isStreaming ? "Streaming..." : "Stream"}
      </button>
      {streamingText && (
        <div className="p-4 bg-gray-100 rounded">
          <p className="font-semibold">Response:</p>
          <p className="whitespace-pre-wrap">{streamingText}</p>
        </div>
      )}
    </div>
  )
}

/**
 * Пример 3: Проверка доступности провайдеров
 */
export function ProviderHealthCheckExample() {
  const [health, setHealth] = useState<ProviderStatus[]>([])
  const [loading, setLoading] = useState(false)

  const checkHealth = async () => {
    setLoading(true)
    try {
      const result = await unifiedAIService.checkProvidersHealth([
        ["claude", null],
        ["openai", null],
        ["deepseek", null],
        ["ollama", null],
      ])
      setHealth(result)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Provider Health Check</h2>
      <button
        type="button"
        onClick={checkHealth}
        disabled={loading}
        className="px-4 py-2 bg-purple-500 text-white rounded"
      >
        {loading ? "Checking..." : "Check Health"}
      </button>

      {health.length > 0 && (
        <div className="space-y-2">
          {health.map((status) => (
            <div key={status.provider} className="p-3 border rounded">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{status.provider}</span>
                <span className={status.available ? "text-green-600" : "text-red-600"}>
                  {status.available ? "✓ Available" : "✗ Unavailable"}
                </span>
              </div>
              {status.available && status.models && status.models.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">Models: {status.models.slice(0, 3).join(", ")}</p>
              )}
              {status.error && <p className="text-sm text-red-600 mt-1">Error: {status.error}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Пример 4: Статистика кэша
 */
export function CacheStatsExample() {
  const [stats, setStats] = useState<CacheStats | null>(null)

  const loadStats = async () => {
    try {
      const result = await unifiedAIService.getCacheStats()
      setStats(result)
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const clearCache = async () => {
    try {
      const count = await unifiedAIService.clearCache()
      console.log(`Cleared ${count} entries`)
      await loadStats()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const cleanupExpired = async () => {
    try {
      const count = await unifiedAIService.cleanupExpiredCache()
      console.log(`Removed ${count} expired entries`)
      await loadStats()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Cache Statistics</h2>

      <div className="flex gap-2">
        <button type="button" onClick={loadStats} className="px-4 py-2 bg-blue-500 text-white rounded">
          Load Stats
        </button>
        <button type="button" onClick={clearCache} className="px-4 py-2 bg-red-500 text-white rounded">
          Clear Cache
        </button>
        <button type="button" onClick={cleanupExpired} className="px-4 py-2 bg-orange-500 text-white rounded">
          Cleanup Expired
        </button>
      </div>

      {stats && (
        <div className="p-4 bg-gray-100 rounded space-y-2">
          <p>
            <span className="font-semibold">Total Entries:</span> {stats.totalEntries}
          </p>
          <p>
            <span className="font-semibold">Cache Hits:</span> {stats.totalHits}
          </p>
          <p>
            <span className="font-semibold">Cache Misses:</span> {stats.totalMisses}
          </p>
          <p>
            <span className="font-semibold">Expired:</span> {stats.expiredEntries}
          </p>
          <p>
            <span className="font-semibold">Cache Size:</span> {stats.cacheSize} bytes
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Пример 5: AI с инструментами (Function Calling)
 */
export function AIWithToolsExample() {
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const callAIWithTools = async () => {
    setLoading(true)
    try {
      const response = await unifiedAIService.sendSecureRequestWithTools(
        "claude",
        "claude-sonnet-4",
        [{ role: "user", content: "What's the weather like in San Francisco?" }],
        [
          {
            name: "get_weather",
            description: "Get current weather information for a location",
            input_schema: {
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
        {
          toolChoice: { type: "tool", name: "get_weather" },
          maxTokens: 1024,
        },
      )

      if (response.toolCalls && response.toolCalls.length > 0) {
        const toolCall = response.toolCalls[0]
        setResult(`AI wants to call: ${toolCall.name}\nWith input: ${JSON.stringify(toolCall.arguments, null, 2)}`)
      } else {
        setResult(response.content)
      }
    } catch (error) {
      console.error("Error:", error)
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">AI with Tools (Function Calling)</h2>

      <button
        type="button"
        onClick={callAIWithTools}
        disabled={loading}
        className="px-4 py-2 bg-indigo-500 text-white rounded"
      >
        {loading ? "Calling..." : "Call AI with Tools"}
      </button>

      {result && (
        <div className="p-4 bg-gray-100 rounded">
          <p className="font-semibold">Result:</p>
          <pre className="mt-2 text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  )
}

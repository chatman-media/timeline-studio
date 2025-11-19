# AI Chat Types

[Русский](./README.ru.md) | **English**

TypeScript type definitions for the AI Chat feature.

## Type Files

### `ai-context.ts`
Context types for passing state information between Timeline Studio components and AI services.

**Exports:**
- `AIContext` - Complete context including timeline, resources, browser state
- `TimelineContext` - Timeline-specific state information
- `ResourceContext` - Resource pool state
- `BrowserContext` - File browser state
- `PlayerContext` - Video player state

### `common.ts`
Common result types and standardized interfaces for AI operations.

**Exports:**
- `BaseResult<T>` - Basic operation result with success/error states
- `ResultWithMetrics<T>` - Result with execution metrics
- `AIToolResult<T>` - AI tool execution result
- `AnalysisResult<T>` - Content analysis result
- `MediaProcessingResult` - Media processing result
- `ContentGenerationResult<T>` - Content generation result
- `SearchResult<T>` - Search operation result
- `ValidationResult` - Data validation result
- `ExportResult` - Export operation result
- `ImportResult<T>` - Import operation result
- `PaginatedResult<T>` - Result with pagination
- `AsyncResult<T>` - Async operation with loading state
- `CachedResult<T>` - Cached result with TTL
- `BatchResult<TInput, TOutput>` - Batch operation result
- `RetriableResult<T>` - Result with retry information
- Utility functions: `isSuccess()`, `isFailure()`, `createSuccess()`, `createFailure()`

### `streaming.ts`
Types for real-time streaming responses.

**Exports:**
- `StreamingOptions` - Configuration for streaming
- `StreamingResponse` - Streaming response structure
- `StreamEvent` - Server-sent event types
- `StreamError` - Streaming error handling

**Note:** Chat types (`ChatSession`, `ChatMessage`, etc.) have been migrated to `/src/domains/ai-services/types/chat.ts`

## Usage

### AI Context
```typescript
import type { AIContext } from '@/features/ai-chat/types'

// Create context for AI
const context: AIContext = {
  timeline: currentTimelineState,
  resources: resourcePoolState,
  browser: browserState,
  player: playerState
}
```

### Common Result Types
```typescript
import {
  type BaseResult,
  type ResultWithMetrics,
  isSuccess,
  createSuccess,
  createFailure
} from '@/features/ai-chat/types'

// Create a success result
const result: BaseResult<string> = createSuccess(
  "Operation completed",
  "Success message",
  ["Warning: Some data was skipped"]
)

// Check result status
if (isSuccess(result)) {
  console.log(result.data)
}

// Create result with metrics
const resultWithMetrics: ResultWithMetrics<VideoAnalysis> = {
  success: true,
  data: analysis,
  executionTime: 1234,
  metadata: {
    model: "claude-4-sonnet",
    provider: "claude",
    tokenCount: 1500,
    cacheHit: false
  }
}
```

### Streaming Types
```typescript
import type { StreamingOptions, StreamEvent } from '@/features/ai-chat/types'

const streamingOptions: StreamingOptions = {
  enabled: true,
  onChunk: (chunk) => console.log(chunk),
  onComplete: () => console.log('Done'),
  onError: (error) => console.error(error)
}
```

## Related Types

For chat-related types, use domain types:

```typescript
// Chat types from domains
import type {
  ChatSession,
  ChatMessage,
  ChatListItem
} from '@/domains/ai-services/types/chat'

const session: ChatSession = {
  id: 'session-123',
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date()
}
```
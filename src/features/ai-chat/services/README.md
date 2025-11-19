# AI Chat Services

[Русский](./README.ru.md) | **English**

Core services for AI chat functionality in Timeline Studio.

## Architecture

The services layer is minimal in the AI Chat module. Most AI functionality has been migrated to domain services:

- **AI Tools** → `/src/domains/ai-tools/tools/`
- **AI Services** → `/src/domains/ai-services/services/`
- **Shared Services** → `/src/shared/services/ai/`

## Available Services

### `chat-provider.tsx`
React Context Provider for chat functionality.

**Features:**
- Provides chat state machine context
- Manages chat sessions
- Handles message sending and streaming
- Error handling and recovery

**Usage:**
```typescript
import { ChatProvider, useChat } from '@/features/ai-chat/services'

function App() {
  return (
    <ChatProvider>
      <ChatComponent />
    </ChatProvider>
  )
}

function ChatComponent() {
  const { messages, sendMessage } = useChat()
  // ... use chat functionality
}
```

### `chat-storage-service.ts`
Chat history persistence service.

**Features:**
- Save and load chat sessions
- Session management (create, delete, rename)
- Message history persistence
- Local storage integration

**API:**
```typescript
interface ChatStorageService {
  saveSession(session: ChatSession): Promise<void>
  loadSession(sessionId: string): Promise<ChatSession | null>
  loadAllSessions(): Promise<ChatSession[]>
  deleteSession(sessionId: string): Promise<void>
  clearAllSessions(): Promise<void>
}
```

**Usage:**
```typescript
import { ChatStorageService } from '@/features/ai-chat/services'

const storageService = new ChatStorageService()

// Save session
await storageService.saveSession(session)

// Load all sessions
const sessions = await storageService.loadAllSessions()

// Delete session
await storageService.deleteSession(sessionId)
```

### `mcp-provider.tsx`
Model Context Protocol (MCP) integration provider.

**Features:**
- MCP server connection management
- Tool discovery and registration
- Context-aware tool suggestions
- Tool format conversion

**Usage:**
```typescript
import { MCPProvider, useMCP } from '@/features/ai-chat/services'

function App() {
  return (
    <MCPProvider>
      <ChatProvider>
        <AIChat />
      </ChatProvider>
    </MCPProvider>
  )
}

function ToolsPanel() {
  const { availableTools, callTool } = useMCP()
  // ... use MCP functionality
}
```

### `index.ts`
Re-exports chat machine from domain services.

**Note:** The chat machine has been migrated to `/src/domains/ai-services/machines/chat-machine.ts` for better modularity.

**Exports:**
```typescript
export type {
  ChatListItem,
  ChatMachine,
  ChatMachineContext,
  ChatMachineEvent,
  ChatMessage,
} from "../../../domains/ai-services/machines/chat-machine"

export { chatMachine } from "../../../domains/ai-services/machines/chat-machine"
```

## Domain Services Integration

### AI Services (`/src/domains/ai-services/services/`)

For AI provider functionality, use domain services:

```typescript
// Unified AI Service for AI operations
import { UnifiedAIService } from '@/domains/ai-services/services/unified-ai-service'

const aiService = UnifiedAIService.getInstance()
const response = await aiService.sendRequest(model, messages)
```

```typescript
// Whisper Service for transcription
import { WhisperService } from '@/domains/ai-services/services/whisper-service'

const whisperService = WhisperService.getInstance()
const transcription = await whisperService.transcribe(audioPath)
```

```typescript
// FFmpeg Analysis Service for video/audio analysis
import { FFmpegAnalysisService } from '@/domains/ai-services/services/media-analysis/ffmpeg-analysis-service'

const ffmpegService = FFmpegAnalysisService.getInstance()
const analysis = await ffmpegService.analyzeVideo(videoFile)
```

### AI Tools (`/src/domains/ai-tools/tools/`)

For AI tool functionality, import from domains:

```typescript
// Timeline tools
import { CreateProjectTool, DetectScenesTool } from '@/domains/ai-tools/tools/core/timeline'

// Analysis tools
import { VideoAnalysisTool, AudioAnalysisTool } from '@/domains/ai-tools/tools/analysis'

// Automation tools
import { EnhancedSubtitleAutomationTool } from '@/domains/ai-tools/tools/automation'
```

### Shared Services (`/src/shared/services/ai/`)

For shared AI infrastructure:

```typescript
// Dependency injection container
import { getAIContainer } from '@/shared/services/ai/di-container'

const container = getAIContainer()
const service = await container.resolve('UnifiedAIService')
```

```typescript
// React integration hooks
import { useAIService } from '@/shared/services/ai/react-integration'

function MyComponent() {
  const aiService = useAIService()
  // ... use AI service
}
```

## Best Practices

### Chat State Management
- Always wrap chat components with `ChatProvider`
- Use `useChat()` hook for accessing chat functionality
- Handle errors with try-catch blocks
- Implement loading states for better UX

### Session Management
- Save sessions regularly to prevent data loss
- Implement auto-save on important changes
- Validate session data before loading
- Handle migration for session schema changes

### MCP Integration
- Initialize MCP provider before chat provider
- Register tools on provider mount
- Handle tool discovery errors gracefully
- Implement tool availability checks

## Testing

### Service Tests
```bash
# Run all service tests
bun run test src/features/ai-chat/services/

# Specific tests
bun run test src/features/ai-chat/services/__tests__/chat-storage-service.test.ts
```

### Available Tests
- `chat-storage-service.test.ts` - Chat storage service tests

## Related Documentation

- [Chat Machine Documentation](../../../domains/ai-services/machines/README.md)
- [AI Services Documentation](../../../domains/ai-services/README.md)
- [AI Tools Documentation](../../../domains/ai-tools/README.md)
- [Shared Services Documentation](../../../shared/services/ai/README.md)

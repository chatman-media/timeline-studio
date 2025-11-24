# AI Chat Feature

[Русский](./README.ru.md) | **English**

AI-powered chat interface for Timeline Studio with domain-driven architecture. Provides React components and hooks for integrating AI chat functionality with MCP (Model Context Protocol) support.

## 🏗️ Architecture Overview

The AI Chat module is a **lightweight frontend layer** that integrates with domain services:

### Domain Integration
- **AI Tools** → `/src/domains/ai-tools/` - 48+ specialized tools organized by domain
- **AI Services** → `/src/domains/ai-services/` - Core AI providers and orchestration
- **Shared Services** → `/src/shared/services/ai/` - Common AI utilities and DI container

### AI Chat Module Responsibilities
- React components for chat UI (chat interface, message list, suggestions)
- React hooks for AI integration (timeline, browser, player, resources)
- Context management and state synchronization
- MCP provider integration
- Chat storage and session management

## 📁 Module Structure

### `/components/`
React UI components for chat interface:
- `ai-chat.tsx` - Main chat component
- `chat-list.tsx` - Chat sessions list
- `ai-processing-indicator.tsx` - Loading and processing states
- `ai-action-preview.tsx` - Preview AI actions before execution
- `cache-stats-panel.tsx` - AI response cache statistics
- `suggestions/` - Context-aware AI suggestions panel

### `/hooks/`
React hooks for AI integration:
- `use-chat.tsx` - Main chat hook with state machine integration
- `use-chat-state.ts` - Chat state access
- `use-chat-actions.tsx` - Chat actions (send, clear, abort)
- `use-timeline-ai.tsx` - Timeline AI operations
- `use-timeline-ai-integration.ts` - Timeline integration utilities
- `use-browser-ai-integration.ts` - Browser AI integration
- `use-player-ai-integration.ts` - Player AI integration
- `use-resources-ai-integration.ts` - Resources AI integration

### `/services/`
Core services for chat functionality:
- `chat-provider.tsx` - React Context Provider for chat state
- `chat-storage-service.ts` - Chat history persistence
- `mcp-provider.tsx` - Model Context Protocol integration
- `index.ts` - Re-exports chat machine from domains

### `/types/`
TypeScript type definitions:
- `ai-context.ts` - Context types for AI operations
- `common.ts` - Common result types and interfaces
- `streaming.ts` - Streaming response types

### `/utils/`
Utility functions:
- `context-manager.ts` - AI context collection and management
- `timeline-context.ts` - Timeline-specific context utilities
- `convert-tools.ts` - Tool format conversion for MCP

### `/machines/`
Backend event handlers:
- `backend-event-handlers.ts` - Tauri event handling for AI operations

## 🔗 Domain Services Integration

The AI Chat module relies on domain services for AI functionality:

### AI Tools (`/src/domains/ai-tools/tools/`)
48+ specialized tools organized by domain:

#### Core Domain
- **Timeline Tools** (17) - project, sections, clips, scenes, story analysis
- **Resources Tools** (7) - effects, filters, transitions, compatibility
- **Browser Tools** (5) - file navigation, search, content analysis
- **Player Tools** (3) - playback control, preview, media analysis

#### Analysis Domain
- **Video Analysis** - scene detection, quality, motion analysis
- **Audio Analysis** - speech recognition, noise, spectral analysis
- **Content Intelligence** - content understanding and classification
- **Multimodal Analysis** - combined video/audio analysis
- **Whisper Integration** - transcription and speech-to-text
- **Person Identification** - face detection and tracking
- **Color & Style Analysis** - color grading and style transfer

#### Automation Domain
- **Enhanced Subtitle Automation** - OCR, Whisper, synchronization
- **Batch Processing** - parallel media processing
- **Workflow Automation** - intelligent task automation
- **Smart Templates** - adaptive layout generation
- **Performance Tools** - optimization and rendering

#### Integration Domain
- **Export Management** - multi-format export
- **Platform Integration** - social media optimization
- **Format Conversion** - media format conversion

### AI Services (`/src/domains/ai-services/services/`)
Core AI providers and orchestration:
- `unified-ai-service.ts` - Main AI service orchestrator
- `unified-orchestrator.ts` - Advanced AI workflow orchestration
- `whisper-service.ts` - Audio transcription service
- `media-analysis/ffmpeg-analysis-service.ts` - Video/audio analysis

### Shared Services (`/src/shared/services/ai/`)
Common AI infrastructure:
- `di-container.ts` - Dependency injection container
- `backend-ai-service.ts` - Backend AI service integration
- `react-integration.tsx` - React hooks for AI services
- `providers/interfaces.ts` - AI provider interfaces

## 🚀 Key Features

### MCP (Model Context Protocol) Support
- Native MCP integration via `mcp-provider.tsx`
- Converts domain tools to MCP format
- Supports MCP servers and tool discovery
- Context-aware tool suggestions

### Chat State Management
- XState-based chat machine (migrated to `/src/domains/ai-services/machines/chat-machine.ts`)
- Persistent chat history via `chat-storage-service.ts`
- Session management and switching
- Real-time streaming responses

### Context-Aware AI
- Automatic context collection from Timeline, Browser, Player, Resources
- Smart context compression for token limits
- Context validation and optimization
- Dynamic context updates

### AI Integration Hooks
- Timeline AI operations (create, analyze, optimize)
- Browser integration (file search, content analysis)
- Player integration (playback control, preview)
- Resources integration (effects, filters, compatibility)

## 📚 Usage Examples

### Using Chat Components
```typescript
import { AIChat } from "@/features/ai-chat/components"
import { ChatProvider } from "@/features/ai-chat/services"

function App() {
  return (
    <ChatProvider>
      <AIChat />
    </ChatProvider>
  )
}
```

### Using Chat Hooks
```typescript
import { useChat } from "@/features/ai-chat/hooks"

function ChatComponent() {
  const { sendMessage, messages, isLoading } = useChat()

  const handleSend = async (text: string) => {
    await sendMessage(text)
  }

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  )
}
```

### Timeline AI Integration
```typescript
import { useTimelineAI } from "@/features/ai-chat/hooks"

function TimelineComponent() {
  const { createTimelineFromPrompt, analyzeTimeline } = useTimelineAI()

  const handleCreate = async () => {
    await createTimelineFromPrompt("Create a travel video")
  }

  const handleAnalyze = async () => {
    const analysis = await analyzeTimeline()
    console.log(analysis)
  }
}
```

### Context Management
```typescript
import { collectFullContext, compressContext } from "@/features/ai-chat/utils"

// Collect complete context for AI
const context = await collectFullContext()

// Compress if needed
if (isContextTooLarge(context)) {
  const compressed = compressContext(context, maxTokens)
}
```

### MCP Integration
```typescript
import { MCPProvider } from "@/features/ai-chat/services"

function App() {
  return (
    <MCPProvider>
      <ChatProvider>
        <AIChat />
      </ChatProvider>
    </MCPProvider>
  )
}
```

## 🧪 Testing

### Test Structure
- **Component Tests** - `components/__tests__/` - UI component testing
- **Hook Tests** - `hooks/__tests__/` - React hooks testing
- **Service Tests** - `services/__tests__/` - Service layer testing
- **Utility Tests** - `utils/__tests__/` - Utility function testing
- **Integration Tests** - `__tests__/` - Full feature integration tests

### Running Tests
```bash
# All ai-chat tests
bun run test src/features/ai-chat/

# Specific test categories
bun run test src/features/ai-chat/hooks/
bun run test src/features/ai-chat/services/
bun run test src/features/ai-chat/components/
```

### Available Tests
- `chat-list.test.tsx` - Chat list component
- `use-chat-actions.test.tsx` - Chat actions hook
- `use-chat-state.test.tsx` - Chat state hook
- `use-timeline-ai-integration.test.tsx` - Timeline AI integration
- `chat-storage-service.test.ts` - Chat storage service
- `convert-tools.test.ts` - Tool conversion utilities
- `function-calling.test.ts` - AI function calling

## 🤝 Contributing

When adding new features to AI Chat:

### Adding New Components
1. Create component in `components/` directory
2. Export from `components/index.ts`
3. Add tests in `components/__tests__/`
4. Update component README documentation

### Adding New Hooks
1. Create hook in `hooks/` directory
2. Export from `hooks/index.ts`
3. Add tests in `hooks/__tests__/`
4. Update hooks README documentation

### Adding Context Collection
1. Update `utils/context-manager.ts` for new context types
2. Add type definitions to `types/ai-context.ts`
3. Update documentation with context structure

### Integration with Domain Services
- AI Tools → add to `/src/domains/ai-tools/tools/`
- AI Services → add to `/src/domains/ai-services/services/`
- Shared utilities → add to `/src/shared/services/ai/`

## 📖 Documentation

Module-specific documentation:
- [Components](./components/README.md) - UI components reference
- [Hooks](./hooks/README.md) - React hooks reference
- [Services](./services/README.md) - Service layer reference
- [Types](./types/README.md) - TypeScript type definitions
- [Utils](./utils/README.md) - Utility functions reference

Domain documentation:
- [AI Tools Documentation](../../domains/ai-tools/README.md)
- [AI Services Documentation](../../domains/ai-services/README.md)
- [Shared Services Documentation](../../shared/services/ai/README.md)
# AI Chat

**English** | [Русский](./README.ru.md)

## Overview

AI-powered chat interface for Timeline Studio with domain-driven architecture. Provides React components and hooks for integrating AI chat functionality with MCP (Model Context Protocol) support. The module serves as a lightweight frontend layer that integrates with domain services from `/src/domains/ai-tools/` and `/src/domains/ai-services/`.

## Status

**100% Complete** - All core functionality is fully implemented and tested.

- ✅ **Components**: UI components for chat interface, message list, suggestions, and cache stats
- ✅ **Hooks**: React hooks for AI integration with Timeline, Browser, Player, and Resources
- ✅ **Services**: Chat provider, storage service, MCP integration
- ✅ **Tests**: 86+ tests passing (chat-list: 11, chat-storage: 45+, convert-tools: 30+)

## Structure

```
ai-chat/
├── components/          # React UI components
│   ├── ai-chat.tsx
│   ├── chat-list.tsx
│   ├── ai-processing-indicator.tsx
│   ├── ai-action-preview.tsx
│   ├── cache-stats-panel.tsx
│   └── suggestions/
├── hooks/              # React hooks for AI integration
│   ├── use-chat.tsx
│   ├── use-chat-state.ts
│   ├── use-chat-actions.tsx
│   ├── use-timeline-ai.tsx
│   └── use-timeline-ai-integration.ts
├── services/          # Core services
│   ├── chat-provider.tsx
│   ├── chat-storage-service.ts
│   ├── mcp-provider.tsx
│   └── index.ts
├── types/            # TypeScript definitions
│   ├── ai-context.ts
│   ├── common.ts
│   └── streaming.ts
├── utils/           # Utility functions
│   ├── context-manager.ts
│   ├── timeline-context.ts
│   └── convert-tools.ts
├── machines/       # Backend event handlers
│   └── backend-event-handlers.ts
└── __tests__/     # Test files
```

## Features

### ✅ Implemented

- [x] MCP (Model Context Protocol) support with native integration
- [x] Chat state management via XState-based chat machine
- [x] Persistent chat history with session management
- [x] Real-time streaming responses
- [x] Context-aware AI with automatic context collection
- [x] Timeline AI operations (create, analyze, optimize)
- [x] Browser integration (file search, content analysis)
- [x] Player integration (playback control, preview)
- [x] Resources integration (effects, filters, compatibility)
- [x] AI Tools integration (48+ specialized tools from domains)
- [x] Function calling and tool execution

### 🔮 Future Improvements

The core AI chat functionality is complete. These advanced features may be added in future releases:

- [ ] Voice input/output for hands-free interaction
- [ ] Multi-modal input (image analysis in chat)
- [ ] Chat export to various formats (PDF, Markdown, etc.)

## Usage

### Basic Chat Component

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

## Integration

- **Depends on**:
  - `@/domains/ai-tools` - 48+ specialized tools organized by domain
  - `@/domains/ai-services` - Core AI providers and orchestration
  - `@/shared/services/ai` - Common AI utilities and DI container
- **Used by**: `@/features/media-studio`, `@/features/ai-director`, `@/features/analysis-dashboard`

## Testing

- **Total tests**: 86+ tests
- **Coverage**: Components, hooks, services, and utilities

### Running Tests

```bash
# All ai-chat tests
bun run test src/features/ai-chat/

# Specific test categories
bun run test src/features/ai-chat/hooks/
bun run test src/features/ai-chat/services/
bun run test src/features/ai-chat/components/
```

### Test Suites

- `chat-list.test.tsx` - Chat list component (11 tests)
- `chat-storage-service.test.ts` - Chat storage service (45+ tests)
- `convert-tools.test.ts` - Tool conversion utilities (30+ tests)
- `use-chat-actions.test.tsx` - Chat actions hook
- `use-chat-state.test.tsx` - Chat state hook
- `use-timeline-ai-integration.test.tsx` - Timeline AI integration

## TODO / Roadmap

### High Priority
- [ ] E2E tests for full chat workflow
- [ ] Improve error handling and retry logic
- [ ] Add chat session import/export

### Medium Priority
- [ ] Voice input/output support
- [ ] Image analysis in chat interface
- [ ] Better context compression algorithms
- [ ] Performance optimization for large contexts

### Low Priority
- [ ] Chat analytics and usage statistics
- [ ] Custom chat themes
- [ ] Keyboard shortcuts for power users

## Documentation

- [Components](./components/README.md) - UI components reference
- [Hooks](./hooks/README.md) - React hooks reference
- [Services](./services/README.md) - Service layer reference
- [Types](./types/README.md) - TypeScript type definitions
- [Utils](./utils/README.md) - Utility functions reference

Domain documentation:
- [AI Tools Documentation](../../domains/ai-tools/README.md)
- [AI Services Documentation](../../domains/ai-services/README.md)
- [Shared Services Documentation](../../shared/services/ai/README.md)

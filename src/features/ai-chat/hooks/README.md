# AI Chat Hooks

[Русский](./README.ru.md) | **English**

React hooks for AI Chat functionality.

## Available Hooks

### Core Chat Hooks

#### `useChat()`
Main hook for accessing chat functionality.
- Access to chat state machine
- Send messages to AI
- Manage chat sessions
- Stream responses in real-time
- Session switching and management

**Usage:**
```typescript
const { messages, sendMessage, isLoading, currentSession } = useChat()
```

#### `useChatState()`
Hook for accessing current chat state without actions.
- Current messages
- Active session info
- Loading/error states
- Model and provider selection
- Read-only state access

**Usage:**
```typescript
const { messages, isLoading, error, currentModel } = useChatState()
```

#### `useChatActions()`
Hook for chat actions and commands.
- Send messages
- Clear chat history
- Switch AI models
- Abort ongoing requests
- Session management actions

**Usage:**
```typescript
const { sendMessage, clearHistory, switchModel, abortRequest } = useChatActions()
```

### Timeline Integration Hooks

#### `useTimelineAI()`
Hook for Timeline-specific AI operations.
- Create timeline from prompt
- Analyze media content
- Apply AI suggestions
- Quick command shortcuts
- Timeline manipulation via AI

**Usage:**
```typescript
const { createTimelineFromPrompt, analyzeTimeline, applyAISuggestion } = useTimelineAI()
```

#### `useTimelineAIIntegration()`
Low-level Timeline AI integration utilities.
- Timeline context collection
- AI tool execution for timeline
- Timeline state synchronization
- Integration with timeline machine

**Usage:**
```typescript
const { executeTimelineTool, getTimelineContext } = useTimelineAIIntegration()
```

### Feature Integration Hooks

#### `useBrowserAIIntegration()`
Hook for AI integration with media browser.
- Browse and search media files
- Content analysis of media
- File metadata extraction
- Smart file suggestions

**Usage:**
```typescript
const { searchFiles, analyzeFile, getFileMetadata } = useBrowserAIIntegration()
```

#### `usePlayerAIIntegration()`
Hook for AI integration with video player.
- Playback control via AI
- Frame analysis
- Preview generation
- Timeline synchronization

**Usage:**
```typescript
const { controlPlayback, analyzeCurrentFrame, generatePreview } = usePlayerAIIntegration()
```

#### `useResourcesAIIntegration()`
Hook for AI integration with resource management.
- Analyze available resources
- Smart resource suggestions
- Bulk resource operations
- Resource compatibility checks
- Effect and filter recommendations

**Usage:**
```typescript
const { analyzeResources, suggestEffects, checkCompatibility } = useResourcesAIIntegration()
```

## Usage Examples

```typescript
import { useChat, useTimelineAI } from '@/features/ai-chat/hooks'

function MyComponent() {
  // Basic chat usage
  const { sendMessage, messages, isLoading } = useChat()
  
  // Timeline AI operations
  const { createTimelineFromPrompt } = useTimelineAI()
  
  // Send a message
  const handleSend = async (text: string) => {
    await sendMessage(text)
  }
  
  // Create timeline with AI
  const handleCreate = async () => {
    await createTimelineFromPrompt("Create a travel video")
  }
}
```

## Best Practices

- Always handle loading and error states
- Use proper error boundaries for AI operations
- Implement proper cleanup for streaming responses
- Memoize callbacks to prevent re-renders
- Use integration hooks for feature-specific operations
- Leverage chat state hook for read-only access

## Testing

```bash
# Run all hook tests
bun run test src/features/ai-chat/hooks/

# Specific hook tests
bun run test src/features/ai-chat/hooks/__tests__/use-chat-state.test.tsx
bun run test src/features/ai-chat/hooks/__tests__/use-chat-actions.test.tsx
bun run test src/features/ai-chat/hooks/__tests__/use-timeline-ai-integration.test.tsx
```

## Related Documentation

- [Chat Provider](../services/README.md#chat-providertsx) - Chat state management
- [AI Tools](../../../domains/ai-tools/README.md) - Available AI tools
- [AI Services](../../../domains/ai-services/README.md) - AI service integration
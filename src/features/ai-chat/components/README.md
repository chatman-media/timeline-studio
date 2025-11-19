# AI Chat Components

[Русский](./README.ru.md) | **English**

React components for AI Chat user interface.

## Available Components

### `AIChat`
Main chat interface component - full-featured chat UI.

**Features:**
- Complete chat UI with message list and input
- Model and provider selection
- Session management and switching
- Streaming response display with typing animation
- Error handling and retry mechanisms
- Integration with chat state machine

**Props:**
```typescript
interface AIChatProps {
  className?: string
  defaultModel?: string
  defaultProvider?: string
  onMessageSent?: (message: string) => void
}
```

### `ChatList`
Chat sessions list component for managing multiple conversations.

**Features:**
- Display all chat sessions with metadata
- Session selection and switching
- Delete and rename sessions
- Search functionality for sessions
- Session metadata (date, message count, model used)

**Props:**
```typescript
interface ChatListProps {
  className?: string
  onSessionSelect?: (sessionId: string) => void
  onSessionDelete?: (sessionId: string) => void
}
```

### `AIProcessingIndicator`
Loading indicator for AI operations.

**Features:**
- Visual feedback during AI processing
- Animated loading states
- Progress indication
- Cancellable operations support

**Props:**
```typescript
interface AIProcessingIndicatorProps {
  isProcessing: boolean
  message?: string
  onCancel?: () => void
}
```

### `AIActionPreview`
Preview component for AI-generated actions before execution.

**Features:**
- Preview AI-suggested actions
- Confirm/reject action execution
- Action details display
- Safety confirmations for destructive actions

**Props:**
```typescript
interface AIActionPreviewProps {
  action: AIAction
  onConfirm: () => void
  onReject: () => void
}
```

### `CacheStatsPanel`
Display AI response cache statistics and performance metrics.

**Features:**
- Cache hit/miss ratio display
- Response time metrics
- Memory usage statistics
- Cache management controls

**Props:**
```typescript
interface CacheStatsPanelProps {
  className?: string
  showDetails?: boolean
}
```

### `suggestions/` Directory
Context-aware AI suggestions components.

#### `AISuggestionsPanel`
Smart suggestions based on current context.

**Features:**
- Context-aware prompt suggestions
- Quick action buttons
- Template suggestions
- Recent command history

**Props:**
```typescript
interface AISuggestionsPanelProps {
  context: AIContext
  onSuggestionSelect: (suggestion: string) => void
}
```

## Usage Examples

### Basic Chat Interface

```typescript
import { AIChat, ChatList } from '@/features/ai-chat/components'
import { ChatProvider } from '@/features/ai-chat/services'

function ChatInterface() {
  return (
    <ChatProvider>
      <div className="flex h-full">
        {/* Sessions sidebar */}
        <div className="w-64 border-r">
          <ChatList />
        </div>

        {/* Main chat */}
        <div className="flex-1">
          <AIChat />
        </div>
      </div>
    </ChatProvider>
  )
}
```

### With Processing Indicator

```typescript
import { AIChat, AIProcessingIndicator } from '@/features/ai-chat/components'
import { useChat } from '@/features/ai-chat/hooks'

function ChatWithIndicator() {
  const { isProcessing } = useChat()

  return (
    <div className="chat-container">
      <AIChat />
      {isProcessing && (
        <AIProcessingIndicator
          isProcessing={isProcessing}
          message="AI is thinking..."
        />
      )}
    </div>
  )
}
```

### With Action Preview

```typescript
import { AIActionPreview } from '@/features/ai-chat/components'

function ActionConfirmation() {
  const [pendingAction, setPendingAction] = useState<AIAction | null>(null)

  const handleConfirm = () => {
    // Execute the action
    executePendingAction(pendingAction)
    setPendingAction(null)
  }

  return pendingAction ? (
    <AIActionPreview
      action={pendingAction}
      onConfirm={handleConfirm}
      onReject={() => setPendingAction(null)}
    />
  ) : null
}
```

### Cache Statistics

```typescript
import { CacheStatsPanel } from '@/features/ai-chat/components'

function PerformanceMonitor() {
  return (
    <div className="performance-panel">
      <h2>AI Performance</h2>
      <CacheStatsPanel showDetails={true} />
    </div>
  )
}
```

## Testing

```bash
# Run component tests
bun run test src/features/ai-chat/components/

# Specific component tests
bun run test src/features/ai-chat/components/__tests__/chat-list.test.tsx
```

## Best Practices

- Always wrap chat components in `ChatProvider`
- Handle loading and error states appropriately
- Use proper TypeScript types for props
- Implement accessibility features (ARIA labels, keyboard navigation)
- Follow the existing Tailwind CSS patterns
- Test components with React Testing Library

## Styling

All components use Tailwind CSS and follow the design system:
- Support for light/dark themes
- Responsive design
- Accessible markup
- Customizable through className prop
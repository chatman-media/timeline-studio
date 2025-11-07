# AI Chat Components

[Русский](./README.ru.md) | **English**

React components for AI Chat user interface.

## Available Components

### `AIChat`
Main chat interface component.
- Full chat UI with message list and input
- Model and provider selection
- Session management
- Streaming response display
- Error handling and retry

### `ChatList`
Chat sessions list component.
- Display all chat sessions
- Session selection
- Delete and rename sessions
- Search functionality
- Session metadata display

### `ContentIntelligencePanel`
Advanced content analysis panel.
- Scene detection results
- Content classification display
- Person identification results
- Quality metrics visualization
- Export analysis data

## Usage Examples

```typescript
import { AIChat, ChatList } from '@/features/ai-chat/components'

function ChatInterface() {
  return (
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
  )
}
```

### Content Intelligence Integration

```typescript
import { ContentIntelligencePanel } from '@/features/ai-chat/components'
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')

function VideoAnalysis() {
  return (
    <ContentIntelligencePanel
      videoId={currentVideoId}
      onAnalysisComplete={(results) => {
        logger.debugSync('Analysis results:', results)
      }}
    />
  )
}
```

## Component Props

### AIChat Props
```typescript
interface AIChatProps {
  className?: string
  defaultModel?: ChatModel
  defaultProvider?: ChatProvider
  onMessageSent?: (message: string) => void
}
```

### ChatList Props
```typescript
interface ChatListProps {
  className?: string
  onSessionSelect?: (sessionId: string) => void
  onSessionDelete?: (sessionId: string) => void
}
```

### ContentIntelligencePanel Props
```typescript
interface ContentIntelligencePanelProps {
  videoId: string
  className?: string
  onAnalysisComplete?: (results: AnalysisResults) => void
  autoStart?: boolean
}
```

## Styling

All components use Tailwind CSS and follow the design system:
- Support for light/dark themes
- Responsive design
- Accessible markup
- Customizable through className prop
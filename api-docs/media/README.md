# AI Chat Feature

[Русский](./README.ru.md) | **English**

AI-powered chat interface for Timeline Studio with support for multiple AI providers and 151 specialized tools.

## Architecture

### AI Providers
- **Claude** (Anthropic) - Primary AI provider
- **OpenAI** - GPT-4 models
- **DeepSeek** - Advanced reasoning models
- **Ollama** - Local models (Llama 2, Mistral, Code Llama)

### Core Components

#### Services
- `unified-ai-service.ts` - Unified AI router with automatic fallback
- `timeline-ai-service.ts` - Timeline-specific AI coordination
- `intent-recognition.ts` - User intent analysis
- `chat-machine.ts` - XState machine for chat flow

#### AI Tools (151 total)
- **Timeline Tools** (50) - Project creation, editing, analysis
- **Player Tools** (10) - Playback control and analysis
- **Browser Tools** (8) - File system navigation
- **Resource Tools** (10) - Effects, filters, transitions
- **Export Management** (12) - Export optimization
- **Effects & Filters** (10) - Visual effects
- **Audio Processing** (12) - Audio analysis and editing
- **Render & Performance** (8) - Performance optimization
- **Template & Layout** (10) - Templates and layouts
- **Settings & Configuration** (8) - App configuration
- **Color & Style** (6) - Color correction and styling
- **Media Processing** (6) - Format conversion

#### Specialized Systems
- **Content Intelligence** - AI-powered content analysis
- **Person Identification** - Face detection and tracking
- **Scene Analysis** - Automatic scene detection
- **FFmpeg Integration** - Video analysis backend

## Usage

### Chat Interface
```typescript
// Users interact through natural language
"Create a wedding video with romantic transitions"
"Add all videos from browser to resources"
"Apply color correction to all clips"
```

### Programmatic API
```typescript
import { useTimelineAI } from './hooks/use-timeline-ai'

const { createTimelineFromPrompt } = useTimelineAI()
await createTimelineFromPrompt("Create travel video with upbeat music")
```

## Features

### Streaming Responses
- Real-time response streaming via Server-Sent Events
- Incremental UI updates with typing animation
- Abort support for long-running requests

### Context Management
- Automatic context compression for large conversations
- Token estimation and limit handling
- Smart context preservation

### Multi-Provider Support
- Automatic failover between providers
- Provider-specific optimizations
- Unified error handling

## File Structure

```
ai-chat/
├── services/         # AI services and state machines
├── tools/           # 151 AI tool definitions
├── hooks/           # React hooks
├── components/      # UI components
├── types/           # TypeScript definitions
└── utils/           # Utility functions
```

## Documentation

- [Services](./services/README.md) - AI service implementations
- [Tools](./tools/README.md) - AI tool definitions and usage
- [Components](./components/README.md) - React UI components
- [Hooks](./hooks/README.md) - React hooks for AI functionality
- [Types](./types/README.md) - TypeScript type definitions
- [Utils](./utils/README.md) - Utility functions
- [Examples](./examples/README.md) - Usage examples and patterns
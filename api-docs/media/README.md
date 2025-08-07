# AI Chat Feature

[Русский](./README.ru.md) | **English**

AI-powered chat interface for Timeline Studio with support for multiple AI providers and 48+ specialized tools, organized by domains with enhanced subtitle automation.

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

#### AI Tools (48+ total) - Domain-Based Architecture

##### 📁 Core Domain - Essential Tools
- **Timeline Tools** (17) - projects, sections, clips, analysis, scenes
- **Resources Tools** (7) - effects, filters, transitions, analysis, export
- **Browser Tools** (5) - media file navigation, search, analysis
- **Player Tools** (3) - playback control, preview, analysis
- **Effects & Settings** - visual effects and configuration

##### 🔬 Analysis Domain - Analysis Tools  
- **Video Analysis** - scene detection, quality analysis, motion
- **Audio Analysis** - audio analysis, silence, spectrum
- **Content Intelligence** - content and structure analysis
- **Multimodal Analysis** - combined video and audio analysis
- **Whisper Tools** - speech transcription
- **Person Identification** - face recognition
- **Color & Style Analysis** - color and style analysis

##### ⚙️ Automation Domain - Automation
- **Workflow Automation** - automatic workflows
- **Batch Processing** - batch file processing
- **Performance Tools** - performance and rendering optimization
- **Smart Templates** - intelligent templates and layouts
- **🆕 Enhanced Subtitle Automation** - AI-powered subtitle generation with:
  - OCR text extraction from screen
  - Whisper speech recognition integration
  - Scene analysis for context
  - Advanced synchronization (4 algorithms)
  - Multi-language support (31 languages)
  - Speaker identification
  - Quality metrics and recommendations

##### 🔗 Integration Domain - Integrations
- **Export Management** - export to various formats
- **Platform Integration** - social media and platform integration
- **Format Conversion** - format conversion

#### Specialized Systems
- **BaseAITool** - base class with unified error handling
- **Content Intelligence** - AI content analysis and structure
- **Person Identification** - face detection and tracking  
- **Scene Analysis** - automatic scene and cut detection
- **🆕 ai-content-intelligence Integration** - VisionService, OCR, ONNX Runtime
- **🆕 Enhanced Transcription** - Whisper integration with subtitle optimization
- **🆕 Advanced Synchronization** - 4-algorithm subtitle sync system
- **FFmpeg Integration** - backend for video and audio analysis

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
├── tools/           # 48+ AI tools organized by domains
│   ├── core/        # Essential tools
│   ├── analysis/    # Analysis tools
│   ├── automation/  # Automation tools (incl. Enhanced Subtitle Automation)
│   └── integration/ # Integrations
├── hooks/           # React hooks
├── components/      # UI components
├── types/           # TypeScript definitions
└── utils/           # Utility functions
```

## Documentation

- [Services](./services/README.md) - AI service implementations (modular architecture)
- [Tools](./tools/README.md) - Domain-based architecture and AI tool descriptions  
- [Migration](./tools/MIGRATION.md) - Complete migration overview to new architecture
- [Components](./components/README.md) - React UI components
- [Hooks](./hooks/README.md) - React hooks for AI functionality
- [Types](./types/README.md) - TypeScript type definitions
- [Utils](./utils/README.md) - Utility functions
- [Examples](./examples/README.md) - Usage examples and patterns
- [Developer Guide](./DEV.md) - Developer Guide with refactoring plans

## 🆕 New Features

With the new domain-based architecture, you can easily add new tools:

- **Enhanced Subtitle Automation** - Complete AI-powered subtitle generation system
  - Automatic video content analysis via ai-content-intelligence
  - OCR text extraction from screen using VisionService
  - Speech recognition via Whisper integration
  - Advanced synchronization with 4 algorithms
  - Multi-language support (31 languages)
  - Speaker identification and scene context
  - Quality metrics and optimization recommendations

- **Slip/Slide editing** - content shifting within clips
- **Multi-language subtitles** - automatic translation
- **BPM music analysis** - tempo detection
- **Emotional scene analysis** - mood detection
- **Motion tracking** - movement tracking
- **Auto-color correction** - color matching

For adding a new tool:
1. Choose appropriate domain
2. Use `BaseAITool` as base class
3. Add to corresponding index file
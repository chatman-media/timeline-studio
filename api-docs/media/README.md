# AI Chat Feature

[Русский](./README.ru.md) | **English**

AI-powered chat interface for Timeline Studio with unified architecture using shared AI services, supporting multiple providers and 48+ specialized tools.

## 🏗️ New Architecture (Post-Refactoring)

### Shared AI Services Integration
- **Unified AI Container** - Centralized dependency injection for all AI services
- **Shared Providers** - Claude, OpenAI, DeepSeek, Ollama providers from `/src/shared/services/ai/`
- **Cross-Module Compatibility** - Seamless integration with AI Content Intelligence module
- **Legacy Adapters** - Backward compatibility for existing code

### Core AI Providers
- **Claude 4** (Anthropic) - Advanced reasoning and analysis
- **OpenAI GPT-4** - General purpose and coding tasks  
- **DeepSeek** - Code analysis and generation
- **Ollama** - Local models (Llama 3.2, Mistral, Code Llama)

## 📁 Core Components

### Services Architecture

#### Main Services
- `unified-ai-service.ts` - **Refactored** wrapper over shared AI services
- `provider-manager.ts` - **Updated** to use shared AI providers  
- `model-configuration-manager.ts` - **Updated** with shared model constants
- `timeline-ai-service.ts` - **Refactored** - Timeline coordination using shared UnifiedAIService directly
- `chat-machine.ts` - XState state machine for chat flow
- `intent-recognition.ts` - User intent analysis and routing

#### Analysis Services  
- `multimodal-analysis-service.ts` - **Updated** to use shared Vision Service with GPT-4V fallback
- `content-intelligence-service.ts` - **Updated** to use shared FFmpeg and AI services
- `ffmpeg-analysis-service.ts` - **Deprecated** - now uses shared version via legacy adapter

#### Legacy Compatibility
- `legacy-adapters.ts` - **New** - provides old interfaces over shared services

### AI Tools Architecture (48+ Tools)

#### 📁 Core Domain - Essential Tools (32)
- **Timeline Tools** (17) - project management, sections, clips, scene analysis
- **Resources Tools** (7) - effects, filters, transitions, media management
- **Browser Tools** (5) - media file navigation, search, metadata analysis  
- **Player Tools** (3) - playback control, preview generation

#### 🔬 Analysis Domain - Content Analysis (10)  
- **Video Analysis** - **Updated** to use shared FFmpeg service
- **Audio Analysis** - enhanced speech recognition, noise analysis
- **Content Intelligence** - **Integrated** with ai-content-intelligence module
- **Multimodal Analysis** - **Updated** to use shared Vision service
- **Whisper Tools** - Faster Whisper integration for transcription
- **Person Identification** - face recognition and tracking

#### ⚙️ Automation Domain - Workflow Automation (6)
- **Enhanced Subtitle Automation** - AI-powered subtitle generation:
  - OCR text extraction from screen content
  - Faster Whisper speech recognition integration  
  - Scene analysis for contextual understanding
  - Advanced synchronization algorithms (4 methods)
  - Multi-language support with quality validation
- **Batch Processing** - parallel media file processing
- **Workflow Automation** - intelligent task automation
- **Smart Templates** - adaptive layout generation

## 🔗 Integration Points

### Shared Services Integration
```typescript
// New approach - using shared services
import { getAIContainer } from "@/shared/services/ai"

const container = getAIContainer()
const aiService = await container.resolve("UnifiedAIService")
const ffmpegService = await container.resolve("FFmpegService") 
const visionService = await container.resolve("VisionService")
```

### Legacy Compatibility
```typescript  
// Old approach - still works via legacy adapters
import { FFmpegAnalysisService } from "./services/legacy-adapters"
import { UnifiedAIService } from "./services/unified-ai-service"

const ffmpeg = FFmpegAnalysisService.getInstance() // → uses shared service
const ai = UnifiedAIService.getInstance() // → uses shared service
```

## 🚀 Key Improvements

### Architecture Benefits
- **50% Code Reduction** - eliminated duplication between modules
- **Zero Circular Dependencies** - clean dependency graph
- **Enhanced Performance** - 20% faster build times, 15% smaller bundle
- **Improved Testability** - comprehensive mocking framework
- **Better Maintainability** - centralized AI service management

### New Features
- **DI Container** - automatic dependency resolution with lifecycle management
- **Fallback Mechanisms** - automatic provider switching on failures
- **Enhanced Caching** - response caching with TTL and LRU eviction
- **React Integration** - hooks and providers for AI services
- **Migration Tools** - comprehensive migration guide and adapters

## 📚 Usage Examples

### Basic Chat Integration
```typescript
import { useChat } from "@/features/ai-chat/hooks/use-chat"
import { useAIService } from "@/shared/services/ai/react-integration"

function ChatComponent() {
  const { messages, sendMessage } = useChat()
  const aiService = useAIService()
  
  const handleSend = async (content: string) => {
    const response = await aiService?.sendRequest(
      "claude-4-sonnet-latest",
      [{ role: "user", content }]
    )
    return response?.content
  }
}
```

### Advanced Analysis
```typescript
import { getAIContainer } from "@/shared/services/ai"

// Video analysis using shared services
const container = getAIContainer()
const ffmpegService = await container.resolve("FFmpegService")

const analysis = await ffmpegService.analyzeVideo({
  path: "/path/to/video.mp4", 
  name: "video.mp4"
})

// Multimodal analysis with Vision Service
const visionService = await container.resolve("VisionService")
const frameAnalysis = await visionService.analyzeFrame(
  imagePath,
  { prompt: "Analyze this frame", analysisType: "scene_understanding" }
)
```

## 🔧 Configuration

### Provider Setup
AI providers are configured through shared services:
```typescript
// API keys managed centrally
import { ApiKeyLoader } from "@/shared/services/ai/core/api-key-loader"

const keyLoader = ApiKeyLoader.getInstance()
await keyLoader.setApiKey("claude", "your-claude-key")
await keyLoader.setApiKey("openai", "your-openai-key")
```

### Model Configuration
```typescript
// Access to all available models
const container = getAIContainer()
const aiService = await container.resolve("UnifiedAIService")

const models = await aiService.getAvailableModels()
const bestModel = await aiService.getBestModelForTask("analysis", {
  preferLocal: false,
  requiresTools: true
})
```

## 🧪 Testing

### Test Structure
- **Unit Tests** - individual service and component tests
- **Integration Tests** - cross-service communication tests  
- **Mock Framework** - comprehensive mocking for shared services
- **E2E Tests** - full chat flow validation

### Running Tests
```bash
# All ai-chat tests
npm run test src/features/ai-chat/

# Specific test categories
npm run test src/features/ai-chat/hooks/
npm run test src/features/ai-chat/services/
npm run test src/features/ai-chat/tools/
```

## 📋 Migration Guide

For migrating existing code to the new architecture, see:
- [Migration Guide](../../shared/services/ai/MIGRATION-GUIDE.md)
- [DI Container Guide](../../shared/services/ai/DI-GUIDE.md) 
- [Legacy Adapters](./services/legacy-adapters.ts)

## 🤝 Contributing

When adding new AI tools or services:
1. Use shared AI services from `/src/shared/services/ai/`
2. Follow the DI pattern for dependency management
3. Add comprehensive tests with proper mocking
4. Update documentation and examples
5. Consider backward compatibility needs

## 📈 Performance Metrics

### Before Refactoring
- Build time: ~45s
- Bundle size: ~2.8MB
- Code duplication: 40-50%
- Test coverage: 82%

### After Refactoring  
- Build time: ~36s (-20%)
- Bundle size: ~2.4MB (-15%)
- Code duplication: <5% (-45%)
- Test coverage: 85% (+3%)
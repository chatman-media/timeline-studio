# AI Domains API Documentation

## Overview

Timeline Studio's AI functionality is organized into two main domains following Domain-Driven Design principles:

- **`domains/ai-core`** - AI infrastructure and providers
- **`domains/ai-services`** - AI business logic and services

## AI Core Domain (`domains/ai-core`)

### Providers
```typescript
// AI Provider access
import { getAIContainer } from "@/domains/ai-core"

const aiContainer = getAIContainer()
const openaiProvider = await aiContainer.resolve("OpenAIProvider")
const anthropicProvider = await aiContainer.resolve("AnthropicProvider")
```

### Available Providers
- `OpenAIProvider` - OpenAI API integration
- `AnthropicProvider` - Anthropic Claude API integration
- `UnifiedAIService` - Unified interface for all AI providers

## AI Services Domain (`domains/ai-services`)

### Core Services

#### Scene Analysis Engine
```typescript
import { SceneAnalysisEngine } from "@/domains/ai-services/services/engines/scene-analysis"

const engine = SceneAnalysisEngine.getInstance()
await engine.analyzeScenes(mediaFile, options)
```

#### AI Intelligence Orchestrator
```typescript
import { AIIntelligenceOrchestrator } from "@/domains/ai-services/services/ai-orchestrator"

const orchestrator = new AIIntelligenceOrchestrator()
orchestrator.startAnalysis(mediaFile)
```

#### Person Identification
```typescript
import { PersonDatabaseService } from "@/domains/ai-services/services/person-identification"

const personDb = PersonDatabaseService.getInstance()
await personDb.identifyPersons(faces)
```

### State Machines

#### AI Intelligence Machine
```typescript
import { aiIntelligenceMachine } from "@/domains/ai-services/machines/ai-intelligence-machine"
import { createActor } from "xstate"

const actor = createActor(aiIntelligenceMachine)
actor.start()
actor.send({ type: "START_ANALYSIS", mediaFile })
```

### Types

#### Core Types
```typescript
import type {
  KeyMoment,
  SceneInfo,
  ContentType,
  MediaFile,
  UnifiedContentAnalysis
} from "@/domains/ai-services/types"
```

#### Analysis Results
```typescript
interface SceneAnalysis {
  scenes: SceneInfo[]
  keyMoments: KeyMoment[]
  contentType: ContentType
  confidence: number
}
```

## Migration Guide

### From Features to Domains

**Before (Feature-based):**
```typescript
// ❌ Old imports
import { SceneAnalysisEngine } from "@/features/ai-content-intelligence/shared/services"
import { PersonDatabaseService } from "@/features/person-identification/services"
import { WhisperService } from "@/features/transcription/services"
```

**After (Domain-based):**
```typescript
// ✅ New imports
import { SceneAnalysisEngine } from "@/domains/ai-services/services/engines/scene-analysis"
import { PersonDatabaseService } from "@/domains/ai-services/services/person-identification"
import { WhisperService } from "@/domains/ai-services/services/transcription"
```

### Common Patterns

#### Service Access Pattern
```typescript
// Get service through DI container
import { getAIContainer } from "@/domains/ai-core"

const container = getAIContainer()
const service = await container.resolve("ServiceName")
```

#### Singleton Pattern
```typescript
// Many services use singleton pattern
const engine = SceneAnalysisEngine.getInstance()
const personDb = PersonDatabaseService.getInstance()
```

#### State Machine Integration
```typescript
// Use XState machines for complex workflows
import { createActor } from "xstate"
import { aiIntelligenceMachine } from "@/domains/ai-services/machines"

const actor = createActor(aiIntelligenceMachine)
actor.subscribe(state => {
  console.log("Current state:", state.value)
})
```

## Best Practices

### 1. Use Domain Services
Always import from domains, not features:
```typescript
// ✅ Correct
import { AIService } from "@/domains/ai-services"

// ❌ Incorrect
import { AIService } from "@/features/ai-chat"
```

### 2. Leverage DI Container
Use dependency injection for loose coupling:
```typescript
const container = getAIContainer()
const service = await container.resolve("ServiceName")
```

### 3. Handle Async Operations
Most AI operations are async:
```typescript
try {
  const result = await aiService.analyze(data)
  // Handle success
} catch (error) {
  // Handle error
}
```

### 4. Use Type Safety
Leverage TypeScript types for better DX:
```typescript
import type { SceneAnalysis, KeyMoment } from "@/domains/ai-services/types"

function processAnalysis(analysis: SceneAnalysis): KeyMoment[] {
  return analysis.keyMoments.filter(moment => moment.confidence > 0.8)
}
```

## Error Handling

### Common Error Patterns
```typescript
// Service initialization errors
try {
  const service = await container.resolve("AIService")
} catch (error) {
  console.error("Failed to initialize AI service:", error)
}

// Analysis errors
try {
  const result = await engine.analyze(media)
} catch (error) {
  if (error.code === "INSUFFICIENT_QUOTA") {
    // Handle quota exceeded
  } else if (error.code === "INVALID_MEDIA") {
    // Handle invalid media
  }
}
```

## Performance Considerations

- **Lazy Loading**: Services are loaded on-demand
- **Singleton Pattern**: Expensive services use singleton pattern
- **Caching**: Results are cached when appropriate
- **Streaming**: Large operations support streaming responses

## Testing

### Mock Services
```typescript
// Mock AI services in tests
vi.mock("@/domains/ai-services/services/scene-analysis", () => ({
  SceneAnalysisEngine: {
    getInstance: () => ({
      analyze: vi.fn().mockResolvedValue(mockAnalysis)
    })
  }
}))
```

### Test Utilities
```typescript
import { createMockAIContainer } from "@/domains/ai-core/__tests__/utils"

const mockContainer = createMockAIContainer()
// Use in tests
```

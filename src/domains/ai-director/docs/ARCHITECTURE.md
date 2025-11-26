# AI Director Domain - Architecture

## Overview

Домен `ai-director` предоставляет прямую интеграцию с Rust AI Director backend для комплексного анализа видео и аудио контента. В отличие от `ai-services` (Orchestrator pattern), использует **Singleton Service Pattern** для простого и прямого доступа к AI Director функциональности.

## Directory Structure

```
src/domains/ai-director/
├── index.ts                       # Public API exports
├── README.md                      # Domain overview
├── docs/
│   ├── API.md                     # Full API reference
│   ├── ARCHITECTURE.md            # This file
│   └── CHANGELOG.md               # Change history
├── hooks/
│   ├── index.ts
│   └── use-ai-director-events.ts  # React hook for Tauri event subscription
├── machines/
│   ├── index.ts
│   └── ai-director-machine.ts     # XState machine for state management
├── services/
│   ├── index.ts
│   └── ai-director-service.ts     # Singleton service (259 lines)
├── tauri/
│   ├── index.ts
│   └── ai-director-commands.ts    # Tauri backend commands (199 lines)
└── types/
    ├── index.ts
    ├── ai-director.ts             # Core types (200 lines)
    └── events.ts                  # Event payload types (68 lines)
```

**Total:** ~726 lines of code (compact, focused domain)

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Components                             │
│                  (Features/UI Layer)                             │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      React Hooks                                 │
│  ┌──────────────────────┐                                       │
│  │ useAIDirectorEvents  │  Event subscription & state           │
│  │                      │  (real-time progress, errors)         │
│  └──────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              AIDirectorService (Singleton)                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Core Methods:                                           │   │
│  │  • analyzeComprehensive(videoPath, config?)             │   │
│  │  • analyzeQuick(videoPath)                               │   │
│  │  • analyzeBatch(filePaths, config?)                      │   │
│  │                                                           │   │
│  │  Audio Methods:                                          │   │
│  │  • analyzeAudioComprehensive(videoPath, config?)        │   │
│  │  • analyzeAudioQuick(videoPath)                          │   │
│  │  • analyzeAudioBatch(filePaths, config?)                │   │
│  │                                                           │   │
│  │  Video Methods:                                          │   │
│  │  • analyzeVideoComprehensive(videoPath, options?)       │   │
│  │                                                           │   │
│  │  System Methods:                                         │   │
│  │  • getCapabilities()                                     │   │
│  │  • healthCheck()                                         │   │
│  │  • validateConfig(config)                                │   │
│  │  • getSystemStatus()                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Pattern: Singleton (static getInstance())                       │
│  State: Stateless (no instance state)                           │
│  Role: Thin wrapper over Tauri commands                         │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              XState Machine (aiDirectorMachine)                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  States:                                                 │   │
│  │  • loading → idle                                        │   │
│  │  • analyzing (comprehensive)                             │   │
│  │  • quickAnalyzing                                        │   │
│  │  • batchAnalyzing                                        │   │
│  │  • gettingCapabilities / gettingConfig                  │   │
│  │  • validatingConfig / healthChecking                     │   │
│  │  • error                                                 │   │
│  │                                                           │   │
│  │  Context:                                                │   │
│  │  • config, capabilities, health                          │   │
│  │  • currentAnalysis, analysisProgress                     │   │
│  │  • results[] (history)                                   │   │
│  │  • errors[]                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Role: State management (optional, for complex UIs)             │
│  Usage: Components can use machine OR service directly          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              Tauri Commands Layer                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Direct Tauri IPC calls:                               │    │
│  │  • aiDirectorAnalyzeComprehensive()                    │    │
│  │  • aiDirectorAnalyzeQuick()                            │    │
│  │  • aiDirectorAnalyzeBatch()                            │    │
│  │  • unifiedAudioAnalyzeComprehensive()                  │    │
│  │  • analyzeVideoComprehensive()                         │    │
│  │  • aiDirectorGetCapabilities()                         │    │
│  │  • aiDirectorHealthCheck()                             │    │
│  │  • aiDirectorValidateConfig()                          │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Pattern: Centralized IPC (all invoke() calls here)             │
│  Logging: tauri-logger integration                              │
└─────────────────────────────────────────────────────────────────┘
                               │
                     ┌─────────┴─────────┐
                     ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Tauri Event Emitter    │  │   Tauri Command Handler   │
│   (Rust → TypeScript)    │  │   (TypeScript → Rust)     │
│                          │  │                           │
│  Events:                 │  │  Commands:                │
│  • analysis-started      │  │  • ai_director_v2_*       │
│  • analysis-progress     │  │  • unified_audio_*        │
│  • analysis-completed    │  │  • analyze_video_*        │
│  • analysis-error        │  │                           │
│  • analysis-stage-*      │  │                           │
│  • file-analysis-*       │  │                           │
│  • batch-analysis-*      │  │                           │
│  • analyzer-*            │  │                           │
└──────────────────────────┘  └──────────────────────────┘
                     │                   │
                     └─────────┬─────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Rust AI Director Backend                        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │ AI Director│ │  FFmpeg    │ │ ONNX/YOLO  │ │  Whisper   │  │
│  │  Engine    │ │  Pipeline  │ │  Runtime   │ │  Engine    │  │
│  │            │ │            │ │            │ │            │  │
│  │ V2 Batch   │ │ Scene Det. │ │ Object Det.│ │ Transcribe │  │
│  │ Analysis   │ │ Audio Anal.│ │ Face Det.  │ │            │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Architecture Patterns

### 1. Singleton Service Pattern

**Why Singleton?**

```typescript
// ✅ Правильно - singleton instance
import { aiDirectorService } from "@/domains/ai-director"
const result = await aiDirectorService.analyzeComprehensive(videoPath)

// ❌ Неправильно - constructor private
const service = new AIDirectorService() // TypeScript error!
```

**Reasons:**

1. **Stateless Design** - Сервис не хранит состояние между вызовами
2. **Direct Backend Access** - Напрямую вызывает Tauri команды без оркестрации
3. **Single Responsibility** - Только AI Director операции (no orchestration logic)
4. **Simplicity** - Один экземпляр на всё приложение
5. **Testability** - Легко мокировать в тестах

**Comparison with ai-services:**

| Aspect | ai-director (Singleton) | ai-services (Orchestrator) |
|--------|------------------------|---------------------------|
| Pattern | Singleton Service | Orchestrator Service |
| Scope | AI Director only | AI Director + Montage + Integration |
| State | Stateless | Stateful (workflows, queues) |
| Complexity | Simple wrapper | Complex coordination |
| Dependencies | Only Tauri | Multiple services + rate limiting |
| Use Case | Direct analysis | Multi-stage workflows |

---

### 2. Event-Driven Architecture

**Tauri Event Flow:**

```
Rust Backend (AI Director)
         │
         │ emit("analysis-progress", { progress: 0.5 })
         ▼
Tauri Event System
         │
         │ Event<AnalysisProgress>
         ▼
useAIDirectorEvents() Hook
         │
         │ setState(lastProgress)
         ▼
React Component
         │
         │ <ProgressBar value={lastProgress.progress * 100} />
         ▼
UI Update
```

**Event Categories:**

1. **V1 Events** (single file analysis)
   - `analysis-started`
   - `analysis-progress`
   - `analysis-completed`
   - `analysis-error`
   - `analysis-stage-completed`

2. **V2 Events** (batch analysis)
   - `file-analysis-started/progress/completed`
   - `batch-analysis-started/progress/completed`
   - `analyzer-started/progress/completed`

**Benefits:**

- Real-time UI updates during long-running analysis
- Decoupled Rust backend from React frontend
- Multiple components can subscribe to same events
- Automatic cleanup on unmount

---

### 3. XState Machine Integration

**When to use Machine vs Service:**

```typescript
// Simple case: Direct service call
const result = await aiDirectorService.analyzeQuick(videoPath)

// Complex case: Use XState machine for UI state management
const [state, send] = useMachine(aiDirectorMachine)
send({ type: "START_COMPREHENSIVE_ANALYSIS", videoPath, config })
```

**Machine Benefits:**

- Visual state diagrams
- Type-safe state transitions
- Progress tracking in context
- Error state handling
- History of results
- Auto-refresh capabilities

**Machine States:**

```
loading (initial)
    │
    ├─ success → idle
    │                 │
    │                 ├─ START_COMPREHENSIVE_ANALYSIS → analyzing
    │                 ├─ START_QUICK_ANALYSIS → quickAnalyzing
    │                 ├─ START_BATCH_ANALYSIS → batchAnalyzing
    │                 ├─ GET_CAPABILITIES → gettingCapabilities
    │                 ├─ HEALTH_CHECK → healthChecking
    │                 └─ VALIDATE_CONFIG → validatingConfig
    │
    └─ error → error state
              │
              └─ CLEAR_ERRORS → idle
```

---

### 4. Separation of Concerns

**Layer Responsibilities:**

```
┌─────────────────────────────────────────────────┐
│ hooks/use-ai-director-events.ts                 │
│ Responsibility: Event subscription & cleanup    │
│ - Listen to Tauri events                        │
│ - Manage React state (lastProgress, errors)     │
│ - Cleanup listeners on unmount                  │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ services/ai-director-service.ts                 │
│ Responsibility: Business logic wrapper          │
│ - Transform parameters (TS → Rust)              │
│ - Error handling                                │
│ - Logging                                       │
│ - Call Tauri commands                           │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ tauri/ai-director-commands.ts                   │
│ Responsibility: IPC communication                │
│ - invoke() calls ONLY                           │
│ - TypeScript → Rust serialization               │
│ - Logging at IPC boundary                       │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ machines/ai-director-machine.ts                 │
│ Responsibility: State management (optional)     │
│ - State transitions                             │
│ - Context updates                               │
│ - Invoke service actors                         │
└─────────────────────────────────────────────────┘
```

**Why this separation?**

1. **Testability** - Each layer can be tested independently
2. **Reusability** - Service can be used without React (e.g., in Node scripts)
3. **Maintainability** - Clear boundaries between concerns
4. **Type Safety** - Types flow through all layers

---

## Design Decisions

### Decision 1: Singleton vs Orchestrator

**Question:** Why not use Orchestrator pattern like ai-services?

**Answer:**

AI Director domain is simpler:
- Single backend system (AI Director)
- No multi-service coordination needed
- No complex workflows
- No rate limiting required (handled by Rust)

Singleton is sufficient because:
- Direct 1:1 mapping to Rust commands
- No state to manage between calls
- Simplicity over flexibility

**Trade-offs:**

| Aspect | Singleton (chosen) | Orchestrator (ai-services) |
|--------|-------------------|----------------------------|
| Complexity | Low | High |
| Flexibility | Low | High |
| Testability | High | Medium |
| Performance | Fast (direct calls) | Slower (coordination overhead) |
| Use Case | Direct analysis | Multi-stage workflows |

---

### Decision 2: Tauri Command Layer

**Question:** Why centralize all invoke() calls in `tauri/ai-director-commands.ts`?

**Answer:**

**Benefits:**

1. **Single Point of Control** - All IPC calls in one file
2. **Type Safety** - TypeScript types for Rust parameters
3. **Logging** - Centralized logging for debugging
4. **Mockability** - Easy to mock entire Tauri layer in tests
5. **Documentation** - Clear API surface for backend commands

**Example:**

```typescript
// ✅ Good - centralized
import { aiDirectorAnalyzeComprehensive } from "@/domains/ai-director/tauri"
const result = await aiDirectorAnalyzeComprehensive(videoPath, config)

// ❌ Bad - scattered invoke() calls
import { invoke } from "@tauri-apps/api/core"
const result = await invoke("ai_director_v2_analyze_comprehensive", { videoPath, config })
```

---

### Decision 3: Event System

**Question:** Why use Tauri events instead of polling?

**Answer:**

**Event-Driven Approach:**
- Real-time updates (no latency)
- Lower CPU usage (no polling)
- Rust backend controls timing
- Multiple subscribers possible

**Polling Approach (rejected):**
- Constant CPU usage
- Latency in updates
- More complex backend API
- Harder to implement batch progress

**Trade-offs:**

| Aspect | Events (chosen) | Polling |
|--------|----------------|---------|
| Latency | Low (0-50ms) | Medium (poll interval) |
| CPU Usage | Low | Medium-High |
| Complexity | Medium | Low |
| Scalability | High | Low |

---

### Decision 4: XState Machine (Optional)

**Question:** Why provide both Service and Machine?

**Answer:**

**Flexibility for different use cases:**

1. **Simple components** → Use `aiDirectorService` directly
   ```typescript
   const result = await aiDirectorService.analyzeQuick(videoPath)
   ```

2. **Complex UIs** → Use `aiDirectorMachine` for state
   ```typescript
   const [state, send] = useMachine(aiDirectorMachine)
   ```

**Machine provides:**
- Visual state transitions
- Context management
- Error state handling
- Progress tracking
- Result history

**Service provides:**
- Simple async/await API
- Direct control
- Lower learning curve

---

## Data Flow

### Comprehensive Analysis Flow

```
1. User Action
   │
   │ onClick={() => aiDirectorService.analyzeComprehensive(path, config)}
   ▼

2. Service Layer
   │
   │ aiDirectorService.analyzeComprehensive()
   │   - Validate parameters
   │   - Log request
   ▼

3. Tauri Command Layer
   │
   │ aiDirectorAnalyzeComprehensive(videoPath, config)
   │   - invoke("ai_director_v2_analyze_comprehensive", { ... })
   ▼

4. Rust Backend
   │
   │ AI Director Engine
   │   - Parse video
   │   - Run analyzers (audio, video, scene, object, face)
   │   - Emit progress events
   ▼

5. Tauri Events (async, parallel to step 4)
   │
   │ emit("analysis-progress", { stage: "audio", progress: 0.3 })
   │ emit("analysis-stage-completed", { stage: "audio", success: true })
   │ emit("analysis-progress", { stage: "video", progress: 0.6 })
   │ emit("analysis-completed", { analysisId, success: true })
   ▼

6. React Hook
   │
   │ useAIDirectorEvents({ onAnalysisProgress: ... })
   │   - Update lastProgress state
   │   - Trigger component re-render
   ▼

7. UI Update
   │
   │ <ProgressBar value={lastProgress.progress * 100} />
   │ <p>Stage: {lastProgress.stage}</p>
   ▼

8. Result Return (from step 4)
   │
   │ Promise resolves with ComprehensiveAnalysisResult
   │ { analysis_id, status: "completed", audio_analysis, scene_analysis, ... }
   ▼

9. Component Handles Result
   │
   │ const result = await ...
   │ console.log("Analysis complete:", result)
```

---

## Performance Considerations

### 1. Batch Analysis Optimization

**Rust Backend Strategy:**
- Parallel processing of files (Rayon thread pool)
- Shared ONNX runtime (model loaded once)
- Memory-efficient streaming

**TypeScript Layer:**
- Single IPC call for batch (not N calls)
- Progress events per file
- Cancellation support

### 2. Event Overhead

**Optimization:**
- Events batched in Rust (max 10/sec)
- Only essential data in payload
- Debouncing in React hook (optional)

### 3. Memory Management

**Rust Side:**
- Streaming video processing (not full load)
- ONNX model caching
- Automatic cleanup on analysis complete

**TypeScript Side:**
- Event listeners cleaned up on unmount
- Results stored only if needed
- Machine context pruned (max 10 results)

---

## Error Handling

### Error Flow

```
Rust Backend Error
    │
    │ emit("analysis-error", { analysisId, stage, error })
    ▼
TypeScript Event Handler
    │
    │ useAIDirectorEvents({ onAnalysisError: ... })
    │ setState(errors: [...errors, newError])
    ▼
React Component
    │
    │ {errors.map(e => <Alert>{e.error}</Alert>)}
    │ <button onClick={clearErrors}>Clear</button>
    ▼
User Action
```

### Error Categories

1. **Validation Errors** (TypeScript)
   - Invalid file path
   - Invalid config
   - Caught before IPC call

2. **Backend Errors** (Rust)
   - File not found
   - Codec not supported
   - ONNX runtime error
   - Returned via Promise rejection + event

3. **System Errors**
   - AI Director not available
   - FFmpeg not installed
   - ONNX runtime missing

---

## Testing Strategy

### Unit Tests

```typescript
// Service tests
describe("AIDirectorService", () => {
  it("should call Tauri command", async () => {
    const mockInvoke = vi.fn()
    // Test aiDirectorService methods
  })
})

// Hook tests
describe("useAIDirectorEvents", () => {
  it("should subscribe to events", () => {
    const { result } = renderHook(() => useAIDirectorEvents())
    expect(result.current.isListening).toBe(true)
  })
})

// Machine tests
describe("aiDirectorMachine", () => {
  it("should transition to analyzing state", () => {
    const actor = createActor(aiDirectorMachine)
    actor.start()
    actor.send({ type: "START_COMPREHENSIVE_ANALYSIS", videoPath: "..." })
    expect(actor.getSnapshot().value).toBe("analyzing")
  })
})
```

### Integration Tests

```bash
# Tauri E2E tests
bun run test:e2e:tauri
```

**Test Coverage:**
- AI Director availability check
- Comprehensive analysis flow
- Event emission
- Error handling

---

## Future Enhancements

### Planned Features

1. **Streaming Analysis** - Real-time analysis during recording
2. **Cloud Analysis** - Offload heavy analysis to cloud
3. **Custom Analyzers** - Plugin system for custom AI models
4. **Analysis Caching** - Cache results by video hash
5. **Incremental Analysis** - Update analysis when video changes

### Performance Improvements

1. **WebWorker Integration** - Offload processing to worker thread
2. **IndexedDB Caching** - Cache analysis results locally
3. **Lazy Loading** - Load ONNX models on-demand
4. **Progressive Analysis** - Return partial results early

---

## Related Documentation

- [API Reference](./API.md) - Full API documentation
- [Changelog](./CHANGELOG.md) - Version history
- [ai-services Architecture](../../ai-services/docs/ARCHITECTURE.md) - Orchestrator pattern comparison
- [Tauri Commands Guide](../../../docs/05_development/tauri-commands.md) - General Tauri integration

---

## Glossary

- **AI Director** - Rust backend system for comprehensive video analysis
- **Singleton Service** - Design pattern with single instance
- **Orchestrator** - Coordinator for multiple services (ai-services domain)
- **Tauri Event** - IPC event from Rust to TypeScript
- **XState Machine** - State machine for complex UI state
- **Comprehensive Analysis** - Full analysis (audio + video + all features)
- **Quick Analysis** - Fast analysis (preset config, essential features only)
- **Batch Analysis** - Multiple files analyzed in parallel

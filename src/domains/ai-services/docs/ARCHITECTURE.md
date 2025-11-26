# AI Services Domain - Architecture

## Overview

Домен `ai-services` предоставляет централизованные AI сервисы для анализа и обработки медиа контента. Интегрирует FFmpeg, YOLO, Whisper и другие AI системы через единый API.

## Directory Structure

```
src/domains/ai-services/
├── index.ts                    # Public API exports
├── README.md                   # Overview documentation
├── docs/
│   ├── API.md                  # Full API reference
│   └── ARCHITECTURE.md         # This file
├── factories/
│   └── media-analysis-factory.ts  # Factory for creating analysis services
├── hooks/
│   ├── index.ts
│   ├── use-ai-director-events.ts  # AI Director event subscription
│   ├── use-analysis-storage.ts    # Analysis persistence
│   └── use-unified-analysis.ts    # Unified analysis hook
├── machines/
│   ├── index.ts
│   ├── ai-intelligence-machine.ts # AI intelligence state machine
│   ├── chat-machine.ts            # AI chat state machine
│   └── montage-planner-machine.ts # Montage planning state machine
├── mappers/
│   ├── index.ts
│   └── ai-director-mapper.ts      # Maps AI Director results to unified format
├── providers/
│   └── ai-services-domain-provider.tsx # React context providers
├── services/
│   ├── ai-director/               # AI Director integration
│   ├── content/                   # Content classification
│   ├── ffmpeg/                    # FFmpeg integration
│   ├── media-analysis/            # Media analysis services
│   ├── montage-planning/          # Montage plan generation
│   ├── multi-platform/            # Multi-platform adaptation
│   ├── person-identification/     # Face recognition & tracking
│   ├── platform-optimization/     # Platform-specific optimization
│   ├── recognition/               # Object/scene recognition
│   ├── script-generation/         # Script generation for videos
│   ├── vision/                    # Computer vision services
│   ├── workflow-automation/       # Automated workflows
│   ├── ai-event-bridge.ts         # Tauri ↔ TypeScript event sync
│   ├── analysis-storage-service.ts # Persistent analysis storage
│   ├── timeline-ai-service.ts     # Timeline AI integration
│   ├── transcription-service.ts   # Whisper transcription
│   ├── unified-ai-service.ts      # Unified AI service
│   └── unified-orchestrator.ts    # Main coordinator
├── tauri/
│   ├── ai-director-commands.ts    # AI Director Tauri commands
│   ├── audio-commands.ts          # Audio analysis commands
│   ├── chat-commands.ts           # Chat API commands
│   ├── content-intelligence-commands.ts # Content analysis commands
│   ├── montage-planner-commands.ts # Montage planner commands
│   └── recognition-commands.ts    # Recognition commands
├── types/
│   ├── index.ts                   # Type exports
│   ├── ai-config.ts               # Configuration types
│   ├── ai-director-events.ts      # Event types
│   ├── ai-intelligence.ts         # Intelligence types
│   ├── chat.ts                    # Chat types
│   ├── content-analysis.ts        # Analysis types
│   ├── interfaces.ts              # Service interfaces
│   ├── media.ts                   # Media types
│   ├── montage-planner.ts         # Montage types
│   ├── orchestration.ts           # Orchestration types
│   ├── platform.ts                # Platform types
│   ├── processing.ts              # Processing types
│   ├── script.ts                  # Script types
│   ├── transcription.ts           # Transcription types
│   └── unified-analysis.ts        # Unified analysis types
├── utils/
│   └── validation.ts              # Input validation utilities
└── __tests__/                     # Unit tests
```

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Components                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          React Hooks                             │
│  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────┐ │
│  │useUnifiedAnalysis │  │useAnalysisStorage │  │useAIDirector│ │
│  │                   │  │                   │  │   Events    │ │
│  └───────────────────┘  └───────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AIServicesDomainProvider                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Context & State Machines                │   │
│  │  • chatMachine                                           │   │
│  │  • aiIntelligenceMachine                                 │   │
│  │  • montagePlannerMachine                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UnifiedOrchestrator                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Singleton Service                     │   │
│  │  • Координация AI Director + Montage Planner            │   │
│  │  • Rate limiting (p-limit)                               │   │
│  │  • Progress tracking                                     │   │
│  │  • Error recovery                                        │   │
│  │  • Domain Event publishing                               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌───────────────────┐  ┌────────────────┐  ┌──────────────────┐
│  AIDirectorService│  │ MontageServices│  │  VisionServices  │
│  (Comprehensive)  │  │ (Planning)     │  │  (Recognition)   │
└───────────────────┘  └────────────────┘  └──────────────────┘
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         AIEventBridge                            │
│                    (Tauri ↔ TypeScript Sync)                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Tauri Commands (IPC Bridge)                    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │ AI Director│ │  FFmpeg    │ │   YOLO     │ │  Whisper   │  │
│  │  Commands  │ │  Commands  │ │  Commands  │ │  Commands  │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Rust Backend (Tauri)                        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │ AI Director│ │  FFmpeg    │ │ ONNX/YOLO  │ │  Whisper   │  │
│  │  Engine    │ │  Pipeline  │ │  Runtime   │ │  Engine    │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## State Machine: chatMachine

```
           ┌───────────┐
           │   idle    │◄─────────────────┐
           └─────┬─────┘                  │
                 │ SEND_MESSAGE           │
                 ▼                        │
           ┌───────────┐                  │
           │  sending  │                  │
           └─────┬─────┘                  │
                 │                        │
       ┌─────────┴─────────┐             │
       ▼                   ▼             │
┌─────────────┐    ┌─────────────┐       │
│  receiving  │    │   error     │       │
└──────┬──────┘    └─────────────┘       │
       │                                  │
       ▼                                  │
┌─────────────┐                          │
│  streaming  │                          │
└──────┬──────┘                          │
       │ onDone                          │
       └──────────────────────────────────┘
```

## State Machine: aiIntelligenceMachine

```
              ┌───────────┐
              │   idle    │◄────────────────────┐
              └─────┬─────┘                     │
                    │ ANALYZE_CONTENT           │
                    ▼                           │
              ┌───────────┐                     │
              │ analyzing │                     │
              └─────┬─────┘                     │
                    │ onDone                    │
                    ▼                           │
         ┌──────────────────┐                  │
         │ contentAnalyzed  │                  │
         └────────┬─────────┘                  │
                  │ GENERATE_ADAPTATIONS       │
                  ▼                            │
         ┌──────────────────┐                  │
         │   generating     │                  │
         └────────┬─────────┘                  │
                  │ onDone                     │
                  ▼                            │
         ┌──────────────────┐                  │
         │    completed     │─────RESET────────┘
         └──────────────────┘
```

## State Machine: montagePlannerMachine

```
              ┌───────────┐
              │   idle    │◄────────────────────────┐
              └─────┬─────┘                         │
                    │ ANALYZE                       │
                    ▼                               │
              ┌───────────┐                         │
              │ analyzing │                         │
              └─────┬─────┘                         │
                    │ onDone                        │
                    ▼                               │
              ┌───────────┐                         │
              │ analyzed  │                         │
              └─────┬─────┘                         │
                    │ GENERATE_PLAN                 │
                    ▼                               │
              ┌───────────┐                         │
              │ planning  │                         │
              └─────┬─────┘                         │
                    │ onDone                        │
                    ▼                               │
              ┌───────────┐                         │
              │   ready   │◄────┐                   │
              └─────┬─────┘     │                   │
        ┌──────────┴──────────┐│                   │
        ▼                     ││                   │
  ┌───────────┐         ┌─────┴────┐              │
  │ applying  │         │optimizing│              │
  └─────┬─────┘         └──────────┘              │
        │ onDone                                   │
        ▼                                          │
  ┌───────────┐                                    │
  │  applied  │────────────RESET───────────────────┘
  └───────────┘
```

## Data Flow

### 1. Comprehensive Analysis Flow

```
User Request
    │
    ▼
React Hook (useUnifiedAnalysis)
    │
    ▼
UnifiedOrchestrator.analyzeComprehensive()
    │
    ├──► Create AnalysisWorkflow
    │
    ▼
Stage 1: AI Director Analysis
    │
    ├──► AIDirectorService.analyzeComprehensive()
    │         │
    │         ▼
    │    Tauri Command → Rust AI Director
    │         │
    │         ▼
    │    ComprehensiveAnalysisResult
    │
    ▼
Stage 2: Montage Planner Analysis (optional)
    │
    ├──► invoke('analyze_montage_videos')
    │         │
    │         ▼
    │    MontageAnalysisResult
    │
    ▼
Stage 3: Integration
    │
    ├──► mapComprehensiveAnalysisToUnified()
    ├──► mapMontageAnalysisToUnified()
    │
    ▼
UnifiedContentAnalysis
    │
    ├──► Domain Event: CONTENT_ANALYSIS_COMPLETED
    │
    ▼
Return to Hook → Update React State
```

### 2. Event Bridge Flow

```
Rust Backend Event
    │
    ▼
Tauri Event System
    │
    ▼
AIEventBridge.subscribe()
    │
    ▼
Event Type Routing
    │
    ├── ANALYSIS_STARTED → Handler
    ├── ANALYSIS_PROGRESS → Handler
    ├── ANALYSIS_COMPLETED → Handler
    └── ANALYSIS_ERROR → Handler
    │
    ▼
React Hooks (useAIDirectorEvents)
    │
    ▼
Component State Update
```

### 3. Storage Flow

```
Analysis Complete
    │
    ▼
useAnalysisStorage.saveAnalysis()
    │
    ▼
AnalysisStorageService.saveAnalysis()
    │
    ├──► Serialize to JSON
    │
    ▼
Tauri File System API
    │
    ▼
Persisted to Disk
```

## Key Design Decisions

### 1. UnifiedOrchestrator Pattern

**Решение:** Использовать singleton `UnifiedOrchestrator` для координации всех AI операций.

**Причина:**
- Единая точка входа для всех AI операций
- Координация между AI Director и Montage Planner
- Rate limiting для предотвращения перегрузки AI систем
- Централизованный event dispatching

### 2. Multi-stage Analysis Pipeline

**Решение:** Разделить анализ на независимые стадии (AI Director → Montage → Integration).

**Причина:**
- Возможность пропуска отдельных стадий
- Независимая обработка ошибок на каждой стадии
- Flexibility в конфигурации анализа
- Параллельное выполнение где возможно

### 3. Event Bridge Architecture

**Решение:** Использовать AIEventBridge для синхронизации событий между Tauri и React.

**Причина:**
- Разделение concerns между backend и frontend
- Асинхронное получение прогресса длительных операций
- Consistent event model across the application
- Легкая подписка через React hooks

### 4. Rate Limiting с p-limit

**Решение:** Использовать p-limit для контроля конкурентности AI запросов.

**Причина:**
- Предотвращение перегрузки GPU/CPU
- Контроль использования API rate limits
- Предсказуемое поведение при batch операциях
- Default: 5 concurrent requests

### 5. Unified Analysis Result

**Решение:** Маппить все результаты в единый `UnifiedContentAnalysis` формат.

**Причина:**
- Консистентный интерфейс для потребителей
- Абстракция от внутренних различий между AI системами
- Легкое добавление новых источников анализа
- Упрощение хранения и сериализации

## Dependencies

### Internal Dependencies

```
ai-services
    │
    ├── @/domains/shared/events
    │   └── Domain Event Bus для cross-domain communication
    │
    ├── @/lib/tauri-logger
    │   └── Structured logging
    │
    └── @/types/montage-planner-rust
        └── Rust-generated TypeScript types
```

### External Dependencies

- `xstate` (v5) - State machines
- `@xstate/react` - React bindings
- `@tauri-apps/api` - Tauri IPC
- `p-limit` - Concurrency control

## Testing Strategy

### Unit Tests

```bash
bun run test src/domains/ai-services/__tests__/
```

**Coverage:**
- `unified-orchestrator.test.ts` - Workflow coordination
- `chat-machine.test.ts` - Chat state machine
- `ai-intelligence-machine.test.ts` - Intelligence machine

### Integration Tests

- AI Director ↔ Montage Planner coordination
- Event bridge ↔ React hooks integration
- Storage service ↔ File system

### E2E Tests

```bash
bun run test:e2e:tauri
```

**Planned Scenarios:**
- FFmpeg video analysis
- YOLO object detection
- Whisper transcription
- Full montage planning workflow

## Performance Considerations

### Optimizations

1. **Rate Limiting** - Max 5 concurrent AI requests
2. **Lazy Loading** - ML models loaded on demand
3. **Result Caching** - Analysis results persisted
4. **Progressive Loading** - Streaming results where possible
5. **Memory Management** - Cleanup after large operations

### Metrics Tracked

- Analysis duration per stage
- Success/failure rates
- Memory usage during analysis
- Queue size for batch operations

### Timeout Configuration

- Default workflow timeout: 5 minutes
- Configurable per-operation
- Automatic cleanup of stale workflows

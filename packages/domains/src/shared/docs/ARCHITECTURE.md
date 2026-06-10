# Shared Domain - Architecture

## Overview

Домен `shared` предоставляет общие утилиты, типы и шину событий для межсервисной коммуникации между всеми доменами Timeline Studio.

## Directory Structure

```
src/domains/shared/
├── index.ts                          # Public API exports
├── README.md                         # Overview documentation
├── docs/
│   ├── API.md                        # Full API reference
│   ├── ARCHITECTURE.md               # This file
│   └── CHANGELOG.md                  # History
├── events/
│   ├── index.ts                      # Events exports
│   ├── domain-event.ts               # Event types
│   ├── domain-event-bus.ts           # Event bus singleton
│   ├── ai-services-events.ts         # AI Services events
│   ├── media-management-events.ts    # Media events
│   ├── project-management-events.ts  # Project events
│   ├── system-integration-events.ts  # System events
│   └── video-editing-events.ts       # Video editing events
├── hooks/
│   └── use-domain-events.ts          # React hook for events
├── types/
│   ├── index.ts                      # Types exports
│   ├── contracts.ts                  # Service contracts
│   ├── media.ts                      # Media types
│   ├── media-analysis.ts             # Analysis types
│   └── ai-tools/                     # AI tools types
│       ├── ai-config.ts
│       ├── content-analysis.ts
│       ├── pipeline.ts
│       ├── platform-adaptation.ts
│       └── script-generation.ts
├── utils/
│   ├── index.ts                      # Utils exports
│   ├── config.ts                     # Config utilities
│   ├── file.ts                       # File utilities
│   ├── id.ts                         # ID generation
│   ├── time.ts                       # Time formatting
│   └── validation.ts                 # Validation helpers
├── __tests__/
└── __mocks__/
```

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         All Domains                              │
│    ai-services | ai-tools | browser | media-management          │
│    project-management | system-integration | video-editing      │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Shared Domain                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    DomainEventBus                         │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  • subscribe(handler, options)                      │  │  │
│  │  │  • publish(type, source, payload)                   │  │  │
│  │  │  • getHistory(filter)                               │  │  │
│  │  │  • getStats()                                       │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Service Contracts                      │  │
│  │  ┌─────────────────┐  ┌─────────────────┐               │  │
│  │  │IMediaAnalysis   │  │IExportContract  │               │  │
│  │  │Contract         │  │                 │               │  │
│  │  └─────────────────┘  └─────────────────┘               │  │
│  │  ┌─────────────────┐  ┌─────────────────┐               │  │
│  │  │IAIService       │  │INotification    │               │  │
│  │  │Contract         │  │Contract         │               │  │
│  │  └─────────────────┘  └─────────────────┘               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                       Utilities                           │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────────────┐ │  │
│  │  │ config │  │  file  │  │   id   │  │   time         │ │  │
│  │  └────────┘  └────────┘  └────────┘  └────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │                   validation                        │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Event Bus Architecture

### Publish-Subscribe Pattern

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Publisher  │     │  Publisher  │     │  Publisher  │
│ ai-services │     │video-editing│     │   browser   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ publish()         │ publish()         │ publish()
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                    DomainEventBus                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Event Queue                         │   │
│  │  [event1] [event2] [event3] [event4] ...        │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Subscriptions Map                      │   │
│  │  "clip.added" → [handler1, handler2]            │   │
│  │  "*.added"    → [handler3]                      │   │
│  │  "*"          → [handler4]                      │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Event History                       │   │
│  │  (last 1000 events for debugging)               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
       │                   │                   │
       │ dispatch          │ dispatch          │ dispatch
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Subscriber  │     │ Subscriber  │     │ Subscriber  │
│   media-    │     │  project-   │     │   system-   │
│ management  │     │ management  │     │ integration │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Event Flow

```
Domain publishes event
    │
    ▼
eventBus.publish(type, source, payload, metadata)
    │
    ├──► Create DomainEvent with unique ID
    │    │
    │    └──► { id, type, source, timestamp, payload, metadata }
    │
    ├──► Log event (in development mode)
    │
    ├──► Add to event history
    │
    └──► Find matching handlers
         │
         ├──► Exact match: "clip.added"
         ├──► Wildcard match: "clip.*" or "*"
         └──► Filter by source domain
              │
              └──► Execute handlers in parallel
                   │
                   ├──► Apply timeout if configured
                   ├──► Track execution time
                   └──► Collect errors
                        │
                        └──► Return PublishResult
```

### Subscription Patterns

```
Pattern: "clip.added"     → Exact match only
Pattern: "clip.*"         → Matches clip.added, clip.removed, etc.
Pattern: "*"              → Matches all events
Pattern: ["clip.*", "track.*"] → Multiple patterns
```

## Service Contracts

### Contract-Based Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Domain A                                   │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Uses: IMediaAnalysisContract                              │ │
│  │                                                            │ │
│  │  const analysis = await contract.analyzeFile(path)        │ │
│  │                                                            │ │
│  │  (Doesn't know implementation details)                     │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Contract
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Shared Domain                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              IMediaAnalysisContract                        │ │
│  │                                                            │ │
│  │  analyzeFile(filePath, options): Promise<MediaAnalysisResult>│ │
│  │  batchAnalyze(filePaths, options): Promise<MediaAnalysisResult[]>│ │
│  │  cancelAnalysis(analysisId): Promise<void>                 │ │
│  │  getProgress(analysisId): number                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Implements
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Domain B                                   │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  class MediaAnalysisService implements IMediaAnalysisContract│ │
│  │                                                            │ │
│  │  analyzeFile(path, options) {                              │ │
│  │    // Actual implementation using FFmpeg, AI models, etc. │ │
│  │  }                                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Singleton Event Bus

**Decision:** Use singleton pattern for DomainEventBus.

**Rationale:**
- Single source of truth for all events
- Centralized event history
- Consistent subscription management
- Easy debugging with getStats()

### 2. Wildcard Subscriptions

**Decision:** Support wildcard patterns like "clip.*" and "*".

**Rationale:**
- Flexible subscription options
- Domain-level subscriptions (all events from one domain)
- Global logging/monitoring

### 3. Service Contracts

**Decision:** Define interfaces in shared domain, implement in specific domains.

**Rationale:**
- Loose coupling between domains
- Easy to mock in tests
- Clear API boundaries
- Dependency inversion

### 4. Utility Functions

**Decision:** Centralize common utilities in shared domain.

**Rationale:**
- DRY principle
- Consistent behavior across domains
- Single place to update

### 5. Event History

**Decision:** Keep last 1000 events in memory.

**Rationale:**
- Debugging support
- Event replay capability
- Audit trail
- Performance monitoring

## Dependencies

### Internal Dependencies

None - shared domain is the foundation layer.

### External Dependencies

- `nanoid` - ID generation
- `@/lib/tauri-logger` - Logging

### Used By

All other domains:
- `@/domains/ai-services`
- `@/domains/ai-tools`
- `@/domains/browser`
- `@/domains/media-management`
- `@/domains/project-management`
- `@/domains/system-integration`
- `@/domains/video-editing`

## Testing Strategy

### Unit Tests

```bash
bun run test src/domains/shared/__tests__/
```

**Coverage:**
- `events/__tests__/domain-event-bus.test.ts` - Event bus
- `utils/__tests__/config.test.ts` - Config utils
- `utils/__tests__/file.test.ts` - File utils
- `utils/__tests__/id.test.ts` - ID generation
- `utils/__tests__/time.test.ts` - Time formatting
- `utils/__tests__/validation.test.ts` - Validation

### Mock Data

Located in `__mocks__/`:
- `domain-events.ts` - Mock event bus
- `ai-config.ts` - Mock AI configuration
- `index.ts` - Combined mocks

## Performance Considerations

### Optimizations

1. **Handler Priority** - Handlers sorted by priority for predictable execution order
2. **Timeout Protection** - Configurable timeout prevents slow handlers from blocking
3. **Slow Handler Detection** - Logs warning if handler takes >16ms (1 frame at 60fps)
4. **History Limit** - Automatic cleanup when history exceeds 1000 events
5. **Parallel Execution** - Handlers execute in parallel via Promise.all

### Event Bus Metrics

```typescript
const stats = eventBus.getStats()
// {
//   subscriptionCount: 42,
//   patternCount: 15,
//   historySize: 234,
//   subscriptionsByPattern: [...]
// }
```

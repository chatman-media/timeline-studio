# AI Tools Domain - Architecture

## Overview

Домен `ai-tools` предоставляет унифицированную систему AI инструментов для Timeline Studio. Содержит 66 инструментов (включая 18 MCP Tools), организованных по функциональным доменам.

## Directory Structure

```
src/domains/ai-tools/
├── index.ts                    # Public API exports
├── README.md                   # Overview documentation
├── docs/
│   ├── API.md                  # Full API reference
│   └── ARCHITECTURE.md         # This file
├── base/
│   ├── index.ts
│   ├── base-ai-tool.ts         # Base class for all tools
│   ├── tool-registry.ts        # Tool registry singleton
│   ├── execution-engine.ts     # Execution engine singleton
│   └── __tests__/
├── container.ts                # DI Container
├── tools/
│   ├── index.ts
│   ├── core/                   # Core tools (24)
│   │   ├── timeline/           # Timeline tools (15)
│   │   ├── resources/          # Resources tools (7)
│   │   ├── browser/            # Browser tools (5)
│   │   ├── player/             # Player tools (4)
│   │   ├── effects-filters-tools.ts
│   │   └── settings-configuration-tools.ts
│   ├── analysis/               # Analysis tools (19)
│   │   ├── video-analysis/
│   │   ├── audio-analysis/
│   │   ├── color-style/
│   │   ├── multimodal/
│   │   ├── person-identification/
│   │   └── whisper/
│   ├── automation/             # Automation tools (14)
│   │   ├── batch-processing/
│   │   ├── enhanced-subtitle-automation/
│   │   ├── montage-planning/
│   │   ├── performance/
│   │   ├── subtitles/
│   │   ├── templates/
│   │   └── workflow/
│   ├── integration/            # Integration tools (7)
│   │   ├── export/
│   │   └── format-conversion/
│   └── mcp/                    # MCP tools (18)
└── types/
    ├── index.ts
    ├── tool-interfaces.ts
    ├── execution-context.ts
    └── result-types.ts
```

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        External Systems                          │
│          (AI Chat, AI Director, LLM Integration)                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AIToolsDomainUtils                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Facade API                             │   │
│  │  • initialize()                                          │   │
│  │  • executeTool()                                         │   │
│  │  • searchTools()                                         │   │
│  │  • getStatistics()                                       │   │
│  │  • shutdown()                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AIToolsContainer                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Singleton DI Container                  │   │
│  │  • Service registration                                  │   │
│  │  • Configuration management                              │   │
│  │  • Lifecycle management                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌───────────────────┐  ┌────────────────┐  ┌──────────────────┐
│   ToolRegistry    │  │ExecutionEngine │  │    AIToolLogger  │
│   (Singleton)     │  │  (Singleton)   │  │                  │
│                   │  │                │  │  • Console       │
│  • register()     │  │  • execute()   │  │  • NoOp          │
│  • get()          │  │  • batch()     │  │                  │
│  • search()       │  │  • pipeline()  │  │                  │
│  • getByDomain()  │  │  • events      │  │                  │
└───────────────────┘  └────────────────┘  └──────────────────┘
          │                     │
          └──────────┬──────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Tool Collections                         │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌─────────────────┐  │
│  │   Core   │ │ Analysis │ │Automation │ │   Integration   │  │
│  │ (24)     │ │  (19)    │ │   (14)    │ │      (7)        │  │
│  └──────────┘ └──────────┘ └───────────┘ └─────────────────┘  │
│       │            │            │              │               │
│       └────────────┴────────────┴──────────────┘               │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                     BaseAITool                          │  │
│  │  • execute() with error handling                        │  │
│  │  • validate() input validation                          │  │
│  │  • retry mechanism                                      │  │
│  │  • timeout handling                                     │  │
│  │  • metrics collection                                   │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Other Domains (IPC)                          │
│  ┌──────────────┐ ┌─────────────────┐ ┌──────────────────┐     │
│  │ ai-services  │ │media-management │ │  video-editing   │     │
│  └──────────────┘ └─────────────────┘ └──────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## Tool Domains Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI Tools (66 total)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CORE (24)                   ANALYSIS (19)                      │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │ Timeline (15)       │    │ Video Analysis (5)  │            │
│  │ • CreateProject     │    │ Audio Analysis (4)  │            │
│  │ • ManageClips       │    │ Color/Style (3)     │            │
│  │ • CreateSections    │    │ Multimodal (2)      │            │
│  │ • DetectScenes      │    │ Person ID (3)       │            │
│  │ • ...               │    │ Whisper (2)         │            │
│  ├─────────────────────┤    └─────────────────────┘            │
│  │ Resources (7)       │                                        │
│  │ Browser (5)         │    AUTOMATION (14)                     │
│  │ Player (4)          │    ┌─────────────────────┐            │
│  └─────────────────────┘    │ Batch Processing (4)│            │
│                             │ Workflow (3)        │            │
│  INTEGRATION (7)            │ Montage Planning (3)│            │
│  ┌─────────────────────┐    │ Subtitles (2)       │            │
│  │ Export (5)          │    │ Templates (2)       │            │
│  │ Format Convert (2)  │    └─────────────────────┘            │
│  └─────────────────────┘                                        │
│                                                                  │
│  MCP Tools (18) - Cross-domain                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Execution Flow

### Single Tool Execution

```
executeTool("CreateProjectTool", input)
    │
    ▼
AIToolsDomainUtils.executeTool()
    │
    ▼
AIToolsContainer.getExecutionEngine()
    │
    ▼
ExecutionEngine.execute()
    │
    ├──► Lookup tool in ToolRegistry
    │
    ├──► Validate input
    │
    ├──► Check concurrency limits
    │
    ├──► Emit "execution:started" event
    │
    ▼
BaseAITool.execute()
    │
    ├──► Start timeout timer
    │
    ├──► executeInternal()
    │        │
    │        ▼
    │    Tool-specific logic
    │        │
    │        ├──► Call other domains if needed
    │        │    (ai-services, media-management, etc.)
    │        │
    │        └──► Return result
    │
    ├──► Handle errors (retry if configured)
    │
    └──► Collect metrics
    │
    ▼
ExecutionEngine
    │
    ├──► Emit "execution:completed" or "execution:failed"
    │
    └──► Return AIToolResult
```

### Batch Execution

```
executeBatch([task1, task2, task3])
    │
    ▼
ExecutionEngine.executeBatch()
    │
    ├──► Validate all inputs
    │
    ├──► Create execution queue
    │
    ▼
┌──────────────────────────────────────┐
│         Concurrency Control          │
│  (maxConcurrentExecutions = 10)      │
├──────────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐ ... ┌────┐   │
│  │ T1 │ │ T2 │ │ T3 │     │ T10│   │
│  └────┘ └────┘ └────┘     └────┘   │
│     │      │      │          │      │
│     ▼      ▼      ▼          ▼      │
│  [Execute in parallel up to limit]  │
└──────────────────────────────────────┘
    │
    ▼
Aggregate Results
    │
    ▼
BatchExecutionResult
```

### Pipeline Execution

```
executePipeline([analyze, process, export])
    │
    ▼
ExecutionEngine.executePipeline()
    │
    ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Analyze   │───►│   Process   │───►│   Export    │
│  (input)    │    │(prev.output)│    │(prev.output)│
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                              ▼
                                     PipelineExecutionResult
```

## Key Design Decisions

### 1. Singleton Services Pattern

**Решение:** ToolRegistry и ExecutionEngine как singletons.

**Причина:**
- Глобальный доступ к инструментам из любого места
- Предотвращение дублирования регистрации
- Централизованное управление состоянием
- Единый источник правды для метрик

### 2. BaseAITool Abstract Class

**Решение:** Все инструменты наследуют BaseAITool.

**Причина:**
- Унифицированная обработка ошибок
- Встроенный retry механизм
- Автоматический сбор метрик
- Консистентный API для всех инструментов

### 3. DI Container

**Решение:** Использовать простой DI контейнер вместо сложных фреймворков.

**Причина:**
- Минимальный overhead
- Легкое тестирование (setupForTesting)
- Гибкая конфигурация (dev/prod/test)
- Простое добавление новых сервисов

### 4. Domain-based Organization

**Решение:** Группировать инструменты по функциональным доменам.

**Причина:**
- Логическая организация (core, analysis, automation, integration)
- Tree-shaking friendly - импорт только нужных доменов
- Изолированное тестирование
- Масштабируемость

### 5. Event-driven Execution

**Решение:** ExecutionEngine публикует события о выполнении.

**Причина:**
- Логирование без coupling
- Мониторинг производительности
- Интеграция с UI (progress indicators)
- Отладка и трейсинг

## Dependencies

### Internal Dependencies

```
ai-tools
    │
    ├── @/domains/ai-services
    │   └── AI сервисы для анализа и обработки
    │
    ├── @/domains/media-management
    │   └── Управление медиафайлами
    │
    └── @/lib/tauri-logger
        └── Логирование операций
```

### External Dependencies

- No external dependencies (pure TypeScript)

## Testing Strategy

### Unit Tests

```bash
bun run test src/domains/ai-tools/__tests__/
```

**Coverage:**
- `container.test.ts` - DI Container, lifecycle, configuration
- `base-ai-tool.test.ts` - Base class, validation, retry
- `tool-registry.test.ts` - Registration, search, grouping
- `execution-engine.test.ts` - Execution, batch, pipeline
- `search-files.test.ts` - Browser tool specifics

### Testing Utilities

```typescript
// Setup for testing (minimal config)
const container = await AIToolsContainerUtils.setupForTesting()

// Reset between tests
container.reset()
```

## Performance Considerations

### Optimizations

1. **Concurrency Control** - Default max 10 concurrent executions
2. **Lazy Registration** - Tools registered on demand
3. **Result Caching** - Optional caching with TTL
4. **Minimal Dependencies** - No heavy external libs

### Configuration by Environment

| Setting | Development | Production | Testing |
|---------|-------------|------------|---------|
| `enableLogging` | true | false | false |
| `enableMetrics` | true | true | false |
| `defaultTimeout` | 60000 | 30000 | 5000 |
| `maxConcurrent` | 5 | 20 | 2 |
| `cacheResults` | false | true | false |

### Metrics Tracked

- Tool execution count
- Average execution time per tool
- Success/failure rates
- Active executions count
- Queue size for batch operations

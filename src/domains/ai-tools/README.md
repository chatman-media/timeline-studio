# AI Tools Domain

Унифицированная система AI инструментов для Timeline Studio. Содержит 66 инструментов для работы с таймлайном, анализа медиа и автоматизации.

## Quick Start

```typescript
import {
  AIToolsDomainUtils,
  getAIToolsContainer,
  allAITools
} from "@/domains/ai-tools"

// Инициализация домена
const container = await AIToolsDomainUtils.initialize()

// Выполнение инструмента
const result = await AIToolsDomainUtils.executeTool("CreateProjectTool", {
  projectSettings: { name: "New Project", fps: 30 }
})

// Поиск инструментов
const timelineTools = AIToolsDomainUtils.searchTools("timeline")
```

## Public API

### Core Exports
| Export | Purpose |
|--------|---------|
| `AIToolsDomainUtils` | Facade API для работы с доменом |
| `getAIToolsContainer()` | Получить DI контейнер |
| `allAITools` | Массив всех инструментов |

### Base Classes
| Class | Purpose |
|-------|---------|
| `BaseAITool` | Базовый класс для инструментов |
| `ToolRegistry` | Реестр инструментов (singleton) |
| `ExecutionEngine` | Движок выполнения (singleton) |

### Tool Collections
| Collection | Count | Purpose |
|------------|-------|---------|
| `coreTools` | 24 | Timeline, Resources, Browser, Player |
| `analysisTools` | 19 | Video/Audio анализ, Whisper |
| `automationTools` | 14 | Batch, Workflow, Subtitles |
| `integrationTools` | 7 | Export, Format Conversion |
| `mcpTools` | 18 | Model Context Protocol |

## Key Features

- **66 AI инструментов** - Полный набор для видеоредактирования
- **DI Container** - Управление зависимостями и конфигурацией
- **Batch Execution** - Параллельное выполнение с concurrency control
- **Pipeline Execution** - Последовательное выполнение с передачей результатов
- **Event System** - События выполнения для мониторинга
- **Retry Mechanism** - Автоматические повторы при ошибках
- **Metrics Collection** - Сбор метрик производительности

## Tool Domains

| Domain | Tools | Categories |
|--------|-------|------------|
| Core | 24 | Timeline (15), Resources (7), Browser (5), Player (4) |
| Analysis | 19 | Video (5), Audio (4), Color (3), Multimodal (2), Person ID (3), Whisper (2) |
| Automation | 14 | Batch (4), Workflow (3), Montage (3), Subtitles (2), Templates (2) |
| Integration | 7 | Export (5), Format (2) |

## Dependencies

**Internal:**
- `@/domains/ai-services` - AI сервисы для анализа
- `@/domains/media-management` - Управление медиафайлами
- `@/lib/tauri-logger` - Логирование

**External:**
- Нет внешних зависимостей (pure TypeScript)

## Testing

```bash
# Unit tests
bun run test src/domains/ai-tools/__tests__/

# С coverage
bun run test:coverage src/domains/ai-tools/
```

## Documentation

| Document | Content |
|----------|---------|
| [API Reference](./docs/API.md) | Полное описание всех экспортов |
| [Architecture](./docs/ARCHITECTURE.md) | Архитектура и диаграммы |
| [Changelog](./docs/CHANGELOG.md) | История изменений |

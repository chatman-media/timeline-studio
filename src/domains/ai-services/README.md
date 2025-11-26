# AI Services Domain

Централизованные AI сервисы для анализа и обработки медиа контента в Timeline Studio.

## Quick Start

```typescript
import {
  useUnifiedAnalysis,
  useAnalysisStorage,
  unifiedOrchestrator
} from "@/domains/ai-services"

function MyComponent() {
  // Unified анализ медиа
  const { startAnalysis, analysisResult, isAnalyzing } = useUnifiedAnalysis()

  // Сохранение результатов
  const { saveAnalysis, loadAnalysis } = useAnalysisStorage()

  // Или напрямую через orchestrator
  const result = await unifiedOrchestrator.analyzeComprehensive(videoPath)
}
```

## Public API

### Hooks
| Hook | Purpose |
|------|---------|
| `useUnifiedAnalysis()` | Comprehensive анализ через AI Director |
| `useAnalysisStorage()` | Сохранение/загрузка результатов анализа |
| `useAIDirectorEvents()` | Подписка на события AI Director |
| `useAIDirectorAnalysisProgress()` | Отслеживание прогресса анализа |

### Services
| Service | Purpose |
|---------|---------|
| `unifiedOrchestrator` | Координатор AI операций |
| `aiDirectorService` | AI Director backend integration |
| `analysisStorageService` | Персистентное хранение |
| `aiEventBridge` | Tauri ↔ TypeScript event sync |
| `createMediaAnalysisFactory()` | Фабрика сервисов анализа |

### State Machines
| Machine | Purpose |
|---------|---------|
| `chatMachine` | AI чат (отправка/получение сообщений) |
| `aiIntelligenceMachine` | AI интеллект (анализ + адаптации) |
| `montagePlannerMachine` | Планирование монтажа |

## Key Features

- **Comprehensive Analysis** - Полный анализ видео через AI Director
- **Montage Planning** - Автоматическая генерация планов монтажа
- **Multi-stage Pipeline** - AI Director → Montage → Integration
- **Rate Limiting** - Контроль конкурентности AI запросов
- **Event Bridge** - Real-time события от Rust backend
- **Persistent Storage** - Сохранение результатов анализа

## AI Capabilities

| Capability | Backend | Status |
|------------|---------|--------|
| Scene Detection | FFmpeg | Ready |
| Object Detection | YOLO | Ready |
| Face Detection | RetinaFace | Ready |
| Face Recognition | FaceNet | Ready |
| Speech Transcription | Whisper | Ready |
| Quality Analysis | FFmpeg | Ready |
| Emotion Analysis | AI Director | Ready |
| Composition Analysis | AI Director | Ready |

## Dependencies

**Internal:**
- `@/domains/shared/events` - Domain Event Bus
- `@/lib/tauri-logger` - Structured logging
- `@/types/montage-planner-rust` - Rust types

**External:**
- `xstate` v5 - State machines
- `@xstate/react` - React bindings
- `@tauri-apps/api` - Tauri IPC
- `p-limit` - Concurrency control

## Testing

```bash
# Unit tests
bun run test src/domains/ai-services/__tests__/

# E2E tests (Tauri)
bun run test:e2e:tauri
```

## Documentation

| Document | Content |
|----------|---------|
| [API Reference](./docs/API.md) | Полное описание всех экспортов |
| [Architecture](./docs/ARCHITECTURE.md) | Архитектура, диаграммы, design decisions |
| [Changelog](./docs/CHANGELOG.md) | История изменений |

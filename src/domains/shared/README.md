# Shared Domain

Общие утилиты, типы и шина событий для всех доменов Timeline Studio.

## Quick Start

```typescript
import {
  eventBus,
  useDomainEvents,
  DOMAIN_EVENTS,
  generateId,
  formatDuration
} from "@/domains/shared"

// Публикация события
await eventBus.publish("clip.added", "video-editing", { clipId: "123" })

// React hook для событий
function MyComponent() {
  const { publish, on } = useDomainEvents({ domain: "video-editing" })

  on("clip.added", (event) => {
    console.log("Clip added:", event.payload)
  })

  const handleAdd = async () => {
    await publish("clip.added", { clipId: generateId() })
  }
}
```

## Public API

### Events
| Export | Purpose |
|--------|---------|
| `eventBus` | Singleton event bus instance |
| `DomainEventBus` | Event bus class |
| `DOMAIN_EVENTS` | Pre-defined event constants |

### Hooks
| Hook | Purpose |
|------|---------|
| `useDomainEvents()` | React hook for domain events |

### Types
| Export | Purpose |
|--------|---------|
| `DomainEvent` | Event structure type |
| `DomainName` | Domain identifier type |
| `IMediaAnalysisContract` | Media analysis interface |
| `IExportContract` | Export service interface |
| `IAIServiceContract` | AI service interface |
| `INotificationContract` | Notification interface |

### Utils
| Category | Functions |
|----------|-----------|
| Config | `getConfig`, `setConfig`, `mergeConfigs` |
| File | `getFileExtension`, `getFileName`, `getMediaType`, `isVideoFile`, `isAudioFile`, `isImageFile` |
| ID | `generateId`, `generateShortId`, `isValidId` |
| Time | `formatDuration`, `formatTimestamp`, `parseTimestamp`, `msToFrames`, `framesToMs` |
| Validation | `validateFilePath`, `validateMediaType`, `isValidUrl` |

## Key Features

- **Event Bus** - Centralized pub/sub for inter-domain communication
- **Service Contracts** - Interfaces for loose coupling between domains
- **Utility Functions** - Common helpers for all domains
- **Type Definitions** - Shared TypeScript types

## Event Domains

| Domain | Events |
|--------|--------|
| `AI_SERVICES` | analysis.started, analysis.completed, model.loaded |
| `MEDIA` | file.imported, file.deleted, metadata.updated |
| `VIDEO` | clip.added, clip.removed, timeline.updated |
| `PROJECT` | project.created, project.saved, project.loaded |
| `SYSTEM` | update.available, modal.opened, notification.shown |

## Dependencies

**Internal:**
- None (foundation layer)

**External:**
- `nanoid` - ID generation
- `@/lib/tauri-logger` - Logging

**Used by:**
- All other domains

## Testing

```bash
bun run test src/domains/shared/__tests__/
```

## Documentation

| Document | Content |
|----------|---------|
| [API Reference](./docs/API.md) | Full API description |
| [Architecture](./docs/ARCHITECTURE.md) | Architecture and diagrams |
| [Changelog](./docs/CHANGELOG.md) | History of changes |

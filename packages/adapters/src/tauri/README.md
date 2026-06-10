# Tauri Adapters

Tauri реализации сервисов для десктопного приложения Timeline Studio.

## Назначение

Эти адаптеры обеспечивают интеграцию с Tauri runtime:
- Вызовы Rust бэкенда через `@tauri-apps/api`
- Доступ к нативным возможностям ОС
- Высокопроизводительная обработка медиа
- GPU-ускоренный рендеринг

## Сервисы

| Сервис | Файл | Описание |
|--------|------|----------|
| `TauriStorageService` | `storage.ts` | Хранилище через Tauri Store plugin |
| `TauriEventService` | `event.ts` | События через Tauri event system |
| `TauriPlatformService` | `platform.ts` | Нативные диалоги, файловая система, clipboard |
| `TauriMediaService` | `media.ts` | Обработка медиа через Rust FFmpeg bindings |
| `TauriVideoService` | `video.ts` | GPU-рендеринг через Rust бэкенд |
| `TauriBackendService` | `backend.ts` | Асинхронное взаимодействие с Rust |
| `TauriBackendSyncService` | `backend-sync.ts` | Синхронизация состояния с Rust |
| `TauriAIService` | `ai.ts` | AI через ONNX Runtime (Rust) |

## Использование

### Инициализация в Tauri приложении

```typescript
import { initTauriApp } from "@/adapters/tauri"

// Обычно вызывается в корне приложения
await initTauriApp()

// Сервисы доступны через контейнер
import { getMedia, getVideo, getAI } from "@/core/container"

const metadata = await getMedia().getMetadata("/path/to/video.mp4")
```

### Использование отдельных сервисов

```typescript
import { TauriMediaService, TauriAIService } from "@/adapters/tauri"

const media = new TauriMediaService()
const ai = new TauriAIService()

const metadata = await media.getMetadata("/path/to/video.mp4")
```

## Rust бэкенд

Tauri адаптеры взаимодействуют с Rust через команды:

```rust
// src-tauri/src/commands/media.rs
#[tauri::command]
async fn get_media_metadata(path: String) -> Result<MediaMetadata, String> {
    // FFmpeg bindings
}

#[tauri::command]
async fn render_project(schema: ProjectSchema, output: String) -> Result<String, String> {
    // GPU-ускоренный рендеринг
}
```

## Особенности

### TauriBackendService vs TauriBackendSyncService

- **TauriBackendService** - асинхронные команды к Rust бэкенду
- **TauriBackendSyncService** - синхронизация состояния проекта между фронтендом и Rust

### GPU возможности

```typescript
const video = new TauriVideoService()

// Проверка GPU capabilities
const gpu = await video.getGpuCapabilities()
console.log(gpu.hasNvenc)    // NVIDIA NVENC
console.log(gpu.hasQsv)      // Intel Quick Sync
console.log(gpu.hasAmf)      // AMD AMF
```

### Нативные диалоги

```typescript
const platform = new TauriPlatformService()

// Открытие файлов
const files = await platform.showOpenDialog({
  multiple: true,
  filters: [{ name: "Video", extensions: ["mp4", "mov", "avi"] }],
})

// Сохранение
const path = await platform.showSaveDialog({
  defaultPath: "project.json",
})
```

## Отличия от Node.js адаптеров

| Аспект | Tauri | Node.js |
|--------|-------|---------|
| FFmpeg | Rust bindings (быстрее) | CLI subprocess |
| AI/ML | ONNX Runtime (Rust) | Заглушки / OpenAI API |
| GPU | Полная поддержка | Нет |
| Диалоги | Нативные ОС | Headless / CLI |
| Хранилище | Tauri Store | JSON файл |

## Типы

Типы генерируются автоматически из Rust:

```typescript
// src/types/generated/tauri-bindings.ts
export interface MediaMetadata { ... }
export interface RenderJob { ... }
export interface GpuCapabilities { ... }
```

## Тестирование

```bash
# Unit тесты (моки Tauri API)
bun run test src/adapters/tauri

# E2E тесты (реальное Tauri приложение)
bun run test:e2e:tauri:dev
```

## См. также

- [Node.js адаптеры](../node/README.md)
- [Rust бэкенд](../../../src-tauri/README.md)
- [Core Ports](../../core/ports/README.md)
- [Tauri E2E тесты](../../../e2e/tauri/README.md)

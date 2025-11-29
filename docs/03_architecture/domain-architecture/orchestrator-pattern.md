# Паттерн Orchestrator

[← Назад](README.md)

## Обзор

**Orchestrator Pattern** - архитектурный паттерн для координации сложных операций в домене. Каждый домен имеет один Orchestrator, который:

- Координирует работу сервисов домена
- Управляет состоянием и транзакциями
- Обрабатывает ошибки централизованно
- Интегрируется с системой уведомлений
- Реализован как singleton

```
┌─────────────────────────────────────────────────────────────┐
│                       React UI                               │
│            useMediaManagement() hook                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              MediaManagementOrchestrator                     │
│  - importMedia()                                             │
│  - getMetadata()                                             │
│  - generateProxies()                                         │
│                          │                                   │
│    ┌─────────────────────┼─────────────────────┐            │
│    │                     │                     │            │
│    ▼                     ▼                     ▼            │
│ FileOperations    MetadataService     ImportService         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Core Layer                                │
│              IMediaService (port)                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Adapter                                   │
│      TauriMediaService / NodeMediaService                    │
└─────────────────────────────────────────────────────────────┘
```

## Структура Orchestrator

```typescript
// src/domains/media-management/services/orchestrator/media-management-orchestrator.ts

import { getMedia } from '@/core/container'
import { getBackendSync } from '@/domains/system-integration'
import type { Logger } from '@/shared/utils/logger'

export class MediaManagementOrchestrator {
  // Singleton instance
  private static instance: MediaManagementOrchestrator | null = null

  // Зависимости
  private backendSync = getBackendSync()
  private media = getMedia()
  private logger: Logger

  // Private constructor для singleton
  private constructor() {
    this.logger = {
      info: (msg: string) => console.log(`[MediaManagement] ${msg}`),
      error: (msg: string) => console.error(`[MediaManagement] ${msg}`),
      warn: (msg: string) => console.warn(`[MediaManagement] ${msg}`),
    }
  }

  // Singleton getter
  static getInstance(): MediaManagementOrchestrator {
    if (!this.instance) {
      this.instance = new MediaManagementOrchestrator()
    }
    return this.instance
  }

  // Публичные методы домена
  async importMedia(files: File[], options?: ImportOptions): Promise<ImportResult> {
    this.logger.info(`Importing ${files.length} files`)

    try {
      const results = await Promise.all(
        files.map(file => this.processFile(file, options))
      )

      this.logger.info(`Successfully imported ${results.length} files`)
      return { success: true, imported: results }

    } catch (error) {
      this.logger.error(`Import failed: ${error}`)
      throw error
    }
  }

  async getMetadata(path: string): Promise<MediaMetadata> {
    return await this.media.getMetadata(path)
  }

  // Приватные методы
  private async processFile(file: File, options?: ImportOptions): Promise<MediaFile> {
    const metadata = await this.media.getMetadata(file.path)

    if (options?.generateProxies) {
      await this.generateProxy(file.path)
    }

    return { file, metadata }
  }
}

// Export singleton getter
export const getMediaManagementOrchestrator = () =>
  MediaManagementOrchestrator.getInstance()
```

## Использование

### В React компонентах (через hook)

```typescript
import { useMediaManagement } from '@/domains/media-management'

function MediaImporter() {
  const { importMedia, isLoading, error } = useMediaManagement()

  const handleDrop = async (files: File[]) => {
    await importMedia(files, { generateProxies: true })
  }

  return (
    <DropZone onDrop={handleDrop} disabled={isLoading}>
      {isLoading ? 'Importing...' : 'Drop files here'}
    </DropZone>
  )
}
```

### Прямой доступ (в non-React коде)

```typescript
import { getMediaManagementOrchestrator } from '@/domains/media-management'

// В CLI, скриптах, воркерах
async function processVideos(paths: string[]) {
  const orchestrator = getMediaManagementOrchestrator()

  for (const path of paths) {
    const metadata = await orchestrator.getMetadata(path)
    console.log(`${path}: ${metadata.duration}s`)
  }
}
```

## React Provider

Провайдер оборачивает orchestrator для удобства использования в React:

```typescript
// src/domains/media-management/providers/media-management-provider.tsx

import { createContext, useContext, useMemo, useState } from 'react'
import { getMediaManagementOrchestrator } from '../services/orchestrator'

interface MediaManagementContextValue {
  importMedia: (files: File[], options?: ImportOptions) => Promise<ImportResult>
  getMetadata: (path: string) => Promise<MediaMetadata>
  isLoading: boolean
  error: Error | null
}

const MediaManagementContext = createContext<MediaManagementContextValue | null>(null)

export function MediaManagementProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const orchestrator = getMediaManagementOrchestrator()

  const value = useMemo(() => ({
    importMedia: async (files: File[], options?: ImportOptions) => {
      setIsLoading(true)
      setError(null)
      try {
        return await orchestrator.importMedia(files, options)
      } catch (e) {
        setError(e as Error)
        throw e
      } finally {
        setIsLoading(false)
      }
    },
    getMetadata: orchestrator.getMetadata.bind(orchestrator),
    isLoading,
    error,
  }), [orchestrator, isLoading, error])

  return (
    <MediaManagementContext.Provider value={value}>
      {children}
    </MediaManagementContext.Provider>
  )
}

export function useMediaManagement() {
  const context = useContext(MediaManagementContext)
  if (!context) {
    throw new Error('useMediaManagement must be used within MediaManagementProvider')
  }
  return context
}
```

## BackendSync Integration

BackendSync обеспечивает синхронизацию с Tauri backend:

```typescript
import { getBackendSync } from '@/domains/system-integration'

class ProjectManagementOrchestrator {
  private backendSync = getBackendSync()

  async saveProject(project: Project): Promise<void> {
    // BackendSync автоматически:
    // - Обрабатывает ошибки Tauri
    // - Показывает уведомления при ошибках
    // - Логирует операции
    await this.backendSync.invoke('save_project', { project })
  }
}
```

## Интеграция с уведомлениями

Orchestrator использует централизованную систему уведомлений:

```typescript
import { useNotifications } from '@/domains/system-integration'

// В hook
function useMediaManagement() {
  const orchestrator = getMediaManagementOrchestrator()
  const { showSuccess, showError } = useNotifications()

  const importMedia = async (files: File[]) => {
    try {
      const result = await orchestrator.importMedia(files)
      showSuccess({
        title: 'Импорт завершён',
        message: `Импортировано ${result.imported.length} файлов`
      })
      return result
    } catch (error) {
      showError({
        title: 'Ошибка импорта',
        message: error.message
      })
      throw error
    }
  }

  return { importMedia }
}
```

## Тестирование

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MediaManagementOrchestrator } from '../orchestrator'

// Мокаем зависимости
vi.mock('@/core/container', () => ({
  getMedia: vi.fn(() => ({
    getMetadata: vi.fn().mockResolvedValue({
      type: 'Video',
      duration: 120,
      width: 1920,
      height: 1080
    })
  }))
}))

vi.mock('@/domains/system-integration', () => ({
  getBackendSync: vi.fn(() => ({
    invoke: vi.fn()
  }))
}))

describe('MediaManagementOrchestrator', () => {
  let orchestrator: MediaManagementOrchestrator

  beforeEach(() => {
    // Сбрасываем singleton для изоляции тестов
    (MediaManagementOrchestrator as any).instance = null
    orchestrator = MediaManagementOrchestrator.getInstance()
  })

  it('should be singleton', () => {
    const instance1 = MediaManagementOrchestrator.getInstance()
    const instance2 = MediaManagementOrchestrator.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('should import media files', async () => {
    const files = [
      { path: '/video1.mp4' },
      { path: '/video2.mp4' }
    ] as File[]

    const result = await orchestrator.importMedia(files)

    expect(result.success).toBe(true)
    expect(result.imported).toHaveLength(2)
  })

  it('should get metadata', async () => {
    const metadata = await orchestrator.getMetadata('/video.mp4')

    expect(metadata.type).toBe('Video')
    expect(metadata.duration).toBe(120)
  })
})
```

## Best Practices

### 1. Singleton Pattern
Всегда используйте getter, не создавайте экземпляры напрямую:

```typescript
// Правильно
const orchestrator = getMediaManagementOrchestrator()

// Неправильно
const orchestrator = new MediaManagementOrchestrator()
```

### 2. Минимум логики в Provider
Provider только оборачивает orchestrator, вся логика в orchestrator:

```typescript
// Правильно - логика в orchestrator
class MyOrchestrator {
  async complexOperation() {
    // Вся бизнес-логика здесь
  }
}

// Provider просто вызывает
const value = {
  complexOperation: orchestrator.complexOperation.bind(orchestrator)
}
```

### 3. Логирование
Используйте встроенный logger:

```typescript
this.logger.info('Starting operation')
this.logger.warn('Something unusual')
this.logger.error('Operation failed')
```

### 4. Обработка ошибок
Ловите ошибки на уровне orchestrator, пробрасывайте наверх:

```typescript
async myOperation() {
  try {
    return await this.doSomething()
  } catch (error) {
    this.logger.error(`Failed: ${error}`)
    throw error  // Пробрасываем для обработки в UI
  }
}
```

### 5. Типизация
Все методы должны быть типизированы:

```typescript
async importMedia(
  files: File[],
  options?: ImportOptions
): Promise<ImportResult> {
  // ...
}
```

## Существующие Orchestrator'ы

| Orchestrator | Домен | Описание |
|-------------|-------|----------|
| `MediaManagementOrchestrator` | media-management | Импорт и управление медиа |
| `ProjectManagementOrchestrator` | project-management | Проекты и настройки |
| `SystemIntegrationOrchestrator` | system-integration | Системные операции |
| `UnifiedOrchestrator` | ai-services | Координация AI сервисов |

---

*Создано: 2025-07-31*
*Обновлено: 2025-11-29*

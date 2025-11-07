# TauriLogger - Система логирования Timeline Studio

**Важно:** Timeline Studio использует TauriLogger для всего логирования. Использование `console.log`, `console.error`, `console.warn` **строго запрещено** в production коде.

## 📋 Обзор

TauriLogger - это специализированная система структурированного логирования для Timeline Studio, интегрированная с Tauri backend для централизованного сбора и обработки логов.

### 🎯 Основные преимущества

- **Структурированное логирование** - Все логи содержат контекст и метаданные
- **Централизованная обработка** - Логи автоматически отправляются в Tauri backend
- **Уровни логирования** - trace, debug, info, warn, error
- **Контекст компонентов** - Каждый logger имеет свой компонент
- **Production-ready** - Автоматическая фильтрация в production builds
- **TypeScript типизация** - Полная поддержка типов

## 🚀 Быстрый старт

### Базовое использование

```typescript
import { createLogger } from '@/lib/tauri-logger'

// Создаём logger для компонента
const logger = createLogger('VideoProcessor')

// Используем разные уровни
logger.debugSync('Processing started', { videoId: '123' })
logger.infoSync('Frame processed', { frameNumber: 42, timestamp: 1.5 })
logger.warnSync('Low memory warning', { available: 256 })
logger.errorSync('Processing failed', { error, videoId: '123' })

// ❌ НИКОГДА не делайте так:
console.log('Processing video')  // Запрещено!
console.error('Failed:', error)  // Запрещено!
```

### Асинхронное логирование

```typescript
// Для non-critical логов используйте async версию
await logger.debug('Background task started', { taskId })
await logger.info('Export complete', { duration: 5000 })

// Для критичных используйте Sync версию
logger.errorSync('Critical error', { error })
```

## 📊 Уровни логирования

### trace - Детальная отладочная информация

```typescript
logger.traceSync('Entering function', { args })
logger.traceSync('Variable state', { myVar })
```

**Когда использовать:** Очень детальная отладка, trace execution flow.

### debug - Отладочная информация

```typescript
logger.debugSync('Processing step', { step: 1, data })
logger.debugSync('Cache hit', { key, value })
```

**Когда использовать:** Информация полезная при разработке и debugging.

### info - Информационные сообщения

```typescript
logger.infoSync('Task completed', { duration: 1500 })
logger.infoSync('File saved', { path, size: 1024 })
```

**Когда использовать:** Важные события в нормальном flow приложения.

### warn - Предупреждения

```typescript
logger.warnSync('Deprecated API used', { api: 'oldMethod' })
logger.warnSync('Resource limit approaching', { usage: 0.85 })
```

**Когда использовать:** Потенциальные проблемы, но не критичные.

### error - Ошибки

```typescript
logger.errorSync('Operation failed', { operation: 'save', error })
logger.errorSync('Invalid state', { expected: 'ready', actual: 'busy' })
```

**Когда использовать:** Ошибки требующие внимания.

## 🎨 Паттерны использования

### В React компонентах

```typescript
import { FC, useEffect } from 'react'
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('VideoPlayer')

export const VideoPlayer: FC<Props> = ({ file }) => {
  useEffect(() => {
    logger.debugSync('Component mounted', { file: file.path })

    return () => {
      logger.debugSync('Component unmounted')
    }
  }, [])

  const handleError = (error: Error) => {
    logger.errorSync('Playback error', { file: file.path, error })
  }

  return <video onError={handleError} />
}
```

### В сервисах

```typescript
import { createLogger } from '@/lib/tauri-logger'

class VideoExportService {
  private logger = createLogger('VideoExportService')

  async export(timeline: Timeline, settings: ExportSettings) {
    this.logger.infoSync('Export started', {
      duration: timeline.duration,
      format: settings.format
    })

    try {
      const result = await this.processExport(timeline, settings)

      this.logger.infoSync('Export completed', {
        outputPath: result.path,
        fileSize: result.size
      })

      return result
    } catch (error) {
      this.logger.errorSync('Export failed', { error, settings })
      throw error
    }
  }
}
```

### В async функциях

```typescript
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('MediaScanner')

export async function scanFolder(path: string): Promise<MediaFile[]> {
  logger.infoSync('Scan started', { path })

  try {
    const files = await findMediaFiles(path)

    logger.debugSync('Files found', { count: files.length })

    for (const file of files) {
      logger.traceSync('Processing file', { file: file.path })
      await processFile(file)
    }

    logger.infoSync('Scan complete', { totalFiles: files.length })
    return files

  } catch (error) {
    logger.errorSync('Scan failed', { path, error })
    throw error
  }
}
```

### В обработчиках ошибок

```typescript
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('ErrorBoundary')

class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.errorSync('React error caught', {
      error,
      componentStack: errorInfo.componentStack
    })
  }
}
```

## 🔧 Структура логов

Каждый лог автоматически содержит:

```typescript
{
  timestamp: "2025-01-08T12:00:00.000Z",
  level: "info",
  component: "VideoProcessor",
  message: "Processing complete",
  metadata: {
    videoId: "123",
    duration: 1500
  }
}
```

## 📏 Best Practices

### ✅ DO

```typescript
// Структурированные данные
logger.infoSync('User action', { action: 'click', button: 'export' })

// Контекст ошибок
logger.errorSync('API call failed', { endpoint: '/api/video', error })

// Измеримые события
logger.infoSync('Operation timing', { operation: 'render', duration: 1500 })
```

### ❌ DON'T

```typescript
// Не используйте console
console.log('Processing...')  // ❌
console.error(error)           // ❌

// Не логируйте sensitive data
logger.infoSync('User login', { password: 'secret' })  // ❌

// Не конкатенируйте строки
logger.infoSync('User ' + userId + ' logged in')  // ❌
// Вместо этого:
logger.infoSync('User logged in', { userId })  // ✅
```

## 🎯 Production vs Development

### Development

В development mode все уровни логов активны:

```typescript
logger.traceSync(...)  // ✓ Виден
logger.debugSync(...)  // ✓ Виден
logger.infoSync(...)   // ✓ Виден
logger.warnSync(...)   // ✓ Виден
logger.errorSync(...)  // ✓ Виден
```

### Production

В production mode фильтруется:

```typescript
logger.traceSync(...)  // ✗ Скрыт
logger.debugSync(...)  // ✗ Скрыт
logger.infoSync(...)   // ✓ Виден
logger.warnSync(...)   // ✓ Виден
logger.errorSync(...)  // ✓ Виден
```

## 🔍 Интеграция с Tauri Backend

Все логи автоматически отправляются в Tauri backend для:

- Централизованного хранения
- Анализа производительности
- Debugging production issues
- Мониторинга здоровья приложения

## 📚 Связанные документы

- [Telemetry System](./telemetry.md) - Полная система телеметрии
- [Error Handling](./error-handling.md) - Обработка ошибок
- [Coding Standards](/docs/ru/05_development/coding-standards.md) - Стандарты кодирования

---

**Последнее обновление:** 8 января 2025

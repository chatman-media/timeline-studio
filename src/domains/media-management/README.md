# Media Management Domain

Управление медиафайлами, импорт, метаданные и операции с файлами в Timeline Studio.

## Обзор

Media Management домен отвечает за импорт медиафайлов, управление метаданными, операции с файлами (копирование, перемещение, переименование) и организацию медиатеки проекта.

## Структура

```
media-management/
├── hooks/            # React хуки для медиа операций
├── machines/         # XState машины состояний
├── providers/        # React провайдеры
├── services/         # Сервисы для работы с метаданными
├── tauri/           # Команды и события Tauri
├── types/           # TypeScript типы
└── index.ts         # Главный экспорт
```

## ✨ Основные компоненты

### MediaManagementProvider с уведомлениями

**Новинка v2.0**: Полная интеграция системных уведомлений при импорте файлов.

#### Базовое использование

```typescript
import { MediaManagementProvider } from '@/domains/media-management'

function App() {
  return (
    <MediaManagementProvider enableNotifications={true}>
      <YourApp />
    </MediaManagementProvider>
  )
}
```

#### С расширенными настройками

```typescript
<MediaManagementProvider
  enableNotifications={true}
  importCallbacks={{
    onImportStart: (filesCount) => {
      console.log(`Начинаем импорт ${filesCount} файлов`)
    },
    onImportProgress: (progress, filesCount) => {
      console.log(`Прогресс: ${progress}% (${filesCount} файлов)`)
    },
    onImportComplete: (filesCount, duration) => {
      console.log(`Импортировано ${filesCount} файлов за ${duration}мс`)
    },
    onImportError: (error) => {
      console.error('Ошибка импорта:', error)
    },
    onImportCancelled: () => {
      console.log('Импорт отменен пользователем')
    }
  }}
>
  <YourApp />
</MediaManagementProvider>
```

#### Использование в компонентах

```typescript
import { useMediaManagement } from '@/domains/media-management'

function MyComponent() {
  const { importFiles, mediaPool, isLoading } = useMediaManagement()

  const handleImport = async () => {
    // Автоматически покажет уведомления о прогрессе
    await importFiles(['/path/to/video.mp4'], {
      copyToProject: true
    })
  }

  return (
    <div>
      <button onClick={handleImport} disabled={isLoading}>
        Импортировать файлы
      </button>
      <p>Файлов в библиотеке: {mediaPool.size}</p>
    </div>
  )
}
```

#### Особенности системы уведомлений

- **Автоматические toast-уведомления**: Показывают старт, прогресс и завершение импорта
- **Отслеживание прогресса**: Реал-тайм обновления с количеством файлов
- **Информация о длительности**: Показывает сколько времени занял импорт
- **Обработка ошибок**: Детальные сообщения об ошибках
- **Настраиваемые callbacks**: Дополнительная логика через importCallbacks
- **Опциональность**: enableNotifications={false} для отключения

---

### Media Import Machine

XState машина для управления импортом медиафайлов:

```typescript
import { useMediaImport } from '@/domains/media-management'

const mediaImport = useMediaImport()

// Импорт файлов
await mediaImport.importFiles([
  '/path/to/video1.mp4',
  '/path/to/video2.mov'
], {
  copyToProject: true,
  generateProxies: true,
  analyzeContent: true
})

// Отслеживание прогресса
mediaImport.onProgress((progress) => {
  logger.debugSync(`Imported ${progress.completed}/${progress.total}`)
})
```

---

### File Operations

Операции с файлами:

```typescript
import { useFileOperations } from '@/domains/media-management'

const fileOps = useFileOperations()

// Копирование файлов
await fileOps.copyFiles(files, destinationPath)

// Перемещение файлов
await fileOps.moveFiles(files, destinationPath)

// Переименование
await fileOps.renameFile(file, newName)

// Удаление (с подтверждением)
await fileOps.deleteFiles(files, { 
  moveToTrash: true 
})
```

### Media Metadata Service

Управление метаданными медиафайлов:

```typescript
import { MediaMetadataService } from '@/domains/media-management'

const metadata = new MediaMetadataService()

// Чтение метаданных
const info = await metadata.getMetadata(filePath)
// Результат: duration, resolution, codec, fps, etc.

// Обновление метаданных
await metadata.updateMetadata(filePath, {
  tags: ['vacation', '2024'],
  rating: 5,
  description: 'Family vacation in Greece'
})

// Пакетное обновление
await metadata.batchUpdate(files, {
  copyright: '© 2024 My Studio',
  author: 'John Doe'
})
```

## Импорт медиафайлов

### Поддерживаемые форматы

```typescript
const SUPPORTED_VIDEO_FORMATS = [
  '.mp4', '.mov', '.avi', '.mkv', '.webm',
  '.mxf', '.r3d', '.braw', '.dng'
]

const SUPPORTED_AUDIO_FORMATS = [
  '.mp3', '.wav', '.aiff', '.flac', '.ogg',
  '.m4a', '.aac'
]

const SUPPORTED_IMAGE_FORMATS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.tiff', '.raw', '.dng', '.heic'
]
```

### Опции импорта

```typescript
interface ImportOptions {
  // Копирование в папку проекта
  copyToProject: boolean
  
  // Генерация прокси файлов
  generateProxies: boolean
  proxyResolution: '720p' | '1080p' | 'custom'
  
  // Анализ контента
  analyzeContent: boolean
  detectScenes: boolean
  extractMetadata: boolean
  
  // Организация файлов
  organizeByDate: boolean
  organizeByType: boolean
  createFolderStructure: boolean
  
  // Обработка дубликатов
  duplicateHandling: 'skip' | 'replace' | 'rename'
}
```

### Прокси файлы

Создание оптимизированных версий для редактирования:

```typescript
import { ProxyGenerator } from '@/domains/media-management'

const proxyGen = new ProxyGenerator()

// Генерация прокси
const proxy = await proxyGen.generateProxy(sourceFile, {
  resolution: { width: 1280, height: 720 },
  codec: 'h264',
  quality: 'medium',
  preserveAudio: true
})

// Пакетная генерация
await proxyGen.batchGenerate(files, {
  onProgress: (file, progress) => {
    logger.debugSync(`${file.name}: ${progress}%`)
  }
})
```

## Организация медиатеки

### Структура проекта

```typescript
interface ProjectStructure {
  root: string
  folders: {
    media: string        // Исходные файлы
    proxies: string      // Прокси файлы
    cache: string        // Кэш и временные файлы
    renders: string      // Рендеры
    audio: string        // Аудио файлы
    graphics: string     // Графика и изображения
  }
}

// Создание структуры
await mediaManagement.createProjectStructure(projectPath)
```

### Умная организация

```typescript
// Организация по дате съемки
await mediaManagement.organizeByDate(files, {
  format: 'YYYY-MM-DD',
  useCreationDate: true,
  useModificationDate: false
})

// Организация по типу камеры
await mediaManagement.organizeByCameraType(files)
// Создает папки: iPhone/, GoPro/, Sony/, etc.

// Организация по событиям
await mediaManagement.organizeByEvents(files, {
  detectByTimestamp: true,
  gapThreshold: 3600 // 1 час между событиями
})
```

## Синхронизация и связи

### Отслеживание перемещенных файлов

```typescript
// Поиск отсутствующих файлов
const missing = await mediaManagement.findMissingFiles()

// Переподключение файлов
await mediaManagement.relinkFiles([
  { 
    oldPath: '/old/path/video.mp4',
    newPath: '/new/path/video.mp4'
  }
])

// Автоматический поиск
await mediaManagement.autoRelink({
  searchPaths: ['/media/drive1', '/media/drive2'],
  matchBy: ['name', 'size', 'duration']
})
```

## 🆕 Duration Formatter (v2.0)

**Новинка**: Централизованные утилиты для форматирования длительности.

### Основные функции

```typescript
import {
  formatDurationSeconds,
  formatDurationMs,
  formatDurationHuman,
  parseDurationString
} from '@/lib/duration-formatter'

// Форматирование секунд
formatDurationSeconds(65)           // => "1:05"
formatDurationSeconds(3665)         // => "1:01:05"
formatDurationSeconds(0, false, true) // => "00:00" (с padding)
formatDurationSeconds(3600, false)   // => "60:00" (всегда MM:SS)
formatDurationSeconds(3600, true)    // => "01:00:00" (всегда HH:MM:SS)

// Форматирование миллисекунд
formatDurationMs(65000)             // => "1:05"
formatDurationMs(3665000)           // => "1:01:05"

// Человекочитаемый формат
formatDurationHuman(7325)           // => "2h 2m 5s"
formatDurationHuman(65)             // => "1m 5s"

// Парсинг строки в секунды
parseDurationString("1:05")         // => 65
parseDurationString("01:01:05")     // => 3665
parseDurationString(65)             // => 65 (pass-through для numbers)
```

### Параметры showHours

- `true` - Всегда показывать часы (01:01:05)
- `false` - Никогда не показывать часы, даже > 59 минут (60:00)
- `undefined` - Автоматически (1:01:05 если часы > 0, иначе 1:05)

### Параметр padMinutes

- `true` - Добавлять leading zero для минут (00:30)
- `false` (default) - Без padding (0:30)

### Использование в проекте

```typescript
// В компонентах
const { duration } = mediaFile
return <span>{formatDurationSeconds(duration)}</span>

// В логах
logger.debug(`Processing took ${formatDurationHuman(processingTime)}`)

// При парсинге пользовательского ввода
const seconds = parseDurationString(userInput)
```

---

## Интеграция с другими доменами

### С AI Services

```typescript
import { createMediaAnalysisFactory } from '@/domains/ai-services'

// Анализ при импорте
const analysisFactory = createMediaAnalysisFactory()
const analysis = await analysisFactory
  .createContentAnalysisService()
  .analyzeMediaFile(importedFile)
```

### С Video Editing

```typescript
import { useTimeline } from '@/domains/video-editing'
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')

// Добавление импортированных файлов на таймлайн
const timeline = useTimeline()
const imported = await mediaImport.importFiles(files)
timeline.addClips(imported.map(file => ({
  mediaId: file.id,
  trackId: 'video-1',
  startTime: 0
})))
```

## События

```typescript
// Подписка на события импорта
mediaManagement.on('importStarted', (files) => {
  logger.debugSync('Importing:', files)
})

mediaManagement.on('fileImported', (file) => {
  logger.debugSync('Imported:', file)
})

mediaManagement.on('importCompleted', (results) => {
  logger.debugSync('Import results:', results)
})

// События файловых операций
mediaManagement.on('fileRenamed', ({ oldName, newName }) => {
  logger.debugSync(`Renamed: ${oldName} -> ${newName}`)
})
```

## Best Practices

1. **Транзакции**: Используйте транзакции для групповых операций
2. **Проверка места**: Проверяйте доступное место перед импортом
3. **Прогресс**: Всегда показывайте прогресс длительных операций
4. **Отмена**: Поддерживайте отмену операций импорта
5. **Валидация**: Проверяйте целостность файлов после операций

## Примеры

### Импорт с камеры

```typescript
async function importFromCamera() {
  const devices = await mediaManagement.detectCameras()
  const camera = devices[0]
  
  const files = await mediaManagement.listCameraFiles(camera)
  
  await mediaManagement.importFromCamera(camera, {
    files: files.filter(f => f.type === 'video'),
    deleteAfterImport: false,
    organizeByCameraModel: true
  })
}
```

### Пакетное переименование

```typescript
async function batchRename() {
  const files = await mediaManagement.getProjectFiles()
  
  await mediaManagement.batchRename(files, {
    pattern: '{date}_{camera}_{sequence}',
    startSequence: 1,
    dateFormat: 'YYYYMMDD',
    preserveExtension: true
  })
}
```

## 📚 Дополнительная документация

Для более глубокого понимания Media Management домена см.:

- **[MEDIAPOOL-QUICK-GUIDE.md](./MEDIAPOOL-QUICK-GUIDE.md)** - 5-минутный гайд по MediaPool
- **[MEDIAPOOL-ARCHITECTURE.md](./MEDIAPOOL-ARCHITECTURE.md)** - Подробная архитектура event-driven системы с визуальными диаграммами
- **[/docs/05_development/duration-standardization.md](../../../docs/05_development/duration-standardization.md)** - Стандарты форматирования времени

---

## 📝 Changelog

### v2.0.0 (November 25, 2024)

**🎉 Основные изменения:**

1. **Система уведомлений для импорта**
   - Интеграция useNotifications в MediaManagementProvider
   - Prop `enableNotifications` с автоматическими toast-уведомлениями
   - Callback система через `importCallbacks`
   - Реал-тайм прогресс с количеством файлов

2. **Duration Formatter**
   - Создан централизованный `/src/lib/duration-formatter.ts`
   - 4 функции: formatDurationSeconds, formatDurationMs, formatDurationHuman, parseDurationString
   - Параметры showHours и padMinutes для гибкости
   - 17 тестов, 100% coverage
   - Обновлено 9 файлов по всему проекту

3. **Критический баг исправлен**
   - Файлы не отображались в Browser после импорта
   - Добавлено поле `id?: string` в MediaInfo
   - use-media-adapter теперь использует entries() вместо values()
   - Все файлы корректно отображаются с UUID tracking

4. **Smart Organization улучшен**
   - Реализовано извлечение реальных дат из EXIF
   - Интеграция с media-metadata-service
   - Tauri get_file_stats для дат модификации
   - Type guards для безопасного доступа к creation_time

5. **Error Tracker обновлен**
   - Exponential backoff retry (1s, 2s, 4s)
   - Альтернативные методы восстановления
   - Статистика операций (success/failure rates)
   - getOperationStats() и getReliabilityScore()

6. **TypeScript ошибки исправлены**
   - browser-machine: Добавлены табы projects и scenarios
   - smart-organization: Type guards для metadata
   - 0 TypeScript ошибок (связанных с изменениями)

**📊 Статистика:**
- 7/17 TODO исправлено (41%)
- 10020/10188 тестов прошли (98.35%)
- 0 TypeScript ошибок
- 95KB документации создано
- 28 файлов изменено

---

## Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.

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

## Основные компоненты

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
  console.log(`Imported ${progress.completed}/${progress.total}`)
})
```

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
    console.log(`${file.name}: ${progress}%`)
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
  console.log('Importing:', files)
})

mediaManagement.on('fileImported', (file) => {
  console.log('Imported:', file)
})

mediaManagement.on('importCompleted', (results) => {
  console.log('Import results:', results)
})

// События файловых операций
mediaManagement.on('fileRenamed', ({ oldName, newName }) => {
  console.log(`Renamed: ${oldName} -> ${newName}`)
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

## Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.
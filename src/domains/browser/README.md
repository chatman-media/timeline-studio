# Browser Domain

Управление медиа браузером и файловой системой в Timeline Studio.

## Обзор

Browser домен отвечает за навигацию по файловой системе, отображение медиафайлов, управление вкладками и выбором файлов для работы в редакторе.

## Структура

```
browser/
├── hooks/             # React хуки для работы с браузером
├── machines/          # XState машина состояний браузера
├── providers/         # React провайдеры
├── tauri/            # Интеграция с Tauri API
├── types/            # TypeScript типы
└── index.ts          # Главный экспорт
```

## Основные компоненты

### Browser Machine

XState машина для управления состоянием браузера:

```typescript
import { browserMachine } from '@/domains/browser'

// Состояние браузера
interface BrowserState {
  activeTab: BrowserTab
  tabs: BrowserTab[]
  currentPath: string
  selectedFiles: MediaFile[]
  viewMode: 'grid' | 'list'
  sortBy: 'name' | 'date' | 'size'
  filterBy: 'all' | 'video' | 'audio' | 'image'
}
```

### Browser Tabs

Поддержка вкладок для навигации:

```typescript
type BrowserTab = 
  | 'media'    // Медиафайлы
  | 'effects'  // Эффекты
  | 'titles'   // Титры
  | 'generators' // Генераторы
  | 'templates' // Шаблоны
```

### Browser Hooks

React хуки для работы с браузером:

```typescript
import { 
  useBrowserDomain,
  useBrowserSelection,
  useBrowserSettings 
} from '@/domains/browser'

// Основной хук браузера
const browser = useBrowserDomain()

// Управление выбором файлов
const selection = useBrowserSelection()
selection.selectFile(file)
selection.selectMultiple(files)
selection.clearSelection()

// Настройки отображения
const settings = useBrowserSettings()
settings.setViewMode('grid')
settings.setSortBy('date')
```

## Навигация по файлам

### Работа с путями

```typescript
// Навигация по директориям
browser.navigateTo('/path/to/folder')
browser.goBack()
browser.goForward()
browser.goToParent()

// История навигации
const history = browser.getHistory()
const canGoBack = browser.canGoBack()
const canGoForward = browser.canGoForward()
```

### Фильтрация и сортировка

```typescript
// Фильтрация файлов
browser.setFilter({
  type: 'video',
  extensions: ['.mp4', '.mov', '.avi'],
  minSize: 1024 * 1024, // 1MB
  dateRange: {
    from: new Date('2024-01-01'),
    to: new Date()
  }
})

// Сортировка
browser.setSortBy('date', 'desc')
```

## Интеграция с другими доменами

### С Media Management

```typescript
import { useMediaImport } from '@/domains/media-management'

// Импорт выбранных файлов
const mediaImport = useMediaImport()
const selectedFiles = browser.getSelectedFiles()
await mediaImport.importFiles(selectedFiles)
```

### С Video Editing

```typescript
import { useTimeline } from '@/domains/video-editing'

// Добавление файлов на таймлайн
const timeline = useTimeline()
browser.onFileDrop((files) => {
  timeline.addMediaFiles(files)
})
```

## События браузера

```typescript
// Подписка на события
browser.on('selectionChanged', (files) => {
  console.log('Selected:', files)
})

browser.on('pathChanged', (path) => {
  console.log('Navigated to:', path)
})

browser.on('fileDoubleClick', (file) => {
  // Открыть файл в редакторе
})
```

## Поиск файлов

```typescript
// Поиск по имени
const results = await browser.search({
  query: 'vacation',
  in: 'currentFolder', // или 'allFolders'
  matchCase: false
})

// Расширенный поиск
const advanced = await browser.advancedSearch({
  name: '*vacation*',
  type: 'video',
  codec: 'h264',
  minDuration: 60, // секунды
  tags: ['family', 'summer']
})
```

## Предпросмотр файлов

```typescript
// Генерация превью
const thumbnail = await browser.generateThumbnail(file, {
  width: 320,
  height: 180,
  time: 5 // секунда видео
})

// Быстрый предпросмотр
browser.quickLook(file, {
  autoplay: true,
  loop: false
})
```

## Контекстное меню

```typescript
// Регистрация действий контекстного меню
browser.registerContextAction({
  id: 'analyze',
  label: 'Analyze with AI',
  icon: 'brain',
  enabled: (files) => files.every(f => f.type === 'video'),
  action: async (files) => {
    // Анализ файлов
  }
})
```

## Best Practices

1. **Производительность**: Используйте виртуализацию для больших списков файлов
2. **Кэширование**: Кэшируйте превью и метаданные файлов
3. **Асинхронность**: Все операции с файлами должны быть асинхронными
4. **Обработка ошибок**: Обрабатывайте случаи недоступных файлов

## Примеры

### Создание файлового браузера

```typescript
function FileBrowser() {
  const browser = useBrowserDomain()
  const { files, currentPath, isLoading } = browser.state
  
  return (
    <div>
      <PathBreadcrumb path={currentPath} />
      <FileGrid 
        files={files}
        onFileClick={browser.selectFile}
        onFileDoubleClick={browser.openFile}
      />
    </div>
  )
}
```

### Drag & Drop

```typescript
function DropZone() {
  const browser = useBrowserDomain()
  
  const handleDrop = (e: DragEvent) => {
    const files = Array.from(e.dataTransfer.files)
    browser.handleFileDrop(files)
  }
  
  return (
    <div onDrop={handleDrop}>
      Drop files here
    </div>
  )
}
```

## Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.
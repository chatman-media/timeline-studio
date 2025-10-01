# System Integration Domain

Системная интеграция, модальные окна, уведомления и обновления в Timeline Studio.

## Обзор

System Integration домен отвечает за интеграцию с операционной системой, управление модальными окнами, уведомлениями, обновлениями приложения и другими системными функциями.

## Структура

```
system-integration/
├── hooks/            # React хуки для системных функций
├── machines/         # XState машины состояний
├── providers/        # React провайдеры
├── services/         # Сервисы системной интеграции
├── tauri/           # Интеграция с Tauri API
├── types/           # TypeScript типы
├── utils/           # Утилиты
└── index.ts         # Главный экспорт
```

## Основные компоненты

### Modal Machine

XState машина для управления модальными окнами:

```typescript
import { useModals } from '@/domains/system-integration'

const modals = useModals()

// Открытие модального окна
modals.open('settings', {
  size: 'large',
  closable: true,
  data: { tab: 'general' }
})

// Закрытие окна
modals.close('settings')

// Закрытие всех окон
modals.closeAll()
```

### Типы модальных окон

```typescript
type ModalType = 
  | 'settings'          // Настройки приложения
  | 'project-settings'  // Настройки проекта
  | 'export'           // Экспорт видео
  | 'import'           // Импорт файлов
  | 'effects'          // Выбор эффектов
  | 'templates'        // Шаблоны
  | 'ai-assistant'     // AI помощник
  | 'keyboard-shortcuts' // Горячие клавиши
  | 'about'            // О программе
  | 'confirm'          // Подтверждение действия
  | 'error'            // Ошибка
  | 'progress'         // Прогресс операции
```

### Notifications

Система уведомлений:

```typescript
import { useNotifications } from '@/domains/system-integration'

const notifications = useNotifications()

// Информационное уведомление
notifications.info('Export completed', {
  duration: 5000,
  action: {
    label: 'Open folder',
    onClick: () => openFolder(exportPath)
  }
})

// Предупреждение
notifications.warning('Low disk space', {
  persistent: true
})

// Ошибка
notifications.error('Failed to import file', {
  details: error.message,
  action: {
    label: 'Retry',
    onClick: () => retryImport()
  }
})

// Успех
notifications.success('Project saved')
```

### Update System

Система обновлений приложения:

```typescript
import { useUpdates } from '@/domains/system-integration'

const updates = useUpdates()

// Проверка обновлений
await updates.checkForUpdates()

// Состояние обновления
const { 
  available,
  version,
  releaseNotes,
  downloadProgress,
  status
} = updates.state

// Загрузка и установка
if (available) {
  await updates.downloadUpdate()
  await updates.installAndRestart()
}

// Автоматические обновления
updates.setAutoUpdate(true)
updates.setCheckInterval(24 * 60 * 60 * 1000) // 24 часа
```

## Системные диалоги

### Файловые диалоги

```typescript
import { dialogs } from '@/domains/system-integration'

// Выбор файла
const file = await dialogs.openFile({
  title: 'Select video file',
  filters: [
    { name: 'Video Files', extensions: ['mp4', 'mov', 'avi'] },
    { name: 'All Files', extensions: ['*'] }
  ],
  defaultPath: lastUsedPath
})

// Выбор папки
const folder = await dialogs.selectFolder({
  title: 'Select export folder',
  defaultPath: documentsPath
})

// Сохранение файла
const savePath = await dialogs.saveFile({
  title: 'Save project',
  defaultPath: 'Untitled.tlproj',
  filters: [
    { name: 'Timeline Project', extensions: ['tlproj'] }
  ]
})
```

### Диалоги подтверждения

```typescript
// Простое подтверждение
const confirmed = await dialogs.confirm({
  title: 'Delete clips?',
  message: 'This action cannot be undone.',
  okLabel: 'Delete',
  cancelLabel: 'Cancel',
  type: 'warning'
})

// Диалог с выбором
const choice = await dialogs.choice({
  title: 'Save changes?',
  message: 'You have unsaved changes.',
  choices: [
    { id: 'save', label: 'Save', type: 'primary' },
    { id: 'discard', label: 'Discard', type: 'danger' },
    { id: 'cancel', label: 'Cancel', type: 'default' }
  ]
})
```

## Интеграция с ОС

### Системное меню

```typescript
import { systemMenu } from '@/domains/system-integration'

// Создание меню приложения
systemMenu.create({
  file: {
    newProject: { accelerator: 'Cmd+N' },
    openProject: { accelerator: 'Cmd+O' },
    save: { accelerator: 'Cmd+S' },
    saveAs: { accelerator: 'Cmd+Shift+S' }
  },
  edit: {
    undo: { accelerator: 'Cmd+Z' },
    redo: { accelerator: 'Cmd+Shift+Z' },
    cut: { accelerator: 'Cmd+X' },
    copy: { accelerator: 'Cmd+C' },
    paste: { accelerator: 'Cmd+V' }
  }
})
```

### Системный трей

```typescript
import { systemTray } from '@/domains/system-integration'

// Создание иконки в трее
systemTray.create({
  icon: 'assets/tray-icon.png',
  tooltip: 'Timeline Studio',
  menu: [
    { label: 'Show', click: () => window.show() },
    { label: 'Hide', click: () => window.hide() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]
})

// Обновление статуса
systemTray.setStatus('rendering', '45%')
```

## Горячие клавиши

### Глобальные сочетания

```typescript
import { shortcuts } from '@/domains/system-integration'

// Регистрация глобальных сочетаний
shortcuts.registerGlobal({
  'Cmd+Shift+X': () => window.show(),
  'Cmd+Shift+C': () => captureScreen()
})

// Контекстные сочетания
shortcuts.registerContext('timeline', {
  'Space': () => player.togglePlay(),
  'J': () => player.rewind(),
  'K': () => player.pause(),
  'L': () => player.forward(),
  'I': () => timeline.setInPoint(),
  'O': () => timeline.setOutPoint()
})
```

## Системные события

```typescript
// Подписка на системные события
systemIntegration.on('beforeQuit', async (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault()
    const save = await dialogs.confirm({
      title: 'Save changes before quit?'
    })
    if (save) await saveProject()
    app.quit()
  }
})

systemIntegration.on('windowFocus', () => {
  // Обновить состояние при фокусе
})

systemIntegration.on('displayChange', (displays) => {
  // Адаптировать UI под новые экраны
})
```

## Интеграция с другими доменами

### С Project Management

```typescript
import { useUserSettings } from '@/domains/project-management'

// Открытие настроек через модальное окно
const settings = useUserSettings()
modals.open('settings', {
  data: { 
    currentSettings: settings.state,
    onSave: (newSettings) => settings.update(newSettings)
  }
})
```

### С Video Editing

```typescript
import { useTimeline } from '@/domains/video-editing'

// Диалог экспорта
const timeline = useTimeline()
modals.open('export', {
  data: {
    timeline: timeline.state,
    onExport: (settings) => timeline.export(settings)
  }
})
```

## Производительность системы

### Мониторинг ресурсов

```typescript
import { performance } from '@/domains/system-integration'

// Мониторинг использования ресурсов
const stats = performance.getStats()
// { cpu: 45, memory: 2048, gpu: 60 }

// Оповещения о проблемах
performance.on('highMemoryUsage', (usage) => {
  notifications.warning(`High memory usage: ${usage}MB`)
})
```

## Best Practices

1. **Неблокирующие операции**: Используйте асинхронные диалоги
2. **Обработка отмены**: Всегда обрабатывайте отмену в диалогах
3. **Контекст**: Сохраняйте контекст при открытии модальных окон
4. **Локализация**: Все тексты должны поддерживать локализацию

## Примеры

### Экспорт с прогрессом

```typescript
async function exportWithProgress() {
  const exportPath = await dialogs.saveFile({
    title: 'Export video',
    defaultPath: 'output.mp4'
  })
  
  if (!exportPath) return
  
  const progressModal = modals.open('progress', {
    title: 'Exporting video',
    cancellable: true
  })
  
  try {
    await exporter.export(exportPath, {
      onProgress: (percent) => {
        progressModal.update({ progress: percent })
      }
    })
    
    notifications.success('Export completed', {
      action: {
        label: 'Open',
        onClick: () => shell.showItemInFolder(exportPath)
      }
    })
  } finally {
    modals.close(progressModal)
  }
}
```

## Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.
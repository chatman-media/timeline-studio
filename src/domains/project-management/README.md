# Project Management Domain

Управление проектами, пользовательскими настройками и обновлениями в Timeline Studio.

## Обзор

Project Management домен отвечает за управление проектами, пользовательскими настройками, обновлениями приложения и настройками проекта.

## Структура

```
project-management/
├── machines/          # XState машины состояний
│   ├── user-settings-machine.ts
│   └── update-machine.ts
├── services/          # Сервисы управления
├── types/            # TypeScript типы
└── index.ts          # Главный экспорт
```

## Основные компоненты

### User Settings Machine

XState машина для управления пользовательскими настройками:

```typescript
import { userSettingsMachine } from '@/domains/project-management'

// Конфигурация машины
const machine = userSettingsMachine.setup({
  actions: {
    updateTheme: assign((context, event) => ({
      theme: event.theme
    })),
    updateLanguage: assign((context, event) => ({
      language: event.language
    }))
  }
})

// Использование
const [state, send] = useMachine(machine)

// Изменение темы
send({ type: 'UPDATE_THEME', theme: 'dark' })

// Изменение языка
send({ type: 'UPDATE_LANGUAGE', language: 'ru' })
```

### User Settings Types

```typescript
interface UserSettings {
  // Внешний вид
  theme: 'light' | 'dark' | 'system'
  language: LanguageCode
  layout: 'default' | 'options' | 'vertical' | 'chat'
  
  // Предпросмотр
  previewSize: PreviewSizeKey
  showWaveforms: boolean
  showThumbnails: boolean
  
  // Редактирование
  autoSave: boolean
  autoSaveInterval: number
  defaultTransitionDuration: number
  snapToPlayhead: boolean
  
  // Производительность
  enableHardwareAcceleration: boolean
  maxCacheSize: number
  proxyResolution: '1/2' | '1/4' | '1/8'
  
  // AI настройки
  aiProvider: AIProvider
  aiModel: string
  enableAIAssistant: boolean
}
```

### Update Machine

Управление обновлениями приложения:

```typescript
interface UpdateState {
  status: 'idle' | 'checking' | 'downloading' | 'ready' | 'error'
  currentVersion: string
  latestVersion?: string
  downloadProgress?: number
  error?: string
}

// Использование
const updateService = useUpdateManager()

// Проверка обновлений
await updateService.checkForUpdates()

// Скачивание и установка
if (updateService.updateAvailable) {
  await updateService.downloadUpdate()
  await updateService.installUpdate()
}
```

### Project Settings

Настройки конкретного проекта:

```typescript
interface ProjectSettings {
  // Основные
  name: string
  description?: string
  createdAt: Date
  modifiedAt: Date
  
  // Формат видео
  resolution: Resolution
  framerate: number
  aspectRatio: AspectRatio
  pixelFormat: PixelFormat
  
  // Аудио
  sampleRate: number
  bitDepth: number
  channels: number
  
  // Цвет
  colorSpace: ColorSpace
  bitDepth: '8bit' | '10bit' | '12bit'
  hdr: boolean
  
  // Экспорт
  defaultExportPreset: string
  exportPath: string
}
```

## Сервисы

### Settings Persistence

Сохранение настроек в локальное хранилище:

```typescript
import { SettingsService } from '@/domains/project-management'

const settings = new SettingsService()

// Загрузка настроек
const userSettings = await settings.loadUserSettings()

// Сохранение настроек
await settings.saveUserSettings({
  ...userSettings,
  theme: 'dark'
})

// Сброс к значениям по умолчанию
await settings.resetToDefaults()
```

### Project Manager

Управление проектами:

```typescript
import { ProjectManager } from '@/domains/project-management'

const manager = new ProjectManager()

// Создание проекта
const project = await manager.createProject({
  name: 'My Video',
  resolution: { width: 1920, height: 1080 },
  framerate: 30
})

// Открытие проекта
await manager.openProject(projectId)

// Сохранение проекта
await manager.saveProject(project)

// Экспорт проекта
await manager.exportProject(project, 'path/to/export.tlproj')
```

## Интеграция с другими доменами

### С Video Editing

```typescript
import { TimelineState } from '@/domains/video-editing'
import { ProjectSettings } from '@/domains/project-management'

// Применение настроек проекта к таймлайну
function applyProjectSettings(
  timeline: TimelineState,
  settings: ProjectSettings
): TimelineState {
  return {
    ...timeline,
    framerate: settings.framerate,
    resolution: settings.resolution
  }
}
```

### С AI Core

```typescript
import { getAIContainer } from '@/domains/ai-core'

// Применение AI настроек пользователя
const userSettings = getUserSettings()
const container = getAIContainer()

container.configure({
  providers: {
    [userSettings.aiProvider]: {
      defaultModel: userSettings.aiModel
    }
  }
})
```

## State Management

Использование XState для управления состоянием:

```typescript
// Машина состояний проекта
const projectMachine = createMachine({
  id: 'project',
  initial: 'idle',
  states: {
    idle: {
      on: {
        CREATE: 'creating',
        OPEN: 'opening',
        SAVE: 'saving'
      }
    },
    creating: {
      invoke: {
        src: 'createProject',
        onDone: {
          target: 'editing',
          actions: 'setProject'
        },
        onError: 'error'
      }
    },
    editing: {
      on: {
        SAVE: 'saving',
        CLOSE: 'closing'
      }
    },
    saving: {
      invoke: {
        src: 'saveProject',
        onDone: 'editing',
        onError: 'error'
      }
    },
    error: {
      on: {
        RETRY: 'idle'
      }
    }
  }
})
```

## Миграция и обновления

### Миграция настроек

```typescript
import { SettingsMigration } from '@/domains/project-management'

// Миграция старых настроек
const migration = new SettingsMigration()

// v1 -> v2
migration.register('1.0.0', '2.0.0', (oldSettings) => {
  return {
    ...oldSettings,
    newFeature: 'default-value'
  }
})

// Применение миграций
const currentSettings = await migration.migrate(
  oldSettings,
  '1.0.0',
  '2.0.0'
)
```

## Best Practices

1. **Валидация**: Всегда валидируйте настройки перед сохранением
2. **Миграция**: Поддерживайте обратную совместимость настроек
3. **Производительность**: Дебаунс сохранения настроек
4. **Безопасность**: Не храните чувствительные данные в настройках

## Примеры

### Создание нового проекта с настройками

```typescript
const projectManager = new ProjectManager()
const userSettings = getUserSettings()

const project = await projectManager.createProject({
  name: 'Tutorial Video',
  resolution: { width: 1920, height: 1080 },
  framerate: 30,
  aspectRatio: '16:9',
  colorSpace: 'rec709',
  // Применяем пользовательские настройки
  exportPath: userSettings.defaultExportPath,
  defaultTransitionDuration: userSettings.defaultTransitionDuration
})
```

### Автосохранение

```typescript
const autoSaveService = new AutoSaveService()

autoSaveService.configure({
  enabled: userSettings.autoSave,
  interval: userSettings.autoSaveInterval,
  onSave: async (project) => {
    await projectManager.saveProject(project)
  }
})

// Запуск автосохранения
autoSaveService.start()
```

## Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.
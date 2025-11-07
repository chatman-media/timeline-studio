# Migration Guide: Legacy Hooks → New Architecture

Руководство по миграции с legacy хуков app-state на новую backend-центричную архитектуру.

## 🎯 Цель миграции

Переход от legacy хуков к прямому использованию новой архитектуры для:
- **Лучшей производительности** - меньше лишних ререндеров
- **Полной типизации** - автогенерированные типы из Rust
- **Реального времени** - мгновенная синхронизация через события
- **Простоты тестирования** - централизованная система моков

## 📋 Статус миграции

### ✅ Безопасный переход
Все legacy хуки продолжают работать и **НЕ будут удалены** до полной миграции всех компонентов.

### 🔄 Поэтапная миграция
1. **Фаза 1** (завершена): Новая архитектура работает параллельно
2. **Фаза 2** (в процессе): Legacy хуки используют новый backend
3. **Фаза 3** (планируется): Постепенная замена на новые паттерны

## 🗺️ Карта миграции

### Legacy Hook → New Approach

| Legacy Hook | Статус | Новый подход | Приоритет |
|-------------|---------|--------------|-----------|
| `useCurrentProject()` | ✅ Совместим | `useAppState().project` | Высокий |
| `useAppSettings()` | ✅ Совместим | `executeCommand()` | Высокий |
| `useMediaFiles()` | ✅ Совместим | `projectState.media_pool` | Средний |
| `useMusicFiles()` | ✅ Совместим | `projectState.media_pool` | Средний |
| `useFavorites()` | ✅ Совместим | Custom commands | Низкий |
| `useRecentProjects()` | ✅ Совместим | File operations | Низкий |

## 🔧 Миграционные паттерны

### 1. Project Management

#### Legacy (продолжает работать)
```typescript
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')
function MyComponent() {
  const { 
    currentProject, 
    openProject, 
    saveProject, 
    createNewProject 
  } = useCurrentProject()

  const handleOpen = () => {
    openProject('/path/to/project.tls')
  }

  return <div>{currentProject?.name}</div>
}
```

#### New Architecture (рекомендуется)
```typescript
import { useAppState, executeCommand } from '@/features/app-state'

function MyComponent() {
  const { projectState } = useAppState()
  
  const handleOpen = async () => {
    await executeCommand({
      type: 'OpenProject',
      params: { path: '/path/to/project.tls' }
    })
  }

  return <div>{projectState.project?.name}</div>
}
```

**Преимущества новой архитектуры:**
- ✅ Автоматическая синхронизация через события
- ✅ Полная типизация команд и состояния
- ✅ Event sourcing - полная история изменений
- ✅ Оптимистичные обновления UI

### 2. App Settings

#### Legacy (продолжает работать)
```typescript
function SettingsComponent() {
  const { 
    settings, 
    updateSettings,
    theme,
    setTheme 
  } = useAppSettings()

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
  }

  return <div>Current theme: {theme}</div>
}
```

#### New Architecture (рекомендуется)
```typescript
import { useAppState, executeCommand } from '@/features/app-state'

function SettingsComponent() {
  const { projectState } = useAppState()
  
  const handleThemeChange = async (newTheme: string) => {
    // Команды будут добавлены для настроек
    await executeCommand({
      type: 'UpdateSettings',
      params: { theme: newTheme }
    })
  }

  // Временно используйте legacy hook для настроек
  // до создания соответствующих команд
  const { theme } = useAppSettings()

  return <div>Current theme: {theme}</div>
}
```

### 3. Media Management

#### Legacy (продолжает работать)
```typescript
function MediaBrowser() {
  const { mediaFiles, addMediaFile, removeMediaFile } = useMediaFiles()
  
  const handleAddMedia = (filePath: string) => {
    addMediaFile({
      path: filePath,
      type: 'Video',
      name: 'New Video'
    })
  }

  return (
    <div>
      {mediaFiles.map(file => (
        <div key={file.id}>{file.name}</div>
      ))}
    </div>
  )
}
```

#### New Architecture (рекомендуется)
```typescript
import { useAppState, executeCommand } from '@/features/app-state'

function MediaBrowser() {
  const { projectState } = useAppState()
  const mediaItems = Object.values(projectState.project?.media_pool.items || {})
  
  const handleAddMedia = async (filePath: string) => {
    await executeCommand({
      type: 'AddMedia',
      params: { 
        path: filePath, 
        media_type: 'Video' 
      }
    })
  }

  return (
    <div>
      {mediaItems.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
```

### 4. Playback Control

#### Legacy (продолжает работать)
```typescript
function PlayerControls() {
  // Legacy хук пока не имеет прямого аналога
  // Используйте его до создания playback команд
  const { isPlaying, currentTime, play, pause, seek } = usePlayerState()
  
  return (
    <div>
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
      <span>{currentTime}s</span>
    </div>
  )
}
```

#### New Architecture (рекомендуется)
```typescript
import { useAppState, executeCommand } from '@/features/app-state'

function PlayerControls() {
  const { projectState } = useAppState()
  const playback = projectState.playback_state
  
  const handlePlay = async () => {
    await executeCommand({ type: 'Play' })
  }
  
  const handlePause = async () => {
    await executeCommand({ type: 'Pause' })
  }
  
  const handleSeek = async (time: number) => {
    await executeCommand({ 
      type: 'Seek', 
      params: { time } 
    })
  }

  return (
    <div>
      <button onClick={handlePlay}>Play</button>
      <button onClick={handlePause}>Pause</button>
      <span>{playback.current_time}s</span>
    </div>
  )
}
```

## 🎣 Новые хуки и утилиты

### useAppState() - Основной хук
```typescript
import { useAppState } from '@/features/app-state'

function MyComponent() {
  const { 
    projectState,      // Полное состояние проекта
    isLoading,         // Состояние загрузки
    error,             // Ошибки синхронизации
    lastUpdate         // Время последнего обновления
  } = useAppState()
  
  return <div>Project: {projectState.project?.name}</div>
}
```

### executeCommand() - Выполнение команд
```typescript
import { executeCommand } from '@/features/app-state'

async function handleCreateProject() {
  try {
    const result = await executeCommand({
      type: 'CreateProject',
      params: {
        name: 'New Project',
        settings: {
          resolution: { width: 1920, height: 1080 },
          frame_rate: 30,
          audio_sample_rate: 48000,
          audio_channels: 2
        }
      }
    })
    
    if (result.success) {
      logger.debugSync('Project created:', result.message)
    }
  } catch (error) {
    logger.errorSync('Failed to create project:', error)
  }
}
```

### useEventListener() - Слушатель событий
```typescript
import { useEventListener } from '@/features/app-state'

function ProjectStatusComponent() {
  const [lastEvent, setLastEvent] = useState<string>('')
  
  useEventListener('project:event', (event) => {
    switch (event.type) {
      case 'ProjectSaved':
        setLastEvent('Project saved successfully')
        break
      case 'ClipAdded':
        setLastEvent(`Clip added to track ${event.payload.track_id}`)
        break
    }
  })
  
  return <div>Status: {lastEvent}</div>
}
```

## 🧪 Тестирование новой архитектуры

### Legacy Testing (сложно)
```typescript
// Много моков, сложная настройка
vi.mock('@tauri-apps/api/core')
vi.mock('@/features/app-state/hooks/use-current-project')

test('should handle project operations', () => {
  const mockOpenProject = vi.fn()
  vi.mocked(useCurrentProject).mockReturnValue({
    currentProject: null,
    openProject: mockOpenProject,
    // ... много других моков
  })
  
  render(<MyComponent />)
  // Сложные проверки...
})
```

### New Architecture Testing (просто)
```typescript  
import { renderWithAppState, createTestScenarios } from '@/features/app-state/testing'

test('should handle project operations', () => {
  const { mockBackend } = renderWithAppState(<MyComponent />, {
    mockBackend: {
      initialState: createTestScenarios.emptyProject()
    }
  })
  
  // Простые, понятные проверки
  expect(screen.getByText('No project loaded')).toBeInTheDocument()
})
```

## 🔄 Этапы миграции компонента

### Шаг 1: Добавить новые импорты
```typescript
// Добавьте рядом с существующими импортами
import { useAppState, executeCommand } from '@/features/app-state'
```

### Шаг 2: Параллельное использование
```typescript
function MyComponent() {
  // Старый способ (пока оставляем)
  const { currentProject } = useCurrentProject()
  
  // Новый способ (добавляем)
  const { projectState } = useAppState()
  
  // Постепенно переходим на новую архитектуру
  const project = projectState.project || currentProject
  
  return <div>{project?.name}</div>
}
```

### Шаг 3: Замена методов
```typescript
function MyComponent() {
  const { projectState } = useAppState()
  
  // Заменяем старые методы на команды
  const handleSave = async () => {
    // Вместо: saveProject()
    await executeCommand({
      type: 'SaveProject',
      params: { path: null } // Auto-save to current path
    })
  }
  
  return <div>{projectState.project?.name}</div>
}
```

### Шаг 4: Удаление legacy импортов
```typescript
// Удаляем старые импорты
// import { useCurrentProject } from '@/features/app-state/hooks/use-current-project'

// Оставляем только новые
import { useAppState, executeCommand } from '@/features/app-state'
```

### Шаг 5: Обновление тестов
```typescript
// Заменяем сложные моки на простые утилиты
import { renderWithAppState } from '@/features/app-state/testing'

test('component works', () => {
  renderWithAppState(<MyComponent />)
  // Тесты становятся проще и надежнее
})
```

## ⚠️ Важные замечания

### Что МОЖНО делать сейчас
- ✅ Использовать legacy хуки в существующих компонентах
- ✅ Мигрировать новые компоненты на новую архитектуру  
- ✅ Смешивать старый и новый подходы в одном компоненте
- ✅ Постепенно заменять методы на команды

### Что НЕ НУЖНО делать
- ❌ Экстренно переписывать все компоненты
- ❌ Удалять legacy хуки до полной миграции
- ❌ Создавать новые legacy хуки
- ❌ Игнорировать новую архитектуру в новых компонентах

### Политика для провайдеров (важно)

- Для React-провайдеров (Provider pattern) вводится жёсткое требование: они должны быть переведены на новую backend-центричную систему и использовать backend-sync / AppProvider как источник истины.
- Поддержка старых (legacy) провайдеров не требуется и не будет поддерживаться как обязательная — провайдеры можно переводить сразу на новую систему без создания shim-слоя.
- За эталон берите провайдер настроек проекта: `src/features/project-settings/services/project-settings-provider.tsx` (ProjectSettingsProvider). Он показывает ожидаемый API, тесты и интеграцию с mock-backend.

Проверочный чеклист для провайдера

1. Экспортирует React Provider и hook (например, MyProvider / useMyProvider) совместимый с AppProvider или использует AppProvider внутри.
2. Не держит независимый локальный источник истины — состояние должно приходить из backend (через useAppState / AppProvider) или синхронизироваться с ним.
3. Имеет тесты, которые запускаются с `renderWithAppState` / `MockBackendProvider` и проверяют поведение в изолированном режиме.
4. Не добавляет новых legacy-хуков; если требуется совместимость — делайте миграцию в отдельной задаче, но не держите shim навсегда.

Примеры тестов и интеграции

Используйте `renderWithAppState` или `MockBackendProvider` для unit/integration тестов провайдера. Пример:

```typescript
import { renderWithAppState } from '@/features/app-state/testing'
import { ProjectSettingsProvider } from '@/features/project-settings/services/project-settings-provider'

test('provider integrates with backend', () => {
  const { mockBackend } = renderWithAppState(<ProjectSettingsProvider />, {
    mockBackend: { initialState: /* createTestScenarios.emptyProject() */ }
  })

  // assertions against mockBackend or rendered output
})
```

Если провайдер работает корректно с mock-backend — он считается совместимым с новой архитектурой.

### Рекомендуемая стратегия
1. **Новые компоненты** - сразу используйте новую архитектуру
2. **Существующие компоненты** - мигрируйте по мере необходимости
3. **Критические компоненты** - мигрируйте осторожно с тщательным тестированием
4. **Простые компоненты** - можно мигрировать быстро

## 🎯 Приоритеты миграции

### Высокий приоритет
- **Новые компоненты** - обязательно используйте новую архитектуру
- **Project management** - максимальная выгода от Event Sourcing  
- **Player controls** - реальная синхронизация состояния
- **Timeline operations** - производительность и consistency

### Средний приоритет  
- **Media browser** - улучшенная производительность
- **Settings panels** - лучшая типизация
- **Modal dialogs** - упрощенное состояние

### Низкий приоритет
- **Static components** - компоненты без сложной логики
- **Utility components** - вспомогательные компоненты
- **Legacy pages** - страницы, которые редко изменяются

## 🚀 Примеры миграции

### Простой компонент
```typescript
// До миграции
function ProjectName() {
  const { currentProject } = useCurrentProject()
  return <h1>{currentProject?.name || 'No project'}</h1>
}

// После миграции  
function ProjectName() {
  const { projectState } = useAppState()
  return <h1>{projectState.project?.name || 'No project'}</h1>
}
```

### Сложный компонент с состоянием
```typescript
// До миграции
function ProjectManager() {
  const { 
    currentProject, 
    recentProjects, 
    openProject, 
    createNewProject 
  } = useCurrentProject()
  
  const { mediaFiles, addMediaFile } = useMediaFiles()
  
  const handleCreate = () => {
    createNewProject('New Project')
  }
  
  return (
    <div>
      <h2>{currentProject?.name}</h2>
      <button onClick={handleCreate}>Create</button>
      <div>Media: {mediaFiles.length} files</div>
    </div>
  )
}

// После миграции
function ProjectManager() {
  const { projectState } = useAppState()
  
  const handleCreate = async () => {
    await executeCommand({
      type: 'CreateProject',
      params: {
        name: 'New Project',
        settings: {
          resolution: { width: 1920, height: 1080 },
          frame_rate: 30,
          audio_sample_rate: 48000,
          audio_channels: 2
        }
      }
    })
  }
  
  const mediaCount = Object.keys(
    projectState.project?.media_pool.items || {}
  ).length
  
  return (
    <div>
      <h2>{projectState.project?.name}</h2>
      <button onClick={handleCreate}>Create</button>
      <div>Media: {mediaCount} files</div>
    </div>
  )
}
```

## 📚 Полезные ресурсы

### Документация
- [Backend Architecture](./REFACTORING-PLAN.md) - Полная документация архитектуры
- [Testing Guide](./testing/README.md) - Система тестирования
- [Generated Types](../types/generated/tauri-bindings.ts) - Автогенерированные типы

### Примеры
- [Example Test](./testing/example-test.test.tsx) - Примеры тестирования  
- [Integration Tests](./__tests__/integration/) - Интеграционные тесты
- [New Architecture Test](./__tests__/integration/new-architecture.test.tsx) - Тесты новой архитектуры

### Поддержка
Если у вас возникли вопросы по миграции:
1. Изучите примеры в existing tests
2. Проверьте типы в generated/tauri-bindings.ts  
3. Создайте issue с вопросом в репозитории

## 🎊 Заключение

Миграция на новую архитектуру - это **постепенный процесс** без breaking changes. Вы можете:

- **Продолжать использовать legacy хуки** для существующих компонентов
- **Начать использовать новую архитектуру** для новых компонентов
- **Мигрировать по частям** когда удобно
- **Получить все преимущества** новой архитектуры постепенно

Новая архитектура обеспечивает лучшую производительность, типизацию и тестируемость, делая разработку Timeline Studio более приятной и продуктивной.

**Happy coding!** 🚀
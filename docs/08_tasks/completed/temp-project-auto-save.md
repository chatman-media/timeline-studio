# Автоматическое создание и сохранение временного проекта ✅

## Дата завершения: 23 июня 2025

## Обзор

Реализована система автоматического создания и управления временным проектом, который создается при запуске приложения и сохраняется между сессиями.

## Ключевые особенности

### 🎯 **Автоматическое создание при запуске**
- При загрузке приложения автоматически создается временный проект
- Проект сохраняется в папке бэкапов (`backup_dir/temp_project.tlsp`)
- Использует новую архитектуру v2 (TimelineStudioProjectService)
- Если временный проект уже существует, загружается из файла

### 💾 **Автоматическое сохранение**
- Временный проект автоматически сохраняется при любых изменениях
- Вызывается через `setProjectDirty(true)`
- Время модификации обновляется при каждом сохранении
- Не блокирует UI - работает асинхронно с обработкой ошибок

### 📦 **Синхронизация ресурсов**
- Все ресурсы (медиа, музыка, эффекты и т.д.) синхронизируются с MediaPool проекта
- Промежуточное хранение в localStorage для мгновенной персистентности
- Двунаправленная синхронизация: localStorage ↔ ResourcesProvider ↔ MediaPool
- При загрузке проекта ресурсы восстанавливаются из MediaPool в UI

### 📁 **Управление состоянием**
- Проект всегда отмечен как `dirty` пока пользователь не сохранил его явно
- Предоставляет метод `isTempProject()` для определения типа проекта
- Интегрирован с существующей системой управления проектами

### 🔄 **Преобразование в постоянный проект**
- При сохранении пользователем временный проект конвертируется в обычный
- Поддерживает оба формата: `.tlsp` (v2) и `.tls` (legacy)
- Сохраняет все данные из временного проекта
- Очищает `dirty` флаг после успешного сохранения

## Реализация

### Новые методы в AppSettingsProvider

```typescript
// Создание нового временного проекта
createTempProject(): Promise<void>

// Загрузка существующего или создание нового временного проекта
loadOrCreateTempProject(): Promise<void>

// Проверка является ли проект временным
isTempProject(): boolean
```

### Автоматическая инициализация

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('TempProjectAutoSave')

// В AppSettingsProvider - автоматически вызывается при загрузке
useEffect(() => {
  if (!state.context.isLoading && !state.context.currentProject.path && state.context.currentProject.isNew) {
    loadOrCreateTempProject().catch(error => {
      logger.errorSync("Failed to load or create temp project:", error)
    })
  }
}, [state.context.isLoading, state.context.currentProject.path, state.context.currentProject.isNew, send])
```

### Автоматическое сохранение с синхронизацией ресурсов

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('TempProjectAutoSave')

const autoSaveTempProject = async () => {
  try {
    const currentProject = getCurrentProject()
    
    if (currentProject.path && currentProject.path.includes(TEMP_PROJECT_FILENAME)) {
      logger.infoSync("Auto-saving temp project...")
      
      const projectService = TimelineStudioProjectService.getInstance()
      const project = await projectService.openProject(currentProject.path)
      
      // Получаем ресурсы из localStorage
      const { mediaResources, musicResources } = getResourcesFromStorage()
      
      // Синхронизируем ресурсы с проектом
      const updatedProject = syncResourcesToProject(project, mediaResources, musicResources)
      
      // Сохраняем обновленный проект
      await projectService.saveProject(updatedProject, currentProject.path)
      
      logger.infoSync(`Temp project auto-saved with ${updatedProject.mediaPool.items.size} media items`)
    }
  } catch (error) {
    logger.errorSync("Failed to auto-save temp project:", error)
  }
}
```

### Восстановление ресурсов при загрузке

```typescript
// При загрузке временного проекта ресурсы синхронизируются обратно в UI
if (project.mediaPool && project.mediaPool.items.size > 0) {
  const mediaResources: any[] = []
  const musicResources: any[] = []
  
  project.mediaPool.items.forEach((item) => {
    const resource = {
      id: item.id,
      type: "media",
      name: item.name,
      // ... конвертация MediaPoolItem в Resource
    }
    
    if (item.binId === "music") {
      musicResources.push(resource)
    } else {
      mediaResources.push(resource)
    }
  })
  
  // Сохраняем в localStorage для синхронизации с UI
  localStorage.setItem("timeline-studio-resources", JSON.stringify(resourcesData))
}
```

## Файловая структура

```
backup_dir/
└── temp_project.tlsp  # Автоматически создаваемый временный проект

localStorage:
└── timeline-studio-resources  # Кэш ресурсов для быстрого доступа UI
```

## Поведение по сценариям

### 1. Первый запуск приложения
1. AppSettingsProvider инициализируется
2. Обнаруживает отсутствие открытого проекта
3. Вызывает `loadOrCreateTempProject()`
4. Создает новый проект v2 с именем "Untitled Project"
5. Сохраняет в `backup_dir/temp_project.tlsp`
6. Устанавливает проект как активный и `dirty`

### 2. Повторный запуск приложения
1. AppSettingsProvider инициализируется
2. Вызывает `loadOrCreateTempProject()`
3. Находит существующий `temp_project.tlsp`
4. Загружает проект с сохраненными данными
5. Синхронизирует ресурсы из MediaPool в localStorage
6. UI отображает все сохраненные ресурсы
7. Устанавливает как активный и `dirty`

### 3. Пользователь добавляет медиафайлы
1. ResourcesProvider добавляет файл в свое состояние
2. Сохраняет все ресурсы в localStorage
3. Вызывает `setProjectDirty(true)`
4. Автоматически запускается `autoSaveTempProject()`
5. Ресурсы из localStorage синхронизируются с MediaPool
6. Проект сохраняется в файл

### 4. Пользователь сохраняет проект
1. Вызывается `saveProject("My Project")`
2. Открывается диалог выбора файла
3. Загружается временный проект и его данные
4. Создается новый файл (например, `My Project.tlsp`)
5. Проект больше не является временным
6. `dirty` флаг очищается

### 5. Пользователь открывает другой проект
1. Вызывается `openProject()`
2. Временный проект закрывается
3. Открывается выбранный проект
4. При следующем запуске временный проект снова доступен

## Обработка ошибок

- **Ошибка создания директорий**: Логируется, продолжает работу
- **Ошибка сохранения**: Логируется, но не блокирует работу
- **Ошибка загрузки**: Создается новый временный проект
- **Ошибка автосохранения**: Логируется как предупреждение
- **Ошибка синхронизации**: Данные остаются в localStorage

## Интеграция с существующим кодом

### useCurrentProject Hook
Обновлен для поддержки новых методов:

```typescript
const {
  currentProject,
  createTempProject,
  loadOrCreateTempProject,
  isTempProject,
  setProjectDirty,
  // ... существующие методы
} = useCurrentProject()
```

### ResourcesProvider
Добавлена интеграция с системой проектов:

```typescript
// При любом изменении ресурсов
const handleAddMedia = React.useCallback(
  (file: MediaFile) => {
    send({ type: "ADD_MEDIA", file })
    setProjectDirty(true)  // Триггерит автосохранение
  },
  [send, setProjectDirty],
)
```

### Утилиты синхронизации
Новый модуль `sync-resources-to-project.ts`:
- `syncResourcesToProject()` - синхронизация ресурсов в MediaPool
- `getResourcesFromStorage()` - получение ресурсов из localStorage

## Константы

```typescript
const TEMP_PROJECT_NAME = "Untitled Project"
const TEMP_PROJECT_FILENAME = "temp_project.tlsp"
```

## Тестирование

Для тестирования функционала:
1. Запустите `bun run tauri dev`
2. Добавьте медиафайлы через браузер
3. Проверьте консоль на сообщения "Auto-saving temp project..."
4. Перезагрузите страницу - файлы должны остаться
5. Сохраните проект (Cmd+S) - создастся постоянный проект

## Преимущества

✅ **Никаких потерь данных** - работа сохраняется автоматически  
✅ **Плавный UX** - пользователь сразу может начать работать  
✅ **Мгновенная персистентность** - localStorage как промежуточный буфер  
✅ **Полная синхронизация** - все ресурсы сохраняются в проекте  
✅ **Совместимость** - работает с существующей архитектурой  
✅ **Производительность** - асинхронные операции не блокируют UI  
✅ **Надежность** - множественные fallback механизмы  

## Технические детали реализации

### Поток данных
```
User Action → ResourcesProvider → localStorage → setProjectDirty(true)
                                                        ↓
                                              autoSaveTempProject()
                                                        ↓
                                              Load from localStorage
                                                        ↓
                                              Sync to MediaPool
                                                        ↓
                                              Save .tlsp file
```

### Ключевые файлы
- `app-settings-provider.tsx` - основная логика временного проекта
- `resources-provider.tsx` - управление ресурсами и localStorage
- `resources-machine.ts` - XState машина с инициализацией из localStorage
- `sync-resources-to-project.ts` - утилиты синхронизации

## Будущие улучшения

- Очистка localStorage после успешного сохранения проекта
- Настройка интервала автосохранения
- История изменений временного проекта
- Восстановление после сбоев
- Оптимизация размера localStorage
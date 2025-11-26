# App State

**Русский** | [English](./README.md)

## Обзор

App State - это модуль глобального управления состоянием для Timeline Studio. Предоставляет централизованное управление состоянием для настроек приложения, проектов, медиа библиотеки, избранного и пользовательских предпочтений, используя XState машины и React Context.

## Статус

- ✅ **Компоненты**: MissingFilesDialog компонент (97% покрытие)
- ✅ **Хуки**: Все хуки полностью покрыты (100%)
- ✅ **Сервисы**: AppSettingsMachine (78%), ProjectFileService (99%), StoreService (100%), AppDirectoriesService (92%)
- ✅ **Тесты**: 124 теста

## Структура

```
app-state/
├── components/
│   └── missing-files-dialog.tsx    # Диалог восстановления файлов (97%)
├── hooks/
│   ├── use-app-settings.ts         # Базовый хук
│   ├── use-current-project.ts      # Управление текущим проектом
│   ├── use-recent-projects.ts      # Недавние проекты
│   ├── use-favorites.ts            # Избранное
│   ├── use-media-files.ts          # Медиафайлы
│   └── use-music-files.ts          # Музыкальные файлы
├── services/
│   ├── app-settings-machine.ts     # Машина состояний (78%)
│   ├── app-settings-provider.tsx   # Провайдер контекста (67%)
│   ├── app-directories-service.ts  # Управление директориями (92%)
│   ├── project-file-service.ts     # Операции с файлами проектов (99%)
│   ├── store-service.ts            # Сервис хранения (100%)
│   └── batch-commands.ts           # Пакетное выполнение команд
└── __tests__/
    ├── components/                 # Тесты компонентов
    ├── hooks/                      # Тесты хуков
    └── services/                   # Тесты сервисов
```

## Возможности

### ✅ Реализовано

- [x] AppSettingsMachine - Машина состояний настроек (78% покрытие)
- [x] AppSettingsProvider - Провайдер контекста (67% покрытие)
- [x] AppDirectoriesService - Управление директориями (92% покрытие)
- [x] StoreService - Сервис хранения данных (100% покрытие)
- [x] ProjectFileService - Операции с файлами проектов (99% покрытие)
- [x] BatchCommandBuilder - Выполнение множественных команд пакетом
- [x] MissingFilesDialog - UI восстановления файлов (97% покрытие)
- [x] Типизированные настройки приложения
- [x] Глобальное состояние для всего приложения
- [x] Персистентность пользовательских предпочтений
- [x] Управление проектами (создание, открытие, сохранение)
- [x] Управление медиабиблиотекой
- [x] Система избранного

### ❌ Не реализовано

- [ ] Четкое разделение между настройками приложения и проекта
- [ ] Миграция медиафайлов в отдельный модуль
- [ ] Синхронизация настроек между окнами
- [ ] Резервное копирование и восстановление настроек
- [ ] Импорт/экспорт конфигурации

## Использование

### Базовый доступ к состоянию приложения

```typescript
import { useAppSettings } from "@/features/app-state"

function MyComponent() {
  const { settings, updateSettings } = useAppSettings()

  return <div>Тема: {settings.theme}</div>
}
```

### Управление проектами

```typescript
import { useCurrentProject } from "@/features/app-state"

function ProjectComponent() {
  const { currentProject, createProject, saveProject } = useCurrentProject()

  const handleCreate = async () => {
    await createProject({ name: "Новый проект" })
  }

  const handleSave = async () => {
    await saveProject()
  }
}
```

### Пакетные команды

```typescript
import { useBatchCommands } from "@/features/app-state"

function BatchExample() {
  const { executeBatch, operations, isExecuting } = useBatchCommands()

  const setupTimeline = async () => {
    const result = await operations.setupTimelineWithContent({
      projectName: "Мое видео",
      tracks: 3,
      mediaFiles: ["file1.mp4", "file2.mp4"],
      clips: [/* данные клипов */]
    })
  }
}
```

## Интеграция

- **Зависит от**: `@tauri-apps/api`, `xstate`, UI компоненты
- **Используется в**: Все фичи, требующие доступа к глобальному состоянию

## Тестирование

- **Всего тестов**: 124 теста
- **Общее покрытие**: 57.55%
- **Компоненты**: 97%
- **Сервисы**: 84.25%
- **Хуки**: 100%

### Тестовые наборы

- `project-file-service.test.ts` - Загрузка, сохранение, миграция проектов (20+ тестов)
- `app-directories-service.test.ts` - Управление директориями, операции с кэшем (10 тестов)
- `batch-commands.test.ts` - Выполнение пакетных команд, утилиты (40+ тестов)

### Запуск тестов

```bash
# Запустить все app-state тесты
bun run test src/features/app-state/

# Запустить с покрытием
bun run test:coverage src/features/app-state/

# Запустить в watch режиме
bun run test:watch src/features/app-state/
```

## TODO / Дорожная карта

### Высокий приоритет
- [ ] Увеличить покрытие AppSettingsProvider (текущее 67%)
- [ ] Рефакторинг для устранения смешения ответственностей
- [ ] Четкое разделение между настройками приложения и проекта

### Средний приоритет
- [ ] Синхронизация настроек между окнами
- [ ] Резервное копирование и восстановление настроек
- [ ] Импорт/экспорт конфигурации
- [ ] Миграция медиафайлов в отдельный домен

### Низкий приоритет
- [ ] Инструменты миграции настроек
- [ ] Валидация настроек и версионирование схемы
- [ ] Продвинутый мониторинг пакетных операций

## Известные проблемы

- Смешение ответственностей в app-settings-machine
- Дублирование данных между настройками и проектами
- Плохая изоляция между доменами

## Документация

См. также:
- Управление проектами: `/docs/03_architecture/state-management.md`
- Пакетные команды: Документация сервиса в `services/batch-commands.ts`

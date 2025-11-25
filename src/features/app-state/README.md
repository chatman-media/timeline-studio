# App State - Функциональные требования

## 📋 Статус готовности

- ✅ **Машина состояний**: Полностью реализована
- ✅ **Провайдер**: Полностью реализован
- ✅ **Тесты**: Покрыты тестами
- ✅ **Основная логика**: Глобальное состояние приложения

## API (Backend Commands)

| Command | Parameters | Description |
|---------|------------|-------------|
| `clear_app_cache` | - | Clear application cache |
| `execute_batch_commands` | `{ request: BatchCommandRequest }` | Execute multiple project commands in batch |

## 📊 Покрытие тестами

- **Общее покрытие**: 57.55%
- **Компоненты**: 97%
- **Сервисы**: 84.25%
- **Хуки**: 100% (полностью покрыты)
- **Всего тестов**: 124

## Behavior (from tests) / Поведение (из тестов)

### project-file-service.test.ts (ProjectFileService)
**loadProject:**
- ✓ Should successfully load new project from file
- ✓ Should migrate old project to new format
- ✓ Should throw error on invalid JSON
- ✓ Should throw error when required fields are missing

**saveProject:**
- ✓ Should save project with updated metadata
- ✓ Should throw error on save failure

**createNewProject:**
- ✓ Should create new project with basic structure
- ✓ Should set correct default values

**Compatibility methods:**
- ✓ Should update media library (updateMediaLibrary)
- ✓ Should update browser state (updateBrowserState)
- ✓ Should update project favorites (updateProjectFavorites)

**getProjectStats:**
- ✓ Should return stats for old project format
- ✓ Should return stats for new project format
- ✓ Should correctly handle project without media

**hasUnsavedChanges:**
- ✓ Should detect unsaved changes
- ✓ Should return false when no changes exist

**migrateProject:**
- ✓ Should migrate old project to new format

**Validation:**
- ✓ Should validate empty media file ID in new format
- ✓ Should check project type
- ✓ Should check for missing meta

### app-directories-service.test.ts (AppDirectoriesService)
- ✓ Should return singleton instance
- ✓ Should fetch and cache app directories
- ✓ Should handle errors
- ✓ Should create directories and update cache
- ✓ Should fetch directory sizes
- ✓ Should clear app cache (invoke: clear_app_cache)
- ✓ Should return correct subdirectory path
- ✓ Should throw error if directories not initialized
- ✓ Should format bytes correctly
- ✓ Should handle large sizes

### batch-commands.test.ts
**BatchCommandBuilder:**
- ✓ Should add single command
- ✓ Should add multiple commands
- ✓ Should chain method calls
- ✓ Should set continue on error
- ✓ Should set transaction name
- ✓ Should clear all commands
- ✓ Should execute batch successfully (invoke: execute_batch_commands)
- ✓ Should throw error for empty batch
- ✓ Should pass transaction name to backend
- ✓ Should handle execution errors
- ✓ Should validate result format

**createBatch:**
- ✓ Should create builder without name
- ✓ Should create builder with name

**executeBatch:**
- ✓ Should execute batch of commands
- ✓ Should pass options to builder

**batchOperations:**
- ✓ Should create project with media
- ✓ Should add multiple clips
- ✓ Should delete multiple clips
- ✓ Should apply effect to clips
- ✓ Should create multiple tracks
- ✓ Should setup timeline with content

**batchUtils:**
- ✓ isFullySuccessful - Should return true for fully successful batch
- ✓ isFullySuccessful - Should return false for partial success
- ✓ isFullySuccessful - Should return false for failed batch
- ✓ getErrorMessages - Should extract error messages from results
- ✓ getErrorMessages - Should return empty array for successful batch
- ✓ getSuccessRate - Should calculate success rate
- ✓ getSuccessRate - Should return 0 for no operations
- ✓ getSuccessRate - Should return 100 for fully successful batch
- ✓ formatResult - Should format result as string
- ✓ throwIfFailed - Should not throw for successful batch
- ✓ throwIfFailed - Should throw for failed batch

**useBatchCommands Hook:**
- ✓ Should initialize with default state
- ✓ Should execute batch and update state
- ✓ Should execute builder and update state
- ✓ Should provide operations and utils
- ✓ Should handle execution errors

## 🎯 Основные функции

### ✅ Готово
- [x] AppSettingsMachine - машина состояний настроек (78% покрытие)
- [x] AppSettingsProvider - провайдер контекста (67% покрытие)
- [x] AppDirectoriesService - управление директориями (92% покрытие)
- [x] StoreService - сервис хранения данных (100% покрытие)
- [x] ProjectFileService - работа с файлами проектов (99% покрытие)
- [x] MissingFilesDialog - диалог восстановления файлов (97% покрытие)
- [x] Типизированные настройки приложения
- [x] Хуки для доступа к состоянию:
  - useAppSettings - базовый хук доступа
  - useCurrentProject - управление текущим проектом
  - useRecentProjects - недавние проекты
  - useFavorites - избранные элементы
  - useMediaFiles - медиафайлы
  - useMusicFiles - музыкальные файлы

### ⚠️ Архитектурные проблемы
- Смешение ответственностей в app-settings-machine
- Дублирование данных между настройками и проектами
- Плохая изоляция между доменами

### 📁 Структура модуля
```
app-state/
├── components/
│   └── missing-files-dialog.tsx    # Диалог восстановления файлов (97%)
├── hooks/
│   ├── use-app-settings.ts         # Базовый хук
│   ├── use-current-project.ts      # Текущий проект
│   ├── use-recent-projects.ts      # Недавние проекты
│   ├── use-favorites.ts            # Избранные
│   ├── use-media-files.ts          # Медиафайлы
│   └── use-music-files.ts          # Музыкальные файлы
├── services/
│   ├── app-settings-machine.ts     # Машина состояний (78%)
│   ├── app-settings-provider.tsx   # Провайдер контекста (67%)
│   ├── app-directories-service.ts  # Управление директориями (92%)
│   ├── project-file-service.ts     # Работа с файлами проектов (99%)
│   └── store-service.ts            # Хранилище (100%)
└── __tests__/
    ├── components/                 # Тесты компонентов
    ├── hooks/                      # Тесты хуков
    └── services/                   # Тесты сервисов
```

### ❌ Возможные улучшения
- [ ] Разделение машины состояний на домены
- [ ] Увеличение покрытия AppSettingsProvider (текущее 67%)
- [ ] Рефакторинг для устранения смешения ответственностей
- [ ] Синхронизация настроек между окнами
- [ ] Резервное копирование настроек
- [ ] Импорт/экспорт конфигурации

## 🔄 Интеграция с другими компонентами

### ✅ Реализовано
- [x] Глобальное состояние для всего приложения
- [x] Сохранение пользовательских предпочтений
- [x] Управление проектами (создание, открытие, сохранение)
- [x] Управление медиабиблиотекой
- [x] Система избранного

### ❌ Требует реализации
- [ ] Четкое разделение между настройками приложения и проекта
- [ ] Миграция медиафайлов в отдельный модуль
- [ ] Унификация системы избранного

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/app-state/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Инициализация AppSettingsProvider | ⏳ Planned | - | 🔴 High |
| Команда `clear_app_cache` | ⏳ Planned | - | 🟡 Medium |
| Команда `execute_batch_commands` с одной операцией | ⏳ Planned | - | 🔴 High |
| Команда `execute_batch_commands` с множественными операциями | ⏳ Planned | - | 🔴 High |
| Batch операция с `continue_on_error: false` | ⏳ Planned | - | 🔴 High |
| Batch операция с `continue_on_error: true` | ⏳ Planned | - | 🔴 High |
| Создание проекта через ProjectFileService | ⏳ Planned | - | 🔴 High |
| Загрузка проекта из файла | ⏳ Planned | - | 🔴 High |
| Сохранение проекта | ⏳ Planned | - | 🔴 High |
| Миграция старого формата проекта | ⏳ Planned | - | 🟡 Medium |
| Валидация проекта (некорректный JSON) | ⏳ Planned | - | 🔴 High |
| AppDirectoriesService инициализация | ⏳ Planned | - | 🔴 High |
| Получение размера директорий | ⏳ Planned | - | 🟡 Medium |
| Создание поддиректорий | ⏳ Planned | - | 🟡 Medium |
| MissingFilesDialog отображение и взаимодействие | ⏳ Planned | - | 🔴 High |
| Восстановление отсутствующих файлов | ⏳ Planned | - | 🔴 High |
| Хуки доступа к состоянию (useCurrentProject, useRecentProjects, etc.) | ⏳ Planned | - | 🔴 High |
| StoreService сохранение и загрузка данных | ⏳ Planned | - | 🔴 High |
| Обработка ошибок при работе с файловой системой | ⏳ Planned | - | 🔴 High |

### Приоритеты
- 🔴 High - критичный функционал (проекты, состояние, batch команды)
- 🟡 Medium - важный функционал (директории, кэш, миграция)
- 🟢 Low - дополнительный функционал

### Примечания
- Модуль использует две основные Tauri команды: `clear_app_cache` и `execute_batch_commands`
- `execute_batch_commands` - критичная команда для производительности, требует тщательного тестирования
- Batch операции должны быть протестированы с различными сценариями (success, partial failure, full failure)
- ProjectFileService требует тестирования совместимости форматов проектов
- MissingFilesDialog - важный UX компонент, требует интеграционного тестирования
- Тесты должны покрывать все хуки доступа к состоянию

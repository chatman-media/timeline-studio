# Project Management Domain

## Обзор

Модуль `project-management` - ключевой домен для управления проектами и пользовательскими настройками в Timeline Studio.

## Результаты аудита (2025-11-08)

### ✅ Исправлено

#### 1. TypeScript ошибки (25 → 0)
- ✅ Исправлены типы ProjectState (удалено несуществующее hasUnsavedChanges)
- ✅ Исправлены типы BackendSync (использование геттера connected вместо приватного isConnected)
- ✅ Исправлены типы commands в BackendSync интеграции
- ✅ Исправлены типы в тестах (ProjectSettings, BrowserTab)

#### 2. BackendSync интеграция
- ✅ Убраны некорректные вызовы executeCommand с кастомными типами
- ✅ Используется правильный API BackendSync.getProjectState()
- ✅ Корректная подписка на события через onEvent
- ✅ Проверка подключения через геттер connected

#### 3. Legacy код
- ✅ Нет прямых обращений к @tauri-apps/api
- ✅ Нет использования localStorage/sessionStorage
- ✅ Все операции через BackendSync

#### 4. Тесты
- ✅ Создано 3 test suite (59 тестов total)
- ✅ app-machine.test.ts (11 тестов)
- ✅ user-settings-machine.test.ts (28 тестов)
- ✅ project-management-orchestrator.test.ts (20 тестов)
- ✅ 100% тестов проходят

### 📊 Статистика

**До аудита:**
- TypeScript ошибки: 25
- Тесты: 0
- Legacy код: Присутствовал

**После аудита:**
- TypeScript ошибки: 0
- Тесты: 59 (100% pass)
- Legacy код: Отсутствует

## Архитектура

### Основные компоненты

#### 1. App Machine
- Управляет подключением к backend
- Очередь команд
- Состояние проекта
- Обработка ошибок

#### 2. User Settings Machine
- Пользовательские настройки
- API ключи
- GPU настройки
- Автосохранение

#### 3. Project Management Orchestrator
- Координирует operations
- Управляет акторами
- Автосохранение проектов

#### 4. React Providers
- ProjectProvider - состояние проекта
- UserSettingsProvider - настройки пользователя
- AppStateProvider - состояние приложения

## Использование

```tsx
import { useProject, useUserSettings, useAppState } from "@/domains/project-management"

function MyComponent() {
  const { projectState, saveProject } = useProject()
  const { settings, updateSettings } = useUserSettings()
  const { isConnected } = useAppState()
}
```

## Тестирование

```bash
# Запуск тестов
bun run test src/domains/project-management/__tests__/

# Результаты
Test Files  3 passed (3)
Tests       59 passed (59)
```

## Результаты финализации (2025-11-17)

### ✅ Реализовано

#### 1. Dirty Flag Tracking
- ✅ Добавлены поля `isDirty`, `lastModifiedTime`, `lastSavedTime` в `ProjectManagementContext`
- ✅ Реализованы хелперы `markProjectDirty()` и `markProjectClean()`
- ✅ Автоматическое отслеживание изменений в backend event handlers
- ✅ Интеграция с auto-save для определения несохраненных изменений
- ✅ Метод `markDirty()` в `ProjectProvider` для ручной пометки изменений

#### 2. Улучшенная обработка ошибок
- ✅ User-friendly error messages для всех команд
- ✅ Таймауты команд (30 секунд) с понятными сообщениями
- ✅ Comprehensive try-catch во всех критических местах
- ✅ Error recovery strategies в orchestrator
- ✅ Детальное логирование ошибок с контекстом

#### 3. Метрики производительности
- ✅ `PerformanceMetricsTracker` для мониторинга производительности
- ✅ Command execution time tracking с предупреждениями о медленных командах
- ✅ State update frequency tracking
- ✅ Memory usage tracking (heap usage, peak memory)
- ✅ Performance reports с детальной статистикой
- ✅ Автоматическое логирование при dispose orchestrator

### 📊 Финальная статистика

**Состояние:**
- TypeScript ошибки: 0
- Тесты: 59 (100% pass)
- TODO комментарии: 0 (все решены)
- Готовность: **100%**

**Новые возможности:**
- Dirty flag tracking для умного auto-save
- Enhanced error handling с user-friendly messages
- Performance monitoring для оптимизации
- Command timeout protection (30s)

## Производительность

### Performance Metrics API

```tsx
import { getPerformanceMetricsTracker } from "@/domains/project-management"

// Получить отчет о производительности
const tracker = getPerformanceMetricsTracker()
const report = tracker.getReport()

console.log({
  totalCommands: report.totalCommands,
  averageCommandTime: report.averageCommandTime,
  stateUpdatesPerSecond: report.stateUpdatesPerSecond,
  currentMemoryUsage: report.currentMemoryUsage,
})

// Логировать полный отчет
tracker.logReport()
```

### Доступные метрики

- **Command Metrics**: execution time, success/failure rate, slowest/fastest commands
- **State Update Metrics**: update frequency, average processing time
- **Memory Metrics**: current usage, peak usage, average usage

## Error Handling

### User-Friendly Error Messages

Все команды возвращают понятные пользователю сообщения об ошибках:

```tsx
try {
  await createProject(settings)
} catch (error) {
  // Error message: "Failed to create project. Please check your project settings and try again.
  // Technical details: [backend error]"
  console.error(error.message)
}
```

### Command Timeouts

Команды автоматически прерываются через 30 секунд с понятным сообщением:

```
Command CreateProject timed out after 30000ms. This might indicate a backend issue.
```

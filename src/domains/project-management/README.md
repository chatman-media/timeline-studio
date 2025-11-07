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

## TODO

- [ ] Добавить dirty flag tracking для hasUnsavedChanges
- [ ] Улучшить обработку ошибок в командах
- [ ] Добавить метрики производительности

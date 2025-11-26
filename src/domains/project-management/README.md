# Project Management Domain

Домен для управления проектами, настройками пользователя и состоянием приложения в Timeline Studio.

## Quick Start

```typescript
import {
  useProjectManagement,
  useUserSettings,
  useAppState
} from "@/domains/project-management"

function MyComponent() {
  // Состояние подключения
  const { isConnected } = useAppState()

  // Управление проектом
  const { projectState, saveProject, isDirty } = useProjectManagement()

  // Настройки пользователя
  const { settings, updateSettings } = useUserSettings()
}
```

## Public API

### Hooks
| Hook | Purpose |
|------|---------|
| `useAppState()` | Статус подключения к backend |
| `useProjectManagement()` | Lifecycle проекта (create/open/save/close) |
| `useUserSettings()` | Пользовательские настройки |

### Providers
| Provider | Purpose |
|----------|---------|
| `ProjectManagementProvider` | Главный провайдер (включает все) |
| `AppStateProvider` | Состояние приложения |
| `UserSettingsProvider` | Настройки пользователя |
| `ProjectProvider` | Состояние проекта |

### Services
| Service | Purpose |
|---------|---------|
| `getProjectManagementOrchestrator()` | Singleton координатор |
| `apiKeysService` | Управление API ключами |
| `appDirectoriesService` | Пути директорий приложения |
| `BatchCommandBuilder` | Пакетное выполнение команд |
| `getPerformanceMetricsTracker()` | Мониторинг производительности |

### State Machines
| Machine | Purpose |
|---------|---------|
| `appMachine` | Подключение к backend, очередь команд |
| `userSettingsMachine` | CRUD настроек пользователя |

## Key Features

- **Dirty Flag Tracking** - Отслеживание несохраненных изменений
- **Auto-Save** - Автоматическое сохранение проектов
- **Command Timeout** - 30s timeout с user-friendly ошибками
- **Performance Monitoring** - Метрики выполнения команд
- **Batch Operations** - Транзакционное выполнение команд

## Dependencies

**Internal:**
- `@/features/app-state/services/store-service` - Tauri Store
- `@/types/generated/tauri-bindings` - Generated types

**External:**
- `xstate` v5 - State machines
- `@xstate/react` - React bindings

## Testing

```bash
# Unit tests
bun run test src/domains/project-management/__tests__/

# E2E tests
bun run test:e2e:tauri
```

**Coverage:** 179 tests, 100% критического функционала

## Documentation

| Document | Content |
|----------|---------|
| [API Reference](./docs/API.md) | Полное описание всех экспортов |
| [Architecture](./docs/ARCHITECTURE.md) | Архитектура, диаграммы, design decisions |
| [Changelog](./docs/CHANGELOG.md) | История изменений и результаты аудитов |

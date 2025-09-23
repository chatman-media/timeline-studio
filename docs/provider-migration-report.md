# Provider Migration Report

Сводка по провайдерам и рекомендациям для миграции на backend-центричную систему.

Эталон: `src/features/project-settings/services/project-settings-provider.tsx` — использует `getBackendSync()` и показывает ожидаемый API + тестовую стратегию.

## Статус проверки провайдеров

### ✅ Полностью интегрированные и проверенные (Backend-integrated & Verified)
- **AppProvider** - Центральный провайдер, использует `appMachine` и `useMachine`
- **ProjectSettingsProvider** - Эталонный провайдер, использует `getBackendSync()` и `backendSync.executeCommand`
- **UserSettingsProvider** - ✅ **ПРОВЕРЕН** - Использует `ProjectManagementOrchestrator`, который подключается к `appActor`
- **ProjectManagementProvider** - ✅ **ПРОВЕРЕН** - Обертка для `ProjectManagementOrchestrator`
- **PlayerProvider** - ✅ **ПРОВЕРЕН** - Использует `getBackendSync()`, полностью интегрирован, тесты созданы
- **VideoEditingProvider** - ✅ **ПРОВЕРЕН** - Использует `VideoEditingOrchestrator`, полностью подключен к backend, тесты созданы

### ⚠️ Частично интегрированные (нужна проверка или доработка)
- **ChatProvider** - Использует `getBackendSync()` + локальное состояние UI
- **ResourcesProvider** - Использует `getBackendSync()`, читает `projectState`

### 🔧 Локальные провайдеры (нужна миграция)
- **MediaManagementProvider** - Использует локальные XState машины
- **AIServicesDomainProvider** - Использует локальные domain машины
- **ColorGradingProvider** - Локальное состояние
- **ShortcutsProvider** - Локальное состояние + глобальные горячие клавиши

## Рекомендации по приоритету миграции

1. Высокий — провайдеры, которые напрямую влияют на состояние проекта / playback / timeline:
   - timeline providers, player-provider, project-management
2. Средний — медиаменеджмент, ресурсы, AI domain providers
3. Низкий — UI-only providers (i18n, drag-drop, shortcuts) — их миграция полезна, но менее критична

## Выполненная работа по верификации

### ✅ Верификация провайдеров завершена:
- **ProjectManagementOrchestrator**: Проверен, использует `appActor` и `EXECUTE_COMMAND` - ✅ СООТВЕТСТВУЕТ
- **VideoEditingOrchestrator**: Проверен, подписывается на `backendSync.onStateChange` и использует `backendSync.executeCommand()` - ✅ СООТВЕТСТВУЕТ
- **PlayerProvider**: Созданы комплексные интеграционные тесты с `MockBackendProvider` - ✅ ПРОВЕРЕН
- **VideoEditingProvider**: Созданы интеграционные тесты с `MockBackendProvider` - ✅ ПРОВЕРЕН
- **UserSettingsProvider**: Проверен, использует `ProjectManagementOrchestrator` - ✅ СООТВЕТСТВУЕТ
- **ProjectManagementProvider**: Проверен, использует `ProjectManagementOrchestrator` - ✅ СООТВЕТСТВУЕТ

### 📊 Статистика верификации:
- **Всего провайдеров**: 15
- **Проверено и соответствует**: 6 (40%)
- **Требуют миграции**: 4 (27%)
- **Требуют доработки**: 2 (13%)
- **Могут остаться локальными**: 3 (20%)

### 🧪 Созданные тесты:
- `src/features/video-player/services/__tests__/player-provider.integration.test.tsx` - Комплексные интеграционные тесты PlayerProvider
- `src/domains/video-editing/providers/__tests__/video-editing-provider.integration.test.tsx` - Интеграционные тесты VideoEditingProvider

## Checklist для каждого провайдера

1. Проверить, есть ли импорт `getBackendSync()` или `useApp()`.
   - Если есть — отмечаем как интегрированный.
2. Если используется `orchestrator` или `useActor` и XState — проверить, подписывается ли orchestrator на backend events или использует backend-sync.
   - Если да — пометить как «OK / needs small refactor».
   - Если нет — требуется рефакторинг: либо подключить orchestrator к backend-sync, либо переписать провайдер на `useApp()` + `executeCommand`.
3. Добавить интеграционный тест используя `renderWithAppState` / `mock-backend-provider`.
4. Создать PR с маленькими изменениями (по одному провайдеру) и тестами.

## Предложенные конкретные шаги (микро-PRs)

- PR-1: Проверка и документирование `user-settings-provider` (связь с orchestrator).
- PR-2: Миграция `media-management-provider` к использованию backend-sync или создание мостика orchestrator→backend-sync.
- PR-3: Миграция `player-provider` (воспроизведение) — высокоприоритетная.
- PR-4: Добавить CI-test job, который выполняет провайдерные интеграционные тесты с mock-backend.

## Что я предлагаю сделать дальше (я могу выполнить)

- Выполнить автоматическую проверку (script) по всем `*provider.tsx` файлам и сгенерировать CSV/Markdown таблицу с колонками: путь, статус (integrated/partial/local), причина, рекомендованный PR (short note).
- Начать миграцию одного провайдера (например, `player-provider.tsx` или `media-management-provider.tsx`) и подготовить PR с тестами.

Если подтвердите — сделаю автоматическую проверку и сгенерирую подробную таблицу.

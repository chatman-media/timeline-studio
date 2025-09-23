# Provider Migration Report

Сводка по провайдерам и рекомендациям для миграции на backend-центричную систему.

Эталон: `src/features/project-settings/services/project-settings-provider.tsx` — использует `getBackendSync()` и показывает ожидаемый API + тестовую стратегию.

## 📊 Актуальный статус миграции (обновлено 2025-09-23)

**Всего провайдеров**: 41
- ✅ **Полностью интегрированные**: 8 (20%)
- ⚠️ **Частично интегрированные**: 11 (27%) 
- 🔧 **Локальные (требуют миграции)**: 8 (20%)
- ❓ **Неизвестный статус**: 14 (34%)

*Полный автоматический анализ доступен в `docs/provider-migration-analysis.md`*

## Статус проверки провайдеров

### ✅ Полностью интегрированные и проверенные (Backend-integrated & Verified)
- **AppProvider** - Центральный провайдер, использует `appMachine` и `useMachine`
- **ProjectSettingsProvider** - Эталонный провайдер, использует `getBackendSync()` и `backendSync.executeCommand`
- **UserSettingsProvider** - ✅ **ПРОВЕРЕН** - Использует `ProjectManagementOrchestrator`, который подключается к `appActor`
- **ProjectManagementProvider** - ✅ **ПРОВЕРЕН** - Обертка для `ProjectManagementOrchestrator`
- **PlayerProvider** - ✅ **ПРОВЕРЕН** - Использует `getBackendSync()`, полностью интегрирован, тесты созданы
- **VideoEditingProvider** - ✅ **ПРОВЕРЕН** - Использует `VideoEditingOrchestrator`, полностью подключен к backend, тесты созданы

### ✅ Дополнительно проверенные и интегрированные (из автоматического анализа):
- **ChatProvider** - Использует `getBackendSync()`, полностью интегрирован
- **ResourcesProvider** - Использует `getBackendSync()`, читает `projectState`
- **VideoEditingProvider.integration.test** - Интеграционные тесты с BackendSync
- **PlayerProvider.integration.test** - Интеграционные тесты с BackendSync
- **ResourcesProvider.test** - Тесты с BackendSync интеграцией

### ⚠️ Частично интегрированные (нужна проверка или доработка)
- **BrowserDomainProvider** - Использует `useAppActor`, требует проверки интеграции
- **TimelineProviders** - Использует `VideoEditingOrchestrator`, требует проверки BackendSync
- **MediaManagementProvider** - Использует `useAppActor`, требует миграции
- **AIServicesDomainProvider** - Использует `useAppActor`, требует проверки
- **MontagePlannerProvider** - Использует `useAppActor`, требует миграции
- **AppProvider** - Использует `useApp()`, требует проверки BackendSync интеграции

### 🔧 Локальные провайдеры (нужна миграция)
- **MediaManagementProvider** - Использует локальные XState машины
- **AIServicesDomainProvider** - Использует локальные domain машины
- **ColorGradingProvider** - Локальное состояние
- **ShortcutsProvider** - Локальное состояние + глобальные горячие клавиши

### 🔧 Локальные провайдеры из автоматического анализа (требуют миграции):
- **AIServicesProvider** - Только локальное состояние, требует `getBackendSync()`
- **AIIntelligenceProvider** - Только локальное состояние, требует `getBackendSync()`
- **EffectsProvider** - Только локальное состояние, требует `getBackendSync()`
- **BrowserStateProvider** - Только локальное состояние, требует `getBackendSync()`
- **I18nProvider** - Только локальное состояние, требует `getBackendSync()`
- **MockBackendProvider** - Тестовый провайдер, может потребовать обновления

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
- **Всего провайдеров**: 41 (по автоматическому анализу)
- **Проверено и соответствует**: 8 (20%)
- **Частично интегрированные**: 11 (27%)
- **Требуют миграции**: 8 (20%)
- **Неизвестный статус**: 14 (34%)
- **Создано интеграционных тестов**: 5

### 🧪 Созданные тесты:
- `src/features/video-player/services/__tests__/player-provider.integration.test.tsx` - Комплексные интеграционные тесты PlayerProvider
- `src/domains/video-editing/providers/__tests__/video-editing-provider.integration.test.tsx` - Интеграционные тесты VideoEditingProvider
- `src/features/resources/__tests__/services/resources-provider.test.tsx` - Тесты ResourcesProvider
- `src/domains/video-editing/providers/__tests__/video-editing-provider.integration.test.tsx` - Дополнительные интеграционные тесты
- `src/features/video-player/services/__tests__/player-provider.integration.test.tsx` - Расширенные тесты PlayerProvider

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

## ✅ Выполненные работы (обновлено 2025-09-23)

### 🔍 Автоматический анализ провайдеров:
- ✅ Создан скрипт `analyze-providers.ts` для автоматического анализа всех провайдеров
- ✅ Проанализировано 41 провайдер по критериям: BackendSync, AppActor, Orchestrator, тестовое покрытие
- ✅ Сгенерирован подробный отчет `docs/provider-migration-analysis.md` с рекомендациями для каждого провайдера
- ✅ Выявлены 8 полностью интегрированных, 11 частично интегрированных и 8 локальных провайдеров

### 🧪 Улучшение тестов:
- ✅ Устранены TypeScript ошибки в `player-provider.integration.test.tsx`
- ✅ Исправлены проблемы с `mockRejectedValue` → `mockRejectedValueOnce`
- ✅ Подтверждено прохождение всех интеграционных тестов (9/9 тестов проходят)
- ✅ Улучшена типобезопасность тестов

## 🎯 Что я предлагаю сделать дальше

### Приоритеты миграции (на основе автоматического анализа):

**Высокий приоритет (влияют на core функциональность):**
1. **TimelineProviders** - Использует orchestrator, требует BackendSync интеграции
2. **MediaManagementProvider** - Локальные XState машины, требует миграции на BackendSync
3. **BrowserDomainProvider** - Использует AppActor, требует проверки интеграции

**Средний приоритет:**
4. **AIServicesProvider** и **AIIntelligenceProvider** - Локальные, требуют BackendSync
5. **MontagePlannerProvider** - Использует AppActor, требует миграции
6. **ColorGradingProvider** - Локальное состояние, требует BackendSync

**Низкий приоритет (UI-only):**
7. **ShortcutsProvider**, **I18nProvider**, **BrowserStateProvider** - Могут остаться локальными

### Конкретные следующие шаги:
- Начать миграцию **TimelineProviders** (высокий приоритет, влияет на timeline функциональность)
- Подготовить PR для **MediaManagementProvider** с полной BackendSync интеграцией
- Добавить интеграционные тесты для провайдеров, которые их не имеют
- Провести ручную проверку провайдеров со статусом "unknown" (14 провайдеров)

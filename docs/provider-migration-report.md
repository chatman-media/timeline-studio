# Provider Migration Report

Сводка по провайдерам и рекомендациям для миграции на backend-центричную систему.

Эталон: `src/features/project-settings/services/project-settings-provider.tsx` — использует `getBackendSync()` и показывает ожидаемый API + тестовую стратегию.

## Классификация (кратко)

- Backend-integrated / ready
  - src/features/app-state/services/app-provider.tsx — главный AppProvider, цель интеграции
  - src/features/project-settings/services/project-settings-provider.tsx — эталон (использует backend-sync)
  - src/features/app-state/testing/mock-backend-provider.tsx — mock для тестов

- Частично интегрированные (нужна проверка)
  - src/features/user-settings/services/user-settings-provider.tsx — использует ProjectManagementOrchestrator; нужно проверить, использует ли orchestrator backend-sync (если да — провайдер OK).
  - src/domains/project-management/providers/project-management-provider.tsx — использует project-management-orchestrator (проверить интеграцию).

- Domain-local / frontend machines (миграция рекомендована)
  - src/domains/media-management/providers/media-management-provider.tsx — локальные XState машины (fileOperations, mediaImport)
  - src/domains/ai-services/providers/ai-services-domain-provider.tsx — локальные XState машины / orchestrator
  - src/domains/system-integration/providers/system-integration-provider.tsx — использует orchestrator (локальный)
  - src/features/ai-chat/services/chat-provider.tsx
  - src/features/video-player/services/player-provider.tsx
  - src/features/modals/services/modal-provider.tsx
  - src/features/resources/services/resources-provider.tsx
  - src/features/color-grading/services/color-grading-provider.tsx
  - прочие domain providers (timeline, undo-redo, timeline-providers и т.д.)

## Рекомендации по приоритету миграции

1. Высокий — провайдеры, которые напрямую влияют на состояние проекта / playback / timeline:
   - timeline providers, player-provider, project-management
2. Средний — медиаменеджмент, ресурсы, AI domain providers
3. Низкий — UI-only providers (i18n, drag-drop, shortcuts) — их миграция полезна, но менее критична

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

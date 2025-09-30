# Provider Migration Table

Таблица миграции провайдеров на backend-центричную систему. Основана на анализе 41 провайдера.

## 📊 Сводка по категориям

| Категория | Количество | Процент | Статус |
|-----------|------------|---------|---------|
| ✅ Полностью интегрированные | 8 | 20% | Готовы к использованию |
| ⚠️ Частично интегрированные | 11 | 27% | Требуют доработки |
| 🔧 Локальные (требуют миграции) | 8 | 20% | Требуют полной миграции |
| ❓ Неизвестный статус | 14 | 34% | Требуют анализа |
| **Всего** | **41** | **100%** | - |

## 🎯 Приоритеты миграции

### 🔴 Высокий приоритет (Core функциональность)
Провайдеры, влияющие на основное состояние проекта, воспроизведение и timeline:

| Провайдер | Статус | Тип интеграции | Рекомендации |
|-----------|--------|----------------|--------------|
| TimelineProviders | ⚠️ Частично | Orchestrator | Подключить BackendSync |
| MediaManagementProvider | 🔧 Локальный | Локальные XState | Миграция на BackendSync |
| BrowserDomainProvider | ⚠️ Частично | AppActor | Проверить интеграцию |

### 🟡 Средний приоритет (AI и медиа сервисы)

| Провайдер | Статус | Тип интеграции | Рекомендации |
|-----------|--------|----------------|--------------|
| AIServicesProvider | 🔧 Локальный | Локальное состояние | Добавить BackendSync |
| AIIntelligenceProvider | 🔧 Локальный | Локальное состояние | Добавить BackendSync |
| MontagePlannerProvider | ⚠️ Частично | AppActor | Проверить и мигрировать |
| ColorGradingProvider | 🔧 Локальный | Локальное состояние | Добавить BackendSync |

### 🟢 Низкий приоритет (UI-only)

| Провайдер | Статус | Тип интеграции | Рекомендации |
|-----------|--------|----------------|--------------|
| ShortcutsProvider | 🔧 Локальный | Локальное состояние | Не критично |
| I18nProvider | 🔧 Локальный | Локальное состояние | Не критично |
| BrowserStateProvider | 🔧 Локальный | Локальное состояние | Не критично |

## ✅ Полностью интегрированные (8)

| Провайдер | Файл | BackendSync | AppActor | Orchestrator | Тесты | Статус |
|-----------|------|-------------|----------|--------------|--------|---------|
| AppProvider | `src/domains/app/providers/app-provider.tsx` | ❌ | ✅ | ❌ | Нет | Центральный провайдер |
| ProjectSettingsProvider | `src/features/project-settings/services/project-settings-provider.tsx` | ✅ | ❌ | ❌ | Нет | Эталонный провайдер |
| UserSettingsProvider | `src/features/user-settings/services/user-settings-provider.tsx` | ❌ | ✅ | ✅ | Нет | ✅ ПРОВЕРЕН |
| ProjectManagementProvider | `src/domains/project-management/providers/project-management-provider.tsx` | ❌ | ❌ | ✅ | Нет | ✅ ПРОВЕРЕН |
| PlayerProvider | `src/features/video-player/services/player-provider.tsx` | ✅ | ❌ | ❌ | ✅ | ✅ ПРОВЕРЕН |
| VideoEditingProvider | `src/domains/video-editing/providers/video-editing-provider.tsx` | ❌ | ❌ | ✅ | ✅ | ✅ ПРОВЕРЕН |
| ChatProvider | `src/features/ai-chat/services/chat-provider.tsx` | ✅ | ❌ | ❌ | Нет | Интегрирован |
| ResourcesProvider | `src/features/resources/services/resources-provider.tsx` | ✅ | ❌ | ❌ | ✅ | Интегрирован |

## ⚠️ Частично интегрированные (11)

| Провайдер | Файл | BackendSync | AppActor | Orchestrator | Рекомендации | Приоритет |
|-----------|------|-------------|----------|--------------|--------------|-----------|
| BrowserDomainProvider | `src/domains/browser/providers/browser-domain-provider.tsx` | ❌ | ✅ | ❌ | Проверить интеграцию | Высокий |
| TimelineProviders | `src/domains/video-editing/providers/timeline-providers.tsx` | ❌ | ❌ | ✅ | Подключить BackendSync | Высокий |
| VideoEditingProvider | `src/domains/video-editing/providers/video-editing-provider.tsx` | ❌ | ❌ | ✅ | Подключить BackendSync | Средний |
| AIServicesDomainProvider | `src/domains/ai-services/providers/ai-services-domain-provider.tsx` | ❌ | ✅ | ❌ | Проверить интеграцию | Средний |
| MontagePlannerProvider | `src/features/montage-planner/services/montage-planner-provider.tsx` | ❌ | ✅ | ❌ | Проверить и мигрировать | Средний |
| project-management-provider | `src/domains/project-management/providers/project-management-provider.tsx` | ❌ | ❌ | ✅ | Проверить orchestrator | Средний |

## 🔧 Локальные (требуют миграции) (8)

| Провайдер | Файл | Текущее состояние | Рекомендации | Приоритет |
|-----------|------|-------------------|--------------|-----------|
| MediaManagementProvider | `src/domains/media-management/providers/media-management-provider.tsx` | Локальные XState машины | Миграция на BackendSync | Высокий |
| AIServicesProvider | `src/domains/ai-services/providers/ai-services-provider.tsx` | Локальное состояние | Добавить BackendSync | Средний |
| AIIntelligenceProvider | `src/domains/ai-services/providers/ai-intelligence-provider.tsx` | Локальное состояние | Добавить BackendSync | Средний |
| EffectsProvider | `src/domains/effects/providers/effects-provider.tsx` | Локальное состояние | Добавить BackendSync | Средний |
| ColorGradingProvider | `src/features/color-grading/services/color-grading-provider.tsx` | Локальное состояние | Добавить BackendSync | Низкий |
| ShortcutsProvider | `src/domains/shortcuts/providers/shortcuts-provider.tsx` | Локальное состояние + горячие клавиши | Не критично | Низкий |
| I18nProvider | `src/i18n/services/i18n-provider.tsx` | Локальное состояние | Не критично | Низкий |
| BrowserStateProvider | `src/domains/browser/providers/browser-state-provider.tsx` | Локальное состояние | Не критично | Низкий |

## ❓ Неизвестный статус (14)

Требуют ручного анализа:

| Провайдер | Файл | Необходимые действия |
|-----------|------|---------------------|
| MockBackendProvider | `src/domains/shared/test/mock-backend-provider.tsx` | Проверить необходимость обновления |
| DragDropProvider | `src/features/timeline/components/drag-drop-provider.tsx` | Анализ интеграции |
| ExportProvider | `src/domains/export/providers/export-provider.tsx` | Анализ интеграции |
| KeyboardShortcutsProvider | `src/domains/keyboard/providers/keyboard-shortcuts-provider.tsx` | Анализ интеграции |
| UndoRedoProvider | `src/domains/video-editing/providers/undo-redo-provider.tsx` | Проверить orchestrator |
| SystemIntegrationProvider | `src/domains/system-integration/providers/system-integration-provider.tsx` | Проверить интеграцию |
| ModalProvider | `src/features/modals/services/modal-provider.tsx` | Анализ интеграции |
| TauriMockProvider | `src/features/media-studio/services/tauri-mock-provider.tsx` | Анализ необходимости |
| и другие... | | |

## 📋 Checklist для миграции

### Для каждого провайдера:

1. **Анализ текущего состояния:**
   - [ ] Проверить использование `getBackendSync()` или `useApp()`
   - [ ] Проверить использование orchestrator или XState машин
   - [ ] Определить тип интеграции (BackendSync/AppActor/Orchestrator/Local)

2. **План миграции:**
   - [ ] Для локальных: добавить `getBackendSync()`
   - [ ] Для orchestrator: подключить к backend-sync
   - [ ] Для AppActor: проверить интеграцию

3. **Тестирование:**
   - [ ] Добавить unit тесты
   - [ ] Добавить интеграционные тесты с `MockBackendProvider`
   - [ ] Использовать `renderWithAppState` для тестирования

4. **Верификация:**
   - [ ] Проверить прохождение всех тестов
   - [ ] Проверить интеграцию с backend
   - [ ] Обновить документацию

## 🎯 Рекомендуемые PR (по приоритету)

### PR-1: Высокий приоритет
- **TimelineProviders**: подключение BackendSync
- **MediaManagementProvider**: миграция с локальных XState на BackendSync
- **BrowserDomainProvider**: проверка и документирование интеграции

### PR-2: Средний приоритет
- **AIServicesProvider**: добавление BackendSync
- **AIIntelligenceProvider**: добавление BackendSync
- **MontagePlannerProvider**: миграция с AppActor на BackendSync

### PR-3: Тестирование
- Добавить недостающие unit тесты для всех провайдеров
- Добавить интеграционные тесты с MockBackendProvider
- Создать CI job для провайдерных тестов

## 📊 Прогресс миграции

```
[====================----------------------------] 45%
 20% интегрировано, 27% частично, 20% требуют миграции
```

## 🏆 Эталонные провайдеры

**Backend-integrated (эталон):** `src/features/project-settings/services/project-settings-provider.tsx`
- Использует `getBackendSync()`
- Использует `backendSync.executeCommand`
- Использует `onStateChange` для подписки

**Orchestrator-backed (эталон):** `src/features/user-settings/services/user-settings-provider.tsx`
- Использует `getProjectManagementOrchestrator()`
- Orchestrator подключается к `appActor`
- Отправляет `EXECUTE_COMMAND`

*Последнее обновление: 2025-09-23*

---

**Ссылка на полный отчет:** [provider-migration-report.md](provider-migration-report.md)  
**Ссылка на детальный анализ:** [provider-migration-analysis.md](provider-migration-analysis.md)


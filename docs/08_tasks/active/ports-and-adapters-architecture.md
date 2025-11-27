# Ports & Adapters (Hexagonal) Architecture

## Цель
Сделать frontend независимым от Tauri, чтобы приложение могло работать с разными backend-ами (Tauri, Node.js API, браузер для тестов).

## Статус: В процессе

## Выполнено

### 1. Core модуль ✅
- [x] Создан `src/core/ports/` с интерфейсами:
  - `backend.port.ts` - IBackendService для команд и событий
  - `platform.port.ts` - IPlatformService для диалогов, буфера обмена, shell, path утилит
  - `storage.port.ts` - IStorageService для localStorage/Tauri Store
  - `event.port.ts` - IEventService для подписки на события
- [x] Создан `src/core/container.ts` - ServiceContainer singleton для DI
- [x] Создан `src/core/types.ts` - Re-export типов из tauri-bindings
- [x] Создан `src/core/index.ts` - Главные экспорты (container, getBackend, etc.)

### 2. Tauri адаптеры ✅
- [x] `src/adapters/tauri/backend-sync.ts` - Перенесённый BackendSync
- [x] `src/adapters/tauri/backend.ts` - TauriBackendService (обёртка над BackendSync)
- [x] `src/adapters/tauri/platform.ts` - TauriPlatformService (Tauri plugins)
- [x] `src/adapters/tauri/storage.ts` - TauriStorageService (Tauri Store plugin)
- [x] `src/adapters/tauri/event.ts` - TauriEventService (Tauri events)
- [x] `src/adapters/tauri/index.ts` - initTauriApp() функция

### 3. Mock адаптеры (для тестов/браузера) ✅
- [x] `src/adapters/mock/backend.ts` - MockBackendService (in-memory)
- [x] `src/adapters/mock/platform.ts` - MockPlatformService (browser APIs)
- [x] `src/adapters/mock/storage.ts` - MockStorageService (localStorage)
- [x] `src/adapters/mock/event.ts` - MockEventService (in-memory event emitter)
- [x] `src/adapters/mock/index.ts` - initMockApp() функция

### 4. React интеграция ✅
- [x] `src/adapters/react/app-init-provider.tsx` - AppInitProvider для автоматической инициализации
- [x] Блокирует рендеринг children до инициализации контейнера
- [x] Интегрирован в providers chain

### 5. Миграция оркестраторов ✅
- [x] `BrowserOrchestrator` - использует container.getBackend()
- [x] `MediaManagementOrchestrator` - использует container.getBackend()
- [x] `VideoEditingOrchestrator` - использует container.getBackend()
- [x] `SystemIntegrationOrchestrator` - использует container.getBackend()
- [x] `ProjectManagementOrchestrator` - использует app-machine

### 6. Миграция app-machine ✅
- [x] Удалён backend из context
- [x] `backendConnection` actor получает backend из container в runtime
- [x] `executeCommand` actor получает backend из container в runtime
- [x] Исправлены тесты app-machine

### 7. Миграция хуков ✅
- [x] `use-media-import.ts` - использует container.getBackend()
- [x] `use-ai-director-chat.ts` - использует container.getBackend()

### 8. Обратная совместимость ✅
- [x] `src/features/app-state/services/backend-sync.ts` - re-export из adapters/tauri

## В процессе

### 9. Исправление оставшихся тестов ✅
- [x] Проверить и исправить тесты, которые используют старые импорты
- [x] Обновить моки в тестах для использования нового @/core
- [x] Все 11646 тестов проходят

## В процессе

### 10. Миграция features hooks на @/core

#### Выполнено ✅
- [x] `src/features/media/hooks/use-simple-media-processor.ts` - использует container.getPlatform()
- [x] `src/features/app-state/services/timeline-studio-project-service.ts` - использует container.getPlatform()
- [x] `src/features/transitions/hooks/use-transitions-import.ts` - использует container.getPlatform()
- [x] `src/features/filters/hooks/use-filters-import.ts` - использует container.getPlatform()
- [x] `src/features/templates/hooks/use-templates-import.ts` - использует container.getPlatform()
- [x] `src/features/style-templates/hooks/use-style-templates-import.ts` - использует container.getPlatform()
- [x] `src/features/effects/hooks/use-effects-import.ts` - использует container.getPlatform()
- [x] `src/features/export/hooks/use-social-export.ts` - использует container.getPlatform()
- [x] `src/features/export/hooks/use-export-settings.ts` - использует container.getPlatform()
- [x] `src/features/ai-director/utils/montage-plan-io.ts` - использует container.getPlatform()
- [x] `src/features/subtitles/hooks/use-subtitles-import.ts` - использует container.getPlatform()
- [x] `src/features/app-state/services/project-file-service.ts` - использует container.getPlatform()
- [x] `src/features/browser/hooks/use-audio-file-manager.ts` - использует container.getPlatform()
- [x] `src/features/subtitles/hooks/use-subtitles-export.ts` - использует container.getPlatform()
- [x] `src/features/media/components/media-scanner.tsx` - использует container.getPlatform()
- [x] `src/features/export/components/batch-export-tab.tsx` - использует container.getPlatform()
- [x] `src/features/color-grading/components/lut/lut-section.tsx` - использует container.getPlatform()
- [x] `src/features/export/hooks/use-render-queue.ts` - использует container.getPlatform()
- [x] `src/features/transcription/components/enhanced-transcription-panel.tsx` - использует container.getPlatform()
- [x] `src/features/user-settings/components/tabs/general-settings-tab.tsx` - использует container.getPlatform()
- [x] `src/features/media/utils/saved-media-utils.ts` - использует container.getPlatform() для path утилит

#### Расширены порты ✅
- [x] `IPlatformService` - добавлены path утилиты: `basename()`, `dirname()`, `join()`
- [x] `TauriPlatformService` - реализованы path утилиты через `@tauri-apps/api/path`
- [x] `MockPlatformService` - реализованы path утилиты с кросс-платформенной логикой

#### Обновлены тесты ✅
- [x] `use-transitions-import.test.ts` - мокирует @/core
- [x] `use-filters-import.test.ts` - мокирует @/core
- [x] `use-templates-import.test.ts` - мокирует @/core
- [x] `use-style-templates-import.test.ts` - мокирует @/core
- [x] `montage-plan-io.test.ts` - мокирует @/core
- [x] `use-simple-media-processor.test.ts` - мокирует @/core
- [x] `timeline-studio-project-service.test.ts` - мокирует @/core
- [x] `use-subtitles-export.test.ts` - мокирует @/core
- [x] `batch-export-tab.test.tsx` - мокирует @/core

### 11. Миграция событий (IEventService) ✅
- [x] Создан `src/core/ports/event.port.ts` - IEventService интерфейс
- [x] Создан `src/adapters/tauri/event.ts` - TauriEventService
- [x] Создан `src/adapters/mock/event.ts` - MockEventService
- [x] Обновлён `src/core/container.ts` - добавлен registerEvent/getEvent/hasEvent
- [x] `src/features/media/hooks/use-media-processor.ts` - использует container.getEvent()
- [x] `src/features/ai-director/hooks/use-ai-director-analysis-v2.ts` - использует container.getEvent()
- [x] `src/features/montage-planner/services/montage-planner-provider.tsx` - использует container.getEvent()

## Осталось сделать

### 12. Tauri-специфичные функции (не мигрируются)
- `src/features/keyboard-shortcuts/services/tauri-global-shortcuts.ts` - использует `@tauri-apps/plugin-global-shortcut` для системных глобальных hotkeys. Это нативная функция ОС, не может быть абстрагирована.

**Примечание**:
- Тестовые файлы продолжают использовать моки Tauri для тестирования (нормально)

### 13. Документация ✅
- [x] Создан `docs/03_architecture/frontend/ports-and-adapters.md` с полным описанием
- [x] Добавлены примеры создания новых адаптеров (Electron пример)
- [x] Документирован процесс тестирования и мокирования
- [x] Добавлены ссылки в README файлы архитектуры

### 14. Тестирование ✅
- [x] `src/core/__tests__/container.test.ts` - 15 тестов для DI контейнера
- [x] `src/adapters/mock/__tests__/event.test.ts` - 16 тестов для MockEventService
- [x] `src/adapters/mock/__tests__/platform.test.ts` - 36 тестов для MockPlatformService
- [ ] Проверить работу в браузере без Tauri (опционально)
- [ ] E2E тесты с mock backend (опционально)

## Архитектура

```
src/
├── core/                     # Ядро - интерфейсы и контейнер
│   ├── ports/                # Интерфейсы (порты)
│   │   ├── backend.port.ts   # IBackendService - команды к бэкенду
│   │   ├── platform.port.ts  # IPlatformService - диалоги, файлы, shell
│   │   ├── storage.port.ts   # IStorageService - localStorage/Tauri Store
│   │   └── event.port.ts     # IEventService - подписка на события
│   ├── container.ts          # DI контейнер
│   ├── types.ts              # Общие типы
│   └── index.ts              # Экспорты
│
├── adapters/                 # Реализации (адаптеры)
│   ├── tauri/                # Tauri реализация
│   │   ├── backend-sync.ts   # BackendSync класс
│   │   ├── backend.ts        # TauriBackendService
│   │   ├── platform.ts       # TauriPlatformService
│   │   ├── storage.ts        # TauriStorageService
│   │   ├── event.ts          # TauriEventService
│   │   └── index.ts          # initTauriApp()
│   │
│   ├── mock/                 # Mock для тестов/браузера
│   │   ├── backend.ts        # MockBackendService
│   │   ├── platform.ts       # MockPlatformService
│   │   ├── storage.ts        # MockStorageService
│   │   ├── event.ts          # MockEventService
│   │   └── index.ts          # initMockApp()
│   │
│   └── react/                # React интеграция
│       └── app-init-provider.tsx
│
├── domains/                  # Доменная логика (использует core)
├── features/                 # Фичи (используют domains и core)
└── ...
```

## Преимущества

1. **Тестируемость** - можно тестировать без Tauri
2. **Портируемость** - легко добавить другие backend-ы (Node.js, Electron)
3. **Разделение ответственности** - чёткие границы между слоями
4. **Dependency Injection** - сервисы регистрируются в контейнере

## Changelog

- 2024-11-27: Создана базовая архитектура Ports & Adapters
- 2024-11-27: Мигрированы все оркестраторы на DI container
- 2024-11-27: Исправлен AppInitProvider для блокировки рендеринга
- 2024-11-27: Исправлен app-machine для получения backend из container
- 2024-11-27: Исправлены моки в тестах project-management (все 11646 тестов проходят)
- 2024-11-27: use-version-control.ts мигрирован на @/adapters/tauri
- 2024-11-27: Отключены тесты recording (voice/camera временно отключены)
- 2025-11-27: Мигрированы ещё 5 файлов на container.getPlatform() (subtitles-export, media-scanner, batch-export-tab, lut-section, use-render-queue)
- 2025-11-27: Обновлены 2 теста для использования @/core моков (use-subtitles-export.test.ts, batch-export-tab.test.tsx)
- 2025-11-27: Мигрированы enhanced-transcription-panel.tsx и general-settings-tab.tsx на container.getPlatform()
- 2025-11-27: Итого в features осталось 5 source файлов с прямыми Tauri импортами (20 файлов всего, 15 из них тесты)
- 2025-11-27: Добавлены path утилиты в IPlatformService (basename, dirname, join)
- 2025-11-27: Мигрирован saved-media-utils.ts на container.getPlatform()
- 2025-11-27: Итого в features осталось 4 source файлов (19 файлов всего, 15 тестов)
- 2025-11-27: Создан IEventService порт для подписки на события
- 2025-11-27: Созданы TauriEventService и MockEventService адаптеры
- 2025-11-27: Мигрированы use-media-processor.ts, use-ai-director-analysis-v2.ts, montage-planner-provider.tsx на container.getEvent()
- 2025-11-27: Миграция source файлов завершена (остался только tauri-global-shortcuts.ts - Tauri-специфичный)
- 2025-11-27: Создана документация docs/03_architecture/frontend/ports-and-adapters.md
- 2025-11-27: Добавлены unit-тесты: container (15), MockEventService (16), MockPlatformService (36) - всего 67 тестов

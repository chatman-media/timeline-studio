# Ports & Adapters (Hexagonal) Architecture

## Цель
Сделать frontend независимым от Tauri, чтобы приложение могло работать с разными backend-ами (Tauri, Node.js API, браузер для тестов).

## Статус: В процессе

## Выполнено

### 1. Core модуль ✅
- [x] Создан `src/core/ports/` с интерфейсами:
  - `backend.port.ts` - IBackendService для команд и событий
  - `platform.port.ts` - IPlatformService для диалогов, буфера обмена, shell
  - `storage.port.ts` - IStorageService для localStorage/Tauri Store
- [x] Создан `src/core/container.ts` - ServiceContainer singleton для DI
- [x] Создан `src/core/types.ts` - Re-export типов из tauri-bindings
- [x] Создан `src/core/index.ts` - Главные экспорты (container, getBackend, etc.)

### 2. Tauri адаптеры ✅
- [x] `src/adapters/tauri/backend-sync.ts` - Перенесённый BackendSync
- [x] `src/adapters/tauri/backend.ts` - TauriBackendService (обёртка над BackendSync)
- [x] `src/adapters/tauri/platform.ts` - TauriPlatformService (Tauri plugins)
- [x] `src/adapters/tauri/storage.ts` - TauriStorageService (Tauri Store plugin)
- [x] `src/adapters/tauri/index.ts` - initTauriApp() функция

### 3. Mock адаптеры (для тестов/браузера) ✅
- [x] `src/adapters/mock/backend.ts` - MockBackendService (in-memory)
- [x] `src/adapters/mock/platform.ts` - MockPlatformService (browser APIs)
- [x] `src/adapters/mock/storage.ts` - MockStorageService (localStorage)
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

### 9. Исправление оставшихся тестов
- [ ] Проверить и исправить тесты, которые используют старые импорты
- [ ] Обновить моки в тестах для использования нового @/core

## Осталось сделать

### 10. Полная миграция domain hooks
- [ ] Проверить все хуки в domains/ на использование старого BackendSync
- [ ] Мигрировать на container.getBackend()

### 11. Миграция features hooks
- [ ] `use-recognition-preview.ts` - всё ещё импортирует commands напрямую
- [ ] `use-render-queue.ts` - всё ещё импортирует commands напрямую
- [ ] `use-montage-backend.ts` - всё ещё импортирует commands напрямую
- [ ] Другие хуки с прямыми Tauri импортами

### 12. Документация
- [ ] Обновить ARCHITECTURE.md с описанием Ports & Adapters
- [ ] Добавить примеры создания новых адаптеров
- [ ] Документировать процесс тестирования без Tauri

### 13. Тестирование
- [ ] Добавить интеграционные тесты для MockBackendService
- [ ] Проверить работу в браузере без Tauri
- [ ] E2E тесты с mock backend

## Архитектура

```
src/
├── core/                     # Ядро - интерфейсы и контейнер
│   ├── ports/                # Интерфейсы (порты)
│   │   ├── backend.port.ts
│   │   ├── platform.port.ts
│   │   └── storage.port.ts
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
│   │   └── index.ts          # initTauriApp()
│   │
│   ├── mock/                 # Mock для тестов/браузера
│   │   ├── backend.ts        # MockBackendService
│   │   ├── platform.ts       # MockPlatformService
│   │   ├── storage.ts        # MockStorageService
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

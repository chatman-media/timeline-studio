# FEOD App Layer Implementation

**Дата:** 2025-12-05
**Статус:** Внедрено

## Обзор

Внедрение уровня App (Config) из архитектурного подхода FEOD (Fractal Entity Oriental Design) для Timeline Studio.

## Что такое App Layer

App Layer - это самый верхний уровень в иерархии FEOD:
- Точка входа приложения (entry point)
- Композиция всех провайдеров
- Конфигурация приложения (theme, i18n, routing)
- **Критическое правило:** НИКТО не импортирует из App (кроме entry point - layout)

## Структура `/src/config/`

```
/src/config/
├── README.md                      # Документация уровня
└── providers/                     # Композиция провайдеров
    ├── index.ts                   # Экспорт (только для layout!)
    └── app-providers.tsx          # Главная композиция
```

## Архитектура Timeline Studio

### Orchestrator Pattern + DI Container

Timeline Studio использует продвинутую архитектуру с паттерном Orchestrator:

```
┌─────────────────────────────────────────────────────────┐
│  App Layer (/src/config/)                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │ App Providers Composition                          │ │
│  │                                                     │ │
│  │  [1] TauriMockProvider  → Моки Tauri API          │ │
│  │  [2] AppInitProvider    → DI Container Init        │ │
│  │       ↓                                            │ │
│  │       ├─ IBackendService   (Tauri commands/events)│ │
│  │       ├─ IPlatformService  (Platform info)        │ │
│  │       └─ IStorageService   (File system)          │ │
│  │                                                     │ │
│  │  [3] Config Providers   → I18n, Theme, Modal      │ │
│  │                                                     │ │
│  │  [4] Domain Providers   → With Orchestrators      │ │
│  │       ↓                                            │ │
│  │       AppProvider              (ProjectMgmtOrch.) │ │
│  │       MediaManagementProvider  (MediaMgmtOrch.)   │ │
│  │       BrowserProvider          (BrowserOrch.)     │ │
│  │       TimelineProvider         (VideoEditOrch.)   │ │
│  │       PlayerProvider                              │ │
│  │       ChatProvider                                │ │
│  │       MCPProvider                                 │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────┐
│  Orchestrators                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ - ProjectManagementOrchestrator                    │ │
│  │ - MediaManagementOrchestrator                      │ │
│  │ - BrowserOrchestrator                              │ │
│  │ - VideoEditingOrchestrator                         │ │
│  │ - SystemIntegrationOrchestrator                    │ │
│  │                                                     │ │
│  │ Используют:                                        │ │
│  │ - IBackendService из DI контейнера                 │ │
│  │ - XState machines для управления состоянием        │ │
│  │ - Event-driven взаимодействие                      │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Поток данных

1. **Инициализация:**
   ```
   TauriMockProvider → Устанавливает моки для browser режима
   AppInitProvider → Регистрирует адаптеры в DI контейнере
   Domain Providers → Создают orchestrators с backend из DI
   ```

2. **Runtime:**
   ```
   UI Component → Hook → Domain Provider → Orchestrator → Backend Service
                                              ↓
                                         XState Machine
                                              ↓
                                      State Update → UI
   ```

3. **Backend Events:**
   ```
   Tauri Backend → IBackendService → Orchestrator → Event Handler
                                          ↓
                                    Update Machine State
                                          ↓
                                    Notify Subscribers → UI Update
   ```

## Критически важный порядок провайдеров

### [1] Инфраструктурные (обязательно первыми)

```tsx
TauriMockProvider    // Моки Tauri API для browser режима
AppInitProvider      // Инициализация DI контейнера
```

**Почему первыми:**
- `TauriMockProvider` должен установить моки до того как другие провайдеры попытаются использовать Tauri API
- `AppInitProvider` блокирует рендеринг до инициализации DI контейнера
- Все доменные провайдеры зависят от `IBackendService` из DI контейнера

### [2] Легкие конфигурационные

```tsx
I18nProvider         // Локализация (не блокирует рендер)
ThemeProvider        // Тема приложения
ModalProvider        // Управление модальными окнами
```

**Особенности:**
- Не блокируют рендеринг children
- Не зависят от backend
- Могут использоваться до полной инициализации доменов

### [3] Доменные с Orchestrators

```tsx
AppProvider                  // ProjectManagementOrchestrator
ProjectSettingsProvider      // Настройки проекта
MediaManagementProvider      // MediaManagementOrchestrator
ResourcesProvider            // Ресурсы (effects/filters)
BrowserProvider              // BrowserOrchestrator
TimelineProvider             // VideoEditingOrchestrator
PlayerProvider               // Видеоплеер
ChatProvider                 // AI чат
MCPProvider                  // MCP интеграция
```

**Зависимости:**
- Требуют `IBackendService` из DI контейнера (через `AppInitProvider`)
- Создают orchestrators при инициализации
- Orchestrators запускают XState machines
- Подписываются на backend events через `IBackendService`

## Подключение в приложении

### Layout (единственное место импорта)

```tsx
// src/app/layout.tsx
import { Providers } from '@/config/providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### ⚠️ Правило изоляции App Layer

```tsx
// ❌ НЕПРАВИЛЬНО - импорт из config в компонентах
import { Providers } from '@/config/providers'

// ✅ ПРАВИЛЬНО - используйте хуки из features/domains
import { useMediaManagement } from '@/domains/media-management'
import { useTimeline } from '@/domains/video-editing'
```

## Что было перемещено

### Из `/src/features/media-studio/services/` → `/src/config/providers/`

- ✅ `providers.tsx` → `app-providers.tsx`
- ✅ Добавлена подробная документация в комментариях
- ✅ Старый файл оставлен с deprecation warning

### Что осталось на своих местах

- ✅ `ThemeProvider` в `/src/features/media-studio/components/top-bar/theme/`
  - Импортируется только в app-providers
  - Простая обёртка вокруг next-themes

- ✅ `I18nProvider` в `/src/i18n/services/`
  - Импортируется только в app-providers
  - Простая обёртка вокруг react-i18next

**Почему не перенесли:**
Эти провайдеры уже правильно используются - только в app-providers. Перенос в `/src/config/` был бы излишним и нарушил бы существующую организацию кода без реальной пользы.

## Преимущества архитектуры

### 1. Чёткое разделение ответственности
- **Config Layer** - только композиция и конфигурация
- **Domains** - бизнес-логика и orchestrators
- **Features** - UI компоненты и хуки

### 2. Управляемые зависимости
- DI Container даёт явный контроль над зависимостями
- Легко подменить адаптеры для тестирования
- Orchestrators получают backend через инъекцию

### 3. Event-Driven Architecture
- Backend события обрабатываются централизованно
- Orchestrators координируют взаимодействие доменов
- XState машины обеспечивают предсказуемость состояний

### 4. Тестируемость
- Легко мокировать backend через DI
- Orchestrators тестируются изолированно
- Провайдеры можно заменить для тестов

### 5. Масштабируемость
- Новые домены добавляются как провайдеры
- Orchestrators инкапсулируют сложность
- Чёткая структура упрощает onboarding

## Проверка соблюдения правил

```bash
# Проверить что config импортируется только в layout
grep -r "from.*@/config" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "src/app/layout.tsx" \
  | grep -v "src/config/" \
  | grep -v "src/features/media-studio/services/providers.tsx"  # deprecated файл

# Если команда вернула файлы - это ошибка!
# Config можно импортировать ТОЛЬКО в layout.tsx
```

## FEOD иерархия (снизу вверх)

```
┌──────────────────────────────────────────────┐
│  5. App (Config) ✅ ВНЕДРЕНО                 │  ← Вы здесь
│     /src/config/                             │
│     - Композиция провайдеров                 │
│     - Конфигурация приложения                │
│     - НИКТО не импортирует (кроме layout)    │
├──────────────────────────────────────────────┤
│  4. Pages                                    │
│     /src/app/                                │
│     - Next.js страницы                       │
│     - Импортирует из Modules и App           │
├──────────────────────────────────────────────┤
│  3. Modules (Features/Domains)               │
│     /src/features/, /src/domains/            │
│     - Бизнес-логика и orchestrators          │
│     - Публичный API через index              │
├──────────────────────────────────────────────┤
│  2. Common                                   │
│     /src/components/, /src/lib/, /src/hooks/ │
│     - Переиспользуемые компоненты            │
│     - Утилиты без бизнес-логики              │
├──────────────────────────────────────────────┤
│  1. Global ✅ ВНЕДРЕНО                       │
│     /src/global/                             │
│     - Типы, CSS переменные, polyfills        │
│     - Работает через side-effects            │
└──────────────────────────────────────────────┘
```

## Следующие шаги

По концепции FEOD следующие уровни для рефакторинга:
1. ✅ **Global** - реализовано
2. **Common** - строгая изоляция (убрать barrel exports из lib/components)
3. **Modules** - публичные API через index.ts для каждой фичи
4. **Pages** - уже реализовано (Next.js app directory)
5. ✅ **App** - реализовано

## Дополнительные материалы

- [Статья о FEOD](https://habr.com/ru/companies/sportmaster_lab/articles/972410/)
- `/src/config/README.md` - подробная документация
- `/docs/03_architecture/overview.md` - общая архитектура
- `/docs/03_architecture/feod-global-layer.md` - Global Layer

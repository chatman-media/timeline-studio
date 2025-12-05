# Config Layer - Структура (App Level)

## 📁 Актуальная структура

```
src/config/
│
├── 📄 README.md                      Полная документация
├── 📄 STRUCTURE.md                   Эта справка
│
└── 📂 providers/                     Композиция провайдеров
    ├── index.ts                      Экспорт (только для layout!)
    └── app-providers.tsx             Главная композиция
```

## 🎯 Как работает

### Единственное место импорта

```tsx
// ✅ ПРАВИЛЬНО - только в layout.tsx
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

### ❌ НЕ импортируйте в других местах!

```tsx
// ❌ НЕПРАВИЛЬНО - импорт в компонентах
import { Providers } from '@/config/providers'

// ✅ ПРАВИЛЬНО - используйте хуки из domains/features
import { useMediaManagement } from '@/domains/media-management'
import { useTimeline } from '@/domains/video-editing'
import { useTheme } from 'next-themes'
```

## 🏗️ Архитектура через Orchestrators

Timeline Studio использует **Orchestrator Pattern** с **DI Container**:

```
[1] ИНФРАСТРУКТУРНЫЕ
    TauriMockProvider          → Моки Tauri (browser режим)
    AppInitProvider            → DI Container инициализация
        ↓
        ├─ IBackendService     (Tauri commands/events)
        ├─ IPlatformService    (Platform info)
        └─ IStorageService     (File system)

[2] ЛЕГКИЕ КОНФИГУРАЦИОННЫЕ
    I18nProvider               → Локализация
    ThemeProvider              → Тема приложения
    ModalProvider              → Модальные окна

[3] ДОМЕННЫЕ (используют orchestrators)
    AppProvider                → ProjectManagementOrchestrator
    MediaManagementProvider    → MediaManagementOrchestrator
    BrowserProvider            → BrowserOrchestrator
    TimelineProvider           → VideoEditingOrchestrator
    PlayerProvider             → Видеоплеер
    ChatProvider               → AI чат
    MCPProvider                → MCP интеграция
```

**⚠️ ВАЖНО:** Доменные провайдеры зависят от `AppInitProvider`!
Их orchestrators используют `IBackendService` из DI контейнера.

## 📊 Поток данных

### Инициализация
```
TauriMockProvider
    ↓ (устанавливает моки)
AppInitProvider
    ↓ (регистрирует адаптеры в DI)
Domain Providers
    ↓ (создают orchestrators с backend)
Orchestrators
    ↓ (запускают XState machines)
Ready для UI
```

### Runtime
```
UI Component
    ↓ (вызывает)
Hook (useMediaManagement, useTimeline, etc.)
    ↓ (обращается к)
Domain Provider
    ↓ (использует)
Orchestrator
    ↓ (обновляет)
XState Machine
    ↓ (нотифицирует)
Subscribers → UI Update
```

### Backend Events
```
Tauri Backend
    ↓ (отправляет событие)
IBackendService
    ↓ (передаёт в)
Orchestrator
    ↓ (обрабатывает через)
Event Handler
    ↓ (обновляет)
Machine State
    ↓ (триггерит)
UI Re-render
```

## ⚠️ Критические правила

### НЕ делайте этого:

```tsx
// ❌ Импорт в компонентах
import { Providers } from '@/config/providers'

// ❌ Использование провайдеров напрямую
import { MediaManagementProvider } from '@/domains/media-management'
function MyComponent() {
  return (
    <MediaManagementProvider>
      {/* ... */}
    </MediaManagementProvider>
  )
}

// ❌ Изменение порядка провайдеров
// Порядок КРИТИЧЕСКИ важен для работы orchestrators!
```

### Делайте это вместо:

```tsx
// ✅ Используйте хуки из domains
import { useMediaManagement } from '@/domains/media-management'
import { useTimeline } from '@/domains/video-editing'

function MyComponent() {
  const { importMedia } = useMediaManagement()
  const { addClip } = useTimeline()

  // Работайте с данными через хуки
}

// ✅ Импортируйте Providers только в layout
// src/app/layout.tsx
import { Providers } from '@/config/providers'
```

## 🔍 Проверка правил

```bash
# Найти все импорты из config (должен быть только layout.tsx)
grep -r "from.*@/config" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "src/app/layout.tsx" \
  | grep -v "src/config/" \
  | grep -v "deprecated"

# Если команда вернула результаты - это ошибка архитектуры!
```

## 📚 FEOD уровни

```
App (Config) ✅        ← Вы здесь
    ↓ импортирует
Pages (/src/app/)
    ↓ импортирует
Modules (Features/Domains)
    ↓ импортирует
Common (Lib/Components)
    ↓ использует
Global (Types/CSS)
```

## 📖 См. также

- `README.md` - полная документация
- `/docs/03_architecture/feod-app-layer.md` - архитектурное решение
- `/src/global/README.md` - Global Layer
- [FEOD статья](https://habr.com/ru/companies/sportmaster_lab/articles/972410/)

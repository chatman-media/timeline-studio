# Config Layer (App Level - FEOD Architecture)

**Уровень Config (App)** - самый верхний уровень в иерархии FEOD, точка входа приложения.

## 🚫 Критическое правило

**НИКТО не импортирует из `/src/config/` кроме `/src/app/layout.tsx`!**

```ts
// ❌ НЕПРАВИЛЬНО - импорт из config в компонентах/features
import { Providers } from '@/config/providers'
import { theme } from '@/config/theme'

// ✅ ПРАВИЛЬНО - только в layout.tsx
// src/app/layout.tsx
import { Providers } from '@/config/providers'
```

## 📁 Структура

```
/src/config/
├── README.md                # Эта документация
├── providers/               # Композиция всех провайдеров
│   ├── app-providers.tsx   # Главный композитный провайдер
│   └── provider-types.ts   # Типы провайдеров
├── theme/                   # Theme конфигурация
│   └── theme-provider.tsx  # Theme setup и context
└── i18n/                    # i18n конфигурация
    └── i18n-provider.tsx   # i18n setup и provider
```

## 🎯 Назначение

App Layer (Config) отвечает за:
1. **Композицию провайдеров** - собирает все контексты в правильном порядке
2. **Конфигурацию приложения** - theme, i18n, роутинг
3. **Инициализацию** - setup и bootstrap логика
4. **Точку входа** - главный layout использует этот уровень

## 📋 Что должно быть здесь

### ✅ Правильно размещать в Config:

- **Композиция провайдеров** - объединение всех Context Providers
- **Theme setup** - конфигурация темы и её провайдер
- **i18n setup** - конфигурация локализации
- **Router configuration** - настройка роутера (если не Next.js)
- **Global error boundaries** - обработчики ошибок верхнего уровня
- **Analytics setup** - инициализация аналитики
- **Feature flags setup** - конфигурация фич

### ❌ НЕ должно быть здесь:

- **Бизнес-логика** → `/src/features/` (Modules)
- **UI компоненты** → `/src/components/` (Common)
- **Утилиты** → `/src/lib/` (Common)
- **Страницы** → `/src/app/` (Pages)
- **API роуты** → `/src/app/api/` (Pages)

## 🔧 Как использовать

### В Layout (единственное место импорта)

```tsx
// src/app/layout.tsx
import { Providers } from '@/config/providers/app-providers'

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

### В компонентах (НЕ импортируйте из config!)

```tsx
// ✅ ПРАВИЛЬНО - используйте хуки из features
import { useTheme } from '@/features/media-studio/hooks/use-theme'

// ❌ НЕПРАВИЛЬНО - не импортируйте провайдеры из config
import { ThemeProvider } from '@/config/theme/theme-provider'
```

## 📊 Порядок провайдеров (критически важно!)

Timeline Studio использует **Orchestrator Pattern** с **DI Container**:

### Архитектура:
```
TauriMockProvider          → Моки Tauri API (browser режим)
    ↓
AppInitProvider           → Инициализация DI контейнера
    ↓                       (регистрирует IBackendService, IPlatformService)
Domain Providers          → Провайдеры с Orchestrators
    ↓                       (используют backend из DI контейнера)
Orchestrators             → Координируют домены через XState machines
    ↓                       (MediaManagementOrchestrator, ProjectManagementOrchestrator, etc.)
XState Machines           → Управляют состоянием домена
```

### Порядок провайдеров:

**1. Инфраструктурные (обязательно первыми):**
- `TauriMockProvider` - моки Tauri для browser режима
- `AppInitProvider` - инициализация DI контейнера с адаптерами

**2. Легкие провайдеры конфигурации:**
- `I18nProvider` - локализация
- `ThemeProvider` - тема приложения
- `ModalProvider` - управление модальными окнами

**3. Доменные провайдеры (используют orchestrators):**
- `AppProvider` (ProjectManagementOrchestrator) - управление проектами
- `ProjectSettingsProvider` - настройки проекта
- `MediaManagementProvider` (MediaManagementOrchestrator) - управление медиа
- `ResourcesProvider` - ресурсы (эффекты, фильтры)
- `BrowserProvider` (BrowserOrchestrator) - медиа браузер
- `TimelineProvider` (VideoEditingOrchestrator) - timeline редактор
- `PlayerProvider` - видеоплеер
- `ChatProvider` - AI чат
- `MCPProvider` - MCP интеграция

⚠️ **Важно:** Доменные провайдеры зависят от `AppInitProvider` т.к. их orchestrators используют `IBackendService` из DI контейнера!

См. комментарии в `providers/app-providers.tsx` для деталей.

## 🎯 Принципы FEOD для App Layer

По концепции FEOD:
- **App** - самый верхний уровень
- Импортирует из всех нижних уровней (Modules, Common, Global)
- НИКТО не импортирует из App (кроме entry point - layout)
- Отвечает за композицию и конфигурацию
- Не содержит бизнес-логики

## 🔄 Миграция

При переносе кода в Config:

1. **Проверьте** - это действительно конфигурация приложения?
   - Композиция провайдеров? → Config ✅
   - Theme/i18n setup? → Config ✅
   - Бизнес-логика? → Features ❌
   - UI компонент? → Components ❌

2. **Переместите** файл в правильную подпапку `/src/config/`

3. **Обновите импорты** только в `/src/app/layout.tsx`

4. **Удалите импорты** из config во всех других местах

## 🚨 Проверка соблюдения правил

```bash
# Проверить что config импортируется только в layout
grep -r "from.*@/config" src/ --include="*.ts" --include="*.tsx" | grep -v "src/app/layout.tsx"

# Если команда вернула файлы - это ошибка!
# Config можно импортировать ТОЛЬКО в layout.tsx
```

## 📚 См. также

- `/src/global/README.md` - Global layer
- `/docs/03_architecture/feod-app-layer.md` - Архитектурное решение
- [FEOD статья](https://habr.com/ru/companies/sportmaster_lab/articles/972410/)

## Иерархия FEOD (снизу вверх)

```
┌─────────────────────────────────────┐
│  App (Config)   ← Вы здесь          │ Точка входа, никто не импортирует
├─────────────────────────────────────┤
│  Pages                              │ Страницы из модулей
├─────────────────────────────────────┤
│  Modules (Features)                 │ Бизнес-логика
├─────────────────────────────────────┤
│  Common (Components, Lib)           │ Переиспользуемое
├─────────────────────────────────────┤
│  Global                             │ Типы, CSS, polyfills
└─────────────────────────────────────┘
```

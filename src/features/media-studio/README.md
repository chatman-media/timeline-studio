# Media Studio Module

[🇷🇺 Русская версия](./README.ru.md) | [🇺🇸 English version](./README.md)

## 📋 Overview

Media Studio is the main module of the Timeline Studio application that combines all editor components into a unified interface. The module provides the root application component, layout system, and state providers.

## 🏗️ Architecture

### Module Structure

```
src/features/media-studio/
├── components/
│   ├── media-studio.tsx          # Root component
│   └── layout/
│       ├── default-layout.tsx    # Default layout
│       ├── vertical-layout.tsx   # Vertical layout
│       ├── options-layout.tsx    # Layout with options panel
│       ├── chat-layout.tsx       # Layout with AI chat
│       ├── layout-previews.tsx   # Layout selection component
│       └── layouts-markup.tsx    # Visual layout previews
├── hooks/
│   └── use-auto-load-user-data.ts # Auto-load user data
├── services/
│   └── providers.tsx             # Global providers
└── __tests__/                    # Component tests
```

## 🎯 Core Features

### MediaStudio Component

The root application component that:
- Initializes all providers via `Providers`
- Renders the selected layout based on user settings
- Manages automatic user data loading
- Displays loading state

### Layout System

#### DefaultLayout
- Classic layout with browser on the left, video in the center, timeline at the bottom
- Adaptive to panel visibility through `useUserSettings`

#### VerticalLayout
- Vertical arrangement with video on the right
- Optimized for working with vertical content

#### OptionsLayout
- Includes options panel on the right
- Adaptive show/hide for options panel

#### ChatLayout
- Integrates AI chat on the right
- Supports all panel visibility combinations

### Hooks

#### useAutoLoadUserData
- Automatic loading of media files on startup
- Project directory scanning (currently disabled, may be re-enabled later)
- Validation and addition of resources (effects, filters, transitions)
- Support for non-Tauri environments (web version)

### Providers

The `Providers` component combines all necessary context providers:
- `AppStateProvider` - global application state
- `UserSettingsProvider` - user preferences
- `ModalProvider` - modal dialog management
- `CommandProvider` - hotkey handling
- Other feature providers

## 🔌 Integration

### Used Modules
- `@/features/top-bar` - top control panel
- `@/features/browser` - media file browser
- `@/features/timeline` - timeline
- `@/features/video-player` - video player
- `@/features/ai-chat` - AI assistant
- `@/features/options` - options panel
- `@/features/user-settings` - user settings
- `@/features/modals` - modal windows

### API

```typescript
// Main component
export function MediaStudio(): JSX.Element

// Providers
export function Providers({ children }: PropsWithChildren): JSX.Element

// Hooks
export function useAutoLoadUserData(): {
  isLoading: boolean
  error: Error | null
  data: UserData | null
}
```

## 🧪 Testing

The module has complete test coverage:
- **65 tests** in 9 files
- Tests for components, layouts, hooks, and services
- Mocks for all external dependencies
- Integration tests for providers

## 📝 Usage Examples

```tsx
// In the application root
import { MediaStudio } from '@/features/media-studio'

function App() {
  return <MediaStudio />
}
```

## API (Backend Commands)

Media Studio module does not invoke Tauri commands directly. It orchestrates other modules that may use:
- File system operations (via `@/features/media`)
- Project management (via `@/domains/project`)
- Resources loading (via `@/features/resources`)

See individual module README files for specific backend commands.

## Behavior (from tests) / Поведение (из тестов)

### providers.test.tsx
- ✓ Должен рендерить children через провайдеры
- ✓ Должен рендерить все провайдеры в правильном порядке
- ✓ TauriMockProvider должен быть первым в цепочке
- ✓ AppProvider должен быть после TauriMockProvider
- ✓ TimelineProvider должен быть в цепочке
- ✓ Должен правильно композировать провайдеры
- ✓ Должен передавать children через всю цепочку
- ✓ Должен рендерить множественные и вложенные компоненты
- ✓ Должен работать без children или с undefined
- ✓ Каждый провайдер должен быть независимым
- ✓ Не должен создавать лишних ререндеров
- ✓ Должен обрабатывать edge cases (пустая строка, число, массив как children)

### use-auto-load-user-data.test.ts
- ✓ Должен объединять состояние загрузки из обоих хуков (media и resources)
- ✓ Должен показывать isLoading=true если media загружается
- ✓ Должен показывать isLoading=true если resources загружаются
- ✓ Должен возвращать ошибки из mediaHook или resourcesHook
- ✓ Должен правильно объединять loadedData (media, music, effects, transitions, filters)
- ✓ Должен вызывать reload обоих хуков параллельно
- ✓ Reload и clearCache должны быть стабильными функциями между рендерами
- ✓ Должен работать при различных комбинациях состояний хуков

### use-auto-load-resources.test.ts
- ✓ Должен возвращать начальное состояние
- ✓ Должен предоставлять функцию reload для ресурсов
- ✓ Должен загружать effects, transitions, filters, subtitles, styleTemplates

### use-auto-load-media.test.ts
- ✓ Должен загружать медиафайлы при монтировании
- ✓ Должен обрабатывать ошибки загрузки
- ✓ Должен предоставлять статистику загрузки (media и music counts)

### layout tests (default-layout.test.tsx, vertical-layout.test.tsx, etc.)
- ✓ Должен рендерить TopBar, Browser, VideoPlayer, Timeline
- ✓ Должен адаптироваться к visibility настройкам панелей
- ✓ Должен рендерить OptionsPanel в options-layout
- ✓ Должен рендерить AiChat в chat-layout
- ✓ Должен показывать/скрывать панели по флагам

## 🚀 Future Improvements

- [ ] Custom user layouts
- [ ] Save and restore layout states
- [ ] Layout switching animations
- [ ] Dynamic component loading for optimization
- [ ] Plugin architecture for extensions

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/media-studio/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Инициализация MediaStudio компонента | ⏳ Planned | - | 🔴 High |
| Рендеринг всех провайдеров (Providers) | ⏳ Planned | - | 🔴 High |
| Загрузка DefaultLayout | ⏳ Planned | - | 🔴 High |
| Загрузка VerticalLayout | ⏳ Planned | - | 🟡 Medium |
| Загрузка OptionsLayout | ⏳ Planned | - | 🟡 Medium |
| Загрузка ChatLayout | ⏳ Planned | - | 🟡 Medium |
| Переключение между layouts | ⏳ Planned | - | 🔴 High |
| Автозагрузка медиафайлов (useAutoLoadUserData) | ⏳ Planned | - | 🔴 High |
| Автозагрузка ресурсов (effects, filters, transitions) | ⏳ Planned | - | 🔴 High |
| Показ/скрытие Browser панели | ⏳ Planned | - | 🟡 Medium |
| Показ/скрытие Options панели | ⏳ Planned | - | 🟡 Medium |
| Показ/скрытие Timeline панели | ⏳ Planned | - | 🟡 Medium |
| Интеграция всех провайдеров (AppState, UserSettings, Modal) | ⏳ Planned | - | 🔴 High |
| Обработка состояния загрузки | ⏳ Planned | - | 🟡 Medium |
| Обработка ошибок загрузки | ⏳ Planned | - | 🟡 Medium |
| Композиция вложенных провайдеров | ⏳ Planned | - | 🟢 Low |
| Layout preview компонент | ⏳ Planned | - | 🟢 Low |

### Приоритеты
- 🔴 High - критичный функционал, тестировать первым
- 🟡 Medium - важный функционал
- 🟢 Low - дополнительный функционал

### Примечания
- Модуль является оркестратором и не вызывает Tauri команды напрямую
- Интегрирует другие модули, которые используют Tauri API:
  - `@/features/media` - файловые операции
  - `@/domains/project` - управление проектами
  - `@/features/resources` - загрузка ресурсов
- Тестирование фокусируется на композиции провайдеров и layouts
- Автозагрузка данных происходит через дочерние модули
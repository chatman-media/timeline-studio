# Browser Domain

Управление состоянием браузера медиафайлов и ресурсов в Timeline Studio.

## Quick Start

```typescript
import { BrowserProvider, useBrowser } from "@/domains/browser"

// Провайдер в корне приложения
function App() {
  return (
    <BrowserProvider>
      <YourApp />
    </BrowserProvider>
  )
}

// Использование в компоненте
function MediaBrowser() {
  const {
    activeTab,
    currentTabSettings,
    selectedFiles,
    switchTab,
    setSearchQuery,
    selectFile
  } = useBrowser()

  return (
    <div>
      <TabBar activeTab={activeTab} onSwitch={switchTab} />
      <SearchInput
        value={currentTabSettings.search_query}
        onChange={(q) => setSearchQuery(q)}
      />
      <FileGrid
        selectedFiles={selectedFiles}
        onSelect={selectFile}
      />
    </div>
  )
}
```

## Public API

### Hooks
| Hook | Purpose |
|------|---------|
| `useBrowser()` | Полный доступ к браузеру |
| `useBrowserState()` | Алиас для useBrowser |

### Provider
| Provider | Purpose |
|----------|---------|
| `BrowserProvider` | Event-driven провайдер с BackendSync |

### State Machine
| Export | Purpose |
|--------|---------|
| `browserMachine` | XState машина для состояния |
| `createBrowserActor()` | Создание актора машины |
| `handleBrowserBackendEvent` | Обработчик backend событий |

### Constants
| Constant | Value |
|----------|-------|
| `DEFAULT_TAB` | `"media"` |
| `BROWSER_TABS` | `["media", "effects", "filters", "transitions", "templates", "style_templates"]` |

## Key Features

- **Event-Driven** - Синхронизация через backend события
- **Optimistic Updates** - Мгновенный отклик UI
- **Per-Tab Settings** - Независимые настройки для каждой вкладки
- **File Selection** - Multi-select с Set<string>
- **XState Machine** - Предсказуемое управление состоянием

## Browser Tabs

| Tab | Content |
|-----|---------|
| `media` | Видео, аудио, изображения |
| `effects` | Видеоэффекты |
| `filters` | Фильтры изображения |
| `transitions` | Переходы |
| `templates` | Multi-camera layouts |
| `style_templates` | Intro/outro шаблоны |

## Dependencies

**Internal:**
- `@/features/app-state/services/backend-sync` - BackendSync
- `@/types/generated/tauri-bindings` - Tauri types/commands

**External:**
- `xstate` v5 - State machines
- `@xstate/react` - React bindings

## Testing

```bash
bun run test src/domains/browser/__tests__/
```

## Documentation

| Document | Content |
|----------|---------|
| [API Reference](./docs/API.md) | Полное описание API |
| [Architecture](./docs/ARCHITECTURE.md) | Event-driven архитектура |
| [Changelog](./docs/CHANGELOG.md) | История изменений |

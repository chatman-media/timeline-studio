# Media Studio

**English** | [Русский](./README.ru.md)

## Overview

Media Studio is the main orchestrator module of Timeline Studio that combines all editor components into a unified interface. Provides the root application component, layout system, and global state providers.

## Status

- ✅ **Components**: MediaStudio, 4 layouts (Default, Vertical, Options, Chat), LayoutPreviews
- ✅ **Hooks**: useAutoLoadUserData (media and resources auto-loading)
- ✅ **Services**: Providers (global context composition)
- ✅ **Tests**: 65 tests passing across 9 files

## Structure

```
media-studio/
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

## Features

### ✅ Implemented

- [x] Root MediaStudio component with provider composition
- [x] 4 layout options (Default, Vertical, Options, Chat)
- [x] Automatic media and resources loading on startup
- [x] Adaptive panel visibility (Browser, Timeline, Options, Chat)
- [x] Global state providers (AppState, UserSettings, Modal, Timeline, etc.)
- [x] Loading state management
- [x] Layout switching via user settings

### ❌ Not Implemented

- [ ] Custom user layouts
- [ ] Save and restore layout states
- [ ] Layout switching animations
- [ ] Dynamic component loading for optimization
- [ ] Plugin architecture for extensions

## Usage

### Root Application

```tsx
import { MediaStudio } from '@/features/media-studio'

function App() {
  return <MediaStudio />
}
```

### Providers Composition

```tsx
import { Providers } from '@/features/media-studio'

function CustomApp() {
  return (
    <Providers>
      <YourCustomComponents />
    </Providers>
  )
}
```

### Auto-Load Hook

```typescript
import { useAutoLoadUserData } from '@/features/media-studio'

function MyComponent() {
  const { isLoading, error, data } = useAutoLoadUserData()

  if (isLoading) return <Spinner />
  if (error) return <Error message={error.message} />

  return <div>Loaded: {data.media.length} files</div>
}
```

## Layout System

### DefaultLayout
- Classic layout with browser on the left, video in the center, timeline at the bottom
- Adaptive to panel visibility through `useUserSettings`

### VerticalLayout
- Vertical arrangement with video on the right
- Optimized for working with vertical content

### OptionsLayout
- Includes options panel on the right
- Adaptive show/hide for options panel

### ChatLayout
- Integrates AI chat on the right
- Supports all panel visibility combinations

## Integration

- **Depends on**:
  - `@/features/top-bar` - Top control panel
  - `@/features/browser` - Media file browser
  - `@/features/timeline` - Timeline
  - `@/features/video-player` - Video player
  - `@/features/ai-chat` - AI assistant
  - `@/features/options` - Options panel
  - `@/features/user-settings` - User settings
  - `@/features/modals` - Modal windows

- **Used by**:
  - Root `App` component in Next.js
  - All Timeline Studio features through provider context

## Testing

- **Total tests**: 65 tests in 9 files
- **Coverage**: Components, layouts, hooks, and services
- **Test files**:
  - `providers.test.tsx` (12 tests)
  - `use-auto-load-user-data.test.ts` (8 tests)
  - `default-layout.test.tsx`, `vertical-layout.test.tsx`, etc.

```bash
# Run all tests
bun test src/features/media-studio/

# Run specific test
bun test src/features/media-studio/__tests__/services/providers.test.tsx
```

## Provider Composition

The `Providers` component combines all necessary context providers:
- `TauriMockProvider` - Tauri API mocking for tests
- `ProjectManagementProvider` - Global application state
- `UserSettingsProvider` - User preferences
- `ModalProvider` - Modal dialog management
- `TimelineProvider` - Timeline state
- `CommandProvider` - Hotkey handling
- Other feature providers

## TODO / Roadmap

- [ ] **Custom Layouts** - User-defined layout configurations
- [ ] **Layout State Persistence** - Save and restore layout states per project
- [ ] **Layout Animations** - Smooth transitions when switching layouts
- [ ] **Dynamic Loading** - Code splitting for layout components
- [ ] **Plugin Architecture** - Extension system for custom panels
- [ ] **E2E Tests** - Complete E2E test coverage
  - MediaStudio component initialization
  - Layout switching flow
  - Auto-load functionality with Tauri integration
  - Panel visibility toggle
  - Provider composition validation

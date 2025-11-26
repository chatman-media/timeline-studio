# Keyboard Shortcuts

**English** | [Русский](./README.ru.md)

## Overview

Keyboard shortcuts management module for Timeline Studio. Provides centralized shortcut registry, conflict resolution, preset system (Timeline Studio, Adobe Premiere Pro, Wondershare Filmora), export/import functionality, and integration with global shortcuts via Tauri.

## Status

- ✅ **Components**: ShortcutHandler, KeyboardShortcutsModal, ConflictIndicator, ShortcutsCheatSheet
- ✅ **Hooks**: useShortcuts, usePanelShortcuts
- ✅ **Services**: ShortcutsRegistry (singleton), ShortcutsProvider, TauriGlobalShortcuts
- ✅ **Tests**: 126+ tests passing with >85% coverage
- ✅ **Presets**: Timeline Studio, Adobe Premiere Pro (119 shortcuts), Wondershare Filmora

## Structure

```
keyboard-shortcuts/
├── components/
│   ├── shortcut-handler.tsx
│   ├── keyboard-shortcuts-modal.tsx
│   ├── conflict-indicator.tsx
│   └── shortcuts-cheat-sheet.tsx
├── constants/
│   └── default-shortcuts.ts
├── hooks/
│   └── use-panel-shortcuts.ts
├── presets/
│   ├── timeline-preset.ts
│   ├── premiere-preset.ts
│   └── filmora-preset.ts
├── services/
│   ├── shortcuts-registry.ts
│   ├── shortcuts-provider.tsx
│   └── tauri-global-shortcuts.ts
└── types/
    └── shortcuts.ts
```

## Features

### ✅ Implemented

- [x] Centralized shortcut registration and management
- [x] Multiple key combinations support (cmd/ctrl + key)
- [x] 13 categories (preferences, file, edit, tools, markers, audio, etc.)
- [x] Conflict detection and resolution with visual indicators
- [x] Preset system (switch between Timeline/Premiere/Filmora)
- [x] Export/Import settings to JSON
- [x] Persistent storage (Tauri Store + localStorage fallback)
- [x] Global shortcuts via Tauri plugin
- [x] Cheat sheet generation with print support
- [x] Context-aware shortcuts (global, timeline, browser)
- [x] Search by name or key combination
- [x] i18n localization support

### ❌ Not Implemented

- [ ] Macro recording (sequence of actions on one key)
- [ ] Cloud synchronization of settings
- [ ] AI-powered shortcut suggestions based on usage patterns
- [ ] Video tutorials for shortcuts

## Usage

### Register Shortcuts

```typescript
import { ShortcutsRegistry } from '@/features/keyboard-shortcuts'

const registry = ShortcutsRegistry.getInstance()

registry.register({
  id: "save-project",
  name: "Save Project",
  category: "file",
  keys: ["⌘S", "cmd+s", "ctrl+s"],
  action: (event) => {
    event.preventDefault()
    // Save project logic
  }
})
```

### Use in Components

```tsx
import { useShortcuts } from '@/features/keyboard-shortcuts'

function MyComponent() {
  const {
    shortcuts,
    isEnabled,
    toggleShortcuts,
    updateShortcutKeys,
    resetShortcut
  } = useShortcuts()

  return (
    <ShortcutsProvider>
      <App />
    </ShortcutsProvider>
  )
}
```

### Conflict Resolution

```typescript
import { detectConflicts, validateNewKeys } from '@/features/keyboard-shortcuts'

const conflicts = detectConflicts(shortcuts)
const validation = validateNewKeys(["Ctrl+K"], "shortcut-id", allShortcuts)

if (!validation.valid) {
  console.error(validation.error, validation.conflicts)
}
```

## Integration

- **Depends on**:
  - `@tauri-apps/plugin-store` - Settings persistence
  - `@tauri-apps/plugin-global-shortcut` - Global system shortcuts
  - `@/i18n` - Internationalization

- **Used by**:
  - All Timeline Studio components requiring keyboard shortcuts
  - User Settings modal for shortcut customization

## Testing

- **Total tests**: 126+ tests
- **Coverage**: >85% (statements, branches, functions)
- **Test files**:
  - `shortcuts-registry.test.ts` (26 tests)
  - `shortcuts-conflicts.test.ts` (33 tests)
  - `shortcuts-persistence.test.ts` (50+ tests)
  - `premiere-preset.test.ts` (17 tests)
  - `shortcuts-provider.test.tsx` (full React integration)

```bash
# Run all tests
bun test src/features/keyboard-shortcuts/

# Run with coverage
bun test:coverage src/features/keyboard-shortcuts/

# Run specific test file
bun test src/features/keyboard-shortcuts/__tests__/presets/premiere-preset.test.ts
```

## Shortcut Categories

1. **preferences** - Application settings
2. **file** - File operations (create, save, import)
3. **edit** - Editing (undo, copy, paste)
4. **tools** - Tools (split, group, rotate)
5. **markers** - Color markers (red, orange, yellow, etc.)
6. **advanced-tools** - Advanced tools (tracking, insert, replace)
7. **audio** - Audio functions (stretch, favorites, compound clips)
8. **subtitles** - Subtitles (split, merge)
9. **playback** - Playback control (play, stop, frames)
10. **navigation** - Navigation (jump to markers, zoom)
11. **timeline** - Timeline operations (scroll, guides)
12. **markers-multicam** - Markers and multicam (marks, camera angles)
13. **miscellaneous** - Other (help, export)

## Key Formats

- **macOS symbols**: `⌘`, `⌥`, `⇧`, `⌃`
- **Text modifiers**: `cmd`, `command`, `meta`, `alt`, `option`, `shift`, `ctrl`
- **Universal modifier**: `mod` - automatically `cmd` on macOS, `ctrl` on Windows/Linux

## TODO / Roadmap

- [ ] **Macro Recording** - Record and replay sequences of actions
- [ ] **Cloud Sync** - Synchronize settings across devices
- [ ] **AI Suggestions** - Smart shortcut recommendations based on usage
- [ ] **Video Tutorials** - Embedded tutorial videos for new users
- [ ] **Command Palette** - Fuzzy search for all available shortcuts
- [ ] **E2E Tests** - Complete E2E test coverage for Tauri integration
  - Global shortcut registration/unregistration
  - Persistence in Tauri Store
  - Conflict detection UI flow
  - Preset switching

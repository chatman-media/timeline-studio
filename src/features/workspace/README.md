# Workspace

**English** | [Русский](./README.ru.md)

## Overview
Modern widget-based workspace system for Timeline Studio built on @dnd-kit and XState v5, providing drag-and-drop, resizable widgets, and customizable layouts.

## Status
- ✅ **Version**: v1.1.0
- ✅ **Readiness**: 100%
- ✅ **Components**: Fully implemented
- ✅ **Services**: XState machine and provider ready
- ✅ **Tests**: 88 tests passing (7 test files)

## Structure
```
workspace/
├── types/
│   └── widget.ts
├── config/
│   └── layout-presets.ts
├── services/
│   ├── workspace-layout-machine.ts
│   └── workspace-layout-provider.tsx
├── components/
│   ├── widget-container.tsx
│   ├── widget-workspace.tsx
│   └── layout-preset-selector.tsx
├── examples/
│   └── media-studio-integration.tsx
└── __tests__/
```

## Features
### ✅ Implemented
- [x] Drag & Drop with @dnd-kit
- [x] Resize widgets (8 resize handles)
- [x] Widget Dock for minimized widgets
- [x] State persistence (localStorage + backend sync)
- [x] 4 preset layouts (Default, Vertical, Options, Chat)
- [x] XState v5 state management
- [x] Custom layout saving
- [x] Full TypeScript typing
- [x] Tauri Logger integration

### ❌ Not Implemented
- [ ] Snap to Grid
- [ ] Layout animations
- [ ] Undo/Redo
- [ ] Keyboard shortcuts
- [ ] Fullscreen mode for widgets
- [ ] Widget tabs
- [ ] Layout templates export/import
- [ ] Multi-monitor support

## Usage
```typescript
import {
  WorkspaceLayoutProvider,
  WidgetWorkspace,
  useWorkspaceLayout
} from '@/features/workspace'

function App() {
  return (
    <WorkspaceLayoutProvider>
      <MediaStudio />
    </WorkspaceLayoutProvider>
  )
}

function MediaStudio() {
  const { currentPresetId, switchPreset } = useWorkspaceLayout()

  const widgetRenderers = {
    timeline: (widget) => <Timeline />,
    player: (widget) => <VideoPlayer />,
    browser: (widget) => <Browser />,
    options: (widget) => <Options />,
    "ai-chat": (widget) => <AiChat />
  }

  return <WidgetWorkspace widgetRenderers={widgetRenderers} />
}
```

## Integration
- **Depends on**: @dnd-kit, XState v5, @/lib/tauri-logger
- **Used by**: @/features/media-studio

## Testing
- **Total tests**: 88 tests (all passing)
- **Service tests**: 49 tests (3 files)
- **Component tests**: 39 tests (4 files)

```bash
bun run test src/features/workspace
```

## TODO / Roadmap

### v1.2 (Next Release)
- [ ] Snap to Grid with configurable grid size
- [ ] Visual grid overlay (optional)
- [ ] Smart snap to other widgets
- [ ] Smooth transitions and animations
- [ ] Keyboard shortcuts (Ctrl+1/2/3/4 for presets)

### v1.3 (Advanced Features)
- [ ] Undo/Redo with command pattern
- [ ] Fullscreen mode for widgets
- [ ] Widget tabs support
- [ ] Layout templates export/import

### v2.0 (Future Vision)
- [ ] Multi-monitor support
- [ ] Floating windows for widgets
- [ ] Collaborative layouts with real-time sync
- [ ] E2E tests (planned in `e2e/tauri/features/workspace/`)

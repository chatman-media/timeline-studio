# System Integration Domain

Системная интеграция: модальные окна, уведомления, обновления и workspace в Timeline Studio.

## Quick Start

```typescript
import {
  useModals,
  useNotifications,
  useUpdates,
  SystemIntegrationProvider
} from "@/domains/system-integration"

// Провайдер в корне приложения
function App() {
  return (
    <SystemIntegrationProvider>
      <YourApp />
    </SystemIntegrationProvider>
  )
}

// Использование в компоненте
function MyComponent() {
  const { openModal, closeModal, isModalOpen } = useModals()
  const { showSuccess, showError } = useNotifications()
  const { checkForUpdates, updateStatus } = useUpdates()

  const handleExport = async () => {
    openModal("export", { format: "mp4" })
    try {
      await exportVideo()
      showSuccess("Export", "Video exported successfully")
    } catch (error) {
      showError("Export", "Export failed")
    }
  }
}
```

## Public API

### Hooks
| Hook | Purpose |
|------|---------|
| `useModals()` | Modal management |
| `useNotifications()` | Toast notifications |
| `useUpdates()` | App update management |
| `useFeatures()` | Feature flags |

### Provider
| Provider | Purpose |
|----------|---------|
| `SystemIntegrationProvider` | Main domain provider |
| `useSystemIntegrationContext()` | Context hook |

### State Machines
| Export | Purpose |
|--------|---------|
| `modalMachine` | Modal state machine |
| `updateMachine` | Update state machine |

### Orchestrator
| Export | Purpose |
|--------|---------|
| `getSystemIntegrationOrchestrator()` | Get singleton instance |
| `resetSystemIntegrationOrchestrator()` | Reset for tests |

### Services
| Service | Purpose |
|---------|---------|
| `UpdateService` | Tauri update integration |
| `WorkspacePersistence` | Save/load workspace state |

## Key Features

- **Modal Management** - Open, close, submit modals
- **Notifications** - Info, success, warning, error toasts
- **Updates** - Check, download, install updates
- **Feature Flags** - Toggle experimental features
- **Workspace Persistence** - Save/restore workspace state

## Modal Types

| Modal | Description |
|-------|-------------|
| `camera-capture` | Camera capture dialog |
| `voice-recording` | Voice recording |
| `export` | Export settings |
| `project-settings` | Project settings |
| `user-settings` | User preferences |
| `keyboard-shortcuts` | Keyboard shortcuts |
| `color-grading` | Color grading panel |

## Dependencies

**Internal:**
- `@/features/updates/types` - Update types
- `@/lib/tauri-logger` - Logging

**External:**
- `xstate` v5 - State machines
- `@tauri-apps/api/updater` - Tauri updates

## Testing

```bash
bun run test src/domains/system-integration/__tests__/
```

## Documentation

| Document | Content |
|----------|---------|
| [API Reference](./docs/API.md) | Full API description |
| [Architecture](./docs/ARCHITECTURE.md) | Architecture and diagrams |
| [Changelog](./docs/CHANGELOG.md) | History of changes |

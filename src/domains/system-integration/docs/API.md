# System Integration Domain - API Reference

## Table of Contents

- [Types](#types)
- [Provider](#provider)
- [Hooks](#hooks)
- [Orchestrator](#orchestrator)
- [State Machines](#state-machines)
- [Services](#services)

---

## Types

### ModalType

```typescript
type ModalType =
  | "none"
  | "camera-capture"
  | "voice-recording"
  | "export"
  | "project-settings"
  | "user-settings"
  | "keyboard-shortcuts"
  | "color-grading"
  | "effect-detail"
  | "media-restoration"
```

### ModalData

```typescript
type ModalData = Record<string, unknown>
```

### SystemNotification

```typescript
interface SystemNotification {
  id: string
  notification_type: string
  type: "info" | "success" | "warning" | "error"
  title: string
  message: string
  timestamp: Date
  duration?: number
  actions?: NotificationAction[]
  read?: boolean
}

interface NotificationAction {
  label: string
  action: () => void
  style?: "primary" | "secondary" | "danger"
}
```

### SystemResources

```typescript
interface SystemResources {
  cpuUsage: number
  memoryUsage: number
  diskSpace: { used: number; total: number }
  gpuAvailable: boolean
  gpuMemory?: { used: number; total: number }
}
```

### SystemIntegrationContext

```typescript
interface SystemIntegrationContext {
  activeModal: ModalType
  modalData: ModalData | null
  modalStack: ModalType[]
  updateStatus: UpdateStatus
  currentVersion: string
  availableUpdate: UpdateInfo | null
  updateProgress: UpdateProgressWithPercentage | null
  notifications: SystemNotification[]
  isOnline: boolean
  systemResources: SystemResources
  features: Record<string, boolean>
}
```

### UpdateInfo

```typescript
interface UpdateInfo {
  version: string
  releaseDate: Date
  releaseNotes: string
  downloadUrl: string
  size: number
}
```

### UpdateStatus

```typescript
type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "installing"
  | "error"
```

### WorkspaceState

```typescript
interface WorkspaceState {
  activePanel: string
  panelSizes: Record<string, number>
  sidebarVisible: boolean
  browserTab: string
  // ... other workspace settings
}
```

---

## Provider

### SystemIntegrationProvider

React провайдер для системной интеграции.

```tsx
import { SystemIntegrationProvider } from "@/domains/system-integration"

function App() {
  return (
    <SystemIntegrationProvider>
      <YourApp />
    </SystemIntegrationProvider>
  )
}
```

### useSystemIntegrationContext()

```typescript
import { useSystemIntegrationContext } from "@/domains/system-integration"

const context = useSystemIntegrationContext()
```

---

## Hooks

### useModals()

Hook для работы с модальными окнами.

```typescript
import { useModals } from "@/domains/system-integration"

const {
  // State
  activeModal,
  modalData,
  isModalOpen,

  // General actions
  openModal,
  closeModal,
  submitModal,

  // Specific modals
  openCameraCapture,
  openVoiceRecording,
  openExport,
  openProjectSettings,
  openUserSettings,
  openKeyboardShortcuts,
  openColorGrading,
  openEffectDetail
} = useModals()
```

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `activeModal` | `ModalType` | Currently active modal |
| `modalData` | `ModalData \| null` | Modal data |
| `isModalOpen` | `boolean` | Is any modal open |

**Actions:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `openModal` | `(modal: ModalType, data?: ModalData) => void` | Open modal |
| `closeModal` | `() => void` | Close current modal |
| `submitModal` | `(data?: ModalData) => void` | Submit modal |
| `openCameraCapture` | `(data?) => void` | Open camera capture |
| `openVoiceRecording` | `(data?) => void` | Open voice recording |
| `openExport` | `(data?) => void` | Open export dialog |
| `openProjectSettings` | `(data?) => void` | Open project settings |
| `openUserSettings` | `(data?) => void` | Open user settings |
| `openKeyboardShortcuts` | `(data?) => void` | Open keyboard shortcuts |
| `openColorGrading` | `(data?) => void` | Open color grading |
| `openEffectDetail` | `(effectId, data?) => void` | Open effect detail |

### useNotifications()

Hook для работы с уведомлениями.

```typescript
import { useNotifications } from "@/domains/system-integration"

const {
  notifications,
  showNotification,
  showInfo,
  showSuccess,
  showWarning,
  showError,
  dismissNotification,
  clearNotifications
} = useNotifications()
```

**Actions:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `showNotification` | `(notification) => string` | Show notification |
| `showInfo` | `(title, message, duration?) => string` | Show info notification |
| `showSuccess` | `(title, message, duration?) => string` | Show success notification |
| `showWarning` | `(title, message, duration?) => string` | Show warning |
| `showError` | `(title, message, duration?) => string` | Show error |
| `dismissNotification` | `(id: string) => void` | Dismiss notification |
| `clearNotifications` | `() => void` | Clear all notifications |

### useUpdates()

Hook для работы с обновлениями.

```typescript
import { useUpdates } from "@/domains/system-integration"

const {
  updateStatus,
  availableUpdate,
  progress,
  error,
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  dismissUpdate,
  enableAutoUpdate,
  disableAutoUpdate
} = useUpdates()
```

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `updateStatus` | `UpdateStatus` | Current update status |
| `availableUpdate` | `UpdateInfo \| null` | Available update info |
| `progress` | `number \| null` | Download progress (0-100) |
| `error` | `string \| null` | Error message |

**Actions:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `checkForUpdates` | `() => void` | Check for updates |
| `downloadUpdate` | `() => void` | Download update |
| `installUpdate` | `() => void` | Install update |
| `dismissUpdate` | `() => void` | Dismiss update notification |
| `enableAutoUpdate` | `(intervalMinutes: number) => void` | Enable auto-check |
| `disableAutoUpdate` | `() => void` | Disable auto-check |

### useFeatures()

Hook для работы с feature flags.

```typescript
import { useFeatures } from "@/domains/system-integration"

const {
  features,
  isEnabled,
  toggleFeature
} = useFeatures()

if (isEnabled("experimental-ai")) {
  // Show experimental AI feature
}
```

---

## Orchestrator

### SystemIntegrationOrchestrator

Singleton оркестратор для координации системных функций.

```typescript
import { getSystemIntegrationOrchestrator } from "@/domains/system-integration"

const orchestrator = getSystemIntegrationOrchestrator()

// Modals
orchestrator.openModal("export", { format: "mp4" })
orchestrator.closeModal()
orchestrator.submitModal(data)

// Updates
orchestrator.checkForUpdates()
orchestrator.downloadUpdate()
orchestrator.installUpdate()
orchestrator.enableAutoUpdate(60)

// Notifications
const id = orchestrator.showNotification({
  type: "success",
  title: "Saved",
  message: "Project saved successfully",
  duration: 3000
})
orchestrator.dismissNotification(id)

// Features
orchestrator.toggleFeature("dark-mode", true)
orchestrator.isFeatureEnabled("dark-mode")

// State
orchestrator.getModalState()
orchestrator.getUpdateState()
orchestrator.getNotifications()

// Subscriptions
orchestrator.subscribeToModals(callback)
orchestrator.subscribeToUpdates(callback)

// Cleanup
orchestrator.dispose()
```

### resetSystemIntegrationOrchestrator()

Reset orchestrator instance (for tests).

```typescript
import { resetSystemIntegrationOrchestrator } from "@/domains/system-integration"

beforeEach(() => {
  resetSystemIntegrationOrchestrator()
})
```

---

## State Machines

### modalMachine

XState машина для управления модальными окнами.

```typescript
import { modalMachine } from "@/domains/system-integration"
import { createActor } from "xstate"

const actor = createActor(modalMachine)
actor.start()

actor.send({ type: "OPEN_MODAL", modalType: "export", modalData: {} })
actor.send({ type: "CLOSE_MODAL" })
actor.send({ type: "SUBMIT_MODAL", data: {} })
```

**States:** `closed` → `opened` → `submitting` → `closed`

**Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `OPEN_MODAL` | `{ modalType, modalData? }` | Open modal |
| `CLOSE_MODAL` | - | Close modal |
| `SUBMIT_MODAL` | `{ data? }` | Submit modal |

### updateMachine

XState машина для управления обновлениями.

```typescript
import { updateMachine, createUpdateMachine } from "@/domains/system-integration"

const actor = createActor(updateMachine)
actor.start()

actor.send({ type: "CHECK_FOR_UPDATES" })
actor.send({ type: "DOWNLOAD_UPDATE" })
actor.send({ type: "INSTALL_UPDATE" })
actor.send({ type: "DISMISS" })
actor.send({ type: "ENABLE_AUTO_CHECK", intervalMinutes: 60 })
actor.send({ type: "DISABLE_AUTO_CHECK" })
```

**States:**
```
idle
  → checking → updateAvailable | upToDate | error
updateAvailable
  → downloading → downloadComplete | error
downloadComplete
  → installing → installed | error
```

---

## Services

### UpdateService

Сервис для работы с Tauri обновлениями.

```typescript
import { UpdateService, updateService } from "@/domains/system-integration"

// Check for updates
const result = await updateService.check()

// Download update
await updateService.downloadAndInstall()
```

### Workspace Persistence

Сохранение и загрузка состояния workspace.

```typescript
import {
  loadWorkspaceState,
  saveWorkspaceStateLocal,
  saveWorkspaceStateBackend,
  loadWorkspaceStateLocal,
  loadWorkspaceStateBackend,
  clearWorkspaceStateLocal,
  debouncedSave,
  isValidWorkspaceState
} from "@/domains/system-integration"

// Load workspace state (tries backend, falls back to local)
const state = await loadWorkspaceState()

// Save to localStorage
saveWorkspaceStateLocal(state)

// Save to backend
await saveWorkspaceStateBackend(state)

// Debounced save (prevents too frequent saves)
debouncedSave(state)

// Validate state
if (isValidWorkspaceState(state)) {
  // Valid state
}
```

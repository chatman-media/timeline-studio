# System Integration Domain - Architecture

## Overview

Домен `system-integration` координирует системные функции приложения: модальные окна, обновления, уведомления и workspace persistence.

## Directory Structure

```
src/domains/system-integration/
├── index.ts                          # Public API exports
├── README.md                         # Overview documentation
├── docs/
│   ├── API.md                        # Full API reference
│   ├── ARCHITECTURE.md               # This file
│   └── CHANGELOG.md                  # History
├── hooks/
│   ├── index.ts                      # Hooks exports
│   ├── use-features.ts               # Feature flags hook
│   ├── use-modals.ts                 # Modal management hook
│   ├── use-notifications.ts          # Notifications hook
│   └── use-updates.ts                # Updates hook
├── machines/
│   ├── modal-machine.ts              # Modal state machine
│   ├── update-machine.ts             # Update state machine
│   └── backend-event-handlers.ts     # Backend event processing
├── providers/
│   └── system-integration-provider.tsx # React context provider
├── services/
│   ├── system-integration-orchestrator.ts # Main orchestrator
│   ├── updates/
│   │   ├── index.ts
│   │   └── update-service.ts         # Tauri update service
│   └── workspace/
│       ├── index.ts
│       └── workspace-persistence-service.ts # Workspace state
├── types/
│   └── index.ts                      # Domain types
├── __tests__/
└── __mocks__/
```

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Components                          │
│    (ModalContainer, NotificationToasts, UpdateBanner, etc.)     │
└─────────────────────────────────────────────────────────────────┘
          │            │              │               │
          ▼            ▼              ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  useModals() │ │useNotifications│ │ useUpdates() │ │useFeatures() │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
          │            │              │               │
          └────────────┴──────────────┴───────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                SystemIntegrationOrchestrator                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     Singleton Instance                   │   │
│  │  • modalActor: ActorRefFrom<modalMachine>               │   │
│  │  • updateActor: ActorRefFrom<updateMachine>             │   │
│  │  • notifications: SystemNotification[]                  │   │
│  │  • features: Record<string, boolean>                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     Methods                              │   │
│  │  openModal(), closeModal(), submitModal()                │   │
│  │  checkForUpdates(), downloadUpdate(), installUpdate()    │   │
│  │  showNotification(), dismissNotification()               │   │
│  │  toggleFeature(), isFeatureEnabled()                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│      modalMachine       │    │     updateMachine       │
│  ┌───────────────────┐  │    │  ┌───────────────────┐  │
│  │ States:           │  │    │  │ States:           │  │
│  │  closed           │  │    │  │  idle             │  │
│  │  opened           │  │    │  │  checking         │  │
│  │  submitting       │  │    │  │  updateAvailable  │  │
│  └───────────────────┘  │    │  │  downloading      │  │
└─────────────────────────┘    │  │  downloadComplete │  │
                               │  │  installing       │  │
                               │  │  installed        │  │
                               │  │  error            │  │
                               │  └───────────────────┘  │
                               └─────────────────────────┘
                                         │
                                         ▼
                               ┌─────────────────────────┐
                               │     UpdateService       │
                               │  ┌───────────────────┐  │
                               │  │ Tauri Update API  │  │
                               │  │  check()          │  │
                               │  │  downloadAndInstall│  │
                               │  └───────────────────┘  │
                               └─────────────────────────┘
```

## State Machine: modalMachine

```
     ┌─────────────┐
     │   closed    │◄──────────────────────────────┐
     └──────┬──────┘                               │
            │                                      │
            │ OPEN_MODAL                           │
            ▼                                      │
     ┌─────────────┐                               │
     │   opened    │                               │
     └──────┬──────┘                               │
            │                                      │
            ├──── CLOSE_MODAL ─────────────────────┤
            │                                      │
            │ SUBMIT_MODAL                         │
            ▼                                      │
     ┌─────────────┐                               │
     │  submitting │                               │
     └──────┬──────┘                               │
            │                                      │
            └──── onDone ──────────────────────────┘
```

## State Machine: updateMachine

```
     ┌─────────────┐
     │    idle     │◄────────────────────────────────────────────┐
     └──────┬──────┘                                             │
            │                                                    │
            │ CHECK_FOR_UPDATES                                  │
            ▼                                                    │
     ┌─────────────┐                                             │
     │  checking   │                                             │
     └──────┬──────┘                                             │
            │                                                    │
            ├─── no update ──► upToDate ─── DISMISS ────────────►│
            │                                                    │
            ├─── error ──────► error ────── DISMISS ────────────►│
            │                                                    │
            │ update found                                       │
            ▼                                                    │
     ┌───────────────────┐                                       │
     │  updateAvailable  │──── DISMISS ─────────────────────────►│
     └──────────┬────────┘                                       │
                │                                                │
                │ DOWNLOAD_UPDATE                                │
                ▼                                                │
     ┌─────────────┐                                             │
     │ downloading │                                             │
     └──────┬──────┘                                             │
            │                                                    │
            │ download complete                                  │
            ▼                                                    │
     ┌──────────────────┐                                        │
     │ downloadComplete │                                        │
     └──────────┬───────┘                                        │
                │                                                │
                │ INSTALL_UPDATE                                 │
                ▼                                                │
     ┌─────────────┐                                             │
     │  installing │                                             │
     └──────┬──────┘                                             │
            │                                                    │
            └─── success ──► installed ─────────────────────────►│
```

## Orchestrator Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                     Hooks (UI Layer)                            │
│  useModals()  useNotifications()  useUpdates()  useFeatures()  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ All hooks get orchestrator instance
                              │ via getSystemIntegrationOrchestrator()
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              SystemIntegrationOrchestrator (Singleton)           │
│                                                                  │
│  let orchestratorInstance: SystemIntegrationOrchestrator | null │
│                                                                  │
│  getSystemIntegrationOrchestrator(): SystemIntegrationOrchestrator│
│    if (!orchestratorInstance) {                                 │
│      orchestratorInstance = new SystemIntegrationOrchestrator() │
│    }                                                            │
│    return orchestratorInstance                                  │
│                                                                  │
│  resetSystemIntegrationOrchestrator(): void                     │
│    orchestratorInstance?.dispose()                              │
│    orchestratorInstance = null                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Orchestrator manages actors
                              ▼
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
┌───────────────────┐                   ┌───────────────────┐
│   Modal Actor     │                   │   Update Actor    │
│ (XState Machine)  │                   │ (XState Machine)  │
└───────────────────┘                   └───────────────────┘
```

## Workspace Persistence Flow

```
Application Start
    │
    ▼
loadWorkspaceState()
    │
    ├──► Try loadWorkspaceStateBackend()
    │    │
    │    ├── Success → Return backend state
    │    │
    │    └── Fail → Fall through
    │
    └──► Try loadWorkspaceStateLocal()
         │
         ├── Success → Return local state
         │
         └── Fail → Return default state
                           │
                           ▼
              Application initializes with state
                           │
                           ▼
                    User makes changes
                           │
                           ▼
              debouncedSave(newState)
                           │
                    (300ms debounce)
                           │
                           ▼
              saveWorkspaceStateLocal(state)
                      +
              saveWorkspaceStateBackend(state)
```

## Key Design Decisions

### 1. Singleton Orchestrator

**Decision:** Use singleton pattern for SystemIntegrationOrchestrator.

**Rationale:**
- Single point of coordination for all system functions
- Consistent state across all components
- Easy cleanup with dispose()
- Testable with reset function

### 2. XState for Modal and Update Management

**Decision:** Use XState state machines for modals and updates.

**Rationale:**
- Predictable state transitions
- Clear visualization of flows
- Built-in error handling
- Easy to test

### 3. Dual Storage for Workspace

**Decision:** Save workspace state to both localStorage and backend.

**Rationale:**
- Fast loading from localStorage
- Backend sync for persistence
- Graceful fallback if backend unavailable
- Debounced saves to prevent performance issues

### 4. Hooks as Facade

**Decision:** Provide hooks that wrap orchestrator methods.

**Rationale:**
- React-friendly API
- Automatic subscription management
- Component-level state updates
- Clean separation of concerns

## Dependencies

### Internal Dependencies

```
system-integration
    │
    ├── @/features/updates/types
    │   └── Update types
    │
    └── @/lib/tauri-logger
        └── Logging
```

### External Dependencies

- `xstate` (v5) - State machines
- `@tauri-apps/api/updater` - Tauri update API

## Testing Strategy

### Unit Tests

```bash
bun run test src/domains/system-integration/__tests__/
```

**Coverage:**
- `hooks/use-features.test.tsx`
- `hooks/use-modals.test.tsx`
- `hooks/use-notifications.test.tsx`
- `hooks/use-updates.test.tsx`
- `machines/modal-machine.test.ts`
- `machines/update-machine.test.ts`
- `services/system-integration-orchestrator.test.ts`
- `services/workspace/workspace-persistence-service.test.ts`
- `integration/hooks-orchestrator-integration.test.tsx`

## Performance Considerations

### Optimizations

1. **Singleton Pattern** - Single orchestrator instance shared across components
2. **Debounced Workspace Save** - Prevents too frequent saves (300ms debounce)
3. **Subscription Management** - Automatic unsubscription in hooks
4. **Lazy Initialization** - Orchestrator created on first access
5. **Actor-based State** - XState actors only update when state changes

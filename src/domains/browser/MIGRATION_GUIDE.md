# Browser Domain Migration Guide

## Overview

This guide documents the migration of the Browser domain from XState-based state management to BackendSync-based state management.

## Changes Made

### 1. TypeScript Bindings Updated

**File**: `src-tauri/src/types_export.rs`

Added browser-related types and commands to the TypeScript export:

- **Types**: `BrowserTab`, `ViewMode`, `SortOrder`, `TabSettings`, `BrowserState`
- **Commands**: `BrowserSwitchTab`, `BrowserSetSearchQuery`, `BrowserToggleFavorites`, etc.
- **Events**: `BrowserTabSwitched`, `BrowserSearchQueryChanged`, `BrowserFavoritesToggled`, etc.

### 2. New BrowserProviderV2 Created

**File**: `src/domains/browser/providers/browser-provider-v2.tsx`

The new provider uses BackendSync pattern instead of XState:

```typescript
// Before (XState-based)
const [state, send] = useActor(browserMachine)
send({ type: "SWITCH_TAB", tab })

// After (BackendSync-based)
const { switchTab } = useBrowserV2()
await switchTab("media")
```

### 3. Key Differences

#### State Management
- **Before**: Local XState machine with localStorage persistence
- **After**: Backend-driven state with automatic synchronization

#### API Changes
- **Before**: Synchronous actions via `send()`
- **After**: Asynchronous commands via `executeCommand()`

#### Event Handling
- **Before**: XState events and transitions
- **After**: Backend events via `listen()` API

### 4. Usage Comparison

#### Legacy Usage (XState)
```tsx
import { BrowserDomainProvider, useBrowserDomain } from "@/domains/browser"

function MyComponent() {
  const { state, switchTab, setSearchQuery } = useBrowserDomain()
  
  const handleTabSwitch = () => {
    switchTab("media")
  }
  
  return (
    <BrowserDomainProvider>
      {/* children */}
    </BrowserDomainProvider>
  )
}
```

#### New Usage (BackendSync)
```tsx
import { BrowserProviderV2, useBrowserV2 } from "@/domains/browser"
import { useBackendSync } from "@/features/app-state/services/backend-sync"

function MyComponent() {
  const backendSync = useBackendSync()
  const { browserState, switchTab, setSearchQuery } = useBrowserV2()
  
  const handleTabSwitch = async () => {
    await switchTab("media")
  }
  
  return (
    <BrowserProviderV2 backendSync={backendSync}>
      {/* children */}
    </BrowserProviderV2>
  )
}
```

### 5. Migration Steps

1. **Update Imports**
   ```diff
   - import { BrowserDomainProvider, useBrowserDomain } from "@/domains/browser"
   + import { BrowserProviderV2, useBrowserV2 } from "@/domains/browser"
   ```

2. **Update Provider Usage**
   ```diff
   - <BrowserDomainProvider>
   + <BrowserProviderV2 backendSync={backendSync}>
   ```

3. **Update Hook Usage**
   ```diff
   - const { state, switchTab } = useBrowserDomain()
   + const { browserState, switchTab } = useBrowserV2()
   ```

4. **Handle Async Actions**
   ```diff
   - switchTab("media")
   + await switchTab("media")
   ```

### 6. State Access Changes

#### Before
```typescript
const { state } = useBrowserDomain()
const activeTab = state.context.activeTab
const searchQuery = state.context.tabSettings[state.context.activeTab]?.searchQuery
```

#### After
```typescript
const { browserState } = useBrowserV2()
const activeTab = browserState?.active_tab
const searchQuery = browserState?.tabs[activeTab]?.search_query
```

### 7. Benefits of Migration

1. **Centralized State**: Browser state is now managed by the backend
2. **Automatic Synchronization**: State changes are automatically synced across components
3. **Consistency**: Follows the same pattern as other domains (Player, Timeline, etc.)
4. **Better Testing**: Easier to mock and test with BackendSync
5. **Version Control**: Browser state is now part of project version history

### 8. Testing

Comprehensive unit tests have been created in:
`src/domains/browser/providers/__tests__/browser-provider-v2.test.tsx`

Tests cover:
- Initialization and state loading
- Event handling
- All browser actions
- Error handling
- Hook usage validation

### 9. Backward Compatibility

The legacy `BrowserDomainProvider` is still available for gradual migration:
- Legacy provider: `BrowserDomainProvider` (XState-based)
- New provider: `BrowserProviderV2` (BackendSync-based)

Both can coexist during the migration period.

### 10. Next Steps

1. Update components to use new provider
2. Remove legacy XState machine when migration is complete
3. Update integration tests
4. Update documentation

## Files Modified

- `src-tauri/src/types_export.rs` - Added browser types and commands
- `src/domains/browser/providers/browser-provider-v2.tsx` - New provider
- `src/domains/browser/providers/__tests__/browser-provider-v2.test.tsx` - Unit tests
- `src/domains/browser/index.ts` - Updated exports
- `src/domains/browser/MIGRATION_GUIDE.md` - This guide
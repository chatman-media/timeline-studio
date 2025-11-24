# Browser Domain BackendSync Integration Design

## Overview

This document outlines the design for migrating the BrowserDomainProvider from XState to BackendSync integration. The browser domain manages the state of the media browser interface, including tab selection, search queries, filters, sorting, and file selection across different content types.

## Current State Analysis

### BrowserDomainProvider (Current XState Implementation)
- **Location**: `src/domains/browser/providers/browser-domain-provider.tsx`
- **State Machine**: `browserMachine` from `src/domains/browser/machines/browser-machine.ts`
- **Current Features**:
  - Tab switching (media, music, subtitles, transitions, effects, filters, templates, style-templates)
  - Search queries per tab
  - Favorites filtering
  - Sorting options (by, order)
  - Grouping options
  - Filter types
  - View modes (list, grid, thumbnails)
  - Preview size adjustment
  - File selection/deselection per tab
  - Settings persistence to localStorage

### Current Types
- **BrowserTab**: Union of available browser tabs
- **BrowserContext**: Core browser state structure
- **BrowserMachineContext**: Extended context for XState
- **BrowserMachineEvent**: XState events
- **BrowserService**: Service interface
- **BrowserStorageService**: Persistence interface

## Proposed BackendSync Integration Design

### 1. Extend ProjectState with Browser State

Add browser state to the `ProjectState` type in the backend:

```typescript
// Extended ProjectState
type ProjectState = {
  project: Project | null;
  ui_state: UiState;
  playback_state: PlaybackState;
  version: number;
  version_info: VersionInfo;
  chat_sessions: ChatSession[];
  // NEW: Browser state
  browser_state: BrowserState;
}

// Browser state structure
type BrowserState = {
  activeTab: BrowserTab;
  selectedFiles: Record<BrowserTab, string[]>; // Changed from Set to array for serialization
  tabSettings: Record<BrowserTab, TabSettings>;
}

type TabSettings = {
  searchQuery: string;
  showFavoritesOnly: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  groupBy: string;
  filterType: string;
  viewMode: ViewMode;
  previewSizeIndex: number;
}
```

### 2. Browser-Specific Commands

Add browser commands to `ProjectCommand` union:

```typescript
type ProjectCommand = 
  // ... existing commands ...
  // Browser commands
  | { type: "BrowserSwitchTab"; params: { tab: BrowserTab } }
  | { type: "BrowserSetSearchQuery"; params: { query: string; tab?: BrowserTab } }
  | { type: "BrowserToggleFavorites"; params: { tab?: BrowserTab } }
  | { type: "BrowserSetSort"; params: { sortBy: string; sortOrder: "asc" | "desc"; tab?: BrowserTab } }
  | { type: "BrowserSetGroupBy"; params: { groupBy: string; tab?: BrowserTab } }
  | { type: "BrowserSetFilter"; params: { filterType: string; tab?: BrowserTab } }
  | { type: "BrowserSetViewMode"; params: { viewMode: ViewMode; tab?: BrowserTab } }
  | { type: "BrowserSetPreviewSize"; params: { sizeIndex: number; tab?: BrowserTab } }
  | { type: "BrowserResetTabSettings"; params: { tab: BrowserTab } }
  | { type: "BrowserSelectFile"; params: { fileId: string; tab?: BrowserTab } }
  | { type: "BrowserDeselectFile"; params: { fileId: string; tab?: BrowserTab } }
  | { type: "BrowserToggleFileSelection"; params: { fileId: string; tab?: BrowserTab } }
  | { type: "BrowserSelectAllFiles"; params: { fileIds: string[]; tab?: BrowserTab } }
  | { type: "BrowserDeselectAllFiles"; params: { tab?: BrowserTab } }
```

### 3. Browser Events

Add browser events to `ProjectEvent` union:

```typescript
type ProjectEvent = 
  // ... existing events ...
  // Browser events
  | { type: "BrowserTabSwitched"; payload: { tab: BrowserTab } }
  | { type: "BrowserSearchQuerySet"; payload: { tab: BrowserTab; query: string } }
  | { type: "BrowserFavoritesToggled"; payload: { tab: BrowserTab; showFavoritesOnly: boolean } }
  | { type: "BrowserSortSet"; payload: { tab: BrowserTab; sortBy: string; sortOrder: "asc" | "desc" } }
  | { type: "BrowserGroupBySet"; payload: { tab: BrowserTab; groupBy: string } }
  | { type: "BrowserFilterSet"; payload: { tab: BrowserTab; filterType: string } }
  | { type: "BrowserViewModeSet"; payload: { tab: BrowserTab; viewMode: ViewMode } }
  | { type: "BrowserPreviewSizeSet"; payload: { tab: BrowserTab; sizeIndex: number } }
  | { type: "BrowserTabSettingsReset"; payload: { tab: BrowserTab; settings: TabSettings } }
  | { type: "BrowserFileSelected"; payload: { tab: BrowserTab; fileId: string; selectedFiles: string[] } }
  | { type: "BrowserFileDeselected"; payload: { tab: BrowserTab; fileId: string; selectedFiles: string[] } }
  | { type: "BrowserAllFilesSelected"; payload: { tab: BrowserTab; fileIds: string[]; selectedFiles: string[] } }
  | { type: "BrowserAllFilesDeselected"; payload: { tab: BrowserTab; selectedFiles: string[] } }
```

### 4. Command Helpers (AppCommands)

Extend `AppCommands` utility:

```typescript
export const AppCommands = {
  // ... existing commands ...
  
  // Browser commands
  browserSwitchTab: (tab: BrowserTab) => ({
    type: "BrowserSwitchTab" as const,
    params: { tab }
  }),
  
  browserSetSearchQuery: (query: string, tab?: BrowserTab) => ({
    type: "BrowserSetSearchQuery" as const,
    params: { query, tab }
  }),
  
  browserToggleFavorites: (tab?: BrowserTab) => ({
    type: "BrowserToggleFavorites" as const,
    params: { tab }
  }),
  
  browserSetSort: (sortBy: string, sortOrder: "asc" | "desc", tab?: BrowserTab) => ({
    type: "BrowserSetSort" as const,
    params: { sortBy, sortOrder, tab }
  }),
  
  // ... etc for all browser commands
}
```

### 5. Migrated BrowserDomainProvider Structure

```typescript
export function BrowserDomainProvider({ children }: BrowserDomainProviderProps) {
  const [browserState, setBrowserState] = useState<BrowserState | null>(null)
  const backendSync = getBackendSync()

  // Subscribe to backend state changes
  useEffect(() => {
    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      setBrowserState(state.browser_state)
    })
    return () => unsubscribe()
  }, [backendSync])

  // Browser service implementation using BackendSync
  const browserService: BrowserService = {
    switchTab: async (tab: BrowserTab) => {
      await backendSync.executeCommand(AppCommands.browserSwitchTab(tab))
    },
    
    setSearchQuery: async (query: string, tab?: BrowserTab) => {
      await backendSync.executeCommand(AppCommands.browserSetSearchQuery(query, tab))
    },
    
    // ... etc for all methods
  }

  return (
    <BrowserDomainContext.Provider value={{ browserService, browserState }}>
      {children}
    </BrowserDomainContext.Provider>
  )
}
```

## Implementation Steps

### Phase 1: Backend Implementation (Rust)
1. Add `BrowserState` to the Rust project state structure
2. Implement browser command handlers in the backend
3. Add browser event emission logic
4. Update state serialization/deserialization

### Phase 2: Frontend Types and Bindings
1. Update TypeScript types to include browser state
2. Regenerate Tauri bindings
3. Update AppCommands utility

### Phase 3: Provider Migration
1. Create new BrowserDomainProvider using BackendSync
2. Update all consumers to use the new provider
3. Remove old XState-based implementation
4. Add comprehensive error handling

### Phase 4: Testing and Validation
1. Create unit tests for the migrated provider
2. Create integration tests with MockBackendProvider
3. Test all browser functionality
4. Update documentation

## Benefits of This Approach

1. **Centralized State Management**: Browser state becomes part of the unified project state
2. **Consistency**: Follows the same pattern as other migrated providers
3. **Persistence**: Browser state is automatically persisted with project state
4. **Synchronization**: Real-time synchronization across multiple browser instances
5. **Undo/Redo**: Browser actions can be part of the undo/redo system
6. **Testing**: Easier to test with MockBackendProvider

## Considerations

1. **Performance**: Browser state changes should be optimized to avoid unnecessary re-renders
2. **Backward Compatibility**: Need to migrate existing localStorage settings
3. **Serialization**: Sets need to be converted to arrays for JSON serialization
4. **Default Values**: Ensure proper default values for browser state
5. **Error Handling**: Robust error handling for all browser commands

## Migration Timeline

- **Week 1**: Backend implementation and type updates
- **Week 2**: Frontend provider migration and testing
- **Week 3**: Integration testing and documentation updates
- **Week 4**: Production deployment and monitoring
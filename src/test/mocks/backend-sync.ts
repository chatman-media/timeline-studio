import { vi } from "vitest"
import type {
  BrowserEvent,
  BrowserState,
  ProjectCommand,
  ProjectEvent,
  ProjectState,
} from "@/types/generated/tauri-bindings"

// Mock browser state
const DEFAULT_BROWSER_STATE: BrowserState = {
  active_tab: "media",
  tab_settings: {
    media: {
      search_query: "",
      show_favorites_only: false,
      sort_by: "name",
      sort_order: "asc",
      group_by: "none",
      filter_type: "all",
      view_mode: "thumbnails",
      preview_size_index: 2,
    },
    effects: {
      search_query: "",
      show_favorites_only: false,
      sort_by: "name",
      sort_order: "asc",
      group_by: "none",
      filter_type: "all",
      view_mode: "thumbnails",
      preview_size_index: 2,
    },
    filters: {
      search_query: "",
      show_favorites_only: false,
      sort_by: "name",
      sort_order: "asc",
      group_by: "none",
      filter_type: "all",
      view_mode: "thumbnails",
      preview_size_index: 2,
    },
    transitions: {
      search_query: "",
      show_favorites_only: false,
      sort_by: "name",
      sort_order: "asc",
      group_by: "none",
      filter_type: "all",
      view_mode: "thumbnails",
      preview_size_index: 2,
    },
    templates: {
      search_query: "",
      show_favorites_only: false,
      sort_by: "name",
      sort_order: "asc",
      group_by: "none",
      filter_type: "all",
      view_mode: "thumbnails",
      preview_size_index: 2,
    },
    style_templates: {
      search_query: "",
      show_favorites_only: false,
      sort_by: "name",
      sort_order: "asc",
      group_by: "none",
      filter_type: "all",
      view_mode: "thumbnails",
      preview_size_index: 2,
    },
  },
  selected_files: {
    media: [],
    effects: [],
    filters: [],
    transitions: [],
    templates: [],
    style_templates: [],
  },
  favorites: {
    media: [],
    music: [],
    subtitles: [],
    effects: [],
    filters: [],
    transitions: [],
    templates: [],
    style_templates: [],
  },
}

// Stateful mock data
let mockBrowserState: BrowserState = { ...DEFAULT_BROWSER_STATE }
const stateChangeHandlers: Array<(state: ProjectState) => void> = []
const eventHandlers: Array<(event: ProjectEvent) => void> = []

// Helper to trigger backend event
function triggerBrowserEvent(browserEvent: BrowserEvent) {
  const projectEvent: ProjectEvent = {
    type: "Browser",
    payload: browserEvent,
  }

  // Use queueMicrotask to ensure React has time to process events
  queueMicrotask(() => {
    eventHandlers.forEach((handler) => handler(projectEvent))
  })
}

// Helper to trigger state change
function triggerStateChange() {
  const state: ProjectState = {
    version: 1,
    version_info: {
      current_version_id: "initial",
      branch_name: "main",
      has_uncommitted_changes: false,
      last_snapshot_time: new Date().toISOString(),
      auto_save_enabled: true,
      auto_save_interval_seconds: 30,
    },
    browser_state: mockBrowserState,
    clipboard: null,
    project: null,
    ui_state: {
      selected_clips: [],
      selected_tracks: [],
      selected_sections: [],
      timeline_zoom: 1,
      timeline_scroll: 0,
      active_tool: "select",
      browser_state: null,
    },
    playback_state: {
      is_playing: false,
      current_time: 0,
      playback_rate: 1,
      loop_enabled: false,
      loop_start: null,
      loop_end: null,
      volume: 1,
      current_media_id: null,
      selected_clip_id: null,
      video_source: "browser",
      applied_effects: [],
      applied_filters: [],
      applied_template: null,
      is_loading: false,
      is_seeking: false,
      duration: 0,
    },
    chat_sessions: [],
  }
  // Use queueMicrotask to ensure React has time to process state updates
  queueMicrotask(() => {
    stateChangeHandlers.forEach((handler) => handler(state))
  })
}

// Command handlers
function handleBrowserCommand(command: ProjectCommand) {
  const activeTab = mockBrowserState.active_tab

  switch (command.type) {
    case "BrowserSwitchTab":
      if (command.params?.tab) {
        mockBrowserState = {
          ...mockBrowserState,
          active_tab: command.params.tab,
        }
        // Emit BrowserEvent for tab switch
        triggerBrowserEvent({
          event_type: "TabSwitched",
          data: {
            tab: command.params.tab,
          },
        } as any)
        triggerStateChange()
      }
      break

    case "BrowserSetSearchQuery":
      if (command.params) {
        const tab = command.params.tab || activeTab
        mockBrowserState = {
          ...mockBrowserState,
          tab_settings: {
            ...mockBrowserState.tab_settings,
            [tab]: {
              ...mockBrowserState.tab_settings[tab],
              search_query: command.params.query,
            },
          },
        }
        // Emit BrowserEvent
        triggerBrowserEvent({
          event_type: "SearchQueryChanged",
          data: {
            tab,
            query: command.params.query,
          },
        } as any)
        triggerStateChange()
      }
      break

    case "BrowserToggleFavorites":
      const favTab = command.params?.tab || activeTab
      const currentSettings = mockBrowserState.tab_settings[favTab]
      if (currentSettings) {
        const newShowFavorites = !currentSettings.show_favorites_only
        mockBrowserState = {
          ...mockBrowserState,
          tab_settings: {
            ...mockBrowserState.tab_settings,
            [favTab]: {
              ...currentSettings,
              show_favorites_only: newShowFavorites,
            },
          },
        }
        // Emit BrowserEvent
        triggerBrowserEvent({
          event_type: "FavoritesToggled",
          data: {
            tab: favTab,
            show_favorites: newShowFavorites,
          },
        } as any)
        triggerStateChange()
      }
      break

    case "BrowserSetSort":
      if (command.params) {
        const tab = command.params.tab || activeTab
        mockBrowserState = {
          ...mockBrowserState,
          tab_settings: {
            ...mockBrowserState.tab_settings,
            [tab]: {
              ...mockBrowserState.tab_settings[tab],
              sort_by: command.params.sort_by,
              sort_order: command.params.sort_order,
            },
          },
        }
        // Emit BrowserEvent
        triggerBrowserEvent({
          event_type: "SortChanged",
          data: {
            tab,
            sort_by: command.params.sort_by,
            sort_order: command.params.sort_order,
          },
        } as any)
        triggerStateChange()
      }
      break

    case "BrowserSetGroupBy":
      if (command.params) {
        const tab = command.params.tab || activeTab
        mockBrowserState = {
          ...mockBrowserState,
          tab_settings: {
            ...mockBrowserState.tab_settings,
            [tab]: {
              ...mockBrowserState.tab_settings[tab],
              group_by: command.params.group_by,
            },
          },
        }
        // Emit BrowserEvent
        triggerBrowserEvent({
          event_type: "GroupByChanged",
          data: {
            tab,
            group_by: command.params.group_by,
          },
        } as any)
        triggerStateChange()
      }
      break

    case "BrowserSetFilter":
      if (command.params) {
        const tab = command.params.tab || activeTab
        mockBrowserState = {
          ...mockBrowserState,
          tab_settings: {
            ...mockBrowserState.tab_settings,
            [tab]: {
              ...mockBrowserState.tab_settings[tab],
              filter_type: command.params.filter_type,
            },
          },
        }
        // Emit BrowserEvent
        triggerBrowserEvent({
          event_type: "FilterChanged",
          data: {
            tab,
            filter_type: command.params.filter_type,
          },
        } as any)
        triggerStateChange()
      }
      break

    case "BrowserSetViewMode":
      if (command.params) {
        const tab = command.params.tab || activeTab
        mockBrowserState = {
          ...mockBrowserState,
          tab_settings: {
            ...mockBrowserState.tab_settings,
            [tab]: {
              ...mockBrowserState.tab_settings[tab],
              view_mode: command.params.view_mode,
            },
          },
        }
        // Emit BrowserEvent
        triggerBrowserEvent({
          event_type: "ViewModeChanged",
          data: {
            tab,
            view_mode: command.params.view_mode,
          },
        } as any)
        triggerStateChange()
      }
      break

    case "BrowserSetPreviewSize":
      if (command.params !== undefined) {
        const tab = command.params.tab || activeTab
        mockBrowserState = {
          ...mockBrowserState,
          tab_settings: {
            ...mockBrowserState.tab_settings,
            [tab]: {
              ...mockBrowserState.tab_settings[tab],
              preview_size_index: command.params.size_index,
            },
          },
        }
        // Emit BrowserEvent
        triggerBrowserEvent({
          event_type: "PreviewSizeChanged",
          data: {
            tab,
            size_index: command.params.size_index,
          },
        } as any)
        triggerStateChange()
      }
      break

    case "BrowserResetTabSettings":
      if (command.params?.tab) {
        const defaultSettings = {
          search_query: "",
          show_favorites_only: false,
          sort_by: "name",
          sort_order: "asc",
          group_by: "none",
          filter_type: "all",
          view_mode: "thumbnails",
          preview_size_index: 2,
        }
        mockBrowserState = {
          ...mockBrowserState,
          tab_settings: {
            ...mockBrowserState.tab_settings,
            [command.params.tab]: defaultSettings,
          },
        }
        // Emit BrowserEvent for tab settings reset
        triggerBrowserEvent({
          event_type: "TabSettingsReset",
          data: {
            tab: command.params.tab,
          },
        } as any)
        triggerStateChange()
      }
      break

    case "BrowserSelectFile":
      if (command.params?.file_id) {
        const tab = command.params.tab || activeTab
        const currentFiles = mockBrowserState.selected_files[tab] || []
        if (!currentFiles.includes(command.params.file_id)) {
          // Create new state object to trigger React re-render
          mockBrowserState = {
            ...mockBrowserState,
            selected_files: {
              ...mockBrowserState.selected_files,
              [tab]: [...currentFiles, command.params.file_id],
            },
          }
          // Emit BrowserEvent
          triggerBrowserEvent({
            event_type: "FileSelected",
            data: {
              tab,
              file_id: command.params.file_id,
            },
          } as any)
          triggerStateChange()
        }
      }
      break

    case "BrowserDeselectFile":
      if (command.params?.file_id) {
        const tab = command.params.tab || activeTab
        const currentFiles = mockBrowserState.selected_files[tab] || []
        // Create new state object to trigger React re-render
        mockBrowserState = {
          ...mockBrowserState,
          selected_files: {
            ...mockBrowserState.selected_files,
            [tab]: currentFiles.filter((id) => id !== command.params.file_id),
          },
        }
        // Emit BrowserEvent
        triggerBrowserEvent({
          event_type: "FileDeselected",
          data: {
            tab,
            file_id: command.params.file_id,
          },
        } as any)
        triggerStateChange()
      }
      break

    case "BrowserToggleFileSelection":
      if (command.params?.file_id) {
        const tab = command.params.tab || activeTab
        const files = mockBrowserState.selected_files[tab] || []
        const isSelected = !files.includes(command.params.file_id)
        // Create new state object to trigger React re-render
        mockBrowserState = {
          ...mockBrowserState,
          selected_files: {
            ...mockBrowserState.selected_files,
            [tab]: isSelected
              ? [...files, command.params.file_id]
              : files.filter((id) => id !== command.params.file_id),
          },
        }
        // Emit BrowserEvent
        triggerBrowserEvent({
          event_type: "FileSelectionToggled",
          data: {
            tab,
            file_id: command.params.file_id,
            is_selected: isSelected,
          },
        } as any)
        triggerStateChange()
      }
      break

    case "BrowserSelectAllFiles":
      if (command.params?.file_ids) {
        const tab = command.params.tab || activeTab
        // Create new state object to trigger React re-render
        mockBrowserState = {
          ...mockBrowserState,
          selected_files: {
            ...mockBrowserState.selected_files,
            [tab]: [...command.params.file_ids],
          },
        }
        // Emit BrowserEvent
        triggerBrowserEvent({
          event_type: "AllFilesSelected",
          data: {
            tab,
            file_ids: command.params.file_ids,
          },
        } as any)
        triggerStateChange()
      }
      break

    case "BrowserDeselectAllFiles":
      const deselectTab = command.params?.tab || activeTab
      // Create new state object to trigger React re-render
      mockBrowserState = {
        ...mockBrowserState,
        selected_files: {
          ...mockBrowserState.selected_files,
          [deselectTab]: [],
        },
      }
      // Emit BrowserEvent
      triggerBrowserEvent({
        event_type: "AllFilesDeselected",
        data: {
          tab: deselectTab,
        },
      } as any)
      triggerStateChange()
      break
  }
}

// Mock implementation of BackendSync
export const mockBackendSync = {
  connected: true,
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  isConnected: vi.fn().mockReturnValue(true),
  executeCommand: vi.fn(async (command: ProjectCommand) => {
    handleBrowserCommand(command)
    return { success: true, error: null, data: null }
  }),
  getProjectState: vi.fn(async () => ({
    version: 1,
    version_info: {
      current_version_id: "initial",
      branch_name: "main",
      has_uncommitted_changes: false,
      last_snapshot_time: new Date().toISOString(),
      auto_save_enabled: true,
      auto_save_interval_seconds: 30,
    },
    browser_state: mockBrowserState,
    clipboard: null,
    project: null,
    ui_state: {
      selected_clips: [],
      selected_tracks: [],
      selected_sections: [],
      timeline_zoom: 1,
      timeline_scroll: 0,
      active_tool: "select",
      browser_state: null,
    },
    playback_state: {
      is_playing: false,
      current_time: 0,
      playback_rate: 1,
      loop_enabled: false,
      loop_start: null,
      loop_end: null,
      volume: 1,
      current_media_id: null,
      selected_clip_id: null,
      video_source: "browser",
      applied_effects: [],
      applied_filters: [],
      applied_template: null,
      is_loading: false,
      is_seeking: false,
      duration: 0,
    },
    chat_sessions: [],
  })),
  createSnapshot: vi.fn().mockResolvedValue({ success: true, error: null, data: { version_id: "test-snap" } }),
  restoreVersion: vi.fn().mockResolvedValue({ success: true, error: null, data: {} }),
  getVersionHistory: vi.fn().mockResolvedValue({ success: true, error: null, data: { versions: [] } }),
  compareVersions: vi.fn().mockResolvedValue({ success: true, error: null, data: {} }),
  createBranch: vi.fn().mockResolvedValue({ success: true, error: null, data: {} }),
  switchBranch: vi.fn().mockResolvedValue({ success: true, error: null, data: {} }),
  setAutoSaveInterval: vi.fn().mockResolvedValue({ success: true, error: null, data: {} }),
  enableAutoSave: vi.fn().mockResolvedValue({ success: true, error: null, data: {} }),
  mergeBranch: vi.fn().mockResolvedValue({ success: true, error: null, data: {} }),
  onEvent: vi.fn((handler: (event: ProjectEvent) => void) => {
    // Add handler if it's not already in the array
    if (!eventHandlers.includes(handler)) {
      eventHandlers.push(handler)
    }

    // Return unsubscribe function
    return () => {
      const index = eventHandlers.indexOf(handler)
      if (index > -1) {
        eventHandlers.splice(index, 1)
      }
    }
  }),
  onStateChange: vi.fn((handler: (state: ProjectState) => void) => {
    // Only add handler if it's not already in the array
    if (!stateChangeHandlers.includes(handler)) {
      stateChangeHandlers.push(handler)
    }

    // Call handler immediately with current state
    // Use queueMicrotask to ensure it's async and doesn't interfere with React rendering
    queueMicrotask(() => {
      try {
        handler({
          version: 1,
          version_info: {
            current_version_id: "initial",
            branch_name: "main",
            has_uncommitted_changes: false,
            last_snapshot_time: new Date().toISOString(),
            auto_save_enabled: true,
            auto_save_interval_seconds: 30,
          },
          browser_state: mockBrowserState,
          clipboard: null,
          project: null,
          ui_state: {
            selected_clips: [],
            selected_tracks: [],
            selected_sections: [],
            timeline_zoom: 1,
            timeline_scroll: 0,
            active_tool: "select",
            browser_state: null,
          },
          playback_state: {
            is_playing: false,
            current_time: 0,
            playback_rate: 1,
            loop_enabled: false,
            loop_start: null,
            loop_end: null,
            volume: 1,
            current_media_id: null,
            selected_clip_id: null,
            video_source: "browser",
            applied_effects: [],
            applied_filters: [],
            applied_template: null,
            is_loading: false,
            is_seeking: false,
            duration: 0,
          },
          chat_sessions: [],
        })
      } catch (error) {
        // Ignore errors during test initialization
        console.warn("Error calling state change handler:", error)
      }
    })

    // Return unsubscribe function
    return () => {
      const index = stateChangeHandlers.indexOf(handler)
      if (index > -1) {
        stateChangeHandlers.splice(index, 1)
      }
    }
  }),
  sendCommand: vi.fn(),
}

// Helper to reset mock state between tests
export function resetMockBrowserState() {
  // Deep clone to avoid shared references
  mockBrowserState = {
    active_tab: DEFAULT_BROWSER_STATE.active_tab,
    tab_settings: {
      media: DEFAULT_BROWSER_STATE.tab_settings.media ? { ...DEFAULT_BROWSER_STATE.tab_settings.media } : undefined,
      effects: DEFAULT_BROWSER_STATE.tab_settings.effects
        ? { ...DEFAULT_BROWSER_STATE.tab_settings.effects }
        : undefined,
      filters: DEFAULT_BROWSER_STATE.tab_settings.filters
        ? { ...DEFAULT_BROWSER_STATE.tab_settings.filters }
        : undefined,
      transitions: DEFAULT_BROWSER_STATE.tab_settings.transitions
        ? { ...DEFAULT_BROWSER_STATE.tab_settings.transitions }
        : undefined,
      templates: DEFAULT_BROWSER_STATE.tab_settings.templates
        ? { ...DEFAULT_BROWSER_STATE.tab_settings.templates }
        : undefined,
      style_templates: DEFAULT_BROWSER_STATE.tab_settings.style_templates
        ? { ...DEFAULT_BROWSER_STATE.tab_settings.style_templates }
        : undefined,
    },
    selected_files: {
      media: DEFAULT_BROWSER_STATE.selected_files.media ? [...DEFAULT_BROWSER_STATE.selected_files.media] : undefined,
      effects: DEFAULT_BROWSER_STATE.selected_files.effects
        ? [...DEFAULT_BROWSER_STATE.selected_files.effects]
        : undefined,
      filters: DEFAULT_BROWSER_STATE.selected_files.filters
        ? [...DEFAULT_BROWSER_STATE.selected_files.filters]
        : undefined,
      transitions: DEFAULT_BROWSER_STATE.selected_files.transitions
        ? [...DEFAULT_BROWSER_STATE.selected_files.transitions]
        : undefined,
      templates: DEFAULT_BROWSER_STATE.selected_files.templates
        ? [...DEFAULT_BROWSER_STATE.selected_files.templates]
        : undefined,
      style_templates: DEFAULT_BROWSER_STATE.selected_files.style_templates
        ? [...DEFAULT_BROWSER_STATE.selected_files.style_templates]
        : undefined,
    },
    favorites: {
      media: DEFAULT_BROWSER_STATE.favorites.media ? [...DEFAULT_BROWSER_STATE.favorites.media] : undefined,
      music: DEFAULT_BROWSER_STATE.favorites.music ? [...DEFAULT_BROWSER_STATE.favorites.music] : undefined,
      subtitles: DEFAULT_BROWSER_STATE.favorites.subtitles ? [...DEFAULT_BROWSER_STATE.favorites.subtitles] : undefined,
      effects: DEFAULT_BROWSER_STATE.favorites.effects ? [...DEFAULT_BROWSER_STATE.favorites.effects] : undefined,
      filters: DEFAULT_BROWSER_STATE.favorites.filters ? [...DEFAULT_BROWSER_STATE.favorites.filters] : undefined,
      transitions: DEFAULT_BROWSER_STATE.favorites.transitions
        ? [...DEFAULT_BROWSER_STATE.favorites.transitions]
        : undefined,
      templates: DEFAULT_BROWSER_STATE.favorites.templates ? [...DEFAULT_BROWSER_STATE.favorites.templates] : undefined,
      style_templates: DEFAULT_BROWSER_STATE.favorites.style_templates
        ? [...DEFAULT_BROWSER_STATE.favorites.style_templates]
        : undefined,
    },
  }

  // Notify all handlers about the reset state instead of clearing them
  triggerStateChange()
}

// Helper to reset executeCommand mock
export function resetExecuteCommandMock() {
  // Reset all mocks to their original implementations
  mockBackendSync.executeCommand = vi.fn(async (command: ProjectCommand) => {
    handleBrowserCommand(command)
    return { success: true, error: null, data: null }
  })

  mockBackendSync.getProjectState = vi.fn(async () => ({
    version: 1,
    version_info: {
      current_version_id: "initial",
      branch_name: "main",
      has_uncommitted_changes: false,
      last_snapshot_time: new Date().toISOString(),
      auto_save_enabled: true,
      auto_save_interval_seconds: 30,
    },
    browser_state: mockBrowserState,
    clipboard: null,
    project: null,
    ui_state: {
      selected_clips: [],
      selected_tracks: [],
      selected_sections: [],
      timeline_zoom: 1,
      timeline_scroll: 0,
      active_tool: "select",
      browser_state: null,
    },
    playback_state: {
      is_playing: false,
      current_time: 0,
      playback_rate: 1,
      loop_enabled: false,
      loop_start: null,
      loop_end: null,
      volume: 1,
      current_media_id: null,
      selected_clip_id: null,
      video_source: "browser",
      applied_effects: [],
      applied_filters: [],
      applied_template: null,
      is_loading: false,
      is_seeking: false,
      duration: 0,
    },
    chat_sessions: [],
  }))

  mockBackendSync.onEvent = vi.fn((handler: (event: ProjectEvent) => void) => {
    // Add handler if it's not already in the array
    if (!eventHandlers.includes(handler)) {
      eventHandlers.push(handler)
    }

    // Return unsubscribe function
    return () => {
      const index = eventHandlers.indexOf(handler)
      if (index > -1) {
        eventHandlers.splice(index, 1)
      }
    }
  })

  mockBackendSync.onStateChange = vi.fn((handler: (state: ProjectState) => void) => {
    // Only add handler if it's not already in the array
    if (!stateChangeHandlers.includes(handler)) {
      stateChangeHandlers.push(handler)
    }

    // Call handler immediately with current state
    // Use queueMicrotask to ensure it's async and doesn't interfere with React rendering
    queueMicrotask(() => {
      try {
        handler({
          version: 1,
          version_info: {
            current_version_id: "initial",
            branch_name: "main",
            has_uncommitted_changes: false,
            last_snapshot_time: new Date().toISOString(),
            auto_save_enabled: true,
            auto_save_interval_seconds: 30,
          },
          browser_state: mockBrowserState,
          clipboard: null,
          project: null,
          ui_state: {
            selected_clips: [],
            selected_tracks: [],
            selected_sections: [],
            timeline_zoom: 1,
            timeline_scroll: 0,
            active_tool: "select",
            browser_state: null,
          },
          playback_state: {
            is_playing: false,
            current_time: 0,
            playback_rate: 1,
            loop_enabled: false,
            loop_start: null,
            loop_end: null,
            volume: 1,
            current_media_id: null,
            selected_clip_id: null,
            video_source: "browser",
            applied_effects: [],
            applied_filters: [],
            applied_template: null,
            is_loading: false,
            is_seeking: false,
            duration: 0,
          },
          chat_sessions: [],
        })
      } catch (error) {
        // Ignore errors during test initialization
        console.warn("Error calling state change handler:", error)
      }
    })

    // Return unsubscribe function
    return () => {
      const index = stateChangeHandlers.indexOf(handler)
      if (index > -1) {
        stateChangeHandlers.splice(index, 1)
      }
    }
  })
}

// Helper to clear all state change handlers (useful for cleanup between tests)
export function clearStateChangeHandlers() {
  stateChangeHandlers.length = 0
  eventHandlers.length = 0
}

// Register mock backend with container
import { container } from "@timeline-studio/core/container"

// Register the mock backend in the container so it's available to all components
container.registerBackend(mockBackendSync as any)

// Export for backward compatibility (some tests might still use getBackendSync)
export const getBackendSync = vi.fn(() => mockBackendSync)

// Mock BackendSync class constructor
export const BackendSync = vi.fn().mockImplementation(() => mockBackendSync)

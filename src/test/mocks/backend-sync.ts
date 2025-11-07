import { vi } from "vitest"
import type { BrowserState, ProjectCommand, ProjectState } from "@/types/generated/tauri-bindings"

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
    "style-templates": {
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
    "style-templates": [],
  },
}

// Stateful mock data
let mockBrowserState: BrowserState = { ...DEFAULT_BROWSER_STATE }
const stateChangeHandlers: Array<(state: ProjectState) => void> = []

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
  }
  stateChangeHandlers.forEach((handler) => handler(state))
}

// Command handlers
function handleBrowserCommand(command: ProjectCommand) {
  const activeTab = mockBrowserState.active_tab

  switch (command.type) {
    case "BrowserSelectFile":
      if (command.params?.file_id) {
        const tab = command.params.tab || activeTab
        if (!mockBrowserState.selected_files[tab].includes(command.params.file_id)) {
          // Create new state object to trigger React re-render
          mockBrowserState = {
            ...mockBrowserState,
            selected_files: {
              ...mockBrowserState.selected_files,
              [tab]: [...mockBrowserState.selected_files[tab], command.params.file_id],
            },
          }
          triggerStateChange()
        }
      }
      break

    case "BrowserDeselectFile":
      if (command.params?.file_id) {
        const tab = command.params.tab || activeTab
        // Create new state object to trigger React re-render
        mockBrowserState = {
          ...mockBrowserState,
          selected_files: {
            ...mockBrowserState.selected_files,
            [tab]: mockBrowserState.selected_files[tab].filter((id) => id !== command.params.file_id),
          },
        }
        triggerStateChange()
      }
      break

    case "BrowserToggleFileSelection":
      if (command.params?.file_id) {
        const tab = command.params.tab || activeTab
        const files = mockBrowserState.selected_files[tab]
        // Create new state object to trigger React re-render
        mockBrowserState = {
          ...mockBrowserState,
          selected_files: {
            ...mockBrowserState.selected_files,
            [tab]: files.includes(command.params.file_id)
              ? files.filter((id) => id !== command.params.file_id)
              : [...files, command.params.file_id],
          },
        }
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
        triggerStateChange()
      }
      break

    case "BrowserDeselectAllFiles":
      const tab = command.params?.tab || activeTab
      // Create new state object to trigger React re-render
      mockBrowserState = {
        ...mockBrowserState,
        selected_files: {
          ...mockBrowserState.selected_files,
          [tab]: [],
        },
      }
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
  onEvent: vi.fn(() => () => {}),
  onStateChange: vi.fn((handler: (state: ProjectState) => void) => {
    stateChangeHandlers.push(handler)
    // Call handler immediately with current state
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
      media: { ...DEFAULT_BROWSER_STATE.tab_settings.media },
      effects: { ...DEFAULT_BROWSER_STATE.tab_settings.effects },
      filters: { ...DEFAULT_BROWSER_STATE.tab_settings.filters },
      transitions: { ...DEFAULT_BROWSER_STATE.tab_settings.transitions },
      templates: { ...DEFAULT_BROWSER_STATE.tab_settings.templates },
      "style-templates": { ...DEFAULT_BROWSER_STATE.tab_settings["style-templates"] },
    },
    selected_files: {
      media: [...DEFAULT_BROWSER_STATE.selected_files.media],
      effects: [...DEFAULT_BROWSER_STATE.selected_files.effects],
      filters: [...DEFAULT_BROWSER_STATE.selected_files.filters],
      transitions: [...DEFAULT_BROWSER_STATE.selected_files.transitions],
      templates: [...DEFAULT_BROWSER_STATE.selected_files.templates],
      "style-templates": [...DEFAULT_BROWSER_STATE.selected_files["style-templates"]],
    },
  }

  // Notify all handlers about the reset state instead of clearing them
  triggerStateChange()
}

// Mock getBackendSync to always return the mock instance
export const getBackendSync = vi.fn(() => mockBackendSync)

// Mock BackendSync class constructor
export const BackendSync = vi.fn().mockImplementation(() => mockBackendSync)

// Auto-mock the module
vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync,
  BackendSync,
}))

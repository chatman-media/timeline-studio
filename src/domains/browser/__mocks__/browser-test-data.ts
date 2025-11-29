/**
 * Test data and utilities for Browser domain testing
 */

import type { BrowserState, BrowserTab, TabSettings } from "@/types/generated/tauri-bindings"

export const DEFAULT_TAB_SETTINGS: TabSettings = {
  search_query: "",
  show_favorites_only: false,
  sort_by: "name",
  sort_order: "asc",
  group_by: "none",
  filter_type: "all",
  view_mode: "thumbnails",
  preview_size_index: 2,
}

export const createMockTabSettings = (overrides?: Partial<TabSettings>): TabSettings => ({
  ...DEFAULT_TAB_SETTINGS,
  ...overrides,
})

export const createMockBrowserState = (overrides?: Partial<BrowserState>): BrowserState => ({
  active_tab: "media",
  tab_settings: {
    media: createMockTabSettings(),
    effects: createMockTabSettings(),
    filters: createMockTabSettings(),
    transitions: createMockTabSettings(),
    templates: createMockTabSettings(),
    style_templates: createMockTabSettings(),
  },
  selected_files: {
    media: [],
    effects: [],
    filters: [],
    transitions: [],
    templates: [],
    style_templates: [],
  },
  ...overrides,
})

export const ALL_BROWSER_TABS: BrowserTab[] = [
  "media",
  "effects",
  "filters",
  "transitions",
  "templates",
  "style_templates",
]

export const MOCK_FILE_IDS = {
  media: ["media-1", "media-2", "media-3"],
  effects: ["effect-1", "effect-2"],
  filters: ["filter-1", "filter-2"],
  transitions: ["transition-1", "transition-2"],
  templates: ["template-1"],
  style_templates: ["style-1"],
}

/**
 * Create a browser state with selected files
 */
export const createBrowserStateWithSelection = (tab: BrowserTab, fileIds: string[]): BrowserState => {
  return createMockBrowserState({
    active_tab: tab,
    selected_files: {
      ...createMockBrowserState().selected_files,
      [tab]: fileIds,
    },
  })
}

/**
 * Create a browser state with custom tab settings
 */
export const createBrowserStateWithSettings = (tab: BrowserTab, settings: Partial<TabSettings>): BrowserState => {
  const baseState = createMockBrowserState()
  return {
    ...baseState,
    active_tab: tab,
    tab_settings: {
      ...baseState.tab_settings,
      [tab]: createMockTabSettings(settings),
    },
  }
}

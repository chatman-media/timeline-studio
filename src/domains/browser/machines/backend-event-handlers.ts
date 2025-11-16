/**
 * Backend Event Handlers для Browser Machine
 *
 * Обрабатывает события от Rust backend и обновляет состояние машины
 * Используется паттерн Command-Event для синхронизации
 */

import { createLogger } from "@/lib/tauri-logger"
import type { BrowserEvent } from "@/types/generated/tauri-bindings"
import type { BrowserMachineContext } from "./browser-machine"

const logger = createLogger("BrowserEventHandlers")

/**
 * Главный обработчик backend событий для Browser
 */
export function handleBrowserBackendEvent(
  context: BrowserMachineContext,
  event: BrowserEvent,
): Partial<BrowserMachineContext> {
  logger.info("Handling browser backend event:", { event: event.event_type })

  switch (event.event_type) {
    case "TabSwitched":
      return handleTabSwitched(context, event)
    case "SearchQueryChanged":
      return handleSearchQueryChanged(context, event)
    case "FavoritesToggled":
      return handleFavoritesToggled(context, event)
    case "SortChanged":
      return handleSortChanged(context, event)
    case "GroupByChanged":
      return handleGroupByChanged(context, event)
    case "FilterChanged":
      return handleFilterChanged(context, event)
    case "ViewModeChanged":
      return handleViewModeChanged(context, event)
    case "PreviewSizeChanged":
      return handlePreviewSizeChanged(context, event)
    case "TabSettingsReset":
      return handleTabSettingsReset(context, event)
    case "FileSelected":
      return handleFileSelected(context, event)
    case "FileDeselected":
      return handleFileDeselected(context, event)
    case "FileSelectionToggled":
      return handleFileSelectionToggled(context, event)
    case "AllFilesSelected":
      return handleAllFilesSelected(context, event)
    case "AllFilesDeselected":
      return handleAllFilesDeselected(context, event)
    default:
      logger.debug("Unhandled browser backend event type:", { type: event.event_type })
      return {}
  }
}

// ============================================================================
// Tab Management Handlers
// ============================================================================

function handleTabSwitched(
  _context: BrowserMachineContext,
  event: Extract<BrowserEvent, { event_type: "TabSwitched" }>,
): Partial<BrowserMachineContext> {
  const { tab } = event.data

  logger.info("Tab switched:", { tab })

  return {
    activeTab: tab,
  }
}

// ============================================================================
// Tab Settings Handlers
// ============================================================================

function handleSearchQueryChanged(
  context: BrowserMachineContext,
  event: Extract<BrowserEvent, { event_type: "SearchQueryChanged" }>,
): Partial<BrowserMachineContext> {
  const { tab, query } = event.data

  logger.info("Search query changed:", { tab, query })

  const updatedTabSettings = { ...context.tabSettings }
  if (!updatedTabSettings[tab]) {
    updatedTabSettings[tab] = getDefaultTabSettings()
  }

  updatedTabSettings[tab] = {
    ...updatedTabSettings[tab],
    search_query: query,
  }

  return {
    tabSettings: updatedTabSettings,
  }
}

function handleFavoritesToggled(
  context: BrowserMachineContext,
  event: Extract<BrowserEvent, { event_type: "FavoritesToggled" }>,
): Partial<BrowserMachineContext> {
  const { tab, show_favorites } = event.data

  logger.info("Favorites toggled:", { tab, show_favorites })

  const updatedTabSettings = { ...context.tabSettings }
  if (!updatedTabSettings[tab]) {
    updatedTabSettings[tab] = getDefaultTabSettings()
  }

  updatedTabSettings[tab] = {
    ...updatedTabSettings[tab],
    show_favorites_only: show_favorites,
  }

  return {
    tabSettings: updatedTabSettings,
  }
}

function handleSortChanged(
  context: BrowserMachineContext,
  event: Extract<BrowserEvent, { event_type: "SortChanged" }>,
): Partial<BrowserMachineContext> {
  const { tab, sort_by, sort_order } = event.data

  logger.info("Sort changed:", { tab, sort_by, sort_order })

  const updatedTabSettings = { ...context.tabSettings }
  if (!updatedTabSettings[tab]) {
    updatedTabSettings[tab] = getDefaultTabSettings()
  }

  updatedTabSettings[tab] = {
    ...updatedTabSettings[tab],
    sort_by,
    sort_order,
  }

  return {
    tabSettings: updatedTabSettings,
  }
}

function handleGroupByChanged(
  context: BrowserMachineContext,
  event: Extract<BrowserEvent, { event_type: "GroupByChanged" }>,
): Partial<BrowserMachineContext> {
  const { tab, group_by } = event.data

  logger.info("Group by changed:", { tab, group_by })

  const updatedTabSettings = { ...context.tabSettings }
  if (!updatedTabSettings[tab]) {
    updatedTabSettings[tab] = getDefaultTabSettings()
  }

  updatedTabSettings[tab] = {
    ...updatedTabSettings[tab],
    group_by,
  }

  return {
    tabSettings: updatedTabSettings,
  }
}

function handleFilterChanged(
  context: BrowserMachineContext,
  event: Extract<BrowserEvent, { event_type: "FilterChanged" }>,
): Partial<BrowserMachineContext> {
  const { tab, filter_type } = event.data

  logger.info("Filter changed:", { tab, filter_type })

  const updatedTabSettings = { ...context.tabSettings }
  if (!updatedTabSettings[tab]) {
    updatedTabSettings[tab] = getDefaultTabSettings()
  }

  updatedTabSettings[tab] = {
    ...updatedTabSettings[tab],
    filter_type,
  }

  return {
    tabSettings: updatedTabSettings,
  }
}

function handleViewModeChanged(
  context: BrowserMachineContext,
  event: Extract<BrowserEvent, { event_type: "ViewModeChanged" }>,
): Partial<BrowserMachineContext> {
  const { tab, view_mode } = event.data

  logger.info("View mode changed:", { tab, view_mode })

  const updatedTabSettings = { ...context.tabSettings }
  if (!updatedTabSettings[tab]) {
    updatedTabSettings[tab] = getDefaultTabSettings()
  }

  updatedTabSettings[tab] = {
    ...updatedTabSettings[tab],
    view_mode,
  }

  return {
    tabSettings: updatedTabSettings,
  }
}

function handlePreviewSizeChanged(
  context: BrowserMachineContext,
  event: Extract<BrowserEvent, { event_type: "PreviewSizeChanged" }>,
): Partial<BrowserMachineContext> {
  const { tab, size_index } = event.data

  logger.info("Preview size changed:", { tab, size_index })

  const updatedTabSettings = { ...context.tabSettings }
  if (!updatedTabSettings[tab]) {
    updatedTabSettings[tab] = getDefaultTabSettings()
  }

  updatedTabSettings[tab] = {
    ...updatedTabSettings[tab],
    preview_size_index: size_index,
  }

  return {
    tabSettings: updatedTabSettings,
  }
}

function handleTabSettingsReset(
  context: BrowserMachineContext,
  event: Extract<BrowserEvent, { event_type: "TabSettingsReset" }>,
): Partial<BrowserMachineContext> {
  const { tab } = event.data

  logger.info("Tab settings reset:", { tab })

  const updatedTabSettings = { ...context.tabSettings }
  updatedTabSettings[tab] = getDefaultTabSettings()

  return {
    tabSettings: updatedTabSettings,
  }
}

// ============================================================================
// File Selection Handlers
// ============================================================================

function handleFileSelected(
  context: BrowserMachineContext,
  event: Extract<BrowserEvent, { event_type: "FileSelected" }>,
): Partial<BrowserMachineContext> {
  const { tab, file_id } = event.data

  logger.info("File selected:", { tab, file_id })

  const updatedSelectedFiles = { ...context.selectedFiles }
  if (!updatedSelectedFiles[tab]) {
    updatedSelectedFiles[tab] = []
  }

  if (!updatedSelectedFiles[tab].includes(file_id)) {
    updatedSelectedFiles[tab] = [...updatedSelectedFiles[tab], file_id]
  }

  return {
    selectedFiles: updatedSelectedFiles,
  }
}

function handleFileDeselected(
  context: BrowserMachineContext,
  event: Extract<BrowserEvent, { event_type: "FileDeselected" }>,
): Partial<BrowserMachineContext> {
  const { tab, file_id } = event.data

  logger.info("File deselected:", { tab, file_id })

  const updatedSelectedFiles = { ...context.selectedFiles }
  if (updatedSelectedFiles[tab]) {
    updatedSelectedFiles[tab] = updatedSelectedFiles[tab].filter((id) => id !== file_id)
  }

  return {
    selectedFiles: updatedSelectedFiles,
  }
}

function handleFileSelectionToggled(
  context: BrowserMachineContext,
  event: Extract<BrowserEvent, { event_type: "FileSelectionToggled" }>,
): Partial<BrowserMachineContext> {
  const { tab, file_id, is_selected } = event.data

  logger.info("File selection toggled:", { tab, file_id, is_selected })

  const updatedSelectedFiles = { ...context.selectedFiles }
  if (!updatedSelectedFiles[tab]) {
    updatedSelectedFiles[tab] = []
  }

  if (is_selected) {
    if (!updatedSelectedFiles[tab].includes(file_id)) {
      updatedSelectedFiles[tab] = [...updatedSelectedFiles[tab], file_id]
    }
  } else {
    updatedSelectedFiles[tab] = updatedSelectedFiles[tab].filter((id) => id !== file_id)
  }

  return {
    selectedFiles: updatedSelectedFiles,
  }
}

function handleAllFilesSelected(
  context: BrowserMachineContext,
  event: Extract<BrowserEvent, { event_type: "AllFilesSelected" }>,
): Partial<BrowserMachineContext> {
  const { tab, file_ids } = event.data

  logger.info("All files selected:", { tab, count: file_ids.length })

  const updatedSelectedFiles = { ...context.selectedFiles }
  updatedSelectedFiles[tab] = file_ids

  return {
    selectedFiles: updatedSelectedFiles,
  }
}

function handleAllFilesDeselected(
  context: BrowserMachineContext,
  event: Extract<BrowserEvent, { event_type: "AllFilesDeselected" }>,
): Partial<BrowserMachineContext> {
  const { tab } = event.data

  logger.info("All files deselected:", { tab })

  const updatedSelectedFiles = { ...context.selectedFiles }
  updatedSelectedFiles[tab] = []

  return {
    selectedFiles: updatedSelectedFiles,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getDefaultTabSettings() {
  return {
    search_query: "",
    show_favorites_only: false,
    sort_by: "name",
    sort_order: "asc" as const,
    group_by: "none",
    filter_type: "all",
    view_mode: "thumbnails" as const,
    preview_size_index: 2,
  }
}

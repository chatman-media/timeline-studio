/**
 * Browser Settings Hook
 *
 * Хук для работы с настройками браузера
 */

import type { BrowserTab } from "../types"
import { useBrowserDomain } from "./use-browser-domain"

export function useBrowserSettings(tab?: BrowserTab) {
  const {
    state,
    setSearchQuery,
    toggleFavorites,
    setSortOptions,
    setGroupBy,
    setFilter,
    setViewMode,
    setPreviewSize,
    resetTabSettings,
  } = useBrowserDomain()

  const activeTab = tab || state.context.activeTab
  const settings = state.context.tabSettings[activeTab]

  return {
    settings,
    activeTab,
    setSearchQuery: (query: string) => setSearchQuery(query, tab),
    toggleFavorites: () => toggleFavorites(tab),
    setSortOptions: (sortBy: string, sortOrder: "asc" | "desc") => setSortOptions(sortBy, sortOrder, tab),
    setGroupBy: (groupBy: string) => setGroupBy(groupBy, tab),
    setFilter: (filterType: string) => setFilter(filterType, tab),
    setViewMode: (viewMode: "thumbnails" | "list" | "grid") => setViewMode(viewMode, tab),
    setPreviewSize: (sizeIndex: number) => setPreviewSize(sizeIndex, tab),
    resetSettings: () => resetTabSettings(activeTab),
  }
}

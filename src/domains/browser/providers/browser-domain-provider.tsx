/**
 * Browser Domain Provider
 *
 * Централизованный провайдер для Browser домена
 */

import { useActor } from "@xstate/react"
import { createContext, type ReactNode } from "react"
import { browserMachine } from "../machines/browser-machine"
import type { BrowserService, BrowserTab, ViewMode } from "../types"

interface BrowserDomainContextValue extends BrowserService {
  state: any // XState v5 snapshot type
  isReady: boolean
}

export const BrowserDomainContext = createContext<BrowserDomainContextValue | null>(null)

interface BrowserDomainProviderProps {
  children: ReactNode
}

export function BrowserDomainProvider({ children }: BrowserDomainProviderProps) {
  const [state, send] = useActor(browserMachine)

  const browserService: BrowserService = {
    switchTab: (tab: BrowserTab) => {
      send({ type: "SWITCH_TAB", tab })
    },
    setSearchQuery: (query: string, tab?: BrowserTab) => {
      send({ type: "SET_SEARCH_QUERY", query, tab })
    },
    toggleFavorites: (tab?: BrowserTab) => {
      send({ type: "TOGGLE_FAVORITES", tab })
    },
    setSortOptions: (sortBy: string, sortOrder: "asc" | "desc", tab?: BrowserTab) => {
      send({ type: "SET_SORT", sortBy, sortOrder, tab })
    },
    setGroupBy: (groupBy: string, tab?: BrowserTab) => {
      send({ type: "SET_GROUP_BY", groupBy, tab })
    },
    setFilter: (filterType: string, tab?: BrowserTab) => {
      send({ type: "SET_FILTER", filterType, tab })
    },
    setViewMode: (viewMode: ViewMode, tab?: BrowserTab) => {
      send({ type: "SET_VIEW_MODE", viewMode, tab })
    },
    setPreviewSize: (sizeIndex: number, tab?: BrowserTab) => {
      send({ type: "SET_PREVIEW_SIZE", sizeIndex, tab })
    },
    resetTabSettings: (tab: BrowserTab) => {
      send({ type: "RESET_TAB_SETTINGS", tab })
    },
    selectFile: (fileId: string, tab?: BrowserTab) => {
      send({ type: "SELECT_FILE", fileId, tab })
    },
    deselectFile: (fileId: string, tab?: BrowserTab) => {
      send({ type: "DESELECT_FILE", fileId, tab })
    },
    toggleFileSelection: (fileId: string, tab?: BrowserTab) => {
      send({ type: "TOGGLE_FILE_SELECTION", fileId, tab })
    },
    selectAllFiles: (fileIds: string[], tab?: BrowserTab) => {
      send({ type: "SELECT_ALL_FILES", fileIds, tab })
    },
    deselectAllFiles: (tab?: BrowserTab) => {
      send({ type: "DESELECT_ALL_FILES", tab })
    },
  }

  const value: BrowserDomainContextValue = {
    ...browserService,
    state,
    isReady: true,
  }

  return <BrowserDomainContext.Provider value={value}>{children}</BrowserDomainContext.Provider>
}

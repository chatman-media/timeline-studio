import type { BrowserTab } from "@/core/types"

export interface BrowserStateAccess {
  getCurrentTab: () => BrowserTab
  getFiles: (tab?: BrowserTab) => any[]
  getSelectedFiles: () => any[]
  getFilters: () => any
  setFilters: (filters: any) => void
  selectFiles: (fileIds: string[]) => void
  deselectFiles: (fileIds: string[]) => void
  searchFiles: (query: string, options?: any) => any[]
  getFileGroups: (groupBy: string) => any[]
  getBrowserStats: () => {
    totalFiles: number
    selectedFiles: number
    filesByType: Record<string, number>
    totalSize: number
  }
}

let browserStateAccess: BrowserStateAccess | null = null

export function setBrowserStateAccess(access: BrowserStateAccess | null): void {
  browserStateAccess = access
}

export function getBrowserStateAccess(): BrowserStateAccess | null {
  return browserStateAccess
}

export function hasBrowserStateAccess(): boolean {
  return browserStateAccess !== null
}

export function requireBrowserStateAccess(): BrowserStateAccess {
  if (!browserStateAccess) {
    throw new Error("Browser state access не настроен")
  }
  return browserStateAccess
}

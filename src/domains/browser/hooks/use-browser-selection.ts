/**
 * Browser Selection Hook
 *
 * Хук для работы с выбранными файлами в браузере
 */

import type { BrowserTab } from "../types"
import { useBrowserDomain } from "./use-browser-domain"

export function useBrowserSelection(tab?: BrowserTab) {
  const { state, selectFile, deselectFile, toggleFileSelection, selectAllFiles, deselectAllFiles } = useBrowserDomain()

  const activeTab = tab || state.context.activeTab
  const selectedFiles = state.context.selectedFiles[activeTab]

  return {
    selectedFiles: Array.from(selectedFiles),
    selectedCount: selectedFiles.size,
    isSelected: (fileId: string) => selectedFiles.has(fileId),
    selectFile: (fileId: string) => selectFile(fileId, tab),
    deselectFile: (fileId: string) => deselectFile(fileId, tab),
    toggleFileSelection: (fileId: string) => toggleFileSelection(fileId, tab),
    selectAllFiles: (fileIds: string[]) => selectAllFiles(fileIds, tab),
    deselectAllFiles: () => deselectAllFiles(tab),
  }
}

/**
 * Media Import Hook
 *
 * Хук для работы с импортом медиа файлов
 */

import { useMediaManagement } from "./use-media-management"

export function useMediaImport() {
  const { mediaImportState, importFiles, selectMediaFiles, selectMediaDirectory, selectAudioFiles } =
    useMediaManagement()

  return {
    // Status
    isImporting: mediaImportState.isImporting,
    isCompleted: mediaImportState.isCompleted,
    isFailed: mediaImportState.isFailed,

    // Actions
    importFiles,
    selectMediaFiles,
    selectMediaDirectory,
    selectAudioFiles,

    // Import state
    status: mediaImportState.status,
  }
}

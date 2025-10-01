/**
 * Media Import Hook
 *
 * Хук для работы с импортом медиа файлов
 */

import type { MediaFileOperation } from "../types"
import { useMediaManagement } from "./use-media-management"

export function useMediaImport() {
  const { mediaImportState, importFiles, selectMediaFiles, selectAudioFiles } = useMediaManagement()

  const context = mediaImportState.context
  const isImporting = mediaImportState.matches("importing")
  const isCompleted = mediaImportState.matches("completed")
  const isFailed = mediaImportState.matches("failed")

  return {
    // State
    files: context.files,
    options: context.options,
    operations: context.operations,
    totalProgress: context.totalProgress,
    errors: context.errors,

    // Status
    isImporting,
    isCompleted,
    isFailed,

    // Actions
    importFiles,
    selectMediaFiles,
    selectAudioFiles,

    // Import stats
    totalFiles: context.files.length,
    completedCount: context.operations.filter((op: MediaFileOperation) => op.status === "completed").length,
    failedCount: context.operations.filter((op: MediaFileOperation) => op.status === "failed").length,
  }
}

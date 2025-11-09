/**
 * File Operations Hook
 *
 * Хук для работы с файловыми операциями
 */

import { useMediaManagement } from "./use-media-management"

export function useFileOperations() {
  const { fileOperationsState } = useMediaManagement()

  return {
    // All operations
    operations: fileOperationsState.operations,

    // Operation lists
    activeOperations: fileOperationsState.operations.filter((op) => op.status === "in_progress"),
    completedOperations: fileOperationsState.completedOperations,
    failedOperations: fileOperationsState.failedOperations,

    // Operation counts
    activeCount: fileOperationsState.operations.filter((op) => op.status === "in_progress").length,
    completedCount: fileOperationsState.completedOperations.length,
    failedCount: fileOperationsState.failedOperations.length,

    // Check if any operations are active
    hasActiveOperations: fileOperationsState.hasActiveOperations,

    // Get specific operation by id
    getOperation: (id: string) => fileOperationsState.operations.find((op) => op.id === id),
  }
}

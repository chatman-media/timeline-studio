/**
 * File Operations Hook
 *
 * Хук для работы с файловыми операциями
 */

import type { MediaFileOperation } from "../types"
import { useMediaManagement } from "./use-media-management"

export function useFileOperations() {
  const { fileOperationsState } = useMediaManagement()

  const context = fileOperationsState.context

  return {
    // All operations
    operations: Array.from(context.operations.values()),

    // Operation counts
    activeCount: context.activeOperations.length,
    completedCount: context.completedOperations.length,
    failedCount: context.failedOperations.length,

    // Operation lists
    activeOperations: context.activeOperations
      .map((id: string) => context.operations.get(id))
      .filter(Boolean) as MediaFileOperation[],

    completedOperations: context.completedOperations
      .map((id: string) => context.operations.get(id))
      .filter(Boolean) as MediaFileOperation[],

    failedOperations: context.failedOperations
      .map((id: string) => context.operations.get(id))
      .filter(Boolean) as MediaFileOperation[],

    // Get specific operation
    getOperation: (id: string) => context.operations.get(id),

    // Check if any operations are active
    hasActiveOperations: context.activeOperations.length > 0,
  }
}

/**
 * Optimistic Selection Hook
 *
 * Хук для оптимистичного обновления выбора файлов.
 * Обновляет UI немедленно, а затем синхронизирует с бэкендом.
 */

import { useCallback, useMemo, useState } from "react"

import { useBrowserActiveTab, useBrowserSelectedFiles } from "../providers/browser-provider"
import { getBrowserOrchestrator } from "../services/browser-orchestrator"

interface UseOptimisticSelectionReturn {
  /** Выбранные файлы (включая оптимистичные) */
  selectedFiles: Set<string>

  /** Проверить, выбран ли файл */
  isSelected: (fileId: string) => boolean

  /** Выбрать файл (оптимистично) */
  selectFile: (fileId: string) => Promise<void>

  /** Снять выбор с файла (оптимистично) */
  deselectFile: (fileId: string) => Promise<void>

  /** Переключить выбор файла (оптимистично) */
  toggleSelection: (fileId: string) => Promise<void>

  /** Выбрать все файлы (оптимистично) */
  selectAll: (fileIds: string[]) => Promise<void>

  /** Снять выбор со всех файлов (оптимистично) */
  deselectAll: () => Promise<void>

  /** Есть ли ожидающие операции */
  isPending: boolean
}

/**
 * Хук для оптимистичного управления выбором файлов
 *
 * @example
 * ```tsx
 * const { selectedFiles, isSelected, toggleSelection } = useOptimisticSelection()
 *
 * return (
 *   <div onClick={() => toggleSelection(file.id)}>
 *     {isSelected(file.id) ? '✓' : '○'} {file.name}
 *   </div>
 * )
 * ```
 */
export function useOptimisticSelection(): UseOptimisticSelectionReturn {
  const activeTab = useBrowserActiveTab()
  const backendSelectedFiles = useBrowserSelectedFiles()

  // Локальное оптимистичное состояние
  const [optimisticAdded, setOptimisticAdded] = useState<Set<string>>(new Set())
  const [optimisticRemoved, setOptimisticRemoved] = useState<Set<string>>(new Set())
  const [pendingCount, setPendingCount] = useState(0)

  // Комбинируем бэкенд и оптимистичное состояние
  const selectedFiles = useMemo(() => {
    const result = new Set(backendSelectedFiles)

    // Добавляем оптимистично добавленные
    for (const id of optimisticAdded) {
      result.add(id)
    }

    // Убираем оптимистично удалённые
    for (const id of optimisticRemoved) {
      result.delete(id)
    }

    return result
  }, [backendSelectedFiles, optimisticAdded, optimisticRemoved])

  const isSelected = useCallback(
    (fileId: string): boolean => {
      return selectedFiles.has(fileId)
    },
    [selectedFiles],
  )

  const selectFile = useCallback(async (fileId: string): Promise<void> => {
    // Оптимистичное обновление
    setOptimisticAdded((prev) => new Set(prev).add(fileId))
    setOptimisticRemoved((prev) => {
      const next = new Set(prev)
      next.delete(fileId)
      return next
    })
    setPendingCount((c) => c + 1)

    try {
      const orchestrator = getBrowserOrchestrator()
      await orchestrator.selectFile(fileId)
    } finally {
      // Убираем оптимистичное состояние после синхронизации с бэкендом
      setOptimisticAdded((prev) => {
        const next = new Set(prev)
        next.delete(fileId)
        return next
      })
      setPendingCount((c) => c - 1)
    }
  }, [])

  const deselectFile = useCallback(async (fileId: string): Promise<void> => {
    // Оптимистичное обновление
    setOptimisticRemoved((prev) => new Set(prev).add(fileId))
    setOptimisticAdded((prev) => {
      const next = new Set(prev)
      next.delete(fileId)
      return next
    })
    setPendingCount((c) => c + 1)

    try {
      const orchestrator = getBrowserOrchestrator()
      await orchestrator.deselectFile(fileId)
    } finally {
      // Убираем оптимистичное состояние после синхронизации с бэкендом
      setOptimisticRemoved((prev) => {
        const next = new Set(prev)
        next.delete(fileId)
        return next
      })
      setPendingCount((c) => c - 1)
    }
  }, [])

  const toggleSelection = useCallback(
    async (fileId: string): Promise<void> => {
      if (isSelected(fileId)) {
        await deselectFile(fileId)
      } else {
        await selectFile(fileId)
      }
    },
    [isSelected, selectFile, deselectFile],
  )

  const selectAll = useCallback(async (fileIds: string[]): Promise<void> => {
    // Оптимистичное обновление
    setOptimisticAdded((prev) => {
      const next = new Set(prev)
      for (const id of fileIds) {
        next.add(id)
      }
      return next
    })
    setOptimisticRemoved(new Set())
    setPendingCount((c) => c + 1)

    try {
      const orchestrator = getBrowserOrchestrator()
      await orchestrator.selectAllFiles(fileIds)
    } finally {
      // Убираем оптимистичное состояние
      setOptimisticAdded(new Set())
      setPendingCount((c) => c - 1)
    }
  }, [])

  const deselectAll = useCallback(async (): Promise<void> => {
    // Оптимистичное обновление - добавляем все текущие в removed
    setOptimisticRemoved(new Set(backendSelectedFiles))
    setOptimisticAdded(new Set())
    setPendingCount((c) => c + 1)

    try {
      const orchestrator = getBrowserOrchestrator()
      await orchestrator.deselectAllFiles()
    } finally {
      // Убираем оптимистичное состояние
      setOptimisticRemoved(new Set())
      setPendingCount((c) => c - 1)
    }
  }, [backendSelectedFiles])

  return {
    selectedFiles,
    isSelected,
    selectFile,
    deselectFile,
    toggleSelection,
    selectAll,
    deselectAll,
    isPending: pendingCount > 0,
  }
}

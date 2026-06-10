import { useCallback } from "react"

import type { MediaFile } from "@timeline-studio/core/types"
import { useBrowserState } from "@/features/browser/services"

/**
 * Хук для работы с выбором файлов в браузере
 *
 * Предоставляет удобные методы для работы с выбранными файлами:
 * - Проверка состояния выбора
 * - Переключение выбора
 * - Обработчик клика для чекбокса
 *
 * @param file - медиафайл для работы с выбором
 */
export function useFileSelection(file: MediaFile) {
  const browserState = useBrowserState()

  // Проверяем, выбран ли файл
  const isSelected = browserState.isFileSelected(file.id)

  // Переключение состояния выбора файла
  const toggleSelection = useCallback(async () => {
    await browserState.toggleFileSelection(file.id)
  }, [file.id, browserState])

  // Выбор файла
  const selectFile = useCallback(async () => {
    await browserState.selectFile(file.id)
  }, [file.id, browserState])

  // Отмена выбора файла
  const deselectFile = useCallback(async () => {
    await browserState.deselectFile(file.id)
  }, [file.id, browserState])

  // Обработчик клика для чекбокса (предотвращает всплытие события)
  const handleToggleSelection = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      void toggleSelection() // Fire and forget - UI обновится автоматически через state sync
    },
    [toggleSelection],
  )

  return {
    isSelected,
    toggleSelection,
    selectFile,
    deselectFile,
    handleToggleSelection,
  }
}

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react"

import { shortcutsRegistry } from "@/features/keyboard-shortcuts"

import { EDIT_MODE_CONFIGS, EDIT_MODES, type EditMode } from "../types/edit-modes"

interface UseEditModeReturn {
  editMode: EditMode
  setEditMode: (mode: EditMode) => void
  isEditMode: (mode: EditMode) => boolean
  cursor: string
}

export function useEditMode(initialMode: EditMode = EDIT_MODES.SELECT): UseEditModeReturn {
  const [editMode, setEditMode] = useState<EditMode>(initialMode)

  // Get cursor style for current mode
  const cursor = EDIT_MODE_CONFIGS[editMode].cursor

  // Helper to check if we're in a specific mode
  const isEditMode = useCallback((mode: EditMode) => editMode === mode, [editMode])

  // Register keyboard shortcuts for all edit modes
  useEffect(() => {
    const shortcuts = [
      {
        id: "edit-mode-select",
        action: () => setEditMode(EDIT_MODES.SELECT),
      },
      {
        id: "edit-mode-trim",
        action: () => setEditMode(EDIT_MODES.TRIM),
      },
      {
        id: "edit-mode-ripple",
        action: () => setEditMode(EDIT_MODES.RIPPLE),
      },
      {
        id: "edit-mode-roll",
        action: () => setEditMode(EDIT_MODES.ROLL),
      },
      {
        id: "edit-mode-slip",
        action: () => setEditMode(EDIT_MODES.SLIP),
      },
      {
        id: "edit-mode-slide",
        action: () => setEditMode(EDIT_MODES.SLIDE),
      },
      {
        id: "edit-mode-split",
        action: () => setEditMode(EDIT_MODES.SPLIT),
      },
      {
        id: "edit-mode-rate",
        action: () => setEditMode(EDIT_MODES.RATE),
      },
      {
        id: "edit-mode-escape",
        action: () => setEditMode(EDIT_MODES.SELECT),
      },
    ]

    // Регистрируем все shortcuts
    shortcuts.forEach(({ id, action }) => {
      shortcutsRegistry.updateAction(id, action)
    })

    // Очищаем actions при размонтировании
    return () => {
      shortcuts.forEach(({ id }) => {
        shortcutsRegistry.updateAction(id, undefined)
      })
    }
  }, [setEditMode, shortcutsRegistry])

  // Update document cursor based on edit mode
  useEffect(() => {
    const prevCursor = document.body.style.cursor
    document.body.style.cursor = cursor

    return () => {
      document.body.style.cursor = prevCursor
    }
  }, [cursor])

  return {
    editMode,
    setEditMode,
    isEditMode,
    cursor,
  }
}

// Context for sharing edit mode across timeline components
const EditModeContext = createContext<UseEditModeReturn | undefined>(undefined)

export function EditModeProvider({ children }: { children: ReactNode }) {
  const editMode = useEditMode()

  return <EditModeContext.Provider value={editMode}>{children}</EditModeContext.Provider>
}

export function useEditModeContext() {
  const context = useContext(EditModeContext)
  if (!context) {
    throw new Error("useEditModeContext must be used within EditModeProvider")
  }
  return context
}

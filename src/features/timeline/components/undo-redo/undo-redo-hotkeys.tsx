/**
 * Глобальные горячие клавиши для Undo/Redo
 */

import { useEffect } from "react"
import { useUndoRedo } from "../../hooks/use-undo-redo"

export function UndoRedoHotkeys() {
  const { undo, redo, canUndo, canRedo } = useUndoRedo()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Проверяем, что фокус не на input/textarea элементах
      const activeElement = document.activeElement
      const isInputActive =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          (activeElement as HTMLElement).contentEditable === "true")

      if (isInputActive) return

      // Ctrl+Z или Cmd+Z для отмены
      if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
        event.preventDefault()
        if (canUndo) {
          undo()
        }
        return
      }

      // Ctrl+Y, Cmd+Y или Ctrl+Shift+Z, Cmd+Shift+Z для повтора
      if (
        ((event.ctrlKey || event.metaKey) && event.key === "y") ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "z") ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "Z")
      ) {
        event.preventDefault()
        if (canRedo) {
          redo()
        }
        return
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [undo, redo, canUndo, canRedo])

  // Этот компонент ничего не рендерит - только обрабатывает горячие клавиши
  return null
}

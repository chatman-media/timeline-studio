/**
 * Простые кнопки Undo/Redo для интеграции в toolbar
 */

import { Redo, Undo } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useUndoRedo } from "../../hooks/use-undo-redo"

interface UndoRedoButtonsProps {
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  showBadge?: boolean
  showTooltips?: boolean
  className?: string
}

export function UndoRedoButtons({
  variant = "outline",
  size = "sm",
  showBadge = false,
  showTooltips = true,
  className = "",
}: UndoRedoButtonsProps) {
  const { undo, redo, canUndo, canRedo, undoableActions, redoableActions, historyStats } = useUndoRedo()

  const UndoButton = (
    <Button variant={variant} size={size} onClick={undo} disabled={!canUndo} className={`relative ${className}`}>
      <Undo className="h-4 w-4 mr-1" />
      Отменить
      {showBadge && historyStats.undoCount > 0 && (
        <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs h-4 min-w-4">
          {historyStats.undoCount}
        </Badge>
      )}
    </Button>
  )

  const RedoButton = (
    <Button variant={variant} size={size} onClick={redo} disabled={!canRedo} className={`relative ${className}`}>
      <Redo className="h-4 w-4 mr-1" />
      Повторить
      {showBadge && historyStats.redoCount > 0 && (
        <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs h-4 min-w-4">
          {historyStats.redoCount}
        </Badge>
      )}
    </Button>
  )

  if (!showTooltips) {
    return (
      <div className="flex items-center gap-1">
        {UndoButton}
        {RedoButton}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>{UndoButton}</TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-medium">{canUndo ? "Отменить действие" : "Нечего отменять"}</div>
              {canUndo && undoableActions[0] && (
                <div className="text-sm text-muted-foreground">{undoableActions[0].description}</div>
              )}
              <div className="text-xs text-muted-foreground">Ctrl+Z</div>
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>{RedoButton}</TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-medium">{canRedo ? "Повторить действие" : "Нечего повторять"}</div>
              {canRedo && redoableActions[0] && (
                <div className="text-sm text-muted-foreground">{redoableActions[0].description}</div>
              )}
              <div className="text-xs text-muted-foreground">Ctrl+Y</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

/**
 * Иконки-только версия для компактного отображения
 */
export function UndoRedoIconButtons({
  variant = "ghost",
  size = "sm",
  showTooltips = true,
  className = "",
}: Omit<UndoRedoButtonsProps, "showBadge">) {
  const { undo, redo, canUndo, canRedo, undoableActions, redoableActions } = useUndoRedo()

  const UndoButton = (
    <Button variant={variant} size={size} onClick={undo} disabled={!canUndo} className={className}>
      <Undo className="h-4 w-4" />
    </Button>
  )

  const RedoButton = (
    <Button variant={variant} size={size} onClick={redo} disabled={!canRedo} className={className}>
      <Redo className="h-4 w-4" />
    </Button>
  )

  if (!showTooltips) {
    return (
      <div className="flex items-center gap-1">
        {UndoButton}
        {RedoButton}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>{UndoButton}</TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-medium">{canUndo ? "Отменить" : "Нечего отменять"}</div>
              {canUndo && undoableActions[0] && (
                <div className="text-sm text-muted-foreground">{undoableActions[0].description}</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>{RedoButton}</TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-medium">{canRedo ? "Повторить" : "Нечего повторять"}</div>
              {canRedo && redoableActions[0] && (
                <div className="text-sm text-muted-foreground">{redoableActions[0].description}</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

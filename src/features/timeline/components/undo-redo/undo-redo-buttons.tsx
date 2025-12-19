/**
 * Простые кнопки Undo/Redo для интеграции в toolbar
 */

import { Redo, Undo } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useUndoRedo } from "@/domains/video-editing/hooks/use-undo-redo"

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
    <Button
      variant={variant}
      size={size}
      onClick={undo}
      disabled={!canUndo}
      className={`relative ${className}`}
      data-oid="-747grf"
    >
      <Undo className="h-4 w-4 mr-1" data-oid=":m61vap" />
      Отменить
      {showBadge && historyStats.undoCount > 0 && (
        <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs h-4 min-w-4" data-oid="wdwee66">
          {historyStats.undoCount}
        </Badge>
      )}
    </Button>
  )

  const RedoButton = (
    <Button
      variant={variant}
      size={size}
      onClick={redo}
      disabled={!canRedo}
      className={`relative ${className}`}
      data-oid="5t51t8v"
    >
      <Redo className="h-4 w-4 mr-1" data-oid="xu0ge20" />
      Повторить
      {showBadge && historyStats.redoCount > 0 && (
        <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs h-4 min-w-4" data-oid="9jyd2hy">
          {historyStats.redoCount}
        </Badge>
      )}
    </Button>
  )

  if (!showTooltips) {
    return (
      <div className="flex items-center gap-1" data-oid="q6hbf3g">
        {UndoButton}
        {RedoButton}
      </div>
    )
  }

  return (
    <TooltipProvider data-oid=".7cbs-q">
      <div className="flex items-center gap-1" data-oid="m_fp2n5">
        <Tooltip data-oid=".oel3px">
          <TooltipTrigger asChild data-oid="b0x1-ve">
            {UndoButton}
          </TooltipTrigger>
          <TooltipContent data-oid="06ploe_">
            <div className="space-y-1" data-oid="qy:e8q3">
              <div className="font-medium" data-oid="f:2yiyn">
                {canUndo ? "Отменить действие" : "Нечего отменять"}
              </div>
              {canUndo && undoableActions[0] && (
                <div className="text-sm text-muted-foreground" data-oid="gbqjvlk">
                  {undoableActions[0].description}
                </div>
              )}
              <div className="text-xs text-muted-foreground" data-oid="5vemz.z">
                Ctrl+Z
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip data-oid="ghkiyo-">
          <TooltipTrigger asChild data-oid="-vwyw13">
            {RedoButton}
          </TooltipTrigger>
          <TooltipContent data-oid="n6-oq:r">
            <div className="space-y-1" data-oid="q0lyxg1">
              <div className="font-medium" data-oid="luolp9l">
                {canRedo ? "Повторить действие" : "Нечего повторять"}
              </div>
              {canRedo && redoableActions[0] && (
                <div className="text-sm text-muted-foreground" data-oid="0hl:o_8">
                  {redoableActions[0].description}
                </div>
              )}
              <div className="text-xs text-muted-foreground" data-oid="bzp672e">
                Ctrl+Y
              </div>
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
    <Button variant={variant} size={size} onClick={undo} disabled={!canUndo} className={className} data-oid="e8kxwho">
      <Undo className="h-4 w-4" data-oid="vaxk-0a" />
    </Button>
  )

  const RedoButton = (
    <Button variant={variant} size={size} onClick={redo} disabled={!canRedo} className={className} data-oid="6ioi.8.">
      <Redo className="h-4 w-4" data-oid="kmq2_dy" />
    </Button>
  )

  if (!showTooltips) {
    return (
      <div className="flex items-center gap-1" data-oid="6q4kk4k">
        {UndoButton}
        {RedoButton}
      </div>
    )
  }

  return (
    <TooltipProvider data-oid="trpuan1">
      <div className="flex items-center gap-1" data-oid="an1k:mp">
        <Tooltip data-oid="24q5uqz">
          <TooltipTrigger asChild data-oid="4v-e:wu">
            {UndoButton}
          </TooltipTrigger>
          <TooltipContent data-oid="482z-j8">
            <div className="space-y-1" data-oid="nff4o-b">
              <div className="font-medium" data-oid="usc9f.n">
                {canUndo ? "Отменить" : "Нечего отменять"}
              </div>
              {canUndo && undoableActions[0] && (
                <div className="text-sm text-muted-foreground" data-oid="bgspph1">
                  {undoableActions[0].description}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip data-oid="828zqt7">
          <TooltipTrigger asChild data-oid="unu7:lw">
            {RedoButton}
          </TooltipTrigger>
          <TooltipContent data-oid="fxv-lcu">
            <div className="space-y-1" data-oid="vsahpbc">
              <div className="font-medium" data-oid="i_2xysu">
                {canRedo ? "Повторить" : "Нечего повторять"}
              </div>
              {canRedo && redoableActions[0] && (
                <div className="text-sm text-muted-foreground" data-oid="jckodtr">
                  {redoableActions[0].description}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

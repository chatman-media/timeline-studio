/**
 * Панель управления Undo/Redo с расширенными возможностями
 */

import { ChevronDown, Clock, History, Layers, Redo, RotateCcw, Settings, Trash2, Undo } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useUndoRedo } from "@/domains/video-editing/hooks/use-undo-redo"
import type { ActionType } from "../../services/undo-redo-service"

const ACTION_ICONS: Record<ActionType, any> = {
  CREATE_PROJECT: History,
  ADD_CLIP: Layers,
  REMOVE_CLIP: Trash2,
  MOVE_CLIP: RotateCcw,
  TRIM_CLIP: RotateCcw,
  SPLIT_CLIP: RotateCcw,
  UPDATE_CLIP: Settings,
  ADD_TRACK: Layers,
  REMOVE_TRACK: Trash2,
  UPDATE_TRACK: Settings,
  REORDER_TRACKS: RotateCcw,
  ADD_KEYFRAME: Clock,
  REMOVE_KEYFRAME: Trash2,
  UPDATE_KEYFRAME: Settings,
  BATCH_OPERATION: Layers,
  ADD_EFFECT: Layers,
  REMOVE_EFFECT: Trash2,
  UPDATE_EFFECT: Settings,
  APPLY_EFFECT: Settings,
  ADD_FILTER: Layers,
  REMOVE_FILTER: Trash2,
  UPDATE_FILTER: Settings,
  APPLY_FILTER: Settings,
  ADD_TRANSITION: Layers,
  REMOVE_TRANSITION: Trash2,
  UPDATE_TRANSITION: Settings,
  APPLY_TRANSITION: Settings,
  CUSTOM: Settings,
}

const ACTION_LABELS: Record<ActionType, string> = {
  CREATE_PROJECT: "Создание проекта",
  ADD_CLIP: "Добавление клипа",
  REMOVE_CLIP: "Удаление клипа",
  MOVE_CLIP: "Перемещение клипа",
  TRIM_CLIP: "Обрезка клипа",
  SPLIT_CLIP: "Разделение клипа",
  UPDATE_CLIP: "Изменение клипа",
  ADD_TRACK: "Добавление трека",
  REMOVE_TRACK: "Удаление трека",
  UPDATE_TRACK: "Изменение трека",
  REORDER_TRACKS: "Перестановка треков",
  ADD_KEYFRAME: "Добавление keyframe",
  REMOVE_KEYFRAME: "Удаление keyframe",
  UPDATE_KEYFRAME: "Изменение keyframe",
  BATCH_OPERATION: "Массовая операция",
  ADD_EFFECT: "Добавление эффекта",
  REMOVE_EFFECT: "Удаление эффекта",
  UPDATE_EFFECT: "Изменение эффекта",
  APPLY_EFFECT: "Применение эффекта",
  ADD_FILTER: "Добавление фильтра",
  REMOVE_FILTER: "Удаление фильтра",
  UPDATE_FILTER: "Изменение фильтра",
  APPLY_FILTER: "Применение фильтра",
  ADD_TRANSITION: "Добавление перехода",
  REMOVE_TRANSITION: "Удаление перехода",
  UPDATE_TRANSITION: "Изменение перехода",
  APPLY_TRANSITION: "Применение перехода",
  CUSTOM: "Пользовательское действие",
}

interface UndoRedoPanelProps {
  compact?: boolean
  showDropdowns?: boolean
  showStats?: boolean
}

export function UndoRedoPanel({ compact = false, showDropdowns = true, showStats = false }: UndoRedoPanelProps) {
  const {
    undo,
    redo,
    undoMultiple,
    redoMultiple,
    canUndo,
    canRedo,
    historyStats,
    undoableActions,
    redoableActions,
    clearHistory,
    optimizeHistory,
    setMaxHistorySize,
  } = useUndoRedo()

  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [maxHistorySize, setMaxHistorySizeState] = useState(historyStats.maxHistorySize)

  const handleUndoMultiple = async (count: number) => {
    await undoMultiple(count)
  }

  const handleRedoMultiple = async (count: number) => {
    await redoMultiple(count)
  }

  const handleSetMaxHistorySize = () => {
    setMaxHistorySize(maxHistorySize)
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo}>
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {canUndo ? `Отменить: ${undoableActions[0]?.description}` : "Нечего отменять"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo}>
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {canRedo ? `Повторить: ${redoableActions[0]?.description}` : "Нечего повторять"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            История действий
          </CardTitle>
          {showStats && (
            <Badge variant="secondary">
              {historyStats.historySize}/{historyStats.maxHistorySize}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Основные кнопки */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
                className="flex items-center gap-2"
              >
                <Undo className="h-4 w-4" />
                Отменить
              </Button>

              {showDropdowns && undoableActions.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={!canUndo}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-80">
                    <DropdownMenuLabel>Отменить действия</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {undoableActions.slice(0, 10).map((action, index) => {
                      const Icon = ACTION_ICONS[action.type]
                      return (
                        <DropdownMenuItem
                          key={action.id}
                          onClick={() => handleUndoMultiple(index + 1)}
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          <div className="flex-1">
                            <div className="font-medium">{action.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(action.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          {action.groupId && (
                            <Badge variant="outline" className="text-xs">
                              Группа
                            </Badge>
                          )}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
                className="flex items-center gap-2"
              >
                <Redo className="h-4 w-4" />
                Повторить
              </Button>

              {showDropdowns && redoableActions.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={!canRedo}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-80">
                    <DropdownMenuLabel>Повторить действия</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {redoableActions.slice(0, 10).map((action, index) => {
                      const Icon = ACTION_ICONS[action.type]
                      return (
                        <DropdownMenuItem
                          key={action.id}
                          onClick={() => handleRedoMultiple(index + 1)}
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          <div className="flex-1">
                            <div className="font-medium">{action.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(action.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          {action.groupId && (
                            <Badge variant="outline" className="text-xs">
                              Группа
                            </Badge>
                          )}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Статистика */}
          {showStats && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Всего действий:</span>
                    <span className="font-medium">{historyStats.totalActions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Отмен:</span>
                    <span className="font-medium">{historyStats.undoCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Повторов:</span>
                    <span className="font-medium">{historyStats.redoCount}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>В истории:</span>
                    <span className="font-medium">{historyStats.historySize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Макс. размер:</span>
                    <span className="font-medium">{historyStats.maxHistorySize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Текущий индекс:</span>
                    <span className="font-medium">{historyStats.currentIndex}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Управление */}
          <Separator />
          <div className="flex items-center gap-2">
            <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  История
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>История действий</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxHistorySize">Максимальный размер истории</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="maxHistorySize"
                          type="number"
                          value={maxHistorySize}
                          onChange={(e) => setMaxHistorySizeState(Number(e.target.value))}
                          min={10}
                          max={1000}
                        />
                        <Button onClick={handleSetMaxHistorySize} size="sm">
                          Применить
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={optimizeHistory} size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Оптимизировать
                    </Button>
                    <Button variant="destructive" onClick={clearHistory} size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Очистить историю
                    </Button>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {undoableActions.map((action, _index) => {
                      const Icon = ACTION_ICONS[action.type]
                      return (
                        <Card key={action.id} className="p-3">
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="font-medium">{action.description}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-4">
                                <span>{ACTION_LABELS[action.type]}</span>
                                <span>{action.timestamp.toLocaleString()}</span>
                                {action.priority && (
                                  <Badge
                                    variant={action.priority === "high" ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {action.priority}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {action.groupId && <Badge variant="outline">Группа</Badge>}
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

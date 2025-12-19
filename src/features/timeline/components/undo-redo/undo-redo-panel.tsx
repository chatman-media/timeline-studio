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
      <div className="flex items-center gap-1" data-oid="falrw89">
        <TooltipProvider data-oid="mg2e--k">
          <Tooltip data-oid="qrv7smw">
            <TooltipTrigger asChild data-oid="pzstbpc">
              <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo} data-oid="at2wb-1">
                <Undo className="h-4 w-4" data-oid="wz7g8a1" />
              </Button>
            </TooltipTrigger>
            <TooltipContent data-oid="k_trzwc">
              {canUndo ? `Отменить: ${undoableActions[0]?.description}` : "Нечего отменять"}
            </TooltipContent>
          </Tooltip>

          <Tooltip data-oid="p3jf:zv">
            <TooltipTrigger asChild data-oid="t1gvcu3">
              <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo} data-oid="nadbj4_">
                <Redo className="h-4 w-4" data-oid="ilf31z8" />
              </Button>
            </TooltipTrigger>
            <TooltipContent data-oid="uge0n32">
              {canRedo ? `Повторить: ${redoableActions[0]?.description}` : "Нечего повторять"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <Card className="w-full" data-oid="5zoq60x">
      <CardHeader data-oid="ek:_lbk">
        <div className="flex items-center justify-between" data-oid="wvv3kg6">
          <CardTitle className="flex items-center gap-2" data-oid="pp6h4n7">
            <History className="h-5 w-5" data-oid="2e:6nyo" />
            История действий
          </CardTitle>
          {showStats && (
            <Badge variant="secondary" data-oid="br.232.">
              {historyStats.historySize}/{historyStats.maxHistorySize}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent data-oid="7r29kbs">
        <div className="space-y-4" data-oid=":oqgim.">
          {/* Основные кнопки */}
          <div className="flex items-center gap-2" data-oid="8i2z0xz">
            <div className="flex items-center gap-1" data-oid="g4jtedd">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
                className="flex items-center gap-2"
                data-oid="ggqarbl"
              >
                <Undo className="h-4 w-4" data-oid="cka..qx" />
                Отменить
              </Button>

              {showDropdowns && undoableActions.length > 1 && (
                <DropdownMenu data-oid="ptqbnzi">
                  <DropdownMenuTrigger asChild data-oid="t0mgmrd">
                    <Button variant="outline" size="sm" disabled={!canUndo} data-oid="lhrucl7">
                      <ChevronDown className="h-4 w-4" data-oid="8y1i5rf" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-80" data-oid="7.hnt.8">
                    <DropdownMenuLabel data-oid="r_6dv8p">Отменить действия</DropdownMenuLabel>
                    <DropdownMenuSeparator data-oid="mec7v7v" />
                    {undoableActions.slice(0, 10).map((action, index) => {
                      const Icon = ACTION_ICONS[action.type]
                      return (
                        <DropdownMenuItem
                          key={action.id}
                          onClick={() => handleUndoMultiple(index + 1)}
                          className="flex items-center gap-2"
                          data-oid="5:wiynv"
                        >
                          <Icon className="h-4 w-4" data-oid="h8vipo." />
                          <div className="flex-1" data-oid="l.b7_hz">
                            <div className="font-medium" data-oid="bx.5jbn">
                              {action.description}
                            </div>
                            <div className="text-xs text-muted-foreground" data-oid="fs3i2fp">
                              {new Date(action.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          {action.groupId && (
                            <Badge variant="outline" className="text-xs" data-oid="zhak.sc">
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

            <div className="flex items-center gap-1" data-oid="8tu-a-6">
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
                className="flex items-center gap-2"
                data-oid="ekqxj7i"
              >
                <Redo className="h-4 w-4" data-oid="03eu:za" />
                Повторить
              </Button>

              {showDropdowns && redoableActions.length > 1 && (
                <DropdownMenu data-oid="gd:0_:e">
                  <DropdownMenuTrigger asChild data-oid="wyrd:_7">
                    <Button variant="outline" size="sm" disabled={!canRedo} data-oid="89vkrqx">
                      <ChevronDown className="h-4 w-4" data-oid="7ed60yf" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-80" data-oid="3g_g.xh">
                    <DropdownMenuLabel data-oid="y:qmfkl">Повторить действия</DropdownMenuLabel>
                    <DropdownMenuSeparator data-oid="fv99dz6" />
                    {redoableActions.slice(0, 10).map((action, index) => {
                      const Icon = ACTION_ICONS[action.type]
                      return (
                        <DropdownMenuItem
                          key={action.id}
                          onClick={() => handleRedoMultiple(index + 1)}
                          className="flex items-center gap-2"
                          data-oid="saja-vs"
                        >
                          <Icon className="h-4 w-4" data-oid="::iec26" />
                          <div className="flex-1" data-oid="v8c-f75">
                            <div className="font-medium" data-oid="0p8nt2a">
                              {action.description}
                            </div>
                            <div className="text-xs text-muted-foreground" data-oid="vphm-63">
                              {new Date(action.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          {action.groupId && (
                            <Badge variant="outline" className="text-xs" data-oid="1__w4p5">
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
              <Separator data-oid="8k0bwdo" />
              <div className="grid grid-cols-2 gap-4 text-sm" data-oid="36phagg">
                <div className="space-y-1" data-oid="h.fz2l-">
                  <div className="flex justify-between" data-oid="h713jzb">
                    <span data-oid="jomm7d3">Всего действий:</span>
                    <span className="font-medium" data-oid="uy8vn0i">
                      {historyStats.totalActions}
                    </span>
                  </div>
                  <div className="flex justify-between" data-oid="6upb9ry">
                    <span data-oid="spd7ro_">Отмен:</span>
                    <span className="font-medium" data-oid="uivde1r">
                      {historyStats.undoCount}
                    </span>
                  </div>
                  <div className="flex justify-between" data-oid="e56uy85">
                    <span data-oid="dgjh3ik">Повторов:</span>
                    <span className="font-medium" data-oid="dm176ke">
                      {historyStats.redoCount}
                    </span>
                  </div>
                </div>
                <div className="space-y-1" data-oid="e941ck.">
                  <div className="flex justify-between" data-oid="6.:ggad">
                    <span data-oid="dzij09-">В истории:</span>
                    <span className="font-medium" data-oid="th5xgy3">
                      {historyStats.historySize}
                    </span>
                  </div>
                  <div className="flex justify-between" data-oid="w4z_b6j">
                    <span data-oid="i0u8diz">Макс. размер:</span>
                    <span className="font-medium" data-oid="7m6iti4">
                      {historyStats.maxHistorySize}
                    </span>
                  </div>
                  <div className="flex justify-between" data-oid="cps1wyj">
                    <span data-oid="mq0jm.6">Текущий индекс:</span>
                    <span className="font-medium" data-oid="s:0_4hf">
                      {historyStats.currentIndex}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Управление */}
          <Separator data-oid="taehlq6" />
          <div className="flex items-center gap-2" data-oid="6-o3fhj">
            <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen} data-oid="1yox7gw">
              <DialogTrigger asChild data-oid="4l85yyv">
                <Button variant="outline" size="sm" data-oid="q4vwkif">
                  <History className="h-4 w-4 mr-2" data-oid="oqphrvh" />
                  История
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" data-oid=".b:xyjm">
                <DialogHeader data-oid="cyxl__n">
                  <DialogTitle data-oid="mcsntj0">История действий</DialogTitle>
                </DialogHeader>
                <div className="space-y-4" data-oid="2_job6f">
                  <div className="grid grid-cols-2 gap-4" data-oid="6ys.ngn">
                    <div data-oid="uahuyo5">
                      <Label htmlFor="maxHistorySize" data-oid="14ntly1">
                        Максимальный размер истории
                      </Label>
                      <div className="flex gap-2 mt-1" data-oid="h6_2sk.">
                        <Input
                          id="maxHistorySize"
                          type="number"
                          value={maxHistorySize}
                          onChange={(e) => setMaxHistorySizeState(Number(e.target.value))}
                          min={10}
                          max={1000}
                          data-oid="g9usavm"
                        />

                        <Button onClick={handleSetMaxHistorySize} size="sm" data-oid="q8phl:l">
                          Применить
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2" data-oid="41bx4p.">
                    <Button variant="outline" onClick={optimizeHistory} size="sm" data-oid="j8oxmz.">
                      <Settings className="h-4 w-4 mr-2" data-oid="4cgb0et" />
                      Оптимизировать
                    </Button>
                    <Button variant="destructive" onClick={clearHistory} size="sm" data-oid="g9tzm9p">
                      <Trash2 className="h-4 w-4 mr-2" data-oid="ym0gs6h" />
                      Очистить историю
                    </Button>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2" data-oid="zan_a.8">
                    {undoableActions.map((action, _index) => {
                      const Icon = ACTION_ICONS[action.type]
                      return (
                        <Card key={action.id} className="p-3" data-oid="4z25uyd">
                          <div className="flex items-center gap-3" data-oid="d3k34zk">
                            <Icon className="h-4 w-4 text-muted-foreground" data-oid=":6g8_-k" />
                            <div className="flex-1" data-oid="ri_jdfd">
                              <div className="font-medium" data-oid="ux8jbp3">
                                {action.description}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-4" data-oid="jyotlhe">
                                <span data-oid="i2g-8a-">{ACTION_LABELS[action.type]}</span>
                                <span data-oid="n8:4_l6">{action.timestamp.toLocaleString()}</span>
                                {action.priority && (
                                  <Badge
                                    variant={action.priority === "high" ? "default" : "secondary"}
                                    className="text-xs"
                                    data-oid="h0chfcj"
                                  >
                                    {action.priority}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {action.groupId && (
                              <Badge variant="outline" data-oid="k-qzhl2">
                                Группа
                              </Badge>
                            )}
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

/**
 * Панель batch операций для множественных клипов
 */

import {
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartVertical,
  Clock,
  Layers,
  Move,
  Palette,
  Scissors,
  Shuffle,
  Trash2,
  Zap,
} from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBatchOperations } from "../../hooks/batch/use-batch-operations"
import { useTimeline } from "../../hooks/state/use-timeline"
import { useTimelineSelection } from "../../hooks/state/use-timeline-selection"
import type { VideoFadeOptions } from "../../services/video-fade-service"

export function BatchOperationsPanel() {
  const { selectedClips } = useTimelineSelection()
  const { currentTime } = useTimeline()
  const {
    moveSelectedClips,
    trimSelectedClips,
    changeSelectedClipsSpeed,
    applyColorSettingsToSelected,
    removeAllEffectsFromSelected,
    alignSelectedClips,
    distributeSelectedClips,
    syncSelectedClipsByMarker,
    createTransitionsBetween,
  } = useBatchOperations()

  // Состояния для различных параметров
  const [moveOffset, setMoveOffset] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [opacity, setOpacity] = useState(1)
  const [fadeInDuration, setFadeInDuration] = useState(1)
  const [fadeOutDuration, setFadeOutDuration] = useState(1)
  const [fadeType, setFadeType] = useState<VideoFadeOptions["type"]>("cosine")
  const [distributeSpacing, setDistributeSpacing] = useState(0.5)
  const [transitionDuration, setTransitionDuration] = useState(1)

  if (selectedClips.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Выберите несколько клипов для групповых операций</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Групповые операции</span>
          <Badge variant="secondary">{selectedClips.length} клипов</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="transform" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="transform">Трансформация</TabsTrigger>
            <TabsTrigger value="trim">Обрезка</TabsTrigger>
            <TabsTrigger value="effects">Эффекты</TabsTrigger>
            <TabsTrigger value="align">Выравнивание</TabsTrigger>
          </TabsList>

          {/* Трансформация */}
          <TabsContent value="transform" className="space-y-4">
            <div className="space-y-2">
              <Label>Сдвиг по времени (сек)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={moveOffset}
                  onChange={(e) => setMoveOffset(Number(e.target.value))}
                  step="0.1"
                  className="flex-1"
                />
                <Button
                  onClick={() =>
                    moveSelectedClips({
                      deltaTime: moveOffset,
                      maintainRelativePositions: true,
                    })
                  }
                  size="sm"
                >
                  <Move className="h-4 w-4 mr-1" />
                  Сдвинуть
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Скорость воспроизведения</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[speed]}
                  onValueChange={([v]) => setSpeed(v)}
                  min={0.1}
                  max={4}
                  step={0.1}
                  className="flex-1"
                />
                <span className="w-12 text-sm">{speed}x</span>
                <Button
                  onClick={() =>
                    changeSelectedClipsSpeed({
                      speed,
                      maintainPitch: true,
                      adjustDuration: true,
                    })
                  }
                  size="sm"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Применить
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Обрезка */}
          <TabsContent value="trim" className="space-y-4">
            <div className="space-y-2">
              <Label>Обрезать начало (сек)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={trimStart}
                  onChange={(e) => setTrimStart(Number(e.target.value))}
                  min="0"
                  step="0.1"
                  className="flex-1"
                />
                <Button
                  onClick={() =>
                    trimSelectedClips({
                      trimStart,
                      maintainDuration: false,
                    })
                  }
                  size="sm"
                >
                  <Scissors className="h-4 w-4 mr-1" />
                  Обрезать
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Обрезать конец (сек)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(Number(e.target.value))}
                  min="0"
                  step="0.1"
                  className="flex-1"
                />
                <Button onClick={() => trimSelectedClips({ trimEnd })} size="sm">
                  <Scissors className="h-4 w-4 mr-1" />
                  Обрезать
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Эффекты */}
          <TabsContent value="effects" className="space-y-4">
            <div className="space-y-2">
              <Label>Прозрачность</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[opacity]}
                  onValueChange={([v]) => setOpacity(v)}
                  min={0}
                  max={1}
                  step={0.05}
                  className="flex-1"
                />
                <span className="w-12 text-sm">{Math.round(opacity * 100)}%</span>
                <Button onClick={() => applyColorSettingsToSelected({ opacity })} size="sm">
                  <Palette className="h-4 w-4 mr-1" />
                  Применить
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fade эффекты</Label>
              <Select value={fadeType} onValueChange={(v) => setFadeType(v as VideoFadeOptions["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="cosine">Cosine</SelectItem>
                  <SelectItem value="exponential">Exponential</SelectItem>
                  <SelectItem value="ease-in-out">Ease In-Out</SelectItem>
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Fade In (сек)</Label>
                  <Input
                    type="number"
                    value={fadeInDuration}
                    onChange={(e) => setFadeInDuration(Number(e.target.value))}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fade Out (сек)</Label>
                  <Input
                    type="number"
                    value={fadeOutDuration}
                    onChange={(e) => setFadeOutDuration(Number(e.target.value))}
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              <Button
                onClick={() =>
                  applyColorSettingsToSelected({
                    fadeIn: fadeInDuration > 0 ? { type: fadeType, duration: fadeInDuration } : undefined,
                    fadeOut: fadeOutDuration > 0 ? { type: fadeType, duration: fadeOutDuration } : undefined,
                  })
                }
                className="w-full"
                size="sm"
              >
                Применить Fade
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={() => removeAllEffectsFromSelected()} variant="destructive" className="w-full" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Удалить все эффекты
              </Button>
            </div>
          </TabsContent>

          {/* Выравнивание */}
          <TabsContent value="align" className="space-y-4">
            <div className="space-y-2">
              <Label>Выравнивание клипов</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button onClick={() => alignSelectedClips("start")} variant="outline" size="sm">
                  <AlignStartVertical className="h-4 w-4 mr-1" />
                  По началу
                </Button>
                <Button onClick={() => alignSelectedClips("center")} variant="outline" size="sm">
                  <AlignCenterVertical className="h-4 w-4 mr-1" />
                  По центру
                </Button>
                <Button onClick={() => alignSelectedClips("end")} variant="outline" size="sm">
                  <AlignEndVertical className="h-4 w-4 mr-1" />
                  По концу
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Распределение</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={distributeSpacing}
                  onChange={(e) => setDistributeSpacing(Number(e.target.value))}
                  min="0"
                  step="0.1"
                  placeholder="Интервал (сек)"
                  className="flex-1"
                />
                <Button onClick={() => distributeSelectedClips(distributeSpacing)} size="sm">
                  <Shuffle className="h-4 w-4 mr-1" />
                  Распределить
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Синхронизация по курсору</Label>
              <Button
                onClick={() => syncSelectedClipsByMarker(currentTime, "start")}
                className="w-full"
                size="sm"
                variant="outline"
              >
                <Clock className="h-4 w-4 mr-1" />
                Синхронизировать по текущей позиции
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Переходы между клипами */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <Label>Переходы между клипами</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={transitionDuration}
              onChange={(e) => setTransitionDuration(Number(e.target.value))}
              min="0.1"
              max="5"
              step="0.1"
              placeholder="Длительность (сек)"
              className="flex-1"
            />
            <Button onClick={() => createTransitionsBetween(transitionDuration)} size="sm">
              <Layers className="h-4 w-4 mr-1" />
              Создать переходы
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

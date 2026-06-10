/**
 * Панель batch операций для множественных клипов
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Slider } from "@timeline-studio/ui/components/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
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
      <Card className="w-full" data-oid="y7waw2.">
        <CardContent className="pt-6" data-oid="5qdsvd1">
          <p className="text-center text-muted-foreground" data-oid="j:n44.p">
            Выберите несколько клипов для групповых операций
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full" data-oid="u6ybamy">
      <CardHeader data-oid="_h2ia6o">
        <CardTitle className="flex items-center justify-between" data-oid="htvbk6:">
          <span data-oid="v.j1z4w">Групповые операции</span>
          <Badge variant="secondary" data-oid="tq1sy0c">
            {selectedClips.length} клипов
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent data-oid="vb2kg0d">
        <Tabs defaultValue="transform" className="w-full" data-oid="we7u6z8">
          <TabsList className="grid w-full grid-cols-4" data-oid="_zzobkq">
            <TabsTrigger value="transform" data-oid="hr7066_">
              Трансформация
            </TabsTrigger>
            <TabsTrigger value="trim" data-oid="0srk:m2">
              Обрезка
            </TabsTrigger>
            <TabsTrigger value="effects" data-oid="sa91lu:">
              Эффекты
            </TabsTrigger>
            <TabsTrigger value="align" data-oid="_mp0xyg">
              Выравнивание
            </TabsTrigger>
          </TabsList>

          {/* Трансформация */}
          <TabsContent value="transform" className="space-y-4" data-oid="eo63fqw">
            <div className="space-y-2" data-oid="d15ldvc">
              <Label data-oid="9ufuhuf">Сдвиг по времени (сек)</Label>
              <div className="flex gap-2" data-oid="d889p83">
                <Input
                  type="number"
                  value={moveOffset}
                  onChange={(e) => setMoveOffset(Number(e.target.value))}
                  step="0.1"
                  className="flex-1"
                  data-oid="m.tguer"
                />

                <Button
                  onClick={() =>
                    moveSelectedClips({
                      deltaTime: moveOffset,
                      maintainRelativePositions: true,
                    })
                  }
                  size="sm"
                  data-oid="jct-6kt"
                >
                  <Move className="h-4 w-4 mr-1" data-oid="8:jaj9f" />
                  Сдвинуть
                </Button>
              </div>
            </div>

            <div className="space-y-2" data-oid="zr13jvr">
              <Label data-oid="ypk:.6n">Скорость воспроизведения</Label>
              <div className="flex items-center gap-2" data-oid="pcd-p-0">
                <Slider
                  value={[speed]}
                  onValueChange={([v]) => setSpeed(v)}
                  min={0.1}
                  max={4}
                  step={0.1}
                  className="flex-1"
                  data-oid="cxzy095"
                />

                <span className="w-12 text-sm" data-oid=".b0ddd0">
                  {speed}x
                </span>
                <Button
                  onClick={() =>
                    changeSelectedClipsSpeed({
                      speed,
                      maintainPitch: true,
                      adjustDuration: true,
                    })
                  }
                  size="sm"
                  data-oid="zw6of05"
                >
                  <Zap className="h-4 w-4 mr-1" data-oid="oa5f_fz" />
                  Применить
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Обрезка */}
          <TabsContent value="trim" className="space-y-4" data-oid="syjew5w">
            <div className="space-y-2" data-oid="ia-i2na">
              <Label data-oid="crv19s3">Обрезать начало (сек)</Label>
              <div className="flex gap-2" data-oid="5x.ccko">
                <Input
                  type="number"
                  value={trimStart}
                  onChange={(e) => setTrimStart(Number(e.target.value))}
                  min="0"
                  step="0.1"
                  className="flex-1"
                  data-oid=":8zl.2x"
                />

                <Button
                  onClick={() =>
                    trimSelectedClips({
                      trimStart,
                      maintainDuration: false,
                    })
                  }
                  size="sm"
                  data-oid="i4xw1qj"
                >
                  <Scissors className="h-4 w-4 mr-1" data-oid="qk2uom9" />
                  Обрезать
                </Button>
              </div>
            </div>

            <div className="space-y-2" data-oid="fzrhhb0">
              <Label data-oid="ov_.e.4">Обрезать конец (сек)</Label>
              <div className="flex gap-2" data-oid="ce1uupt">
                <Input
                  type="number"
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(Number(e.target.value))}
                  min="0"
                  step="0.1"
                  className="flex-1"
                  data-oid="g4dz365"
                />

                <Button onClick={() => trimSelectedClips({ trimEnd })} size="sm" data-oid="qoqr2sq">
                  <Scissors className="h-4 w-4 mr-1" data-oid="3_4v:7d" />
                  Обрезать
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Эффекты */}
          <TabsContent value="effects" className="space-y-4" data-oid="p9r6._6">
            <div className="space-y-2" data-oid=".qm10vi">
              <Label data-oid="d:0d3.2">Прозрачность</Label>
              <div className="flex items-center gap-2" data-oid="o2:.rwh">
                <Slider
                  value={[opacity]}
                  onValueChange={([v]) => setOpacity(v)}
                  min={0}
                  max={1}
                  step={0.05}
                  className="flex-1"
                  data-oid="y2:6_0s"
                />

                <span className="w-12 text-sm" data-oid="h5hypbv">
                  {Math.round(opacity * 100)}%
                </span>
                <Button onClick={() => applyColorSettingsToSelected({ opacity })} size="sm" data-oid="a3hd1_c">
                  <Palette className="h-4 w-4 mr-1" data-oid="we11dya" />
                  Применить
                </Button>
              </div>
            </div>

            <div className="space-y-2" data-oid="7bjzg7w">
              <Label data-oid="_9t.j9g">Fade эффекты</Label>
              <Select
                value={fadeType}
                onValueChange={(v) => setFadeType(v as VideoFadeOptions["type"])}
                data-oid="bvvodtt"
              >
                <SelectTrigger data-oid="reo3zbg">
                  <SelectValue data-oid="z-b6-kw" />
                </SelectTrigger>
                <SelectContent data-oid="d4pkdc9">
                  <SelectItem value="linear" data-oid="78_ysf1">
                    Linear
                  </SelectItem>
                  <SelectItem value="cosine" data-oid="-648578">
                    Cosine
                  </SelectItem>
                  <SelectItem value="exponential" data-oid="1on8zol">
                    Exponential
                  </SelectItem>
                  <SelectItem value="ease-in-out" data-oid="_28i_is">
                    Ease In-Out
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2" data-oid="iyqptjq">
                <div className="space-y-1" data-oid="l2p0e17">
                  <Label className="text-xs" data-oid="82rb.qm">
                    Fade In (сек)
                  </Label>
                  <Input
                    type="number"
                    value={fadeInDuration}
                    onChange={(e) => setFadeInDuration(Number(e.target.value))}
                    min="0"
                    step="0.1"
                    data-oid="j.aw8ag"
                  />
                </div>
                <div className="space-y-1" data-oid="o0ze:vr">
                  <Label className="text-xs" data-oid="8g4-o5u">
                    Fade Out (сек)
                  </Label>
                  <Input
                    type="number"
                    value={fadeOutDuration}
                    onChange={(e) => setFadeOutDuration(Number(e.target.value))}
                    min="0"
                    step="0.1"
                    data-oid="01dwcam"
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
                data-oid="015q388"
              >
                Применить Fade
              </Button>
            </div>

            <div className="pt-4 border-t" data-oid="h--y:p0">
              <Button
                onClick={() => removeAllEffectsFromSelected()}
                variant="destructive"
                className="w-full"
                size="sm"
                data-oid="4ky_3_3"
              >
                <Trash2 className="h-4 w-4 mr-1" data-oid="vzwnxwo" />
                Удалить все эффекты
              </Button>
            </div>
          </TabsContent>

          {/* Выравнивание */}
          <TabsContent value="align" className="space-y-4" data-oid="bu8j8ff">
            <div className="space-y-2" data-oid="gw:rt2m">
              <Label data-oid="c8jst.g">Выравнивание клипов</Label>
              <div className="grid grid-cols-3 gap-2" data-oid="6yjibvj">
                <Button onClick={() => alignSelectedClips("start")} variant="outline" size="sm" data-oid="guo2-fj">
                  <AlignStartVertical className="h-4 w-4 mr-1" data-oid="xtr0bmd" />
                  По началу
                </Button>
                <Button onClick={() => alignSelectedClips("center")} variant="outline" size="sm" data-oid="yse40z3">
                  <AlignCenterVertical className="h-4 w-4 mr-1" data-oid="ku6p3ub" />
                  По центру
                </Button>
                <Button onClick={() => alignSelectedClips("end")} variant="outline" size="sm" data-oid="850fr2d">
                  <AlignEndVertical className="h-4 w-4 mr-1" data-oid="_u3pjvy" />
                  По концу
                </Button>
              </div>
            </div>

            <div className="space-y-2" data-oid="k.qahq4">
              <Label data-oid="y7t4ajc">Распределение</Label>
              <div className="flex gap-2" data-oid="hgw9cyd">
                <Input
                  type="number"
                  value={distributeSpacing}
                  onChange={(e) => setDistributeSpacing(Number(e.target.value))}
                  min="0"
                  step="0.1"
                  placeholder="Интервал (сек)"
                  className="flex-1"
                  data-oid="wqjgxm5"
                />

                <Button onClick={() => distributeSelectedClips(distributeSpacing)} size="sm" data-oid="94n0ay0">
                  <Shuffle className="h-4 w-4 mr-1" data-oid="urb8d0e" />
                  Распределить
                </Button>
              </div>
            </div>

            <div className="space-y-2" data-oid="3afb57s">
              <Label data-oid="kbw2dd.">Синхронизация по курсору</Label>
              <Button
                onClick={() => syncSelectedClipsByMarker(currentTime, "start")}
                className="w-full"
                size="sm"
                variant="outline"
                data-oid="8lzkw6_"
              >
                <Clock className="h-4 w-4 mr-1" data-oid="smg87m3" />
                Синхронизировать по текущей позиции
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Переходы между клипами */}
        <div className="mt-4 pt-4 border-t space-y-2" data-oid="x1igbwa">
          <Label data-oid="abkp-e7">Переходы между клипами</Label>
          <div className="flex gap-2" data-oid="st3u-k8">
            <Input
              type="number"
              value={transitionDuration}
              onChange={(e) => setTransitionDuration(Number(e.target.value))}
              min="0.1"
              max="5"
              step="0.1"
              placeholder="Длительность (сек)"
              className="flex-1"
              data-oid="_tsp9sy"
            />

            <Button onClick={() => createTransitionsBetween(transitionDuration)} size="sm" data-oid="2p81qra">
              <Layers className="h-4 w-4 mr-1" data-oid="_a.4-dd" />
              Создать переходы
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

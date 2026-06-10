/**
 * Редактор keyframe анимаций для клипов
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Separator } from "@timeline-studio/ui/components/separator"
import { Slider } from "@timeline-studio/ui/components/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
import { Eye, Move, Plus, RotateCcw, Scale, Settings, Trash2, Zap } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useKeyframeAnimation } from "../../hooks/animation/use-keyframe-animation"
import { useTimeline } from "../../hooks/state/use-timeline"
import type { AnimatableProperty, InterpolationType } from "../../services/keyframe-animation-service"

interface KeyframeEditorProps {
  clipId: string
  onClose?: () => void
}

const ANIMATABLE_PROPERTIES: {
  value: AnimatableProperty
  label: string
  group: string
  defaultValue: number
  min?: number
  max?: number
  step?: number
}[] = [
  {
    value: "opacity",
    label: "Прозрачность",
    group: "Видимость",
    defaultValue: 1,
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    value: "position.x",
    label: "Позиция X",
    group: "Позиция",
    defaultValue: 0,
    min: -2,
    max: 2,
    step: 0.01,
  },
  {
    value: "position.y",
    label: "Позиция Y",
    group: "Позиция",
    defaultValue: 0,
    min: -2,
    max: 2,
    step: 0.01,
  },
  {
    value: "position.width",
    label: "Ширина",
    group: "Размер",
    defaultValue: 1,
    min: 0,
    max: 3,
    step: 0.01,
  },
  {
    value: "position.height",
    label: "Высота",
    group: "Размер",
    defaultValue: 1,
    min: 0,
    max: 3,
    step: 0.01,
  },
  {
    value: "position.scaleX",
    label: "Масштаб X",
    group: "Трансформация",
    defaultValue: 1,
    min: 0,
    max: 3,
    step: 0.01,
  },
  {
    value: "position.scaleY",
    label: "Масштаб Y",
    group: "Трансформация",
    defaultValue: 1,
    min: 0,
    max: 3,
    step: 0.01,
  },
  {
    value: "position.rotation",
    label: "Поворот",
    group: "Трансформация",
    defaultValue: 0,
    min: -360,
    max: 360,
    step: 1,
  },
  {
    value: "volume",
    label: "Громкость",
    group: "Аудио",
    defaultValue: 1,
    min: 0,
    max: 2,
    step: 0.01,
  },
  {
    value: "speed",
    label: "Скорость",
    group: "Воспроизведение",
    defaultValue: 1,
    min: 0.1,
    max: 4,
    step: 0.1,
  },
]

const INTERPOLATION_TYPES: { value: InterpolationType; label: string }[] = [
  { value: "linear", label: "Линейная" },
  { value: "ease", label: "Плавная" },
  { value: "ease-in", label: "Плавный вход" },
  { value: "ease-out", label: "Плавный выход" },
  { value: "ease-in-out", label: "Плавный вход-выход" },
  { value: "step", label: "Ступенчатая" },
]

const PRESET_ANIMATIONS = [
  { key: "fadeIn", label: "Появление", icon: Eye },
  { key: "fadeOut", label: "Исчезание", icon: Eye },
  { key: "zoomIn", label: "Увеличение", icon: Scale },
  { key: "zoomOut", label: "Уменьшение", icon: Scale },
  { key: "slideInLeft", label: "Слева", icon: Move },
  { key: "slideInRight", label: "Справа", icon: Move },
  { key: "slideInUp", label: "Снизу", icon: Move },
  { key: "slideInDown", label: "Сверху", icon: Move },
  { key: "rotate360", label: "Поворот 360°", icon: RotateCcw },
] as const

export function KeyframeEditor({ clipId, onClose }: KeyframeEditorProps) {
  const { clips, currentTime, duration } = useTimeline()
  const {
    addKeyframe,
    removeKeyframe,
    updateKeyframe,
    getPropertyKeyframes,
    getValueAtTime,
    createPresetAnimation,
    clearPropertyKeyframes,
    optimizeKeyframes,
  } = useKeyframeAnimation()

  const [selectedProperty, setSelectedProperty] = useState<AnimatableProperty>("opacity")
  const [keyframeValue, setKeyframeValue] = useState<number>(1)
  const [keyframeTime, setKeyframeTime] = useState<number>(0)
  const [interpolationType, setInterpolationType] = useState<InterpolationType>("ease-in-out")
  const [isPlaying, setIsPlaying] = useState(false)

  // Получаем клип
  const clip = clips.find((c) => c.id === clipId)
  if (!clip) {
    return (
      <Card className="w-full max-w-4xl" data-oid="ntt5mz-">
        <CardContent className="pt-6" data-oid="ldhsewa">
          <p className="text-center text-muted-foreground" data-oid="oxdi::1">
            Клип не найден
          </p>
        </CardContent>
      </Card>
    )
  }

  // Получаем keyframes для выбранного свойства
  const propertyKeyframes = getPropertyKeyframes(clipId, selectedProperty)

  // Обновляем время keyframe при изменении позиции воспроизведения
  useEffect(() => {
    const relativeTime = currentTime - clip.startTime
    if (relativeTime >= 0 && relativeTime <= clip.duration) {
      setKeyframeTime(relativeTime)

      // Получаем текущее значение свойства
      const currentValue = getValueAtTime(clipId, selectedProperty, relativeTime)
      if (typeof currentValue === "number") {
        setKeyframeValue(currentValue)
      }
    }
  }, [currentTime, clip.startTime, clip.duration, clipId, selectedProperty, getValueAtTime])

  // Добавляет keyframe в текущей позиции
  const handleAddKeyframe = useCallback(async () => {
    await addKeyframe(clipId, selectedProperty, keyframeTime, keyframeValue, interpolationType)
  }, [addKeyframe, clipId, selectedProperty, keyframeTime, keyframeValue, interpolationType])

  // Удаляет выбранный keyframe
  const handleRemoveKeyframe = useCallback(
    async (keyframeId: string) => {
      await removeKeyframe(clipId, keyframeId)
    },
    [removeKeyframe, clipId],
  )

  // Применяет предустановленную анимацию
  const handlePresetAnimation = useCallback(
    async (preset: string, duration: number = 1) => {
      await createPresetAnimation(clipId, preset as any, duration)
    },
    [createPresetAnimation, clipId],
  )

  // Очищает все keyframes для свойства
  const handleClearProperty = useCallback(async () => {
    await clearPropertyKeyframes(clipId, selectedProperty)
  }, [clearPropertyKeyframes, clipId, selectedProperty])

  // Оптимизирует keyframes
  const handleOptimize = useCallback(async () => {
    await optimizeKeyframes(clipId)
  }, [optimizeKeyframes, clipId])

  // Получаем информацию о выбранном свойстве
  const propertyInfo = ANIMATABLE_PROPERTIES.find((p) => p.value === selectedProperty)

  return (
    <Card className="w-full max-w-6xl" data-oid="znogx3z">
      <CardHeader data-oid="f0.vf39">
        <div className="flex items-center justify-between" data-oid="3g17:bw">
          <CardTitle className="flex items-center gap-2" data-oid="1io5zww">
            <Zap className="h-5 w-5" data-oid="f1g:h92" />
            Keyframe Анимация - {clip.name}
          </CardTitle>
          <div className="flex items-center gap-2" data-oid="8emz2a1">
            <Badge variant="secondary" data-oid="vi1t4gw">
              {clip.duration.toFixed(1)}s
            </Badge>
            <Button variant="outline" size="sm" onClick={onClose} data-oid="ksxc-.a">
              Закрыть
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent data-oid="_zy5xvu">
        <Tabs defaultValue="editor" className="w-full" data-oid="b6e-1qc">
          <TabsList className="grid w-full grid-cols-3" data-oid="uf73q9q">
            <TabsTrigger value="editor" data-oid=".v1vqld">
              Редактор
            </TabsTrigger>
            <TabsTrigger value="presets" data-oid="uf3.tlk">
              Предустановки
            </TabsTrigger>
            <TabsTrigger value="timeline" data-oid="nohuj54">
              Временная линия
            </TabsTrigger>
          </TabsList>

          {/* Редактор keyframes */}
          <TabsContent value="editor" className="space-y-4" data-oid="bz6vcj5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-oid="-omlrih">
              {/* Левая панель - настройки */}
              <div className="space-y-4" data-oid="hjiwbtm">
                <div className="space-y-2" data-oid=":89vwb_">
                  <Label data-oid="9-j73n2">Свойство для анимации</Label>
                  <Select
                    value={selectedProperty}
                    onValueChange={(v) => setSelectedProperty(v as AnimatableProperty)}
                    data-oid="290ta9r"
                  >
                    <SelectTrigger data-oid="d-v-f55">
                      <SelectValue data-oid="yh6zrjd" />
                    </SelectTrigger>
                    <SelectContent data-oid="v2ymzq3">
                      {Object.entries(
                        ANIMATABLE_PROPERTIES.reduce(
                          (groups, prop) => {
                            if (!groups[prop.group]) groups[prop.group] = []
                            groups[prop.group].push(prop)
                            return groups
                          },
                          {} as Record<string, typeof ANIMATABLE_PROPERTIES>,
                        ),
                      ).map(([group, props]) => (
                        <div key={group} data-oid="9qrxwoc">
                          <div className="px-2 py-1 text-sm font-medium text-muted-foreground" data-oid="8sdd0k9">
                            {group}
                          </div>
                          {props.map((prop) => (
                            <SelectItem key={prop.value} value={prop.value} data-oid="jggnr3j">
                              {prop.label}
                            </SelectItem>
                          ))}
                          <Separator className="my-1" data-oid="-i4daj6" />
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2" data-oid="8k8:y9m">
                  <Label data-oid="h85kb41">Время keyframe (сек)</Label>
                  <Input
                    type="number"
                    value={keyframeTime}
                    onChange={(e) => setKeyframeTime(Number(e.target.value))}
                    min={0}
                    max={clip.duration}
                    step={0.1}
                    data-oid="91z0afx"
                  />
                </div>

                <div className="space-y-2" data-oid="_-89.e7">
                  <Label data-oid="wfj28y_">Значение</Label>
                  {propertyInfo && propertyInfo.min !== undefined && propertyInfo.max !== undefined ? (
                    <div className="space-y-2" data-oid="w354pax">
                      <Slider
                        value={[keyframeValue]}
                        onValueChange={([v]) => setKeyframeValue(v)}
                        min={propertyInfo.min}
                        max={propertyInfo.max}
                        step={propertyInfo.step || 0.01}
                        className="w-full"
                        data-oid="hm-uh.-"
                      />

                      <div className="flex justify-between text-xs text-muted-foreground" data-oid="wf9znds">
                        <span data-oid="ww4109w">{propertyInfo.min}</span>
                        <span data-oid="mkr8uum">{keyframeValue.toFixed(2)}</span>
                        <span data-oid="ih1rc-g">{propertyInfo.max}</span>
                      </div>
                    </div>
                  ) : (
                    <Input
                      type="number"
                      value={keyframeValue}
                      onChange={(e) => setKeyframeValue(Number(e.target.value))}
                      step={propertyInfo?.step || 0.01}
                      data-oid="mpubm1r"
                    />
                  )}
                </div>

                <div className="space-y-2" data-oid="_60waq0">
                  <Label data-oid="su8zloc">Интерполяция</Label>
                  <Select
                    value={interpolationType}
                    onValueChange={(v) => setInterpolationType(v as InterpolationType)}
                    data-oid="_9pik8p"
                  >
                    <SelectTrigger data-oid="xnj66_z">
                      <SelectValue data-oid="7f_o1yn" />
                    </SelectTrigger>
                    <SelectContent data-oid="qzehrlo">
                      {INTERPOLATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value} data-oid="xct8ygr">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2" data-oid="ha6slro">
                  <Button onClick={handleAddKeyframe} className="flex-1" data-oid="vipq5f-">
                    <Plus className="h-4 w-4 mr-2" data-oid="6.ytm-." />
                    Добавить Keyframe
                  </Button>
                </div>

                <Separator data-oid="9qtwy46" />

                <div className="space-y-2" data-oid="tqhr-6f">
                  <Label data-oid="fj97lcz">Управление</Label>
                  <div className="grid grid-cols-2 gap-2" data-oid="9pwj22j">
                    <Button variant="outline" onClick={handleClearProperty} size="sm" data-oid="mem30oo">
                      <Trash2 className="h-4 w-4 mr-2" data-oid="6.8x5g5" />
                      Очистить свойство
                    </Button>
                    <Button variant="outline" onClick={handleOptimize} size="sm" data-oid="k7xk8vd">
                      <Settings className="h-4 w-4 mr-2" data-oid="f-l2jij" />
                      Оптимизировать
                    </Button>
                  </div>
                </div>
              </div>

              {/* Правая панель - список keyframes */}
              <div className="space-y-4" data-oid=".:nc.lm">
                <div className="flex items-center justify-between" data-oid="soi:vp.">
                  <Label data-oid="172-we9">Keyframes ({propertyKeyframes.length})</Label>
                  <Badge variant={propertyKeyframes.length > 0 ? "default" : "secondary"} data-oid="htot58l">
                    {propertyInfo?.label}
                  </Badge>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto" data-oid="f_8j7dp">
                  {propertyKeyframes.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8" data-oid=":9ddxbv">
                      <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" data-oid="t5t.u.a" />

                      <p data-oid="emhb:8n">Нет keyframes для этого свойства</p>
                      <p className="text-sm" data-oid="zh2:s3s">
                        Добавьте keyframe используя форму слева
                      </p>
                    </div>
                  ) : (
                    propertyKeyframes.map((keyframe) => (
                      <Card key={keyframe.id} className="p-3" data-oid="k2mzbf9">
                        <div className="flex items-center justify-between" data-oid="i2_8wyg">
                          <div className="space-y-1" data-oid="9no2n..">
                            <div className="flex items-center gap-2" data-oid="2-ndg3j">
                              <Badge variant="outline" className="text-xs" data-oid="2ellc27">
                                {keyframe.time.toFixed(2)}s
                              </Badge>
                              <span className="font-medium" data-oid="yh1:ii6">
                                {typeof keyframe.value === "number" ? keyframe.value.toFixed(2) : keyframe.value}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground" data-oid="llnq6-m">
                              {INTERPOLATION_TYPES.find((t) => t.value === keyframe.interpolation)?.label}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveKeyframe(keyframe.id)}
                            data-oid="nocs1ci"
                          >
                            <Trash2 className="h-4 w-4" data-oid="rk1q8wv" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Предустановленные анимации */}
          <TabsContent value="presets" className="space-y-4" data-oid="zd-w1cc">
            <div className="space-y-4" data-oid="rinwmc0">
              <div data-oid="-d3shys">
                <Label className="text-base" data-oid="j8kx.wj">
                  Быстрые анимации
                </Label>
                <p className="text-sm text-muted-foreground" data-oid="xokwsoz">
                  Выберите готовую анимацию для применения к клипу
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4" data-oid="unv80wy">
                {PRESET_ANIMATIONS.map((preset) => {
                  const Icon = preset.icon
                  return (
                    <Card
                      key={preset.key}
                      className="p-4 cursor-pointer hover:bg-accent"
                      onClick={() => handlePresetAnimation(preset.key)}
                      data-oid="dffakjh"
                    >
                      <div className="text-center space-y-2" data-oid="-p50b79">
                        <Icon className="h-8 w-8 mx-auto" data-oid="3s_:c3n" />
                        <p className="font-medium" data-oid="bv:1454">
                          {preset.label}
                        </p>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          {/* Временная линия keyframes */}
          <TabsContent value="timeline" className="space-y-4" data-oid="kndm.1v">
            <div className="space-y-4" data-oid="-bg7qzl">
              <div data-oid="7nwshy1">
                <Label className="text-base" data-oid="aayiuj:">
                  Временная линия keyframes
                </Label>
                <p className="text-sm text-muted-foreground" data-oid=":d3kad8">
                  Визуальное представление всех keyframes клипа
                </p>
              </div>

              {/* TODO: Добавить визуальную временную линию с keyframes */}
              <div className="bg-muted rounded-lg p-8 text-center" data-oid="mxf12vl">
                <p className="text-muted-foreground" data-oid="k2uc73a">
                  Визуальная временная линия будет добавлена в следующей версии
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

/**
 * Редактор keyframe анимаций для клипов
 */

import { Eye, Move, Plus, RotateCcw, Scale, Settings, Trash2, Zap } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  { value: "opacity", label: "Прозрачность", group: "Видимость", defaultValue: 1, min: 0, max: 1, step: 0.01 },
  { value: "position.x", label: "Позиция X", group: "Позиция", defaultValue: 0, min: -2, max: 2, step: 0.01 },
  { value: "position.y", label: "Позиция Y", group: "Позиция", defaultValue: 0, min: -2, max: 2, step: 0.01 },
  { value: "position.width", label: "Ширина", group: "Размер", defaultValue: 1, min: 0, max: 3, step: 0.01 },
  { value: "position.height", label: "Высота", group: "Размер", defaultValue: 1, min: 0, max: 3, step: 0.01 },
  { value: "position.scaleX", label: "Масштаб X", group: "Трансформация", defaultValue: 1, min: 0, max: 3, step: 0.01 },
  { value: "position.scaleY", label: "Масштаб Y", group: "Трансформация", defaultValue: 1, min: 0, max: 3, step: 0.01 },
  {
    value: "position.rotation",
    label: "Поворот",
    group: "Трансформация",
    defaultValue: 0,
    min: -360,
    max: 360,
    step: 1,
  },
  { value: "volume", label: "Громкость", group: "Аудио", defaultValue: 1, min: 0, max: 2, step: 0.01 },
  { value: "speed", label: "Скорость", group: "Воспроизведение", defaultValue: 1, min: 0.1, max: 4, step: 0.1 },
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
      <Card className="w-full max-w-4xl">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Клип не найден</p>
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
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Keyframe Анимация - {clip.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{clip.duration.toFixed(1)}s</Badge>
            <Button variant="outline" size="sm" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor">Редактор</TabsTrigger>
            <TabsTrigger value="presets">Предустановки</TabsTrigger>
            <TabsTrigger value="timeline">Временная линия</TabsTrigger>
          </TabsList>

          {/* Редактор keyframes */}
          <TabsContent value="editor" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Левая панель - настройки */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Свойство для анимации</Label>
                  <Select value={selectedProperty} onValueChange={(v) => setSelectedProperty(v as AnimatableProperty)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                        <div key={group}>
                          <div className="px-2 py-1 text-sm font-medium text-muted-foreground">{group}</div>
                          {props.map((prop) => (
                            <SelectItem key={prop.value} value={prop.value}>
                              {prop.label}
                            </SelectItem>
                          ))}
                          <Separator className="my-1" />
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Время keyframe (сек)</Label>
                  <Input
                    type="number"
                    value={keyframeTime}
                    onChange={(e) => setKeyframeTime(Number(e.target.value))}
                    min={0}
                    max={clip.duration}
                    step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Значение</Label>
                  {propertyInfo && propertyInfo.min !== undefined && propertyInfo.max !== undefined ? (
                    <div className="space-y-2">
                      <Slider
                        value={[keyframeValue]}
                        onValueChange={([v]) => setKeyframeValue(v)}
                        min={propertyInfo.min}
                        max={propertyInfo.max}
                        step={propertyInfo.step || 0.01}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{propertyInfo.min}</span>
                        <span>{keyframeValue.toFixed(2)}</span>
                        <span>{propertyInfo.max}</span>
                      </div>
                    </div>
                  ) : (
                    <Input
                      type="number"
                      value={keyframeValue}
                      onChange={(e) => setKeyframeValue(Number(e.target.value))}
                      step={propertyInfo?.step || 0.01}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Интерполяция</Label>
                  <Select value={interpolationType} onValueChange={(v) => setInterpolationType(v as InterpolationType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERPOLATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddKeyframe} className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить Keyframe
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Управление</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={handleClearProperty} size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Очистить свойство
                    </Button>
                    <Button variant="outline" onClick={handleOptimize} size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Оптимизировать
                    </Button>
                  </div>
                </div>
              </div>

              {/* Правая панель - список keyframes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Keyframes ({propertyKeyframes.length})</Label>
                  <Badge variant={propertyKeyframes.length > 0 ? "default" : "secondary"}>{propertyInfo?.label}</Badge>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {propertyKeyframes.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Нет keyframes для этого свойства</p>
                      <p className="text-sm">Добавьте keyframe используя форму слева</p>
                    </div>
                  ) : (
                    propertyKeyframes.map((keyframe) => (
                      <Card key={keyframe.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {keyframe.time.toFixed(2)}s
                              </Badge>
                              <span className="font-medium">
                                {typeof keyframe.value === "number" ? keyframe.value.toFixed(2) : keyframe.value}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {INTERPOLATION_TYPES.find((t) => t.value === keyframe.interpolation)?.label}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveKeyframe(keyframe.id)}>
                            <Trash2 className="h-4 w-4" />
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
          <TabsContent value="presets" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base">Быстрые анимации</Label>
                <p className="text-sm text-muted-foreground">Выберите готовую анимацию для применения к клипу</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {PRESET_ANIMATIONS.map((preset) => {
                  const Icon = preset.icon
                  return (
                    <Card
                      key={preset.key}
                      className="p-4 cursor-pointer hover:bg-accent"
                      onClick={() => handlePresetAnimation(preset.key)}
                    >
                      <div className="text-center space-y-2">
                        <Icon className="h-8 w-8 mx-auto" />
                        <p className="font-medium">{preset.label}</p>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          {/* Временная линия keyframes */}
          <TabsContent value="timeline" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base">Временная линия keyframes</Label>
                <p className="text-sm text-muted-foreground">Визуальное представление всех keyframes клипа</p>
              </div>

              {/* TODO: Добавить визуальную временную линию с keyframes */}
              <div className="bg-muted rounded-lg p-8 text-center">
                <p className="text-muted-foreground">Визуальная временная линия будет добавлена в следующей версии</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

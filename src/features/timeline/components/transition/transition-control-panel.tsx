import { useCallback, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Transition } from "@/domains/video-editing/types"
// import { useTimelineTransitions } from "@/features/timeline/hooks/transitions/use-timeline-transitions"
import type { TimelineTransition } from "@/features/timeline/types/timeline-transition"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { TransitionCurveEditor } from "./transition-curve-editor"
import { TransitionCurveVisualizer } from "./transition-curve-visualizer"

const logger = createLogger("TransitionControlPanel")

interface TransitionControlPanelProps {
  transition: TimelineTransition
  transitionResource?: Transition
  onUpdate: (updates: Partial<TimelineTransition>) => void
  onDelete?: () => void
  className?: string
}

/**
 * Панель управления параметрами перехода
 * Позволяет настраивать все аспекты перехода включая кривые и расширенные параметры
 */
export function TransitionControlPanel({
  transition,
  transitionResource,
  onUpdate,
  onDelete,
  className,
}: TransitionControlPanelProps) {
  const [previewTime, setPreviewTime] = useState(transition.duration / 2)
  // Мок функций для работы с переходами
  const updateTransition = useCallback((id: string, updates: Partial<TimelineTransition>) => {
    logger.info(`Обновление перехода ${id}:`, updates)
    // TODO: Реализовать через контекст или хук
  }, [])

  const removeTransition = useCallback((id: string) => {
    logger.info(`Удаление перехода ${id}`)
    // TODO: Реализовать через контекст или хук
  }, [])

  // Обновление перехода через хук
  const handleUpdate = useCallback(
    (updates: Partial<TimelineTransition>) => {
      updateTransition(transition.id, updates)
      onUpdate?.(updates)
    },
    [transition.id, updateTransition, onUpdate],
  )

  // Удаление перехода через хук
  const handleDelete = useCallback(() => {
    removeTransition(transition.id)
    onDelete?.()
  }, [transition.id, removeTransition, onDelete])

  // Обновление параметров
  const updateParameters = useCallback(
    (paramUpdates: Partial<TimelineTransition["parameters"]>) => {
      handleUpdate({
        parameters: {
          ...transition.parameters,
          ...paramUpdates,
        },
      })
    },
    [transition.parameters, handleUpdate],
  )

  // Обновление blur параметров
  const updateBlurParams = useCallback(
    (blurUpdates: Partial<NonNullable<TimelineTransition["parameters"]["blur"]>>) => {
      updateParameters({
        blur: {
          enabled: false,
          amount: 0,
          type: "gaussian" as const,
          ...transition.parameters.blur,
          ...blurUpdates,
        },
      })
    },
    [transition.parameters.blur, updateParameters],
  )

  // Обновление color параметров
  const updateColorParams = useCallback(
    (colorUpdates: Partial<NonNullable<TimelineTransition["parameters"]["color"]>>) => {
      updateParameters({
        color: {
          enabled: false,
          ...transition.parameters.color,
          ...colorUpdates,
        },
      })
    },
    [transition.parameters.color, updateParameters],
  )

  return (
    <Card className={cn("transition-control-panel", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{transitionResource?.labels?.ru || transition.transitionId}</span>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              Удалить
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Основные</TabsTrigger>
            <TabsTrigger value="curve">Кривая</TabsTrigger>
            <TabsTrigger value="effects">Эффекты</TabsTrigger>
            <TabsTrigger value="preview">Просмотр</TabsTrigger>
          </TabsList>

          {/* Основные параметры */}
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label>Длительность: {transition.duration.toFixed(2)}s</Label>
              <Slider
                value={[transition.duration]}
                onValueChange={([value]) => handleUpdate({ duration: value })}
                min={transitionResource?.duration.min || 0.1}
                max={transitionResource?.duration.max || 5}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <Label>Интенсивность: {(transition.parameters.intensity || 1).toFixed(2)}</Label>
              <Slider
                value={[transition.parameters.intensity || 1]}
                onValueChange={([value]) => updateParameters({ intensity: value })}
                min={0}
                max={1}
                step={0.01}
              />
            </div>

            <div className="space-y-2">
              <Label>Направление</Label>
              <select
                className="w-full p-2 border rounded"
                value={transition.parameters.direction || "center"}
                onChange={(e) => updateParameters({ direction: e.target.value as any })}
              >
                <option value="left">Влево</option>
                <option value="right">Вправо</option>
                <option value="up">Вверх</option>
                <option value="down">Вниз</option>
                <option value="center">Центр</option>
                <option value="radial">Радиально</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={transition.isEnabled}
                onCheckedChange={(checked) => handleUpdate({ isEnabled: checked })}
              />
              <Label>Включен</Label>
            </div>
          </TabsContent>

          {/* Редактор кривой */}
          <TabsContent value="curve" className="space-y-4">
            <TransitionCurveEditor
              curve={transition.curve}
              onChange={(curve) => handleUpdate({ curve })}
              width={300}
              height={200}
              showGrid
              showPresets
            />
          </TabsContent>

          {/* Расширенные эффекты */}
          <TabsContent value="effects" className="space-y-4">
            {/* Blur параметры */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={transition.parameters.blur?.enabled || false}
                  onCheckedChange={(checked) => updateBlurParams({ enabled: checked })}
                />
                <Label className="font-medium">Размытие</Label>
              </div>

              {transition.parameters.blur?.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Сила размытия: {transition.parameters.blur.amount || 0}%</Label>
                    <Slider
                      value={[transition.parameters.blur.amount || 0]}
                      onValueChange={([value]) => updateBlurParams({ amount: value })}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Тип размытия</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={transition.parameters.blur.type || "gaussian"}
                      onChange={(e) => updateBlurParams({ type: e.target.value as any })}
                    >
                      <option value="gaussian">Гауссово</option>
                      <option value="motion">Движение</option>
                      <option value="radial">Радиальное</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <hr />

            {/* Color параметры */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={transition.parameters.color?.enabled || false}
                  onCheckedChange={(checked) => updateColorParams({ enabled: checked })}
                />
                <Label className="font-medium">Цветовые эффекты</Label>
              </div>

              {transition.parameters.color?.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Оттенок</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="color"
                        value={transition.parameters.color.tint || "#FFFFFF"}
                        onChange={(e) => updateColorParams({ tint: e.target.value })}
                        className="w-20"
                      />
                      <Input
                        type="text"
                        value={transition.parameters.color.tint || "#FFFFFF"}
                        onChange={(e) => updateColorParams({ tint: e.target.value })}
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Насыщенность: {transition.parameters.color.saturation || 0}</Label>
                    <Slider
                      value={[transition.parameters.color.saturation || 0]}
                      onValueChange={([value]) => updateColorParams({ saturation: value })}
                      min={-100}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Яркость: {transition.parameters.color.brightness || 0}</Label>
                    <Slider
                      value={[transition.parameters.color.brightness || 0]}
                      onValueChange={([value]) => updateColorParams({ brightness: value })}
                      min={-100}
                      max={100}
                      step={1}
                    />
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Предварительный просмотр */}
          <TabsContent value="preview" className="space-y-4">
            <TransitionCurveVisualizer
              curve={transition.curve}
              duration={transition.duration}
              currentTime={previewTime}
              width={300}
              height={150}
              showProgress
              showValue
              onTimeChange={setPreviewTime}
            />

            <div className="space-y-2">
              <Label>Время просмотра: {previewTime.toFixed(2)}s</Label>
              <Slider
                value={[previewTime]}
                onValueChange={([value]) => setPreviewTime(value)}
                min={0}
                max={transition.duration}
                step={0.01}
              />
            </div>

            {/* Информация о переходе */}
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>ID: {transition.id}</div>
              <div>Тип: {transition.type}</div>
              <div>Позиция: {transition.position.toFixed(2)}s</div>
              {transitionResource?.gpuAccelerated && <div className="text-green-600">✓ GPU ускорение</div>}
              {transition.keyframes.length > 0 && <div>Keyframes: {transition.keyframes.length}</div>}
              {transition.renderCache?.status && <div>Кеш: {transition.renderCache.status}</div>}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

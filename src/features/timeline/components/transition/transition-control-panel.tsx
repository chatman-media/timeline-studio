import { useCallback, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Transition } from "@timeline-studio/core/types"
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
    <Card className={cn("transition-control-panel", className)} data-oid="_1001qf">
      <CardHeader data-oid="b7muq7t">
        <CardTitle className="flex items-center justify-between" data-oid="opcw3sn">
          <span data-oid="j471qux">{transitionResource?.labels?.ru || transition.transitionId}</span>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
              data-oid="j1udpch"
            >
              Удалить
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent data-oid="6ihqjxy">
        <Tabs defaultValue="basic" className="w-full" data-oid="qjecnp-">
          <TabsList className="grid w-full grid-cols-4" data-oid="r9b8p56">
            <TabsTrigger value="basic" data-oid="o47w-kg">
              Основные
            </TabsTrigger>
            <TabsTrigger value="curve" data-oid="9t7mdy7">
              Кривая
            </TabsTrigger>
            <TabsTrigger value="effects" data-oid="iltp6kg">
              Эффекты
            </TabsTrigger>
            <TabsTrigger value="preview" data-oid="8-a58.1">
              Просмотр
            </TabsTrigger>
          </TabsList>

          {/* Основные параметры */}
          <TabsContent value="basic" className="space-y-4" data-oid="m:tx9m2">
            <div className="space-y-2" data-oid="1u9m1l6">
              <Label data-oid="r7hkaj:">Длительность: {transition.duration.toFixed(2)}s</Label>
              <Slider
                value={[transition.duration]}
                onValueChange={([value]) => handleUpdate({ duration: value })}
                min={transitionResource?.duration.min || 0.1}
                max={transitionResource?.duration.max || 5}
                step={0.1}
                data-oid="un_3r1."
              />
            </div>

            <div className="space-y-2" data-oid="9xe5gtd">
              <Label data-oid="iudg.06">Интенсивность: {(transition.parameters.intensity || 1).toFixed(2)}</Label>
              <Slider
                value={[transition.parameters.intensity || 1]}
                onValueChange={([value]) => updateParameters({ intensity: value })}
                min={0}
                max={1}
                step={0.01}
                data-oid="7f60hig"
              />
            </div>

            <div className="space-y-2" data-oid="k0b844b">
              <Label data-oid="mmb:.4y">Направление</Label>
              <select
                className="w-full p-2 border rounded"
                value={transition.parameters.direction || "center"}
                onChange={(e) => updateParameters({ direction: e.target.value as any })}
                data-oid="jm9i12o"
              >
                <option value="left" data-oid="6c6..u5">
                  Влево
                </option>
                <option value="right" data-oid="ajxcy_n">
                  Вправо
                </option>
                <option value="up" data-oid="d4o7qvw">
                  Вверх
                </option>
                <option value="down" data-oid="wm3yi-r">
                  Вниз
                </option>
                <option value="center" data-oid="e6e1v1r">
                  Центр
                </option>
                <option value="radial" data-oid="1qblyod">
                  Радиально
                </option>
              </select>
            </div>

            <div className="flex items-center space-x-2" data-oid="t-cup_h">
              <Switch
                checked={transition.isEnabled}
                onCheckedChange={(checked) => handleUpdate({ isEnabled: checked })}
                data-oid="71dz-6s"
              />

              <Label data-oid="7q9jffe">Включен</Label>
            </div>
          </TabsContent>

          {/* Редактор кривой */}
          <TabsContent value="curve" className="space-y-4" data-oid="ukoqrc.">
            <TransitionCurveEditor
              curve={transition.curve}
              onChange={(curve) => handleUpdate({ curve })}
              width={300}
              height={200}
              showGrid
              showPresets
              data-oid="ztbbobm"
            />
          </TabsContent>

          {/* Расширенные эффекты */}
          <TabsContent value="effects" className="space-y-4" data-oid="88bace8">
            {/* Blur параметры */}
            <div className="space-y-3" data-oid="bmj31hf">
              <div className="flex items-center space-x-2" data-oid="fp5v7g6">
                <Switch
                  checked={transition.parameters.blur?.enabled || false}
                  onCheckedChange={(checked) => updateBlurParams({ enabled: checked })}
                  data-oid="6rgb1h3"
                />

                <Label className="font-medium" data-oid="v1d8ure">
                  Размытие
                </Label>
              </div>

              {transition.parameters.blur?.enabled && (
                <>
                  <div className="space-y-2" data-oid="uqbzd6i">
                    <Label data-oid="qdmdvln">Сила размытия: {transition.parameters.blur.amount || 0}%</Label>
                    <Slider
                      value={[transition.parameters.blur.amount || 0]}
                      onValueChange={([value]) => updateBlurParams({ amount: value })}
                      min={0}
                      max={100}
                      step={1}
                      data-oid="390u5qh"
                    />
                  </div>

                  <div className="space-y-2" data-oid="ydnbkn:">
                    <Label data-oid=".yj6zhx">Тип размытия</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={transition.parameters.blur.type || "gaussian"}
                      onChange={(e) => updateBlurParams({ type: e.target.value as any })}
                      data-oid="e5wxg.v"
                    >
                      <option value="gaussian" data-oid="qy2o3s9">
                        Гауссово
                      </option>
                      <option value="motion" data-oid="gsk6k4-">
                        Движение
                      </option>
                      <option value="radial" data-oid="u6v:6a5">
                        Радиальное
                      </option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <hr data-oid="1tksrr_" />

            {/* Color параметры */}
            <div className="space-y-3" data-oid="6eumrd1">
              <div className="flex items-center space-x-2" data-oid="a3yvq7:">
                <Switch
                  checked={transition.parameters.color?.enabled || false}
                  onCheckedChange={(checked) => updateColorParams({ enabled: checked })}
                  data-oid="32tubig"
                />

                <Label className="font-medium" data-oid="m0fhzv5">
                  Цветовые эффекты
                </Label>
              </div>

              {transition.parameters.color?.enabled && (
                <>
                  <div className="space-y-2" data-oid="xfogr2i">
                    <Label data-oid=".jss9jz">Оттенок</Label>
                    <div className="flex space-x-2" data-oid=":zyorih">
                      <Input
                        type="color"
                        value={transition.parameters.color.tint || "#FFFFFF"}
                        onChange={(e) => updateColorParams({ tint: e.target.value })}
                        className="w-20"
                        data-oid="kfdmr8o"
                      />

                      <Input
                        type="text"
                        value={transition.parameters.color.tint || "#FFFFFF"}
                        onChange={(e) => updateColorParams({ tint: e.target.value })}
                        placeholder="#FFFFFF"
                        data-oid="a_a50d_"
                      />
                    </div>
                  </div>

                  <div className="space-y-2" data-oid="xwm0w5g">
                    <Label data-oid=":bufdb_">Насыщенность: {transition.parameters.color.saturation || 0}</Label>
                    <Slider
                      value={[transition.parameters.color.saturation || 0]}
                      onValueChange={([value]) => updateColorParams({ saturation: value })}
                      min={-100}
                      max={100}
                      step={1}
                      data-oid="139xs74"
                    />
                  </div>

                  <div className="space-y-2" data-oid="0zesm03">
                    <Label data-oid="je.kbdz">Яркость: {transition.parameters.color.brightness || 0}</Label>
                    <Slider
                      value={[transition.parameters.color.brightness || 0]}
                      onValueChange={([value]) => updateColorParams({ brightness: value })}
                      min={-100}
                      max={100}
                      step={1}
                      data-oid="h551mnv"
                    />
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Предварительный просмотр */}
          <TabsContent value="preview" className="space-y-4" data-oid=":vqpkkp">
            <TransitionCurveVisualizer
              curve={transition.curve}
              duration={transition.duration}
              currentTime={previewTime}
              width={300}
              height={150}
              showProgress
              showValue
              onTimeChange={setPreviewTime}
              data-oid="q3ex7e4"
            />

            <div className="space-y-2" data-oid="_b0ncpe">
              <Label data-oid="3edsmm3">Время просмотра: {previewTime.toFixed(2)}s</Label>
              <Slider
                value={[previewTime]}
                onValueChange={([value]) => setPreviewTime(value)}
                min={0}
                max={transition.duration}
                step={0.01}
                data-oid="ml5jok0"
              />
            </div>

            {/* Информация о переходе */}
            <div className="space-y-1 text-sm text-muted-foreground" data-oid="rp72d8l">
              <div data-oid="fg:bd65">ID: {transition.id}</div>
              <div data-oid="iu1k1pb">Тип: {transition.type}</div>
              <div data-oid="qaad967">Позиция: {transition.position.toFixed(2)}s</div>
              {transitionResource?.gpuAccelerated && (
                <div className="text-green-600" data-oid="2frp_3x">
                  ✓ GPU ускорение
                </div>
              )}
              {transition.keyframes.length > 0 && (
                <div data-oid="fsp4_c:">Keyframes: {transition.keyframes.length}</div>
              )}
              {transition.renderCache?.status && <div data-oid="ol5j287">Кеш: {transition.renderCache.status}</div>}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

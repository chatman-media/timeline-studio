/**
 * Effects Preview Player Component
 *
 * Видеоплеер с real-time предпросмотром эффектов:
 * - WebGL-ускоренная обработка эффектов
 * - Интерактивное изменение параметров
 * - Предпросмотр цепочки эффектов
 * - Оптимизация производительности
 */

import { useCallback, useEffect, useRef, useState } from "react"

import { toast } from "sonner"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { TooltipProvider } from "@/components/ui/tooltip"
import { MediaType } from "@/features/media/types/media"
import { useProjectSettings } from "@/features/project-settings"
import type { TimelineClip } from "@/features/timeline/types/timeline"
import { convertVideoSrc } from "@/lib/tauri-utils"
import { type EffectPreviewOptions, getEffectsPreviewService } from "../services/effects-preview"
import { usePlayer } from "../services/player-provider"
import { PlayerControls } from "./player-controls"

interface EffectParameter {
  name: string
  type: "float" | "vec2" | "vec3" | "vec4" | "int" | "bool"
  value: any
  min?: number
  max?: number
  step?: number
}

interface EffectSettings {
  effectId: string
  enabled: boolean
  parameters: Record<string, any>
  intensity: number
}

export function EffectsPreviewPlayer() {
  const {
    settings: { aspectRatio },
  } = useProjectSettings()
  const { currentVideo: video, currentTime } = usePlayer()

  const videoRef = useRef<HTMLVideoElement>(null)
  const effectsCanvasRef = useRef<HTMLCanvasElement>(null)
  const [showEffectsPanel, setShowEffectsPanel] = useState(false)
  const [isPreviewActive, setIsPreviewActive] = useState(false)

  // Effects settings
  const [activeEffects, setActiveEffects] = useState<EffectSettings[]>([])
  const [availableEffects, setAvailableEffects] = useState<Array<{ id: string; name: string }>>([])
  const [selectedEffectId, setSelectedEffectId] = useState<string>("")

  // Preview options
  const [previewOptions, setPreviewOptions] = useState<EffectPreviewOptions>({
    enabled: true,
    quality: "medium",
    realTime: true,
    cacheResults: false,
    maxFrameRate: 30,
  })

  // Mock clip for demonstration
  const mockClip: TimelineClip = {
    id: "demo-clip",
    name: "Demo Clip",
    mediaId: video?.id || "preview-media",
    mediaFile: video || undefined,
    trackId: "preview-track",
    startTime: 0,
    duration: 10,
    mediaStartTime: 0,
    mediaEndTime: 10,
    offset: 0,
    volume: 1.0,
    speed: 1.0,
    isReversed: false,
    opacity: 1.0,
    isSelected: false,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    effects: activeEffects.map((effect, index) => ({
      id: `${effect.effectId}-${Date.now()}`,
      effectId: effect.effectId,
      enabled: effect.enabled,
      parameters: effect.parameters,
      intensity: effect.intensity,
      startTime: 0,
      endTime: 10,
      order: index,
    })),
    filters: [],
    transitions: [],
  }

  // Вычисляем соотношение сторон
  const aspectRatioValue = aspectRatio.value.width / aspectRatio.value.height

  /**
   * Инициализация эффектов
   */
  useEffect(() => {
    const effects = getEffectsPreviewService().getAvailableEffects()
    setAvailableEffects(effects)

    if (effects.length > 0 && !selectedEffectId) {
      setSelectedEffectId(effects[0].id)
    }
  }, [selectedEffectId])

  /**
   * Обновление canvas размеров
   */
  useEffect(() => {
    if (effectsCanvasRef.current && videoRef.current) {
      const canvas = effectsCanvasRef.current
      const video = videoRef.current

      canvas.width = video.videoWidth || 1920
      canvas.height = video.videoHeight || 1080
    }
  }, [video])

  /**
   * Запуск/остановка preview
   */
  useEffect(() => {
    if (!videoRef.current || !effectsCanvasRef.current || !video?.path) return

    if (isPreviewActive && previewOptions.enabled && activeEffects.length > 0) {
      getEffectsPreviewService().startRealTimePreview(
        videoRef.current,
        mockClip,
        effectsCanvasRef.current,
        previewOptions,
      )
    } else {
      getEffectsPreviewService().stopRealTimePreview()
    }

    return () => {
      getEffectsPreviewService().stopRealTimePreview()
    }
  }, [isPreviewActive, previewOptions, activeEffects, mockClip, video?.path])

  /**
   * Добавление эффекта
   */
  const addEffect = useCallback((effectId: string) => {
    const parameters = getEffectsPreviewService().getEffectParameters(effectId)
    if (!parameters) return

    const newEffect: EffectSettings = {
      effectId,
      enabled: true,
      parameters,
      intensity: 1.0,
    }

    setActiveEffects((prev) => [...prev, newEffect])
    toast.success(`Эффект "${effectId}" добавлен`)
  }, [])

  /**
   * Удаление эффекта
   */
  const removeEffect = useCallback((index: number) => {
    setActiveEffects((prev) => prev.filter((_, i) => i !== index))
  }, [])

  /**
   * Обновление параметров эффекта
   */
  const updateEffectParameter = useCallback((effectIndex: number, parameterName: string, value: any) => {
    setActiveEffects((prev) =>
      prev.map((effect, index) => {
        if (index === effectIndex) {
          return {
            ...effect,
            parameters: {
              ...effect.parameters,
              [parameterName]: value,
            },
          }
        }
        return effect
      }),
    )
  }, [])

  /**
   * Переключение эффекта
   */
  const toggleEffect = useCallback((index: number) => {
    setActiveEffects((prev) =>
      prev.map((effect, i) => {
        if (i === index) {
          return { ...effect, enabled: !effect.enabled }
        }
        return effect
      }),
    )
  }, [])

  /**
   * Изменение интенсивности эффекта
   */
  const updateEffectIntensity = useCallback((index: number, intensity: number) => {
    setActiveEffects((prev) =>
      prev.map((effect, i) => {
        if (i === index) {
          return { ...effect, intensity }
        }
        return effect
      }),
    )
  }, [])

  /**
   * Рендер параметров эффекта
   */
  const renderEffectParameters = (effect: EffectSettings, index: number) => {
    return (
      <div key={`${effect.effectId}-${index}`} className="space-y-3 p-4 border border-gray-700 rounded">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-white capitalize">{effect.effectId}</h4>
          <div className="flex items-center gap-2">
            <Switch checked={effect.enabled} onCheckedChange={() => toggleEffect(index)} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeEffect(index)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Intensity slider */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-300">Интенсивность: {effect.intensity.toFixed(2)}</Label>
          <Slider
            value={[effect.intensity]}
            onValueChange={([value]) => updateEffectIntensity(index, value)}
            max={1}
            min={0}
            step={0.01}
            disabled={!effect.enabled}
            className="w-full"
          />
        </div>

        {/* Effect parameters */}
        {Object.entries(effect.parameters).map(([paramName, value]) => (
          <div key={paramName} className="space-y-2">
            <Label className="text-sm text-gray-300 capitalize">
              {paramName.replace(/([A-Z])/g, " $1")}:{" "}
              {Array.isArray(value)
                ? `[${value.map((v) => v.toFixed(2)).join(", ")}]`
                : typeof value === "number"
                  ? value.toFixed(2)
                  : value}
            </Label>
            {typeof value === "number" && (
              <Slider
                value={[value]}
                onValueChange={([newValue]) => updateEffectParameter(index, paramName, newValue)}
                max={getParameterMax(paramName)}
                min={getParameterMin(paramName)}
                step={getParameterStep(paramName)}
                disabled={!effect.enabled}
                className="w-full"
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  /**
   * Получение максимального значения для параметра
   */
  const getParameterMax = (paramName: string): number => {
    switch (paramName) {
      case "brightness":
        return 1
      case "contrast":
        return 3
      case "saturation":
        return 3
      case "hue":
        return 360
      case "blurRadius":
        return 20
      case "vignette":
        return 2
      case "sepia":
        return 1
      case "noise":
        return 1
      case "glitchStrength":
        return 1
      case "colorSeparation":
        return 1
      default:
        return 2
    }
  }

  const getParameterMin = (paramName: string): number => {
    switch (paramName) {
      case "brightness":
        return -1
      case "contrast":
        return 0
      case "saturation":
        return 0
      case "hue":
        return -180
      case "blurRadius":
        return 0
      default:
        return 0
    }
  }

  const getParameterStep = (paramName: string): number => {
    switch (paramName) {
      case "hue":
        return 1
      case "blurRadius":
        return 0.5
      default:
        return 0.01
    }
  }

  if (!video?.path) {
    return (
      <div className="media-player-container relative flex h-full flex-col">
        <div className="relative flex-1 bg-black">
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-muted-foreground">Нет видео</div>
          </div>
        </div>
        <PlayerControls
          currentTime={0}
          file={video || { id: "", path: "", name: "Нет видео", type: MediaType.Video, size: 0, isVideo: true }}
        />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="media-player-container relative flex h-full flex-col">
        <div className="relative flex-1 bg-black">
          <div className="flex h-full w-full items-center justify-center">
            <div className="max-h-[calc(100%-85px)] w-full max-w-[100%]">
              <AspectRatio ratio={aspectRatioValue} className="bg-black">
                <div className="relative h-full w-full">
                  {/* Original video (hidden when effects active) */}
                  <video
                    ref={videoRef}
                    key={video.id || "no-video"}
                    src={convertVideoSrc(video.path)}
                    controls={false}
                    autoPlay={false}
                    loop={false}
                    disablePictureInPicture
                    preload="auto"
                    tabIndex={0}
                    playsInline
                    muted={false}
                    className="absolute inset-0 h-full w-full object-cover focus:outline-none"
                    style={{
                      position: "absolute",
                      top: "0",
                      left: "0",
                      width: "100%",
                      height: "100%",
                      display: isPreviewActive && activeEffects.length > 0 ? "none" : "block",
                      zIndex: 1,
                    }}
                  />

                  {/* Effects canvas */}
                  <canvas
                    ref={effectsCanvasRef}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{
                      position: "absolute",
                      top: "0",
                      left: "0",
                      width: "100%",
                      height: "100%",
                      display: isPreviewActive && activeEffects.length > 0 ? "block" : "none",
                      zIndex: 2,
                    }}
                  />

                  {/* Effects status indicator */}
                  {activeEffects.length > 0 && (
                    <div className="absolute left-4 top-4 flex flex-col gap-1">
                      <div className="rounded bg-purple-500/20 px-3 py-1">
                        <span className="text-sm text-purple-300 font-medium">
                          Эффекты: {activeEffects.filter((e) => e.enabled).length}/{activeEffects.length}
                        </span>
                      </div>

                      {isPreviewActive && (
                        <div className="rounded bg-green-500/20 px-3 py-1">
                          <span className="text-xs text-green-300">Real-time preview</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Effects controls */}
                  <div className="absolute right-4 top-4 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPreviewActive(!isPreviewActive)}
                      className="bg-black/50 hover:bg-black/70"
                      disabled={activeEffects.length === 0}
                    >
                      {isPreviewActive ? "Стоп" : "Превью"} эффектов
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEffectsPanel(!showEffectsPanel)}
                      className="bg-black/50 hover:bg-black/70"
                    >
                      Настройки эффектов
                    </Button>
                  </div>

                  {/* Effects Panel */}
                  {showEffectsPanel && (
                    <Card className="absolute right-4 top-24 w-96 max-h-[calc(100vh-200px)] overflow-y-auto bg-black/90 border-gray-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white">Эффекты</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Add effect */}
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-300">Добавить эффект</Label>
                          <div className="flex gap-2">
                            <Select value={selectedEffectId} onValueChange={setSelectedEffectId}>
                              <SelectTrigger className="flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableEffects.map((effect) => (
                                  <SelectItem key={effect.id} value={effect.id}>
                                    {effect.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button onClick={() => selectedEffectId && addEffect(selectedEffectId)} size="sm">
                              Добавить
                            </Button>
                          </div>
                        </div>

                        {/* Preview settings */}
                        <div className="space-y-3 p-3 border border-gray-700 rounded">
                          <h4 className="font-medium text-white">Настройки предпросмотра</h4>

                          <div className="flex items-center justify-between">
                            <Label className="text-sm text-gray-300">Real-time preview</Label>
                            <Switch
                              checked={previewOptions.realTime}
                              onCheckedChange={(checked) =>
                                setPreviewOptions((prev) => ({ ...prev, realTime: checked }))
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm text-gray-300">Качество</Label>
                            <Select
                              value={previewOptions.quality}
                              onValueChange={(value: "low" | "medium" | "high") =>
                                setPreviewOptions((prev) => ({ ...prev, quality: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Низкое</SelectItem>
                                <SelectItem value="medium">Среднее</SelectItem>
                                <SelectItem value="high">Высокое</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm text-gray-300">Max FPS: {previewOptions.maxFrameRate}</Label>
                            <Slider
                              value={[previewOptions.maxFrameRate]}
                              onValueChange={([value]) =>
                                setPreviewOptions((prev) => ({ ...prev, maxFrameRate: value }))
                              }
                              max={60}
                              min={15}
                              step={5}
                              className="w-full"
                            />
                          </div>
                        </div>

                        {/* Active effects */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-white">Активные эффекты ({activeEffects.length})</h4>

                          {activeEffects.length === 0 ? (
                            <div className="text-sm text-gray-500 text-center py-4">Эффекты не добавлены</div>
                          ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {activeEffects.map((effect, index) => renderEffectParameters(effect, index))}
                            </div>
                          )}

                          {/* Clear all effects */}
                          {activeEffects.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveEffects([])}
                              className="w-full text-red-400 border-red-400 hover:bg-red-400/10"
                            >
                              Очистить все эффекты
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </AspectRatio>
            </div>
          </div>
        </div>
        <PlayerControls currentTime={currentTime} file={video} />
      </div>
    </TooltipProvider>
  )
}

EffectsPreviewPlayer.displayName = "EffectsPreviewPlayer"

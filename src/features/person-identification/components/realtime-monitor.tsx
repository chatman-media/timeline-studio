/**
 * Real-time Face Recognition Monitor
 * Компонент для мониторинга распознавания лиц в реальном времени
 */

import { Activity, Camera, Cpu, Eye, Pause, Play, Users, Zap } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import {
  type AdvancedDetectionConfig,
  type AdvancedFaceDetection,
  AdvancedFaceDetectionService,
  type RealtimeProcessingStatus,
} from "../services/advanced-face-detection-service"
import { PersonDatabaseService } from "../services/person-database-service"

const logger = createLogger("RealtimeMonitor")

interface RealtimeMonitorProps {
  videoStream?: MediaStream
  onPersonDetected?: (personId: string) => void
  className?: string
}

export function RealtimeMonitor({ videoStream, onPersonDetected, className }: RealtimeMonitorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<RealtimeProcessingStatus>({
    isProcessing: false,
    fps: 0,
    processedFrames: 0,
    detectedFaces: 0,
    averageLatency: 0,
  })
  const [detectedFaces, setDetectedFaces] = useState<AdvancedFaceDetection[]>([])
  const [config, setConfig] = useState<Partial<AdvancedDetectionConfig>>({
    useGPU: false,
    maxFPS: 30,
    qualityThreshold: 0.7,
    detectEmotions: true,
    detectAgeGender: true,
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectionService = useRef<AdvancedFaceDetectionService>(null)
  const personService = useRef<PersonDatabaseService>(null)
  const animationFrameRef = useRef<number>(0)
  const lastFrameTime = useRef<number>(0)

  // Инициализация сервисов
  useEffect(() => {
    detectionService.current = AdvancedFaceDetectionService.getInstance(config)
    personService.current = PersonDatabaseService.getInstance()
  }, [])

  // Подключение видеопотока
  useEffect(() => {
    if (videoStream && videoRef.current) {
      videoRef.current.srcObject = videoStream
    }
  }, [videoStream])

  // Запуск/остановка обработки
  const toggleProcessing = useCallback(async () => {
    if (!detectionService.current || !videoStream) return

    try {
      if (isProcessing) {
        // Остановка
        await detectionService.current.stopRealtimeProcessing()
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        setIsProcessing(false)
      } else {
        // Запуск
        await detectionService.current.startRealtimeProcessing(videoStream.id, {
          onFaceDetected: (faces) => {
            setDetectedFaces(faces)
            // Идентификация персон
            faces.forEach(async (face) => {
              if (face.embedding && personService.current) {
                const results = await personService.current.searchPersonsByEmbedding(face.embedding, 0.7, 1)
                if (results.length > 0) {
                  onPersonDetected?.(results[0].person.id)
                }
              }
            })
          },
          onStatusUpdate: setStatus,
          onError: (error) => {
            logger.errorSync("Real-time processing error:", { error })
            setIsProcessing(false)
          },
        })
        setIsProcessing(true)
        renderLoop()
      }
    } catch (error) {
      logger.errorSync("Error toggling processing:", { error })
    }
  }, [isProcessing, videoStream, onPersonDetected])

  // Рендеринг видео с оверлеями
  const renderLoop = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")

    if (!video || !canvas || !ctx) return

    const render = () => {
      const now = performance.now()
      const deltaTime = now - lastFrameTime.current

      // Ограничение FPS
      if (deltaTime < 1000 / config.maxFPS!) {
        animationFrameRef.current = requestAnimationFrame(render)
        return
      }

      lastFrameTime.current = now

      // Рисуем видео
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Рисуем рамки лиц
      detectedFaces.forEach((face) => {
        const { x, y, width, height } = face.bbox

        // Основная рамка
        ctx.strokeStyle = face.personId ? "#10b981" : "#f59e0b"
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, width, height)

        // Информация о лице
        if (face.advancedAttributes) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
          ctx.fillRect(x, y - 25, width, 25)

          ctx.fillStyle = "#fff"
          ctx.font = "12px sans-serif"

          let text = ""
          if (face.name) {
            text = face.name
          } else if (face.advancedAttributes?.ageRange) {
            text = `${face.advancedAttributes.ageRange.min}-${face.advancedAttributes.ageRange.max}y`
            if (face.gender) {
              text += `, ${face.gender}`
            }
          }

          if (face.emotion) {
            text += ` (${face.emotion})`
          }

          ctx.fillText(text, x + 5, y - 7)
        }

        // Confidence
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
        ctx.fillRect(x, y + height, width, 20)

        ctx.fillStyle = face.confidence > 0.8 ? "#10b981" : "#f59e0b"
        ctx.fillRect(x, y + height, width * face.confidence, 20)

        ctx.fillStyle = "#fff"
        ctx.font = "10px sans-serif"
        ctx.fillText(`${(face.confidence * 100).toFixed(0)}%`, x + 5, y + height + 14)

        // Landmarks
        if (face.landmarks && config.detectLandmarks) {
          ctx.fillStyle = "#3b82f6"
          face.landmarks.points.forEach((point) => {
            ctx.beginPath()
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI)
            ctx.fill()
          })
        }
      })

      // Статистика
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
      ctx.fillRect(10, 10, 200, 80)

      ctx.fillStyle = "#fff"
      ctx.font = "14px monospace"
      ctx.fillText(`FPS: ${status.fps.toFixed(1)}`, 20, 30)
      ctx.fillText(`Faces: ${detectedFaces.length}`, 20, 50)
      ctx.fillText(`Latency: ${status.averageLatency.toFixed(0)}ms`, 20, 70)

      animationFrameRef.current = requestAnimationFrame(render)
    }

    render()
  }, [detectedFaces, status, config])

  // Обновление конфигурации
  const updateConfig = useCallback(
    async (newConfig: Partial<AdvancedDetectionConfig>) => {
      setConfig((prev) => ({ ...prev, ...newConfig }))

      if (detectionService.current && isProcessing) {
        await detectionService.current.updateConfig(newConfig)
      }
    },
    [isProcessing],
  )

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (detectionService.current && isProcessing) {
        void detectionService.current.stopRealtimeProcessing()
      }
    }
  }, [isProcessing])

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Real-time Face Recognition
            </CardTitle>
            <CardDescription>Продвинутое распознавание лиц в реальном времени</CardDescription>
          </div>
          <Button onClick={toggleProcessing} variant={isProcessing ? "destructive" : "default"} size="sm">
            {isProcessing ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Остановить
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Запустить
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Видео и Canvas */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-contain" />
          <canvas ref={canvasRef} width={1280} height={720} className="absolute inset-0 w-full h-full object-contain" />

          {!videoStream && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <Camera className="h-12 w-12 opacity-20" />
            </div>
          )}
        </div>

        {/* Статус и настройки */}
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Статус</TabsTrigger>
            <TabsTrigger value="faces">Лица</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>

          {/* Статус */}
          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  FPS
                </div>
                <div className="text-2xl font-bold">{status.fps.toFixed(1)}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Лица
                </div>
                <div className="text-2xl font-bold">{status.detectedFaces}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  Задержка
                </div>
                <div className="text-2xl font-bold">{status.averageLatency.toFixed(0)}ms</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Cpu className="h-4 w-4" />
                  {config.useGPU ? "GPU" : "CPU"}
                </div>
                <Progress value={status.cpuUsage || 0} className="h-2" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Обработано кадров</Label>
              <div className="text-lg font-mono">{status.processedFrames}</div>
            </div>
          </TabsContent>

          {/* Обнаруженные лица */}
          <TabsContent value="faces" className="space-y-4">
            {detectedFaces.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">Лица не обнаружены</div>
            ) : (
              <div className="space-y-3">
                {detectedFaces.map((face, index) => (
                  <div key={face.id || index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Eye className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{face.name || `Лицо ${index + 1}`}</div>
                        {face.advancedAttributes && (
                          <div className="text-sm text-muted-foreground">
                            {face.advancedAttributes.ageRange &&
                              `${face.advancedAttributes.ageRange.min}-${face.advancedAttributes.ageRange.max} лет`}
                            {face.advancedAttributes.gender && `, ${face.advancedAttributes.gender}`}
                            {face.advancedAttributes.emotion && ` • ${face.advancedAttributes.emotion}`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={face.confidence > 0.8 ? "default" : "secondary"}>
                        {(face.confidence * 100).toFixed(0)}%
                      </Badge>
                      {face.trackingId && <Badge variant="outline">Track #{face.trackingId.slice(-4)}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Настройки */}
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="gpu-switch">Использовать GPU</Label>
                <Switch
                  id="gpu-switch"
                  checked={config.useGPU}
                  onCheckedChange={(checked) => updateConfig({ useGPU: checked })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="fps-slider">Макс. FPS</Label>
                  <span className="text-sm text-muted-foreground">{config.maxFPS}</span>
                </div>
                <Slider
                  id="fps-slider"
                  min={5}
                  max={60}
                  step={5}
                  value={[config.maxFPS || 30]}
                  onValueChange={([value]) => updateConfig({ maxFPS: value })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="threshold-slider">Порог качества</Label>
                  <span className="text-sm text-muted-foreground">
                    {((config.qualityThreshold || 0.7) * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  id="threshold-slider"
                  min={0.5}
                  max={0.95}
                  step={0.05}
                  value={[config.qualityThreshold || 0.7]}
                  onValueChange={([value]) => updateConfig({ qualityThreshold: value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="emotions-switch">Распознавать эмоции</Label>
                <Switch
                  id="emotions-switch"
                  checked={config.detectEmotions}
                  onCheckedChange={(checked) => updateConfig({ detectEmotions: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="age-gender-switch">Определять возраст/пол</Label>
                <Switch
                  id="age-gender-switch"
                  checked={config.detectAgeGender}
                  onCheckedChange={(checked) => updateConfig({ detectAgeGender: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="landmarks-switch">Показывать ключевые точки</Label>
                <Switch
                  id="landmarks-switch"
                  checked={config.detectLandmarks}
                  onCheckedChange={(checked) => updateConfig({ detectLandmarks: checked })}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

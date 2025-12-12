/**
 * Timeline AI Overlay
 * Визуализация AI анализа на таймлайне
 */

import { AnimatePresence, motion } from "framer-motion"
import {
  Activity,
  AlertTriangle,
  Camera,
  Eye,
  type LucideIcon,
  Sparkles,
  TrendingUp,
  Users,
  Volume2,
  Zap,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { useTimelineAIAnalysis } from "../../hooks/integration/use-timeline-ai-analysis"

interface TimelineAIOverlayProps {
  timelineWidth: number
  timelineDuration: number
  pixelsPerSecond: number
  className?: string
}

interface AnalysisSegment {
  id: string
  startTime: number
  endTime: number
  type: "scene" | "keyMoment" | "quality" | "emotion" | "audio"
  confidence: number
  label: string
  color: string
  icon: LucideIcon
  description?: string
  intensity?: number
}

export function TimelineAIOverlay({
  timelineWidth,
  timelineDuration,
  pixelsPerSecond,
  className,
}: TimelineAIOverlayProps) {
  const { state: aiState } = useTimelineAIAnalysis()
  const [segments, setSegments] = useState<AnalysisSegment[]>([])
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Конвертируем данные анализа в сегменты для отображения
  useEffect(() => {
    const newSegments: AnalysisSegment[] = []

    // Сегменты сцен
    if (aiState.sceneAnalysis && Array.isArray(aiState.sceneAnalysis)) {
      // Обрабатываем AdvancedSceneAnalysis[]
      const allScenes = aiState.sceneAnalysis.flatMap((analysis: any) => (analysis.scene ? [analysis.scene] : []))
      allScenes.forEach((scene: any) => {
        newSegments.push({
          id: `scene-${scene.id}`,
          startTime: scene.startTime,
          endTime: scene.startTime + scene.duration,
          type: "scene",
          confidence: scene.confidence || 0.8,
          label: getSceneLabel(scene.type),
          color: getSceneColor(scene.type),
          icon: getSceneIcon(scene.type),
          description: `${scene.type} сцена (${scene.duration.toFixed(1)}с)`,
          intensity: scene.intensity || 0.5,
        })
      })
    }

    // Сегменты ключевых моментов
    if (aiState.keyMoments.length > 0) {
      aiState.keyMoments.forEach((moment) => {
        newSegments.push({
          id: `moment-${moment.id}`,
          startTime: moment.timestamp - 0.5,
          endTime: moment.timestamp + 0.5,
          type: "keyMoment",
          confidence: moment.score,
          label: "Ключевой момент",
          color: getMomentColor(moment.type),
          icon: Sparkles,
          description: moment.description,
          intensity: moment.score,
        })
      })
    }

    // Сегменты качества (используем qualityMetrics если есть)
    if (aiState.currentAnalysis?.qualityMetrics) {
      // Создаем один сегмент для общего качества
      const quality = aiState.currentAnalysis.qualityMetrics.overall
      newSegments.push({
        id: "quality-overall",
        startTime: 0,
        endTime: timelineDuration,
        type: "quality",
        confidence: quality / 100,
        label: quality < 60 ? "Низкое качество" : "Хорошее качество",
        color: quality < 60 ? "#ef4444" : "#10b981",
        icon: quality < 60 ? AlertTriangle : TrendingUp,
        description: `Общее качество: ${quality}/100`,
        intensity: quality / 100,
      })
    }

    setSegments(newSegments)
  }, [aiState, timelineDuration])

  // Рисуем визуализацию интенсивности на canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Рисуем градиентную визуализацию для каждого сегмента
    segments.forEach((segment) => {
      const x = segment.startTime * pixelsPerSecond
      const width = (segment.endTime - segment.startTime) * pixelsPerSecond
      const intensity = segment.intensity || 0.5

      // Создаем градиент
      const gradient = ctx.createLinearGradient(x, 0, x, canvas.height)
      gradient.addColorStop(0, `${segment.color}00`)
      gradient.addColorStop(
        0.5,
        `${segment.color}${Math.floor(intensity * 40)
          .toString(16)
          .padStart(2, "0")}`,
      )
      gradient.addColorStop(1, `${segment.color}00`)

      ctx.fillStyle = gradient
      ctx.fillRect(x, 0, width, canvas.height)
    })
  }, [segments, pixelsPerSecond])

  return (
    <TooltipProvider>
      <div className={cn("absolute inset-x-0 h-12 pointer-events-none select-none", className)}>
        {/* Canvas для фоновой визуализации */}
        <canvas
          ref={canvasRef}
          width={timelineWidth}
          height={48}
          className="absolute inset-0 opacity-50"
          style={{ mixBlendMode: "screen" }}
        />

        {/* Индикатор анализа */}
        {aiState.isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-0 right-0 bg-primary/90 text-primary-foreground px-3 py-1 rounded-bl-lg flex items-center gap-2 pointer-events-auto"
          >
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-xs font-medium">Анализ {Math.round(aiState.analysisProgress)}%</span>
          </motion.div>
        )}

        {/* Интерактивные маркеры сегментов */}
        <AnimatePresence>
          {segments.map((segment) => {
            const Icon = segment.icon
            const x = segment.startTime * pixelsPerSecond
            const isKeyMoment = segment.type === "keyMoment"

            return (
              <motion.div
                key={segment.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-1 pointer-events-auto"
                style={{ left: `${x}px` }}
                onMouseEnter={() => setHoveredSegment(segment.id)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <Tooltip open={hoveredSegment === segment.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center justify-center rounded-full transition-all cursor-pointer",
                        isKeyMoment ? "w-6 h-6" : "w-5 h-5",
                        hoveredSegment === segment.id && "scale-110",
                      )}
                      style={{
                        backgroundColor: segment.color,
                        opacity: segment.confidence,
                      }}
                    >
                      <Icon className={cn("text-white", isKeyMoment ? "w-3 h-3" : "w-2.5 h-2.5")} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-1">
                      <div className="font-semibold flex items-center gap-1">
                        <Icon className="w-3 h-3" />
                        {segment.label}
                      </div>
                      {segment.description && (
                        <div className="text-xs text-muted-foreground">{segment.description}</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {segment.startTime.toFixed(1)}с - {segment.endTime.toFixed(1)}с
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Уверенность: {Math.round(segment.confidence * 100)}%
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Легенда (появляется при наведении) */}
        {segments.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: hoveredSegment ? 1 : 0 }}
            className="absolute bottom-0 left-0 bg-background/90 backdrop-blur-sm rounded-tr-lg p-2 pointer-events-none"
          >
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Camera className="w-3 h-3" />
                <span>Сцены</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Ключевые моменты</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Качество</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  )
}

// Вспомогательные функции для определения иконок и цветов
function getSceneIcon(type: string): LucideIcon {
  switch (type) {
    case "action":
      return Zap
    case "dialogue":
      return Users
    case "landscape":
      return Eye
    case "closeup":
      return Camera
    case "audio_peak":
      return Volume2
    default:
      return Activity
  }
}

function getSceneLabel(type: string): string {
  switch (type) {
    case "action":
      return "Экшн"
    case "dialogue":
      return "Диалог"
    case "landscape":
      return "Пейзаж"
    case "closeup":
      return "Крупный план"
    case "establishing":
      return "Общий план"
    default:
      return "Сцена"
  }
}

function getSceneColor(type: string): string {
  switch (type) {
    case "action":
      return "#ef4444"
    case "dialogue":
      return "#3b82f6"
    case "landscape":
      return "#10b981"
    case "closeup":
      return "#f59e0b"
    case "establishing":
      return "#8b5cf6"
    default:
      return "#6b7280"
  }
}

function getMomentColor(type: string): string {
  switch (type) {
    case "climax":
      return "#ef4444"
    case "emotional_peak":
      return "#f59e0b"
    case "action_peak":
      return "#eab308"
    case "visual_highlight":
      return "#3b82f6"
    case "audio_peak":
      return "#8b5cf6"
    default:
      return "#6b7280"
  }
}

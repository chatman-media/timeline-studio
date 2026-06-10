/**
 * Player AI Overlay
 * Компонент для отображения real-time AI анализа поверх видео
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Progress } from "@timeline-studio/ui/components/progress"
import { Activity, AlertCircle, Eye, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

import { usePlayerAIAnalysis } from "../hooks/use-player-ai-analysis"

interface PlayerAIOverlayProps {
  className?: string
  showObjects?: boolean
  showSceneInfo?: boolean
  showMoments?: boolean
}

export function PlayerAIOverlay({
  className,
  showObjects = true,
  showSceneInfo = true,
  showMoments = true,
}: PlayerAIOverlayProps) {
  const aiAnalysis = usePlayerAIAnalysis()
  const [isVisible, setIsVisible] = useState(false)

  // Показываем оверлей только когда идет анализ
  useEffect(() => {
    setIsVisible(aiAnalysis.state.isAnalyzing)
  }, [aiAnalysis.state.isAnalyzing])

  if (!isVisible) return null

  const currentScene = aiAnalysis.getCurrentSceneInfo()
  const objects = aiAnalysis.getObjectsInFrame()
  const upcomingMoments = aiAnalysis.getUpcomingMoments(5) // Следующие 5 секунд

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)} data-oid="3iacf:u">
      {/* Индикатор анализа */}
      <div className="absolute top-4 left-4 pointer-events-auto" data-oid="8gtv219">
        <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm" data-oid="t18o:.x">
          <Sparkles className="h-3 w-3 mr-1 animate-pulse text-blue-400" data-oid="4t1i-x0" />
          AI анализ активен
        </Badge>
      </div>

      {/* Информация о сцене */}
      {showSceneInfo && currentScene && (
        <div className="absolute top-4 right-4 pointer-events-auto" data-oid="035l-9y">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white" data-oid="xxnibzv">
            <div className="flex items-center gap-2 mb-2" data-oid="xsl:jze">
              <Eye className="h-4 w-4" data-oid=".mqrp-l" />
              <span className="text-sm font-medium" data-oid="upj32qw">
                Сцена: {currentScene.type}
              </span>
            </div>
            <Progress value={currentScene.confidence * 100} className="h-1 bg-white/20" data-oid=":u2myna" />
          </div>
        </div>
      )}

      {/* Обнаруженные объекты */}
      {showObjects && objects.length > 0 && (
        <div className="absolute bottom-20 left-4" data-oid="2e-2de4">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3" data-oid="zsc-cp:">
            <div className="flex items-center gap-2 mb-2 text-white" data-oid="-5v35xn">
              <Activity className="h-4 w-4" data-oid="uptfmk3" />
              <span className="text-sm font-medium" data-oid="c6c7mta">
                Объекты:
              </span>
            </div>
            <div className="flex flex-wrap gap-1" data-oid="mxk0ixj">
              {objects.slice(0, 5).map((obj, idx) => (
                <Badge key={idx} variant="outline" className="text-white border-white/30" data-oid="fgszpd6">
                  {obj.label} ({Math.round(obj.confidence * 100)}%)
                </Badge>
              ))}
              {objects.length > 5 && (
                <Badge variant="outline" className="text-white border-white/30" data-oid=":xefku8">
                  +{objects.length - 5}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Предстоящие моменты */}
      {showMoments && upcomingMoments && upcomingMoments.length > 0 && (
        <div className="absolute bottom-20 right-4" data-oid=".f9e:u8">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3" data-oid="-6zi.w0">
            <div className="flex items-center gap-2 mb-2 text-white" data-oid="jq9gy5f">
              <AlertCircle className="h-4 w-4 text-yellow-400" data-oid="933p9:3" />
              <span className="text-sm font-medium" data-oid="3cg7jp.">
                Ключевые моменты:
              </span>
            </div>
            <div className="space-y-1" data-oid="l6f5t2h">
              {upcomingMoments.slice(0, 3).map((moment) => (
                <div key={moment.id} className="text-xs text-white/80" data-oid="sq:90ui">
                  {formatTime(moment.timestamp)}: {moment.description}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Боковые границы для обнаруженных объектов */}
      {showObjects &&
        objects.map((obj, idx) => (
          <div
            key={idx}
            className="absolute border-2 border-blue-400/50"
            style={{
              left: `${obj.boundingBox.x}%`,
              top: `${obj.boundingBox.y}%`,
              width: `${obj.boundingBox.width}%`,
              height: `${obj.boundingBox.height}%`,
            }}
            data-oid="wjperme"
          >
            <div
              className="absolute -top-6 left-0 bg-blue-400/80 text-white text-xs px-1 py-0.5 rounded"
              data-oid="7rs8kkp"
            >
              {obj.label}
            </div>
          </div>
        ))}
    </div>
  )
}

// Форматирование времени
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

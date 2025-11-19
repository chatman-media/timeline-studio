"use client"

/**
 * VisualAnalytics Component
 * Визуализация результатов анализа с графиками и charts
 */

import { BarChart3, Clock, Eye, TrendingUp } from "lucide-react"
import { useMemo } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

// Simplified types (в реальной реализации использовать из AI Director)
interface SceneData {
  startTime: number
  endTime: number
  duration: number
  sceneType: string
  confidence: number
}

interface MomentData {
  timestamp: number
  moment_type: string
  importance_score: number
  description?: string
}

interface QualityScore {
  timestamp: number
  overall: number
  visual: number
  audio: number
}

export interface VisualAnalyticsData {
  scenes?: SceneData[]
  moments?: MomentData[]
  qualityScores?: QualityScore[]
  duration?: number // длительность видео в секундах
}

interface VisualAnalyticsProps {
  data: VisualAnalyticsData
  className?: string
}

/**
 * Simple bar chart component (без внешних библиотек)
 */
function SimpleBarChart({
  data,
  height = 200,
  maxValue,
  color = "hsl(var(--primary))",
  label,
}: {
  data: { label: string; value: number; color?: string }[]
  height?: number
  maxValue?: number
  color?: string
  label?: string
}) {
  const max = maxValue || Math.max(...data.map((d) => d.value))

  return (
    <div className="space-y-2">
      {label && <p className="text-xs text-muted-foreground">{label}</p>}
      <div className="flex items-end gap-1" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const heightPercent = (item.value / max) * 100

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
              <div
                className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer"
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: item.color || color,
                  minHeight: item.value > 0 ? "2px" : "0",
                }}
                title={`${item.label}: ${item.value}`}
              />
              <span className="text-[10px] text-muted-foreground truncate max-w-full">{item.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Timeline visualization для сцен
 */
function SceneTimeline({ scenes, duration }: { scenes: SceneData[]; duration: number }) {
  // Группируем сцены по типам для цветов
  const sceneTypes = useMemo(() => {
    const types = new Set(scenes.map((s) => s.sceneType))
    return Array.from(types)
  }, [scenes])

  const getColorForType = (type: string) => {
    const index = sceneTypes.indexOf(type)
    const colors = [
      "hsl(var(--primary))",
      "hsl(var(--secondary))",
      "hsl(210, 100%, 60%)", // blue
      "hsl(120, 70%, 50%)", // green
      "hsl(40, 100%, 60%)", // yellow
      "hsl(340, 80%, 60%)", // pink
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Временная шкала сцен</p>
      <div className="relative h-12 bg-muted rounded-md overflow-hidden">
        {scenes.map((scene, index) => {
          const left = (scene.startTime / duration) * 100
          const width = (scene.duration / duration) * 100

          return (
            <div
              key={index}
              className="absolute h-full transition-all hover:opacity-80 cursor-pointer group"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: getColorForType(scene.sceneType),
              }}
              title={`${scene.sceneType}: ${scene.startTime.toFixed(1)}s - ${scene.endTime.toFixed(1)}s (${Math.round(scene.confidence * 100)}%)`}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-medium text-white drop-shadow-lg">{scene.sceneType}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-3">
        {sceneTypes.map((type) => (
          <div key={type} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColorForType(type) }} />
            <span>{type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Quality scores visualization
 */
function QualityChart({ scores }: { scores: QualityScore[] }) {
  // Группируем scores по временным интервалам для упрощения
  const aggregatedScores = useMemo(() => {
    if (scores.length === 0) return []

    // Если много данных, группируем по 10-секундным интервалам
    const interval = 10
    const maxTime = Math.max(...scores.map((s) => s.timestamp))
    const buckets = Math.ceil(maxTime / interval)

    const result: { label: string; overall: number; visual: number; audio: number }[] = []

    for (let i = 0; i < buckets; i++) {
      const startTime = i * interval
      const endTime = (i + 1) * interval
      const bucketScores = scores.filter((s) => s.timestamp >= startTime && s.timestamp < endTime)

      if (bucketScores.length > 0) {
        const avgOverall = bucketScores.reduce((sum, s) => sum + s.overall, 0) / bucketScores.length
        const avgVisual = bucketScores.reduce((sum, s) => sum + s.visual, 0) / bucketScores.length
        const avgAudio = bucketScores.reduce((sum, s) => sum + s.audio, 0) / bucketScores.length

        result.push({
          label: `${startTime}s`,
          overall: avgOverall,
          visual: avgVisual,
          audio: avgAudio,
        })
      }
    }

    return result
  }, [scores])

  if (aggregatedScores.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Нет данных о качестве</p>
  }

  return (
    <div className="space-y-4">
      <SimpleBarChart
        data={aggregatedScores.map((s) => ({ label: s.label, value: s.overall }))}
        height={150}
        maxValue={1}
        color="hsl(var(--primary))"
        label="Общее качество по времени"
      />

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2">Среднее качество</p>
          <p className="text-2xl font-bold">
            {Math.round((aggregatedScores.reduce((sum, s) => sum + s.overall, 0) / aggregatedScores.length) * 100)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Визуальное</p>
          <p className="text-2xl font-bold">
            {Math.round((aggregatedScores.reduce((sum, s) => sum + s.visual, 0) / aggregatedScores.length) * 100)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Аудио</p>
          <p className="text-2xl font-bold">
            {Math.round((aggregatedScores.reduce((sum, s) => sum + s.audio, 0) / aggregatedScores.length) * 100)}%
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Moments importance distribution
 */
function MomentsDistribution({ moments }: { moments: MomentData[] }) {
  // Группируем моменты по уровням важности
  const distribution = useMemo(() => {
    const buckets = [
      { label: "0-20%", min: 0, max: 0.2, count: 0 },
      { label: "20-40%", min: 0.2, max: 0.4, count: 0 },
      { label: "40-60%", min: 0.4, max: 0.6, count: 0 },
      { label: "60-80%", min: 0.6, max: 0.8, count: 0 },
      { label: "80-100%", min: 0.8, max: 1.0, count: 0 },
    ]

    moments.forEach((moment) => {
      const bucket = buckets.find((b) => moment.importance_score >= b.min && moment.importance_score < b.max)
      if (bucket) bucket.count++
    })

    return buckets.map((b) => ({ label: b.label, value: b.count }))
  }, [moments])

  // Типы моментов
  const momentTypes = useMemo(() => {
    const types = new Map<string, number>()
    moments.forEach((m) => {
      types.set(m.moment_type, (types.get(m.moment_type) || 0) + 1)
    })
    return Array.from(types.entries())
      .map(([type, count]) => ({ label: type, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // топ 10
  }, [moments])

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3">Распределение по важности</h4>
        <SimpleBarChart data={distribution} height={120} color="hsl(210, 100%, 60%)" />
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">Типы моментов (топ 10)</h4>
        <div className="space-y-2">
          {momentTypes.map((type, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-sm min-w-[120px] truncate">{type.label}</span>
              <div className="flex-1">
                <Progress value={(type.value / moments.length) * 100} className="h-2" />
              </div>
              <span className="text-sm font-medium min-w-[40px] text-right">{type.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Main VisualAnalytics component
 */
export function VisualAnalytics({ data, className }: VisualAnalyticsProps) {
  const hasScenes = data.scenes && data.scenes.length > 0
  const hasMoments = data.moments && data.moments.length > 0
  const hasQuality = data.qualityScores && data.qualityScores.length > 0
  const hasData = hasScenes || hasMoments || hasQuality

  if (!hasData) {
    return (
      <Card className={className}>
        <CardContent className="py-16 text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Нет данных для визуализации</p>
          <p className="text-sm text-muted-foreground">Запустите анализ для получения данных</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-4", className)}>
      {/* Scenes Timeline */}
      {hasScenes && data.duration && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Временная шкала сцен
            </CardTitle>
            <CardDescription>
              {data.scenes!.length} сцен • Средняя длительность:{" "}
              {(data.scenes!.reduce((sum, s) => sum + s.duration, 0) / data.scenes!.length).toFixed(1)}s
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SceneTimeline scenes={data.scenes!} duration={data.duration} />
          </CardContent>
        </Card>
      )}

      {/* Quality Scores */}
      {hasQuality && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Качество видео
            </CardTitle>
            <CardDescription>{data.qualityScores!.length} измерений качества</CardDescription>
          </CardHeader>
          <CardContent>
            <QualityChart scores={data.qualityScores!} />
          </CardContent>
        </Card>
      )}

      {/* Moments Distribution */}
      {hasMoments && (
        <Card className={hasScenes || hasQuality ? "lg:col-span-2" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Анализ ключевых моментов
            </CardTitle>
            <CardDescription>{data.moments!.length} моментов обнаружено</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <MomentsDistribution moments={data.moments!} />
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Scene Types Distribution */}
      {hasScenes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Типы сцен
            </CardTitle>
            <CardDescription>Распределение сцен по типам</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={(() => {
                const types = new Map<string, number>()
                data.scenes!.forEach((s) => {
                  types.set(s.sceneType, (types.get(s.sceneType) || 0) + 1)
                })
                return Array.from(types.entries())
                  .map(([type, count]) => ({ label: type, value: count }))
                  .sort((a, b) => b.value - a.value)
              })()}
              height={200}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

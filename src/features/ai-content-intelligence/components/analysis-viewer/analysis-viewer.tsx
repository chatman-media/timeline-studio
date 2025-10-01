import { AlertTriangle, Brain, Clock, Film, Sparkles, TrendingUp, Zap } from "lucide-react"
import { type FC, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import type { UnifiedContentAnalysis } from "../../shared/types"

interface AnalysisViewerProps {
  analysis: UnifiedContentAnalysis | null
  className?: string
  onSceneSelect?: (sceneId: string) => void
  onMomentSelect?: (momentId: string) => void
}

export const AnalysisViewer: FC<AnalysisViewerProps> = ({ analysis, className, onSceneSelect, onMomentSelect }) => {
  const [activeTab, setActiveTab] = useState("overview")

  if (!analysis) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Нет данных для отображения</p>
            <p className="text-sm mt-2">Загрузите видео для анализа</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("analysis-viewer space-y-4", className)}>
      {/* Header with key metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Результаты AI анализа
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<Clock className="w-4 h-4" />}
              label="Длительность"
              value={formatDuration(analysis.mediaFile.duration)}
            />
            <MetricCard icon={<Film className="w-4 h-4" />} label="Сцен" value={analysis.scenes.length.toString()} />
            <MetricCard
              icon={<Sparkles className="w-4 h-4" />}
              label="Ключевых моментов"
              value={analysis.keyMoments.length.toString()}
            />
            <MetricCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Качество"
              value={`${analysis.qualityMetrics.overall}%`}
              color={getQualityColor(analysis.qualityMetrics.overall)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabbed content */}
      <Card className="flex-1">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start rounded-none border-b">
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="scenes">Сцены</TabsTrigger>
              <TabsTrigger value="moments">Моменты</TabsTrigger>
              <TabsTrigger value="insights">Инсайты</TabsTrigger>
              <TabsTrigger value="technical">Технические данные</TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="overview" className="mt-0">
                <OverviewTab analysis={analysis} />
              </TabsContent>

              <TabsContent value="scenes" className="mt-0">
                <ScenesTab scenes={analysis.scenes} onSceneSelect={onSceneSelect} />
              </TabsContent>

              <TabsContent value="moments" className="mt-0">
                <MomentsTab moments={analysis.keyMoments} onMomentSelect={onMomentSelect} />
              </TabsContent>

              <TabsContent value="insights" className="mt-0">
                <InsightsTab insights={analysis.insights} />
              </TabsContent>

              <TabsContent value="technical" className="mt-0">
                <TechnicalTab specs={analysis.technicalSpecs} quality={analysis.qualityMetrics} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Metric Card Component
interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string
  color?: string
}

const MetricCard: FC<MetricCardProps> = ({ icon, label, value, color }) => (
  <div className="bg-muted/50 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <p className={cn("text-2xl font-semibold", color)}>{value}</p>
  </div>
)

// Overview Tab
const OverviewTab: FC<{ analysis: UnifiedContentAnalysis }> = ({ analysis }) => (
  <div className="space-y-6">
    {/* Content Type & Genre */}
    <div>
      <h3 className="text-sm font-medium mb-3">Классификация контента</h3>
      <div className="flex flex-wrap gap-2">
        <Badge variant="default">{analysis.contentType.replace(/_/g, " ")}</Badge>
        {analysis.genres.map((genre: string) => (
          <Badge key={genre} variant="secondary">
            {genre}
          </Badge>
        ))}
      </div>
    </div>

    {/* Emotional Tone */}
    <div>
      <h3 className="text-sm font-medium mb-3">Эмоциональный тон</h3>
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-base">
          {analysis.mood.primary}
        </Badge>
        <Progress value={analysis.mood.intensity * 100} className="flex-1" />
        <span className="text-sm text-muted-foreground">{Math.round(analysis.mood.intensity * 100)}%</span>
      </div>
    </div>

    {/* Target Audience */}
    <div>
      <h3 className="text-sm font-medium mb-3">Целевая аудитория</h3>
      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm">
          Возраст: {analysis.targetAudience.ageRange.min}-{analysis.targetAudience.ageRange.max} лет
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          {analysis.targetAudience.interests.map((interest) => (
            <Badge key={interest} variant="outline" className="text-xs">
              {interest}
            </Badge>
          ))}
        </div>
      </div>
    </div>

    {/* Summary */}
    <div>
      <h3 className="text-sm font-medium mb-3">Краткое описание</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {(analysis.insights as any).summary || "Краткое описание недоступно"}
      </p>
    </div>
  </div>
)

// Scenes Tab
interface ScenesTabProps {
  scenes: UnifiedContentAnalysis["scenes"]
  onSceneSelect?: (sceneId: string) => void
}

const ScenesTab: FC<ScenesTabProps> = ({ scenes, onSceneSelect }) => (
  <ScrollArea className="h-[500px]">
    <div className="space-y-3">
      {scenes.map((scene) => (
        <Card
          key={scene.id}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onSceneSelect?.(scene.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{scene.type}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatTime(scene.startTime)} - {formatTime(scene.endTime)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    {/* <p className="text-xs text-muted-foreground">Качество</p>
                    <Progress value={scene.quality.overall} className="h-2 mt-1" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Объектов</p>
                    <p className="text-sm font-medium">{scene.content.objects.length}</p> */}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Длительность</p>
                <p className="text-sm font-medium">{scene.duration.toFixed(1)}с</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </ScrollArea>
)

// Moments Tab
interface MomentsTabProps {
  moments: UnifiedContentAnalysis["keyMoments"]
  onMomentSelect?: (momentId: string) => void
}

const MomentsTab: FC<MomentsTabProps> = ({ moments, onMomentSelect }) => (
  <ScrollArea className="h-[500px]">
    <div className="space-y-3">
      {moments.map((moment) => (
        <Card
          key={moment.id}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onMomentSelect?.(moment.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge>{moment.type.replace(/_/g, " ")}</Badge>
                  <span className="text-sm text-muted-foreground">{formatTime(moment.timestamp)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{moment.description}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{moment.score}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </ScrollArea>
)

// Insights Tab
const InsightsTab: FC<{ insights: UnifiedContentAnalysis["insights"] }> = ({ insights }) => (
  <div className="space-y-6">
    {/* Highlights */}
    {insights.highlights.length > 0 && (
      <div>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Основные моменты
        </h3>
        <ul className="space-y-2">
          {insights.highlights.map((highlight, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              <span className="text-sm">{highlight}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Suggestions */}
    {insights.suggestions.length > 0 && (
      <div>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Рекомендации
        </h3>
        <div className="space-y-2">
          {insights.suggestions.map((suggestion: any, index: number) => (
            <div key={index} className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="text-xs">
                  {suggestion.type}
                </Badge>
                <Badge
                  variant={String(suggestion.priority) === "high" ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {suggestion.priority}
                </Badge>
              </div>
              <p className="text-sm">{suggestion.description}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Warnings */}
    {insights.warnings.length > 0 && (
      <div>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          Предупреждения
        </h3>
        <div className="space-y-2">
          {insights.warnings.map((warning: any, index: number) => (
            <div key={index} className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="text-xs">
                  {warning.type}
                </Badge>
                <span className="text-xs text-yellow-600">{warning.severity}</span>
              </div>
              <p className="text-sm">{warning.description}</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)

// Technical Tab
interface TechnicalTabProps {
  specs: UnifiedContentAnalysis["technicalSpecs"]
  quality: UnifiedContentAnalysis["qualityMetrics"]
}

const TechnicalTab: FC<TechnicalTabProps> = ({ specs, quality }) => (
  <div className="space-y-6">
    {/* Technical Specifications */}
    <div>
      <h3 className="text-sm font-medium mb-3">Технические характеристики</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <InfoRow label="Разрешение" value={`${specs.resolution.width}x${specs.resolution.height}`} />
          <InfoRow label="Соотношение сторон" value={specs.resolution.aspectRatio} />
          <InfoRow label="Частота кадров" value={`${specs.frameRate} fps`} />
          <InfoRow label="Битрейт" value={formatBitrate(specs.bitrate)} />
        </div>
        <div className="space-y-2">
          <InfoRow label="Видео кодек" value={specs.codec} />
          <InfoRow label="Аудио кодек" value={specs.audioCodec} />
          <InfoRow label="Аудио каналы" value={specs.audioChannels.toString()} />
          <InfoRow label="Аудио битрейт" value={formatBitrate(specs.audioBitrate)} />
        </div>
      </div>
    </div>

    {/* Quality Metrics */}
    <div>
      <h3 className="text-sm font-medium mb-3">Метрики качества</h3>
      <div className="space-y-3">
        <QualityMetric label="Общее качество" value={quality.overall} />
        <QualityMetric label="Резкость" value={quality.sharpness} />
        <QualityMetric label="Яркость" value={quality.brightness} />
        <QualityMetric label="Контраст" value={quality.contrast} />
        <QualityMetric label="Насыщенность" value={quality.saturation} />
        <QualityMetric label="Стабильность" value={quality.stability} />
        <QualityMetric label="Шум" value={100 - quality.noise} inverse />
      </div>
    </div>
  </div>
)

// Helper Components
const InfoRow: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}:</span>
    <span className="font-medium">{value}</span>
  </div>
)

const QualityMetric: FC<{ label: string; value: number; inverse?: boolean }> = ({ label, value, inverse }) => (
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}%</span>
    </div>
    <Progress
      value={value}
      className={cn("h-2", inverse && value < 30 && "bg-red-100", !inverse && value > 70 && "bg-green-100")}
    />
  </div>
)

// Utility functions
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

function formatBitrate(bitrate: number): string {
  if (bitrate >= 1000000) {
    return `${(bitrate / 1000000).toFixed(1)} Mbps`
  }
  return `${Math.round(bitrate / 1000)} kbps`
}

function getQualityColor(quality: number): string {
  if (quality >= 80) return "text-green-600"
  if (quality >= 60) return "text-yellow-600"
  return "text-red-600"
}

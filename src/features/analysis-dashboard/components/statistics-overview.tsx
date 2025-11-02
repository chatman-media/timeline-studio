// Statistics overview component

import { Award, Clock, Eye, FileVideo, Star, Target, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { MomentType, ProjectStatistics, SceneType } from "../types/analysis"

interface StatisticsOverviewProps {
  statistics: ProjectStatistics
}

export function StatisticsOverview({ statistics }: StatisticsOverviewProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}ч ${minutes}м ${secs}с`
    }
    if (minutes > 0) {
      return `${minutes}м ${secs}с`
    }
    return `${secs}с`
  }

  const getSceneTypeLabel = (type: SceneType) => {
    switch (type) {
      case SceneType.Cinematic:
        return "Кинематографичные"
      case SceneType.Dynamic:
        return "Динамичные"
      case SceneType.Closeup:
        return "Крупный план"
      case SceneType.Wide:
        return "Общий план"
      case SceneType.Medium:
        return "Средний план"
      case SceneType.Static:
        return "Статичные"
      default:
        return type
    }
  }

  const getMomentTypeLabel = (type: MomentType) => {
    switch (type) {
      case MomentType.ActionClimax:
        return "Экшен"
      case MomentType.EmotionalPeak:
        return "Эмоциональные"
      case MomentType.VisualStunning:
        return "Визуальные"
      case MomentType.AudioPeak:
        return "Аудио пики"
      case MomentType.QualityPeak:
        return "Качественные"
      case MomentType.ComedicMoment:
        return "Комедийные"
      case MomentType.DialogueHighlight:
        return "Диалоги"
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileVideo className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{statistics.total_files}</p>
                <p className="text-xs text-muted-foreground">Файлов</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{formatDuration(statistics.total_duration)}</p>
                <p className="text-xs text-muted-foreground">Общая длительность</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{statistics.total_scenes}</p>
                <p className="text-xs text-muted-foreground">Сцен</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{statistics.total_moments}</p>
                <p className="text-xs text-muted-foreground">Ключевых моментов</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Распределение качества
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Отличное (80-100%)</span>
                <span className="text-sm font-medium">{statistics.quality_distribution.excellent}</span>
              </div>
              <Progress
                value={(statistics.quality_distribution.excellent / statistics.total_scenes) * 100}
                className="h-2"
              />

              <div className="flex justify-between items-center">
                <span className="text-sm">Хорошее (60-80%)</span>
                <span className="text-sm font-medium">{statistics.quality_distribution.good}</span>
              </div>
              <Progress
                value={(statistics.quality_distribution.good / statistics.total_scenes) * 100}
                className="h-2"
              />

              <div className="flex justify-between items-center">
                <span className="text-sm">Среднее (40-60%)</span>
                <span className="text-sm font-medium">{statistics.quality_distribution.average}</span>
              </div>
              <Progress
                value={(statistics.quality_distribution.average / statistics.total_scenes) * 100}
                className="h-2"
              />

              <div className="flex justify-between items-center">
                <span className="text-sm">Низкое (0-40%)</span>
                <span className="text-sm font-medium">{statistics.quality_distribution.poor}</span>
              </div>
              <Progress
                value={(statistics.quality_distribution.poor / statistics.total_scenes) * 100}
                className="h-2"
              />
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Средний балл качества</span>
                <Badge variant="secondary">{Math.round(statistics.average_quality * 100)}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scene Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Типы сцен
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statistics.scene_type_distribution).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm">{getSceneTypeLabel(type as SceneType)}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 text-right">
                      <Progress value={(count / statistics.total_scenes) * 100} className="h-2" />
                    </div>
                    <span className="text-sm font-medium w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Moment Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Типы моментов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statistics.moment_type_distribution).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm">{getMomentTypeLabel(type as MomentType)}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 text-right">
                      <Progress value={(count / statistics.total_moments) * 100} className="h-2" />
                    </div>
                    <span className="text-sm font-medium w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Temporal Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Временная аналитика
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between">
                <span className="text-sm">Сцен в минуту</span>
                <span className="font-medium">{statistics.temporal_distribution.scenes_per_minute.toFixed(1)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm">Моментов в минуту</span>
                <span className="font-medium">{statistics.temporal_distribution.moments_per_minute.toFixed(1)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm">Средняя длина сцены</span>
                <span className="font-medium">
                  {formatDuration(statistics.temporal_distribution.average_scene_duration)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-sm">Время анализа</span>
                <span className="font-medium">{formatDuration(statistics.analysis_completion_time)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dominant Emotions */}
        {statistics.dominant_emotions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Доминирующие эмоции
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {statistics.dominant_emotions.slice(0, 10).map((emotion, index) => (
                  <Badge key={index} variant="outline">
                    {emotion}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Most Frequent Objects */}
        {statistics.most_frequent_objects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Частые объекты
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {statistics.most_frequent_objects.slice(0, 10).map((object, index) => (
                  <Badge key={index} variant="outline">
                    {object}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

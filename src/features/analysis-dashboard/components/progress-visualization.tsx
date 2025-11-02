// Progress visualization component for analysis

import { BarChart3, CheckCircle, Database, Eye, FileVideo, Heart, Search, Star, Users, Volume2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AnalysisProgress, AnalysisStage } from "../types/analysis"

interface ProgressVisualizationProps {
  progress: AnalysisProgress
}

export function ProgressVisualization({ progress }: ProgressVisualizationProps) {
  // Get stage info with icons and descriptions
  const getStageInfo = (stage: AnalysisStage) => {
    switch (stage) {
      case AnalysisStage.MediaAnalysis:
        return {
          icon: FileVideo,
          title: "Анализ медиафайлов",
          description: "Извлечение метаданных и базовый анализ",
          color: "text-blue-500",
        }
      case AnalysisStage.SceneDetection:
        return {
          icon: Eye,
          title: "Детекция сцен",
          description: "Поиск границ сцен и композиционный анализ",
          color: "text-green-500",
        }
      case AnalysisStage.PersonRecognition:
        return {
          icon: Users,
          title: "Распознавание персон",
          description: "Детекция лиц и идентификация персон",
          color: "text-purple-500",
        }
      case AnalysisStage.EmotionAnalysis:
        return {
          icon: Heart,
          title: "Анализ эмоций",
          description: "Определение эмоционального тона сцен",
          color: "text-pink-500",
        }
      case AnalysisStage.QualityAnalysis:
        return {
          icon: BarChart3,
          title: "Анализ качества",
          description: "Оценка технического качества видео",
          color: "text-orange-500",
        }
      case AnalysisStage.AudioAnalysis:
        return {
          icon: Volume2,
          title: "Анализ аудио",
          description: "Анализ звуковой дорожки и пиков",
          color: "text-cyan-500",
        }
      case AnalysisStage.KeyMomentDetection:
        return {
          icon: Star,
          title: "Поиск ключевых моментов",
          description: "Выявление важных временных отрезков",
          color: "text-yellow-500",
        }
      case AnalysisStage.DataAggregation:
        return {
          icon: Database,
          title: "Агрегация данных",
          description: "Объединение результатов анализа",
          color: "text-indigo-500",
        }
      case AnalysisStage.IndexGeneration:
        return {
          icon: Search,
          title: "Генерация индексов",
          description: "Создание поисковых индексов",
          color: "text-teal-500",
        }
      case AnalysisStage.Finalization:
        return {
          icon: CheckCircle,
          title: "Финализация",
          description: "Завершение и сохранение результатов",
          color: "text-green-600",
        }
      default:
        return {
          icon: FileVideo,
          title: "Анализ",
          description: "Выполняется анализ",
          color: "text-gray-500",
        }
    }
  }

  const stageInfo = getStageInfo(progress.stage)
  const IconComponent = stageInfo.icon
  const progressPercentage = Math.round(progress.progress * 100)

  // Calculate estimated time remaining
  const getEstimatedTimeRemaining = () => {
    if (!progress.estimated_completion) return null

    try {
      const completion = new Date(progress.estimated_completion)
      const now = new Date()
      const diffMs = completion.getTime() - now.getTime()

      if (diffMs <= 0) return "Завершается..."

      const diffMins = Math.round(diffMs / (1000 * 60))
      if (diffMins < 60) {
        return `~${diffMins} мин`
      }
      const diffHours = Math.round(diffMins / 60)
      return `~${diffHours} ч`
    } catch {
      return null
    }
  }

  const timeRemaining = getEstimatedTimeRemaining()

  return (
    <div className="space-y-4">
      {/* Main Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Прогресс анализа</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{progressPercentage}%</Badge>
            {timeRemaining && <Badge variant="secondary">{timeRemaining}</Badge>}
          </div>
        </div>
        <Progress value={progressPercentage} className="h-3" />
      </div>

      {/* Current Stage */}
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
        <IconComponent className={`h-6 w-6 mt-0.5 ${stageInfo.color}`} />
        <div className="flex-1">
          <h4 className="font-medium">{stageInfo.title}</h4>
          <p className="text-sm text-muted-foreground mb-2">{stageInfo.description}</p>
          {progress.current_file && <p className="text-xs text-muted-foreground">Файл: {progress.current_file}</p>}
        </div>
      </div>

      {/* Stage Progress */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {Object.values(AnalysisStage).map((stage, index) => {
          const info = getStageInfo(stage)
          const StageIcon = info.icon
          const currentStageIndex = Object.values(AnalysisStage).indexOf(progress.stage)
          const isCompleted = index < currentStageIndex
          const isCurrent = index === currentStageIndex
          const isPending = index > currentStageIndex

          return (
            <div
              key={stage}
              className={`p-2 rounded-lg text-center transition-all ${
                isCompleted
                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : isCurrent
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              <StageIcon
                className={`h-4 w-4 mx-auto mb-1 ${
                  isCompleted
                    ? "text-green-600 dark:text-green-400"
                    : isCurrent
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-400"
                }`}
              />
              <p className="text-xs font-medium">{info.title.split(" ")[0]}</p>
              {isCompleted && <CheckCircle className="h-3 w-3 mx-auto mt-1 text-green-600 dark:text-green-400" />}
            </div>
          )
        })}
      </div>

      {/* Project Info */}
      <div className="text-sm text-muted-foreground">
        <p>Проект ID: {progress.project_id}</p>
        <p>Начат: {new Date(progress.start_time).toLocaleString("ru-RU")}</p>
        {progress.error_message && <p className="text-red-600 mt-1">Ошибка: {progress.error_message}</p>}
      </div>
    </div>
  )
}

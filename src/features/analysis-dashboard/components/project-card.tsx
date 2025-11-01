// Project card component for analysis dashboard

import { formatDistance } from "date-fns"
import { ru } from "date-fns/locale"
import { Calendar, Clock, Eye, FileVideo, MoreVertical, PlayCircle, Star, Users } from "lucide-react"
import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AnalysisProject, AnalysisStatus } from "../types/analysis"

interface ProjectCardProps {
  project: AnalysisProject
  onSelect: () => void
  onStartAnalysis: () => void
  isSelected: boolean
}

export function ProjectCard({ project, onSelect, onStartAnalysis, isSelected }: ProjectCardProps) {
  // Get status color and text
  const getStatusInfo = (status: AnalysisStatus) => {
    switch (status) {
      case AnalysisStatus.Completed:
        return { color: "bg-green-500", text: "Завершен", variant: "secondary" as const }
      case AnalysisStatus.InProgress:
        return { color: "bg-blue-500", text: "Выполняется", variant: "default" as const }
      case AnalysisStatus.Failed:
        return { color: "bg-red-500", text: "Ошибка", variant: "destructive" as const }
      case AnalysisStatus.Cancelled:
        return { color: "bg-gray-500", text: "Отменен", variant: "outline" as const }
      default:
        return { color: "bg-yellow-500", text: "Создан", variant: "outline" as const }
    }
  }

  const statusInfo = getStatusInfo(project.status)
  const canStartAnalysis = project.status === AnalysisStatus.Created
  const isAnalyzing = project.status === AnalysisStatus.InProgress

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistance(new Date(dateString), new Date(), {
        addSuffix: true,
        locale: ru,
      })
    } catch {
      return "недавно"
    }
  }

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-blue-500" : ""}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
          <span className="text-xs text-muted-foreground">{formatRelativeTime(project.created_at)}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        {project.description && <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>}

        {/* Project metrics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <FileVideo className="h-4 w-4 text-blue-500" />
            <span>{project.files.length} файлов</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <span>{project.files.reduce((acc, file) => acc + (file.duration || 0), 0).toFixed(1)}с</span>
          </div>
        </div>

        {/* Analysis progress for in-progress projects */}
        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Прогресс анализа</span>
              <span>65%</span>
            </div>
            <Progress value={65} className="h-2" />
            <p className="text-xs text-muted-foreground">Анализ качества видео...</p>
          </div>
        )}

        {/* Completion metrics for completed projects */}
        {project.status === AnalysisStatus.Completed && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t text-xs">
            <div className="text-center">
              <div className="font-semibold">156</div>
              <div className="text-muted-foreground">Сцен</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">43</div>
              <div className="text-muted-foreground">Моментов</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">3</div>
              <div className="text-muted-foreground">Персон</div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3">
        <div className="flex w-full gap-2">
          {canStartAnalysis && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onStartAnalysis()
              }}
              className="flex-1 gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              Запустить анализ
            </Button>
          )}

          {project.status === AnalysisStatus.Completed && (
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onSelect()
              }}
              className="flex-1 gap-2"
            >
              <Eye className="h-4 w-4" />
              Просмотр
            </Button>
          )}

          {isAnalyzing && (
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onSelect()
              }}
              className="flex-1 gap-2"
            >
              <Eye className="h-4 w-4" />
              Мониторинг
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

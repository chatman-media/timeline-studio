"use client"

/**
 * MontagePlanPreview - Компонент предпросмотра плана монтажа
 * Показывает визуальное представление плана до его применения
 */

import { Check, Clock, Film, Music, Pencil, Sparkles, Type, X } from "lucide-react"
import { useCallback, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

import type { MontagePlan } from "../types/montage-plan"
import { MontagePlanEditor } from "./montage-plan-editor"

interface MontagePlanPreviewProps {
  plan: MontagePlan
  onApply?: () => void
  onEdit?: () => void
  onCancel?: () => void
  className?: string
}

export function MontagePlanPreview({ plan, onApply, onEdit, onCancel, className }: MontagePlanPreviewProps) {
  const [expandedClipIndex, setExpandedClipIndex] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedPlan, setEditedPlan] = useState<MontagePlan>(plan)

  // Сохранить отредактированный план
  const handleSaveEdit = useCallback(
    (updatedPlan: MontagePlan) => {
      setEditedPlan(updatedPlan)
      setIsEditing(false)

      // Вызываем onEdit callback если передан
      if (onEdit) {
        onEdit()
      }
    },
    [onEdit],
  )

  // Применить план (используем отредактированную версию если есть)
  const handleApply = useCallback(() => {
    if (onApply) {
      onApply()
    }
  }, [onApply])

  // Если в режиме редактирования, показываем редактор
  if (isEditing) {
    return (
      <MontagePlanEditor
        plan={editedPlan}
        onSave={handleSaveEdit}
        onCancel={() => setIsEditing(false)}
        className={className}
      />
    )
  }

  // Форматирование времени в MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Получить иконку и название стиля
  const getStyleInfo = (style: string) => {
    const styles: Record<string, { label: string; icon: string; color: string }> = {
      dynamic: { label: "Динамичный", icon: "⚡", color: "text-orange-500" },
      calm: { label: "Спокойный", icon: "🌊", color: "text-blue-500" },
      balanced: {
        label: "Сбалансированный",
        icon: "⚖️",
        color: "text-green-500",
      },
      cinematic: {
        label: "Кинематографический",
        icon: "🎬",
        color: "text-purple-500",
      },
      vlog: { label: "Vlog", icon: "📹", color: "text-pink-500" },
      highlights: { label: "Highlights", icon: "⭐", color: "text-yellow-500" },
      tutorial: { label: "Обучающий", icon: "📚", color: "text-indigo-500" },
    }
    return styles[style] || { label: style, icon: "🎞️", color: "text-gray-500" }
  }

  // Используем отредактированный план для отображения
  const displayPlan = editedPlan
  const styleInfo = getStyleInfo(displayPlan.style)
  const totalDuration = displayPlan.actualDuration || displayPlan.targetDuration

  return (
    <Card className={cn("flex flex-col", className)}>
      {/* Заголовок с информацией о плане */}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              {displayPlan.name}
            </CardTitle>
            <CardDescription className="mt-2 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTime(totalDuration)}
              </span>
              <span className="flex items-center gap-1">
                <Film className="h-4 w-4" />
                {displayPlan.clips.length} клипов
              </span>
              <span className={cn("flex items-center gap-1 font-medium", styleInfo.color)}>
                <span>{styleInfo.icon}</span>
                {styleInfo.label}
              </span>
            </CardDescription>
            {displayPlan.description && <p className="text-sm text-muted-foreground mt-2">{displayPlan.description}</p>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Визуальная временная шкала */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Временная шкала</h3>
          <TimelinePreview plan={displayPlan} onClipClick={(index) => setExpandedClipIndex(index)} />
        </div>

        {/* Список клипов */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Клипы ({displayPlan.clips.length})</h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 pr-4">
              {displayPlan.clips.map((clip, index) => (
                <ClipCard
                  key={index}
                  clip={clip}
                  index={index}
                  transition={displayPlan.transitions.find((t) => t.afterClipIndex === index)}
                  isExpanded={expandedClipIndex === index}
                  onToggle={() => setExpandedClipIndex(expandedClipIndex === index ? null : index)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Музыка */}
        {displayPlan.music && (
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Music className="h-4 w-4 text-primary" />
              Музыка
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Стиль: <span className="font-medium text-foreground">{displayPlan.music.style || "Не указан"}</span>
              </p>
              <p>
                Громкость:{" "}
                <span className="font-medium text-foreground">
                  {Math.round((displayPlan.music.volume || 0.5) * 100)}%
                </span>
              </p>
              <p>
                Fade In: <span className="font-medium text-foreground">{displayPlan.music.fadeIn || 0}s</span>, Fade
                Out: <span className="font-medium text-foreground">{displayPlan.music.fadeOut || 0}s</span>
              </p>
            </div>
          </div>
        )}

        {/* Титры */}
        {displayPlan.texts && displayPlan.texts.length > 0 && (
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Type className="h-4 w-4 text-primary" />
              Титры ({displayPlan.texts.length})
            </div>
            <div className="space-y-2">
              {displayPlan.texts.map((text, index) => (
                <div key={index} className="text-sm">
                  <p className="font-medium">{text.content}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatTime(text.startTime)} • {text.duration}s • {text.position || "bottom"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Статистика */}
        {displayPlan.metadata && (
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p className="font-semibold text-lg">{displayPlan.metadata.sourceFilesCount || 0}</p>
                <p className="text-muted-foreground">Исходных файлов</p>
              </div>
              <div>
                <p className="font-semibold text-lg">{displayPlan.metadata.usedFilesCount || 0}</p>
                <p className="text-muted-foreground">Использовано</p>
              </div>
              <div>
                <p className="font-semibold text-lg">{displayPlan.metadata.usagePercentage?.toFixed(0) || 0}%</p>
                <p className="text-muted-foreground">Материала</p>
              </div>
            </div>
          </div>
        )}

        {/* Действия */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleApply} className="flex-1 gap-2" size="lg">
            <Check className="h-4 w-4" />
            Применить к Timeline
          </Button>
          <Button onClick={() => setIsEditing(true)} variant="outline" size="lg" className="gap-2">
            <Pencil className="h-4 w-4" />
            Редактировать
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="outline" size="lg">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * TimelinePreview - Визуальная мини-временная шкала
 */
function TimelinePreview({ plan, onClipClick }: { plan: MontagePlan; onClipClick?: (index: number) => void }) {
  const totalDuration = plan.actualDuration || plan.targetDuration

  return (
    <div className="relative w-full h-24 rounded-lg border bg-muted/30 p-4 overflow-x-auto">
      <div className="relative h-full flex items-center gap-1">
        {plan.clips.map((clip, index) => {
          const widthPercent = (clip.duration / totalDuration) * 100
          const transition = plan.transitions.find((t) => t.afterClipIndex === index)

          return (
            <div key={index} className="flex items-center" style={{ width: `${widthPercent}%` }}>
              {/* Клип */}
              <div
                className={cn(
                  "h-12 rounded bg-primary/80 hover:bg-primary cursor-pointer transition-colors flex items-center justify-center text-xs font-medium text-primary-foreground",
                  "w-full min-w-[40px]",
                )}
                onClick={() => onClipClick?.(index)}
                title={`Клип ${index + 1}: ${clip.duration.toFixed(1)}s`}
              >
                {index + 1}
              </div>

              {/* Переход */}
              {transition && (
                <div className="shrink-0 mx-1" title={`${transition.type} (${transition.duration}s)`}>
                  {transition.type === "cross_dissolve" && <span className="text-xs">⟿</span>}
                  {transition.type === "cut" && <span className="text-xs">→</span>}
                  {transition.type === "fade_to_black" && <span className="text-xs">⬤</span>}
                  {transition.type === "wipe" && <span className="text-xs">⟹</span>}
                  {transition.type === "slide" && <span className="text-xs">⇒</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * ClipCard - Карточка одного клипа
 */
interface ClipCardProps {
  clip: any
  index: number
  transition?: any
  isExpanded: boolean
  onToggle: () => void
}

function ClipCard({ clip, index, transition, isExpanded, onToggle }: ClipCardProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(1)
    return `${mins}:${secs.padStart(4, "0")}`
  }

  const getTransitionIcon = (type: string) => {
    const icons: Record<string, string> = {
      cross_dissolve: "⟿",
      cut: "→",
      fade_to_black: "⬤",
      wipe: "⟹",
      slide: "⇒",
    }
    return icons[type] || "→"
  }

  const getTransitionLabel = (type: string) => {
    const labels: Record<string, string> = {
      cross_dissolve: "Cross Dissolve",
      cut: "Cut",
      fade_to_black: "Fade to Black",
      wipe: "Wipe",
      slide: "Slide",
    }
    return labels[type] || type
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors cursor-pointer",
        isExpanded ? "bg-primary/5 border-primary" : "bg-card hover:bg-muted/50",
      )}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        {/* Номер */}
        <div
          className={cn(
            "shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
            isExpanded ? "bg-primary text-primary-foreground" : "bg-muted",
          )}
        >
          {index + 1}
        </div>

        {/* Информация */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{clip.filePath.split("/").pop()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            [{formatTime(clip.startTime)} - {formatTime(clip.endTime)}] • {clip.duration.toFixed(1)}s
          </p>

          {/* Качество */}
          {clip.qualityScore !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    clip.qualityScore >= 0.8
                      ? "bg-green-500"
                      : clip.qualityScore >= 0.6
                        ? "bg-yellow-500"
                        : "bg-orange-500",
                  )}
                  style={{ width: `${clip.qualityScore * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium">{Math.round(clip.qualityScore * 100)}%</span>
            </div>
          )}

          {/* Причина выбора */}
          {isExpanded && (
            <div className="mt-3 p-2 rounded bg-muted/50 text-xs">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Причина: </span>
                {clip.reason}
              </p>
            </div>
          )}

          {/* Переход */}
          {transition && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-base">{getTransitionIcon(transition.type)}</span>
              <span>
                {getTransitionLabel(transition.type)} ({transition.duration}s)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

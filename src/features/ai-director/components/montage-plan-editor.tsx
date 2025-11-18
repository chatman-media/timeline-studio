"use client"

/**
 * MontagePlanEditor - Компонент редактирования плана монтажа
 * Позволяет изменять порядок клипов, удалять, менять длительность и переходы
 */

import { ArrowDown, ArrowUp, Save, Trash2, X } from "lucide-react"
import { useCallback, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

import type { MontageClip, MontagePlan, TransitionType } from "../types/montage-plan"

interface MontagePlanEditorProps {
  plan: MontagePlan
  onSave?: (updatedPlan: MontagePlan) => void
  onCancel?: () => void
  className?: string
}

export function MontagePlanEditor({ plan, onSave, onCancel, className }: MontagePlanEditorProps) {
  const [editedPlan, setEditedPlan] = useState<MontagePlan>(plan)
  const [hasChanges, setHasChanges] = useState(false)

  // Переместить клип вверх
  const moveClipUp = useCallback((index: number) => {
    if (index === 0) return

    setEditedPlan((prev) => {
      const newClips = [...prev.clips]
      ;[newClips[index - 1], newClips[index]] = [newClips[index], newClips[index - 1]]

      return {
        ...prev,
        clips: newClips,
      }
    })
    setHasChanges(true)
  }, [])

  // Переместить клип вниз
  const moveClipDown = useCallback((index: number) => {
    setEditedPlan((prev) => {
      if (index === prev.clips.length - 1) return prev

      const newClips = [...prev.clips]
      ;[newClips[index], newClips[index + 1]] = [newClips[index + 1], newClips[index]]

      return {
        ...prev,
        clips: newClips,
      }
    })
    setHasChanges(true)
  }, [])

  // Удалить клип
  const removeClip = useCallback((index: number) => {
    setEditedPlan((prev) => ({
      ...prev,
      clips: prev.clips.filter((_, i) => i !== index),
      transitions: prev.transitions.filter((t) => t.afterClipIndex !== index),
    }))
    setHasChanges(true)
  }, [])

  // Изменить длительность клипа
  const updateClipDuration = useCallback((index: number, newDuration: number) => {
    setEditedPlan((prev) => {
      const newClips = [...prev.clips]
      const clip = newClips[index]

      // Пересчитываем endTime на основе новой длительности
      newClips[index] = {
        ...clip,
        duration: newDuration,
        endTime: clip.startTime + newDuration,
      }

      return {
        ...prev,
        clips: newClips,
      }
    })
    setHasChanges(true)
  }, [])

  // Изменить переход после клипа
  const updateTransition = useCallback((clipIndex: number, transitionType: TransitionType) => {
    setEditedPlan((prev) => {
      const existingTransition = prev.transitions.find((t) => t.afterClipIndex === clipIndex)

      if (existingTransition) {
        // Обновляем существующий переход
        return {
          ...prev,
          transitions: prev.transitions.map((t) =>
            t.afterClipIndex === clipIndex
              ? {
                  ...t,
                  type: transitionType,
                }
              : t,
          ),
        }
      }

      // Добавляем новый переход
      return {
        ...prev,
        transitions: [
          ...prev.transitions,
          {
            type: transitionType,
            duration: 0.5,
            afterClipIndex: clipIndex,
          },
        ],
      }
    })
    setHasChanges(true)
  }, [])

  // Удалить переход
  const removeTransition = useCallback((clipIndex: number) => {
    setEditedPlan((prev) => ({
      ...prev,
      transitions: prev.transitions.filter((t) => t.afterClipIndex !== clipIndex),
    }))
    setHasChanges(true)
  }, [])

  // Сохранить изменения
  const handleSave = useCallback(() => {
    // Пересчитываем actualDuration
    const totalDuration = editedPlan.clips.reduce((sum, clip) => sum + clip.duration, 0)

    const updatedPlan: MontagePlan = {
      ...editedPlan,
      actualDuration: totalDuration,
      updatedAt: new Date(),
    }

    if (onSave) {
      onSave(updatedPlan)
    }
  }, [editedPlan, onSave])

  // Форматирование времени
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const totalDuration = editedPlan.clips.reduce((sum, clip) => sum + clip.duration, 0)

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Редактирование плана монтажа</CardTitle>
            <CardDescription className="mt-2">Измени порядок клипов, длительность и переходы</CardDescription>
          </div>
          {hasChanges && <div className="text-sm text-orange-500 font-medium">Есть несохраненные изменения</div>}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Общая информация */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Клипов: {editedPlan.clips.length}</span>
          <span>Длительность: {formatTime(totalDuration)}</span>
          <span>Переходов: {editedPlan.transitions.length}</span>
        </div>

        {/* Список клипов для редактирования */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 pr-4">
            {editedPlan.clips.map((clip, index) => (
              <ClipEditorCard
                key={`${clip.fileId}-${index}`}
                clip={clip}
                index={index}
                totalClips={editedPlan.clips.length}
                transition={editedPlan.transitions.find((t) => t.afterClipIndex === index)}
                onMoveUp={() => moveClipUp(index)}
                onMoveDown={() => moveClipDown(index)}
                onRemove={() => removeClip(index)}
                onUpdateDuration={(duration) => updateClipDuration(index, duration)}
                onUpdateTransition={(type) => updateTransition(index, type)}
                onRemoveTransition={() => removeTransition(index)}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Действия */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleSave} className="flex-1 gap-2" size="lg" disabled={!hasChanges}>
            <Save className="h-4 w-4" />
            Сохранить изменения
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
 * ClipEditorCard - Карточка клипа для редактирования
 */
interface ClipEditorCardProps {
  clip: MontageClip
  index: number
  totalClips: number
  transition?: { type: TransitionType; duration: number }
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  onUpdateDuration: (duration: number) => void
  onUpdateTransition: (type: TransitionType) => void
  onRemoveTransition: () => void
}

function ClipEditorCard({
  clip,
  index,
  totalClips,
  transition,
  onMoveUp,
  onMoveDown,
  onRemove,
  onUpdateDuration,
  onUpdateTransition,
  onRemoveTransition,
}: ClipEditorCardProps) {
  const [durationInput, setDurationInput] = useState(clip.duration.toFixed(1))

  const handleDurationBlur = () => {
    const newDuration = Number.parseFloat(durationInput)
    if (!Number.isNaN(newDuration) && newDuration > 0) {
      onUpdateDuration(newDuration)
    } else {
      setDurationInput(clip.duration.toFixed(1))
    }
  }

  const transitionTypes: { value: TransitionType; label: string }[] = [
    { value: "cut", label: "Cut" },
    { value: "cross_dissolve", label: "Cross Dissolve" },
    { value: "fade_to_black", label: "Fade to Black" },
    { value: "wipe", label: "Wipe" },
    { value: "slide", label: "Slide" },
  ]

  return (
    <div className="rounded-lg border p-4 space-y-3 bg-card">
      {/* Заголовок с номером и файлом */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{clip.filePath.split("/").pop()}</p>
          <p className="text-xs text-muted-foreground mt-1">{clip.reason}</p>
        </div>
        <div className="flex gap-1">
          <Button
            onClick={onMoveUp}
            disabled={index === 0}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Переместить вверх"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            onClick={onMoveDown}
            disabled={index === totalClips - 1}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Переместить вниз"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button onClick={onRemove} variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Удалить">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Редактирование длительности */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`duration-${index}`} className="text-xs">
            Длительность (сек)
          </Label>
          <Input
            id={`duration-${index}`}
            type="number"
            step="0.1"
            min="0.1"
            value={durationInput}
            onChange={(e) => setDurationInput(e.target.value)}
            onBlur={handleDurationBlur}
            className="h-8 mt-1"
          />
        </div>

        {/* Переход после клипа */}
        {index < totalClips - 1 && (
          <div>
            <Label className="text-xs">Переход</Label>
            <div className="flex gap-1 mt-1">
              <Select
                value={transition?.type || ""}
                onValueChange={(value) => onUpdateTransition(value as TransitionType)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Нет перехода" />
                </SelectTrigger>
                <SelectContent>
                  {transitionTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {transition && (
                <Button onClick={onRemoveTransition} variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Качество */}
      {clip.qualityScore !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Качество:</span>
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
    </div>
  )
}

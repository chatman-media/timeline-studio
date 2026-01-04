/**
 * Storyboard Editor - редактор раскадровки
 */

import { useState } from "react"
import { ArrowRight, Film, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ScriptFragment, ScriptPlan, ScriptScene } from "@/features/timeline/types/script"

export interface StoryboardEditorProps {
  /** Текущий план */
  plan: ScriptPlan | null
  /** Все доступные фрагменты */
  fragments?: ScriptFragment[]
  /** Callback при изменении плана */
  onPlanChange?: (plan: ScriptPlan) => void
  /** Callback при добавлении сцены */
  onAddScene?: (scene: ScriptScene) => void
  /** Callback при удалении сцены */
  onRemoveScene?: (sceneId: string) => void
  /** Callback при изменении порядка сцен */
  onReorderScenes?: (sceneIds: string[]) => void
  /** Callback при drop фрагмента */
  onDropFragment?: (fragment: ScriptFragment) => void
}

export function StoryboardEditor({
  plan,
  fragments = [],
  onPlanChange,
  onAddScene,
  onRemoveScene,
  onReorderScenes,
  onDropFragment,
}: StoryboardEditorProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    setIsDraggingOver(true)
  }

  const handleDragLeave = () => {
    setIsDraggingOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)

    try {
      const data = e.dataTransfer.getData("application/json")
      if (data) {
        const fragment = JSON.parse(data) as ScriptFragment
        onDropFragment?.(fragment)
      }
    } catch (error) {
      console.error("Failed to parse dropped fragment:", error)
    }
  }

  return (
    <div className="flex h-full flex-col" data-testid="storyboard-editor">
      {/* Header */}
      <div className="border-b p-4">
        <h3 className="text-sm font-semibold">{plan?.name || "Новый план монтажа"}</h3>
        {plan && (
          <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
            <span>Длительность: {plan.stats.totalDuration.toFixed(1)}s</span>
            <span>Сцен: {plan.stats.totalScenes}</span>
            <span>Качество: {plan.stats.qualityScore}%</span>
          </div>
        )}
      </div>

      {/* Scenes - Drop Zone */}
      <div
        className="flex-1 overflow-auto p-4"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="drop-zone"
      >
        {!plan || plan.scenes.length === 0 ? (
          <div
            className={`flex h-full items-center justify-center rounded-lg border-2 border-dashed text-sm transition-colors ${
              isDraggingOver
                ? "border-primary bg-primary/5 text-primary"
                : "border-muted-foreground/25 text-muted-foreground"
            }`}
          >
            {isDraggingOver ? "Отпустите для добавления" : "План пуст. Перетащите фрагменты из библиотеки."}
          </div>
        ) : (
          <div
            className={`space-y-2 rounded-lg transition-colors ${isDraggingOver ? "bg-primary/5" : ""}`}
          >
            {plan.scenes.map((scene, index) => {
              // Находим фрагмент для этой сцены
              const fragment = fragments.find(f => f.id === scene.fragmentId)

              return (
                <div key={scene.id}>
                  {/* Scene Card */}
                  <div
                    className="rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    data-testid={`scene-card-${scene.id}`}
                  >
                    <div className="flex gap-3 p-2">
                      {/* Thumbnail */}
                      <div className="relative w-24 shrink-0">
                        <div className="aspect-video w-full overflow-hidden rounded bg-muted">
                          {fragment?.thumbnail ? (
                            <img
                              src={fragment.thumbnail}
                              alt={`Scene ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Film className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        {/* Scene number badge */}
                        <div className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {index + 1}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex flex-1 flex-col gap-1.5">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="text-xs font-medium">
                            Сцена {index + 1} • {scene.duration.toFixed(1)}s
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveScene?.(scene.id)}
                            className="h-6 w-6 p-0"
                            data-testid={`remove-scene-${scene.id}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Quality */}
                        {fragment && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  fragment.qualityScore >= 80
                                    ? "bg-green-500"
                                    : fragment.qualityScore >= 60
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${fragment.qualityScore}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {fragment.qualityScore}%
                            </span>
                          </div>
                        )}

                        {/* Tags & Transition */}
                        <div className="flex flex-wrap gap-1 items-center">
                          {fragment?.emotions?.slice(0, 2).map(emotion => (
                            <Badge
                              key={emotion}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-4"
                            >
                              {emotion}
                            </Badge>
                          ))}
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4"
                          >
                            {scene.transition}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transition arrow between scenes */}
                  {index < plan.scenes.length - 1 && (
                    <div className="flex items-center justify-center py-1">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Оверлей с информацией о переходе в видеоплеере
 */

import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { TimelineTransition } from "@/domains/video-editing/types/timeline"
import { cn } from "@/lib/utils"

interface TransitionPlayerOverlayProps {
  transition: TimelineTransition
  progress: number // 0-1
  onClose?: () => void
  className?: string
  compact?: boolean
}

/**
 * Оверлей для отображения информации о переходе в плеере
 */
export function TransitionPlayerOverlay({
  transition,
  progress,
  onClose,
  className,
  compact = false,
}: TransitionPlayerOverlayProps) {
  if (compact) {
    return (
      <div className={cn("absolute top-4 left-4 z-10", className)}>
        <div className="bg-black/80 text-white px-3 py-2 rounded-md backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span>{transition.transitionId}</span>
            <span className="text-muted-foreground">{(progress * 100).toFixed(0)}%</span>
          </div>
          <Progress value={progress * 100} className="w-16 h-1 mt-1" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("absolute top-4 right-4 z-10", className)}>
      <Card className="bg-black/90 border-white/20 text-white backdrop-blur-sm min-w-64">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Активный переход</h3>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 text-white hover:bg-white/20">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {/* Основная информация */}
            <div>
              <div className="text-sm text-muted-foreground">Тип перехода</div>
              <div className="font-medium">{transition.transitionId}</div>
            </div>

            {/* Прогресс */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Прогресс</span>
                <span>{(progress * 100).toFixed(1)}%</span>
              </div>
              <Progress value={progress * 100} className="h-2" />
            </div>

            {/* Временные параметры */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-muted-foreground">Позиция</div>
                <div>{transition.startTime.toFixed(2)}s</div>
              </div>
              <div>
                <div className="text-muted-foreground">Длительность</div>
                <div>{transition.duration.toFixed(2)}s</div>
              </div>
            </div>

            {/* Название перехода */}
            <div>
              <div className="text-sm text-muted-foreground">Название</div>
              <div className="font-medium">{transition.name}</div>
            </div>

            {/* Параметры */}
            {transition.parameters && Object.keys(transition.parameters).length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Параметры</div>
                <div className="space-y-1 text-xs">
                  {transition.parameters.intensity && (
                    <div className="flex justify-between">
                      <span>Интенсивность:</span>
                      <span>{(transition.parameters.intensity * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  {transition.parameters.direction && (
                    <div className="flex justify-between">
                      <span>Направление:</span>
                      <span className="capitalize">{transition.parameters.direction}</span>
                    </div>
                  )}
                  {transition.parameters.blur && (
                    <div className="flex justify-between">
                      <span>Размытие:</span>
                      <span>{transition.parameters.blur.amount}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Статус */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <div className={cn("w-2 h-2 rounded-full", transition.isEnabled ? "bg-green-500" : "bg-red-500")} />
              <span className="text-xs text-muted-foreground">{transition.isEnabled ? "Включён" : "Отключён"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Мини-индикатор перехода для показа в углу плеера
 */
export function TransitionMiniIndicator({
  transition,
  progress,
  className,
}: {
  transition: TimelineTransition
  progress: number
  className?: string
}) {
  return (
    <div className={cn("absolute bottom-4 left-4 z-10", className)}>
      <div className="bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs font-medium">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span>{transition.transitionId}</span>
          <span>{(progress * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  )
}

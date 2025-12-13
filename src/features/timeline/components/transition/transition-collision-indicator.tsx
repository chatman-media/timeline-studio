/**
 * Индикатор коллизий переходов
 * Показывает предупреждения о пересекающихся переходах
 */

import { AlertCircle, AlertTriangle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { TimelineTransition } from "@/domains/video-editing/types"
import { cn } from "@/lib/utils"
import type { TransitionCollision } from "../../services/transition-collision-detector"

interface TransitionCollisionIndicatorProps {
  collisions: TransitionCollision[]
  onResolve?: (collision: TransitionCollision) => void
  className?: string
  compact?: boolean
}

/**
 * Компонент для отображения коллизий переходов
 */
export function TransitionCollisionIndicator({
  collisions,
  onResolve,
  className,
  compact = false,
}: TransitionCollisionIndicatorProps) {
  if (collisions.length === 0) return null

  // В компактном режиме показываем только иконку с тултипом
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-1", className)}>
              {collisions.some((c) => c.severity === "error") ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-warning" />
              )}
              <span className="text-sm font-medium">{collisions.length}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium">Обнаружены коллизии переходов</p>
              {collisions.slice(0, 3).map((collision, index) => (
                <p key={index} className="text-sm">
                  • {collision.message}
                </p>
              ))}
              {collisions.length > 3 && (
                <p className="text-sm text-muted-foreground">и ещё {collisions.length - 3}...</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Полный режим отображения
  return (
    <div className={cn("space-y-2", className)}>
      {collisions.map((collision, index) => (
        <Alert
          key={`${collision.transition1.id}-${collision.transition2.id}-${index}`}
          variant={collision.severity === "error" ? "destructive" : "default"}
        >
          <div className="flex items-start gap-2">
            {collision.severity === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <div className="flex-1">
              <AlertTitle>Коллизия переходов</AlertTitle>
              <AlertDescription className="mt-1">
                <p>{collision.message}</p>
                {getCollisionDetails(collision)}
              </AlertDescription>
              {onResolve && (
                <Button variant="outline" size="sm" className="mt-2" onClick={() => onResolve(collision)}>
                  Исправить
                </Button>
              )}
            </div>
          </div>
        </Alert>
      ))}
    </div>
  )
}

/**
 * Получить детали коллизии для отображения
 */
function getCollisionDetails(collision: TransitionCollision) {
  switch (collision.type) {
    case "overlap":
      return (
        <div className="mt-2 text-xs text-muted-foreground">
          <p>
            Переход 1: {collision.transition1.position.toFixed(2)}s -{" "}
            {(collision.transition1.position + collision.transition1.duration).toFixed(2)}s
          </p>
          <p>
            Переход 2: {collision.transition2.position.toFixed(2)}s -{" "}
            {(collision.transition2.position + collision.transition2.duration).toFixed(2)}s
          </p>
        </div>
      )

    case "adjacent":
      return <p className="mt-2 text-xs text-muted-foreground">Переходы расположены слишком близко друг к другу</p>

    case "clip-boundary":
      return <p className="mt-2 text-xs text-muted-foreground">Переход выходит за границы клипа</p>

    default:
      return null
  }
}

/**
 * Хелпер для создания объекта коллизии
 */
export function createCollision(
  transition1: TimelineTransition,
  transition2: TimelineTransition,
  type: TransitionCollision["type"],
  severity: TransitionCollision["severity"] = "warning",
  message?: string,
): TransitionCollision {
  const defaultMessages: Record<TransitionCollision["type"], string> = {
    overlap: "Переходы пересекаются по времени",
    adjacent: "Переходы расположены слишком близко",
    "clip-boundary": "Переход выходит за границы клипа",
  }

  return {
    transition1,
    transition2,
    type,
    severity,
    message: message || defaultMessages[type] || "Обнаружена коллизия переходов",
  }
}

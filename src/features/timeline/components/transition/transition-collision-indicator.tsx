/**
 * Индикатор коллизий переходов
 * Показывает предупреждения о пересекающихся переходах
 */

import { AlertCircle, AlertTriangle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@timeline-studio/ui/components/alert"
import { Button } from "@timeline-studio/ui/components/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@timeline-studio/ui/components/tooltip"
import type { TimelineTransition } from "@timeline-studio/core/types"
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
      <TooltipProvider data-oid="mhg7p.4">
        <Tooltip data-oid="_0uwbmw">
          <TooltipTrigger asChild data-oid="-xfqoi3">
            <div className={cn("flex items-center gap-1", className)} data-oid="5x5xh_g">
              {collisions.some((c) => c.severity === "error") ? (
                <AlertCircle className="h-4 w-4 text-destructive" data-oid="b_k10qq" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-warning" data-oid=".pk38bu" />
              )}
              <span className="text-sm font-medium" data-oid="p1elf00">
                {collisions.length}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs" data-oid="4t82lgv">
            <div className="space-y-2" data-oid="fajmpca">
              <p className="font-medium" data-oid="f4l_p_r">
                Обнаружены коллизии переходов
              </p>
              {collisions.slice(0, 3).map((collision, index) => (
                <p key={index} className="text-sm" data-oid="4pe4yn0">
                  • {collision.message}
                </p>
              ))}
              {collisions.length > 3 && (
                <p className="text-sm text-muted-foreground" data-oid="e8rwken">
                  и ещё {collisions.length - 3}...
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Полный режим отображения
  return (
    <div className={cn("space-y-2", className)} data-oid="pdftau9">
      {collisions.map((collision, index) => (
        <Alert
          key={`${collision.transition1.id}-${collision.transition2.id}-${index}`}
          variant={collision.severity === "error" ? "destructive" : "default"}
          data-oid="ktn9aul"
        >
          <div className="flex items-start gap-2" data-oid="m42d2hb">
            {collision.severity === "error" ? (
              <AlertCircle className="h-4 w-4" data-oid="o7ljlsj" />
            ) : (
              <AlertTriangle className="h-4 w-4" data-oid="n_wg4dr" />
            )}
            <div className="flex-1" data-oid="3:lzhmc">
              <AlertTitle data-oid="26z59f:">Коллизия переходов</AlertTitle>
              <AlertDescription className="mt-1" data-oid="-ii3wpl">
                <p data-oid="8_ite_t">{collision.message}</p>
                {getCollisionDetails(collision)}
              </AlertDescription>
              {onResolve && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => onResolve(collision)}
                  data-oid="s4ysdco"
                >
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
        <div className="mt-2 text-xs text-muted-foreground" data-oid="dx-63on">
          <p data-oid="pw19gr8">
            Переход 1: {collision.transition1.position.toFixed(2)}s -{" "}
            {(collision.transition1.position + collision.transition1.duration).toFixed(2)}s
          </p>
          <p data-oid="baz180o">
            Переход 2: {collision.transition2.position.toFixed(2)}s -{" "}
            {(collision.transition2.position + collision.transition2.duration).toFixed(2)}s
          </p>
        </div>
      )

    case "adjacent":
      return (
        <p className="mt-2 text-xs text-muted-foreground" data-oid="18i8i6b">
          Переходы расположены слишком близко друг к другу
        </p>
      )

    case "clip-boundary":
      return (
        <p className="mt-2 text-xs text-muted-foreground" data-oid="5sdp_g7">
          Переход выходит за границы клипа
        </p>
      )

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

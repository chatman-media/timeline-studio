/**
 * Оверлей с информацией о переходе в видеоплеере
 */

import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { TimelineTransition } from "@timeline-studio/core/types"
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
      <div className={cn("absolute top-4 left-4 z-10", className)} data-oid="2vlwgnp">
        <div className="bg-black/80 text-white px-3 py-2 rounded-md backdrop-blur-sm" data-oid=".kmmwf7">
          <div className="flex items-center gap-2 text-sm" data-oid="t:apqdd">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" data-oid="z-1y3f7" />
            <span data-oid="mc2cqgm">{transition.transitionId}</span>
            <span className="text-muted-foreground" data-oid="f1px0qh">
              {(progress * 100).toFixed(0)}%
            </span>
          </div>
          <Progress value={progress * 100} className="w-16 h-1 mt-1" data-oid=":z2qvmj" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("absolute top-4 right-4 z-10", className)} data-oid="dw_6v1z">
      <Card className="bg-black/90 border-white/20 text-white backdrop-blur-sm min-w-64" data-oid="66n9.ng">
        <CardContent className="p-4" data-oid="5loa-ct">
          <div className="flex items-center justify-between mb-3" data-oid="nczq95z">
            <h3 className="font-semibold" data-oid="lzmqu4c">
              Активный переход
            </h3>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                data-oid="a8umo7_"
              >
                <X className="h-4 w-4" data-oid="wuni0wg" />
              </Button>
            )}
          </div>

          <div className="space-y-3" data-oid="7m7:_.e">
            {/* Основная информация */}
            <div data-oid="o7k1d28">
              <div className="text-sm text-muted-foreground" data-oid="c60qtsu">
                Тип перехода
              </div>
              <div className="font-medium" data-oid="3y58guc">
                {transition.transitionId}
              </div>
            </div>

            {/* Прогресс */}
            <div data-oid="nu1hx27">
              <div className="flex justify-between text-sm mb-1" data-oid="56jaixb">
                <span data-oid="3pezuon">Прогресс</span>
                <span data-oid="jmr_3pu">{(progress * 100).toFixed(1)}%</span>
              </div>
              <Progress value={progress * 100} className="h-2" data-oid="kd674vx" />
            </div>

            {/* Временные параметры */}
            <div className="grid grid-cols-2 gap-2 text-sm" data-oid="qxmrk9m">
              <div data-oid="sz:hnce">
                <div className="text-muted-foreground" data-oid="1ixgj:b">
                  Позиция
                </div>
                <div data-oid="aqr4soe">{transition.startTime?.toFixed(2)}s</div>
              </div>
              <div data-oid="z:v-j:j">
                <div className="text-muted-foreground" data-oid="ttz6:y0">
                  Длительность
                </div>
                <div data-oid="_u719dj">{transition.duration.toFixed(2)}s</div>
              </div>
            </div>

            {/* Название перехода */}
            <div data-oid="eq:4wm5">
              <div className="text-sm text-muted-foreground" data-oid="b6t-2cm">
                Название
              </div>
              <div className="font-medium" data-oid="xg.355l">
                {transition.name}
              </div>
            </div>

            {/* Параметры */}
            {transition.parameters && Object.keys(transition.parameters).length > 0 && (
              <div data-oid="fyiu627">
                <div className="text-sm text-muted-foreground mb-1" data-oid="8lhl9qv">
                  Параметры
                </div>
                <div className="space-y-1 text-xs" data-oid="rdw55nv">
                  {transition.parameters.intensity && (
                    <div className="flex justify-between" data-oid="n9bof8k">
                      <span data-oid="w1-rk-9">Интенсивность:</span>
                      <span data-oid="fqvb-hy">{(transition.parameters.intensity * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  {transition.parameters.direction && (
                    <div className="flex justify-between" data-oid="-.2gfe9">
                      <span data-oid="srycs:k">Направление:</span>
                      <span className="capitalize" data-oid="ghvkxl1">
                        {transition.parameters.direction}
                      </span>
                    </div>
                  )}
                  {transition.parameters.blur && (
                    <div className="flex justify-between" data-oid="02p1.bs">
                      <span data-oid="v7fmi:q">Размытие:</span>
                      <span data-oid="j4y9955">{transition.parameters.blur.amount}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Статус */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10" data-oid="jmub9l_">
              <div
                className={cn("w-2 h-2 rounded-full", transition.isEnabled ? "bg-green-500" : "bg-red-500")}
                data-oid="b65ih9r"
              />

              <span className="text-xs text-muted-foreground" data-oid="rvgbha.">
                {transition.isEnabled ? "Включён" : "Отключён"}
              </span>
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
    <div className={cn("absolute bottom-4 left-4 z-10", className)} data-oid="5r--y-0">
      <div className="bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs font-medium" data-oid="40d4iix">
        <div className="flex items-center gap-2" data-oid="y49u92-">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" data-oid="2m6923l" />
          <span data-oid="rm93arb">{transition.transitionId}</span>
          <span data-oid="8l14gyo">{(progress * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  )
}

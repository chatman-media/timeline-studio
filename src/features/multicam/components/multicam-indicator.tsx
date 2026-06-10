/**
 * Индикатор мультикамерного режима для плеера
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Camera } from "lucide-react"
import { cn } from "@/lib/utils"

interface MulticamIndicatorProps {
  /**
   * Текущий индекс камеры
   */
  currentAngle: number

  /**
   * Общее количество углов
   */
  totalAngles: number

  /**
   * Имя текущей камеры
   */
  angleName?: string

  /**
   * Класс для стилизации
   */
  className?: string
}

export function MulticamIndicator({ currentAngle, totalAngles, angleName, className }: MulticamIndicatorProps) {
  if (totalAngles <= 1) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-2", className)} data-oid="fjcbcan">
      <Camera className="w-4 h-4 text-muted-foreground" data-oid="u4u:_fi" />
      <Badge variant="secondary" className="gap-1" data-oid="m4uruul">
        <span className="font-bold" data-oid="rj6ogpf">
          {currentAngle + 1}
        </span>
        <span className="text-muted-foreground" data-oid="4kdr6zp">
          /
        </span>
        <span data-oid="c-1b1-v">{totalAngles}</span>
      </Badge>
      {angleName && (
        <span className="text-sm text-muted-foreground" data-oid="ca.otgy">
          {angleName}
        </span>
      )}
    </div>
  )
}

/**
 * Компонент отображения статистики кеша эффектов
 */

import { memo } from "react"
import { Card } from "@timeline-studio/ui/components/card"
import { Progress } from "@timeline-studio/ui/components/progress"
import { cn } from "@/lib/utils"

interface CacheStatsDisplayProps {
  stats: {
    entries: number
    sizeMB: number
    hitRate: number
  }
  className?: string
  compact?: boolean
}

export const CacheStatsDisplay = memo(function CacheStatsDisplay({
  stats,
  className,
  compact = false,
}: CacheStatsDisplayProps) {
  const hitRatePercent = Math.round(stats.hitRate * 100)
  const hitRateColor = hitRatePercent > 80 ? "text-green-500" : hitRatePercent > 50 ? "text-yellow-500" : "text-red-500"

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)} data-oid="_sd96ao">
        <span data-oid="jfjfwyu">Cache: {stats.entries}</span>
        <span data-oid="s73u2it">•</span>
        <span data-oid="ird-v.f">{stats.sizeMB.toFixed(1)}MB</span>
        <span data-oid="nl:37qc">•</span>
        <span className={hitRateColor} data-oid="hgi_b.k">
          {hitRatePercent}% hit
        </span>
      </div>
    )
  }

  return (
    <Card className={cn("p-4", className)} data-oid="-pp24q4">
      <h3 className="text-sm font-medium mb-3" data-oid="8ni3oa4">
        Cache Performance
      </h3>

      <div className="space-y-3" data-oid="b16m.oh">
        <div data-oid=":ty:f9c">
          <div className="flex justify-between text-sm mb-1" data-oid="96j4woc">
            <span className="text-muted-foreground" data-oid="d7oxsx5">
              Cached Frames
            </span>
            <span className="font-medium" data-oid=".qpcpfo">
              {stats.entries}
            </span>
          </div>
        </div>

        <div data-oid="pikbwia">
          <div className="flex justify-between text-sm mb-1" data-oid="02w587z">
            <span className="text-muted-foreground" data-oid="ke4rt7w">
              Memory Usage
            </span>
            <span className="font-medium" data-oid="ajrr1v:">
              {stats.sizeMB.toFixed(1)} MB
            </span>
          </div>
        </div>

        <div data-oid="1u-zwa7">
          <div className="flex justify-between text-sm mb-1" data-oid="f-yt4t4">
            <span className="text-muted-foreground" data-oid="2c8y_mw">
              Hit Rate
            </span>
            <span className={cn("font-medium", hitRateColor)} data-oid="ezhm:-e">
              {hitRatePercent}%
            </span>
          </div>
          <Progress value={hitRatePercent} className="h-2" data-oid="w:_7iwi" />
          {hitRatePercent < 50 && (
            <p className="text-xs text-muted-foreground mt-1" data-oid="jkyzw9:">
              Low hit rate - consider prefetching frames
            </p>
          )}
        </div>
      </div>
    </Card>
  )
})

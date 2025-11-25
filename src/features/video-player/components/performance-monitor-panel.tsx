/**
 * Performance Monitor Panel
 * Отображает метрики производительности видеоплеера в реальном времени
 */

import { Activity, AlertCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePerformanceMonitor } from "../hooks/use-performance-monitor"

export interface PerformanceMonitorPanelProps {
  /** Включить авто-обновление метрик */
  autoRefresh?: boolean
  /** Интервал обновления (ms) */
  refreshInterval?: number
  /** Показать развернутую информацию по умолчанию */
  defaultExpanded?: boolean
}

export function PerformanceMonitorPanel({
  autoRefresh = true,
  refreshInterval = 1000,
  defaultExpanded = false,
}: PerformanceMonitorPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const { metrics, health, commandTypeStats, reset } = usePerformanceMonitor({
    autoRefresh,
    refreshInterval,
  })

  // Форматирование числа с фиксированной точностью
  const formatNumber = (value: number, precision: number = 2) => {
    return value.toFixed(precision)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Performance Monitor
          {!health.isHealthy && (
            <Badge variant="destructive" className="ml-2">
              <AlertCircle className="h-3 w-3 mr-1" />
              Issues
            </Badge>
          )}
          {health.warnings.length > 0 && health.isHealthy && (
            <Badge variant="secondary" className="ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Warnings
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Основные метрики - всегда видны */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-muted-foreground">Avg Sync Time</div>
            <div className="text-2xl font-bold">{formatNumber(metrics.avgSyncTime)}ms</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">P95 Latency</div>
            <div className="text-2xl font-bold">{formatNumber(metrics.p95Latency)}ms</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Queue Size</div>
            <div className="text-2xl font-bold">{metrics.commandQueueSize}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Commands</div>
            <div className="text-2xl font-bold">{metrics.totalCommands}</div>
          </div>
        </div>

        {/* Детальная информация - показывается при разворачивании */}
        {isExpanded && (
          <div className="space-y-4 border-t pt-4">
            {/* Дополнительные метрики */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">P99 Latency</div>
                <div className="text-lg font-semibold">{formatNumber(metrics.p99Latency)}ms</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Sync Frequency</div>
                <div className="text-lg font-semibold">{formatNumber(metrics.syncFrequency)} ops/s</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Failed Commands</div>
                <div className="text-lg font-semibold text-destructive">{metrics.failedCommands}</div>
              </div>
            </div>

            {/* Health Status */}
            {(health.issues.length > 0 || health.warnings.length > 0) && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Health Status</div>
                {health.issues.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Issues:
                    </div>
                    {health.issues.map((issue, index) => (
                      <div key={index} className="text-xs text-destructive ml-4">
                        • {issue}
                      </div>
                    ))}
                  </div>
                )}
                {health.warnings.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-yellow-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Warnings:
                    </div>
                    {health.warnings.map((warning, index) => (
                      <div key={index} className="text-xs text-yellow-600 ml-4">
                        • {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Command Type Statistics */}
            {Object.keys(commandTypeStats).length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Command Statistics</div>
                <div className="space-y-2">
                  {Object.entries(commandTypeStats).map(([commandType, stats]) => (
                    <div key={commandType} className="grid grid-cols-4 gap-2 text-xs">
                      <div className="font-medium">{commandType}</div>
                      <div className="text-muted-foreground">Count: {stats.count}</div>
                      <div className="text-muted-foreground">Avg: {formatNumber(stats.avgDuration)}ms</div>
                      <div
                        className={
                          stats.failureRate > 0.1
                            ? "text-destructive"
                            : stats.failureRate > 0
                              ? "text-yellow-600"
                              : "text-muted-foreground"
                        }
                      >
                        Fail: {formatNumber(stats.failureRate * 100, 1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Error */}
            {metrics.lastError && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-destructive">Last Error</div>
                <div className="text-xs text-muted-foreground font-mono bg-destructive/10 p-2 rounded">
                  {metrics.lastError}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

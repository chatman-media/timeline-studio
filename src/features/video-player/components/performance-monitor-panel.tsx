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
    <Card className="w-full max-w-2xl" data-oid="t3271v9">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" data-oid="e.vh32m">
        <CardTitle className="text-sm font-medium flex items-center gap-2" data-oid=".z3cfw0">
          <Activity className="h-4 w-4" data-oid="-_sqi19" />
          Performance Monitor
          {!health.isHealthy && (
            <Badge variant="destructive" className="ml-2" data-oid="_buxrsr">
              <AlertCircle className="h-3 w-3 mr-1" data-oid="gi7.08r" />
              Issues
            </Badge>
          )}
          {health.warnings.length > 0 && health.isHealthy && (
            <Badge variant="secondary" className="ml-2" data-oid="709:_ur">
              <AlertTriangle className="h-3 w-3 mr-1" data-oid="xmxw5i5" />
              Warnings
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2" data-oid="mnej8wc">
          <Button variant="ghost" size="sm" onClick={reset} data-oid="-5sf.ep">
            Reset
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse" : "Expand"}
            data-oid="ekcfrg8"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" data-oid="aqtyuns" />
            ) : (
              <ChevronDown className="h-4 w-4" data-oid="3ie-g-8" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent data-oid="vwkx0f0">
        {/* Основные метрики - всегда видны */}
        <div className="grid grid-cols-2 gap-4 mb-4" data-oid="n7_r-8m">
          <div data-oid="yhjw49f">
            <div className="text-xs text-muted-foreground" data-oid="ph77d8k">
              Avg Sync Time
            </div>
            <div className="text-2xl font-bold" data-oid="7rxly6v">
              {formatNumber(metrics.avgSyncTime)}ms
            </div>
          </div>
          <div data-oid="nl:b84a">
            <div className="text-xs text-muted-foreground" data-oid="01n40fh">
              P95 Latency
            </div>
            <div className="text-2xl font-bold" data-oid="v2j_z11">
              {formatNumber(metrics.p95Latency)}ms
            </div>
          </div>
          <div data-oid="gbaaij4">
            <div className="text-xs text-muted-foreground" data-oid="0ubtcrd">
              Queue Size
            </div>
            <div className="text-2xl font-bold" data-oid="pru8zcj">
              {metrics.commandQueueSize}
            </div>
          </div>
          <div data-oid="dy21uno">
            <div className="text-xs text-muted-foreground" data-oid="4xvcr7d">
              Total Commands
            </div>
            <div className="text-2xl font-bold" data-oid="2szh6du">
              {metrics.totalCommands}
            </div>
          </div>
        </div>

        {/* Детальная информация - показывается при разворачивании */}
        {isExpanded && (
          <div className="space-y-4 border-t pt-4" data-oid="w:f713w">
            {/* Дополнительные метрики */}
            <div className="grid grid-cols-3 gap-4" data-oid="5u9x8n_">
              <div data-oid="xa4ukz6">
                <div className="text-xs text-muted-foreground" data-oid="5:.89fb">
                  P99 Latency
                </div>
                <div className="text-lg font-semibold" data-oid="rg83mz9">
                  {formatNumber(metrics.p99Latency)}ms
                </div>
              </div>
              <div data-oid="mfo:vcl">
                <div className="text-xs text-muted-foreground" data-oid=":s1g2uu">
                  Sync Frequency
                </div>
                <div className="text-lg font-semibold" data-oid="1s-6jtp">
                  {formatNumber(metrics.syncFrequency)} ops/s
                </div>
              </div>
              <div data-oid="8bymx.1">
                <div className="text-xs text-muted-foreground" data-oid="gev0mhk">
                  Failed Commands
                </div>
                <div className="text-lg font-semibold text-destructive" data-oid="esq:fjz">
                  {metrics.failedCommands}
                </div>
              </div>
            </div>

            {/* Health Status */}
            {(health.issues.length > 0 || health.warnings.length > 0) && (
              <div className="space-y-2" data-oid="csoy6pz">
                <div className="text-sm font-medium" data-oid="2sc7rbd">
                  Health Status
                </div>
                {health.issues.length > 0 && (
                  <div className="space-y-1" data-oid="nz34yuw">
                    <div className="text-xs font-medium text-destructive flex items-center gap-1" data-oid=":-x9u8-">
                      <AlertCircle className="h-3 w-3" data-oid=".61lvos" />
                      Issues:
                    </div>
                    {health.issues.map((issue, index) => (
                      <div key={index} className="text-xs text-destructive ml-4" data-oid="k98mqdp">
                        • {issue}
                      </div>
                    ))}
                  </div>
                )}
                {health.warnings.length > 0 && (
                  <div className="space-y-1" data-oid=".x3us-:">
                    <div className="text-xs font-medium text-yellow-600 flex items-center gap-1" data-oid="qfq2wex">
                      <AlertTriangle className="h-3 w-3" data-oid="51x8g4b" />
                      Warnings:
                    </div>
                    {health.warnings.map((warning, index) => (
                      <div key={index} className="text-xs text-yellow-600 ml-4" data-oid="jjnsm4k">
                        • {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Command Type Statistics */}
            {Object.keys(commandTypeStats).length > 0 && (
              <div className="space-y-2" data-oid="od718x2">
                <div className="text-sm font-medium" data-oid="_7xig3x">
                  Command Statistics
                </div>
                <div className="space-y-2" data-oid="0-2z740">
                  {Object.entries(commandTypeStats).map(([commandType, stats]) => (
                    <div key={commandType} className="grid grid-cols-4 gap-2 text-xs" data-oid="26g8l38">
                      <div className="font-medium" data-oid="5h9qaud">
                        {commandType}
                      </div>
                      <div className="text-muted-foreground" data-oid="s6yciu_">
                        Count: {stats.count}
                      </div>
                      <div className="text-muted-foreground" data-oid="1zkg2g2">
                        Avg: {formatNumber(stats.avgDuration)}ms
                      </div>
                      <div
                        className={
                          stats.failureRate > 0.1
                            ? "text-destructive"
                            : stats.failureRate > 0
                              ? "text-yellow-600"
                              : "text-muted-foreground"
                        }
                        data-oid="3z0qlcf"
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
              <div className="space-y-1" data-oid="p-yqc5i">
                <div className="text-sm font-medium text-destructive" data-oid="conqb0n">
                  Last Error
                </div>
                <div
                  className="text-xs text-muted-foreground font-mono bg-destructive/10 p-2 rounded"
                  data-oid="4aktnb_"
                >
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

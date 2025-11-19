"use client"

/**
 * PerformanceMetrics Component
 * Отображает метрики производительности системы и анализа
 */

import { Activity, Clock, Cpu, HardDrive, Zap } from "lucide-react"
import { useMemo } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export interface PerformanceMetricsData {
  // Системные метрики
  cpu?: {
    usage: number // 0-100
    cores: number
  }
  memory?: {
    used: number // в MB
    total: number // в MB
  }
  gpu?: {
    usage: number // 0-100
    name?: string
  }
  // Метрики анализа
  analysis?: {
    filesProcessed: number
    totalFiles: number
    avgProcessingTime: number // в секундах
    totalProcessingTime: number // в секундах
    eta?: number // в секундах (estimated time remaining)
  }
}

interface PerformanceMetricsProps {
  data: PerformanceMetricsData
  className?: string
  compact?: boolean
}

export function PerformanceMetrics({ data, className, compact = false }: PerformanceMetricsProps) {
  // Форматирование времени
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  // Форматирование памяти
  const formatMemory = (mb: number): string => {
    if (mb < 1024) return `${Math.round(mb)} MB`
    return `${(mb / 1024).toFixed(1)} GB`
  }

  // Расчет процента использования памяти
  const memoryUsagePercent = useMemo(() => {
    if (!data.memory) return 0
    return (data.memory.used / data.memory.total) * 100
  }, [data.memory])

  // Расчет прогресса анализа
  const analysisProgress = useMemo(() => {
    if (!data.analysis) return 0
    return (data.analysis.filesProcessed / data.analysis.totalFiles) * 100
  }, [data.analysis])

  if (compact) {
    return (
      <div className={cn("flex items-center gap-4 text-sm", className)}>
        {data.cpu && (
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{Math.round(data.cpu.usage)}%</span>
          </div>
        )}
        {data.memory && (
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {formatMemory(data.memory.used)} / {formatMemory(data.memory.total)}
            </span>
          </div>
        )}
        {data.analysis?.eta && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">ETA: {formatTime(data.analysis.eta)}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {/* CPU Usage */}
      {data.cpu && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              CPU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{Math.round(data.cpu.usage)}%</span>
                <span className="text-xs text-muted-foreground">{data.cpu.cores} cores</span>
              </div>
              <Progress value={data.cpu.usage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {data.cpu.usage < 50
                  ? "Низкая нагрузка"
                  : data.cpu.usage < 80
                    ? "Средняя нагрузка"
                    : "Высокая нагрузка"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory Usage */}
      {data.memory && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{Math.round(memoryUsagePercent)}%</span>
                <span className="text-xs text-muted-foreground">{formatMemory(data.memory.used)}</span>
              </div>
              <Progress value={memoryUsagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground">{formatMemory(data.memory.total)} total</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GPU Usage */}
      {data.gpu && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              GPU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{Math.round(data.gpu.usage)}%</span>
                {data.gpu.usage === 0 && <span className="text-xs text-muted-foreground">Не используется</span>}
              </div>
              <Progress value={data.gpu.usage} className="h-2" />
              {data.gpu.name && <p className="text-xs text-muted-foreground truncate">{data.gpu.name}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Performance */}
      {data.analysis && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Анализ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{Math.round(analysisProgress)}%</span>
                <span className="text-xs text-muted-foreground">
                  {data.analysis.filesProcessed}/{data.analysis.totalFiles}
                </span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Avg: {formatTime(data.analysis.avgProcessingTime)}</span>
                {data.analysis.eta ? <span>ETA: {formatTime(data.analysis.eta)}</span> : null}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Detailed Performance Metrics Card
 * Расширенная версия с детальными метриками
 */
interface DetailedPerformanceMetricsProps {
  data: PerformanceMetricsData
  className?: string
}

export function DetailedPerformanceMetrics({ data, className }: DetailedPerformanceMetricsProps) {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const formatMemory = (mb: number): string => {
    if (mb < 1024) return `${Math.round(mb)} MB`
    return `${(mb / 1024).toFixed(1)} GB`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
        <CardDescription>Системные ресурсы и производительность анализа</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Resources */}
        {(data.cpu || data.memory || data.gpu) && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase">Системные ресурсы</h4>
            <div className="space-y-3">
              {data.cpu && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      CPU ({data.cpu.cores} cores)
                    </span>
                    <span className="font-medium">{Math.round(data.cpu.usage)}%</span>
                  </div>
                  <Progress value={data.cpu.usage} className="h-2" />
                </div>
              )}
              {data.memory && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Memory
                    </span>
                    <span className="font-medium">
                      {formatMemory(data.memory.used)} / {formatMemory(data.memory.total)}
                    </span>
                  </div>
                  <Progress value={(data.memory.used / data.memory.total) * 100} className="h-2" />
                </div>
              )}
              {data.gpu && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      GPU {data.gpu.name ? `(${data.gpu.name})` : ""}
                    </span>
                    <span className="font-medium">
                      {data.gpu.usage === 0 ? "Не используется" : `${Math.round(data.gpu.usage)}%`}
                    </span>
                  </div>
                  <Progress value={data.gpu.usage} className="h-2" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analysis Performance */}
        {data.analysis && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase">Производительность анализа</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Обработано файлов</p>
                <p className="text-lg font-bold">
                  {data.analysis.filesProcessed} / {data.analysis.totalFiles}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Среднее время</p>
                <p className="text-lg font-bold">{formatTime(data.analysis.avgProcessingTime)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Общее время</p>
                <p className="text-lg font-bold">{formatTime(data.analysis.totalProcessingTime)}</p>
              </div>
              {data.analysis.eta && (
                <div>
                  <p className="text-xs text-muted-foreground">Осталось времени</p>
                  <p className="text-lg font-bold flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatTime(data.analysis.eta)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

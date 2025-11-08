import { Database, RefreshCw, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { backendAI } from "@/shared/services/ai/backend-ai-service"
import type { CacheStats } from "@/types/generated/tauri-bindings"

const logger = createLogger({ module: "CacheStatsPanel" })

interface CacheStatsPanelProps {
  className?: string
  compact?: boolean
}

export function CacheStatsPanel({ className, compact = false }: CacheStatsPanelProps) {
  const { t } = useTranslation()
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [cleaning, setCleaning] = useState(false)

  const loadStats = async () => {
    try {
      setLoading(true)
      const cacheStats = await backendAI.getCacheStats()
      setStats(cacheStats)
    } catch (error) {
      logger.error("Failed to load cache stats:", { error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStats()
  }, [])

  const handleClearCache = async () => {
    try {
      setClearing(true)
      const cleared = await backendAI.clearCache()
      logger.info("Cache cleared:", { cleared })
      await loadStats()
    } catch (error) {
      logger.error("Failed to clear cache:", { error: String(error) })
    } finally {
      setClearing(false)
    }
  }

  const handleCleanupExpired = async () => {
    try {
      setCleaning(true)
      const cleaned = await backendAI.cleanupExpiredCache()
      logger.info("Expired cache cleaned:", { cleaned })
      await loadStats()
    } catch (error) {
      logger.error("Failed to cleanup expired cache:", { error: String(error) })
    } finally {
      setCleaning(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const hitRate = stats.total_entries > 0 ? ((stats.total_hits / stats.total_entries) * 100).toFixed(1) : "0.0"

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Database className="h-4 w-4" />
        <span>
          {t("ai.cache.entries", "Кэш")}: {stats.total_entries}
        </span>
        <span>
          {t("ai.cache.hits", "Попадания")}: {stats.total_hits}
        </span>
        {stats.expired_entries > 0 && (
          <span className="text-amber-500">
            {t("ai.cache.expired", "Устарело")}: {stats.expired_entries}
          </span>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={loadStats} disabled={loading}>
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("ai.cache.refresh", "Обновить статистику")}</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {t("ai.cache.title", "Кэш AI запросов")}
        </CardTitle>
        <CardDescription>
          {stats.enabled
            ? t("ai.cache.description", "Автоматическое кэширование ответов от AI")
            : t("ai.cache.disabled", "Кэширование отключено")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t("ai.cache.totalEntries", "Всего записей")}</p>
            <p className="text-2xl font-bold">{stats.total_entries}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t("ai.cache.totalHits", "Попадания")}</p>
            <p className="text-2xl font-bold">{stats.total_hits}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t("ai.cache.hitRate", "Hit Rate")}</p>
            <p className="text-2xl font-bold">{hitRate}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t("ai.cache.maxEntries", "Макс. записей")}</p>
            <p className="text-2xl font-bold">{stats.max_entries}</p>
          </div>
        </div>

        {/* Expired Entries Warning */}
        {stats.expired_entries > 0 && (
          <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {t("ai.cache.expiredWarning", "Устаревших записей: {{count}}", {
                count: stats.expired_entries,
              })}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={loadStats} disabled={loading} className="flex-1">
                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                {t("ai.cache.refresh", "Обновить")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("ai.cache.refreshTooltip", "Обновить статистику кэша")}</TooltipContent>
          </Tooltip>

          {stats.expired_entries > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCleanupExpired}
                  disabled={cleaning}
                  className="flex-1"
                >
                  <RefreshCw className={cn("mr-2 h-4 w-4", cleaning && "animate-spin")} />
                  {t("ai.cache.cleanup", "Очистить устаревшие")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("ai.cache.cleanupTooltip", "Удалить устаревшие записи из кэша")}</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearCache}
                disabled={clearing || stats.total_entries === 0}
                className="flex-1"
              >
                <Trash2 className={cn("mr-2 h-4 w-4", clearing && "animate-spin")} />
                {t("ai.cache.clear", "Очистить весь кэш")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("ai.cache.clearTooltip", "Удалить все записи из кэша")}</TooltipContent>
          </Tooltip>
        </div>

        {/* Cache Info */}
        <div className="text-xs text-muted-foreground">
          <p>
            {t(
              "ai.cache.info",
              "Кэш хранится локально в SQLite базе данных. Записи автоматически удаляются через 24 часа.",
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

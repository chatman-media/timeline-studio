import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@timeline-studio/ui/components/tooltip"
import { Database, RefreshCw, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { backendAI } from "@/features/ai-chat/services/backend-ai"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"

// CacheStats type is not exported from tauri-bindings yet, using placeholder
type CacheStats = {
  enabled: boolean
  total_entries: number
  total_hits: number
  expired_entries: number
  max_entries: number
}

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
      logger.error("Failed to cleanup expired cache:", {
        error: String(error),
      })
    } finally {
      setCleaning(false)
    }
  }

  if (loading) {
    return (
      <Card className={className} data-oid=":5:tgim">
        <CardContent className="pt-6" data-oid="lub8_2m">
          <div className="flex items-center justify-center" data-oid="yvqmrwk">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" data-oid="re9c.wz" />
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
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)} data-oid="-9.ehe2">
        <Database className="h-4 w-4" data-oid="ekale63" />
        <span data-oid=":8kiasz">
          {t("ai.cache.entries", "Кэш")}: {stats.total_entries}
        </span>
        <span data-oid="era0rxc">
          {t("ai.cache.hits", "Попадания")}: {stats.total_hits}
        </span>
        {stats.expired_entries > 0 && (
          <span className="text-amber-500" data-oid="ajpx3y9">
            {t("ai.cache.expired", "Устарело")}: {stats.expired_entries}
          </span>
        )}
        <Tooltip data-oid="6u8vios">
          <TooltipTrigger asChild data-oid="sbo0y-v">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={loadStats}
              disabled={loading}
              data-oid="v0cny50"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} data-oid="s289-to" />
            </Button>
          </TooltipTrigger>
          <TooltipContent data-oid="pqo9g8r">{t("ai.cache.refresh", "Обновить статистику")}</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <Card className={className} data-oid="4bd4het">
      <CardHeader data-oid="74:ymqu">
        <CardTitle className="flex items-center gap-2" data-oid="9w8rfu-">
          <Database className="h-5 w-5" data-oid="0vbtf8g" />
          {t("ai.cache.title", "Кэш AI запросов")}
        </CardTitle>
        <CardDescription data-oid="_29-b63">
          {stats.enabled
            ? t("ai.cache.description", "Автоматическое кэширование ответов от AI")
            : t("ai.cache.disabled", "Кэширование отключено")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4" data-oid="3pjq3ux">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4" data-oid="pbwxi3s">
          <div className="space-y-1" data-oid="s:jc5_l">
            <p className="text-sm font-medium text-muted-foreground" data-oid="wq6n98c">
              {t("ai.cache.totalEntries", "Всего записей")}
            </p>
            <p className="text-2xl font-bold" data-oid="i-522v0">
              {stats.total_entries}
            </p>
          </div>
          <div className="space-y-1" data-oid="oc.u2nh">
            <p className="text-sm font-medium text-muted-foreground" data-oid="u7.4_so">
              {t("ai.cache.totalHits", "Попадания")}
            </p>
            <p className="text-2xl font-bold" data-oid="g8ejez5">
              {stats.total_hits}
            </p>
          </div>
          <div className="space-y-1" data-oid="w4zdjg0">
            <p className="text-sm font-medium text-muted-foreground" data-oid="g86z7hd">
              {t("ai.cache.hitRate", "Hit Rate")}
            </p>
            <p className="text-2xl font-bold" data-oid="ifp_j44">
              {hitRate}%
            </p>
          </div>
          <div className="space-y-1" data-oid="rdmw-x8">
            <p className="text-sm font-medium text-muted-foreground" data-oid=".tj_qy6">
              {t("ai.cache.maxEntries", "Макс. записей")}
            </p>
            <p className="text-2xl font-bold" data-oid="o.0iubp">
              {stats.max_entries}
            </p>
          </div>
        </div>

        {/* Expired Entries Warning */}
        {stats.expired_entries > 0 && (
          <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3" data-oid="8:0bcml">
            <p className="text-sm text-amber-600 dark:text-amber-400" data-oid="zgd4sfg">
              {t("ai.cache.expiredWarning", "Устаревших записей: {{count}}", {
                count: stats.expired_entries,
              })}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2" data-oid="3zsva.d">
          <Tooltip data-oid="k9h2aa8">
            <TooltipTrigger asChild data-oid="syr3b6k">
              <Button
                variant="outline"
                size="sm"
                onClick={loadStats}
                disabled={loading}
                className="flex-1"
                data-oid="g-6ux1u"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} data-oid="a24r3qi" />

                {t("ai.cache.refresh", "Обновить")}
              </Button>
            </TooltipTrigger>
            <TooltipContent data-oid="zaz3-2m">
              {t("ai.cache.refreshTooltip", "Обновить статистику кэша")}
            </TooltipContent>
          </Tooltip>

          {stats.expired_entries > 0 && (
            <Tooltip data-oid="x:bathe">
              <TooltipTrigger asChild data-oid="x7:::kl">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCleanupExpired}
                  disabled={cleaning}
                  className="flex-1"
                  data-oid="dium.z7"
                >
                  <RefreshCw className={cn("mr-2 h-4 w-4", cleaning && "animate-spin")} data-oid="6b6rmd0" />

                  {t("ai.cache.cleanup", "Очистить устаревшие")}
                </Button>
              </TooltipTrigger>
              <TooltipContent data-oid="am9qa98">
                {t("ai.cache.cleanupTooltip", "Удалить устаревшие записи из кэша")}
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip data-oid="_g7ec2n">
            <TooltipTrigger asChild data-oid="r1t6b-r">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearCache}
                disabled={clearing || stats.total_entries === 0}
                className="flex-1"
                data-oid="hd.2dfp"
              >
                <Trash2 className={cn("mr-2 h-4 w-4", clearing && "animate-spin")} data-oid="308jt8d" />

                {t("ai.cache.clear", "Очистить весь кэш")}
              </Button>
            </TooltipTrigger>
            <TooltipContent data-oid="i3g1p7p">
              {t("ai.cache.clearTooltip", "Удалить все записи из кэша")}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Cache Info */}
        <div className="text-xs text-muted-foreground" data-oid="lc0l36x">
          <p data-oid="f7iq888">
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

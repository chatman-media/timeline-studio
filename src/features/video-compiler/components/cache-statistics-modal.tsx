import { Activity, HardDrive, Loader2, RefreshCw, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import { formatCacheRatio, useCacheStats } from "../hooks/use-cache-stats"

/**
 * Модальное окно статистики кэша
 */
export function CacheStatisticsModal() {
  const { t } = useTranslation()
  const { stats, isLoading, error, refreshStats, clearPreviewCache, clearAllCache } = useCacheStats()

  const handleClearPreviewCache = async () => {
    const confirmed = window.confirm(t("videoCompiler.cache.confirmClearPreview"))
    if (confirmed) {
      await clearPreviewCache()
    }
  }

  const handleClearAllCache = async () => {
    const confirmed = window.confirm(t("videoCompiler.cache.confirmClearAll"))
    if (confirmed) {
      await clearAllCache()
    }
  }

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={refreshStats} variant="outline" size="sm" className="mt-4">
          {t("videoCompiler.cache.retry")}
        </Button>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center p-8">
        <p className="text-sm text-muted-foreground">{t("videoCompiler.cache.noData")}</p>
        <Button onClick={refreshStats} variant="outline" size="sm" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("videoCompiler.cache.loadData")}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      {/* Общая статистика */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t("videoCompiler.cache.overallEfficiency")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("videoCompiler.cache.hitRate")}:</span>
              <Badge variant={!Number.isNaN(stats.hit_ratio) && stats.hit_ratio > 0.7 ? "default" : "secondary"}>
                {formatCacheRatio(stats.hit_ratio)}
              </Badge>
            </div>
            <Progress
              value={
                Number.isNaN(stats.hit_ratio) || !Number.isFinite(stats.hit_ratio)
                  ? null
                  : Math.max(0, Math.min(100, stats.hit_ratio * 100))
              }
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Детальная статистика */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Превью */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("videoCompiler.cache.preview")}</CardTitle>
            <CardDescription className="text-xs">{t("videoCompiler.cache.previewDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t("videoCompiler.cache.hits")}:</span>
              <span className="text-green-600">{stats.preview_hits}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t("videoCompiler.cache.misses")}:</span>
              <span className="text-orange-600">{stats.preview_misses}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{t("videoCompiler.cache.efficiency")}:</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  !Number.isNaN(stats.preview_hit_ratio) &&
                    stats.preview_hit_ratio > 0.7 &&
                    "border-green-600 text-green-600",
                  !Number.isNaN(stats.preview_hit_ratio) &&
                    stats.preview_hit_ratio <= 0.7 &&
                    stats.preview_hit_ratio > 0.4 &&
                    "border-yellow-600 text-yellow-600",
                  !Number.isNaN(stats.preview_hit_ratio) &&
                    stats.preview_hit_ratio <= 0.4 &&
                    "border-red-600 text-red-600",
                )}
              >
                {formatCacheRatio(stats.preview_hit_ratio)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Метаданные */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("videoCompiler.cache.metadata")}</CardTitle>
            <CardDescription className="text-xs">{t("videoCompiler.cache.metadataDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t("videoCompiler.cache.hits")}:</span>
              <span className="text-green-600">{stats.metadata_hits}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t("videoCompiler.cache.misses")}:</span>
              <span className="text-orange-600">{stats.metadata_misses}</span>
            </div>
            <Separator className="my-2" />
            {stats.memory_usage && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{t("videoCompiler.cache.memory")}:</span>
                <Badge variant="outline" className="text-xs">
                  {stats.memory_usage.total_bytes
                    ? `${(stats.memory_usage.total_bytes / (1024 * 1024)).toFixed(1)} MB`
                    : "0 MB"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Действия */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            {t("videoCompiler.cache.cacheManagement")}
          </CardTitle>
          <CardDescription>{t("videoCompiler.cache.cacheManagementDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleClearPreviewCache} className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              {t("videoCompiler.cache.clearPreview")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllCache}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              {t("videoCompiler.cache.clearAll")}
            </Button>
          </div>
          <div className="flex-1 w-full items-center justify-between">
            <Button variant="outline" onClick={refreshStats} disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <RefreshCw className="h-4 w-4" />
              {t("videoCompiler.cache.refresh")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

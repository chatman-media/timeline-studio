import { Activity, HardDrive, Loader2, RefreshCw, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Progress } from "@timeline-studio/ui/components/progress"
import { Separator } from "@timeline-studio/ui/components/separator"
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
      <div className="flex items-center justify-center p-8" data-oid="m179glh">
        <Loader2 className="h-8 w-8 animate-spin" data-oid="871baoh" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8" data-oid="1.lyn_.">
        <p className="text-sm text-destructive" data-oid="i.ymtx1">
          {error}
        </p>
        <Button onClick={refreshStats} variant="outline" size="sm" className="mt-4" data-oid="nx4bceq">
          {t("videoCompiler.cache.retry")}
        </Button>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center p-8" data-oid="wy.q:46">
        <p className="text-sm text-muted-foreground" data-oid="dqh_h3.">
          {t("videoCompiler.cache.noData")}
        </p>
        <Button onClick={refreshStats} variant="outline" size="sm" className="mt-4" data-oid="jkw9y5c">
          <RefreshCw className="mr-2 h-4 w-4" data-oid="le8.:j6" />
          {t("videoCompiler.cache.loadData")}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1" data-oid="fsao0pd">
      {/* Общая статистика */}
      <Card data-oid="tg8z:pd">
        <CardHeader className="pb-3" data-oid="9geww1o">
          <CardTitle className="text-base flex items-center gap-2" data-oid="r2cassz">
            <Activity className="h-4 w-4" data-oid="-1t_zul" />
            {t("videoCompiler.cache.overallEfficiency")}
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="094yt3b">
          <div className="space-y-2" data-oid="0j:nfjv">
            <div className="flex items-center justify-between" data-oid="70x0kym">
              <span className="text-sm text-muted-foreground" data-oid="9.vw5jz">
                {t("videoCompiler.cache.hitRate")}:
              </span>
              <Badge
                variant={!Number.isNaN(stats.hit_ratio) && stats.hit_ratio > 0.7 ? "default" : "secondary"}
                data-oid="pvitwuw"
              >
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
              data-oid="ldp35u8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Детальная статистика */}
      <div className="grid gap-4 md:grid-cols-2" data-oid="tf5.j7q">
        {/* Превью */}
        <Card data-oid="d42xjfe">
          <CardHeader className="pb-3" data-oid="62d6i.l">
            <CardTitle className="text-sm" data-oid="3nxjne4">
              {t("videoCompiler.cache.preview")}
            </CardTitle>
            <CardDescription className="text-xs" data-oid="o7xpqp8">
              {t("videoCompiler.cache.previewDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2" data-oid="n8rtu4s">
            <div className="flex justify-between text-xs" data-oid="vc73b_9">
              <span className="text-muted-foreground" data-oid="e70jtfx">
                {t("videoCompiler.cache.hits")}:
              </span>
              <span className="text-green-600" data-oid="az9:a_z">
                {stats.preview_hits}
              </span>
            </div>
            <div className="flex justify-between text-xs" data-oid="i7-pi.a">
              <span className="text-muted-foreground" data-oid="kxui20d">
                {t("videoCompiler.cache.misses")}:
              </span>
              <span className="text-orange-600" data-oid="5ha1mmg">
                {stats.preview_misses}
              </span>
            </div>
            <Separator className="my-2" data-oid="ydrgqm0" />
            <div className="flex items-center justify-between" data-oid="1g:8bdd">
              <span className="text-xs font-medium" data-oid="te_:-rt">
                {t("videoCompiler.cache.efficiency")}:
              </span>
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
                data-oid="sylevc2"
              >
                {formatCacheRatio(stats.preview_hit_ratio)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Метаданные */}
        <Card data-oid="s6r8z2p">
          <CardHeader className="pb-3" data-oid="pdizqlg">
            <CardTitle className="text-sm" data-oid="x9dnzy5">
              {t("videoCompiler.cache.metadata")}
            </CardTitle>
            <CardDescription className="text-xs" data-oid="bqoda52">
              {t("videoCompiler.cache.metadataDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2" data-oid="h2g93wi">
            <div className="flex justify-between text-xs" data-oid=".-opjfw">
              <span className="text-muted-foreground" data-oid="xr1387n">
                {t("videoCompiler.cache.hits")}:
              </span>
              <span className="text-green-600" data-oid="t1573nq">
                {stats.metadata_hits}
              </span>
            </div>
            <div className="flex justify-between text-xs" data-oid=":66blbr">
              <span className="text-muted-foreground" data-oid="silsfkh">
                {t("videoCompiler.cache.misses")}:
              </span>
              <span className="text-orange-600" data-oid="irf5lwz">
                {stats.metadata_misses}
              </span>
            </div>
            <Separator className="my-2" data-oid="hwuz4zx" />
            {stats.memory_usage && (
              <div className="flex items-center justify-between" data-oid="mxrc:rb">
                <span className="text-xs font-medium" data-oid="r5b_060">
                  {t("videoCompiler.cache.memory")}:
                </span>
                <Badge variant="outline" className="text-xs" data-oid="ajj:trs">
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
      <Card data-oid="ix3eje4">
        <CardHeader className="pb-3" data-oid="1w49j_8">
          <CardTitle className="text-base flex items-center gap-2" data-oid="oc27w9w">
            <HardDrive className="h-4 w-4" data-oid="nidkh-h" />
            {t("videoCompiler.cache.cacheManagement")}
          </CardTitle>
          <CardDescription data-oid="vors:9r">{t("videoCompiler.cache.cacheManagementDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="9kbge7:">
          <div className="flex gap-2 flex-wrap" data-oid="26iaric">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearPreviewCache}
              className="flex items-center gap-2"
              data-oid="0aafwkt"
            >
              <Trash2 className="h-4 w-4" data-oid="h7s4dxf" />
              {t("videoCompiler.cache.clearPreview")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllCache}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
              data-oid="p8ei2il"
            >
              <Trash2 className="h-4 w-4" data-oid="6dq5iif" />
              {t("videoCompiler.cache.clearAll")}
            </Button>
          </div>
          <div className="flex-1 w-full items-center justify-between" data-oid="q39qqbr">
            <Button variant="outline" onClick={refreshStats} disabled={isLoading} className="flex-1" data-oid="jlbual1">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" data-oid=".t4r-6d" />}
              <RefreshCw className="h-4 w-4" data-oid="e:qhsw_" />
              {t("videoCompiler.cache.refresh")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

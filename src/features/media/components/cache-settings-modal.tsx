import { useNotifications } from "@timeline-studio/core/hooks"
import { type CacheStatistics, indexedDBCacheService } from "@timeline-studio/core/services/media-cache-service"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Progress } from "@timeline-studio/ui/components/progress"
import { Separator } from "@timeline-studio/ui/components/separator"
import { AlertCircle, Database, HardDrive, RefreshCw, Trash2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { createLogger } from "@/lib/tauri-logger"
import { formatFileSize } from "@/lib/utils"

const logger = createLogger("CacheSettings")

/**
 * Модальное окно настроек кэширования
 */
export function CacheSettingsModal() {
  const { t } = useTranslation()
  const { showSuccess, showError } = useNotifications()
  const [isLoading, setIsLoading] = useState(false)
  const [cacheStats, setCacheStats] = useState<CacheStatistics | null>(null)
  const [clearingProgress, setClearingProgress] = useState(0)
  const [isClearing, setIsClearing] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Загрузка статистики кэша
  const loadCacheStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const stats = await indexedDBCacheService.getCacheStatistics()
      setCacheStats(stats)
    } catch (error) {
      logger.errorSync("Failed to load cache statistics", { error })
      showError("Ошибка", t("browser.media.cache.errors.loadStats"))
    } finally {
      setIsLoading(false)
    }
  }, [t, showError])

  // Очистка кэша превью
  const clearPreviewCache = useCallback(async () => {
    setIsClearing(true)
    setClearingProgress(0)
    try {
      // Показываем прогресс
      intervalRef.current = setInterval(() => {
        setClearingProgress((prev) => Math.min(prev + 20, 90))
      }, 100)

      await indexedDBCacheService.clearPreviewCache()

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setClearingProgress(100)

      showSuccess("Успех", t("browser.media.cache.success.clearPreview"))
      await loadCacheStats()
    } catch (error) {
      logger.errorSync("Failed to clear preview cache", { error })
      showError("Ошибка", t("browser.media.cache.errors.clearPreview"))
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } finally {
      timeoutRef.current = setTimeout(() => {
        setClearingProgress(0)
        setIsClearing(false)
        timeoutRef.current = null
      }, 500)
    }
  }, [loadCacheStats, t, showSuccess, showError])

  // Очистка кэша кадров
  const clearFrameCache = useCallback(async () => {
    setIsClearing(true)
    setClearingProgress(0)
    try {
      const progressInterval = setInterval(() => {
        setClearingProgress((prev) => Math.min(prev + 20, 90))
      }, 100)

      await indexedDBCacheService.clearFrameCache()

      clearInterval(progressInterval)
      setClearingProgress(100)

      showSuccess("Успех", t("browser.media.cache.success.clearFrames"))
      await loadCacheStats()
    } catch (error) {
      logger.errorSync("Failed to clear frame cache", { error })
      showError("Ошибка", t("browser.media.cache.errors.clearFrames"))
    } finally {
      setTimeout(() => {
        setClearingProgress(0)
        setIsClearing(false)
      }, 500)
    }
  }, [loadCacheStats, t, showSuccess, showError])

  // Очистка кэша распознавания
  const clearRecognitionCache = useCallback(async () => {
    setIsClearing(true)
    setClearingProgress(0)
    try {
      const progressInterval = setInterval(() => {
        setClearingProgress((prev) => Math.min(prev + 20, 90))
      }, 100)

      await indexedDBCacheService.clearRecognitionCache()

      clearInterval(progressInterval)
      setClearingProgress(100)

      showSuccess("Успех", t("browser.media.cache.success.clearRecognition"))
      await loadCacheStats()
    } catch (error) {
      logger.errorSync("Failed to clear recognition cache", { error })
      showError("Ошибка", t("browser.media.cache.errors.clearRecognition"))
    } finally {
      setTimeout(() => {
        setClearingProgress(0)
        setIsClearing(false)
      }, 500)
    }
  }, [loadCacheStats, t, showSuccess, showError])

  // Очистка всего кэша
  const clearAllCache = useCallback(async () => {
    setIsClearing(true)
    setClearingProgress(0)
    try {
      const progressInterval = setInterval(() => {
        setClearingProgress((prev) => Math.min(prev + 10, 90))
      }, 50)

      await indexedDBCacheService.clearAllCache()

      clearInterval(progressInterval)
      setClearingProgress(100)

      showSuccess("Успех", t("browser.media.cache.success.clearAll"))
      await loadCacheStats()
    } catch (error) {
      logger.errorSync("Failed to clear all cache", { error })
      showError("Ошибка", t("browser.media.cache.errors.clearAll"))
    } finally {
      setTimeout(() => {
        setClearingProgress(0)
        setIsClearing(false)
      }, 500)
    }
  }, [loadCacheStats, t, showSuccess, showError])

  // Очистка устаревшего кэша
  const cleanupExpiredCache = useCallback(async () => {
    try {
      await indexedDBCacheService.cleanupExpiredCache()
      showSuccess("Успех", t("browser.media.cache.success.cleanupExpired"))
      await loadCacheStats()
    } catch (error) {
      logger.errorSync("Failed to cleanup expired cache", { error })
      showError("Ошибка", t("browser.media.cache.errors.cleanupExpired"))
    }
  }, [loadCacheStats, t, showSuccess, showError])

  // Загрузка статистики при монтировании
  useEffect(() => {
    void loadCacheStats()
  }, [loadCacheStats])

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  if (isLoading || !cacheStats) {
    return (
      <div className="flex items-center justify-center py-8" data-oid="5iimu52">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" data-oid="x15db9h" />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1" data-oid="0ly5a_r">
      <Card data-oid="9.mayt8">
        <CardHeader data-oid="ph1nueb">
          <CardTitle className="flex items-center gap-2" data-oid="-hujskr">
            <Database className="h-5 w-5" data-oid="rb9w8cd" />
            {t("browser.media.cache.title")}
          </CardTitle>
          <CardDescription data-oid="ym4ocnn">{t("browser.media.cache.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6" data-oid="fjgavfb">
          {/* Общая статистика */}
          <div className="space-y-2" data-oid="x73_aih">
            <div className="flex items-center justify-between text-sm" data-oid="az4bvdn">
              <span className="font-medium" data-oid="wrngd1q">
                {t("browser.media.cache.totalSize")}
              </span>
              <span className="text-muted-foreground" data-oid="-2yxht7">
                {formatFileSize(cacheStats.totalSize)}
              </span>
            </div>
            <Progress value={(cacheStats.totalSize / (500 * 1024 * 1024)) * 100} className="h-2" data-oid="ogfoypw" />
            <p className="text-xs text-muted-foreground" data-oid="m4wqo3k">
              {t("browser.media.cache.usage", {
                used: formatFileSize(cacheStats.totalSize),
                total: "500 MB",
              })}
            </p>
          </div>

          <Separator data-oid="9fy:zu7" />

          {/* Кэш превью */}
          <div className="space-y-3" data-oid="ea9wt:q">
            <div className="flex items-center justify-between" data-oid="unl_mtt">
              <div className="space-y-1" data-oid="6lcbnvp">
                <h4 className="text-sm font-medium" data-oid="t-n51s5">
                  {t("browser.media.cache.previewCache.title")}
                </h4>
                <p className="text-xs text-muted-foreground" data-oid="bwlhjcd">
                  {t("browser.media.cache.previewCache.info", {
                    count: cacheStats.previewCache.count,
                    size: formatFileSize(cacheStats.previewCache.size),
                  })}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={clearPreviewCache} disabled={isClearing} data-oid="dey512x">
                <Trash2 className="mr-2 h-4 w-4" data-oid="gu3j9fn" />
                {t("browser.media.cache.actions.clear")}
              </Button>
            </div>
          </div>

          {/* Кэш кадров */}
          <div className="space-y-3" data-oid="khl:esi">
            <div className="flex items-center justify-between" data-oid="uo46.a:">
              <div className="space-y-1" data-oid="c6ng48j">
                <h4 className="text-sm font-medium" data-oid="uqp5hh:">
                  {t("browser.media.cache.frameCache.title")}
                </h4>
                <p className="text-xs text-muted-foreground" data-oid="8sd:5su">
                  {t("browser.media.cache.frameCache.info", {
                    count: cacheStats.frameCache.count,
                    size: formatFileSize(cacheStats.frameCache.size),
                  })}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={clearFrameCache} disabled={isClearing} data-oid="q.fntxt">
                <Trash2 className="mr-2 h-4 w-4" data-oid="alz.6h6" />
                {t("browser.media.cache.actions.clear")}
              </Button>
            </div>
          </div>

          {/* Кэш распознавания */}
          <div className="space-y-3" data-oid="0llaepj">
            <div className="flex items-center justify-between" data-oid=":.m4xpo">
              <div className="space-y-1" data-oid=".xy22nx">
                <h4 className="text-sm font-medium" data-oid="8dp7-8b">
                  {t("browser.media.cache.recognitionCache.title")}
                </h4>
                <p className="text-xs text-muted-foreground" data-oid="gdefcn:">
                  {t("browser.media.cache.recognitionCache.info", {
                    count: cacheStats.recognitionCache.count,
                    size: formatFileSize(cacheStats.recognitionCache.size),
                  })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearRecognitionCache}
                disabled={isClearing}
                data-oid="b2ksgsl"
              >
                <Trash2 className="mr-2 h-4 w-4" data-oid="_a16n-8" />
                {t("browser.media.cache.actions.clear")}
              </Button>
            </div>
          </div>

          {/* Кэш субтитров */}
          <div className="space-y-3" data-oid="cs6tio4">
            <div className="flex items-center justify-between" data-oid="a-acm4u">
              <div className="space-y-1" data-oid="dvtn2ab">
                <h4 className="text-sm font-medium" data-oid="fryi47:">
                  {t("browser.media.cache.subtitleCache.title")}
                </h4>
                <p className="text-xs text-muted-foreground" data-oid="qth1wsx">
                  {t("browser.media.cache.subtitleCache.info", {
                    count: cacheStats.subtitleCache.count,
                    size: formatFileSize(cacheStats.subtitleCache.size),
                  })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setIsClearing(true)
                  setClearingProgress(0)
                  try {
                    const progressInterval = setInterval(() => {
                      setClearingProgress((prev) => Math.min(prev + 20, 90))
                    }, 100)

                    await indexedDBCacheService.clearSubtitleCache()

                    clearInterval(progressInterval)
                    setClearingProgress(100)

                    showSuccess("Успех", t("browser.media.cache.success.clearSubtitles"))
                    await loadCacheStats()
                  } catch (error) {
                    logger.errorSync("Failed to clear subtitle cache", {
                      error,
                    })
                    showError("Ошибка", t("browser.media.cache.errors.clearSubtitles"))
                  } finally {
                    setTimeout(() => {
                      setClearingProgress(0)
                      setIsClearing(false)
                    }, 500)
                  }
                }}
                disabled={isClearing}
                data-oid="nqs:43v"
              >
                <Trash2 className="mr-2 h-4 w-4" data-oid="vf1uh8e" />
                {t("browser.media.cache.actions.clear")}
              </Button>
            </div>
          </div>

          <Separator data-oid="j:ff3s-" />

          {/* Прогресс очистки */}
          {clearingProgress > 0 && (
            <div className="space-y-2" data-oid="6dwcoiu">
              <div className="flex items-center justify-between text-sm" data-oid="-c-8.sg">
                <span data-oid="_jqd.g7">{t("browser.media.cache.clearing")}</span>
                <span data-oid="23jd4sf">{clearingProgress}%</span>
              </div>
              <Progress value={clearingProgress} className="h-2" data-oid="w2kgmz." />
            </div>
          )}

          {/* Кнопка очистки всего */}
          <div className="flex-1 items-center justify-between" data-oid="co.0oxd">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4" data-oid="6h7y2rn">
              <AlertCircle className="h-4 w-4" data-oid="1u-qkbf" />
              <span data-oid="cwb9k6b">{t("browser.media.cache.warning")}</span>
            </div>
            <div className="flex gap-2 justify-between" data-oid=":b1ftvn">
              <Button
                variant="outline"
                size="sm"
                onClick={cleanupExpiredCache}
                disabled={isClearing}
                data-oid=":p9tz9:"
              >
                <RefreshCw className="mr-2 h-4 w-4" data-oid="p05ldta" />
                {t("browser.media.cache.actions.cleanupExpired")}
              </Button>
              <Button variant="destructive" onClick={clearAllCache} disabled={isClearing} data-oid="j9mc7_k">
                <Trash2 className="mr-2 h-4 w-4" data-oid="4glnlua" />
                {t("browser.media.cache.actions.clearAll")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Информация о хранилище */}
      <Card data-oid="awsb-ow">
        <CardHeader data-oid="7xzse5s">
          <CardTitle className="flex items-center gap-2" data-oid="jfe-tww">
            <HardDrive className="h-5 w-5" data-oid="x2fgl9g" />
            {t("browser.media.cache.storage.title")}
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="ju8.evh">
          <div className="space-y-3 text-sm" data-oid="cpoe_j:">
            <div className="flex items-center justify-between" data-oid=":8r.m4d">
              <span className="text-muted-foreground" data-oid="37aa459">
                {t("browser.media.cache.storage.technology")}
              </span>
              <span className="font-medium" data-oid="c345q50">
                IndexedDB
              </span>
            </div>
            <div className="flex items-center justify-between" data-oid="wiv.t_i">
              <span className="text-muted-foreground" data-oid="c1x2g5z">
                {t("browser.media.cache.storage.maxSize")}
              </span>
              <span className="font-medium" data-oid="jz8z5ec">
                500 MB
              </span>
            </div>
            <div className="flex items-center justify-between" data-oid="4k21qx0">
              <span className="text-muted-foreground" data-oid="1rop3hf">
                {t("browser.media.cache.storage.autoCleanup")}
              </span>
              <span className="font-medium" data-oid="t1yffx:">
                {t("browser.media.cache.storage.autoCleanupValue")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

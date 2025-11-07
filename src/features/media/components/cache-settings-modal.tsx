import { AlertCircle, Database, HardDrive, RefreshCw, Trash2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { createLogger } from "@/lib/tauri-logger"
import { formatFileSize } from "@/lib/utils"

import { type CacheStatistics, indexedDBCacheService } from "../services/indexeddb-cache-service"

const logger = createLogger("CacheSettings")

/**
 * Модальное окно настроек кэширования
 */
export function CacheSettingsModal() {
  const { t } = useTranslation()
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
      toast.error(t("browser.media.cache.errors.loadStats"))
    } finally {
      setIsLoading(false)
    }
  }, [t])

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

      toast.success(t("browser.media.cache.success.clearPreview"))
      await loadCacheStats()
    } catch (error) {
      logger.errorSync("Failed to clear preview cache", { error })
      toast.error(t("browser.media.cache.errors.clearPreview"))
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
  }, [loadCacheStats, t])

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

      toast.success(t("browser.media.cache.success.clearFrames"))
      await loadCacheStats()
    } catch (error) {
      logger.errorSync("Failed to clear frame cache", { error })
      toast.error(t("browser.media.cache.errors.clearFrames"))
    } finally {
      setTimeout(() => {
        setClearingProgress(0)
        setIsClearing(false)
      }, 500)
    }
  }, [loadCacheStats, t])

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

      toast.success(t("browser.media.cache.success.clearRecognition"))
      await loadCacheStats()
    } catch (error) {
      logger.errorSync("Failed to clear recognition cache", { error })
      toast.error(t("browser.media.cache.errors.clearRecognition"))
    } finally {
      setTimeout(() => {
        setClearingProgress(0)
        setIsClearing(false)
      }, 500)
    }
  }, [loadCacheStats, t])

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

      toast.success(t("browser.media.cache.success.clearAll"))
      await loadCacheStats()
    } catch (error) {
      logger.errorSync("Failed to clear all cache", { error })
      toast.error(t("browser.media.cache.errors.clearAll"))
    } finally {
      setTimeout(() => {
        setClearingProgress(0)
        setIsClearing(false)
      }, 500)
    }
  }, [loadCacheStats, t])

  // Очистка устаревшего кэша
  const cleanupExpiredCache = useCallback(async () => {
    try {
      await indexedDBCacheService.cleanupExpiredCache()
      toast.success(t("browser.media.cache.success.cleanupExpired"))
      await loadCacheStats()
    } catch (error) {
      logger.errorSync("Failed to cleanup expired cache", { error })
      toast.error(t("browser.media.cache.errors.cleanupExpired"))
    }
  }, [loadCacheStats, t])

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
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t("browser.media.cache.title")}
          </CardTitle>
          <CardDescription>{t("browser.media.cache.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Общая статистика */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{t("browser.media.cache.totalSize")}</span>
              <span className="text-muted-foreground">{formatFileSize(cacheStats.totalSize)}</span>
            </div>
            <Progress value={(cacheStats.totalSize / (500 * 1024 * 1024)) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {t("browser.media.cache.usage", {
                used: formatFileSize(cacheStats.totalSize),
                total: "500 MB",
              })}
            </p>
          </div>

          <Separator />

          {/* Кэш превью */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">{t("browser.media.cache.previewCache.title")}</h4>
                <p className="text-xs text-muted-foreground">
                  {t("browser.media.cache.previewCache.info", {
                    count: cacheStats.previewCache.count,
                    size: formatFileSize(cacheStats.previewCache.size),
                  })}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={clearPreviewCache} disabled={isClearing}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t("browser.media.cache.actions.clear")}
              </Button>
            </div>
          </div>

          {/* Кэш кадров */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">{t("browser.media.cache.frameCache.title")}</h4>
                <p className="text-xs text-muted-foreground">
                  {t("browser.media.cache.frameCache.info", {
                    count: cacheStats.frameCache.count,
                    size: formatFileSize(cacheStats.frameCache.size),
                  })}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={clearFrameCache} disabled={isClearing}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t("browser.media.cache.actions.clear")}
              </Button>
            </div>
          </div>

          {/* Кэш распознавания */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">{t("browser.media.cache.recognitionCache.title")}</h4>
                <p className="text-xs text-muted-foreground">
                  {t("browser.media.cache.recognitionCache.info", {
                    count: cacheStats.recognitionCache.count,
                    size: formatFileSize(cacheStats.recognitionCache.size),
                  })}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={clearRecognitionCache} disabled={isClearing}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t("browser.media.cache.actions.clear")}
              </Button>
            </div>
          </div>

          {/* Кэш субтитров */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">{t("browser.media.cache.subtitleCache.title")}</h4>
                <p className="text-xs text-muted-foreground">
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

                    toast.success(t("browser.media.cache.success.clearSubtitles"))
                    await loadCacheStats()
                  } catch (error) {
                    logger.errorSync("Failed to clear subtitle cache", { error })
                    toast.error(t("browser.media.cache.errors.clearSubtitles"))
                  } finally {
                    setTimeout(() => {
                      setClearingProgress(0)
                      setIsClearing(false)
                    }, 500)
                  }
                }}
                disabled={isClearing}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("browser.media.cache.actions.clear")}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Прогресс очистки */}
          {clearingProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t("browser.media.cache.clearing")}</span>
                <span>{clearingProgress}%</span>
              </div>
              <Progress value={clearingProgress} className="h-2" />
            </div>
          )}

          {/* Кнопка очистки всего */}
          <div className="flex-1 items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <AlertCircle className="h-4 w-4" />
              <span>{t("browser.media.cache.warning")}</span>
            </div>
            <div className="flex gap-2 justify-between">
              <Button variant="outline" size="sm" onClick={cleanupExpiredCache} disabled={isClearing}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("browser.media.cache.actions.cleanupExpired")}
              </Button>
              <Button variant="destructive" onClick={clearAllCache} disabled={isClearing}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t("browser.media.cache.actions.clearAll")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Информация о хранилище */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            {t("browser.media.cache.storage.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("browser.media.cache.storage.technology")}</span>
              <span className="font-medium">IndexedDB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("browser.media.cache.storage.maxSize")}</span>
              <span className="font-medium">500 MB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("browser.media.cache.storage.autoCleanup")}</span>
              <span className="font-medium">{t("browser.media.cache.storage.autoCleanupValue")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

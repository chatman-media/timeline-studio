/**
 * Timeline Preview Component
 * Интеграция WebGL2 превью с Timeline
 */

import { memo, useEffect } from "react"
import { useWebGL2Preview } from "@/features/preview/hooks/use-webgl2-preview"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"

const logger = createLogger("TimelinePreview")

interface TimelinePreviewProps {
  className?: string
}

export const TimelinePreview = memo(function TimelinePreview({ className }: TimelinePreviewProps) {
  const { canvasRef, videoRef, isInitialized, gpuTier, quality, cacheStats } = useWebGL2Preview({
    cacheSize: 200, // MB
    prefetchRange: 3, // seconds
    updateInterval: 33, // ~30fps
  })

  // Логирование для отладки
  useEffect(() => {
    if (isInitialized) {
      logger.info("[Timeline Preview] Initialized with GPU tier:", { gpuTier })
      logger.info("[Timeline Preview] Quality settings:", { quality })
    }
  }, [isInitialized, gpuTier, quality])

  useEffect(() => {
    if (cacheStats) {
      logger.info("[Timeline Preview] Cache stats:", {
        entries: cacheStats.entries,
        sizeMB: cacheStats.sizeMB.toFixed(2),
        hitRate: `${((cacheStats as any).hitRate * 100 || 0).toFixed(1)}%`,
      })
    }
  }, [cacheStats])

  return (
    <div className={cn("relative w-full h-full bg-black", className)} data-oid="56:5xj2">
      {/* Canvas для WebGL рендеринга */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
        style={{ imageRendering: "optimizeQuality" as any }}
        data-oid="4dtc35y"
      />

      {/* Скрытый video элемент для извлечения кадров */}
      <video ref={videoRef} className="hidden" muted playsInline data-oid="hz529lx" />

      {/* Оверлей с информацией о производительности */}
      {isInitialized && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs p-2 rounded" data-oid="zmbmujm">
          <div data-oid="_wx6_0d">GPU: {gpuTier}</div>
          <div data-oid="e50w8yn">Resolution: {(quality.resolution * 100).toFixed(0)}%</div>
          <div data-oid="26zoayj">Effects: {quality.effects}</div>
          <div data-oid="xh1vpgj">FPS: {quality.fps}</div>
          {cacheStats && (
            <>
              <div className="mt-1 pt-1 border-t border-white/20" data-oid="r8pcphs">
                Cache: {cacheStats.entries} frames
              </div>
              <div data-oid="t59foh_">Size: {cacheStats.sizeMB.toFixed(1)}MB</div>
              <div data-oid=".tz.j3f">
                Hit Rate:{" "}
                {(cacheStats as any).hitRate > 0 ? (
                  <span
                    className={
                      (cacheStats as any).hitRate > 0.8
                        ? "text-green-400"
                        : (cacheStats as any).hitRate > 0.5
                          ? "text-yellow-400"
                          : "text-red-400"
                    }
                    data-oid="--y9n:n"
                  >
                    {((cacheStats as any).hitRate * 100 || 0).toFixed(0)}%
                  </span>
                ) : (
                  "0%"
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Индикатор загрузки */}
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center" data-oid="sb97_zh">
          <div className="text-white" data-oid="zt21:iy">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" data-oid="0hrjzur" />
            <div className="mt-2 text-sm" data-oid="w71on:u">
              Initializing WebGL2...
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

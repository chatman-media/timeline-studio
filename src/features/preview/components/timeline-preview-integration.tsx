/**
 * Timeline Preview Integration
 * Integrates real-time preview with Media Studio timeline
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card } from "@timeline-studio/ui/components/card"
import { Eye, EyeOff, Monitor, Settings, Zap } from "lucide-react"
import { useEffect, useRef } from "react"
import { useWebGL2Preview } from "../hooks/use-webgl2-preview"
import { QualityControls } from "./quality-controls"

interface TimelinePreviewIntegrationProps {
  /**
   * Position in the timeline layout
   */
  position?: "sidebar" | "overlay" | "panel"

  /**
   * Size constraint
   */
  maxWidth?: number
  maxHeight?: number

  /**
   * Show controls
   */
  showControls?: boolean

  /**
   * Enable/disable preview
   */
  enabled?: boolean

  /**
   * Callback when preview state changes
   */
  onPreviewChange?: (enabled: boolean) => void

  className?: string
}

export function TimelinePreviewIntegration({
  position = "panel",
  maxWidth = 400,
  maxHeight = 300,
  showControls = true,
  enabled = true,
  onPreviewChange,
  className,
}: TimelinePreviewIntegrationProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { canvasRef, videoRef, previewFrame, isInitialized, gpuTier, quality, setQuality, cacheStats } =
    useWebGL2Preview({
      cacheSize: 50, // Smaller cache for timeline integration
      prefetchRange: 1, // Less aggressive prefetching
      updateInterval: position === "overlay" ? 16 : 33, // Higher fps for overlay
    })

  // Adjust canvas size based on container
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      const { width, height } = entry.contentRect

      // Calculate constrained size
      const aspectRatio = 16 / 9
      let canvasWidth = Math.min(width - 32, maxWidth) // Account for padding
      let canvasHeight = canvasWidth / aspectRatio

      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight
        canvasWidth = canvasHeight * aspectRatio
      }

      // Update canvas size would be handled by the canvas ref
      // This is just for demonstration of the sizing logic
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [maxWidth, maxHeight])

  const getPositionStyles = () => {
    switch (position) {
      case "overlay":
        return "absolute top-4 right-4 z-50 max-w-sm shadow-2xl border-2"
      case "sidebar":
        return "sticky top-4"
      default:
        return ""
    }
  }

  const handleTogglePreview = () => {
    const newState = !enabled
    onPreviewChange?.(newState)
  }

  if (!enabled) {
    return (
      <Card className={`${getPositionStyles()} ${className}`} data-oid="c301j9f">
        <div className="p-4 text-center" data-oid="78bps:j">
          <div className="flex items-center justify-center gap-2 mb-2" data-oid="hdzu7mn">
            <EyeOff className="w-5 h-5 text-muted-foreground" data-oid="nfe5pj-" />
            <span className="text-sm font-medium" data-oid="et:-5q7">
              Preview Disabled
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={handleTogglePreview} data-oid="p78vugj">
            Enable Preview
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card ref={containerRef} className={`overflow-hidden ${getPositionStyles()} ${className}`} data-oid="363l1cg">
      {/* Header */}
      {showControls && (
        <div className="p-3 border-b bg-muted/30" data-oid=":rb19fe">
          <div className="flex items-center justify-between" data-oid="1dd_qxw">
            <div className="flex items-center gap-2" data-oid="782jy1x">
              <Eye className="w-4 h-4" data-oid="-05nfer" />
              <span className="text-sm font-medium" data-oid="q9:kjye">
                Live Preview
              </span>
              {isInitialized && (
                <Badge variant="secondary" className="text-xs" data-oid="meq5rps">
                  <Zap className="w-3 h-3 mr-1" data-oid="yax2zv7" />
                  Live
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1" data-oid="ksu1e.c">
              <Badge variant={gpuTier === "high" ? "default" : "secondary"} className="text-xs" data-oid="1x9t7xn">
                <Monitor className="w-3 h-3 mr-1" data-oid=":9zc7ei" />
                {gpuTier.toUpperCase()}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleTogglePreview}
                className="h-6 w-6 p-0"
                data-oid="suo8os8"
              >
                <Settings className="w-3 h-3" data-oid="nf0g.m4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Canvas */}
      <div
        className="relative bg-black flex items-center justify-center"
        style={{
          aspectRatio: "16/9",
          minHeight: 150,
          maxHeight: maxHeight,
        }}
        data-oid="8tcz87p"
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
          style={{
            imageRendering: quality.antialiasing ? "auto" : "pixelated",
          }}
          data-oid="39_e3df"
        />

        {/* Hidden video element */}
        <video ref={videoRef} className="hidden" crossOrigin="anonymous" preload="metadata" data-oid="pr7c2x7" />

        {/* Loading state */}
        {!isInitialized && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center" data-oid="ka5qq6:">
            <div className="text-white text-xs text-center" data-oid="7dh4amk">
              <div className="animate-pulse" data-oid="ny5347j">
                Initializing preview...
              </div>
            </div>
          </div>
        )}

        {/* Status indicator */}
        {isInitialized && (
          <div className="absolute top-2 left-2" data-oid="uqxg.f:">
            <div
              className={`w-2 h-2 rounded-full ${previewFrame ? "bg-green-400" : "bg-yellow-400"} animate-pulse`}
              data-oid=".av5d:7"
            />
          </div>
        )}

        {/* Performance indicator */}
        {position === "overlay" && cacheStats && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded" data-oid="u2u1t-0">
            {cacheStats.entries} cached • {Math.round(cacheStats.fillPercentage)}% full
          </div>
        )}
      </div>

      {/* Quality Controls (collapsible) */}
      {showControls && position !== "overlay" && (
        <div className="border-t" data-oid="a8xmwm4">
          <details className="group" data-oid="47wxvpu">
            <summary
              className="p-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-2"
              data-oid="h3ruvbj"
            >
              <span data-oid="7i17nla">Quality Settings</span>
              <span className="ml-auto group-open:rotate-90 transition-transform" data-oid="b1u39y3">
                ▶
              </span>
            </summary>
            <div className="p-3 border-t bg-muted/20" data-oid="y1cyg6i">
              <QualityControls
                quality={quality}
                gpuTier={gpuTier}
                onChange={setQuality}
                className="space-y-3"
                data-oid="12j8mdn"
              />
            </div>
          </details>
        </div>
      )}
    </Card>
  )
}

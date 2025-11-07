/**
 * Timeline Preview Integration
 * Integrates real-time preview with Media Studio timeline
 */

import { Eye, EyeOff, Monitor, Settings, Zap } from "lucide-react"
import { useEffect, useRef } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
      <Card className={`${getPositionStyles()} ${className}`}>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <EyeOff className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">Preview Disabled</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleTogglePreview}>
            Enable Preview
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card ref={containerRef} className={`overflow-hidden ${getPositionStyles()} ${className}`}>
      {/* Header */}
      {showControls && (
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">Live Preview</span>
              {isInitialized && (
                <Badge variant="secondary" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Badge variant={gpuTier === "high" ? "default" : "secondary"} className="text-xs">
                <Monitor className="w-3 h-3 mr-1" />
                {gpuTier.toUpperCase()}
              </Badge>

              <Button variant="ghost" size="sm" onClick={handleTogglePreview} className="h-6 w-6 p-0">
                <Settings className="w-3 h-3" />
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
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
          style={{
            imageRendering: quality.antialiasing ? "auto" : "pixelated",
          }}
        />

        {/* Hidden video element */}
        <video ref={videoRef} className="hidden" crossOrigin="anonymous" preload="metadata" />

        {/* Loading state */}
        {!isInitialized && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-xs text-center">
              <div className="animate-pulse">Initializing preview...</div>
            </div>
          </div>
        )}

        {/* Status indicator */}
        {isInitialized && (
          <div className="absolute top-2 left-2">
            <div className={`w-2 h-2 rounded-full ${previewFrame ? "bg-green-400" : "bg-yellow-400"} animate-pulse`} />
          </div>
        )}

        {/* Performance indicator */}
        {position === "overlay" && cacheStats && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {cacheStats.entries} cached • {Math.round(cacheStats.fillPercentage)}% full
          </div>
        )}
      </div>

      {/* Quality Controls (collapsible) */}
      {showControls && position !== "overlay" && (
        <div className="border-t">
          <details className="group">
            <summary className="p-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-2">
              <span>Quality Settings</span>
              <span className="ml-auto group-open:rotate-90 transition-transform">▶</span>
            </summary>
            <div className="p-3 border-t bg-muted/20">
              <QualityControls quality={quality} gpuTier={gpuTier} onChange={setQuality} className="space-y-3" />
            </div>
          </details>
        </div>
      )}
    </Card>
  )
}

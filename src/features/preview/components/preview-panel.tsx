/**
 * Preview Panel - Main UI for real-time preview
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card } from "@timeline-studio/ui/components/card"
import { Eye, EyeOff, Layers, Monitor, Settings, Zap } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useWebGL2Preview } from "../hooks/use-webgl2-preview"
import { EffectChainList } from "./effect-chain-list"
import { PresetGallery } from "./preset-gallery"
import { QualityControls } from "./quality-controls"

interface PreviewPanelProps {
  className?: string
}

export function PreviewPanel({ className }: PreviewPanelProps) {
  const [showEffects, setShowEffects] = useState(true)
  const [showPresets, setShowPresets] = useState(false)
  const [showQuality, setShowQuality] = useState(false)
  const [previewEnabled, setPreviewEnabled] = useState(true)

  const { canvasRef, videoRef, previewFrame, isInitialized, gpuTier, quality, setQuality, cacheStats } =
    useWebGL2Preview({
      cacheSize: 100,
      prefetchRange: 2,
      updateInterval: 33,
    })

  const canvasContainerRef = useRef<HTMLDivElement>(null)

  // Update canvas size when container resizes
  useEffect(() => {
    if (!canvasContainerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      const { width, height } = entry.contentRect

      if (canvasRef && typeof canvasRef === "function") {
        // Canvas size will be handled by the hook
      }
    })

    resizeObserver.observe(canvasContainerRef.current)
    return () => resizeObserver.disconnect()
  }, [canvasRef])

  const getGPUTierBadge = () => {
    const variants = {
      high: "default",
      medium: "secondary",
      low: "destructive",
    } as const

    return (
      <Badge variant={variants[gpuTier]} data-oid="i:9ttcx">
        <Monitor className="w-3 h-3 mr-1" data-oid="ep.paw5" />
        GPU: {gpuTier.toUpperCase()}
      </Badge>
    )
  }

  const getCacheStats = () => {
    if (!cacheStats) return null

    return (
      <div className="text-xs text-muted-foreground" data-oid="quv2ym7">
        Cache: {cacheStats.entries} frames ({cacheStats.sizeMB.toFixed(1)}MB)
      </div>
    )
  }

  return (
    <Card className={`h-full flex flex-col ${className}`} data-oid="3k0g0ne">
      {/* Header */}
      <div className="p-4 border-b" data-oid="hhb2gpq">
        <div className="flex items-center justify-between mb-2" data-oid="opxxd3:">
          <h3 className="font-semibold" data-oid="f5cdvx2">
            Real-time Preview
          </h3>
          <div className="flex items-center gap-2" data-oid="qz6xjxn">
            {getGPUTierBadge()}
            <Button variant="ghost" size="sm" onClick={() => setPreviewEnabled(!previewEnabled)} data-oid="nadv:4.">
              {previewEnabled ? (
                <Eye className="w-4 h-4" data-oid="_fd.y_i" />
              ) : (
                <EyeOff className="w-4 h-4" data-oid="j:0mrcv" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-2" data-oid="ku0udfc">
          <Button
            variant={showEffects ? "default" : "outline"}
            size="sm"
            onClick={() => setShowEffects(!showEffects)}
            data-oid="2nzuhqs"
          >
            <Layers className="w-4 h-4 mr-1" data-oid="8dlqd_e" />
            Effects
          </Button>

          <Button
            variant={showPresets ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPresets(!showPresets)}
            data-oid="t5lhpda"
          >
            <Zap className="w-4 h-4 mr-1" data-oid="bidp2z0" />
            Presets
          </Button>

          <Button
            variant={showQuality ? "default" : "outline"}
            size="sm"
            onClick={() => setShowQuality(!showQuality)}
            data-oid="pdpgi7d"
          >
            <Settings className="w-4 h-4 mr-1" data-oid="5p5xed5" />
            Quality
          </Button>
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={canvasContainerRef}
        className="flex-1 relative bg-black min-h-0 flex items-center justify-center"
        data-oid="dh7cfkb"
      >
        {previewEnabled ? (
          <>
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain"
              style={{
                imageRendering: quality.antialiasing ? "auto" : "pixelated",
              }}
              data-oid="gxwvgxw"
            />

            {/* Hidden video element for frame extraction */}
            <video ref={videoRef} className="hidden" crossOrigin="anonymous" preload="metadata" data-oid="_tgqn2m" />

            {/* Loading overlay */}
            {!isInitialized && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center" data-oid="-8-2bs_">
                <div className="text-white" data-oid="1qhgb8i">
                  Initializing preview renderer...
                </div>
              </div>
            )}

            {/* Status overlay */}
            {isInitialized && (
              <div
                className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded"
                data-oid=":nmhqh:"
              >
                {previewFrame ? "Live" : "Updating..."}
              </div>
            )}
          </>
        ) : (
          <div className="text-muted-foreground" data-oid="ctk5oih">
            Preview disabled - Click the eye icon to enable
          </div>
        )}
      </div>

      {/* Controls Panel */}
      {previewEnabled && (
        <div className="border-t" data-oid="jzwq2p5">
          {/* Cache Stats */}
          <div className="p-2 border-b bg-muted/30" data-oid="n_2.e9-">
            <div className="flex items-center justify-between text-xs" data-oid="8zt62kg">
              <span data-oid="xi2qqif">Performance</span>
              <div className="flex gap-4" data-oid="whys9ju">
                {getCacheStats()}
                <span data-oid="-95moz_">FPS: {quality.fps}</span>
                <span data-oid="gh7olmz">Resolution: {(quality.resolution * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Effect Chain List */}
          {showEffects && (
            <div className="p-4" data-oid="7k7lqht">
              <EffectChainList data-oid="f.8-49v" />
            </div>
          )}

          {/* Preset Gallery */}
          {showPresets && (
            <div className="p-4" data-oid="idoxsqt">
              <PresetGallery data-oid="g0bz6gi" />
            </div>
          )}

          {/* Quality Controls */}
          {showQuality && (
            <div className="p-4" data-oid="nchs6mn">
              <QualityControls quality={quality} gpuTier={gpuTier} onChange={setQuality} data-oid="zjixmz7" />
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

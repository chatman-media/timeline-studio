// Analysis markers layer for Timeline

import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, Camera, Eye, Heart, PlayCircle, Star, TrendingUp, Users, Volume2, Zap } from "lucide-react"
import React, { useMemo } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { type TimelineAnalysisHook, useTimelineAnalysis } from "../../hooks/use-timeline-analysis"

interface AnalysisMarkersLayerProps {
  timelineWidth: number
  timelineDuration: number
  pixelsPerSecond: number
  currentTime: number
  className?: string
  onMarkerClick?: (marker: TimelineAnalysisHook["markers"][0]) => void
}

export function AnalysisMarkersLayer({
  timelineWidth,
  timelineDuration,
  pixelsPerSecond,
  currentTime,
  className,
  onMarkerClick,
}: AnalysisMarkersLayerProps) {
  const { markers, visibleMarkerTypes, markerOpacity, jumpToScene, jumpToMoment, state } = useTimelineAnalysis()

  // Filter visible markers
  const visibleMarkers = useMemo(() => {
    return markers.filter((marker) => visibleMarkerTypes.has(marker.type))
  }, [markers, visibleMarkerTypes])

  // Group markers by type for layering
  const markersByType = useMemo(() => {
    const groups = {
      scene: [] as typeof markers,
      moment: [] as typeof markers,
      quality: [] as typeof markers,
      person: [] as typeof markers,
    }

    visibleMarkers.forEach((marker) => {
      if (marker.type in groups) {
        groups[marker.type as keyof typeof groups].push(marker)
      }
    })

    return groups
  }, [visibleMarkers])

  const handleMarkerClick = (marker: TimelineAnalysisHook["markers"][0]) => {
    if (onMarkerClick) {
      onMarkerClick(marker)
    } else {
      // Default behavior - jump to marker
      if (marker.type === "scene") {
        jumpToScene(marker.data?.id)
      } else if (marker.type === "moment") {
        jumpToMoment(marker.data?.id)
      }
    }
  }

  const getMarkerIcon = (type: string, data?: any) => {
    switch (type) {
      case "scene":
        return Camera
      case "moment":
        const momentType = data?.moment_type
        switch (momentType) {
          case "ActionClimax":
            return Zap
          case "EmotionalPeak":
            return Heart
          case "AudioPeak":
            return Volume2
          case "QualityPeak":
            return TrendingUp
          default:
            return Star
        }
      case "quality":
        return AlertTriangle
      case "person":
        return Users
      default:
        return PlayCircle
    }
  }

  const renderMarkerTrack = (trackMarkers: typeof markers, trackType: string, yOffset: number, height: number) => {
    return (
      <div className="absolute left-0 w-full pointer-events-none" style={{ top: yOffset, height }}>
        <AnimatePresence>
          {trackMarkers.map((marker) => {
            const x = marker.timestamp * pixelsPerSecond
            const width = marker.duration ? marker.duration * pixelsPerSecond : 2
            const Icon = getMarkerIcon(marker.type, marker.data)

            // Calculate opacity based on confidence and settings
            const opacity = (marker.confidence * markerOpacity).toFixed(2)

            return (
              <motion.div
                key={marker.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute pointer-events-auto cursor-pointer"
                style={{
                  left: x,
                  width: Math.max(width, 2),
                  height: "100%",
                }}
                onClick={() => handleMarkerClick(marker)}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative h-full">
                        {/* Background bar for duration-based markers */}
                        {marker.duration && marker.duration > 0.1 && (
                          <div
                            className="absolute top-0 h-full rounded opacity-20"
                            style={{
                              backgroundColor: marker.color,
                              width: width,
                            }}
                          />
                        )}

                        {/* Marker icon */}
                        <div
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center",
                            "transition-all hover:scale-110 hover:z-10",
                            trackType === "moment" ? "w-5 h-5" : "w-4 h-4",
                          )}
                          style={{
                            backgroundColor: marker.color,
                            opacity,
                            left: marker.duration ? 0 : -2, // Center single-point markers
                          }}
                        >
                          <Icon className={cn("text-white", trackType === "moment" ? "w-3 h-3" : "w-2.5 h-2.5")} />
                        </div>

                        {/* Confidence indicator */}
                        {marker.confidence < 0.7 && (
                          <div
                            className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full border border-white"
                            title={`Уверенность: ${Math.round(marker.confidence * 100)}%`}
                          />
                        )}
                      </div>
                    </TooltipTrigger>

                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-1">
                        <div className="font-semibold flex items-center gap-1">
                          <Icon className="w-3 h-3" />
                          {marker.title}
                        </div>
                        {marker.description && (
                          <div className="text-xs text-muted-foreground">{marker.description}</div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Время: {marker.timestamp.toFixed(1)}с{marker.duration && ` (${marker.duration.toFixed(1)}с)`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Уверенность: {Math.round(marker.confidence * 100)}%
                        </div>
                        {marker.data?.quality_score && (
                          <div className="text-xs text-muted-foreground">
                            Качество: {Math.round(marker.data.quality_score * 100)}%
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    )
  }

  if (!state.activeProject || visibleMarkers.length === 0) {
    return null
  }

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {/* Analysis status indicator */}
      {state.isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="absolute top-1 right-1 bg-blue-500/90 text-white px-2 py-1 rounded text-xs flex items-center gap-1 pointer-events-auto"
        >
          <div className="w-2 h-2 animate-spin rounded-full border border-white border-t-transparent" />
          Анализ {state.analysisProgress}%
        </motion.div>
      )}

      {/* Marker tracks - layered by type */}
      <div className="relative h-full">
        {/* Scene markers - bottom layer */}
        {renderMarkerTrack(markersByType.scene, "scene", 0, 16)}

        {/* Quality markers - middle layer */}
        {renderMarkerTrack(markersByType.quality, "quality", 18, 12)}

        {/* Moment markers - top layer */}
        {renderMarkerTrack(markersByType.moment, "moment", 32, 16)}

        {/* Person markers - very top */}
        {renderMarkerTrack(markersByType.person, "person", 50, 12)}
      </div>

      {/* Current time indicator line overlay */}
      {currentTime > 0 && currentTime <= timelineDuration && (
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-white/80 pointer-events-none z-10"
          style={{ left: currentTime * pixelsPerSecond }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}

      {/* Legend */}
      {visibleMarkers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm rounded p-2 text-xs text-white pointer-events-auto"
        >
          <div className="flex items-center gap-3">
            {visibleMarkerTypes.has("scene") && markersByType.scene.length > 0 && (
              <div className="flex items-center gap-1">
                <Camera className="w-3 h-3" />
                <span>Сцены</span>
              </div>
            )}
            {visibleMarkerTypes.has("moment") && markersByType.moment.length > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                <span>Моменты</span>
              </div>
            )}
            {visibleMarkerTypes.has("quality") && markersByType.quality.length > 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Качество</span>
              </div>
            )}
            {visibleMarkerTypes.has("person") && markersByType.person.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Персоны</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

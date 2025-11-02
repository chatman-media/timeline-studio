// Enhanced Timeline AI Overlay - integrates with Analysis Dashboard system

import { AnimatePresence, motion } from "framer-motion"
import { BarChart3, Eye, EyeOff, Settings } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useTimelineAnalysis } from "../../hooks/use-timeline-analysis"
import { AnalysisControlPanel } from "../analysis-layers/analysis-control-panel"
import { AnalysisMarkersLayer } from "../analysis-layers/analysis-markers-layer"

interface EnhancedTimelineAIOverlayProps {
  timelineWidth: number
  timelineDuration: number
  pixelsPerSecond: number
  currentTime: number
  className?: string
}

export function EnhancedTimelineAIOverlay({
  timelineWidth,
  timelineDuration,
  pixelsPerSecond,
  currentTime,
  className,
}: EnhancedTimelineAIOverlayProps) {
  const { state, markers, visibleMarkerTypes } = useTimelineAnalysis()

  const [showControlPanel, setShowControlPanel] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const hasActiveAnalysis = state.activeProject !== null
  const hasMarkers = markers.length > 0
  const isAnalyzing = state.isAnalyzing

  if (!isVisible) {
    return (
      <div className={cn("absolute top-2 right-2 z-20", className)}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVisible(true)}
                className="bg-background/80 backdrop-blur-sm"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Показать анализ AI</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={cn("absolute inset-0 pointer-events-none", className)}>
        {/* Analysis Markers Layer */}
        {hasActiveAnalysis && hasMarkers && (
          <AnalysisMarkersLayer
            timelineWidth={timelineWidth}
            timelineDuration={timelineDuration}
            pixelsPerSecond={pixelsPerSecond}
            currentTime={currentTime}
            className="pointer-events-auto"
          />
        )}

        {/* Top Controls */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-2 pointer-events-auto">
          {/* Analysis status indicator */}
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-blue-500/90 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm"
            >
              <div className="w-2 h-2 animate-spin rounded-full border border-white border-t-transparent" />
              Анализ {state.analysisProgress}%
            </motion.div>
          )}

          {/* Project status */}
          {hasActiveAnalysis && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/90 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm"
            >
              <BarChart3 className="w-3 h-3" />
              {markers.length} маркеров
            </motion.div>
          )}

          {/* Control buttons */}
          <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1">
            {/* Settings button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showControlPanel ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowControlPanel(!showControlPanel)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showControlPanel ? "Скрыть настройки" : "Настройки анализа"}</TooltipContent>
            </Tooltip>

            {/* Visibility toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
                  <EyeOff className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Скрыть анализ AI</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Control Panel */}
        <AnimatePresence>
          {showControlPanel && (
            <motion.div
              initial={{ opacity: 0, x: 20, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 20, y: -20 }}
              className="absolute top-16 right-2 z-30 pointer-events-auto"
            >
              <AnalysisControlPanel onClose={() => setShowControlPanel(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick stats overlay */}
        {hasActiveAnalysis && hasMarkers && !showControlPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 text-xs pointer-events-auto"
          >
            <div className="flex items-center gap-3">
              {Object.entries(
                markers.reduce(
                  (acc, marker) => {
                    if (visibleMarkerTypes.has(marker.type)) {
                      acc[marker.type] = (acc[marker.type] || 0) + 1
                    }
                    return acc
                  },
                  {} as Record<string, number>,
                ),
              ).map(([type, count]) => (
                <div key={type} className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: getTypeColor(type),
                    }}
                  />
                  <span className="capitalize">
                    {getTypeLabel(type)}: {count}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!hasActiveAnalysis && !isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background/80 backdrop-blur-sm rounded-lg p-6 text-center max-w-sm"
            >
              <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-medium mb-1">AI Анализ не активен</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Создайте проект анализа для получения AI-инсайтов по вашему контенту
              </p>
              <Button size="sm" onClick={() => setShowControlPanel(true)} className="pointer-events-auto">
                Настроить анализ
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

// Helper functions
function getTypeColor(type: string): string {
  switch (type) {
    case "scene":
      return "#3b82f6"
    case "moment":
      return "#f59e0b"
    case "quality":
      return "#ef4444"
    case "person":
      return "#8b5cf6"
    default:
      return "#6b7280"
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "scene":
      return "сцены"
    case "moment":
      return "моменты"
    case "quality":
      return "качество"
    case "person":
      return "персоны"
    default:
      return type
  }
}

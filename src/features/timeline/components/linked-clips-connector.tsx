/**
 * Компонент для отображения визуальной связи между linked клипами
 */

import { AnimatePresence, motion } from "motion/react"
import { useMemo } from "react"

import { cn } from "@/lib/utils"

import { useTimeline } from "../hooks/use-timeline"

import type { TimelineClip } from "../types/timeline"

interface LinkedClipsConnectorProps {
  className?: string
  timelineWidth: number
  timelineHeight: number
  pixelsPerSecond: number
  trackHeight: number
  trackPositions: Record<string, number> // trackId -> y position
  showConnections?: boolean
  animateConnections?: boolean
}

interface ClipPosition {
  clip: TimelineClip
  x: number
  y: number
  width: number
  height: number
  trackId: string
}

interface LinkedConnection {
  id: string
  clip1: ClipPosition
  clip2: ClipPosition
  type: "video-audio" | "audio-video" | "multi-camera"
  isActive: boolean
  isHovered: boolean
}

export function LinkedClipsConnector({
  className,
  timelineWidth,
  timelineHeight,
  pixelsPerSecond,
  trackHeight,
  trackPositions,
  showConnections = true,
  animateConnections = true,
}: LinkedClipsConnectorProps) {
  const { project } = useTimeline()

  const timeToPixel = (time: number) => time * pixelsPerSecond

  // Собираем все клипы и их позиции
  const clipPositions = useMemo((): ClipPosition[] => {
    if (!project) return []

    const positions: ClipPosition[] = []

    const processClips = (clips: TimelineClip[], trackId: string) => {
      clips.forEach((clip) => {
        const trackY = trackPositions[trackId] || 0
        const position: ClipPosition = {
          clip,
          x: timeToPixel(clip.startTime),
          y: trackY,
          width: timeToPixel(clip.duration),
          height: trackHeight,
          trackId,
        }
        positions.push(position)
      })
    }

    // Обрабатываем глобальные треки
    project.globalTracks?.forEach((track) => {
      processClips(track.clips as any, track.id)
    })

    // Обрабатываем секции
    project.sections?.forEach((section) => {
      section.tracks?.forEach((track) => {
        processClips(track.clips as any, track.id)
      })
    })

    return positions
  }, [project, trackPositions, timeToPixel, trackHeight])

  // Находим связанные клипы
  const linkedConnections = useMemo((): LinkedConnection[] => {
    const connections: LinkedConnection[] = []

    clipPositions.forEach((position1) => {
      const { clip: clip1 } = position1

      // Проверяем, есть ли связанный клип
      if (clip1.linkedClipId) {
        const position2 = clipPositions.find((pos) => pos.clip.id === clip1.linkedClipId)

        if (position2) {
          const { clip: clip2 } = position2

          // Определяем тип связи
          // TODO: В новой архитектуре mediaFile не доступен, нужно определять тип по trackId или другим критериям
          const type: LinkedConnection["type"] = "video-audio" // Временное значение по умолчанию

          const connection: LinkedConnection = {
            id: `${clip1.id}-${clip2.id}`,
            clip1: position1,
            clip2: position2,
            type,
            isActive: clip1.isSelected || clip2.isSelected,
            isHovered: false, // Будет обновляться через состояние
          }

          connections.push(connection)
        }
      }
    })

    return connections
  }, [clipPositions])

  if (!showConnections || linkedConnections.length === 0) {
    return null
  }

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      <svg width={timelineWidth} height={timelineHeight} className="absolute inset-0" style={{ zIndex: 1 }}>
        <defs>
          {/* Градиенты для разных типов связей */}
          <linearGradient id="video-audio-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="audio-video-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="multi-camera-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
          </linearGradient>

          {/* Фильтры для свечения */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <AnimatePresence>
          {linkedConnections.map((connection) => {
            const { clip1, clip2, type, isActive } = connection

            // Вычисляем точки соединения
            const clip1Center = {
              x: clip1.x + clip1.width / 2,
              y: clip1.y + clip1.height / 2,
            }

            const clip2Center = {
              x: clip2.x + clip2.width / 2,
              y: clip2.y + clip2.height / 2,
            }

            // Создаем кривую Безье для соединения
            const controlOffset = Math.abs(clip2Center.y - clip1Center.y) * 0.3
            const controlPoint1 = {
              x: clip1Center.x + controlOffset,
              y: clip1Center.y,
            }
            const controlPoint2 = {
              x: clip2Center.x - controlOffset,
              y: clip2Center.y,
            }

            const pathData = `M ${clip1Center.x} ${clip1Center.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${clip2Center.x} ${clip2Center.y}`

            const strokeColor =
              type === "video-audio"
                ? "url(#video-audio-gradient)"
                : type === "audio-video"
                  ? "url(#audio-video-gradient)"
                  : "url(#multi-camera-gradient)"

            return (
              <motion.g
                key={connection.id}
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{
                  opacity: isActive ? 1 : 0.4,
                  pathLength: 1,
                }}
                exit={{ opacity: 0, pathLength: 0 }}
                transition={{
                  duration: animateConnections ? 0.6 : 0,
                  ease: "easeOut",
                }}
              >
                {/* Основная линия связи */}
                <motion.path
                  d={pathData}
                  stroke={strokeColor}
                  strokeWidth={isActive ? 3 : 2}
                  fill="none"
                  filter={isActive ? "url(#glow)" : undefined}
                  strokeDasharray={type === "multi-camera" ? "8,4" : "none"}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: animateConnections ? 0.8 : 0,
                    ease: "easeInOut",
                  }}
                />

                {/* Точки соединения */}
                <motion.circle
                  cx={clip1Center.x}
                  cy={clip1Center.y}
                  r={isActive ? 6 : 4}
                  fill={strokeColor}
                  stroke="white"
                  strokeWidth={2}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    duration: animateConnections ? 0.3 : 0,
                    delay: animateConnections ? 0.4 : 0,
                  }}
                />

                <motion.circle
                  cx={clip2Center.x}
                  cy={clip2Center.y}
                  r={isActive ? 6 : 4}
                  fill={strokeColor}
                  stroke="white"
                  strokeWidth={2}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    duration: animateConnections ? 0.3 : 0,
                    delay: animateConnections ? 0.4 : 0,
                  }}
                />

                {/* Центральная иконка типа связи */}
                <motion.g
                  transform={`translate(${(clip1Center.x + clip2Center.x) / 2}, ${(clip1Center.y + clip2Center.y) / 2})`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: animateConnections ? 0.3 : 0,
                    delay: animateConnections ? 0.6 : 0,
                  }}
                >
                  <circle r={12} fill="white" stroke={strokeColor} strokeWidth={2} />

                  {/* Иконка в зависимости от типа */}
                  {type === "video-audio" && (
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#374151"
                    >
                      V→A
                    </text>
                  )}

                  {type === "audio-video" && (
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#374151"
                    >
                      A→V
                    </text>
                  )}

                  {type === "multi-camera" && (
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#374151"
                    >
                      MC
                    </text>
                  )}
                </motion.g>
              </motion.g>
            )
          })}
        </AnimatePresence>
      </svg>

      {/* Подписи для активных соединений */}
      <AnimatePresence>
        {linkedConnections
          .filter((connection) => connection.isActive)
          .map((connection) => {
            const { clip1, clip2, type } = connection
            const centerX = (clip1.x + clip1.width / 2 + clip2.x + clip2.width / 2) / 2
            const centerY = (clip1.y + clip1.height / 2 + clip2.y + clip2.height / 2) / 2

            const label =
              type === "video-audio"
                ? "Video → Audio Link"
                : type === "audio-video"
                  ? "Audio → Video Link"
                  : "Multi-Camera Link"

            return (
              <motion.div
                key={`${connection.id}-label`}
                className="absolute pointer-events-none"
                style={{
                  left: centerX - 75,
                  top: centerY - 30,
                  width: 150,
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-md border text-xs font-medium text-center shadow-lg">
                  {label}
                </div>
              </motion.div>
            )
          })}
      </AnimatePresence>
    </div>
  )
}

export default LinkedClipsConnector

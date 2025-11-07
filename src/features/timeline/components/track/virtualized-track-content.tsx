/**
 * VirtualizedTrackContent - Оптимизированное содержимое трека
 * Рендерит только видимые клипы для улучшения производительности
 */

import { useDroppable } from "@dnd-kit/core"
import { memo, useCallback, useMemo } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { useClipGroups } from "../../hooks/use-clip-groups"
import { useDragDropTimeline } from "../../hooks/use-drag-drop-timeline"
import { useTimeline } from "../../hooks/use-timeline"
import { useTimelineSelection } from "../../hooks/use-timeline-selection"
import { useTrackTransitionCollisions } from "../../hooks/use-transition-collisions"
import { useVirtualizedClips } from "../../hooks/use-virtualized-clips"
import { addTransitionBetweenClips, getTrackTransitions } from "../../services/timeline-transition-manager"
import type { TimelineTrack } from "../../types"
import { OptimizedClip } from "../clip/optimized-clip"
import { CollapsedGroup } from "../clip-groups/collapsed-group"
import { TransitionCollisionIndicator } from "../transition/transition-collision-indicator"
import { TransitionDropZone } from "../transition/transition-drop-zone"
import { TimelineTransitionComponent } from "../transitions/timeline-transition"
import { TrackRollHandles } from "./track-roll-handles"

const logger = createLogger("VirtualizedTrackContent")

interface VirtualizedTrackContentProps {
  track: TimelineTrack
  timeScale: number // Пикселей на секунду
  currentTime: number
  containerWidth: number
  scrollOffset: number
  onUpdate?: (updates: Partial<TimelineTrack>) => void
}

export const VirtualizedTrackContent = memo(function VirtualizedTrackContent({
  track,
  timeScale,
  currentTime,
  containerWidth,
  scrollOffset,
  onUpdate,
}: VirtualizedTrackContentProps) {
  const { dragState, isValidDropTarget } = useDragDropTimeline()
  const { selectClips } = useTimelineSelection()
  const { project, saveProject } = useTimeline()
  const { groups, toggleCollapse } = useClipGroups()

  // Обнаружение коллизий переходов
  const collisions = useTrackTransitionCollisions(track.id)

  // Используем виртуализацию для клипов
  const { visibleClips, shouldRenderDetails, getPreviewQuality } = useVirtualizedClips({
    clips: track.clips,
    timeScale,
    containerWidth,
    scrollOffset,
    overscan: 5,
  })

  // Setup droppable functionality
  const { isOver, setNodeRef } = useDroppable({
    id: `track-${track.id}`,
    data: {
      trackId: track.id,
      trackType: track.type,
    },
  })

  const isValidTarget = isValidDropTarget(track.id, track.type)
  const showDropFeedback = dragState.isDragging && isOver && isValidTarget

  // Получаем переходы для этого трека
  const trackTransitions = useMemo(() => {
    if (!project) return []
    return getTrackTransitions(project, track.id)
  }, [project, track.id])

  // Обработчики
  const handleClipUpdate = useCallback(
    (clipId: string, updates: Record<string, any>) => {
      const updatedClips = track.clips.map((clip) => (clip.id === clipId ? { ...clip, ...updates } : clip))
      onUpdate?.({ clips: updatedClips })
    },
    [track.clips, onUpdate],
  )

  const handleClipRemove = useCallback(
    (clipId: string) => {
      const updatedClips = track.clips.filter((clip) => clip.id !== clipId)
      onUpdate?.({ clips: updatedClips })
    },
    [track.clips, onUpdate],
  )

  const handleTransitionDrop = useCallback(
    async (leftClipId: string, rightClipId: string, transition: Record<string, any>) => {
      if (!project) return

      try {
        addTransitionBetweenClips(project, track.id, leftClipId, rightClipId, transition)
        await saveProject()
        logger.info("Переход успешно добавлен")
      } catch (error) {
        logger.error("Failed to add transition:", { error })
      }
    },
    [project, track.id, saveProject],
  )

  // Оптимизированная сетка - рендерим только видимые линии
  const gridLines = useMemo(() => {
    const lines = []
    const step = 10 // каждые 10 секунд
    const startTime = Math.floor(scrollOffset / timeScale / step) * step
    const endTime = Math.ceil((scrollOffset + containerWidth) / timeScale / step) * step

    for (let time = startTime; time <= endTime; time += step) {
      lines.push(
        <div key={time} className="absolute top-0 bottom-0 w-px bg-border/30" style={{ left: time * timeScale }} />,
      )
    }
    return lines
  }, [timeScale, scrollOffset, containerWidth])

  // Обрабатываем группы для видимых клипов
  const { visibleClipsWithGroups, collapsedGroups } = useMemo(() => {
    const visibleClipIds = new Set(visibleClips.map((vc) => vc.clip.id))
    const visibleClipsWithGroups: typeof visibleClips = []
    const collapsedGroups: Array<{ group: any; clips: typeof track.clips }> = []

    // Находим группы, которые содержат видимые клипы
    const relevantGroups = groups.filter((group) => group.clips.some((ref) => visibleClipIds.has(ref.clipId)))

    visibleClips.forEach((visibleClip) => {
      const group = relevantGroups.find((g) => g.clips.some((ref) => ref.clipId === visibleClip.clip.id))

      if (group && group.collapsed) {
        // Клип в свернутой группе
        let groupEntry = collapsedGroups.find((cg) => cg.group.id === group.id)
        if (!groupEntry) {
          // Собираем все клипы этой группы на треке
          const groupClips = track.clips.filter((clip) => group.clips.some((ref) => ref.clipId === clip.id))
          groupEntry = { group, clips: groupClips }
          collapsedGroups.push(groupEntry)
        }
      } else {
        // Видимый клип
        visibleClipsWithGroups.push(visibleClip)
      }
    })

    return { visibleClipsWithGroups, collapsedGroups }
  }, [visibleClips, groups, track.clips])

  return (
    <div
      ref={setNodeRef}
      data-track-id={track.id}
      data-testid={`track-container-${track.id}`}
      className={cn(
        "relative h-full w-full",
        "bg-background border-l border-border",
        showDropFeedback && "bg-primary/10 border-primary",
        dragState.isDragging && isValidTarget && "border-dashed border-2",
        dragState.isDragging && !isValidTarget && "opacity-50",
      )}
    >
      {/* Drop zone visual feedback */}
      {showDropFeedback && (
        <div className="absolute inset-0 bg-primary/5 border-2 border-primary border-dashed rounded-md pointer-events-none z-30">
          <div className="flex items-center justify-center h-full">
            <span className="text-primary font-medium">Drop here</span>
          </div>
        </div>
      )}

      {/* Insertion indicator */}
      {dragState.dropPosition?.trackId === track.id && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary z-25 pointer-events-none"
          style={{ left: dragState.dropPosition.startTime * timeScale }}
        />
      )}

      {/* Оптимизированная сетка - только видимые линии */}
      <div className="absolute inset-0 pointer-events-none">{gridLines}</div>

      {/* Playhead */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
        style={{ left: currentTime * timeScale }}
      />

      {/* Виртуализированные клипы */}
      <div className="relative h-full">
        {/* Отображаем только видимые клипы */}
        {visibleClipsWithGroups.map(({ clip, left, width, isFullyVisible }) => (
          <div key={clip.id} className="absolute" style={{ left: `${left}px`, width: `${width}px` }}>
            <OptimizedClip
              clip={clip}
              track={track}
              timeScale={timeScale}
              onUpdate={(updates) => handleClipUpdate(clip.id, updates)}
              onRemove={() => handleClipRemove(clip.id)}
              // Оптимизация: передаем параметры качества
              renderDetails={shouldRenderDetails(clip)}
              previewQuality={getPreviewQuality(clip)}
              isFullyVisible={isFullyVisible}
            />
          </div>
        ))}

        {/* Свернутые группы */}
        {collapsedGroups.map(({ group, clips }) => {
          // Вычисляем позицию группы
          const startTime = Math.min(...clips.map((c) => c.startTime))
          const endTime = Math.max(...clips.map((c) => c.startTime + c.duration))
          const left = startTime * timeScale
          const width = (endTime - startTime) * timeScale

          // Показываем группу только если она в viewport
          if (left + width < scrollOffset || left > scrollOffset + containerWidth) {
            return null
          }

          return (
            <div key={group.id} className="absolute" style={{ left: `${left}px`, width: `${width}px` }}>
              <CollapsedGroup
                group={group}
                clips={clips}
                timeScale={timeScale}
                onToggleCollapse={() => toggleCollapse(group.id)}
                onSelect={() => selectClips(clips.map((c) => c.id))}
                isSelected={clips.some((c) => c.isSelected)}
              />
            </div>
          )
        })}

        {/* Переходы между видимыми клипами */}
        {visibleClipsWithGroups.length > 1 &&
          visibleClipsWithGroups.slice(0, -1).map((leftItem, index) => {
            const rightItem = visibleClipsWithGroups[index + 1]
            const leftClip = leftItem.clip
            const rightClip = rightItem.clip

            // Проверяем есть ли переход
            const outTransition = leftClip.transitions?.find((t) => t.type === "out")
            const inTransition = rightClip.transitions?.find((t) => t.type === "in")

            if (outTransition && inTransition && outTransition.transitionId === inTransition.transitionId) {
              return (
                <TimelineTransitionComponent
                  key={`transition-${leftClip.id}-${rightClip.id}`}
                  leftClipId={leftClip.id}
                  rightClipId={rightClip.id}
                  leftClipEnd={leftClip.startTime + leftClip.duration}
                  rightClipStart={rightClip.startTime}
                  transition={outTransition}
                  timeScale={timeScale}
                  trackHeight={track.height}
                  onUpdate={(updates) => {
                    logger.info("Updating transition:", { transitionId: outTransition.id, updates })
                  }}
                  onDelete={async () => {
                    logger.info("Deleting transition:", { transitionId: outTransition.id })
                    await saveProject()
                  }}
                />
              )
            }

            // Зона для сброса перехода
            return (
              <TransitionDropZone
                key={`drop-${leftClip.id}-${rightClip.id}`}
                leftClip={leftClip}
                rightClip={rightClip}
                trackId={track.id}
                timeScale={timeScale}
                onDrop={(transition) => handleTransitionDrop(leftClip.id, rightClip.id, transition)}
              />
            )
          })}

        {/* Roll edit handles - только для видимых клипов */}
        <TrackRollHandles
          track={{
            ...track,
            clips: visibleClipsWithGroups.map((vc) => vc.clip),
          }}
          timeScale={timeScale}
          onRollStart={(leftClipId, rightClipId, mouseX) => {
            logger.info("Roll edit started:", { leftClipId, rightClipId, mouseX })
          }}
        />
      </div>

      {/* Индикатор коллизий */}
      {collisions.length > 0 && (
        <div className="absolute top-1 right-1 z-30">
          <TransitionCollisionIndicator
            collisions={collisions}
            compact
            onResolve={(collision) => {
              logger.info("Resolve collision:", { collision })
            }}
          />
        </div>
      )}

      {/* Empty state */}
      {track.clips.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="text-sm">Перетащите медиафайлы сюда</div>
            <div className="text-xs mt-1">или используйте Browser</div>
          </div>
        </div>
      )}
    </div>
  )
})

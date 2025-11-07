/**
 * TrackContent - Содержимое трека (клипы на временной шкале)
 */

import { useDroppable } from "@dnd-kit/core"
import { memo, useCallback, useMemo } from "react"
import { createLogger } from "@/lib/tauri-logger"
// Удалена зависимость от @/features/drag-drop для устранения конфликта архитектур
// Оставляем только @dnd-kit/core систему
import { cn } from "@/lib/utils"
import { useClipGroups } from "../../hooks/use-clip-groups"
import { useDragDropTimeline } from "../../hooks/use-drag-drop-timeline"
import { useTimeline } from "../../hooks/use-timeline"
import { useTimelineSelection } from "../../hooks/use-timeline-selection"
import { useTrackTransitionCollisions } from "../../hooks/use-transition-collisions"
import { addTransitionBetweenClips, getTrackTransitions } from "../../services/timeline-transition-manager"
import type { TimelineTrack } from "../../types"
import { Clip } from "../clip/clip"
import { CollapsedGroup } from "../clip-groups/collapsed-group"
import { TransitionCollisionIndicator } from "../transition/transition-collision-indicator"
import { TransitionDropZone } from "../transition/transition-drop-zone"
import { TimelineTransitionComponent } from "../transitions/timeline-transition"
import { TrackRollHandles } from "./track-roll-handles"

const logger = createLogger({ module: "TrackContent" })

interface TrackContentProps {
  track: TimelineTrack
  timeScale: number // Пикселей на секунду
  currentTime: number
  onUpdate?: (updates: Partial<TimelineTrack>) => void
}

export const TrackContent = memo(function TrackContent({ track, timeScale, currentTime, onUpdate }: TrackContentProps) {
  const { dragState, isValidDropTarget } = useDragDropTimeline()
  const { selectClips } = useTimelineSelection()
  const { project, saveProject } = useTimeline()
  const { groups, toggleCollapse } = useClipGroups()

  // Обнаружение коллизий переходов на треке
  const collisions = useTrackTransitionCollisions(track.id)

  // Setup droppable functionality for @dnd-kit
  const { isOver, setNodeRef } = useDroppable({
    id: `track-${track.id}`,
    data: {
      trackId: track.id,
      trackType: track.type,
    },
  })

  // Удалён дублирующий useDropZone для устранения конфликта архитектур
  // Теперь используем только @dnd-kit систему через handleDragEnd в useDragDropTimeline

  // Check if this track is a valid drop target
  const isValidTarget = isValidDropTarget(track.id, track.type)
  const showDropFeedback = dragState.isDragging && isOver && isValidTarget

  // Получаем переходы для этого трека
  const trackTransitions = useMemo(() => {
    if (!project) return []
    return getTrackTransitions(project, track.id)
  }, [project, track.id])

  // Мемоизируем отсортированные клипы и группы
  const { visibleClips, collapsedGroups } = useMemo(() => {
    const visibleClips: typeof track.clips = []
    const collapsedGroups: Array<{ group: any; clips: typeof track.clips }> = []

    // Находим группы, которые содержат клипы с этого трека
    const trackGroups = groups.filter((group) =>
      group.clips.some((ref) => track.clips.some((clip) => clip.id === ref.clipId)),
    )

    // Разделяем клипы на видимые и принадлежащие свернутым группам
    track.clips.forEach((clip) => {
      const group = trackGroups.find((g) => g.clips.some((ref) => ref.clipId === clip.id))

      if (group && group.collapsed) {
        // Клип в свернутой группе
        let groupEntry = collapsedGroups.find((cg) => cg.group.id === group.id)
        if (!groupEntry) {
          groupEntry = { group, clips: [] }
          collapsedGroups.push(groupEntry)
        }
        groupEntry.clips.push(clip)
      } else {
        // Видимый клип (не в группе или группа развернута)
        visibleClips.push(clip)
      }
    })

    // Сортируем видимые клипы
    visibleClips.sort((a, b) => a.startTime - b.startTime)

    return { visibleClips, collapsedGroups }
  }, [track.clips, groups])

  // Мемоизируем обработчики для предотвращения создания новых функций
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

  // Обработчик добавления перехода между клипами
  const handleTransitionDrop = useCallback(
    async (leftClipId: string, rightClipId: string, transition: Record<string, any>) => {
      if (!project) return

      try {
        const result = addTransitionBetweenClips(project, track.id, leftClipId, rightClipId, transition)

        // Обновляем проект через сохранение
        await saveProject()

        logger.info("Переход успешно добавлен к проекту")
      } catch (error) {
        logger.error("Failed to add transition:", error)
      }
    },
    [project, track.id, saveProject],
  )

  // Мемоизируем сетку временной шкалы
  const gridLines = useMemo(() => {
    const lines = []
    const maxTime = 300 // 5 минут
    const step = 10 // каждые 10 секунд
    for (let time = 0; time <= maxTime; time += step) {
      lines.push(
        <div key={time} className="absolute top-0 bottom-0 w-px bg-border/30" style={{ left: time * timeScale }} />,
      )
    }
    return lines
  }, [timeScale])

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

      {/* Сетка временной шкалы */}
      <div className="absolute inset-0 pointer-events-none">{gridLines}</div>

      {/* Playhead (указатель текущего времени) */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
        style={{ left: currentTime * timeScale }}
      />

      {/* Клипы и свернутые группы */}
      <div className="relative h-full">
        {/* Отображаем видимые клипы */}
        {visibleClips.map((clip) => (
          <Clip
            key={clip.id}
            clip={clip}
            track={track}
            timeScale={timeScale}
            onUpdate={(updates) => handleClipUpdate(clip.id, updates)}
            onRemove={() => handleClipRemove(clip.id)}
          />
        ))}

        {/* Отображаем свернутые группы */}
        {collapsedGroups.map(({ group, clips }) => (
          <CollapsedGroup
            key={group.id}
            group={group}
            clips={clips}
            timeScale={timeScale}
            onToggleCollapse={() => toggleCollapse(group.id)}
            onSelect={() => selectClips(clips.map((c) => c.id))}
            isSelected={clips.some((c) => c.isSelected)}
          />
        ))}

        {/* Переходы */}
        {visibleClips.length > 1 &&
          visibleClips.slice(0, -1).map((leftClip, index) => {
            const rightClip = visibleClips[index + 1]

            // Проверяем есть ли переход между этими клипами
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
                  trackHeight={48}
                  onUpdate={(updates) => {
                    // TODO: Обновление перехода через backend API
                    logger.info("Updating transition parameters:", outTransition.id, updates)
                  }}
                  onDelete={async () => {
                    // Удаление перехода через backend API
                    try {
                      // TODO: Добавить removeTransition команду в backend
                      logger.info("Deleting transition:", outTransition.id)
                      await saveProject()
                    } catch (error) {
                      logger.error("Failed to delete transition:", error)
                    }
                  }}
                />
              )
            }
            return null
          })}

        {/* Зоны для сброса переходов между клипами */}
        {visibleClips.length > 1 &&
          visibleClips.slice(0, -1).map((leftClip, index) => {
            const rightClip = visibleClips[index + 1]
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

        {/* Roll edit handles between adjacent clips */}
        <TrackRollHandles
          track={track}
          timeScale={timeScale}
          onRollStart={(leftClipId, rightClipId, mouseX) => {
            // This would typically trigger a roll edit operation
            logger.info("Roll edit started:", leftClipId, rightClipId, mouseX)
          }}
        />
      </div>

      {/* Индикатор коллизий переходов */}
      {collisions.length > 0 && (
        <div className="absolute top-1 right-1 z-30">
          <TransitionCollisionIndicator
            collisions={collisions}
            compact
            onResolve={(collision) => {
              logger.info("Resolve collision:", collision)
              // TODO: Интегрировать с системой исправления коллизий
            }}
          />
        </div>
      )}

      {/* Область для добавления клипов (drop zone) */}
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

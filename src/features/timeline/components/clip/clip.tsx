/**
 * Clip - Основной компонент клипа на Timeline
 */

import { memo, useCallback, useEffect, useMemo, useState } from "react"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useClipEditing } from "../../hooks/use-clip-editing"
import { useClipGroups } from "../../hooks/use-clip-groups"
import { useDebouncedDrag } from "../../hooks/use-debounced-drag"
import { useEditModeContext } from "../../hooks/use-edit-mode"
import { useJLCuts } from "../../hooks/use-jl-cuts"
import { useSlipSlide } from "../../hooks/use-slip-slide"
import { useSpeedRamping } from "../../hooks/use-speed-ramping"
import { useTimelinePersons } from "../../hooks/use-timeline-persons"
import { isSubtitleClip, type TimelineClip, type TimelineTrack } from "../../types"
import { EDIT_MODES } from "../../types/edit-modes"
import { getCutType } from "../../types/jl-cuts"
import { ClipAIIndicator } from "../ai-analysis/clip-ai-indicator"
import { ClipContextMenu } from "../clip-context-menu"
import { ClipEffectsPanel } from "../clip-effects-panel"
import { GroupIndicator } from "../clip-groups/group-indicator"
import { RateStretchHandle } from "../edit-tools/rate-stretch-handle"
import { SlipSlideHandles } from "../edit-tools/slip-slide-handles"
import { JLCutDragHandle, JLCutIndicator, JLCutTool, LinkedClipIndicator } from "../jl-cuts"
import { PersonIndicator } from "../person-indicators"
import { SpeedCurveEditor } from "../speed-ramping/speed-curve-editor"
import { AudioClip } from "./audio-clip"
import { ClipTrimHandles } from "./clip-trim-handles"
import { SubtitleClip } from "./subtitle-clip"
import { VideoClip } from "./video-clip"

interface ClipProps {
  clip: TimelineClip
  track: TimelineTrack
  timeScale: number // Пикселей на секунду
  onUpdate?: (updates: Partial<TimelineClip>) => void
  onRemove?: () => void
  className?: string
}

export const Clip = memo(function Clip({ clip, track, timeScale, onUpdate, onRemove, className }: ClipProps) {
  const { editMode } = useEditModeContext()
  const [isHovered, setIsHovered] = useState(false)
  const [showSpeedCurve, setShowSpeedCurve] = useState(false)
  const [showEffectsPanel, setShowEffectsPanel] = useState(false)
  const { getGroupByClip, toggleCollapse, lockGroup } = useClipGroups()
  const { getLinkedClip } = useJLCuts()
  const { getConfig } = useSpeedRamping()
  const { getPersonsForClip, getAppearancesForClip, showPersonDetail } = useTimelinePersons()
  const {
    startSlip,
    updateSlip,
    commitSlip,
    cancelSlip,
    startSlide,
    updateSlide,
    commitSlide,
    cancelSlide,
    preview: slipSlidePreview,
  } = useSlipSlide()

  const { isEditing, preview, handleTrimStart, handleTrimMove, handleTrimEnd } = useClipEditing(clip.id)

  // Получаем группу, если клип в ней находится
  const group = getGroupByClip(clip.id)

  // Получаем связанный клип для J/L cut
  const linkedClip = getLinkedClip(clip.id)

  // Получаем конфигурацию speed ramping
  const speedRampingConfig = getConfig(clip.id)

  // Получаем данные о персонах для клипа
  const clipPersons = getPersonsForClip(clip.id)
  const clipAppearances = getAppearancesForClip(clip.id)

  // Мемоизируем вычисления позиции и размеров
  const { left, width } = useMemo(
    () => ({
      left: (preview?.startTime ?? clip.startTime) * timeScale,
      width: Math.max((preview?.duration ?? clip.duration) * timeScale, 20), // Минимальная ширина 20px
    }),
    [clip.startTime, clip.duration, timeScale, preview],
  )

  // Выбираем специализированный компонент в зависимости от типа трека
  const renderClipContent = () => {
    switch (track.type) {
      case "video":
      case "image":
        return (
          <VideoClip clip={clip} track={track} pixelsPerSecond={timeScale} onUpdate={onUpdate} onRemove={onRemove} />
        )

      case "audio":
      case "music":
      case "voiceover":
      case "sfx":
      case "ambient":
        return <AudioClip clip={clip} track={track} onUpdate={onUpdate} onRemove={onRemove} />

      case "subtitle":
      case "title":
        if (isSubtitleClip(clip)) {
          return <SubtitleClip clip={clip} trackHeight={track.height} isSelected={clip.isSelected} />
        }
        return (
          <div className="h-full w-full bg-muted border border-border rounded flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Invalid subtitle clip</span>
          </div>
        )

      default:
        return (
          <div className="h-full w-full bg-muted border border-border rounded flex items-center justify-center">
            <span className="text-xs text-muted-foreground">{track.type}</span>
          </div>
        )
    }
  }

  // Handle slip/slide start
  const handleSlipSlideStart = useCallback(
    (mouseX: number) => {
      if (editMode === EDIT_MODES.SLIP) {
        startSlip(clip.id, mouseX)
      } else if (editMode === EDIT_MODES.SLIDE) {
        startSlide(clip.id, mouseX)
      }
    },
    [editMode, clip.id, startSlip, startSlide],
  )

  // Debounced drag для Slip/Slide операций
  const { debouncedDragUpdate } = useDebouncedDrag({
    delay: 16, // 60fps
    onDragCommit: (x) => {
      if (!slipSlidePreview || slipSlidePreview.clipId !== clip.id) return

      if (slipSlidePreview.mode === "slip") {
        updateSlip(x)
      } else {
        updateSlide(x)
      }
    },
  })

  // Обработка глобальных событий мыши для SLIP/SLIDE
  useEffect(() => {
    if (!slipSlidePreview || slipSlidePreview.clipId !== clip.id) return

    const handleMouseMove = (e: MouseEvent) => {
      // Используем debounced версию для оптимизации (60fps вместо 60+ calls/sec)
      debouncedDragUpdate(e.clientX)
    }

    const handleMouseUp = () => {
      if (slipSlidePreview.mode === "slip") {
        commitSlip()
      } else {
        commitSlide()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (slipSlidePreview.mode === "slip") {
          cancelSlip()
        } else {
          cancelSlide()
        }
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [slipSlidePreview, clip.id, debouncedDragUpdate, commitSlip, commitSlide, cancelSlip, cancelSlide])

  return (
    <>
      <ClipContextMenu
        clip={clip}
        onShowEffects={() => setShowEffectsPanel(true)}
        onShowTransitions={() => {
          /* TODO: Implement transitions panel */
        }}
        onShowFilters={() => {
          /* TODO: Implement filters panel */
        }}
      >
        <div
          className={cn(
            "absolute top-1 bottom-1 cursor-pointer",
            "transition-all duration-150",
            clip.isSelected && "ring-2 ring-primary ring-offset-1",
            clip.isLocked && "opacity-60 cursor-not-allowed",
            isEditing && "z-10",
            className,
          )}
          style={{
            left: `${left}px`,
            width: `${width}px`,
          }}
          data-testid="timeline-clip"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {renderClipContent()}

          {/* Linked clip indicator */}
          <LinkedClipIndicator isLinked={clip.isLinked || false} />

          {/* J/L Cut indicator */}
          {linkedClip && clip.audioOffset !== undefined && clip.audioOffset !== 0 && (
            <>
              <JLCutIndicator
                videoClip={track.type === "video" || track.type === "image" ? clip : linkedClip}
                audioClip={["audio", "music", "voiceover", "sfx", "ambient"].includes(track.type) ? clip : linkedClip}
                pixelsPerSecond={timeScale}
              />
              {/* J/L Cut drag handle */}
              <JLCutDragHandle
                clip={clip}
                linkedClip={linkedClip}
                cutType={getCutType(clip.audioOffset || 0)}
                pixelsPerSecond={timeScale}
              />
            </>
          )}

          {/* J/L Cut tool */}
          {isHovered && linkedClip && (
            <div className="absolute top-0 right-0 m-1 z-10">
              <JLCutTool clip={clip} />
            </div>
          )}

          {/* Group indicator */}
          {group && !group.collapsed && (
            <div className="absolute top-0 left-0 m-1 z-10">
              <GroupIndicator
                group={group}
                onToggleCollapse={() => toggleCollapse(group.id)}
                onToggleLock={() => lockGroup(group.id, !group.locked)}
                className="scale-75 origin-top-left"
              />
            </div>
          )}

          {/* AI Analysis indicator */}
          <ClipAIIndicator clip={clip} className="absolute top-1 left-1 z-10" />

          {/* Person indicators для видео клипов */}
          {(track.type === "video" || track.type === "image") && clipPersons.length > 0 && (
            <div className="absolute bottom-1 left-1 z-10">
              <PersonIndicator
                persons={clipPersons}
                appearances={clipAppearances}
                clipId={clip.id}
                compact={width < 80} // Компактный режим для узких клипов
                maxVisible={3}
                onClick={showPersonDetail}
              />
            </div>
          )}

          {/* Trim handles for regular trim/ripple modes */}
          {(editMode === EDIT_MODES.TRIM || editMode === EDIT_MODES.RIPPLE) && (
            <ClipTrimHandles
              onTrimStart={handleTrimStart}
              onTrimMove={handleTrimMove}
              onTrimEnd={handleTrimEnd}
              isSelected={clip.isSelected || false}
              disabled={clip.isLocked}
            />
          )}

          {/* Slip/Slide handles */}
          <SlipSlideHandles
            clip={{
              ...clip,
              startTime: preview?.startTime ?? clip.startTime,
              duration: preview?.duration ?? clip.duration,
              offset: preview?.offset ?? clip.offset,
            }}
            isHovered={isHovered}
            isActive={isEditing}
            timeScale={timeScale}
            onSlipStart={editMode === EDIT_MODES.SLIP ? handleSlipSlideStart : undefined}
            onSlideStart={editMode === EDIT_MODES.SLIDE ? handleSlipSlideStart : undefined}
          />

          {/* Rate Stretch handles */}
          <RateStretchHandle
            clip={{
              ...clip,
              startTime: preview?.startTime ?? clip.startTime,
              duration: preview?.duration ?? clip.duration,
              playbackRate: clip.playbackRate,
            }}
            isHovered={isHovered}
            isActive={isEditing}
            timeScale={timeScale}
            onRateStretchStart={handleTrimStart}
          />

          {/* Speed ramping indicator */}
          {speedRampingConfig && speedRampingConfig.enabled && (
            <div className="absolute top-1 right-1 z-10">
              <button
                className={cn(
                  "p-1 rounded bg-purple-500/20 hover:bg-purple-500/30 transition-colors",
                  showSpeedCurve && "bg-purple-500/40",
                )}
                onClick={() => setShowSpeedCurve(!showSpeedCurve)}
                title="Toggle Speed Curve Editor"
              >
                <svg className="w-3 h-3 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M3 12c0-3 1-6 4-6s4 3 4 6-1 6-4 6-4-3-4-6m8 0c0-3 1-6 4-6s4 3 4 6-1 6-4 6-4-3-4-6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Speed curve editor */}
          {showSpeedCurve && speedRampingConfig && speedRampingConfig.enabled && (
            <div className="absolute top-full mt-2 left-0 z-50">
              <SpeedCurveEditor
                clipId={clip.id}
                clipDuration={clip.duration}
                pixelsPerSecond={timeScale}
                height={speedRampingConfig.graphHeight || 120}
                onClose={() => setShowSpeedCurve(false)}
                className="shadow-lg"
              />
            </div>
          )}
        </div>
      </ClipContextMenu>

      {/* Диалог панели эффектов */}
      <Dialog open={showEffectsPanel} onOpenChange={setShowEffectsPanel}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <ClipEffectsPanel clip={clip} onClose={() => setShowEffectsPanel(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
})

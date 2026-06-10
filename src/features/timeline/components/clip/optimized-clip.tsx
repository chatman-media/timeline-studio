/**
 * OptimizedClip - Оптимизированный компонент клипа для виртуализации
 * Поддерживает различные уровни детализации в зависимости от размера и видимости
 */

import { Dialog, DialogContent } from "@timeline-studio/ui/components/dialog"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import type { SubtitleClip as SubtitleClipType } from "@/features/subtitles/types"
import { useEditModeContext } from "@/features/timeline/hooks/editing/use-edit-mode"
import { cn } from "@/lib/utils"
import { useClipGroups } from "../../hooks/clips/use-clip-groups"
import { useClipEditing } from "../../hooks/editing/use-clip-editing"
import { useJLCuts } from "../../hooks/editing/use-jl-cuts"
import { useSlipSlide } from "../../hooks/editing/use-slip-slide"
import { useSpeedRamping } from "../../hooks/speed-ramping/use-speed-ramping"
import { useTimelinePersons } from "../../hooks/state/use-timeline-persons"
import type { TimelineClip, TimelineTrack } from "../../types"
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

interface OptimizedClipProps {
  clip: TimelineClip
  track: TimelineTrack
  timeScale: number // Пикселей на секунду
  onUpdate?: (updates: Partial<TimelineClip>) => void
  onRemove?: () => void
  className?: string
  // Оптимизационные параметры
  renderDetails?: boolean
  previewQuality?: "low" | "medium" | "high"
  isFullyVisible?: boolean
}

export const OptimizedClip = memo(function OptimizedClip({
  clip,
  track,
  timeScale,
  onUpdate,
  onRemove,
  className,
  renderDetails = true,
  previewQuality = "medium",
  isFullyVisible = true,
}: OptimizedClipProps) {
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

  // Получаем связанные данные только если рендерим детали
  const group = renderDetails ? getGroupByClip(clip.id) : null
  const linkedClip = renderDetails ? getLinkedClip(clip.id) : null
  const speedRampingConfig = renderDetails ? getConfig(clip.id) : null
  const clipPersons =
    renderDetails && (track.type === "video" || track.type === "image") ? getPersonsForClip(clip.id) : []
  const clipAppearances = renderDetails && clipPersons.length > 0 ? getAppearancesForClip(clip.id) : []

  // Мемоизируем вычисления позиции и размеров
  const { left, width } = useMemo(
    () => ({
      left: (preview?.startTime ?? clip.startTime) * timeScale,
      width: Math.max((preview?.duration ?? clip.duration) * timeScale, 20),
    }),
    [clip.startTime, clip.duration, timeScale, preview],
  )

  // Type guard для SubtitleClip
  const isSubtitleClip = useCallback((clip: TimelineClip): clip is SubtitleClipType => {
    return clip.type === "subtitle" && "text" in clip
  }, [])

  // Упрощенный рендеринг для маленьких клипов
  const renderSimplifiedContent = useCallback(() => {
    const bgColor =
      {
        video: "bg-blue-500/20",
        image: "bg-purple-500/20",
        audio: "bg-green-500/20",
        music: "bg-pink-500/20",
        voiceover: "bg-orange-500/20",
        sfx: "bg-yellow-500/20",
        ambient: "bg-cyan-500/20",
        subtitle: "bg-gray-500/20",
        title: "bg-indigo-500/20",
      }[track.type] || "bg-muted"

    return (
      <div className={cn("h-full w-full rounded border border-border", bgColor)} data-oid="xqrehyq">
        <div className="p-1 text-xs text-foreground/70 truncate" data-oid="erhm.18">
          {clip.name || clip.mediaFile?.name || track.type}
        </div>
      </div>
    )
  }, [track.type, clip.name, clip.mediaFile?.name])

  // Выбираем рендеринг в зависимости от параметров
  const renderClipContent = useCallback(() => {
    // Если клип слишком маленький, показываем упрощенную версию
    if (!renderDetails || width < 50) {
      return renderSimplifiedContent()
    }

    // Полный рендеринг для больших клипов
    switch (track.type) {
      case "video":
      case "image":
        return (
          <VideoClip
            clip={clip}
            track={track}
            pixelsPerSecond={timeScale}
            onUpdate={onUpdate}
            onRemove={onRemove}
            data-oid="8cnv0d4"
          />
        )

      case "audio":
      case "music":
      case "voiceover":
      case "sfx":
      case "ambient":
        return <AudioClip clip={clip} track={track} onUpdate={onUpdate} onRemove={onRemove} data-oid="lqwu.se" />

      case "subtitle":
      case "title":
        if (isSubtitleClip(clip)) {
          return (
            <SubtitleClip
              clip={clip}
              trackHeight={track.height || 64}
              isSelected={clip.isSelected || false}
              data-oid=":j2og8c"
            />
          )
        }
        return renderSimplifiedContent()

      default:
        return renderSimplifiedContent()
    }
  }, [
    renderDetails,
    width,
    track.type,
    track.height,
    clip,
    timeScale,
    previewQuality,
    onUpdate,
    onRemove,
    renderSimplifiedContent,
    isSubtitleClip,
  ])

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

  // Обработка глобальных событий только если активны
  useEffect(() => {
    if (!slipSlidePreview || slipSlidePreview.clipId !== clip.id) return

    const handleMouseMove = (e: MouseEvent) => {
      if (slipSlidePreview.mode === "slip") {
        updateSlip(e.clientX)
      } else {
        updateSlide(e.clientX)
      }
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
  }, [slipSlidePreview, clip.id, updateSlip, updateSlide, commitSlip, commitSlide, cancelSlip, cancelSlide])

  return (
    <>
      <ClipContextMenu
        clip={clip}
        onShowEffects={() => setShowEffectsPanel(true)}
        onShowTransitions={() => {
          /* TODO */
        }}
        onShowFilters={() => {
          /* TODO */
        }}
        data-oid="hzbissb"
      >
        <div
          className={cn(
            "absolute top-1 bottom-1 cursor-pointer",
            "transition-all duration-150",
            clip.isSelected && "ring-2 ring-primary ring-offset-1",
            clip.isLocked && "opacity-60 cursor-not-allowed",
            isEditing && "z-10",
            !isFullyVisible && "opacity-70", // Показываем частично видимые клипы полупрозрачными
            className,
          )}
          style={{
            left: `${left}px`,
            width: `${width}px`,
          }}
          data-testid="timeline-clip"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          data-oid="1a5cgrp"
        >
          {renderClipContent()}

          {/* Рендерим дополнительные элементы только для больших клипов */}
          {renderDetails && width > 80 && (
            <>
              {/* Linked clip indicator */}
              <LinkedClipIndicator isLinked={clip.isLinked || false} data-oid="5u25lpz" />

              {/* J/L Cut indicators - только если есть связанный клип */}
              {linkedClip && clip.audioOffset !== undefined && clip.audioOffset !== 0 && (
                <>
                  <JLCutIndicator
                    videoClip={track.type === "video" || track.type === "image" ? clip : linkedClip}
                    audioClip={
                      ["audio", "music", "voiceover", "sfx", "ambient"].includes(track.type) ? clip : linkedClip
                    }
                    pixelsPerSecond={timeScale}
                    data-oid="0199qwn"
                  />

                  <JLCutDragHandle
                    clip={clip}
                    linkedClip={linkedClip}
                    cutType={getCutType(clip.audioOffset || 0)}
                    pixelsPerSecond={timeScale}
                    data-oid="4tmb4_1"
                  />
                </>
              )}

              {/* J/L Cut tool - только при наведении */}
              {isHovered && linkedClip && (
                <div className="absolute top-0 right-0 m-1 z-10" data-oid=":32_r00">
                  <JLCutTool clip={clip} data-oid="y-afg33" />
                </div>
              )}

              {/* Group indicator */}
              {group && !group.collapsed && (
                <div className="absolute top-0 left-0 m-1 z-10" data-oid="qt_byl9">
                  <GroupIndicator
                    group={group}
                    onToggleCollapse={() => toggleCollapse(group.id)}
                    onToggleLock={() => lockGroup(group.id, !group.locked)}
                    className="scale-75 origin-top-left"
                    data-oid="w6m3t53"
                  />
                </div>
              )}

              {/* AI Analysis indicator */}
              <ClipAIIndicator clip={clip} className="absolute top-1 left-1 z-10" data-oid="y_56d1g" />

              {/* Person indicators - только для видео */}
              {clipPersons.length > 0 && (
                <div className="absolute bottom-1 left-1 z-10" data-oid="x6h5yoa">
                  <PersonIndicator
                    persons={clipPersons}
                    appearances={clipAppearances}
                    clipId={clip.id}
                    compact={true}
                    maxVisible={2}
                    onClick={showPersonDetail}
                    data-oid="01o-3p5"
                  />
                </div>
              )}

              {/* Speed ramping indicator */}
              {speedRampingConfig && speedRampingConfig.enabled && (
                <div className="absolute top-1 right-1 z-10" data-oid="1.42a65">
                  <button
                    className={cn(
                      "p-1 rounded bg-purple-500/20 hover:bg-purple-500/30 transition-colors",
                      showSpeedCurve && "bg-purple-500/40",
                    )}
                    onClick={() => setShowSpeedCurve(!showSpeedCurve)}
                    title="Toggle Speed Curve Editor"
                    data-oid="qh4i1__"
                  >
                    <svg
                      className="w-3 h-3 text-purple-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      data-oid="8lip89u"
                    >
                      <path
                        d="M3 12c0-3 1-6 4-6s4 3 4 6-1 6-4 6-4-3-4-6m8 0c0-3 1-6 4-6s4 3 4 6-1 6-4 6-4-3-4-6"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        data-oid="uy6ez3t"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Trim handles - всегда показываем для выбранных клипов */}
          {(editMode === EDIT_MODES.TRIM || editMode === EDIT_MODES.RIPPLE) && clip.isSelected && (
            <ClipTrimHandles
              onTrimStart={handleTrimStart}
              onTrimMove={handleTrimMove}
              onTrimEnd={handleTrimEnd}
              isSelected={true}
              disabled={clip.isLocked}
              data-oid="xajmwpb"
            />
          )}

          {/* Slip/Slide handles - только для больших клипов */}
          {renderDetails && width > 100 && (
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
              data-oid="k0-k8uv"
            />
          )}

          {/* Rate Stretch handles - только для больших клипов */}
          {renderDetails && width > 100 && (
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
              data-oid="w57xg8d"
            />
          )}

          {/* Speed curve editor - отдельное окно */}
          {showSpeedCurve && speedRampingConfig && speedRampingConfig.enabled && (
            <div className="absolute top-full mt-2 left-0 z-50" data-oid="193j79t">
              <SpeedCurveEditor
                clipId={clip.id}
                clipDuration={clip.duration}
                pixelsPerSecond={timeScale}
                height={speedRampingConfig.graphHeight || 120}
                onClose={() => setShowSpeedCurve(false)}
                className="shadow-lg"
                data-oid="-9h5gvu"
              />
            </div>
          )}
        </div>
      </ClipContextMenu>

      {/* Диалог панели эффектов */}
      <Dialog open={showEffectsPanel} onOpenChange={setShowEffectsPanel} data-oid="6bjvtgm">
        <DialogContent className="max-w-4xl h-[80vh]" data-oid="yxy:y8t">
          <ClipEffectsPanel clip={clip} onClose={() => setShowEffectsPanel(false)} data-oid="602g_ml" />
        </DialogContent>
      </Dialog>
    </>
  )
})

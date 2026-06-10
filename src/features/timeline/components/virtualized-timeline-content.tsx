/**
 * VirtualizedTimelineContent - Оптимизированная версия Timeline с виртуализацией
 * Рендерит только видимые треки для улучшения производительности
 */

import { useDroppable } from "@dnd-kit/core"
import { useCurrentProject } from "@timeline-studio/core/hooks/use-current-project"
import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@timeline-studio/ui/components/resizable"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTimelineAIIntegration } from "@/features/ai-chat"
import { getDragDropManager } from "@/features/drag-drop"
import { useProjectSettings } from "@/features/project-settings/hooks/use-project-settings"
import { EditModeProvider } from "@/features/timeline/hooks/editing/use-edit-mode"
import { createLogger } from "@/lib/tauri-logger"
import { useClips } from "../hooks/clips/use-clips"
import { useDragDropTimeline } from "../hooks/drag-drop/use-drag-drop-timeline"
import { useTimelinePlayerSync } from "../hooks/integration/use-timeline-player-sync"
import { useTimeline } from "../hooks/state/use-timeline"
import { useTimelineActions } from "../hooks/state/use-timeline-actions"
import { useTracks } from "../hooks/state/use-tracks"
import { useVirtualizedTracks } from "../hooks/use-virtualized-tracks"
import { TimelineAIOverlay } from "./ai-analysis/timeline-ai-overlay"
import { AIMarkerControls } from "./ai-markers/ai-marker-controls"
import { EditModeSelector } from "./edit-mode-selector"
import { EditModeOverlay } from "./edit-tools/edit-mode-overlay"
import { SplitIndicator } from "./edit-tools/split-indicator"
import { TimelineMarkersLayer } from "./markers"
import { TimelineHotkeys } from "./timeline-hotkeys"
import { TimelineScale } from "./timeline-scale"
import {
  SpeedRampingIndicator,
  TimelineSpeedRampingIntegration,
  TimelineSpeedRampingStatus,
} from "./timeline-speed-ramping-integration"
import { VirtualizedTrack } from "./track/virtualized-track"
import { TrackControlsPanel } from "./track-controls-panel"
import { TrackInsertionZones } from "./track-insertion-zone"
import { UndoRedoHotkeys } from "./undo-redo"

// import { IntegratedVersionPanel } from "./version-control-integration/integrated-version-panel" // Временно скрыто

const logger = createLogger("VirtualizedTimelineContent")

export function VirtualizedTimelineContent() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)

  // Подключаем AI интеграцию
  const { isReady: aiReady } = useTimelineAIIntegration()

  // Drag and drop hook
  const { dragState } = useDragDropTimeline()

  const {
    project,
    selectedTrackIds,
    currentTime,
    createProject,
    addSection,
    addTrack,
    updateTrack,
    selectTracks,
    seek,
    send,
  } = useTimeline()

  // Временные значения для обратной совместимости
  const timeScale = 60 // Пикселей в секунду по умолчанию
  const error: string | null = null
  const clearError = () => {}

  const { tracks, setTrackHeight } = useTracks()
  const { clips } = useClips()

  // Получаем данные реального проекта
  const { currentProject } = useCurrentProject()
  const { settings: projectSettings } = useProjectSettings()

  // Инициализируем синхронизацию с плеером
  useTimelinePlayerSync()

  // Используем виртуализацию для треков
  const { parentRef, virtualItems, containerStyle, getItemStyle } = useVirtualizedTracks({
    tracks,
    overscan: 5, // Рендерим 5 дополнительных треков сверху и снизу
  })

  // Создаем проект при первой загрузке
  useEffect(() => {
    if (!project && currentProject && projectSettings) {
      void createProject(currentProject.metadata.name)
    }
  }, [project, currentProject, projectSettings, createProject])

  // Добавляем демо секцию
  useEffect(() => {
    if (project && (!project.sections || project.sections.length === 0)) {
      void addSection("Main Section", 0, 300) // 5 минут
    }
  }, [project, addSection])

  // Отслеживаем размер контейнера и прокрутку
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollOffset(container.scrollLeft)
    }

    const handleResize = () => {
      setContainerWidth(container.clientWidth)
    }

    // Инициализация
    handleResize()

    // Слушатели событий
    container.addEventListener("scroll", handleScroll)
    window.addEventListener("resize", handleResize)

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
      resizeObserver.disconnect()
    }
  }, [])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center" data-oid="nxww.:p">
        <Card className="w-96" data-oid="54:v3x3">
          <CardHeader data-oid="4kgs9nk">
            <CardTitle className="text-red-600" data-oid="dqqg4_-">
              Ошибка Timeline
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="mne.m1e">
            <p className="text-sm text-gray-600 mb-4" data-oid="zu4c0ou">
              {error}
            </p>
            <Button onClick={clearError} variant="outline" data-oid="32nst5g">
              Закрыть
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center" data-oid="go-p6we">
        <Card className="w-96" data-oid="jg6rgnm">
          <CardHeader data-oid="hokuhw_">
            <CardTitle data-oid="qmk_ndc">Загрузка Timeline...</CardTitle>
          </CardHeader>
          <CardContent data-oid="1qvbkvd">
            <p className="text-sm text-gray-600" data-oid="iodpadr">
              Инициализация проекта...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <EditModeProvider data-oid=":1907:s">
      <TimelineHotkeys data-oid="s7l416r" />
      <UndoRedoHotkeys data-oid="zaan2bs" />
      <TimelineSpeedRampingIntegration data-oid="c7nn1vj" />
      <SpeedRampingIndicator data-oid="k8qgbjq" />
      <div className="flex h-full flex-col" data-oid="2fo-dv8">
        {/* Edit mode overlay */}
        <EditModeOverlay data-oid="o1hueko" />

        {/* Информация о проекте и режимы редактирования */}
        <div className="p-4 border-b bg-background" data-oid="olwk890">
          <div className="flex items-center justify-between" data-oid="hujzia6">
            <div className="flex items-center gap-6" data-oid="ac_1tn2">
              <div data-oid="0xpt59r">
                <h3 className="font-semibold text-foreground" data-oid="tnf7ciz">
                  {currentProject?.metadata?.name || project.name}
                </h3>
                <p className="text-sm text-muted-foreground" data-oid="q5:6ba3">
                  {projectSettings
                    ? `${projectSettings.aspectRatio.value.width}x${projectSettings.aspectRatio.value.height} @ ${projectSettings.frameRate}fps`
                    : `${project.settings.resolution.width}x${project.settings.resolution.height} @ ${project.settings.fps}fps`}
                </p>
              </div>
              {/* Edit mode selector */}
              <EditModeSelector size="sm" data-oid="x96ya52" />
              {/* AI Marker Controls */}
              <AIMarkerControls className="ml-4" data-oid="tnjs02d" />
            </div>
            <div className="flex gap-2" data-oid="c4b002.">
              <Badge variant="outline" data-oid="2hspsrl">
                {project.sections?.length || 0} секций
              </Badge>
              <Badge variant="outline" data-oid="1mi0f:9">
                {tracks.length} треков
              </Badge>
              <Badge variant="outline" data-oid="820fjsq">
                {clips.length} клипов
              </Badge>
              <TimelineSpeedRampingStatus data-oid="bxmalw5" />
            </div>
          </div>
        </div>

        {/* Основная область Timeline */}
        <div className="flex-1 flex flex-col" data-oid="sbv-kyf">
          {/* Временная шкала */}
          <div className="flex border-b bg-muted/30" data-oid="cz75-cc">
            {/* Пустое место для синхронизации с TrackControlsPanel */}
            <div className="w-64 border-r border-border p-4" data-oid="6k9mbhm">
              <div className="text-sm font-medium text-muted-foreground" data-oid="f8o.ko2">
                Временная шкала
              </div>
            </div>
            {/* Шкала времени */}
            <div className="flex-1 p-4" data-oid="08ooss_">
              <TimelineScale
                startTime={0}
                endTime={project?.duration || 300}
                duration={project?.duration || 300}
                data-oid="4g8419o"
              />
            </div>
          </div>

          {/* Треки с горизонтальным разделением */}
          <ResizablePanelGroup direction="horizontal" className="flex-1" data-oid="w3lbpov">
            {/* Левая панель - Управление треками */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40} data-oid="4pi:9i5">
              <div className="h-full flex flex-col" data-oid="5b1zqox">
                <TrackControlsPanel data-oid="ul1pg1o" />
                <div className="p-2 border-t" data-oid="vby8bxj">
                  {/* <IntegratedVersionPanel /> */} {/* Временно скрыто */}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle data-oid="hj2hk5m" />

            {/* Правая панель - Область треков с виртуализацией */}
            <ResizablePanel defaultSize={75} minSize={60} data-oid="t9u3jxx">
              <div
                ref={(node) => {
                  scrollContainerRef.current = node
                  parentRef.current = node
                }}
                className="h-full overflow-auto relative"
                data-oid="olhqvm."
              >
                {tracks.length === 0 ? (
                  <EmptyTimelineDropZone onAddTrack={() => addTrack("Video", "Видео трек")} />
                ) : (
                  <div className="relative" data-oid="mi3nbci">
                    {/* Sticky layers */}
                    <div className="sticky top-0 z-30" data-oid="kq8hcw7">
                      {/* Markers layer */}
                      <TimelineMarkersLayer
                        timeScale={timeScale}
                        scrollOffset={scrollOffset}
                        containerWidth={containerWidth}
                        currentTime={currentTime}
                        duration={project?.duration || 300}
                        className="z-20"
                        data-oid="8kkxglu"
                      />

                      {/* AI Analysis Overlay */}
                      <TimelineAIOverlay
                        timelineWidth={containerWidth}
                        timelineDuration={project?.duration || 300}
                        pixelsPerSecond={timeScale}
                        className="mt-8 z-15"
                        data-oid="vwzdhye"
                      />
                    </div>

                    {/* Split indicator */}
                    <SplitIndicator
                      containerRef={scrollContainerRef as React.RefObject<HTMLElement>}
                      timeScale={timeScale}
                      scrollX={scrollOffset}
                      onSplit={(time, trackId) => {
                        const track = tracks.find((t) => t.id === trackId)
                        if (track) {
                          const clip = track.clips.find((c) => time > c.startTime && time < c.startTime + c.duration)
                          if (clip) {
                            send({
                              type: "SPLIT_CLIP",
                              clipId: clip.id,
                              splitTime: time,
                            })
                          }
                        }
                      }}
                      data-oid="41b_h6m"
                    />

                    {/* Track Insertion Zones */}
                    <TrackInsertionZones
                      trackIds={tracks.map((t) => t.id)}
                      isVisible={dragState.isDragging}
                      data-oid="jud4o4q"
                    />

                    {/* Виртуализированные треки */}
                    <div style={containerStyle} data-oid="d_:x12:">
                      {virtualItems.map((virtualItem) => {
                        const track = tracks[virtualItem.index]
                        if (!track) return null

                        return (
                          <div
                            key={track.id}
                            data-index={virtualItem.index}
                            style={getItemStyle(virtualItem)}
                            data-oid="4dz-z0f"
                          >
                            <VirtualizedTrack
                              track={track}
                              timeScale={timeScale}
                              currentTime={currentTime}
                              containerWidth={containerWidth}
                              scrollOffset={scrollOffset}
                              isSelected={selectedTrackIds?.includes(track.id) ?? false}
                              onSelect={(trackId) => selectTracks([trackId])}
                              onUpdate={(updates) => updateTrack(track.id, updates)}
                              onHeightChange={setTrackHeight}
                              data-oid="2xd_-rb"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </EditModeProvider>
  )
}

// Drop zone для пустого таймлайна
function EmptyTimelineDropZone({ onAddTrack }: { onAddTrack: () => void }) {
  const [isNativeDragOver, setIsNativeDragOver] = useState(false)
  const { addSingleMediaToTimeline } = useTimelineActions()

  const { isOver, setNodeRef } = useDroppable({
    id: "empty-timeline-drop-virtualized",
    data: {
      type: "track-insertion",
      position: "below",
      insertIndex: 0,
    },
  })

  // Нативный drag-drop для совместимости с Browser (который использует @/features/drag-drop)
  const handleNativeDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    setIsNativeDragOver(true)
  }, [])

  const handleNativeDragLeave = useCallback(() => {
    setIsNativeDragOver(false)
  }, [])

  const handleNativeDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsNativeDragOver(false)

      const manager = getDragDropManager()
      const currentDrag = manager.getCurrentDrag()

      if (currentDrag && currentDrag.type === "media" && currentDrag.data) {
        logger.info("[EmptyTimelineDropZone] Native drop:", {
          mediaName: currentDrag.data.name,
        })

        // Добавляем медиа на таймлайн с позицией 0
        void addSingleMediaToTimeline(currentDrag.data, undefined, 0)
      }
    },
    [addSingleMediaToTimeline],
  )

  const showDropFeedback = isOver || isNativeDragOver

  return (
    <div
      ref={setNodeRef}
      onDragOver={handleNativeDragOver}
      onDragLeave={handleNativeDragLeave}
      onDrop={handleNativeDrop}
      className={`flex h-full items-center justify-center transition-all ${
        showDropFeedback ? "bg-primary/10 border-2 border-dashed border-primary" : ""
      }`}
      data-oid="empty-timeline-drop-virtualized"
    >
      <Card className="w-96" data-oid="drbk8km">
        <CardContent className="pt-6" data-oid="2exsp6j">
          <div className="text-center" data-oid="64upq3d">
            <p className="text-muted-foreground" data-oid="1pzajzv">
              {showDropFeedback ? "Отпустите для добавления на таймлайн" : "Перетащите файл сюда или"}
            </p>
            <Button className="mt-4" onClick={onAddTrack} data-oid="e.z30zc">
              Добавить видео трек
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

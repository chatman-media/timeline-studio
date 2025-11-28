/**
 * VirtualizedTimelineContent - Оптимизированная версия Timeline с виртуализацией
 * Рендерит только видимые треки для улучшения производительности
 */

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { useCurrentProject } from "@/domains/project-management/hooks"
import { useTimelineAIIntegration } from "@/features/ai-chat/hooks/use-timeline-ai-integration"
import { useProjectSettings } from "@/features/project-settings/hooks/use-project-settings"

import { useClips } from "../hooks/use-clips"
import { useDragDropTimeline } from "../hooks/use-drag-drop-timeline"
import { EditModeProvider } from "../hooks/use-edit-mode"
import { useTimeline } from "../hooks/use-timeline"
import { useTimelinePlayerSync } from "../hooks/use-timeline-player-sync"
import { useTracks } from "../hooks/use-tracks"
import { useVirtualizedTracks } from "../hooks/use-virtualized-tracks"
import { TimelineAIOverlay } from "./ai-analysis/timeline-ai-overlay"
import { AIMarkerControls } from "./ai-markers/ai-marker-controls"
import { DragDropProvider } from "./drag-drop-provider"
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
      <div className="flex h-full items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Ошибка Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={clearError} variant="outline">
              Закрыть
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Загрузка Timeline...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Инициализация проекта...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <EditModeProvider>
      <TimelineHotkeys />
      <UndoRedoHotkeys />
      <TimelineSpeedRampingIntegration />
      <SpeedRampingIndicator />
      <div className="flex h-full flex-col">
        {/* Edit mode overlay */}
        <EditModeOverlay />

        {/* Информация о проекте и режимы редактирования */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h3 className="font-semibold text-foreground">{currentProject?.metadata?.name || project.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {projectSettings
                    ? `${projectSettings.aspectRatio.value.width}x${projectSettings.aspectRatio.value.height} @ ${projectSettings.frameRate}fps`
                    : `${project.settings.resolution.width}x${project.settings.resolution.height} @ ${project.settings.fps}fps`}
                </p>
              </div>
              {/* Edit mode selector */}
              <EditModeSelector size="sm" />
              {/* AI Marker Controls */}
              <AIMarkerControls className="ml-4" />
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{project.sections?.length || 0} секций</Badge>
              <Badge variant="outline">{tracks.length} треков</Badge>
              <Badge variant="outline">{clips.length} клипов</Badge>
              <TimelineSpeedRampingStatus />
            </div>
          </div>
        </div>

        {/* Основная область Timeline */}
        <div className="flex-1 flex flex-col">
          {/* Временная шкала */}
          <div className="flex border-b bg-muted/30">
            {/* Пустое место для синхронизации с TrackControlsPanel */}
            <div className="w-64 border-r border-border p-4">
              <div className="text-sm font-medium text-muted-foreground">Временная шкала</div>
            </div>
            {/* Шкала времени */}
            <div className="flex-1 p-4">
              <TimelineScale startTime={0} />
            </div>
          </div>

          {/* Треки с горизонтальным разделением */}
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Левая панель - Управление треками */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <div className="h-full flex flex-col">
                <TrackControlsPanel />
                <div className="p-2 border-t">
                  {/* <IntegratedVersionPanel /> */} {/* Временно скрыто */}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Правая панель - Область треков с виртуализацией */}
            <ResizablePanel defaultSize={75} minSize={60}>
              <DragDropProvider>
                <div
                  ref={(node) => {
                    scrollContainerRef.current = node
                    parentRef.current = node
                  }}
                  className="h-full overflow-auto relative"
                >
                  {tracks.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <Card className="w-96">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-muted-foreground">Треки не найдены</p>
                            <Button className="mt-4" onClick={() => addTrack("Video", "Видео трек")}>
                              Добавить видео трек
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Sticky layers */}
                      <div className="sticky top-0 z-30">
                        {/* Markers layer */}
                        <TimelineMarkersLayer
                          timeScale={timeScale}
                          scrollOffset={scrollOffset}
                          containerWidth={containerWidth}
                          currentTime={currentTime}
                          duration={project?.duration || 300}
                          className="z-20"
                        />

                        {/* AI Analysis Overlay */}
                        <TimelineAIOverlay
                          timelineWidth={containerWidth}
                          timelineDuration={project?.duration || 300}
                          pixelsPerSecond={timeScale}
                          className="mt-8 z-15"
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
                              send({ type: "SPLIT_CLIP", clipId: clip.id, splitTime: time })
                            }
                          }
                        }}
                      />

                      {/* Track Insertion Zones */}
                      <TrackInsertionZones trackIds={tracks.map((t) => t.id)} isVisible={dragState.isDragging} />

                      {/* Виртуализированные треки */}
                      <div style={containerStyle}>
                        {virtualItems.map((virtualItem) => {
                          const track = tracks[virtualItem.index]
                          if (!track) return null

                          return (
                            <div key={track.id} data-index={virtualItem.index} style={getItemStyle(virtualItem)}>
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
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </DragDropProvider>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </EditModeProvider>
  )
}

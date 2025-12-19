/**
 * TimelineContent - Основной контент Timeline
 *
 * Отображает треки, клипы и временную шкалу
 */

import { useEffect, useRef, useState } from "react"

// Убираем ненужные иконки

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { useCurrentProject } from "@/domains/project-management/hooks"
import { useTimelineAIIntegration } from "@/features/ai-chat"
import { useProjectSettings } from "@/features/project-settings/hooks/use-project-settings"
import { EditModeProvider } from "@/features/timeline/hooks/editing/use-edit-mode"
import { createLogger } from "@/lib/tauri-logger"
import { TimelineUIProvider, useTimelineUI } from "../context/timeline-ui-context"
import { useClips, useTimeline, useTimelinePlayerSync, useTracks } from "../hooks"
import { useDragDropTimeline } from "../hooks/drag-drop/use-drag-drop-timeline"
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
import { TrackComponent } from "./track/track"
import { TrackControlsPanel } from "./track-controls-panel"
import { TrackInsertionZones } from "./track-insertion-zone"
import { UndoRedoHotkeys } from "./undo-redo"

const logger = createLogger("TimelineContent")

export function TimelineContent() {
  return (
    <TimelineUIProvider initialState={{ timeScale: 60 }} data-oid="jyexofd">
      <TimelineContentInner data-oid="cikp-ii" />
    </TimelineUIProvider>
  )
}

function TimelineContentInner() {
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
    error = null,
    clearError = () => {},
  } = useTimeline()

  const { uiState } = useTimelineUI()
  const timeScale = uiState.timeScale

  const { tracks, setTrackHeight } = useTracks()
  const { clips } = useClips()

  // Получаем данные реального проекта
  const { currentProject } = useCurrentProject()
  const { settings: projectSettings } = useProjectSettings()

  // Инициализируем синхронизацию с плеером
  useTimelinePlayerSync()

  // Создаем проект немедленно при наличии currentProject
  useEffect(() => {
    if (!project && currentProject && projectSettings) {
      // Создаем проект синхронно
      createProject(currentProject.metadata.name).then(() => {
        logger.info("[TimelineContent] Timeline project created", {
          projectName: currentProject.metadata.name,
        })
      })
    }
  }, [project, currentProject, projectSettings, createProject])

  // Добавляем демо секцию после создания проекта
  useEffect(() => {
    if (project && (project.sections?.length ?? 0) === 0) {
      addSection("Main Section", 0, 300).then(() => {
        logger.info("[TimelineContent] Main section added")
      })
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
      <div className="flex h-full items-center justify-center" data-oid="y6teydi">
        <Card className="w-96" data-oid="fam_92k">
          <CardHeader data-oid="mkfw6c3">
            <CardTitle className="text-red-600" data-oid="sfqmj.v">
              Ошибка Timeline
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="3t5rw3v">
            <p className="text-sm text-gray-600 mb-4" data-oid="_tk8kcl">
              {error}
            </p>
            <Button onClick={clearError} variant="outline" data-oid="tovq1ke">
              Закрыть
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Не показываем сообщение загрузки - Timeline будет пустым пока проект создается
  // Проект создается автоматически в useEffect выше при наличии currentProject

  return (
    <EditModeProvider data-oid="dymu2-f">
      <TimelineHotkeys data-oid="f::0hlo" />
      <UndoRedoHotkeys data-oid=":9p0164" />
      <TimelineSpeedRampingIntegration data-oid="9p-f8yt" />
      <SpeedRampingIndicator data-oid="gcmd11." />
      <div className="flex h-full flex-col" data-oid="5h4:60p">
        {/* Edit mode overlay */}
        <EditModeOverlay data-oid="kwwlbma" />

        {/* Информация о проекте и режимы редактирования */}
        <div className="p-4 border-b bg-background" data-oid="ki.5dav">
          <div className="flex items-center justify-between" data-oid="wwqmmts">
            <div className="flex items-center gap-6" data-oid="bwoolue">
              <div data-oid="qxynlhw">
                <h3 className="font-semibold text-foreground" data-oid="r7vzeh_">
                  {currentProject?.metadata?.name || project?.name || "Новый проект"}
                </h3>
                <p className="text-sm text-muted-foreground" data-oid="m9_7ppe">
                  {projectSettings
                    ? `${projectSettings.aspectRatio.value.width}x${projectSettings.aspectRatio.value.height} @ ${projectSettings.frameRate}fps`
                    : project
                      ? `${project.settings.resolution.width}x${project.settings.resolution.height} @ ${project.settings.fps}fps`
                      : "1920x1080 @ 30fps"}
                </p>
              </div>
              {/* Edit mode selector */}
              <EditModeSelector size="sm" data-oid="41hb88v" />
              {/* AI Marker Controls */}
              <AIMarkerControls className="ml-4" data-oid="blbgv.z" />
            </div>
            <div className="flex gap-2" data-oid=".fpe0vx">
              <Badge variant="outline" data-oid="ihegwql">
                {project?.sections?.length || 0} секций
              </Badge>
              <Badge variant="outline" data-oid="s2id6ck">
                {tracks.length} треков
              </Badge>
              <Badge variant="outline" data-oid="3q.nhg1">
                {clips.length} клипов
              </Badge>
              <TimelineSpeedRampingStatus data-oid="m2vh-0d" />
            </div>
          </div>
        </div>

        {/* Основная область Timeline */}
        <div className="flex-1 flex flex-col" data-oid="p0ha8bt">
          {/* Временная шкала */}
          <div className="flex border-b bg-muted/30" data-oid="ujpja12">
            {/* Пустое место для синхронизации с TrackControlsPanel */}
            <div className="w-64 border-r border-border p-4" data-oid="lklz0kr">
              <div className="text-sm font-medium text-muted-foreground" data-oid="8t0evp8">
                Временная шкала
              </div>
            </div>
            {/* Шкала времени */}
            <div className="flex-1 p-4" data-oid="nyv88ct">
              <TimelineScale
                startTime={0}
                // endTime={sector.endTime}
                // duration={sector.endTime - sector.startTime}
                // sectorDate={sector.date}
                // sectorZoomLevel={sectionZoomLevels[sector.date]}
                data-oid="nd8tx_w"
              />
            </div>
          </div>

          {/* Треки с горизонтальным разделением */}
          <ResizablePanelGroup direction="horizontal" className="flex-1" data-oid="o.:px..">
            {/* Левая панель - Управление треками */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40} data-oid="z8r0zb_">
              <div className="h-full flex flex-col" data-oid="hlafi1j">
                <TrackControlsPanel data-oid="q4zmi-r" />
                <div className="p-2 border-t" data-oid="pconmwo">
                  {/* <IntegratedVersionPanel /> */} {/* Временно скрыто */}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle data-oid="cu.uagy" />

            {/* Правая панель - Область треков */}
            <ResizablePanel defaultSize={75} minSize={60} data-oid="8hnw-vh">
              <DragDropProvider data-oid="wp277ou">
                <div ref={scrollContainerRef} className="h-full overflow-auto relative" data-oid="wmayi_b">
                  {tracks.length === 0 ? (
                    <div className="flex h-full items-center justify-center" data-oid="2.o-c_u">
                      <Card className="w-96" data-oid="2cg27_.">
                        <CardContent className="pt-6" data-oid="2c5_b:.">
                          <div className="text-center" data-oid="m5wg30_">
                            <p className="text-muted-foreground" data-oid="kbb96.t">
                              Треки не найдены
                            </p>
                            <Button className="mt-4" onClick={() => addTrack("Video", "Видео трек")} data-oid="3a9pjsb">
                              Добавить видео трек
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="relative" data-oid="orpblox">
                      {/* Markers layer */}
                      <TimelineMarkersLayer
                        timeScale={timeScale}
                        scrollOffset={scrollOffset}
                        containerWidth={containerWidth}
                        currentTime={currentTime}
                        duration={project?.duration || 300} // Используем длительность проекта или 5 минут по умолчанию
                        className="sticky top-0 z-20"
                        data-oid="-tehb9t"
                      />

                      {/* AI Analysis Overlay */}
                      <TimelineAIOverlay
                        timelineWidth={containerWidth}
                        timelineDuration={project?.duration || 300}
                        pixelsPerSecond={timeScale}
                        className="sticky top-8 z-15"
                        data-oid="72lui84"
                      />

                      {/* Split indicator */}
                      <SplitIndicator
                        containerRef={scrollContainerRef as React.RefObject<HTMLElement>}
                        timeScale={timeScale}
                        scrollX={scrollOffset}
                        onSplit={(time, trackId) => {
                          // Find clip at this position
                          const track = tracks.find((t) => t.id === trackId)
                          if (track) {
                            const clip = track.clips.find(
                              (c: any) => time > c.startTime && time < c.startTime + c.duration,
                            )
                            if (clip) {
                              send({
                                type: "SPLIT_CLIP",
                                clipId: clip.id,
                                splitTime: time,
                              })
                            }
                          }
                        }}
                        data-oid="qdrsxi2"
                      />

                      {/* Track Insertion Zones - показываем только во время drag */}
                      <TrackInsertionZones
                        trackIds={tracks.map((t) => t.id)}
                        isVisible={dragState.isDragging}
                        data-oid=":44ex4p"
                      />

                      {/* Треки */}
                      <div className="space-y-0" data-oid="0h:mnvb">
                        <TracksWithTimeScale
                          tracks={tracks}
                          currentTime={currentTime}
                          selectedTrackIds={selectedTrackIds}
                          selectTracks={selectTracks}
                          updateTrack={updateTrack}
                          data-oid="pvvzvh8"
                        />
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

// Helper component to use timeScale from context
function TracksWithTimeScale({
  tracks,
  currentTime,
  selectedTrackIds,
  selectTracks,
  updateTrack,
}: {
  tracks: ReturnType<typeof useTracks>["tracks"]
  currentTime: number
  selectedTrackIds: string[] | undefined
  selectTracks: (trackIds: string[]) => void
  updateTrack: (trackId: string, updates: any) => void
}) {
  const { uiState } = useTimelineUI()

  return (
    <>
      {tracks.map((track) => (
        <TrackComponent
          key={track.id}
          track={track}
          timeScale={uiState.timeScale}
          currentTime={currentTime}
          isSelected={selectedTrackIds?.includes(track.id) ?? false}
          onSelect={(trackId: string) => selectTracks([trackId])}
          onUpdate={(updates: any) => updateTrack(track.id, updates)}
          data-oid="hmc8gnk"
        />
      ))}
    </>
  )
}

"use client"

import { type ReactNode, useMemo } from "react"
import { useAIDirectorEvents } from "@/domains/ai-director/hooks/use-ai-director-events"
import { AnalysisProgressIndicator } from "@/features/ai-director/components/analysis-progress-indicator"
import { AiChat } from "@/features/ai-chat"
import { Browser } from "@/features/browser/components"
import { useAutoLoadUserData } from "@/features/media-studio/hooks"
import { ModalContainer } from "@/features/modals/components"
import { Options } from "@/features/options"
import { Timeline } from "@/features/timeline/components/timeline"
import { DragDropProvider } from "@/features/timeline/components/drag-drop-provider"
import { VideoPlayer } from "@/features/video-player/components/video-player"
import { WidgetWorkspace } from "@/features/workspace/components/widget-workspace"
import type { Widget, WidgetType } from "@/features/workspace/types/widget"
import { useAppMenu } from "@/hooks/use-app-menu"
import { createLogger } from "@/lib/tauri-logger"
import { ProjectLoadingOverlay } from "./project-loading-overlay"
import { TopBar } from "./top-bar/top-bar"

const logger = createLogger({ module: "MediaStudio" })

export function MediaStudio() {
  // Автозагрузка пользовательских данных при старте приложения
  const { isLoading: isLoadingUserData, loadedData, error: userDataError } = useAutoLoadUserData()

  // Подписка на события AI анализа для глобального индикатора
  const { lastProgress } = useAIDirectorEvents()

  // Обработка событий нативного меню приложения
  useAppMenu()

  // Логирование для отладки
  if (userDataError) {
    logger.error("Ошибка автозагрузки пользовательских данных", {
      error: userDataError,
    })
  }
  if (isLoadingUserData) {
    logger.info("Загружаем пользовательские данные...")
  }
  if (loadedData && Object.values(loadedData).some((count) => count > 0)) {
    logger.info("Загружены пользовательские данные", { loadedData })
  }

  // Define widget renderers - map widget types to actual components
  const widgetRenderers = useMemo(
    () =>
      ({
        timeline: (_widget: Widget) => (
          <div className="h-full w-full" data-oid="timeline-widget">
            <Timeline data-oid="timeline-component" />
          </div>
        ),

        player: (_widget: Widget) => (
          <div className="h-full w-full" data-oid="player-widget">
            <VideoPlayer data-oid="player-component" />
          </div>
        ),

        browser: (_widget: Widget) => (
          <div className="h-full w-full" data-oid="browser-widget">
            <Browser data-oid="browser-component" />
          </div>
        ),

        options: (_widget: Widget) => (
          <div className="h-full w-full" data-oid="options-widget">
            <Options data-oid="options-component" />
          </div>
        ),

        "ai-chat": (_widget: Widget) => (
          <div className="h-full w-full" data-oid="ai-chat-widget">
            <AiChat data-oid="ai-chat-component" />
          </div>
        ),
      }) as Record<WidgetType, (widget: Widget) => ReactNode>,
    [],
  )

  return (
    <DragDropProvider data-oid="global-dnd-provider">
      <div className="flex flex-col h-screen w-screen m-0 p-0" data-oid="uxjltd1">
        <TopBar data-oid="1h9sg4d" />
        <div className="flex-1 min-h-0" data-oid="r0gyfo8">
          <WidgetWorkspace widgetRenderers={widgetRenderers} data-oid="workspace" />
        </div>

        {/* Контейнер для модальных окон */}
        <ModalContainer data-oid="yeoe5rl" />

        {/* Оверлей загрузки проекта */}
        <ProjectLoadingOverlay data-oid="dg_urdy" />

        {/* Глобальный индикатор прогресса AI анализа */}
        <AnalysisProgressIndicator
          fileName={lastProgress?.fileName}
          stage={lastProgress?.stage}
          progress={lastProgress?.progress}
          isVisible={!!lastProgress}
          data-oid="crl6c.q"
        />
      </div>
    </DragDropProvider>
  )
}

"use client"

import { useAIDirectorEvents } from "@/domains/ai-director/hooks/use-ai-director-events"
import { AnalysisProgressIndicator } from "@/features/ai-director/components/analysis-progress-indicator"
import { useAutoLoadUserData } from "@/features/media-studio/hooks"
import { ModalContainer } from "@/features/modals/components"
import { DragDropProvider } from "@/features/timeline/components/drag-drop-provider"
import { useUserSettings } from "@/features/user-settings/hooks/use-user-settings"
import { useAppMenu } from "@/hooks/use-app-menu"
import { createLogger } from "@/lib/tauri-logger"
import { ChatLayout, DefaultLayout, OptionsLayout, VerticalLayout } from "./layout"
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

  // Получаем текущий режим layout
  const { layoutMode } = useUserSettings()

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

  return (
    <DragDropProvider data-oid="global-dnd-provider">
      <div className="flex flex-col h-screen w-screen m-0 p-0" data-oid="uxjltd1">
        <TopBar data-oid="1h9sg4d" />
        <div className="flex-1 min-h-0" data-oid="r0gyfo8">
          {layoutMode === "default" && <DefaultLayout data-oid="default-layout" />}
          {layoutMode === "vertical" && <VerticalLayout data-oid="vertical-layout" />}
          {layoutMode === "options" && <OptionsLayout data-oid="options-layout" />}
          {layoutMode === "chat" && <ChatLayout data-oid="chat-layout" />}
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

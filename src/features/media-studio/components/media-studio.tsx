"use client"

import { useAIDirectorEvents } from "@/domains/ai-director/hooks/use-ai-director-events"
import { AnalysisProgressIndicator } from "@/features/ai-director/components/analysis-progress-indicator"
import { useAutoLoadUserData } from "@/features/media-studio/hooks"
import { ModalContainer } from "@/features/modals/components"
import { useUserSettings } from "@/features/user-settings"
import { createLogger } from "@/lib/tauri-logger"
import { ChatLayout, DefaultLayout, OptionsLayout, VerticalLayout } from "./layout"
import { ProjectLoadingOverlay } from "./project-loading-overlay"
import { TopBar } from "./top-bar/top-bar"

const logger = createLogger({ module: "MediaStudio" })

export function MediaStudio() {
  const { layoutMode } = useUserSettings()

  // Автозагрузка пользовательских данных при старте приложения
  const { isLoading: isLoadingUserData, loadedData, error: userDataError } = useAutoLoadUserData()

  // Подписка на события AI анализа для глобального индикатора
  const { lastProgress } = useAIDirectorEvents()

  // Логирование для отладки
  if (userDataError) {
    logger.error("Ошибка автозагрузки пользовательских данных", { error: userDataError })
  }
  if (isLoadingUserData) {
    logger.info("Загружаем пользовательские данные...")
  }
  if (loadedData && Object.values(loadedData).some((count) => count > 0)) {
    logger.info("Загружены пользовательские данные", { loadedData })
  }

  return (
    <div className="flex flex-col h-screen w-screen m-0 p-0">
      <TopBar />
      <div className="flex-1">
        {layoutMode === "default" && <DefaultLayout />}
        {layoutMode === "options" && <OptionsLayout />}
        {layoutMode === "vertical" && <VerticalLayout />}
        {layoutMode === "chat" && <ChatLayout />}
      </div>

      {/* Контейнер для модальных окон */}
      <ModalContainer />

      {/* Оверлей загрузки проекта */}
      <ProjectLoadingOverlay />

      {/* Глобальный индикатор прогресса AI анализа */}
      <AnalysisProgressIndicator
        fileName={lastProgress?.fileName}
        stage={lastProgress?.stage}
        progress={lastProgress?.progress}
        isVisible={!!lastProgress}
      />
    </div>
  )
}

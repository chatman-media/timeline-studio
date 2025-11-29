"use client"

import { ProjectLoadingOverlay } from "@/features/app-state/components/project-loading-overlay"
import { useAutoLoadUserData } from "@/features/media-studio/hooks"
import { ModalContainer } from "@/features/modals/components"
import { useUserSettings } from "@/features/user-settings"
import { createLogger } from "@/lib/tauri-logger"
import { ChatLayout, DefaultLayout, OptionsLayout, VerticalLayout } from "./layout"
import { TopBar } from "./top-bar/top-bar"

const logger = createLogger({ module: "MediaStudio" })

export function MediaStudio() {
  const { layoutMode } = useUserSettings()

  // Автозагрузка пользовательских данных при старте приложения
  const { isLoading: isLoadingUserData, loadedData, error: userDataError } = useAutoLoadUserData()

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
    </div>
  )
}

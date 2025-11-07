import { useEffect, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { storeService } from "../services/store-service"

const logger = createLogger("UseRecentProjects")

/**
 * Хук для доступа к списку последних открытых проектов
 * Предоставляет методы для управления списком недавних проектов
 *
 * @returns Объект с данными и методами для работы с недавними проектами
 */
export function useRecentProjects() {
  const [recentProjects, setRecentProjects] = useState<Array<{ path: string; name: string; lastOpened: number }>>([])

  useEffect(() => {
    // Загружаем список при монтировании
    void storeService.getRecentProjects().then(setRecentProjects)
  }, [])

  const addRecentProject = async (path: string, name: string) => {
    await storeService.addRecentProject(path, name)
    const updated = await storeService.getRecentProjects()
    setRecentProjects(updated)
  }

  return {
    recentProjects,
    addRecentProject,
    // TODO: Implement removeRecentProject and clearRecentProjects in store-service
    removeRecentProject: async (_path: string) => {
      logger.warn("removeRecentProject not implemented yet")
    },
    clearRecentProjects: async () => {
      logger.warn("clearRecentProjects not implemented yet")
    },
  }
}

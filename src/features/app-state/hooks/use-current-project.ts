import { createLogger } from "@/lib/tauri-logger"
import { useApp } from "../services/app-provider"

const logger = createLogger("UseCurrentProject")

/**
 * Хук для доступа к текущему проекту
 * Предоставляет методы для управления текущим проектом
 *
 * @returns Объект с данными и методами для работы с текущим проектом
 */
export function useCurrentProject() {
  const { projectState, executeCommand } = useApp()

  // Получение текущего проекта
  const currentProject = projectState?.project || null

  // Создание нового проекта
  const createNewProject = async (name: string) => {
    return executeCommand({
      type: "CreateProject",
      params: {
        name,
        settings: {
          resolution: { width: 1920, height: 1080 },
          frame_rate: 30,
          audio_sample_rate: 48000,
          audio_channels: 2,
        },
      },
    })
  }

  // Создание временного проекта
  const createTempProject = async () => {
    return executeCommand({
      type: "CreateProject",
      params: {
        name: "Temp Project",
        settings: {
          resolution: { width: 1920, height: 1080 },
          frame_rate: 30,
          audio_sample_rate: 48000,
          audio_channels: 2,
        },
      },
    })
  }

  // Загрузка или создание временного проекта
  const loadOrCreateTempProject = async () => {
    // Попробуем сначала открыть временный проект, если не получится - создадим новый
    const tempProjectName = "Temporary Project"
    return createNewProject(tempProjectName)
  }

  // Открытие проекта
  const openProject = async (projectPath: string) => {
    return executeCommand({
      type: "OpenProject",
      params: { path: projectPath },
    })
  }

  // Сохранение проекта
  const saveProject = async (projectPath?: string) => {
    return executeCommand({
      type: "SaveProject",
      params: { path: projectPath || null },
    })
  }

  // Пометка проекта как измененного
  const setProjectDirty = (dirty: boolean) => {
    // Эта функция больше не нужна, так как Tauri backend
    // автоматически отслеживает изменения проекта
    console.log("Project dirty state:", dirty)
  }

  // Проверка, является ли проект временным
  const isTempProject = false // Поле temporary больше не существует в новой структуре

  return {
    currentProject,
    createNewProject,
    createTempProject,
    loadOrCreateTempProject,
    openProject,
    saveProject,
    setProjectDirty,
    isTempProject,
  }
}

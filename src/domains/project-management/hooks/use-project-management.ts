/**
 * Hook для работы с Project Management доменом
 */

import { useCallback, useEffect, useState } from "react"
import type { ProjectSettings, ProjectState } from "@/types/generated/tauri-bindings"
import type { UserSettingsContextType } from "../machines/user-settings-machine"
import { getProjectManagementOrchestrator } from "../services/project-management-orchestrator"

export function useProjectManagement() {
  const [orchestrator] = useState(() => getProjectManagementOrchestrator())
  const [projectState, setProjectState] = useState<ProjectState | null>(() => orchestrator.getProjectState())
  const [userSettings, setUserSettings] = useState<UserSettingsContextType>(() => orchestrator.getUserSettings())
  const [isConnected, setIsConnected] = useState(() => orchestrator.isConnected())
  const [connectionError] = useState(() => orchestrator.getConnectionError())

  // Подписка на изменения состояния
  useEffect(() => {
    const projectSub = orchestrator.subscribeToProjectState((state) => {
      setProjectState(state)
    })

    const settingsSub = orchestrator.subscribeToUserSettings((settings) => {
      setUserSettings(settings)
    })

    return () => {
      projectSub.unsubscribe()
      settingsSub.unsubscribe()
    }
  }, [orchestrator])

  // Операции с проектом
  const createProject = useCallback(
    async (settings: ProjectSettings) => {
      return orchestrator.createProject(settings)
    },
    [orchestrator],
  )

  const openProject = useCallback(
    async (path: string) => {
      return orchestrator.openProject(path)
    },
    [orchestrator],
  )

  const saveProject = useCallback(async () => {
    return orchestrator.saveProject()
  }, [orchestrator])

  const saveProjectAs = useCallback(
    async (path: string) => {
      return orchestrator.saveProjectAs(path)
    },
    [orchestrator],
  )

  const closeProject = useCallback(async () => {
    return orchestrator.closeProject()
  }, [orchestrator])

  // Управление настройками
  const updateUserSettings = useCallback(
    (settings: Partial<UserSettingsContextType>) => {
      orchestrator.updateUserSettings(settings)
    },
    [orchestrator],
  )

  return {
    // Состояние
    projectState,
    userSettings,
    isConnected,
    connectionError,

    // Операции с проектом
    createProject,
    openProject,
    saveProject,
    saveProjectAs,
    closeProject,

    // Управление настройками
    updateUserSettings,

    // Удобные геттеры
    hasProject: projectState !== null,
    projectName: projectState?.project?.metadata?.name || null,
    projectPath: projectState?.project?.metadata?.file_path || null,
    isAutoSaveEnabled: userSettings.autoSaveEnabled,
    layoutMode: userSettings.layoutMode,
    activeTab: userSettings.activeTab,
  }
}

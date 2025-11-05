/**
 * Project Settings Provider V2
 *
 * Новая версия с синхронизацией через backend
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"

import { getBackendSync } from "@/features/app-state/services/backend-sync"
import type { ProjectState } from "@/types/generated/tauri-bindings"

import { DEFAULT_PROJECT_SETTINGS, type ProjectSettings } from "../types/project"

interface ProjectSettingsContextType {
  // Настройки проекта (синхронизированы с backend)
  settings: ProjectSettings

  // Состояние
  isLoading: boolean
  error: string | null

  // Действия (backend команды)
  updateSettings: (settings: Partial<ProjectSettings>) => Promise<void>
  resetSettings: () => Promise<void>
}

const ProjectSettingsContext = createContext<ProjectSettingsContextType | undefined>(undefined)

interface ProjectSettingsProviderProps {
  children: React.ReactNode
}

export function ProjectSettingsProvider({ children }: ProjectSettingsProviderProps) {
  const [backendSync] = useState(() => getBackendSync())
  const [backendState, setBackendState] = useState<ProjectState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Подписка на backend состояние
  useEffect(() => {
    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      setBackendState(state)
      setError(null)
    })

    return unsubscribe
  }, [backendSync])

  // Функция для выполнения backend команд
  const executeCommand = useCallback(
    async (command: any) => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await backendSync.executeCommand(command)
        if (!result.success) {
          throw new Error(result.error || "Command failed")
        }

        return result.data
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(errorMessage)
        console.error("Project settings command failed:", err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [backendSync],
  )

  // Действия
  const updateSettings = useCallback(
    async (_newSettings: Partial<ProjectSettings>) => {
      // Пока backend не имеет команды для обновления настроек проекта,
      // используем общую команду обновления проекта
      console.warn("Project settings update not yet implemented in backend")

      // В будущем это будет:
      // await executeCommand({
      //   type: 'UpdateProjectSettings',
      //   params: { settings: newSettings }
      // })
    },
    [executeCommand],
  )

  const resetSettings = useCallback(async () => {
    await updateSettings(DEFAULT_PROJECT_SETTINGS)
  }, [updateSettings])

  // Извлекаем настройки из backend состояния и преобразуем в frontend формат
  const settings: ProjectSettings = React.useMemo(() => {
    if (!backendState?.project?.settings) {
      return DEFAULT_PROJECT_SETTINGS
    }

    const backendSettings = backendState.project.settings

    // Преобразуем backend настройки в frontend формат
    return {
      resolution: `${backendSettings.resolution.width}x${backendSettings.resolution.height}`,
      frameRate: backendSettings.frame_rate.toString() as any,
      colorSpace: "sdr" as const, // По умолчанию, так как backend не хранит colorSpace
      aspectRatio: DEFAULT_PROJECT_SETTINGS.aspectRatio, // По умолчанию, так как backend не хранит aspectRatio
    }
  }, [backendState?.project?.settings])

  // Контекстное значение
  const contextValue: ProjectSettingsContextType = {
    // Настройки
    settings,

    // Состояние
    isLoading,
    error,

    // Действия
    updateSettings,
    resetSettings,
  }

  return <ProjectSettingsContext.Provider value={contextValue}>{children}</ProjectSettingsContext.Provider>
}

// Экспорт типов
export type { ProjectSettingsContextType }
export type { ProjectSettingsContextType as ProjectSettingsProviderType }

// Экспорт контекста для использования в хуках
export { ProjectSettingsContext }

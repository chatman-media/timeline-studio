/**
 * Project Settings Provider V2
 *
 * Новая версия с синхронизацией через backend
 * Использует event-driven архитектуру для синхронизации
 */

import React, { createContext, useCallback, useEffect, useState } from "react"

import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { createLogger } from "@/lib/tauri-logger"
import type { ProjectEvent, ProjectState } from "@/types/generated/tauri-bindings"
import { DEFAULT_PROJECT_SETTINGS, type ProjectSettings } from "../types/project"
import { convertFrontendSettingsToBackend, handleProjectSettingsEvent } from "./backend-event-handlers"

const logger = createLogger({ module: "ProjectSettingsProvider" })

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

  // ✅ НОВАЯ АРХИТЕКТУРА: Подписка на backend СОБЫТИЯ (не на state changes)
  useEffect(() => {
    const handleBackendEvent = (event: ProjectEvent) => {
      logger.info("[ProjectSettingsProvider] Received backend event", {
        eventType: event.type,
        event: JSON.stringify(event),
      })

      // Обрабатываем событие ProjectSettingsUpdated
      const updatedSettings = handleProjectSettingsEvent(event)
      if (updatedSettings) {
        logger.info("[ProjectSettingsProvider] Settings updated from event", {
          settings: updatedSettings,
        })

        // ВАЖНО: НЕ используем convertFrontendSettingsToBackend здесь!
        // Событие уже содержит backend формат настроек
        setBackendState((prevState) => {
          if (!prevState?.project) {
            logger.warn("[ProjectSettingsProvider] No project in prevState, cannot update settings")
            return prevState
          }

          logger.info("[ProjectSettingsProvider] Updating backendState with new settings", {
            oldSettings: prevState.project.settings,
            newSettings: (event as any).payload?.settings,
          })

          return {
            ...prevState,
            project: {
              ...prevState.project,
              settings: (event as any).payload.settings,
            },
          }
        })
        setError(null)
      }
    }

    // Подписываемся на backend события
    const unsubscribeEvents = backendSync.onEvent(handleBackendEvent)

    // Подписываемся на state changes ТОЛЬКО для инициализации
    // (когда проект открывается в первый раз)
    const unsubscribeState = backendSync.onStateChange((state: ProjectState) => {
      logger.info("[ProjectSettingsProvider] Backend state changed", {
        hasProject: !!state?.project,
      })
      setBackendState(state)
      setError(null)
    })

    // Получаем начальное состояние (только при mount)
    backendSync.getProjectState().then((state) => {
      if (state) {
        logger.info("[ProjectSettingsProvider] Initial state loaded", {
          hasProject: !!state.project,
        })
        setBackendState(state)
      }
    })

    return () => {
      unsubscribeEvents()
      unsubscribeState()
    }
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
        logger.error("Project settings command failed:", {
          error: errorMessage,
          command: command?.type,
        })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [backendSync],
  )

  // Действия
  const updateSettings = useCallback(
    async (newSettings: Partial<ProjectSettings>) => {
      logger.info("[ProjectSettingsProvider] updateSettings called", {
        newSettings: JSON.stringify(newSettings),
      })

      try {
        // Получаем текущие настройки для слияния
        const currentSettings = backendState?.project?.settings || {
          resolution: { width: 1920, height: 1080 },
          frame_rate: 30,
          audio_sample_rate: 48000,
          audio_channels: 2,
        }

        logger.info("[ProjectSettingsProvider] Current backend settings", {
          currentSettings,
        })

        // Преобразуем частичные frontend настройки в backend формат
        const backendSettings = convertFrontendSettingsToBackend(newSettings)

        logger.info("[ProjectSettingsProvider] Converted to backend format", {
          backendSettings,
        })

        // Объединяем с текущими настройками
        const mergedSettings = {
          ...currentSettings,
          ...backendSettings,
        }

        logger.info("[ProjectSettingsProvider] Sending UpdateProjectSettings command", {
          mergedSettings,
        })

        // ✅ Отправляем команду на backend
        const result = await executeCommand({
          type: "UpdateProjectSettings",
          params: { settings: mergedSettings },
        })

        logger.info("[ProjectSettingsProvider] Command executed, result:", {
          result,
        })

        // ❌ НЕ обновляем состояние вручную!
        // Backend пришлет событие ProjectSettingsUpdated, которое обновит состояние автоматически
      } catch (err) {
        logger.error("[ProjectSettingsProvider] Failed to update settings", {
          error: err,
        })
        throw err
      }
    },
    [executeCommand, backendState],
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

    // Определяем aspect ratio из backend разрешения
    const width = backendSettings.resolution.width
    const height = backendSettings.resolution.height
    const ratio = width / height

    // Проверяем стандартные соотношения сторон
    let aspectRatio = DEFAULT_PROJECT_SETTINGS.aspectRatio

    if (Math.abs(ratio - 16 / 9) < 0.01) {
      aspectRatio = {
        label: "16:9",
        textLabel: "widescreen",
        description: "YouTube",
        value: { width, height, name: "16:9" },
      }
    } else if (Math.abs(ratio - 9 / 16) < 0.01) {
      aspectRatio = {
        label: "9:16",
        textLabel: "portrait",
        description: "TikTok, YouTube Shorts",
        value: { width, height, name: "9:16" },
      }
    } else if (Math.abs(ratio - 1) < 0.01) {
      aspectRatio = {
        label: "1:1",
        textLabel: "square",
        description: "Instagram",
        value: { width, height, name: "1:1" },
      }
    } else if (Math.abs(ratio - 4 / 3) < 0.01) {
      aspectRatio = {
        label: "4:3",
        textLabel: "standard",
        description: "TV",
        value: { width, height, name: "4:3" },
      }
    } else if (Math.abs(ratio - 4 / 5) < 0.01) {
      aspectRatio = {
        label: "4:5",
        textLabel: "vertical",
        description: "Instagram Story",
        value: { width, height, name: "4:5" },
      }
    } else if (Math.abs(ratio - 21 / 9) < 0.01) {
      aspectRatio = {
        label: "21:9",
        textLabel: "cinematic",
        description: "Cinema",
        value: { width, height, name: "21:9" },
      }
    } else {
      // Кастомное соотношение
      aspectRatio = {
        label: "custom",
        textLabel: "",
        description: "custom",
        value: { width, height, name: `${width}:${height}` },
      }
    }

    // Преобразуем backend настройки в frontend формат
    return {
      resolution: `${width}x${height}`,
      frameRate: backendSettings.frame_rate.toString() as any,
      colorSpace: "sdr" as const, // По умолчанию, так как backend не хранит colorSpace
      aspectRatio,
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

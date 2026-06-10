/**
 * Project Settings Provider V2
 *
 * Новая версия с синхронизацией через backend
 * Использует event-driven архитектуру для синхронизации
 */

import React, { useCallback, useEffect, useState } from "react"

import { container } from "@timeline-studio/core/container"
import {
  ProjectSettingsContext,
  type ProjectSettingsContextType,
} from "@timeline-studio/core/types/project-settings-context"
import { DEFAULT_PROJECT_SETTINGS, type ProjectSettings } from "@/domains/shared/types/project"
import { createLogger } from "@/lib/tauri-logger"
import type { ProjectEvent, ProjectState } from "@/types/generated/tauri-bindings"
import { convertFrontendSettingsToBackend, handleProjectSettingsEvent } from "./project-settings-backend-handlers"

const logger = createLogger({ module: "ProjectSettingsProvider" })

interface ProjectSettingsProviderProps {
  children: React.ReactNode
}

export function ProjectSettingsProvider({ children }: ProjectSettingsProviderProps) {
  const [backendSync] = useState(() => container.getBackend())
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
    // Используем погрешность 0.05 для учета округлений и вариаций разрешений
    // Например, 21:9 (UltraWide) на практике реализуется как 64:27 = 2.370
    let aspectRatio = DEFAULT_PROJECT_SETTINGS.aspectRatio

    if (Math.abs(ratio - 16 / 9) < 0.05) {
      aspectRatio = {
        label: "16:9",
        textLabel: "widescreen",
        description: "YouTube",
        value: { width: 16, height: 9, name: "16:9" },
      }
    } else if (Math.abs(ratio - 9 / 16) < 0.05) {
      aspectRatio = {
        label: "9:16",
        textLabel: "portrait",
        description: "TikTok, YouTube Shorts",
        value: { width: 9, height: 16, name: "9:16" },
      }
    } else if (Math.abs(ratio - 1) < 0.05) {
      aspectRatio = {
        label: "1:1",
        textLabel: "square",
        description: "Instagram",
        value: { width: 1, height: 1, name: "1:1" },
      }
    } else if (Math.abs(ratio - 4 / 3) < 0.05) {
      aspectRatio = {
        label: "4:3",
        textLabel: "standard",
        description: "TV",
        value: { width: 4, height: 3, name: "4:3" },
      }
    } else if (Math.abs(ratio - 4 / 5) < 0.05) {
      aspectRatio = {
        label: "4:5",
        textLabel: "vertical",
        description: "Instagram Story",
        value: { width: 4, height: 5, name: "4:5" },
      }
    } else if (Math.abs(ratio - 64 / 27) < 0.05) {
      // 21:9 (UltraWide) фактически реализуется как 64:27 = 2.370
      // Проверяем именно это соотношение для корректного определения
      aspectRatio = {
        label: "21:9",
        textLabel: "cinematic",
        description: "Cinema",
        value: { width: 64, height: 27, name: "21:9" },
      }
    } else {
      // Кастомное соотношение - используем реальные значения
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

  return (
    <ProjectSettingsContext.Provider value={contextValue} data-oid="7phx5r3">
      {children}
    </ProjectSettingsContext.Provider>
  )
}

// Экспорт типов
export type { ProjectSettingsContextType, ProjectSettingsProviderType } from "@timeline-studio/core/types/project-settings-context"

// Экспорт контекста для использования в хуках
export { ProjectSettingsContext } from "@timeline-studio/core/types/project-settings-context"

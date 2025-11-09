import { useCallback, useEffect, useState } from "react"
import type { UserSettingsContextType } from "@/domains/project-management/machines/user-settings-machine"
import { createLogger } from "@/lib/tauri-logger"
import { storeService } from "../services/store-service"

const logger = createLogger("UseUserSettings")

/**
 * Хук для доступа к пользовательским настройкам через новую архитектуру
 * Предоставляет методы для получения и сохранения настроек пользователя
 */
export function useUserSettings() {
  const [userSettings, setUserSettings] = useState<UserSettingsContextType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Загрузка настроек при монтировании
  useEffect(() => {
    loadUserSettings()
  }, [])

  // Функция для загрузки настроек
  const loadUserSettings = useCallback(() => {
    setIsLoading(true)
    setError(null)

    const loadAsync = async () => {
      try {
        const settings = await storeService.getUserSettings()
        setUserSettings(settings)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load user settings"
        setError(errorMessage)
        logger.error("[useUserSettings] Error loading settings:", { error: err })
      } finally {
        setIsLoading(false)
      }
    }

    return loadAsync()
  }, [])

  // Функция для сохранения настроек
  const saveUserSettings = useCallback(
    (newSettings: Partial<UserSettingsContextType>) => {
      const saveAsync = async () => {
        try {
          // Если текущие настройки существуют, объединяем с новыми
          const updatedSettings = userSettings
            ? { ...userSettings, ...newSettings }
            : ({ ...newSettings } as UserSettingsContextType)

          await storeService.saveUserSettings(updatedSettings)
          setUserSettings(updatedSettings)
          setError(null) // Очищаем ошибку только при успехе

          return { success: true as const }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Failed to save user settings"
          setError(errorMessage)
          logger.error("[useUserSettings] Error saving settings:", { error: err })
          return { success: false as const, error: errorMessage }
        }
      }

      return saveAsync()
    },
    [userSettings],
  )

  // Функция для обновления отдельной настройки
  const updateSetting = useCallback(
    <K extends keyof UserSettingsContextType>(key: K, value: UserSettingsContextType[K]) => {
      return saveUserSettings({ [key]: value })
    },
    [saveUserSettings],
  )

  return {
    userSettings,
    isLoading,
    error,
    loadUserSettings,
    saveUserSettings,
    updateSetting,
    refetch: loadUserSettings,
  }
}

/**
 * Тип возвращаемого значения хука useUserSettings
 */
export type UseUserSettingsReturn = ReturnType<typeof useUserSettings>

import { useCallback, useEffect, useState } from "react"
import type { UserSettingsContextType } from "@/domains/project-management/machines/user-settings-machine"
import { createLogger } from "@/lib/tauri-logger"
import { storeService } from "../services/store-service"

const logger = createLogger({ module: "UseUserSettings" })

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
  const loadUserSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const settings = await storeService.getUserSettings()
      setUserSettings(settings)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load user settings"
      setError(errorMessage)
      logger.error("[useUserSettings] Error loading settings:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Функция для сохранения настроек
  const saveUserSettings = useCallback(
    async (newSettings: Partial<UserSettingsContextType>) => {
      try {
        setError(null)

        // Если текущие настройки существуют, объединяем с новыми
        const updatedSettings = userSettings
          ? { ...userSettings, ...newSettings }
          : ({ ...newSettings } as UserSettingsContextType)

        await storeService.saveUserSettings(updatedSettings)
        setUserSettings(updatedSettings)

        return { success: true }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to save user settings"
        setError(errorMessage)
        logger.error("[useUserSettings] Error saving settings:", err)
        return { success: false, error: errorMessage }
      }
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

/**
 * Modern Language Hook - современный хук для управления языком
 * Заменяет устаревший хук из @/i18n/hooks/use-language
 */

import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { getAppLanguage, setAppLanguage } from "@/core/services/language"
import { DEFAULT_LANGUAGE, isSupportedLanguage, type LanguageCode } from "@/i18n/constants"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "UseLanguage" })

interface UseLanguageReturn {
  currentLanguage: LanguageCode
  systemLanguage: LanguageCode
  isLoading: boolean
  error: string | null
  changeLanguage: (lang: LanguageCode) => Promise<void>
  refreshLanguage: () => Promise<void>
}

/**
 * Современный хук для управления языком приложения
 * Синхронизирует язык между фронтендом и бэкендом Tauri
 */
export function useLanguage(): UseLanguageReturn {
  const { i18n } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [systemLanguage, setSystemLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE)

  // Получение языка из бэкенда Tauri
  const fetchLanguage = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Получаем язык из бэкенда Tauri
      const response = await getAppLanguage()

      // Проверяем, поддерживается ли язык
      const appLang = isSupportedLanguage(response.language) ? (response.language as LanguageCode) : DEFAULT_LANGUAGE

      const sysLang = isSupportedLanguage(response.system_language)
        ? (response.system_language as LanguageCode)
        : DEFAULT_LANGUAGE

      // Устанавливаем системный язык
      setSystemLanguage(sysLang)

      // Если язык приложения отличается от текущего, меняем его
      if (i18n && i18n.language !== appLang) {
        await i18n.changeLanguage(appLang)
      }

      // Сохраняем в localStorage для совместимости
      localStorage.setItem("app-language", appLang)
    } catch (err) {
      logger.error("Error fetching language:", {
        error: err instanceof Error ? err.message : String(err),
      })
      setError(err instanceof Error ? err.message : String(err))

      // Пытаемся получить язык из localStorage
      try {
        const storedLanguage = localStorage.getItem("app-language")
        if (storedLanguage && isSupportedLanguage(storedLanguage) && i18n) {
          await i18n.changeLanguage(storedLanguage as LanguageCode)
        }
      } catch (e) {
        logger.error("Error reading language from localStorage:", {
          error: e instanceof Error ? e.message : String(e),
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [i18n])

  // Изменение языка
  const changeLanguage = useCallback(
    async (lang: LanguageCode) => {
      try {
        setIsLoading(true)
        setError(null)

        // Меняем язык в i18next
        if (i18n) {
          await i18n.changeLanguage(lang)
        }

        // Сохраняем в localStorage
        localStorage.setItem("app-language", lang)

        // Синхронизируем с бэкендом Tauri
        await setAppLanguage(lang)
      } catch (err) {
        logger.error("Error changing language:", {
          error: err instanceof Error ? err.message : String(err),
        })
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setIsLoading(false)
      }
    },
    [i18n],
  )

  useEffect(() => {
    void fetchLanguage()
  }, [fetchLanguage])

  return {
    currentLanguage: (i18n?.language || DEFAULT_LANGUAGE) as LanguageCode,
    systemLanguage,
    isLoading,
    error,
    changeLanguage,
    refreshLanguage: fetchLanguage,
  }
}

import { type AppContext, useApp } from "../services/app-provider"

/**
 * Хук для доступа к контексту настроек приложения
 * Предоставляет доступ к состоянию и методам для управления настройками приложения
 *
 * @returns {AppContext} Значение контекста с состояниями и методами
 * @throws {Error} Если хук используется вне AppProvider
 */
export function useAppSettings(): AppContext {
  return useApp()
}

// Экспорт типа для обратной совместимости
export type AppSettingsProviderContext = AppContext

import { type AppProviderV2Context, useApp } from "../services/app-provider"

/**
 * Хук для доступа к контексту настроек приложения
 * Предоставляет доступ к состоянию и методам для управления настройками приложения
 *
 * @returns {AppProviderV2Context} Значение контекста с состояниями и методами
 * @throws {Error} Если хук используется вне AppProvider
 */
export function useAppSettings(): AppProviderV2Context {
  return useApp()
}

// Экспорт типа для обратной совместимости
export type AppSettingsProviderContext = AppProviderV2Context

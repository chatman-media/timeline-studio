import { useCallback } from "react"

import { useAutoLoadResources } from "./use-auto-load-resources"

/**
 * Структура для автозагрузки пользовательских данных
 */
interface UserDataSummary {
  effects: number
  transitions: number
  filters: number
  subtitles: number
  styleTemplates: number
}

/**
 * Хук для автоматической загрузки пользовательских ресурсов
 * Загружает эффекты, переходы, фильтры, субтитры и шаблоны стилей
 */
export function useAutoLoadUserData() {
  const resourcesHook = useAutoLoadResources()

  const loadedData: UserDataSummary = {
    effects: resourcesHook.loadedStats.effects,
    transitions: resourcesHook.loadedStats.transitions,
    filters: resourcesHook.loadedStats.filters,
    subtitles: resourcesHook.loadedStats.subtitles,
    styleTemplates: resourcesHook.loadedStats.styleTemplates,
  }

  const reload = useCallback(async () => {
    await resourcesHook.reload()
  }, [resourcesHook.reload])

  const clearCache = useCallback(() => {
    resourcesHook.clearCache()
  }, [resourcesHook.clearCache])

  return {
    isLoading: resourcesHook.isLoading,
    loadedData,
    error: resourcesHook.error,
    reload,
    clearCache,
  }
}

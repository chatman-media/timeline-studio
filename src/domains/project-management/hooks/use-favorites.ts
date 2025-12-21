import { useCallback, useMemo } from "react"

import type { BrowserTab } from "@/domains/browser"
import { useBrowser } from "@/domains/browser"
import { createLogger } from "@/lib/tauri-logger"
import { useApp } from "../providers/app-provider"

const logger = createLogger("UseFavorites")

// Маппинг типов фронтенда на BrowserTab
const TYPE_TO_TAB_MAP: Record<string, BrowserTab> = {
  transition: "transitions",
  effect: "effects",
  template: "templates",
  filter: "filters",
  subtitle: "subtitles",
  media: "media",
  music: "music",
  styleTemplate: "style_templates",
} as const

// Обратный маппинг BrowserTab на тип фронтенда (только для вкладок с поддержкой favorites)
const TAB_TO_TYPE_MAP: Partial<Record<BrowserTab, string>> = {
  transitions: "transition",
  effects: "effect",
  templates: "template",
  filters: "filter",
  subtitles: "subtitle",
  media: "media",
  music: "music",
  style_templates: "styleTemplate",
  // projects и scenarios не поддерживают favorites
} as const

/**
 * Хук для доступа к избранным элементам
 * Синхронизируется с browser state для единого источника правды
 *
 * @returns Объект с данными и методами для работы с избранными
 */
export function useFavorites() {
  const { browserState } = useBrowser()
  const { executeCommand } = useApp()

  // Конвертируем favorites из browser state (по tab) в формат по type
  const favorites = useMemo(() => {
    const result: Record<string, string[]> = {
      transition: [],
      effect: [],
      template: [],
      filter: [],
      subtitle: [],
      media: [],
      music: [],
      styleTemplate: [],
    }

    if (browserState?.favorites) {
      for (const [tab, fileIds] of Object.entries(browserState.favorites)) {
        const type = TAB_TO_TYPE_MAP[tab as BrowserTab]
        if (type) {
          result[type] = fileIds as string[]
        }
      }
    }

    return result
  }, [browserState?.favorites])

  const addToFavorites = useCallback(
    async (item: any, type: string) => {
      const tab = TYPE_TO_TAB_MAP[type]
      if (!tab) {
        logger.error(`Unknown type for favorites: ${type}`)
        return
      }

      try {
        // Отправляем команду в backend - state обновится автоматически через события
        await executeCommand({
          type: "BrowserAddToFavorites",
          params: { file_id: item.id, tab },
        })

        logger.info(`Added to favorites [${type}]:`, { id: item.id, name: item.name })
      } catch (error) {
        logger.error(`Failed to add to favorites [${type}]:`, { error })
      }
    },
    [executeCommand],
  )

  const removeFromFavorites = useCallback(
    async (item: any, type: string) => {
      const tab = TYPE_TO_TAB_MAP[type]
      if (!tab) {
        logger.error(`Unknown type for favorites: ${type}`)
        return
      }

      try {
        // Отправляем команду в backend - state обновится автоматически через события
        await executeCommand({
          type: "BrowserRemoveFromFavorites",
          params: { file_id: item.id, tab },
        })

        logger.info(`Removed from favorites [${type}]:`, { id: item.id, name: item.name })
      } catch (error) {
        logger.error(`Failed to remove from favorites [${type}]:`, { error })
      }
    },
    [executeCommand],
  )

  const isItemFavorite = useCallback(
    (item: any, type: string) => {
      // favorites[type] содержит массив ID (string[]), а не объектов
      return favorites[type]?.includes(item.id) || false
    },
    [favorites],
  )

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isItemFavorite,
  }
}

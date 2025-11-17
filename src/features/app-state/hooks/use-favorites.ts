import { useCallback, useEffect, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { useApp } from "../services/app-provider"
import type { BrowserEvent, BrowserTab } from "@/types/generated/tauri-bindings"

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
}

/**
 * Хук для доступа к избранным элементам
 * Предоставляет методы для управления избранными элементами
 *
 * @returns Объект с данными и методами для работы с избранными
 */
export function useFavorites() {
  // Состояние синхронизируется с backend через события
  const [favorites, setFavorites] = useState<Record<string, any[]>>({
    transition: [],
    effect: [],
    template: [],
    filter: [],
    subtitle: [],
    media: [],
    music: [],
    styleTemplate: [],
  })

  const { executeCommand, listenToEvent } = useApp()

  // Подписка на события favorites от backend
  useEffect(() => {
    const unsubscribeFavoriteAdded = listenToEvent("Browser", (event: BrowserEvent) => {
      if (event.event_type === "favorite_added") {
        const { tab, file_id } = event.data as { tab: BrowserTab; file_id: string }
        const frontendType = Object.entries(TYPE_TO_TAB_MAP).find(([, t]) => t === tab)?.[0]
        if (frontendType) {
          setFavorites((prev) => ({
            ...prev,
            [frontendType]: [...(prev[frontendType] || []), { id: file_id }],
          }))
          logger.info(`Favorite added from backend [${tab}]:`, file_id)
        }
      }
    })

    const unsubscribeFavoriteRemoved = listenToEvent("Browser", (event: BrowserEvent) => {
      if (event.event_type === "favorite_removed") {
        const { tab, file_id } = event.data as { tab: BrowserTab; file_id: string }
        const frontendType = Object.entries(TYPE_TO_TAB_MAP).find(([, t]) => t === tab)?.[0]
        if (frontendType) {
          setFavorites((prev) => ({
            ...prev,
            [frontendType]: (prev[frontendType] || []).filter((f) => f.id !== file_id),
          }))
          logger.info(`Favorite removed from backend [${tab}]:`, file_id)
        }
      }
    })

    return () => {
      unsubscribeFavoriteAdded?.()
      unsubscribeFavoriteRemoved?.()
    }
  }, [listenToEvent])

  const addToFavorites = useCallback(
    async (item: any, type: string) => {
      const tab = TYPE_TO_TAB_MAP[type]
      if (!tab) {
        logger.error(`Unknown type for favorites: ${type}`)
        return
      }

      // Отправляем команду в backend
      await executeCommand({
        type: "BrowserAddToFavorites",
        params: { file_id: item.id, tab },
      })

      logger.info(`Adding to favorites [${type}]:`, item)
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

      // Отправляем команду в backend
      await executeCommand({
        type: "BrowserRemoveFromFavorites",
        params: { file_id: item.id, tab },
      })

      logger.info(`Removing from favorites [${type}]:`, item)
    },
    [executeCommand],
  )

  const isItemFavorite = useCallback(
    (item: any, type: string) => {
      return favorites[type]?.some((f) => f.id === item.id) || false
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

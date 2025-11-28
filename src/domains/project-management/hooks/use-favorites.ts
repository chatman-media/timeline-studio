import { useCallback, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import type { BrowserTab } from "@/types/generated/tauri-bindings"
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

/**
 * Хук для доступа к избранным элементам
 * Предоставляет методы для управления избранными элементами
 *
 * @returns Объект с данными и методами для работы с избранными
 */
export function useFavorites() {
  // Локальное состояние с оптимистичным обновлением
  // Backend синхронизация происходит автоматически через события
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

  const { executeCommand } = useApp()

  const addToFavorites = useCallback(
    async (item: any, type: string) => {
      const tab = TYPE_TO_TAB_MAP[type]
      if (!tab) {
        logger.error(`Unknown type for favorites: ${type}`)
        return
      }

      // Оптимистичное обновление UI для instant feedback
      setFavorites((prev) => ({
        ...prev,
        [type]: [...(prev[type] || []), item],
      }))

      try {
        // Отправляем команду в backend
        await executeCommand({
          type: "BrowserAddToFavorites",
          params: { file_id: item.id, tab },
        })

        logger.info(`Added to favorites [${type}]:`, item)
      } catch (error) {
        // Откатываем изменение в случае ошибки
        setFavorites((prev) => ({
          ...prev,
          [type]: (prev[type] || []).filter((f) => f.id !== item.id),
        }))
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

      // Оптимистичное обновление UI для instant feedback
      setFavorites((prev) => ({
        ...prev,
        [type]: (prev[type] || []).filter((f) => f.id !== item.id),
      }))

      try {
        // Отправляем команду в backend
        await executeCommand({
          type: "BrowserRemoveFromFavorites",
          params: { file_id: item.id, tab },
        })

        logger.info(`Removed from favorites [${type}]:`, item)
      } catch (error) {
        // Откатываем изменение в случае ошибки
        setFavorites((prev) => ({
          ...prev,
          [type]: [...(prev[type] || []), item],
        }))
        logger.error(`Failed to remove from favorites [${type}]:`, { error })
      }
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

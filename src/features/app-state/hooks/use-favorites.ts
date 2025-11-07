import { useCallback, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { useApp } from "../services/app-provider"

const logger = createLogger("UseFavorites")

/**
 * Хук для доступа к избранным элементам
 * Предоставляет методы для управления избранными элементами
 *
 * @returns Объект с данными и методами для работы с избранными
 */
export function useFavorites() {
  // Используем локальное состояние для избранных элементов
  // В будущем это будет подключено к backend
  const [favorites, setFavorites] = useState<Record<string, any[]>>({
    transition: [],
    effect: [],
    template: [],
    filter: [],
    subtitle: [],
    media: [],
    audio: [],
  })

  const { executeCommand } = useApp()

  const addToFavorites = useCallback(
    async (item: any, type: string) => {
      setFavorites((prev) => ({
        ...prev,
        [type]: [...(prev[type] || []), item],
      }))

      // В будущем это будет backend команда:
      // await executeCommand({
      //   type: 'AddToFavorites',
      //   params: { item, type }
      // })
      logger.info(`Added to favorites [${type}]:`, item)
    },
    [executeCommand],
  )

  const removeFromFavorites = useCallback(
    async (item: any, type: string) => {
      setFavorites((prev) => ({
        ...prev,
        [type]: (prev[type] || []).filter((f) => f.id !== item.id),
      }))

      // В будущем это будет backend команда:
      // await executeCommand({
      //   type: 'RemoveFromFavorites',
      //   params: { itemId: item.id, type }
      // })
      logger.info(`Removed from favorites [${type}]:`, item)
    },
    [executeCommand],
  )

  const updateFavorites = useCallback(
    async (newFavorites: Record<string, any[]>) => {
      setFavorites(newFavorites)

      // В будущем это будет backend команда:
      // await executeCommand({
      //   type: 'UpdateFavorites',
      //   params: { favorites: newFavorites }
      // })
      logger.info("Updated favorites:", newFavorites)
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
    updateFavorites,
    addToFavorites,
    removeFromFavorites,
    isItemFavorite,
  }
}

import { useCallback, useEffect } from "react"
import { useResources } from "@/features/resources/services/resources-provider"
import { type LogContext, logError, logInfo } from "@/lib/tauri-logger"

// Временная заглушка для setResourcesStateAccess
let resourcesStateAccess: any = null
const setResourcesStateAccess = (access: any) => {
  resourcesStateAccess = access
}

export interface AIResourceStats {
  totalMedia: number
  totalEffects: number
  totalFilters: number
  totalSize: number
  totalDuration: number
  totalMusic: number
}

/**
 * Хук для интеграции ResourcesProvider с AI инструментами
 *
 * Устанавливает доступ к состоянию ресурсов для AI инструментов,
 * позволяя им управлять ресурсами проекта через естественный язык
 */
export function useResourcesAIIntegration() {
  logInfo("[useResourcesAIIntegration] Инициализация")

  const resources = useResources()

  // Функция для получения статистики ресурсов
  const getResourceStats = useCallback(() => {
    logInfo("[useResourcesAIIntegration] Получение статистики ресурсов")

    const totalMedia = resources.mediaResources.length
    const totalMusic = resources.musicResources.length
    const totalEffects = resources.effectResources.length
    const totalFilters = resources.filterResources.length

    const totalSize = [...resources.mediaResources, ...resources.musicResources].reduce(
      (sum, r) => sum + (r.file.size || 0),
      0,
    )

    const totalDuration = [...resources.mediaResources, ...resources.musicResources].reduce(
      (sum, r) => sum + (r.file.duration || 0),
      0,
    )

    const stats = {
      totalMedia,
      totalEffects,
      totalFilters,
      totalSize,
      totalDuration,
      totalMusic,
    }

    logInfo("[useResourcesAIIntegration] Статистика получена", stats)
    return stats
  }, [resources])

  // Функция для добавления медиафайла
  const addMediaFile = useCallback(
    async (file: any) => {
      logInfo("[useResourcesAIIntegration] Добавление медиафайла", { fileName: file?.name })
      try {
        const result = await resources.addMedia(file)
        logInfo("[useResourcesAIIntegration] Медиафайл добавлен", { result })
        return result
      } catch (error) {
        logError("[useResourcesAIIntegration] Ошибка добавления медиафайла", error as LogContext)
        throw error
      }
    },
    [resources],
  )

  // Функция для добавления эффекта
  const addEffect = useCallback(
    async (effect: any) => {
      logInfo("[useResourcesAIIntegration] Добавление эффекта", { effectId: effect?.id })
      try {
        const result = await resources.addEffect(effect)
        logInfo("[useResourcesAIIntegration] Эффект добавлен", { result })
        return result
      } catch (error) {
        logError("[useResourcesAIIntegration] Ошибка добавления эффекта", error as LogContext)
        throw error
      }
    },
    [resources],
  )

  // Функция для добавления фильтра
  const addFilter = useCallback(
    async (filter: any) => {
      logInfo("[useResourcesAIIntegration] Добавление фильтра", { filterId: filter?.id })
      try {
        const result = await resources.addFilter(filter)
        logInfo("[useResourcesAIIntegration] Фильтр добавлен", { result })
        return result
      } catch (error) {
        logError("[useResourcesAIIntegration] Ошибка добавления фильтра", error as LogContext)
        throw error
      }
    },
    [resources],
  )

  // Функция для добавления любого ресурса
  const addResource = useCallback(
    async (resourceType: string, resource: any) => {
      logInfo("[useResourcesAIIntegration] Добавление ресурса", { resourceType, resourceId: resource?.id })
      try {
        let result: any
        switch (resourceType) {
          case "media":
            result = await resources.addMedia(resource)
            break
          case "music":
            result = await resources.addMusic(resource)
            break
          case "effect":
            result = await resources.addEffect(resource)
            break
          case "filter":
            result = await resources.addFilter(resource)
            break
          case "transition":
            result = await resources.addTransition(resource)
            break
          case "template":
            result = await resources.addTemplate(resource)
            break
          case "styleTemplate":
            result = await resources.addStyleTemplate(resource)
            break
          case "subtitle":
            result = await resources.addSubtitle(resource)
            break
          default:
            throw new Error(`Unknown resource type: ${resourceType}`)
        }
        logInfo("[useResourcesAIIntegration] Ресурс добавлен", { resourceType, result })
        return result
      } catch (error) {
        logError("[useResourcesAIIntegration] Ошибка добавления ресурса", error as LogContext)
        throw error
      }
    },
    [resources],
  )

  // Функция для удаления ресурса
  const removeResource = useCallback(
    async (resourceId: string, _type: string) => {
      logInfo("[useResourcesAIIntegration] Удаление ресурса", { resourceId })
      try {
        const result = await resources.removeResource(resourceId)
        logInfo("[useResourcesAIIntegration] Ресурс удален", { resourceId })
        return result
      } catch (error) {
        logError("[useResourcesAIIntegration] Ошибка удаления ресурса", error as LogContext)
        throw error
      }
    },
    [resources],
  )

  // Функция для обновления ресурса
  const updateResource = useCallback(
    async (resourceId: string, params: Record<string, any>) => {
      logInfo("[useResourcesAIIntegration] Обновление ресурса", { resourceId, params })
      try {
        const result = await resources.updateResource(resourceId, params)
        logInfo("[useResourcesAIIntegration] Ресурс обновлен", { resourceId })
        return result
      } catch (error) {
        logError("[useResourcesAIIntegration] Ошибка обновления ресурса", error as LogContext)
        throw error
      }
    },
    [resources],
  )

  // Устанавливаем доступ к ресурсам для AI инструментов
  useEffect(() => {
    const resourcesAccess = {
      getResourcesProvider: () => resources,
      addMediaFile,
      addEffect,
      addFilter,
      addResource,
      removeResource,
      updateResource,
      getResourceStats,
    }

    setResourcesStateAccess(resourcesAccess)
    logInfo("[useResourcesAIIntegration] Доступ к ресурсам установлен")

    // Очищаем при размонтировании
    return () => {
      setResourcesStateAccess(null)
      logInfo("[useResourcesAIIntegration] Доступ к ресурсам очищен")
    }
  }, [resources, addMediaFile, addEffect, addFilter, addResource, removeResource, updateResource, getResourceStats])

  const stats = getResourceStats()
  logInfo("[useResourcesAIIntegration] Готов", { isIntegrated: true, stats })

  return {
    isIntegrated: true,
    resourceStats: stats as AIResourceStats,
  }
}

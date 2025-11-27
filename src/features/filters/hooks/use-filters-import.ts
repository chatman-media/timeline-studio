import { useCallback, useMemo, useState } from "react"

import { container } from "@/core"
import { useResources } from "@/features/resources"
import { logError, logInfo } from "@/lib/tauri-logger"

import type { VideoFilter } from "../types/filters"

/**
 * Хук для импорта пользовательских фильтров
 * Позволяет импортировать JSON файлы с фильтрами или отдельные файлы фильтров
 */
export function useFiltersImport() {
  const [isImporting, setIsImporting] = useState(false)
  const { addFilter } = useResources()

  const platform = useMemo(() => {
    try {
      return container.hasPlatform() ? container.getPlatform() : null
    } catch {
      return null
    }
  }, [])

  /**
   * Импорт JSON файла с фильтрами
   */
  const importFiltersFile = useCallback(async () => {
    await logInfo("Starting filters file import")

    if (isImporting) {
      await logInfo("Import already in progress")
      return
    }

    setIsImporting(true)
    try {
      if (!platform) {
        await logError("Platform service not available")
        setIsImporting(false)
        return
      }

      const selected = await platform.showOpenDialog({
        multiple: false,
        filters: [
          {
            name: "Filters JSON",
            extensions: ["json"],
          },
        ],
      })

      if (selected) {
        const filePath = Array.isArray(selected) ? selected[0] : selected
        // Читаем содержимое JSON файла
        const content = await platform.readTextFile(filePath)
        const filtersData = JSON.parse(content)

        // Проверяем формат данных
        if (Array.isArray(filtersData)) {
          // Импортируем каждый фильтр
          for (const filterData of filtersData) {
            if (filterData.id && filterData.name && filterData.category) {
              void addFilter(filterData as VideoFilter)
            }
          }
          await logInfo(`Imported ${filtersData.length} filters`, { count: filtersData.length })
        } else if (filtersData.filters && Array.isArray(filtersData.filters)) {
          // Альтернативный формат с обёрткой
          for (const filterData of filtersData.filters) {
            if (filterData.id && filterData.name && filterData.category) {
              void addFilter(filterData as VideoFilter)
            }
          }
          await logInfo(`Imported ${filtersData.filters.length} filters`, {
            count: filtersData.filters.length,
          })
        }
      }
    } catch (error) {
      await logError("Error importing filters file", { error })
    } finally {
      setIsImporting(false)
    }
  }, [isImporting, addFilter])

  /**
   * Импорт отдельных файлов фильтров (.cube, .3dl, .lut)
   */
  const importFilterFile = useCallback(async () => {
    await logInfo("Starting filter files import")

    if (isImporting) {
      await logInfo("Import already in progress")
      return
    }

    setIsImporting(true)
    try {
      if (!platform) {
        await logError("Platform service not available")
        setIsImporting(false)
        return
      }

      const selected = await platform.showOpenDialog({
        multiple: true,
        filters: [
          {
            name: "Filter Files",
            extensions: ["cube", "3dl", "lut", "preset"],
          },
        ],
      })

      if (selected) {
        const files = Array.isArray(selected) ? selected : [selected]

        // Обрабатываем каждый файл
        for (const filePath of files) {
          const fileName = filePath.split("/").pop() || ""
          const fileExtension = fileName.split(".").pop()?.toLowerCase()

          // Создаем объект фильтра на основе файла
          const filter: VideoFilter = {
            id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            name: fileName.replace(/\.[^/.]+$/, ""), // Убираем расширение
            category: "creative", // По умолчанию для импортированных
            complexity: "intermediate",
            tags: ["standard"],
            description: {
              en: `Custom ${fileExtension?.toUpperCase()} filter imported from ${fileName}`,
            },
            labels: {
              en: fileName.replace(/\.[^/.]+$/, ""),
            },
            params: {
              // Базовые параметры для LUT файлов
              brightness: 1,
              contrast: 1,
              saturation: 1,
            },
          }

          // Добавляем фильтр в ресурсы
          void addFilter(filter)
        }

        await logInfo(`Imported ${files.length} filter files`, { count: files.length })
      }
    } catch (error) {
      await logError("Error importing filter files", { error })
    } finally {
      setIsImporting(false)
    }
  }, [isImporting, addFilter])

  return {
    importFiltersFile,
    importFilterFile,
    isImporting,
  }
}

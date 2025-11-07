import { open } from "@tauri-apps/plugin-dialog"
import { readTextFile } from "@tauri-apps/plugin-fs"
import { useCallback, useState } from "react"

import { logError, logInfo } from "@/lib/tauri-logger"
import { useResources } from "@/features/resources"

import type { VideoFilter } from "../types/filters"

/**
 * Хук для импорта пользовательских фильтров
 * Позволяет импортировать JSON файлы с фильтрами или отдельные файлы фильтров
 */
export function useFiltersImport() {
  const [isImporting, setIsImporting] = useState(false)
  const { addFilter } = useResources()

  /**
   * Импорт JSON файла с фильтрами
   */
  const importFiltersFile = useCallback(async () => {
    logInfo("useFiltersImport", "Starting filters file import")

    if (isImporting) {
      logInfo("useFiltersImport", "Import already in progress")
      return
    }

    setIsImporting(true)
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Filters JSON",
            extensions: ["json"],
          },
        ],
      })

      if (selected) {
        // Читаем содержимое JSON файла
        const content = await readTextFile(selected)
        const filtersData = JSON.parse(content)

        // Проверяем формат данных
        if (Array.isArray(filtersData)) {
          // Импортируем каждый фильтр
          for (const filterData of filtersData) {
            if (filterData.id && filterData.name && filterData.category) {
              void addFilter(filterData as VideoFilter)
            }
          }
          logInfo("useFiltersImport", `Imported ${filtersData.length} filters`)
          console.log(`Импортировано ${filtersData.length} фильтров`)
        } else if (filtersData.filters && Array.isArray(filtersData.filters)) {
          // Альтернативный формат с обёрткой
          for (const filterData of filtersData.filters) {
            if (filterData.id && filterData.name && filterData.category) {
              void addFilter(filterData as VideoFilter)
            }
          }
          logInfo("useFiltersImport", `Imported ${filtersData.filters.length} filters`)
          console.log(`Импортировано ${filtersData.filters.length} фильтров`)
        }
      }
    } catch (error) {
      logError("useFiltersImport", "Error importing filters file", error)
      console.error("Ошибка при импорте фильтров:", error)
    } finally {
      setIsImporting(false)
    }
  }, [isImporting])

  /**
   * Импорт отдельных файлов фильтров (.cube, .3dl, .lut)
   */
  const importFilterFile = useCallback(async () => {
    logInfo("useFiltersImport", "Starting filter files import")

    if (isImporting) {
      logInfo("useFiltersImport", "Import already in progress")
      return
    }

    setIsImporting(true)
    try {
      const selected = await open({
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

        logInfo("useFiltersImport", `Imported ${files.length} filter files`)
        console.log(`Импортировано ${files.length} файлов фильтров`)
      }
    } catch (error) {
      logError("useFiltersImport", "Error importing filter files", error)
      console.error("Ошибка при импорте файлов фильтров:", error)
    } finally {
      setIsImporting(false)
    }
  }, [isImporting])

  return {
    importFiltersFile,
    importFilterFile,
    isImporting,
  }
}

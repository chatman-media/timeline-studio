import { open } from "@tauri-apps/plugin-dialog"
import { readTextFile } from "@tauri-apps/plugin-fs"
import { useCallback, useState } from "react"

import { useResources } from "@/features/resources"
import { createLogger } from "@/lib/tauri-logger"

import type { StyleTemplate } from "../types"

const logger = createLogger({ module: "useStyleTemplatesImport" })

/**
 * Хук для импорта пользовательских стилистических шаблонов
 * Позволяет импортировать JSON файлы со стилистическими шаблонами
 *
 * TODO: В будущем добавить поддержку форматов:
 * - .bundle (Filmora стили)
 * - .zip (упакованные стили)
 * - .css (CSS стили)
 * - .aep (After Effects шаблоны)
 */
export function useStyleTemplatesImport() {
  const [isImporting, setIsImporting] = useState(false)
  const { addStyleTemplate } = useResources()

  /**
   * Импорт JSON файла со стилистическими шаблонами
   */
  const importStyleTemplatesFile = useCallback(async () => {
    if (isImporting) {
      void logger.info("Import already in progress")
      return
    }

    setIsImporting(true)
    void logger.info("Starting style templates file import")
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Style Templates JSON",
            extensions: ["json"],
          },
        ],
      })

      if (selected) {
        void logger.info(`File selected: ${selected}`)
        // Читаем содержимое JSON файла
        const content = await readTextFile(selected)
        const templatesData = JSON.parse(content)

        // Проверяем формат данных
        if (Array.isArray(templatesData)) {
          void logger.info(`Importing ${templatesData.length} templates from array format`)
          // Импортируем каждый шаблон
          for (const templateData of templatesData) {
            if (validateStyleTemplate(templateData)) {
              void addStyleTemplate(templateData as StyleTemplate)
            }
          }
          void logger.info(`Successfully imported ${templatesData.length} style templates`)
        } else if (templatesData.templates && Array.isArray(templatesData.templates)) {
          void logger.info(`Importing ${templatesData.templates.length} templates from object format`)
          // Альтернативный формат с обёрткой
          for (const templateData of templatesData.templates) {
            if (validateStyleTemplate(templateData)) {
              void addStyleTemplate(templateData as StyleTemplate)
            }
          }
          void logger.info(`Successfully imported ${templatesData.templates.length} style templates`)
        } else {
          void logger.error("Invalid style templates file format")
        }
      } else {
        void logger.info("File selection cancelled by user")
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      void logger.error("Import failed", { error: errorMsg })
    } finally {
      setIsImporting(false)
    }
  }, [isImporting, addStyleTemplate])

  /**
   * Импорт отдельных файлов стилистических шаблонов
   * Пока поддерживает только JSON, в будущем добавим другие форматы
   */
  const importStyleTemplateFile = useCallback(async () => {
    if (isImporting) {
      void logger.info("Import already in progress")
      return
    }

    setIsImporting(true)
    void logger.info("Starting style template files import")
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Style Template Files",
            extensions: ["json"], // TODO: добавить "bundle", "zip", "css", "aep"
          },
        ],
      })

      if (selected) {
        const files = Array.isArray(selected) ? selected : [selected]
        void logger.info(`Selected ${files.length} style template files`)

        // Обрабатываем каждый файл
        for (const filePath of files) {
          const fileName = filePath.split("/").pop() || ""
          const fileExtension = fileName.split(".").pop()?.toLowerCase()

          void logger.info(`Processing file: ${fileName}`)

          if (fileExtension === "json") {
            // Читаем JSON файл
            const content = await readTextFile(filePath)
            const templateData = JSON.parse(content)

            if (validateStyleTemplate(templateData)) {
              void addStyleTemplate(templateData as StyleTemplate)
              void logger.info(`Successfully imported template from file: ${fileName}`)
            } else {
              void logger.info(`File ${fileName} has invalid template structure`)
            }
          } else {
            void logger.info(`File format ${fileExtension} not supported yet`)
          }
        }

        void logger.info(`Completed processing ${files.length} style template files`)
      } else {
        void logger.info("File selection cancelled by user")
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      void logger.error("Failed to import style template files", { error: errorMsg })
    } finally {
      setIsImporting(false)
    }
  }, [isImporting, addStyleTemplate])

  return {
    importStyleTemplatesFile,
    importStyleTemplateFile,
    isImporting,
  }
}

/**
 * Валидация структуры стилистического шаблона
 */
function validateStyleTemplate(template: any): boolean {
  return (
    template &&
    typeof template.id === "string" &&
    template.name &&
    typeof template.name.ru === "string" &&
    typeof template.name.en === "string" &&
    template.category &&
    template.style &&
    template.aspectRatio &&
    typeof template.duration === "number" &&
    Array.isArray(template.elements)
  )
}

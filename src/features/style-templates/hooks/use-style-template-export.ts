/**
 * Хук для экспорта и импорта стилистических шаблонов
 */

import { useCallback, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import type { StyleTemplate } from "../types"

const logger = createLogger("useStyleTemplateExport")

interface UseStyleTemplateExportReturn {
  exportTemplate: (template: StyleTemplate) => Promise<void>
  exportTemplates: (templates: StyleTemplate[]) => Promise<void>
  isExporting: boolean
  exportError: string | null
}

/**
 * Хук для экспорта стилистических шаблонов в JSON файлы
 */
export function useStyleTemplateExport(): UseStyleTemplateExportReturn {
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  /**
   * Экспорт одного шаблона
   */
  const exportTemplate = useCallback(async (template: StyleTemplate) => {
    setIsExporting(true)
    setExportError(null)

    try {
      // Создаем JSON строку с форматированием
      const json = JSON.stringify(template, null, 2)
      const blob = new Blob([json], { type: "application/json" })

      // Создаем имя файла из названия шаблона
      const templateName =
        typeof template.name === "string" ? template.name : template.name.en || template.name.ru || template.id
      const fileName = `${templateName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`

      // Скачиваем файл через браузер
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      logger.info("Шаблон успешно экспортирован:", { templateId: template.id, fileName })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка"
      setExportError(errorMessage)
      logger.error("Ошибка экспорта шаблона:", { error })
      throw error
    } finally {
      setIsExporting(false)
    }
  }, [])

  /**
   * Экспорт нескольких шаблонов в один файл
   */
  const exportTemplates = useCallback(async (templates: StyleTemplate[]) => {
    setIsExporting(true)
    setExportError(null)

    try {
      // Создаем JSON строку с массивом шаблонов
      const json = JSON.stringify(templates, null, 2)
      const blob = new Blob([json], { type: "application/json" })

      // Генерируем имя файла с датой
      const date = new Date().toISOString().split("T")[0]
      const fileName = `style_templates_${date}.json`

      // Скачиваем файл
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      logger.info("Шаблоны успешно экспортированы:", { count: templates.length, fileName })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка"
      setExportError(errorMessage)
      logger.error("Ошибка экспорта шаблонов:", { error })
      throw error
    } finally {
      setIsExporting(false)
    }
  }, [])

  return {
    exportTemplate,
    exportTemplates,
    isExporting,
    exportError,
  }
}

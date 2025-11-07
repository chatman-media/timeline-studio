import { open } from "@tauri-apps/plugin-dialog"
import { useCallback, useState } from "react"

import type { Transition } from "@/features/transitions/types/transitions"
import { logError, logInfo } from "@/lib/tauri-logger"

/**
 * Интерфейс для результата импорта переходов
 */
interface ImportResult {
  success: boolean
  message: string
  transitions: Transition[]
}

/**
 * Хук для импорта пользовательских переходов
 * Позволяет импортировать JSON файлы с переходами или отдельные файлы переходов
 */
export function useTransitionsImport() {
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)

  /**
   * Валидация структуры перехода
   */
  const validateTransition = (transition: any): transition is Transition => {
    return (
      transition &&
      typeof transition.id === "string" &&
      typeof transition.type === "string" &&
      transition.labels &&
      typeof transition.labels.ru === "string" &&
      typeof transition.labels.en === "string" &&
      typeof transition.category === "string" &&
      typeof transition.complexity === "string" &&
      Array.isArray(transition.tags)
    )
  }

  /**
   * Импорт JSON файла с переходами
   */
  const importTransitionsFile = useCallback(async (): Promise<ImportResult> => {
    if (isImporting) {
      void logInfo("Import already in progress")
      return {
        success: false,
        message: "Импорт уже выполняется",
        transitions: [],
      }
    }

    setIsImporting(true)
    setProgress(0)
    void logInfo("Starting transitions file import")

    try {
      // Открываем диалог выбора JSON файла
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Transitions JSON",
            extensions: ["json"],
          },
        ],
      })

      if (!selected) {
        void logInfo("File selection cancelled by user")
        setIsImporting(false)
        return {
          success: false,
          message: "Файл не выбран",
          transitions: [],
        }
      }

      void logInfo(`File selected: ${selected}`)
      setProgress(25)

      // Читаем файл
      const response = await fetch(`file://${selected}`)
      const data = await response.json()
      void logInfo("File loaded and parsed successfully")

      setProgress(50)

      // Валидируем структуру
      let transitions: Transition[] = []

      if (Array.isArray(data)) {
        // Массив переходов
        transitions = data.filter(validateTransition)
        void logInfo(`Validating array format, found ${transitions.length} valid transitions`)
      } else if (data.transitions && Array.isArray(data.transitions)) {
        // Объект с полем transitions
        transitions = data.transitions.filter(validateTransition)
        void logInfo(`Validating object format, found ${transitions.length} valid transitions`)
      } else if (validateTransition(data)) {
        // Один переход
        transitions = [data]
        void logInfo("Validating single transition")
      } else {
        void logError("Invalid transitions file structure")
        setIsImporting(false)
        return {
          success: false,
          message: "Неверная структура файла переходов",
          transitions: [],
        }
      }

      setProgress(75)

      if (transitions.length === 0) {
        void logError("No valid transitions found in file")
        setIsImporting(false)
        return {
          success: false,
          message: "В файле не найдено валидных переходов",
          transitions: [],
        }
      }

      void logInfo(`Successfully imported ${transitions.length} transitions`)
      setProgress(100)
      setIsImporting(false)

      return {
        success: true,
        message: `Успешно импортировано ${transitions.length} переходов`,
        transitions,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      void logError(`Import failed: ${errorMsg}`)
      setIsImporting(false)
      return {
        success: false,
        message: `Ошибка при импорте: ${errorMsg}`,
        transitions: [],
      }
    }
  }, [isImporting])

  /**
   * Импорт отдельного файла перехода
   */
  const importTransitionFile = useCallback(async (): Promise<ImportResult> => {
    if (isImporting) {
      void logInfo("Import already in progress")
      return {
        success: false,
        message: "Импорт уже выполняется",
        transitions: [],
      }
    }

    setIsImporting(true)
    setProgress(0)
    void logInfo("Starting transition files import")

    try {
      // Открываем диалог выбора файла перехода
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Transition Files",
            extensions: ["json", "preset", "transition"],
          },
        ],
      })

      if (!selected) {
        void logInfo("File selection cancelled by user")
        setIsImporting(false)
        return {
          success: false,
          message: "Файлы не выбраны",
          transitions: [],
        }
      }

      const files = Array.isArray(selected) ? selected : [selected]
      void logInfo(`Selected ${files.length} transition files`)
      setProgress(25)

      const importedTransitions: Transition[] = []

      for (let i = 0; i < files.length; i++) {
        const filePath = files[i]
        const fileName = filePath.split("/").pop() || filePath.split("\\").pop() || "unknown"
        const extension = fileName.split(".").pop()?.toLowerCase()

        void logInfo(`Processing file ${i + 1}/${files.length}: ${fileName}`)

        // Создаем базовый переход на основе файла
        const transition: Transition = {
          id: `user-${Date.now()}-${i}`,
          type: extension === "transition" ? "custom" : "imported",
          labels: {
            ru: fileName.replace(/\.[^/.]+$/, ""),
            en: fileName.replace(/\.[^/.]+$/, ""),
            es: fileName.replace(/\.[^/.]+$/, ""),
            fr: fileName.replace(/\.[^/.]+$/, ""),
            de: fileName.replace(/\.[^/.]+$/, ""),
          },
          description: {
            ru: `Пользовательский переход: ${fileName}`,
            en: `User transition: ${fileName}`,
          },
          category: "creative",
          complexity: "intermediate",
          tags: ["fallback"],
          duration: { min: 0.5, max: 3.0, default: 1.0 },
          parameters: {},
          ffmpegCommand: () => `custom=${filePath}`,
        }

        importedTransitions.push(transition)
        setProgress(25 + (i + 1) * (50 / files.length))
      }

      void logInfo(`Successfully created ${importedTransitions.length} transition objects`)
      setProgress(100)
      setIsImporting(false)

      return {
        success: true,
        message: `Успешно импортировано ${importedTransitions.length} файлов переходов`,
        transitions: importedTransitions,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      void logError(`Transition files import failed: ${errorMsg}`)
      setIsImporting(false)
      return {
        success: false,
        message: `Ошибка при импорте: ${errorMsg}`,
        transitions: [],
      }
    }
  }, [isImporting])

  return {
    importTransitionsFile,
    importTransitionFile,
    isImporting,
    progress,
  }
}

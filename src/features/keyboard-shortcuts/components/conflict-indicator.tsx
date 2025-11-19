import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ConflictInfo } from "../services/shortcuts-conflicts"

interface ConflictIndicatorProps {
  conflicts: ConflictInfo[]
  shortcutId?: string
  className?: string
}

/**
 * Компонент для отображения индикатора конфликтов клавиатурных сочетаний
 */
export function ConflictIndicator({ conflicts, shortcutId, className = "" }: ConflictIndicatorProps) {
  const { t } = useTranslation()

  // Фильтруем конфликты для конкретного shortcut если передан ID
  const relevantConflicts = shortcutId
    ? conflicts.filter((c) => c.shortcuts.some((s) => s.id === shortcutId))
    : conflicts

  if (relevantConflicts.length === 0) {
    return null
  }

  // Определяем наиболее серьезный конфликт
  const severity = relevantConflicts.some((c) => c.severity === "error") ? "error" : "warning"

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-1 ${className}`}
            role="alert"
            aria-label={t("dialogs.keyboardShortcuts.conflictDetected", "Обнаружен конфликт")}
          >
            <AlertTriangle
              className={`h-4 w-4 ${
                severity === "error" ? "text-red-500 dark:text-red-400" : "text-yellow-500 dark:text-yellow-400"
              }`}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-md">
          <div className="space-y-2">
            <p className="font-semibold">
              {severity === "error"
                ? t("dialogs.keyboardShortcuts.criticalConflict", "Критический конфликт")
                : t("dialogs.keyboardShortcuts.potentialConflict", "Потенциальный конфликт")}
            </p>
            {relevantConflicts.map((conflict, index) => (
              <div key={index} className="text-sm">
                <p className="font-mono text-xs text-gray-600 dark:text-gray-400">{conflict.key}</p>
                <ul className="mt-1 ml-4 list-disc">
                  {conflict.shortcuts.map((shortcut) => (
                    <li key={shortcut.id}>
                      {shortcut.name}
                      {shortcut.context && shortcut.context !== "global" && (
                        <span className="ml-1 text-xs text-gray-500">({shortcut.context})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

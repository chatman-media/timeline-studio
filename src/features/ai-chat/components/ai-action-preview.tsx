/**
 * AI Action Preview - превью действий AI перед выполнением
 *
 * Показывает что AI планирует сделать и позволяет подтвердить или отменить
 */

import { AlertCircle, Check, ChevronDown, ChevronRight, X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ActionPreviewItem {
  /**
   * ID инструмента
   */
  id: string

  /**
   * Название инструмента
   */
  name: string

  /**
   * Описание действия (что будет сделано)
   */
  description: string

  /**
   * Параметры действия
   */
  params: Record<string, any>

  /**
   * Уровень риска (высокий, средний, низкий)
   */
  risk?: "high" | "medium" | "low"
}

export interface AIActionPreviewProps {
  /**
   * Список действий для превью
   */
  actions: ActionPreviewItem[]

  /**
   * Callback при подтверждении
   */
  onConfirm: () => void

  /**
   * Callback при отмене
   */
  onCancel: () => void

  /**
   * Дополнительный className
   */
  className?: string
}

export function AIActionPreview({ actions, onConfirm, onCancel, className }: AIActionPreviewProps) {
  const { t } = useTranslation()
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set())

  const toggleAction = (id: string) => {
    const newExpanded = new Set(expandedActions)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedActions(newExpanded)
  }

  const getRiskColor = (risk?: "high" | "medium" | "low") => {
    switch (risk) {
      case "high":
        return "text-red-500 bg-red-500/10 border-red-500/20"
      case "medium":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20"
      case "low":
        return "text-green-500 bg-green-500/10 border-green-500/20"
      default:
        return "text-blue-500 bg-blue-500/10 border-blue-500/20"
    }
  }

  const getRiskLabel = (risk?: "high" | "medium" | "low") => {
    switch (risk) {
      case "high":
        return t("ai.actionPreview.riskHigh", "Высокий риск")
      case "medium":
        return t("ai.actionPreview.riskMedium", "Средний риск")
      case "low":
        return t("ai.actionPreview.riskLow", "Низкий риск")
      default:
        return t("ai.actionPreview.riskUnknown", "Неизвестно")
    }
  }

  return (
    <div className={cn("rounded-lg border border-blue-500/20 bg-blue-500/5 p-4", className)}>
      {/* Заголовок */}
      <div className="mb-3 flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-blue-500" />
        <h3 className="font-medium text-foreground">
          {t("ai.actionPreview.title", "AI планирует выполнить следующие действия")}
        </h3>
      </div>

      {/* Список действий */}
      <div className="mb-4 space-y-2">
        {actions.map((action, index) => (
          <div key={action.id} className="overflow-hidden rounded-lg border border-border bg-muted/30">
            {/* Заголовок действия */}
            <button
              type="button"
              onClick={() => toggleAction(action.id)}
              className="flex w-full items-center gap-2 p-3 text-left hover:bg-muted/50 transition-colors"
            >
              {/* Номер */}
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
                {index + 1}
              </span>

              {/* Иконка раскрытия */}
              {expandedActions.has(action.id) ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              )}

              {/* Описание */}
              <div className="flex-1">
                <div className="font-medium text-foreground">{action.name}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>

              {/* Уровень риска */}
              {action.risk && (
                <span
                  className={cn(
                    "flex-shrink-0 rounded-md border px-2 py-1 text-xs font-medium",
                    getRiskColor(action.risk),
                  )}
                >
                  {getRiskLabel(action.risk)}
                </span>
              )}
            </button>

            {/* Детали (раскрывающиеся) */}
            {expandedActions.has(action.id) && (
              <div className="border-t border-border bg-muted/20 p-3">
                <div className="text-xs text-muted-foreground">
                  <div className="mb-1 font-medium text-foreground">
                    {t("ai.actionPreview.parameters", "Параметры")}:
                  </div>
                  <pre className="overflow-x-auto rounded bg-background/50 p-2 font-mono text-xs">
                    {JSON.stringify(action.params, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Кнопки подтверждения */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} className="gap-1">
          <X className="h-4 w-4" />
          {t("ai.actionPreview.cancel", "Отменить")}
        </Button>
        <Button variant="default" size="sm" onClick={onConfirm} className="gap-1 bg-teal hover:bg-teal/90 text-white">
          <Check className="h-4 w-4" />
          {t("ai.actionPreview.confirm", "Выполнить")}
        </Button>
      </div>
    </div>
  )
}

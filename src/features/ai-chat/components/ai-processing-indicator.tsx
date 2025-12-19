/**
 * AI Processing Indicator - детальный индикатор процесса обработки AI
 *
 * Показывает что именно AI делает сейчас:
 * - Анализ контекста
 * - Использование инструментов
 * - Генерация ответа
 */

import { Bot, Loader2, Settings, Sparkles, Wrench } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

export type AIProcessingStage = "analyzing" | "using-tools" | "generating" | "idle"

export interface AIProcessingIndicatorProps {
  /**
   * Текущий этап обработки
   */
  stage: AIProcessingStage

  /**
   * Список используемых инструментов (для этапа "using-tools")
   */
  toolsInUse?: string[]

  /**
   * Прогресс выполнения (0-100)
   */
  progress?: number

  /**
   * Дополнительный className
   */
  className?: string
}

export function AIProcessingIndicator({ stage, toolsInUse = [], progress, className }: AIProcessingIndicatorProps) {
  const { t } = useTranslation()

  if (stage === "idle") {
    return null
  }

  const getStageIcon = () => {
    switch (stage) {
      case "analyzing":
        return <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" data-oid="sca4u5_" />

      case "using-tools":
        return <Wrench className="h-4 w-4 text-orange-500 animate-pulse" data-oid="0mb6rcu" />

      case "generating":
        return <Bot className="h-4 w-4 text-green-500 animate-pulse" data-oid="eot30a_" />

      default:
        return <Loader2 className="h-4 w-4 animate-spin" data-oid="iounwew" />
    }
  }

  const getStageText = () => {
    switch (stage) {
      case "analyzing":
        return t("ai.processing.analyzing", "Анализирую контекст проекта...")
      case "using-tools":
        if (toolsInUse.length > 0) {
          return t("ai.processing.usingTools", `Использую инструменты: ${toolsInUse.join(", ")}`)
        }
        return t("ai.processing.preparingTools", "Подготавливаю инструменты...")
      case "generating":
        return t("ai.processing.generating", "Генерирую ответ...")
      default:
        return t("ai.processing.processing", "Обработка...")
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground",
        className,
      )}
      data-oid="i2_y:kv"
    >
      {/* Иконка этапа */}
      <div className="shrink-0" data-oid="mhl4dbw">
        {getStageIcon()}
      </div>

      {/* Текст этапа */}
      <div className="flex-1" data-oid="h4malld">
        <div className="font-medium" data-oid="akzjunz">
          {getStageText()}
        </div>

        {/* Детали инструментов */}
        {stage === "using-tools" && toolsInUse.length > 1 && (
          <div className="mt-1 flex flex-wrap gap-1" data-oid="xqc2b1j">
            {toolsInUse.map((tool, index) => (
              <span
                key={`${tool}-${index}`}
                className="inline-flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-0.5 text-xs text-orange-500"
                data-oid="in9zr8u"
              >
                <Settings className="h-3 w-3" data-oid="z.oorel" />
                {tool}
              </span>
            ))}
          </div>
        )}

        {/* Прогресс бар */}
        {progress !== undefined && progress > 0 && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted" data-oid="m9_7ojg">
            <div
              className="h-full bg-teal transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              data-oid="x-6n0ll"
            />
          </div>
        )}
      </div>

      {/* Анимация точек */}
      <div className="flex gap-1" data-oid="iem2f0-">
        <div
          className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
          style={{ animationDelay: "0ms" }}
          data-oid="oszx-cz"
        />

        <div
          className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
          style={{ animationDelay: "150ms" }}
          data-oid="l6crg2l"
        />

        <div
          className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
          style={{ animationDelay: "300ms" }}
          data-oid="h9in6_d"
        />
      </div>
    </div>
  )
}

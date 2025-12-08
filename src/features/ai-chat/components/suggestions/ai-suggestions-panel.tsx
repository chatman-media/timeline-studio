/**
 * AI Suggestions Panel - панель с умными промтами
 *
 * Показывается над полем ввода в AI Chat
 * Предлагает контекстные промты на основе результатов AI Director анализа
 */

import { Sparkles } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"

import { analyzeContextForPrompts, createAnalysisContext } from "./context-analyzer"
import type { AnalysisContext, SuggestedPrompt } from "./types"

const logger = createLogger({ module: "AISuggestionsPanel" })

export interface AISuggestionsPanelProps {
  /**
   * Результаты AI Director анализа (опционально)
   */
  analysisResult?: any // ComprehensiveAnalysisResult

  /**
   * Количество медиа файлов в проекте
   */
  mediaFilesCount: number

  /**
   * Callback при клике на промт
   */
  onPromptClick: (promptText: string) => void

  /**
   * Callback для автоотправки (опционально)
   * Если указан - промт сразу отправляется в AI без дополнительного клика
   */
  onAutoSend?: (promptText: string) => void

  /**
   * Дополнительный className
   */
  className?: string

  /**
   * Показывать ли панель
   */
  visible?: boolean
}

export function AISuggestionsPanel({
  analysisResult,
  mediaFilesCount,
  onPromptClick,
  onAutoSend,
  className,
  visible = true,
}: AISuggestionsPanelProps) {
  const { t } = useTranslation()

  // Создаём контекст анализа
  const context: AnalysisContext = useMemo(() => {
    return createAnalysisContext({
      analysisResult,
      mediaFilesCount,
    })
  }, [analysisResult, mediaFilesCount])

  // Получаем подходящие промты (ограничиваем до 2)
  const prompts: SuggestedPrompt[] = useMemo(() => {
    const result = analyzeContextForPrompts(context).slice(0, 2)
    logger.info("Generated prompts for display", {
      count: result.length,
      hasAnalysis: context.hasAnalysisResults,
    })
    return result
  }, [context])

  // Если панель скрыта или нет промтов - не рендерим
  if (!visible || prompts.length === 0) {
    return null
  }

  // Форматируем сообщение о результатах анализа
  const getAnalysisSummary = (): string | null => {
    if (!context.hasAnalysisResults) {
      return null
    }

    const parts: string[] = []

    if (context.sceneCount && context.sceneCount > 0) {
      parts.push(t("ai.suggestions.scenes", `${context.sceneCount} сцен`))
    }

    if (context.momentCount && context.momentCount > 0) {
      parts.push(t("ai.suggestions.moments", `${context.momentCount} моментов`))
    }

    if (context.hasMusic) {
      parts.push(t("ai.suggestions.music", "музыка"))
    }

    if (context.facesCount && context.facesCount > 0) {
      parts.push(t("ai.suggestions.faces", `${context.facesCount} лиц`))
    }

    if (parts.length === 0) {
      return t("ai.suggestions.analysisComplete", "Анализ завершён")
    }

    return `✨ ${t("ai.suggestions.detected", "Обнаружено")}: ${parts.join(", ")}`
  }

  const analysisSummary = getAnalysisSummary()

  return (
    <div className={cn("border-b border-border bg-muted/30 p-3", className)}>
      {/* Сообщение о результатах анализа */}
      {analysisSummary && (
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span>{analysisSummary}</span>
        </div>
      )}

      {/* Заголовок */}
      <div className="mb-2 text-xs font-medium text-foreground">
        💡 {t("ai.suggestions.whatCanDo", "Что можно сделать")}:
      </div>

      {/* Промты */}
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <Button
            key={prompt.id}
            variant="outline"
            size="sm"
            onClick={() => {
              logger.info("Prompt clicked", {
                promptId: prompt.id,
                text: prompt.text,
                autoSend: !!onAutoSend,
              })

              // Если есть onAutoSend - сразу отправляем промт
              if (onAutoSend) {
                onAutoSend(prompt.text)
              } else {
                // Иначе просто вставляем текст в поле
                onPromptClick(prompt.text)
              }
            }}
            className="h-auto whitespace-normal py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground"
            title={prompt.text}
          >
            <span className="mr-1">{prompt.emoji}</span>
            <span className="line-clamp-2">{prompt.text}</span>
          </Button>
        ))}
      </div>

      {/* Подсказка */}
      {mediaFilesCount === 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          {t("ai.suggestions.emptyHint", "Добавьте видео в браузер медиа или используйте AI для помощи с импортом")}
        </div>
      )}
    </div>
  )
}

/**
 * Analysis Progress Indicator
 *
 * Глобальный индикатор прогресса AI-анализа
 * Отображается в правом верхнем углу при активном анализе
 */

"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Sparkles, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export interface AnalysisProgressIndicatorProps {
  fileName?: string
  stage?: string
  progress?: number
  isVisible: boolean
  className?: string
  onDismiss?: () => void
}

/**
 * Форматирование имени файла для отображения
 */
function formatFileName(filePath: string): string {
  const fileName = filePath.split(/[/\\]/).pop() || filePath
  const maxLength = 25

  if (fileName.length > maxLength) {
    return `${fileName.slice(0, maxLength - 3)}...`
  }

  return fileName
}

/**
 * Получение читаемого названия этапа
 */
function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    initialization: "Инициализация",
    audio: "Анализ аудио",
    video: "Анализ видео",
    scene_detection: "Детекция сцен",
    emotion: "Анализ эмоций",
    quality: "Анализ качества",
    key_moments: "Ключевые моменты",
    integration: "Интеграция данных",
    finalization: "Завершение",
  }

  return labels[stage] || stage
}

export function AnalysisProgressIndicator({
  fileName,
  stage,
  progress = 0,
  isVisible,
  className,
  onDismiss,
}: AnalysisProgressIndicatorProps) {
  const displayFileName = fileName ? formatFileName(fileName) : "Анализ..."
  const displayStage = stage ? getStageLabel(stage) : "Подготовка"
  const displayProgress = Math.round(progress)

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20, x: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn("fixed top-4 right-4 z-50", className)}
        >
          <Popover>
            <PopoverTrigger asChild>
              <motion.div
                animate={{
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <Badge
                  variant="secondary"
                  className={cn(
                    "flex items-center gap-2 pr-2 cursor-pointer",
                    "bg-background/95 backdrop-blur-lg border-border shadow-lg",
                    "hover:bg-accent transition-colors",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <Sparkles className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex flex-col items-start text-xs">
                    <span className="font-medium">{displayFileName}</span>
                    <span className="text-muted-foreground text-[10px]">{displayProgress}%</span>
                  </div>
                </Badge>
              </motion.div>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-80 p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">AI Анализ в процессе</h4>
                  </div>
                  {onDismiss && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDismiss}>
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* File name */}
                <div className="space-y-1">
                  <p className="text-sm font-medium truncate" title={fileName}>
                    {displayFileName}
                  </p>
                  {fileName && (
                    <p className="text-xs text-muted-foreground truncate" title={fileName}>
                      {fileName}
                    </p>
                  )}
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{displayStage}</span>
                    <span className="font-medium">{displayProgress}%</span>
                  </div>
                  <Progress value={displayProgress} className="h-2" />
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Анализ может занять некоторое время...</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Analysis Progress Indicator
 *
 * Глобальный индикатор прогресса AI-анализа
 * Отображается в правом верхнем углу при активном анализе
 */

"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Sparkles, X } from "lucide-react"

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@timeline-studio/ui/components/popover"
import { Progress } from "@timeline-studio/ui/components/progress"
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
    <AnimatePresence data-oid="9ifkjog">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20, x: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn("fixed top-4 right-4 z-50", className)}
          data-oid="_:kisu_"
        >
          <Popover data-oid="gyabu:f">
            <PopoverTrigger asChild data-oid="iua40xl">
              <motion.div
                animate={{
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                data-oid="qhzn3l1"
              >
                <Badge
                  variant="secondary"
                  className={cn(
                    "flex items-center gap-2 pr-2 cursor-pointer",
                    "bg-background/95 backdrop-blur-lg border-border shadow-lg",
                    "hover:bg-accent transition-colors",
                  )}
                  data-oid="comjuvg"
                >
                  <div className="flex items-center gap-2" data-oid="gy-fmhp">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" data-oid="ux6-it5" />
                    <Sparkles className="h-3 w-3 text-primary" data-oid="7eqc1mg" />
                  </div>
                  <div className="flex flex-col items-start text-xs" data-oid="5gpni::">
                    <span className="font-medium" data-oid="qwc5gth">
                      {displayFileName}
                    </span>
                    <span className="text-muted-foreground text-[10px]" data-oid="s6r48rq">
                      {displayProgress}%
                    </span>
                  </div>
                </Badge>
              </motion.div>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-80 p-4" data-oid="gheis.-">
              <div className="space-y-3" data-oid="303e1v2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2" data-oid="btq7op0">
                  <div className="flex items-center gap-2" data-oid="l5o:_lb">
                    <Sparkles className="h-4 w-4 text-primary" data-oid="9e6j1eu" />
                    <h4 className="font-semibold text-sm" data-oid="nq0kn9s">
                      AI Анализ в процессе
                    </h4>
                  </div>
                  {onDismiss && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDismiss} data-oid=":vftpwr">
                      <X className="h-3 w-3" data-oid="u4vjlnu" />
                    </Button>
                  )}
                </div>

                {/* File name */}
                <div className="space-y-1" data-oid="85qzem8">
                  <p className="text-sm font-medium truncate" title={fileName} data-oid="offfjeq">
                    {displayFileName}
                  </p>
                  {fileName && (
                    <p className="text-xs text-muted-foreground truncate" title={fileName} data-oid="7-cxn:e">
                      {fileName}
                    </p>
                  )}
                </div>

                {/* Progress */}
                <div className="space-y-2" data-oid="8jgddd4">
                  <div className="flex items-center justify-between text-xs" data-oid="l1q7rw8">
                    <span className="text-muted-foreground" data-oid="7tgpeb.">
                      {displayStage}
                    </span>
                    <span className="font-medium" data-oid="-_7-96.">
                      {displayProgress}%
                    </span>
                  </div>
                  <Progress value={displayProgress} className="h-2" data-oid="t1h9o:_" />
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground" data-oid="9rhax..">
                  <Loader2 className="h-3 w-3 animate-spin" data-oid="skua_hb" />
                  <span data-oid="il2dqss">Анализ может занять некоторое время...</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

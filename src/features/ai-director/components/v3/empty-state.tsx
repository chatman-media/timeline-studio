"use client"

/**
 * Empty State Component for AI Director v3
 * Показывает файлы из медиапула для выбора перед анализом
 */

import { FolderOpen, Zap } from "lucide-react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { MediaInfo } from "@/domains/media-management/types"
import { MediaPoolList } from "./media-pool-list"

export interface EmptyStateProps {
  /** Callback для открытия медиапула/браузера */
  onSelectFiles: () => void

  /** Callback для начала анализа с выбранными файлами */
  onStartAnalysis: (selectedIds: Set<string>) => void

  /** Медиапул с файлами */
  mediaPool: Map<string, MediaInfo>

  /** Выбранные ID файлов */
  selectedFileIds: Set<string>

  /** Callback для изменения выбора */
  onSelectionChange: (selectedIds: Set<string>) => void

  /** Текущие настройки для отображения */
  currentSettings: {
    mode: string
    analyzers: string[]
  }

  /** Анализ в процессе */
  isAnalyzing?: boolean
}

export function EmptyState({
  onSelectFiles,
  onStartAnalysis,
  mediaPool,
  selectedFileIds,
  onSelectionChange,
  currentSettings,
  isAnalyzing = false,
}: EmptyStateProps) {
  const hasFilesInPool = mediaPool.size > 0
  const hasSelectedFiles = selectedFileIds.size > 0
  const hasAnalyzers = currentSettings.analyzers.length > 0

  return (
    <Card className="w-full">
      <CardContent className="py-10 px-8">
        {/* Header */}
        <motion.div
          className="flex items-center gap-4 mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <Zap className="h-12 w-12 text-primary" />
            </motion.div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground text-xs font-bold">v3</span>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Выберите файлы для анализа</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {hasFilesInPool ? `${mediaPool.size} файлов в медиапуле` : "Импортируйте файлы через Browser"}
            </p>
          </div>
        </motion.div>

        {/* Media Pool List or Empty Message */}
        {hasFilesInPool ? (
          <div className="space-y-4">
            <MediaPoolList
              mediaPool={mediaPool}
              selectedIds={selectedFileIds}
              onSelectionChange={onSelectionChange}
              disabled={isAnalyzing}
            />

            {/* Start Analysis Button */}
            <div className="flex gap-3">
              <Button
                onClick={() => onStartAnalysis(selectedFileIds)}
                disabled={!hasSelectedFiles || !hasAnalyzers || isAnalyzing}
                className="flex-1"
                size="lg"
              >
                {isAnalyzing
                  ? "Анализ..."
                  : hasSelectedFiles
                    ? `Начать анализ (${selectedFileIds.size} файлов)`
                    : "Выберите файлы"}
              </Button>
              <Button variant="outline" onClick={onSelectFiles} disabled={isAnalyzing}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Импорт
              </Button>
            </div>

            {/* Warnings */}
            {!hasAnalyzers && (
              <p className="text-sm text-destructive text-center">Выберите хотя бы один анализатор в настройках</p>
            )}
          </div>
        ) : (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <FolderOpen className="h-20 w-20 text-muted-foreground/50 mx-auto mb-6" />
            </motion.div>
            <p className="text-lg text-muted-foreground mb-6">
              Медиапул пуст. Импортируйте файлы, чтобы начать анализ.
            </p>
            <Button onClick={onSelectFiles} size="lg" className="h-12 px-6 text-base">
              <FolderOpen className="h-5 w-5 mr-2" />
              Открыть Browser для импорта
            </Button>
          </motion.div>
        )}

        {/* Current Settings */}
        <motion.div
          className="mt-8 pt-6 border-t"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <span className="mr-2">⚡</span>
              Текущие настройки
            </h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-1.5">
                <span className="text-muted-foreground">Режим:</span>
                <span className="font-medium capitalize">{currentSettings.mode}</span>
              </div>
              <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-1.5">
                <span className="text-muted-foreground">Анализаторы:</span>
                <span className="font-medium">
                  {currentSettings.analyzers.length > 0
                    ? currentSettings.analyzers.length === 1
                      ? currentSettings.analyzers[0]
                      : `${currentSettings.analyzers.length} выбрано`
                    : "не выбраны"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}

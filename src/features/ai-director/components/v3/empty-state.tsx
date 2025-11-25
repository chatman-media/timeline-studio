"use client"

/**
 * Empty State Component for AI Director v3
 * Показывает файлы из медиапула для выбора перед анализом
 */

import { FolderOpen, Zap } from "lucide-react"
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
      <CardContent className="py-8 px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <Zap className="h-10 w-10 text-primary" />
            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">v3</span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold">Выберите файлы для анализа</h2>
            <p className="text-sm text-muted-foreground">
              {hasFilesInPool ? `${mediaPool.size} файлов в медиапуле` : "Импортируйте файлы через Browser"}
            </p>
          </div>
        </div>

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
          <div className="text-center py-8">
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Медиапул пуст. Импортируйте файлы, чтобы начать анализ.</p>
            <Button onClick={onSelectFiles} size="lg">
              <FolderOpen className="h-4 w-4 mr-2" />
              Открыть Browser для импорта
            </Button>
          </div>
        )}

        {/* Current Settings */}
        <div className="mt-6 pt-4 border-t">
          <div className="bg-muted/30 rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2 flex items-center">
              <span className="mr-2">⚡</span>
              Текущие настройки
            </h3>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Режим:</span>
                <span className="font-medium capitalize">{currentSettings.mode}</span>
              </div>
              <div className="text-muted-foreground">•</div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Анализаторы:</span>
                <span className="font-medium">
                  {currentSettings.analyzers.length > 0 ? currentSettings.analyzers.join(", ") : "не выбраны"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

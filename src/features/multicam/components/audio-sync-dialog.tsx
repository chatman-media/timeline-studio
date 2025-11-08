/**
 * Диалог синхронизации по аудио с визуализацией процесса
 */

import { CheckCircle2, Loader2, Music, XCircle } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import type { AudioSyncProgress } from "../services/audio-sync"
import type { SyncResult } from "../types/multicam"

const logger = createLogger({ module: "AudioSyncDialog" })

interface AudioSyncDialogProps {
  isOpen: boolean
  onClose: () => void
  onSync: () => Promise<SyncResult[]>
  angleCount: number
}

interface SyncResultItem {
  angleName: string
  result: SyncResult
}

export function AudioSyncDialog({ isOpen, onClose, onSync, angleCount }: AudioSyncDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<AudioSyncProgress | null>(null)
  const [results, setResults] = useState<SyncResultItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Сброс состояния при открытии/закрытии
  useEffect(() => {
    if (!isOpen) {
      setProgress(null)
      setResults(null)
      setError(null)
      setIsProcessing(false)
    }
  }, [isOpen])

  // Запуск синхронизации
  const handleStartSync = useCallback(async () => {
    setIsProcessing(true)
    setError(null)
    setResults(null)

    try {
      // Имитация прогресса для демонстрации
      const progressSteps: AudioSyncProgress[] = [
        { current: 0, total: angleCount - 1, phase: "loading", message: "Загрузка аудио..." },
        { current: 1, total: angleCount - 1, phase: "analyzing", message: "Анализ аудиодорожек..." },
        { current: 2, total: angleCount - 1, phase: "correlating", message: "Поиск совпадений..." },
      ]

      // Показываем прогресс
      for (const step of progressSteps) {
        setProgress(step)
        await new Promise((resolve) => setTimeout(resolve, 800))
      }

      // Выполняем синхронизацию
      const syncResults = await onSync()

      // Форматируем результаты для отображения
      const formattedResults: SyncResultItem[] = syncResults.map((result, index) => ({
        angleName: `Камера ${index + 2}`, // +2 так как первая камера - базовая
        result,
      }))

      setResults(formattedResults)
      setProgress({
        current: angleCount - 1,
        total: angleCount - 1,
        phase: "complete",
        message: "Синхронизация завершена!",
      })
    } catch (err) {
      logger.error("[AudioSyncDialog] Sync error:", { error: err })
      setError("Произошла ошибка при синхронизации. Попробуйте еще раз.")
    } finally {
      setIsProcessing(false)
    }
  }, [angleCount, onSync])

  // Получение иконки для фазы
  const getPhaseIcon = (phase: AudioSyncProgress["phase"]) => {
    switch (phase) {
      case "loading":
        return <Music className="w-5 h-5" />
      case "analyzing":
        return <Loader2 className="w-5 h-5 animate-spin" />
      case "correlating":
        return <Loader2 className="w-5 h-5 animate-pulse" />
      case "complete":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      default:
        return <Music className="w-5 h-5" />
    }
  }

  // Получение цвета для уверенности
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-500"
    if (confidence >= 0.6) return "text-yellow-500"
    return "text-red-500"
  }

  // Вычисление прогресса в процентах
  const progressPercent = progress ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Синхронизация по аудио</DialogTitle>
          <DialogDescription>Автоматический анализ аудиодорожек для синхронизации камер</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Информация о количестве камер */}
          {!isProcessing && !results && (
            <Alert>
              <Music className="w-4 h-4" />
              <AlertDescription>
                Будет проанализировано {angleCount} камер. Процесс может занять несколько секунд.
              </AlertDescription>
            </Alert>
          )}

          {/* Прогресс синхронизации */}
          {isProcessing && progress && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {getPhaseIcon(progress.phase)}
                <span className="text-sm font-medium">{progress.message}</span>
              </div>

              <Progress value={progressPercent} className="h-2" />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Обработано: {progress.current} из {progress.total}
                </span>
                <span>{progressPercent}%</span>
              </div>
            </div>
          )}

          {/* Результаты синхронизации */}
          {results && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="font-medium">Результаты синхронизации</span>
              </div>

              <div className="space-y-2">
                {results.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      item.result.confidence > 0.7
                        ? "bg-green-50 dark:bg-green-950/20"
                        : "bg-yellow-50 dark:bg-yellow-950/20",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{item.angleName}</span>
                      {item.result.method === "audio" && (
                        <Badge variant="secondary" className="text-xs">
                          Аудио
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono">
                        {item.result.offset > 0 ? "+" : ""}
                        {item.result.offset.toFixed(3)}s
                      </span>
                      <span className={cn("text-sm", getConfidenceColor(item.result.confidence))}>
                        {Math.round(item.result.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Общая статистика */}
              {results.length > 0 && (
                <div className="pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Средняя уверенность:</span>
                    <span className="font-medium">
                      {Math.round((results.reduce((sum, r) => sum + r.result.confidence, 0) / results.length) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Кнопки действий */}
          <div className="flex justify-end gap-2 pt-2">
            {!isProcessing && !results && (
              <>
                <Button variant="outline" onClick={onClose}>
                  Отмена
                </Button>
                <Button onClick={handleStartSync}>
                  <Music className="w-4 h-4 mr-2" />
                  Начать синхронизацию
                </Button>
              </>
            )}

            {results && <Button onClick={onClose}>Применить</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

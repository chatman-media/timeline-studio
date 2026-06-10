/**
 * Диалог синхронизации по аудио с визуализацией процесса
 */

import { Alert, AlertDescription } from "@timeline-studio/ui/components/alert"
import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@timeline-studio/ui/components/dialog"
import { Progress } from "@timeline-studio/ui/components/progress"
import { CheckCircle2, Loader2, Music, XCircle } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
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
        {
          current: 0,
          total: angleCount - 1,
          phase: "loading",
          message: "Загрузка аудио...",
        },
        {
          current: 1,
          total: angleCount - 1,
          phase: "analyzing",
          message: "Анализ аудиодорожек...",
        },
        {
          current: 2,
          total: angleCount - 1,
          phase: "correlating",
          message: "Поиск совпадений...",
        },
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
        return <Music className="w-5 h-5" data-oid="c1yfj3." />
      case "analyzing":
        return <Loader2 className="w-5 h-5 animate-spin" data-oid="t8ifz5y" />
      case "correlating":
        return <Loader2 className="w-5 h-5 animate-pulse" data-oid="u9zzh7r" />
      case "complete":
        return <CheckCircle2 className="w-5 h-5 text-green-500" data-oid="x3yp64m" />
      default:
        return <Music className="w-5 h-5" data-oid="o-sx.ns" />
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()} data-oid="3vi6f_d">
      <DialogContent className="sm:max-w-[500px]" data-oid=".28ttjm">
        <DialogHeader data-oid="w0zx1-5">
          <DialogTitle data-oid="8:ajf:u">Синхронизация по аудио</DialogTitle>
          <DialogDescription data-oid="p80o8fj">
            Автоматический анализ аудиодорожек для синхронизации камер
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4" data-oid="zr:k856">
          {/* Информация о количестве камер */}
          {!isProcessing && !results && (
            <Alert data-oid="wqqtc-n">
              <Music className="w-4 h-4" data-oid="0_y9_lf" />
              <AlertDescription data-oid="kz-70y2">
                Будет проанализировано {angleCount} камер. Процесс может занять несколько секунд.
              </AlertDescription>
            </Alert>
          )}

          {/* Прогресс синхронизации */}
          {isProcessing && progress && (
            <div className="space-y-3" data-oid="-_8tp8i">
              <div className="flex items-center gap-3" data-oid="_c7izhe">
                {getPhaseIcon(progress.phase)}
                <span className="text-sm font-medium" data-oid="j9vw3-j">
                  {progress.message}
                </span>
              </div>

              <Progress value={progressPercent} className="h-2" data-oid="iub9n2l" />

              <div className="flex justify-between text-xs text-muted-foreground" data-oid="9:u1xck">
                <span data-oid="faum9g_">
                  Обработано: {progress.current} из {progress.total}
                </span>
                <span data-oid="i16qg4z">{progressPercent}%</span>
              </div>
            </div>
          )}

          {/* Результаты синхронизации */}
          {results && (
            <div className="space-y-3" data-oid="o:sdica">
              <div className="flex items-center gap-2 mb-2" data-oid="tiqcak0">
                <CheckCircle2 className="w-5 h-5 text-green-500" data-oid=":wcyhpw" />
                <span className="font-medium" data-oid="5z7-:0u">
                  Результаты синхронизации
                </span>
              </div>

              <div className="space-y-2" data-oid="tofjtpw">
                {results.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      item.result.confidence > 0.7
                        ? "bg-green-50 dark:bg-green-950/20"
                        : "bg-yellow-50 dark:bg-yellow-950/20",
                    )}
                    data-oid="twseboe"
                  >
                    <div className="flex items-center gap-3" data-oid="wxvprp7">
                      <span className="font-medium" data-oid="0q5z08v">
                        {item.angleName}
                      </span>
                      {item.result.method === "audio" && (
                        <Badge variant="secondary" className="text-xs" data-oid="-gm1n44">
                          Аудио
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3" data-oid="ymtffue">
                      <span className="text-sm font-mono" data-oid="404.uhn">
                        {item.result.offset > 0 ? "+" : ""}
                        {item.result.offset.toFixed(3)}s
                      </span>
                      <span className={cn("text-sm", getConfidenceColor(item.result.confidence))} data-oid="f3j73z.">
                        {Math.round(item.result.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Общая статистика */}
              {results.length > 0 && (
                <div className="pt-3 border-t" data-oid="gxjmht6">
                  <div className="flex justify-between text-sm" data-oid="7bu-a70">
                    <span data-oid="y7e4pml">Средняя уверенность:</span>
                    <span className="font-medium" data-oid="s.unirw">
                      {Math.round((results.reduce((sum, r) => sum + r.result.confidence, 0) / results.length) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <Alert variant="destructive" data-oid="xuk9.ln">
              <XCircle className="w-4 h-4" data-oid="u9t-fch" />
              <AlertDescription data-oid="gm7ua.v">{error}</AlertDescription>
            </Alert>
          )}

          {/* Кнопки действий */}
          <div className="flex justify-end gap-2 pt-2" data-oid="393bv_1">
            {!isProcessing && !results && (
              <>
                <Button variant="outline" onClick={onClose} data-oid="fu6fdhj">
                  Отмена
                </Button>
                <Button onClick={handleStartSync} data-oid="khqcwgg">
                  <Music className="w-4 h-4 mr-2" data-oid="y5a3-:y" />
                  Начать синхронизацию
                </Button>
              </>
            )}

            {results && (
              <Button onClick={onClose} data-oid="13quav2">
                Применить
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

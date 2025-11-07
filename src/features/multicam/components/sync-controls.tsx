/**
 * Компонент управления синхронизацией мультикамерных углов
 */

import { AlertCircle, Check, Clock, Hash, Loader2, Music, Wand2 } from "lucide-react"
import { useCallback, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { useMulticam } from "../hooks/use-multicam"
import { AudioSyncDialog } from "./audio-sync-dialog"

const logger = createLogger({ module: "SyncControls" })

interface SyncControlsProps {
  baseClipId: string
  className?: string
  onSyncComplete?: () => void
}

interface ManualSyncState {
  isOpen: boolean
  angleIndex: number | null
  currentOffset: number
}

export function SyncControls({ baseClipId, className, onSyncComplete }: SyncControlsProps) {
  const multicam = useMulticam(baseClipId)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMethod, setSyncMethod] = useState<"timecode" | "audio" | "manual" | null>(null)
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle")
  const [audioSyncOpen, setAudioSyncOpen] = useState(false)
  const [manualSync, setManualSync] = useState<ManualSyncState>({
    isOpen: false,
    angleIndex: null,
    currentOffset: 0,
  })

  // Синхронизация по таймкоду
  const handleTimecodeSync = useCallback(async () => {
    setIsSyncing(true)
    setSyncMethod("timecode")
    setSyncStatus("syncing")

    try {
      await new Promise((resolve) => setTimeout(resolve, 500)) // Имитация задержки
      void multicam.autoSyncByTimecode()
      setSyncStatus("success")
      onSyncComplete?.()

      // Сбросить статус через 3 секунды
      setTimeout(() => {
        setSyncStatus("idle")
        setSyncMethod(null)
      }, 3000)
    } catch (error) {
      logger.error("[SyncControls] Timecode sync failed:", { error })
      setSyncStatus("error")
    } finally {
      setIsSyncing(false)
    }
  }, [multicam, onSyncComplete])

  // Синхронизация по аудио
  const handleAudioSync = useCallback(() => {
    setAudioSyncOpen(true)
  }, [])

  // Открытие диалога ручной синхронизации
  const handleManualSync = useCallback(
    (angleIndex: number) => {
      const currentOffset = multicam.syncOffsets[angleIndex] || 0
      setManualSync({
        isOpen: true,
        angleIndex,
        currentOffset,
      })
    },
    [multicam.syncOffsets],
  )

  // Применение ручной синхронизации
  const applyManualSync = useCallback(() => {
    if (manualSync.angleIndex !== null) {
      multicam.setSyncOffset(manualSync.angleIndex, manualSync.currentOffset)
      multicam.syncAngles()
      setManualSync({ isOpen: false, angleIndex: null, currentOffset: 0 })
      onSyncComplete?.()
    }
  }, [manualSync, multicam, onSyncComplete])

  // Получение иконки для статуса
  const getStatusIcon = () => {
    switch (syncStatus) {
      case "syncing":
        return <Loader2 className="w-4 h-4 animate-spin" />
      case "success":
        return <Check className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Wand2 className="w-4 h-4" />
    }
  }

  // Получение текста статуса
  const getStatusText = () => {
    if (syncStatus === "syncing") {
      switch (syncMethod) {
        case "timecode":
          return "Синхронизация по таймкоду..."
        case "audio":
          return "Анализ аудио..."
        case "manual":
          return "Применение смещения..."
        default:
          return "Синхронизация..."
      }
    }

    if (syncStatus === "success") {
      return "Синхронизировано!"
    }

    if (syncStatus === "error") {
      return "Ошибка синхронизации"
    }

    return "Синхронизация"
  }

  // Обработчик завершения аудио синхронизации
  const handleAudioSyncComplete = useCallback(async () => {
    setAudioSyncOpen(false)
    setSyncStatus("success")
    onSyncComplete?.()

    // Сбросить статус через 3 секунды
    setTimeout(() => {
      setSyncStatus("idle")
      setSyncMethod(null)
    }, 3000)
  }, [onSyncComplete])

  if (!multicam.hasMulticamSupport) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-2", className)} disabled={isSyncing}>
            {getStatusIcon()}
            {getStatusText()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleTimecodeSync} disabled={isSyncing}>
            <Clock className="w-4 h-4 mr-2" />
            Синхронизация по таймкоду
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAudioSync} disabled={isSyncing}>
            <Music className="w-4 h-4 mr-2" />
            Синхронизация по аудио
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-sm font-medium">Ручная синхронизация</div>
          {multicam.angles.map((angle, index) => (
            <DropdownMenuItem
              key={angle.id}
              onClick={() => handleManualSync(index)}
              disabled={isSyncing || index === multicam.activeAngleIndex}
            >
              <Hash className="w-4 h-4 mr-2" />
              {angle.name}{" "}
              {Math.abs(multicam.syncOffsets[index] || 0) > 0.01 &&
                `(${multicam.syncOffsets[index] > 0 ? "+" : ""}${multicam.syncOffsets[index]?.toFixed(2)}s)`}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Диалог ручной синхронизации */}
      <Dialog
        open={manualSync.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setManualSync({ isOpen: false, angleIndex: null, currentOffset: 0 })
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ручная синхронизация</DialogTitle>
            <DialogDescription>
              {manualSync.angleIndex !== null && (
                <>Настройте смещение для камеры &quot;{multicam.angles[manualSync.angleIndex]?.name}&quot;</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Смещение</span>
                <span className="font-mono">
                  {manualSync.currentOffset > 0 ? "+" : ""}
                  {manualSync.currentOffset.toFixed(3)}s
                </span>
              </div>

              <Slider
                value={[manualSync.currentOffset]}
                onValueChange={([value]) => {
                  setManualSync((prev) => ({ ...prev, currentOffset: value }))
                }}
                min={-5}
                max={5}
                step={0.001}
                className="w-full"
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-5s</span>
                <span>0s</span>
                <span>+5s</span>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                Используйте положительные значения, чтобы сдвинуть клип вперед, и отрицательные — чтобы сдвинуть назад
                относительно базового угла.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setManualSync({ isOpen: false, angleIndex: null, currentOffset: 0 })}
              >
                Отмена
              </Button>
              <Button onClick={applyManualSync}>Применить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог аудио синхронизации */}
      <AudioSyncDialog
        isOpen={audioSyncOpen}
        onClose={() => setAudioSyncOpen(false)}
        onSync={async () => {
          await multicam.autoSyncByAudio()
          await handleAudioSyncComplete()
          return []
        }}
        angleCount={multicam.angles.length}
      />
    </>
  )
}

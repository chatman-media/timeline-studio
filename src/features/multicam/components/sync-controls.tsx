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
      await multicam.autoSyncByTimecode()
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
        return <Loader2 className="w-4 h-4 animate-spin" data-oid="u7xg0hc" />
      case "success":
        return <Check className="w-4 h-4 text-green-500" data-oid="rh_zsmo" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" data-oid="9ors1ao" />
      default:
        return <Wand2 className="w-4 h-4" data-oid="s1kj8s-" />
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
      <DropdownMenu data-oid="5mhfart">
        <DropdownMenuTrigger asChild data-oid="x:qhtj3">
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-2", className)}
            disabled={isSyncing}
            data-oid="9s5ljpz"
          >
            {getStatusIcon()}
            {getStatusText()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56" data-oid="mamqb29">
          <DropdownMenuItem onClick={handleTimecodeSync} disabled={isSyncing} data-oid="pexrm5r">
            <Clock className="w-4 h-4 mr-2" data-oid="t6o31g8" />
            Синхронизация по таймкоду
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAudioSync} disabled={isSyncing} data-oid="cr9g.y_">
            <Music className="w-4 h-4 mr-2" data-oid="_ys:czg" />
            Синхронизация по аудио
          </DropdownMenuItem>
          <DropdownMenuSeparator data-oid="a01jzzr" />
          <div className="px-2 py-1.5 text-sm font-medium" data-oid="-uex8fv">
            Ручная синхронизация
          </div>
          {multicam.angles.map((angle, index) => (
            <DropdownMenuItem
              key={angle.id}
              onClick={() => handleManualSync(index)}
              disabled={isSyncing || index === multicam.activeAngleIndex}
              data-oid="lv44160"
            >
              <Hash className="w-4 h-4 mr-2" data-oid="1rkak:h" />
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
            setManualSync({
              isOpen: false,
              angleIndex: null,
              currentOffset: 0,
            })
          }
        }}
        data-oid="i:roqpu"
      >
        <DialogContent data-oid="kacs3i6">
          <DialogHeader data-oid="7uidcd3">
            <DialogTitle data-oid="4lg06z0">Ручная синхронизация</DialogTitle>
            <DialogDescription data-oid="iy8exv_">
              {manualSync.angleIndex !== null && (
                <>
                  Настройте смещение для камеры &quot;
                  {multicam.angles[manualSync.angleIndex]?.name}&quot;
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4" data-oid="6uldzgp">
            <div className="space-y-2" data-oid="kzhinm-">
              <div className="flex items-center justify-between text-sm" data-oid="n.-4rs0">
                <span data-oid="321rzj7">Смещение</span>
                <span className="font-mono" data-oid="cg:wam8">
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
                data-oid="pay7yrv"
              />

              <div className="flex justify-between text-xs text-muted-foreground" data-oid="1x6qb:i">
                <span data-oid="548f2_t">-5s</span>
                <span data-oid="4m4s4fg">0s</span>
                <span data-oid="1e.u.kn">+5s</span>
              </div>
            </div>

            <Alert data-oid="921mxqr">
              <AlertDescription data-oid="b5w5yhg">
                Используйте положительные значения, чтобы сдвинуть клип вперед, и отрицательные — чтобы сдвинуть назад
                относительно базового угла.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2" data-oid="ygr-_9d">
              <Button
                variant="outline"
                onClick={() =>
                  setManualSync({
                    isOpen: false,
                    angleIndex: null,
                    currentOffset: 0,
                  })
                }
                data-oid="kj_k24m"
              >
                Отмена
              </Button>
              <Button onClick={applyManualSync} data-oid="qp-c6mi">
                Применить
              </Button>
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
        data-oid="pndr3yy"
      />
    </>
  )
}

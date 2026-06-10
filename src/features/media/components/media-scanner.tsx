import { AlertCircle, FolderOpen, Loader2 } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { container } from "@/core"
import type { MediaFile } from "@/core/types"
import { useMediaProcessor } from "@/features/media/hooks/media-management"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("MediaScanner")

export function MediaScanner() {
  const [scannedFiles, setScannedFiles] = useState<MediaFile[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const platform = useMemo(() => {
    try {
      return container.hasPlatform() ? container.getPlatform() : null
    } catch {
      return null
    }
  }, [])

  const { scanFolderWithThumbnails, isProcessing, progress, errors, clearErrors } = useMediaProcessor({
    onFilesDiscovered: (files) => {
      logger.infoSync("Files discovered", { count: files.length })
    },
    onMetadataReady: (fileId, metadata) => {
      logger.debugSync("Metadata ready", { fileId, metadata })
    },
    onThumbnailReady: (fileId, thumbnailPath, thumbnailData) => {
      logger.debugSync("Thumbnail ready", {
        fileId,
        thumbnailPath,
        hasData: !!thumbnailData,
        dataLength: thumbnailData?.length,
      })
    },
    onError: (fileId, error) => {
      logger.errorSync("File processing error", { fileId, error })
    },
    onProgress: (current, total) => {
      logger.debugSync("Processing progress", { current, total })
    },
  })

  const handleSelectFolder = async () => {
    if (!platform) {
      logger.errorSync("Platform service not available")
      return
    }

    const selected = await platform.showOpenDialog({
      directory: true,
      multiple: false,
      title: "Выберите папку для сканирования",
    })

    if (selected && selected.length > 0) {
      setSelectedFolder(selected[0])
      clearErrors()
    }
  }

  const handleScan = async () => {
    if (!selectedFolder) return

    try {
      const files = await scanFolderWithThumbnails(selectedFolder, 320, 180)
      setScannedFiles(files)
      logger.infoSync("Scan completed", { filesCount: files.length })
    } catch (error) {
      logger.errorSync("Scan failed", { error })
    }
  }

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <Card className="w-full max-w-2xl" data-oid="24rmq2c">
      <CardHeader data-oid="j5_3ndq">
        <CardTitle data-oid="eix4zab">Сканирование медиафайлов</CardTitle>
        <CardDescription data-oid="p6.-drv">
          Выберите папку для асинхронного сканирования и обработки медиафайлов
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4" data-oid="i:4n7b5">
        <div className="flex gap-2" data-oid="uo70zpd">
          <Button
            onClick={handleSelectFolder}
            disabled={isProcessing}
            variant="outline"
            className="flex-1"
            data-oid=".gx7x.0"
          >
            <FolderOpen className="mr-2 h-4 w-4" data-oid="89mvahp" />
            {selectedFolder ? "Изменить папку" : "Выбрать папку"}
          </Button>
          <Button onClick={handleScan} disabled={!selectedFolder || isProcessing} data-oid="_.pjtz2">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" data-oid="7zjg7sw" />
                Сканирование...
              </>
            ) : (
              "Начать сканирование"
            )}
          </Button>
        </div>

        {selectedFolder && (
          <div className="text-sm text-muted-foreground" data-oid="pao6t3s">
            Выбрана папка: {selectedFolder}
          </div>
        )}

        {isProcessing && progress.total > 0 && (
          <div className="space-y-2" data-oid="uyk661v">
            <div className="flex justify-between text-sm" data-oid="3bae3zm">
              <span data-oid="qi29mtj">Обработка файлов</span>
              <span data-oid="cj3dgs3">
                {progress.current} / {progress.total}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" data-oid="1qr7av0" />
          </div>
        )}

        {errors.size > 0 && (
          <div className="space-y-2" data-oid="1b0ejla">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive" data-oid="mvg2dw5">
              <AlertCircle className="h-4 w-4" data-oid="y:.sd33" />
              Ошибки при обработке ({errors.size})
            </div>
            <div className="max-h-32 overflow-y-auto rounded-md bg-destructive/10 p-2 text-xs" data-oid="xhszg:8">
              {Array.from(errors.entries()).map(([fileId, error]) => (
                <div key={fileId} className="py-1" data-oid="e4:tcwf">
                  <span className="font-mono" data-oid="dogg0n7">
                    {fileId}:
                  </span>{" "}
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {scannedFiles.length > 0 && (
          <div className="space-y-2" data-oid="4g:7:pz">
            <h3 className="text-sm font-medium" data-oid="j5gjxv:">
              Обработано файлов: {scannedFiles.length}
            </h3>
            <div className="max-h-64 overflow-y-auto rounded-md border p-2" data-oid="qo:xg63">
              <ul className="space-y-1 text-sm" data-oid="ndn8txj">
                {scannedFiles.map((file) => (
                  <li key={file.id} className="flex items-center justify-between py-1" data-oid="lx5rbf1">
                    <span className="truncate" data-oid="2suagun">
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground" data-oid="ncwppz0">
                      {file.isVideo && "Видео"}
                      {file.isImage && "Изображение"}
                      {file.isAudio && "Аудио"}
                      {file.duration && ` (${Math.round(file.duration)}с)`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

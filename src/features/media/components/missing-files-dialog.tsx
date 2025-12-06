"use client"

import { AlertTriangle, CheckCircle, FileX, Search, Trash2 } from "lucide-react"
import { useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { SavedMediaFile } from "@/domains/media-management"
import { promptUserToFindFile } from "@/domains/media-management/services/media-restoration-service"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("MissingFilesDialog")

interface MissingFilesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  missingFiles: SavedMediaFile[]
  onResolve: (
    resolved: Array<{
      file: SavedMediaFile
      newPath?: string
      action: "found" | "remove"
    }>,
  ) => void
}

interface FileResolution {
  file: SavedMediaFile
  action: "pending" | "found" | "remove" | "skip"
  newPath?: string
  isProcessing?: boolean
}

export function MissingFilesDialog({ open, onOpenChange, missingFiles, onResolve }: MissingFilesDialogProps) {
  const [resolutions, setResolutions] = useState<FileResolution[]>(() =>
    missingFiles.map((file) => ({ file, action: "pending" })),
  )

  const handleFindFile = async (index: number) => {
    const resolution = resolutions[index]

    // Обновляем состояние - показываем, что файл обрабатывается
    setResolutions((prev) => prev.map((r, i) => (i === index ? { ...r, isProcessing: true } : r)))

    try {
      const newPath = await promptUserToFindFile(resolution.file)

      setResolutions((prev) =>
        prev.map((r, i) =>
          i === index
            ? {
                ...r,
                action: newPath ? "found" : "skip",
                newPath: newPath || undefined,
                isProcessing: false,
              }
            : r,
        ),
      )
    } catch (error) {
      logger.error("Ошибка при поиске файла:", { error })
      setResolutions((prev) => prev.map((r, i) => (i === index ? { ...r, isProcessing: false } : r)))
    }
  }

  const handleRemoveFile = (index: number) => {
    setResolutions((prev) => prev.map((r, i) => (i === index ? { ...r, action: "remove" } : r)))
  }

  const handleSkipFile = (index: number) => {
    setResolutions((prev) => prev.map((r, i) => (i === index ? { ...r, action: "skip" } : r)))
  }

  const handleResolveAll = () => {
    const resolved = resolutions
      .filter((r) => r.action === "found" || r.action === "remove")
      .map((r) => ({
        file: r.file,
        newPath: r.newPath,
        action: r.action as "found" | "remove",
      }))

    onResolve(resolved)
    onOpenChange(false)
  }

  const handleSkipAll = () => {
    onResolve([])
    onOpenChange(false)
  }

  const getActionIcon = (action: FileResolution["action"]) => {
    switch (action) {
      case "found":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "remove":
        return <Trash2 className="h-4 w-4 text-red-500" />
      case "skip":
        return <FileX className="h-4 w-4 text-gray-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getActionText = (action: FileResolution["action"]) => {
    switch (action) {
      case "found":
        return "Найден"
      case "remove":
        return "Удалить"
      case "skip":
        return "Пропущен"
      default:
        return "Ожидает"
    }
  }

  const resolvedCount = resolutions.filter((r) => r.action === "found" || r.action === "remove").length
  const canProceed = resolvedCount > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Отсутствующие медиафайлы
          </AlertDialogTitle>
          <AlertDialogDescription>
            При открытии проекта обнаружены отсутствующие файлы. Выберите действие для каждого файла: найти новое
            расположение или удалить из проекта.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Файлов: {missingFiles.length}</span>
            <span>
              Обработано: {resolvedCount}/{missingFiles.length}
            </span>
          </div>

          <div className="h-[300px] w-full border rounded-md p-4 overflow-y-auto">
            <div className="space-y-3">
              {resolutions.map((resolution, index) => (
                <div key={resolution.file.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getActionIcon(resolution.action)}
                        <span className="font-medium truncate">{resolution.file.name}</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded border text-gray-700">
                          {getActionText(resolution.action)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {resolution.newPath || resolution.file.originalPath}
                      </p>
                      {resolution.file.size && (
                        <p className="text-xs text-muted-foreground">
                          Размер: {(resolution.file.size / 1024 / 1024).toFixed(1)} МБ
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1">
                      {resolution.action === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFindFile(index)}
                            disabled={resolution.isProcessing}
                            className="h-8 px-2"
                          >
                            <Search className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFile(index)}
                            className="h-8 px-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}

                      {resolution.action !== "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSkipFile(index)}
                          className="h-8 px-2 text-xs"
                        >
                          Отменить
                        </Button>
                      )}
                    </div>
                  </div>

                  {index < resolutions.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <AlertDialogCancel onClick={handleSkipAll} className="flex-1 sm:flex-none">
              Пропустить все
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResolveAll} disabled={!canProceed} className="flex-1 sm:flex-none">
              Применить изменения
            </AlertDialogAction>
          </div>

          {canProceed && (
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              Будет обработано {resolvedCount} файлов
            </p>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

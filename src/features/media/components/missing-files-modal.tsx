"use client"

import { AlertTriangle, CheckCircle, FileX, Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { promptUserToFindFile } from "@/domains/media-management/services/media-restoration-service"
import { useModals } from "@/domains/system-integration"
import type { SavedMediaFile } from "@/domains/media-management"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("MissingFilesModal")

interface FileResolution {
  file: SavedMediaFile
  action: "pending" | "found" | "remove" | "skip"
  newPath?: string
  isProcessing?: boolean
}

export function MissingFilesModal() {
  const { modalData, closeModal } = useModals()

  const missingFiles = (modalData?.missingFiles as SavedMediaFile[]) || []
  const onResolve = modalData?.onResolve as
    | ((
        resolved: Array<{
          file: SavedMediaFile
          newPath?: string
          action: "found" | "remove"
        }>,
      ) => void)
    | undefined

  const [resolutions, setResolutions] = useState<FileResolution[]>([])

  // Инициализация состояния при изменении missingFiles
  useEffect(() => {
    setResolutions(missingFiles.map((file) => ({ file, action: "pending" })))
  }, [missingFiles])

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

  const handleResetFile = (index: number) => {
    setResolutions((prev) => prev.map((r, i) => (i === index ? { ...r, action: "pending", newPath: undefined } : r)))
  }

  const handleResolveAll = () => {
    const resolved = resolutions
      .filter((r) => r.action === "found" || r.action === "remove")
      .map((r) => ({
        file: r.file,
        newPath: r.newPath,
        action: r.action as "found" | "remove",
      }))

    onResolve?.(resolved)
    closeModal()
  }

  const handleSkipAll = () => {
    onResolve?.([])
    closeModal()
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
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-yellow-500">
        <AlertTriangle className="h-5 w-5" />
        <p className="text-sm text-muted-foreground">
          При открытии проекта обнаружены отсутствующие файлы. Выберите действие для каждого файла: найти новое
          расположение или удалить из проекта.
        </p>
      </div>

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
                      onClick={() => handleResetFile(index)}
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

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleSkipAll}>
          Пропустить все
        </Button>

        <div className="flex items-center gap-4">
          {canProceed && <p className="text-xs text-muted-foreground">Будет обработано {resolvedCount} файлов</p>}
          <Button onClick={handleResolveAll} disabled={!canProceed}>
            Применить изменения
          </Button>
        </div>
      </div>
    </div>
  )
}

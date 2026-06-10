"use client"

import { AlertTriangle, CheckCircle, FileX, Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useModals } from "@/core/hooks"
import { promptUserToFindFile } from "@/core/services/media-restoration-service"
import type { SavedMediaFile } from "@/core/types"

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
        return <CheckCircle className="h-4 w-4 text-green-500" data-oid="ve5.5iw" />
      case "remove":
        return <Trash2 className="h-4 w-4 text-red-500" data-oid="7ak4frm" />
      case "skip":
        return <FileX className="h-4 w-4 text-gray-500" data-oid="qhb:xu9" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" data-oid=".0eg_w6" />
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
    <div className="space-y-4" data-oid="pywmewi">
      <div className="flex items-center gap-2 text-yellow-500" data-oid="azgim_s">
        <AlertTriangle className="h-5 w-5" data-oid="n3-ovod" />
        <p className="text-sm text-muted-foreground" data-oid="j:53:qg">
          При открытии проекта обнаружены отсутствующие файлы. Выберите действие для каждого файла: найти новое
          расположение или удалить из проекта.
        </p>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground" data-oid="2gmzf:9">
        <span data-oid="fl13zcb">Файлов: {missingFiles.length}</span>
        <span data-oid="uxko1bf">
          Обработано: {resolvedCount}/{missingFiles.length}
        </span>
      </div>

      <div className="h-[300px] w-full border rounded-md p-4 overflow-y-auto" data-oid="mbm5s.c">
        <div className="space-y-3" data-oid="4awsaq6">
          {resolutions.map((resolution, index) => (
            <div key={resolution.file.id} className="space-y-2" data-oid="-krii7g">
              <div className="flex items-start justify-between gap-3" data-oid=":2thp4r">
                <div className="flex-1 min-w-0" data-oid="mqbaqb4">
                  <div className="flex items-center gap-2" data-oid="85to032">
                    {getActionIcon(resolution.action)}
                    <span className="font-medium truncate" data-oid="jlyis5p">
                      {resolution.file.name}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded border text-gray-700" data-oid="-r2frmw">
                      {getActionText(resolution.action)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1" data-oid="s:e.ozg">
                    {resolution.newPath || resolution.file.originalPath}
                  </p>
                  {resolution.file.size && (
                    <p className="text-xs text-muted-foreground" data-oid="zco9tr3">
                      Размер: {(resolution.file.size / 1024 / 1024).toFixed(1)} МБ
                    </p>
                  )}
                </div>

                <div className="flex gap-1" data-oid="owndx7v">
                  {resolution.action === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFindFile(index)}
                        disabled={resolution.isProcessing}
                        className="h-8 px-2"
                        data-oid="g1wgdvn"
                      >
                        <Search className="h-3 w-3" data-oid="va-19mm" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFile(index)}
                        className="h-8 px-2 text-red-600 hover:text-red-700"
                        data-oid="r5ms4v:"
                      >
                        <Trash2 className="h-3 w-3" data-oid="9wa_6sk" />
                      </Button>
                    </>
                  )}

                  {resolution.action !== "pending" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleResetFile(index)}
                      className="h-8 px-2 text-xs"
                      data-oid="nts2.fy"
                    >
                      Отменить
                    </Button>
                  )}
                </div>
              </div>

              {index < resolutions.length - 1 && <Separator data-oid="t9593_m" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center" data-oid="mydp0pj">
        <Button variant="outline" onClick={handleSkipAll} data-oid="ljz_a_z">
          Пропустить все
        </Button>

        <div className="flex items-center gap-4" data-oid="-oq9b4y">
          {canProceed && (
            <p className="text-xs text-muted-foreground" data-oid="a6o2:th">
              Будет обработано {resolvedCount} файлов
            </p>
          )}
          <Button onClick={handleResolveAll} disabled={!canProceed} data-oid="8_jvp21">
            Применить изменения
          </Button>
        </div>
      </div>
    </div>
  )
}

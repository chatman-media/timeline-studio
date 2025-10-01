import { open } from "@tauri-apps/plugin-dialog"
import { CheckSquare, FileVideo, Folder, Loader2, Pause, RefreshCw, Square, Trash2, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RenderStatus } from "@/domains/video-editing"
import { cn } from "@/lib/utils"
import { useRenderQueue } from "../hooks/use-render-queue"
import type { ExportSettings } from "../types/export-types"
import { ExportPresets } from "./export-presets"

interface BatchExportTabProps {
  onClose: () => void
  defaultSettings: ExportSettings
}

// Временное хранилище для настроек проектов
interface ProjectExportConfig {
  projectPath: string
  projectName: string
  outputPath: string
  settings: ExportSettings
}

export function BatchExportTab({ onClose, defaultSettings }: BatchExportTabProps) {
  const { t } = useTranslation()
  const {
    renderJobs,
    isProcessing,
    activeJobsCount,
    addProjectsToQueue,
    startRenderQueue,
    cancelJob,
    cancelAllJobs,
    clearCompleted,
    refreshQueue,
  } = useRenderQueue()

  const [pendingProjects, setPendingProjects] = useState<ProjectExportConfig[]>([])
  const [globalSettings, setGlobalSettings] = useState<ExportSettings>(defaultSettings)
  const [selectedPresetId, setSelectedPresetId] = useState("custom")
  const [outputFolder, setOutputFolder] = useState("")

  // Обновляем очередь при монтировании
  useEffect(() => {
    void refreshQueue()
  }, [refreshQueue])

  // Выбор папки для вывода
  const handleChooseOutputFolder = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        title: t("dialogs.export.selectOutputFolder"),
      })

      if (selected) {
        setOutputFolder(selected)

        // Обновляем пути для всех ожидающих проектов
        setPendingProjects((prev) =>
          prev.map((project) => ({
            ...project,
            outputPath: `${selected}/${project.projectName}_export.${project.settings.format}`,
          })),
        )
      }
    } catch (error) {
      console.error("Failed to select output folder:", error)
    }
  }, [t])

  // Добавление проектов
  const handleAddProjects = useCallback(async () => {
    try {
      const projectPaths = await addProjectsToQueue()

      if (projectPaths.length === 0) return

      const newProjects: ProjectExportConfig[] = projectPaths.map((path) => {
        const projectName = path.split("/").pop()?.replace(".tls", "") || "Untitled"
        const fileName = globalSettings.fileName.replace("{project_name}", projectName)

        return {
          projectPath: path,
          projectName,
          outputPath: outputFolder ? `${outputFolder}/${fileName}.${globalSettings.format}` : "",
          settings: { ...globalSettings, fileName },
        }
      })

      setPendingProjects((prev) => [...prev, ...newProjects])
    } catch (error) {
      console.error("Failed to add projects:", error)
    }
  }, [addProjectsToQueue, globalSettings, outputFolder])

  // Применение пресета
  const handlePresetSelect = useCallback((preset: any) => {
    setSelectedPresetId(preset.id)

    if (preset.id !== "custom" && preset.settings) {
      const updates: Partial<ExportSettings> = {}

      if (preset.settings.format) updates.format = preset.settings.format
      if (preset.settings.resolution) updates.resolution = preset.settings.resolution
      if (preset.settings.fps) updates.frameRate = preset.settings.fps
      if (preset.settings.bitrate) updates.bitrate = preset.settings.bitrate
      if (preset.settings.bitrateMode) updates.bitrateMode = preset.settings.bitrateMode
      if (preset.settings.useHardwareAcceleration !== undefined) {
        updates.enableGPU = preset.settings.useHardwareAcceleration
      }

      setGlobalSettings((prev) => ({ ...prev, ...updates }))

      // Применяем к ожидающим проектам
      setPendingProjects((prev) =>
        prev.map((project) => ({
          ...project,
          settings: { ...project.settings, ...updates },
          outputPath: project.outputPath.replace(/\.[^.]+$/, `.${updates.format || project.settings.format}`),
        })),
      )
    }
  }, [])

  // Удаление проекта из очереди
  const removePendingProject = useCallback((index: number) => {
    setPendingProjects((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // Запуск экспорта
  const handleStartExport = useCallback(async () => {
    if (pendingProjects.length === 0 || !outputFolder) return

    // Преобразуем в формат для рендер очереди
    const projectsToRender = pendingProjects.map((project) => ({
      path: project.projectPath,
      outputPath: project.outputPath,
    }))

    await startRenderQueue(projectsToRender)

    // Очищаем список ожидающих проектов
    setPendingProjects([])
  }, [pendingProjects, outputFolder, startRenderQueue])

  // Получение статистики
  const getStats = () => {
    const completed = renderJobs.filter((job) => job.status === RenderStatus.Completed).length
    const failed = renderJobs.filter((job) => job.status === RenderStatus.Failed).length
    const queued = renderJobs.filter((job) => job.status === RenderStatus.Pending).length
    const processing = renderJobs.filter((job) => job.status === RenderStatus.Processing).length

    return { total: renderJobs.length, completed, failed, queued, processing }
  }

  const stats = getStats()

  // Получение иконки статуса
  const getStatusIcon = (status: RenderStatus) => {
    switch (status) {
      case RenderStatus.Pending:
        return <Square className="h-4 w-4 text-muted-foreground" />
      case RenderStatus.Processing:
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case RenderStatus.Completed:
        return <CheckSquare className="h-4 w-4 text-green-500" />
      case RenderStatus.Failed:
        return <X className="h-4 w-4 text-red-500" />
      case RenderStatus.Cancelled:
        return <Square className="h-4 w-4 text-orange-500" />
      default:
        return <Square className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6" data-testid="batch-export-tab">
      {/* Настройки экспорта */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dialogs.export.batchSettings")}</CardTitle>
          <CardDescription>{t("dialogs.export.batchSettingsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Пресеты */}
          <ExportPresets
            selectedPresetId={selectedPresetId}
            onSelectPreset={handlePresetSelect}
            className="-mx-6 px-6"
          />

          {/* Папка вывода */}
          <div className="space-y-2">
            <Label>{t("dialogs.export.outputFolder")}</Label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 border rounded-md text-sm">
                {outputFolder || t("dialogs.export.noFolderSelected")}
              </div>
              <Button variant="outline" size="icon" onClick={handleChooseOutputFolder}>
                <Folder className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Проекты для добавления */}
      {pendingProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dialogs.export.pendingProjects")}</CardTitle>
            <CardDescription>
              {t("dialogs.export.pendingProjectsCount", { count: pendingProjects.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-2">
                {pendingProjects.map((project, index) => (
                  <div
                    key={`${project.projectPath}-${index}`}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <FileVideo className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{project.projectName}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {project.outputPath || t("dialogs.export.noOutputPath")}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removePendingProject(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Очередь рендеринга */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("dialogs.export.renderQueue")}</CardTitle>
              <CardDescription>
                {activeJobsCount > 0
                  ? t("dialogs.export.activeJobs", { count: activeJobsCount })
                  : t("dialogs.export.noActiveJobs")}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleAddProjects} disabled={isProcessing}>
                <FileVideo className="h-4 w-4 mr-2" />
                {t("dialogs.export.addProjects")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => void refreshQueue()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              {stats.completed > 0 && (
                <Button variant="outline" size="sm" onClick={clearCompleted}>
                  {t("dialogs.export.clearCompleted")}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {renderJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t("dialogs.export.emptyQueue")}</div>
              ) : (
                renderJobs.map((job) => (
                  <div
                    key={job.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      job.status === RenderStatus.Processing && "border-blue-500/50",
                      job.status === RenderStatus.Completed && "border-green-500/50",
                      job.status === RenderStatus.Failed && "border-red-500/50",
                    )}
                  >
                    {getStatusIcon(job.status)}

                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{job.project_name}</div>
                      <div className="text-sm text-muted-foreground truncate">{job.output_path}</div>

                      {job.status === RenderStatus.Processing && job.progress && (
                        <div className="mt-2 space-y-1">
                          <Progress value={job.progress.percentage} className="h-1" />
                          <div className="text-xs text-muted-foreground">
                            {job.progress.message || `${Math.round(job.progress.percentage)}%`}
                          </div>
                        </div>
                      )}

                      {job.status === RenderStatus.Failed && job.progress?.message && (
                        <div className="mt-1 text-xs text-red-500">{job.progress.message}</div>
                      )}
                    </div>

                    {job.status === RenderStatus.Processing && (
                      <Button variant="ghost" size="icon" onClick={() => void cancelJob(job.id)}>
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Статистика */}
          {renderJobs.length > 0 && (
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
              {t("dialogs.export.queueStats", {
                total: stats.total,
                completed: stats.completed,
                failed: stats.failed,
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Кнопки управления */}
      <div className="flex gap-2">
        {isProcessing ? (
          <>
            <Button variant="outline" onClick={() => void cancelAllJobs()} className="flex-1">
              {t("dialogs.export.cancelAll")}
            </Button>
            <Button disabled className="flex-1">
              {t("dialogs.export.processing", { count: stats.processing })}...
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} className="flex-1">
              {t("dialogs.export.close")}
            </Button>
            <Button
              onClick={() => void handleStartExport()}
              disabled={pendingProjects.length === 0 || !outputFolder}
              className="flex-1 bg-[#00CCC0] hover:bg-[#00B8B0] text-black"
            >
              {t("dialogs.export.startBatchExport", { count: pendingProjects.length })}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

import { CheckSquare, FileVideo, Folder, Loader2, Pause, RefreshCw, Square, Trash2, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { container } from "@timeline-studio/core"
import type { RenderStatus } from "@timeline-studio/core/types"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { useRenderQueue } from "../hooks/use-render-queue"
import type { ExportSettings } from "../types/export-types"
import { ExportPresets } from "./export-presets"

const logger = createLogger({ module: "BatchExportTab" })

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
  const platform = useMemo(() => {
    try {
      return container.hasPlatform() ? container.getPlatform() : null
    } catch {
      return null
    }
  }, [])
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
    if (!platform) {
      logger.error("Platform service not available")
      return
    }

    try {
      const selected = await platform.showOpenDialog({
        directory: true,
        title: t("dialogs.export.selectOutputFolder"),
      })

      if (selected && selected.length > 0) {
        const folder = selected[0]
        setOutputFolder(folder)

        // Обновляем пути для всех ожидающих проектов
        setPendingProjects((prev) =>
          prev.map((project) => ({
            ...project,
            outputPath: `${folder}/${project.projectName}_export.${project.settings.format}`,
          })),
        )
      }
    } catch (error) {
      logger.error(`Failed to select output folder: ${String(error)}`)
    }
  }, [t, platform])

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
      logger.error(`Failed to add projects: ${String(error)}`)
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
    const completed = renderJobs.filter((job) => (job.status as any) === "Completed").length
    const failed = renderJobs.filter((job) => (job.status as any) === "Failed").length
    const queued = renderJobs.filter((job) => (job.status as any) === "Pending").length
    const processing = renderJobs.filter((job) => (job.status as any) === "Processing").length

    return { total: renderJobs.length, completed, failed, queued, processing }
  }

  const stats = getStats()

  // Получение иконки статуса
  const getStatusIcon = (status: RenderStatus) => {
    switch (status as any) {
      case "Pending":
        return <Square className="h-4 w-4 text-muted-foreground" data-oid="_fgwme_" />
      case "Processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" data-oid="9-pht70" />
      case "Completed":
        return <CheckSquare className="h-4 w-4 text-green-500" data-oid="qvtm4no" />
      case "Failed":
        return <X className="h-4 w-4 text-red-500" data-oid="v1x5cz-" />
      case "Cancelled":
        return <Square className="h-4 w-4 text-orange-500" data-oid="8nys21g" />
      default:
        return <Square className="h-4 w-4 text-muted-foreground" data-oid="k72h8f_" />
    }
  }

  return (
    <div className="space-y-6" data-testid="batch-export-tab" data-oid="hgf_aiz">
      {/* Настройки экспорта */}
      <Card data-oid="vk7ueof">
        <CardHeader data-oid="ugsymhz">
          <CardTitle data-oid="035pqf2">{t("dialogs.export.batchSettings")}</CardTitle>
          <CardDescription data-oid="uhvq36q">{t("dialogs.export.batchSettingsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="f6cowj3">
          {/* Пресеты */}
          <ExportPresets
            selectedPresetId={selectedPresetId}
            onSelectPreset={handlePresetSelect}
            className="-mx-6 px-6"
            data-oid="-xvrunj"
          />

          {/* Папка вывода */}
          <div className="space-y-2" data-oid="_w.gbi7">
            <Label data-oid="sien3v5">{t("dialogs.export.outputFolder")}</Label>
            <div className="flex gap-2" data-oid=":ma5kcr">
              <div className="flex-1 px-3 py-2 border rounded-md text-sm" data-oid="xa-xgpe">
                {outputFolder || t("dialogs.export.noFolderSelected")}
              </div>
              <Button variant="outline" size="icon" onClick={handleChooseOutputFolder} data-oid="78.0u8f">
                <Folder className="h-4 w-4" data-oid="dbk0q6y" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Проекты для добавления */}
      {pendingProjects.length > 0 && (
        <Card data-oid="d:rjo06">
          <CardHeader data-oid="y5647pv">
            <CardTitle data-oid="awxr1r8">{t("dialogs.export.pendingProjects")}</CardTitle>
            <CardDescription data-oid="tedh8ck">
              {t("dialogs.export.pendingProjectsCount", {
                count: pendingProjects.length,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent data-oid=".kqe0q2">
            <ScrollArea className="h-[200px] pr-4" data-oid="ebf2dzb">
              <div className="space-y-2" data-oid="mepve6u">
                {pendingProjects.map((project, index) => (
                  <div
                    key={`${project.projectPath}-${index}`}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                    data-oid="resj3tx"
                  >
                    <FileVideo className="h-4 w-4 text-muted-foreground" data-oid="qifj38q" />
                    <div className="flex-1 min-w-0" data-oid="yeqzr2g">
                      <div className="font-medium truncate" data-oid="q0slxo7">
                        {project.projectName}
                      </div>
                      <div className="text-sm text-muted-foreground truncate" data-oid=".nh31dv">
                        {project.outputPath || t("dialogs.export.noOutputPath")}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removePendingProject(index)} data-oid="kq74fzx">
                      <Trash2 className="h-4 w-4" data-oid="_rci1_9" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Очередь рендеринга */}
      <Card data-oid="-9jv2sj">
        <CardHeader data-oid="h9fvyyu">
          <div className="flex items-center justify-between" data-oid="ze1dbs.">
            <div data-oid="m4lk7c-">
              <CardTitle data-oid="uco2751">{t("dialogs.export.renderQueue")}</CardTitle>
              <CardDescription data-oid="w_26s.2">
                {activeJobsCount > 0
                  ? t("dialogs.export.activeJobs", { count: activeJobsCount })
                  : t("dialogs.export.noActiveJobs")}
              </CardDescription>
            </div>
            <div className="flex gap-2" data-oid="tul5z3u">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddProjects}
                disabled={isProcessing}
                data-oid="cob7-xd"
              >
                <FileVideo className="h-4 w-4 mr-2" data-oid="26ber72" />
                {t("dialogs.export.addProjects")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => void refreshQueue()} data-oid="zxrs0:t">
                <RefreshCw className="h-4 w-4" data-oid="g292s:h" />
              </Button>
              {stats.completed > 0 && (
                <Button variant="outline" size="sm" onClick={clearCompleted} data-oid="udgjhmn">
                  {t("dialogs.export.clearCompleted")}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent data-oid="a:5o-ng">
          <ScrollArea className="h-[300px] pr-4" data-oid="81powr4">
            <div className="space-y-2" data-oid="oegn3d3">
              {renderJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-oid="thf7.xo">
                  {t("dialogs.export.emptyQueue")}
                </div>
              ) : (
                renderJobs.map((job) => (
                  <div
                    key={job.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      (job.status as any) === "Processing" && "border-blue-500/50",
                      (job.status as any) === "Completed" && "border-green-500/50",
                      (job.status as any) === "Failed" && "border-red-500/50",
                    )}
                    data-oid="mmo4qa."
                  >
                    {getStatusIcon(job.status)}

                    <div className="flex-1 min-w-0" data-oid="juy6sbv">
                      <div className="font-medium truncate" data-oid="reh.cdw">
                        {job.project_name}
                      </div>
                      <div className="text-sm text-muted-foreground truncate" data-oid="_0-90_f">
                        {job.output_path}
                      </div>

                      {(job.status as any) === "Processing" && job.progress && (
                        <div className="mt-2 space-y-1" data-oid="jv4k_ja">
                          <Progress value={job.progress.percentage} className="h-1" data-oid="odky4mt" />
                          <div className="text-xs text-muted-foreground" data-oid="5scue78">
                            {job.progress.message || `${Math.round(job.progress.percentage)}%`}
                          </div>
                        </div>
                      )}

                      {(job.status as any) === "Failed" && job.progress?.message && (
                        <div className="mt-1 text-xs text-red-500" data-oid="n760:5v">
                          {job.progress.message}
                        </div>
                      )}
                    </div>

                    {(job.status as any) === "Processing" && (
                      <Button variant="ghost" size="icon" onClick={() => void cancelJob(job.id)} data-oid="f.o.etm">
                        <Pause className="h-4 w-4" data-oid="b6wfz_t" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Статистика */}
          {renderJobs.length > 0 && (
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground" data-oid="v25v-as">
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
      <div className="flex gap-2" data-oid="fa_5z1o">
        {isProcessing ? (
          <>
            <Button variant="outline" onClick={() => void cancelAllJobs()} className="flex-1" data-oid="t4pfagk">
              {t("dialogs.export.cancelAll")}
            </Button>
            <Button disabled className="flex-1" data-oid="mzpael8">
              {t("dialogs.export.processing", { count: stats.processing })}...
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} className="flex-1" data-oid="nwj3zp_">
              {t("dialogs.export.close")}
            </Button>
            <Button
              onClick={() => void handleStartExport()}
              disabled={pendingProjects.length === 0 || !outputFolder}
              className="flex-1 bg-[#00CCC0] hover:bg-[#00B8B0] text-black"
              data-oid="q:_yx--"
            >
              {t("dialogs.export.startBatchExport", {
                count: pendingProjects.length,
              })}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

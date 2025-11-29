import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { container } from "@/core"
import { useNotifications } from "@/core/hooks"
import { OutputFormat } from "@/core/types"
import { logError, logInfo } from "@/lib/tauri-logger"
import { QUALITY_PRESETS, RESOLUTION_PRESETS } from "../constants/export-constants"
import type { ExportSettings } from "../types/export-types"

const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  fileName: "",
  savePath: "",
  format: OutputFormat.Mp4,
  quality: "good",
  resolution: "1080",
  frameRate: "25",
  enableGPU: true,
  advancedCompression: false,
  cloudBackup: false,
}

export function useExportSettings() {
  logInfo("[useExportSettings] Инициализация хука")

  const { t } = useTranslation()
  const { showError } = useNotifications()
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    ...DEFAULT_EXPORT_SETTINGS,
    fileName: t("project.untitledExport", { number: 1 }),
  })
  const platform = useMemo(() => {
    try {
      return container.hasPlatform() ? container.getPlatform() : null
    } catch {
      return null
    }
  }, [])

  const handleChooseFolder = useCallback(async () => {
    if (!platform) {
      logError("[useExportSettings] Platform service not available")
      showError(t("dialogs.export.errors.folderSelection"), "")
      return
    }

    try {
      const selectedPath = await platform.showSaveDialog({
        title: t("dialogs.export.selectFolder"),
        defaultPath: `${exportSettings.fileName}.${exportSettings.format}`,
        filters: [
          {
            name: "Video",
            extensions: [exportSettings.format],
          },
        ],
      })

      if (selectedPath) {
        setExportSettings((prev) => ({ ...prev, savePath: selectedPath }))
      }
    } catch (error) {
      logError(`[useExportSettings] Ошибка выбора папки: ${String(error)}`)
      showError(t("dialogs.export.errors.folderSelection"), "")
    }
  }, [platform, exportSettings, showError, t])

  const getExportConfig = useCallback(() => {
    const qualityPreset = QUALITY_PRESETS[exportSettings.quality]
    const resolutionPreset =
      exportSettings.resolution === "timeline"
        ? { width: 1920, height: 1080, label: "Timeline Resolution" }
        : RESOLUTION_PRESETS[exportSettings.resolution]

    const formatMap: Record<string, OutputFormat> = {
      mp4: OutputFormat.Mp4,
      mov: OutputFormat.Mov,
      webm: OutputFormat.WebM,
    }

    return {
      format: formatMap[exportSettings.format] || OutputFormat.Mp4,
      quality: qualityPreset.quality,
      videoBitrate: qualityPreset.videoBitrate,
      resolution: [resolutionPreset.width, resolutionPreset.height] as [number, number],
      frameRate: Number.parseInt(exportSettings.frameRate, 10),
      enableGPU: exportSettings.enableGPU,
      advancedCompression: exportSettings.advancedCompression,
      cloudBackup: exportSettings.cloudBackup,
    }
  }, [exportSettings])

  const getCurrentSettings = useCallback(() => {
    return exportSettings
  }, [exportSettings])

  const updateSettings = useCallback((updates: Partial<ExportSettings>) => {
    setExportSettings((prev) => ({ ...prev, ...updates }))
  }, [])

  return {
    exportSettings,
    handleChooseFolder,
    getExportConfig,
    getCurrentSettings,
    updateSettings,
  }
}

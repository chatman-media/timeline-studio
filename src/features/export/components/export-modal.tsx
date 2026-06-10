import { useCallback, useState } from "react"

import { useTranslation } from "react-i18next"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotifications } from "@/core/hooks"
import { useTimeline } from "@/features/timeline/hooks/state/use-timeline"
import { useVideoCompiler } from "@/features/video-compiler/hooks/use-video-compiler"
import { createLogger } from "@/lib/tauri-logger"
import { useExportSettings } from "../hooks/use-export-settings"
import { useSocialExport } from "../hooks/use-social-export"
import type { ExportSettings, SocialExportSettings } from "../types/export-types"
import { ProjectSchemaBuilder } from "../utils/project-schema-builder"
import { BatchExportTab } from "./batch-export-tab"
import { DetailedExportInterface } from "./detailed-export-interface"
import { SectionExportTab } from "./section-export-tab"
import { SocialExportTab } from "./social-export-tab"

const logger = createLogger({ module: "ExportModal" })

interface ExportModalProps {
  onClose?: () => void | Promise<void>
  "data-oid"?: string
}

const noop = () => {}

export function ExportModal({ onClose = noop }: ExportModalProps) {
  const { t } = useTranslation()
  const { showError, showSuccess } = useNotifications()
  const { project } = useTimeline()
  const { startRender, isRendering, renderProgress, cancelRender } = useVideoCompiler()
  const { uploadToSocialNetwork } = useSocialExport()

  const { getCurrentSettings, updateSettings, handleChooseFolder, getExportConfig } = useExportSettings()

  const [activeTab, setActiveTab] = useState<"local" | "social" | "batch" | "sections">("local")
  const [socialSettings, setSocialSettings] = useState<SocialExportSettings>({
    ...getCurrentSettings(),
    socialNetwork: "youtube",
    isLoggedIn: false,
    privacy: "public",
  })

  // Запуск экспорта
  const handleExport = useCallback(async () => {
    if (!project) {
      showError(t("dialogs.export.errors.noProject"), "")
      return
    }

    const settings = getCurrentSettings()

    if (!settings.savePath) {
      showError(t("dialogs.export.errors.noPath"), "")
      return
    }

    try {
      // Используем ProjectSchemaBuilder для создания схемы с настройками экспорта
      const projectSchema = ProjectSchemaBuilder.createForExport(project as any, settings)

      // Запускаем экспорт
      await startRender(projectSchema, settings.savePath)
    } catch (error) {
      logger.error(`Export failed: ${String(error)}`)
      showError(t("dialogs.export.errors.exportFailed"), "")
    }
  }, [project, getCurrentSettings, getExportConfig, startRender, showError, t])

  // Запуск социального экспорта
  const handleSocialExport = useCallback(
    async (socialNetwork: string) => {
      if (!project) {
        showError(t("dialogs.export.errors.noProject"), "")
        return
      }

      try {
        // Используем ProjectSchemaBuilder для создания схемы с настройками экспорта
        const projectSchema = ProjectSchemaBuilder.createForExport(project as any, socialSettings)

        // Запускаем экспорт и загрузку в социальную сеть
        const tempPath = `/tmp/export_${Date.now()}.mp4`
        await startRender(projectSchema, tempPath)

        // После рендеринга загружаем в социальную сеть
        await uploadToSocialNetwork(tempPath, socialSettings)

        showSuccess(t("dialogs.export.uploadSuccess", { platform: socialNetwork }), "")
      } catch (error) {
        logger.error(`Social export failed: ${String(error)}`)
        showError(t("dialogs.export.errors.socialExportFailed"), "")
      }
    },
    [project, getExportConfig, startRender, uploadToSocialNetwork, socialSettings, showError, showSuccess, t],
  )

  // Отмена рендеринга
  const handleCancelRender = useCallback(async () => {
    if (renderProgress?.job_id) {
      await cancelRender(renderProgress.job_id)
    }
  }, [renderProgress, cancelRender])

  const handleClose = useCallback(() => {
    void onClose()
  }, [onClose])

  const currentSettings = getCurrentSettings()

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "local" | "social" | "batch" | "sections")}
      data-oid="wmlgapk"
    >
      <TabsList className="grid w-full grid-cols-4 mb-6" data-oid="ggjgj87">
        <TabsTrigger value="local" data-oid="lwhk-.v">
          {t("dialogs.export.local")}
        </TabsTrigger>
        <TabsTrigger value="social" data-oid=":eaocwf">
          {t("dialogs.export.socialNetworks")}
        </TabsTrigger>
        <TabsTrigger value="batch" data-oid="_s6sscg">
          {t("dialogs.export.batchTab")}
        </TabsTrigger>
        <TabsTrigger value="sections" data-oid="1sh7cyf">
          {t("dialogs.export.sectionsTab")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="local" data-oid="bbgy3rz">
        <DetailedExportInterface
          settings={currentSettings as any}
          onSettingsChange={updateSettings}
          onChooseFolder={handleChooseFolder}
          onExport={handleExport}
          onCancelExport={handleCancelRender}
          onClose={handleClose}
          isRendering={isRendering}
          renderProgress={renderProgress as any}
          hasProject={!!project}
          data-oid="xvmruj7"
        />
      </TabsContent>

      <TabsContent value="social" data-oid="ea19.wz">
        <SocialExportTab
          settings={socialSettings}
          onSettingsChange={(updates) => setSocialSettings((prev) => ({ ...prev, ...updates }))}
          onExport={handleSocialExport}
          onCancelExport={handleCancelRender}
          onClose={handleClose}
          isRendering={isRendering}
          renderProgress={renderProgress as any}
          hasProject={!!project}
          data-oid="8zou43a"
        />
      </TabsContent>

      <TabsContent value="batch" data-oid="2oivd2g">
        <BatchExportTab onClose={handleClose} defaultSettings={currentSettings} data-oid="ipjbfkp" />
      </TabsContent>

      <TabsContent value="sections" data-oid="prx:u08">
        <SectionExportTab
          defaultSettings={currentSettings}
          onExport={async (settings) => {
            if (!project) {
              showError(t("dialogs.export.errors.noProject"), "")
              return
            }

            try {
              // Handle section export
              for (const section of settings.sections) {
                // Используем специализированный метод для экспорта секций
                const sectionExportSettings: ExportSettings = {
                  ...currentSettings,
                  format: settings.format,
                  quality: settings.quality,
                  bitrate: settings.bitrate || 5000,
                  enableGPU: settings.enableGPU,
                  fileName: section.customFileName || section.name,
                  savePath: settings.savePath,
                }
                const projectSchema = ProjectSchemaBuilder.createForSectionExport(
                  project as any,
                  sectionExportSettings,
                  section.startTime,
                  section.endTime,
                  section.name,
                )

                // Generate output path
                const fileName = section.customFileName || section.name
                const outputPath = `${settings.savePath}/${fileName}.${settings.format}`

                await startRender(projectSchema, outputPath)
              }

              showSuccess(t("dialogs.export.sectionsExportSuccess"), "")
              handleClose()
            } catch (error) {
              logger.error(`Section export failed: ${String(error)}`)
              showError(t("dialogs.export.errors.exportFailed"), "")
            }
          }}
          data-oid="v_5sbw."
        />
      </TabsContent>
    </Tabs>
  )
}

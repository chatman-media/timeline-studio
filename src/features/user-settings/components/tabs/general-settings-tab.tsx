import { Database, Folder, Save, X } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { container } from "@/core"
import { useModals } from "@/domains/system-integration"
import { useLanguage } from "@/features/language"
import { type LanguageCode, SUPPORTED_LANGUAGES } from "@/i18n/constants"
import { createLogger } from "@/lib/tauri-logger"
import { useUserSettings } from "../../hooks/use-user-settings"

const logger = createLogger({ module: "GeneralSettingsTab" })

/**
 * Вкладка общих настроек пользователя
 * Содержит основные настройки: язык, пути, производительность
 */
export function GeneralSettingsTab() {
  const {
    screenshotsPath,
    playerScreenshotsPath,
    handlePlayerScreenshotsPathChange,
    handleScreenshotsPathChange,
    autoSaveEnabled,
    autoSaveInterval,
    handleAutoSaveEnabledChange,
    handleAutoSaveIntervalChange,
  } = useUserSettings()

  const { openModal } = useModals()
  const { t } = useTranslation()

  const { currentLanguage, changeLanguage } = useLanguage()

  // Локальное состояние для выбранного языка
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(currentLanguage)

  const platform = useMemo(() => {
    try {
      return container.hasPlatform() ? container.getPlatform() : null
    } catch {
      return null
    }
  }, [])

  /**
   * Обработчик изменения языка интерфейса
   */
  const handleLanguageSelect = (value: string) => {
    const newLanguage = value as LanguageCode
    setSelectedLanguage(newLanguage)
    void logger.info("Applying language change via new system:", { language: newLanguage })
    void changeLanguage(newLanguage)
  }

  return (
    <div className="space-y-6">
      {/* Выбор языка интерфейса */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{t("dialogs.userSettings.interfaceLanguage")}</Label>
        <Select value={selectedLanguage} onValueChange={handleLanguageSelect}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("dialogs.userSettings.interfaceLanguage")} />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {t(`language.native.${lang}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Настройка пути для сохранения скриншотов */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t("dialogs.userSettings.screenshotsPath")}</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={screenshotsPath}
              onChange={(e) => handleScreenshotsPathChange(e.target.value)}
              placeholder="public/screenshots"
              className="h-9 pr-8 font-mono text-sm"
            />
            {screenshotsPath && screenshotsPath !== "public/screenshots" && (
              <button
                type="button"
                onClick={() => handleScreenshotsPathChange("public/screenshots")}
                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title={t("dialogs.userSettings.clearPath")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 cursor-pointer"
            title={t("dialogs.userSettings.selectFolder")}
            onClick={() => {
              void (async () => {
                if (!platform) {
                  const promptResult = window.prompt(t("dialogs.userSettings.selectFolderPrompt"), "public/screenshots")
                  if (promptResult) {
                    handleScreenshotsPathChange(promptResult.trim())
                  }
                  return
                }

                try {
                  const selectedFolders = await platform.showOpenDialog({
                    directory: true,
                    multiple: false,
                    title: t("dialogs.userSettings.selectFolder"),
                  })

                  if (selectedFolders && selectedFolders.length > 0) {
                    handleScreenshotsPathChange(selectedFolders[0])
                    void logger.info("Screenshots path updated from folder dialog:", { path: selectedFolders[0] })
                  }
                } catch (error) {
                  void logger.error("Ошибка при выборе директории:", { error: String(error) })
                  const promptResult = window.prompt(t("dialogs.userSettings.selectFolderPrompt"), "public/screenshots")
                  if (promptResult) {
                    handleScreenshotsPathChange(promptResult.trim())
                  }
                }
              })()
            }}
          >
            <Folder className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Настройка пути для сохранения скриншотов плеера */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {t("dialogs.userSettings.playerScreenshotsPath", "Путь для сохранения скриншотов видеоплеера")}
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={playerScreenshotsPath}
              onChange={(e) => handlePlayerScreenshotsPathChange(e.target.value)}
              placeholder="public/media"
              className="h-9 pr-8 font-mono text-sm"
            />
            {playerScreenshotsPath && playerScreenshotsPath !== "public/media" && (
              <button
                type="button"
                onClick={() => handlePlayerScreenshotsPathChange("public/media")}
                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title={t("dialogs.userSettings.clearPath")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 cursor-pointer"
            title={t("dialogs.userSettings.selectFolder")}
            onClick={() => {
              void (async () => {
                if (!platform) {
                  const promptResult = window.prompt(t("dialogs.userSettings.selectFolderPrompt"), "public/media")
                  if (promptResult) {
                    handlePlayerScreenshotsPathChange(promptResult.trim())
                  }
                  return
                }

                try {
                  const selectedFolders = await platform.showOpenDialog({
                    directory: true,
                    multiple: false,
                    title: t("dialogs.userSettings.selectFolder"),
                  })

                  if (selectedFolders && selectedFolders.length > 0) {
                    handlePlayerScreenshotsPathChange(selectedFolders[0])
                    void logger.info("Player screenshots path updated from folder dialog:", {
                      path: selectedFolders[0],
                    })
                  }
                } catch (error) {
                  void logger.error("Ошибка при выборе директории:", { error: String(error) })
                  const promptResult = window.prompt(t("dialogs.userSettings.selectFolderPrompt"), "public/media")
                  if (promptResult) {
                    handlePlayerScreenshotsPathChange(promptResult.trim())
                  }
                }
              })()
            }}
          >
            <Folder className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Раздел производительности */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t("dialogs.userSettings.performance.title")}</Label>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModal("cache-statistics", { returnTo: "user-settings" })}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            {t("dialogs.userSettings.cacheStats", "Статистика кэша")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModal("cache-settings", { returnTo: "user-settings" })}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            {t("dialogs.userSettings.cacheSettings", "Настройки кэша")}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Настройки автосохранения */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          <Label className="text-sm font-medium">
            {t("dialogs.userSettings.autoSave.title", "Автосохранение проекта")}
          </Label>
        </div>

        {/* Переключатель автосохранения */}
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-save-enabled" className="text-sm">
            {t("dialogs.userSettings.autoSave.enable", "Включить автосохранение")}
          </Label>
          <Switch id="auto-save-enabled" checked={autoSaveEnabled} onCheckedChange={handleAutoSaveEnabledChange} />
        </div>

        {/* Интервал автосохранения */}
        {autoSaveEnabled && (
          <div className="space-y-2">
            <Label htmlFor="auto-save-interval" className="text-sm">
              {t("dialogs.userSettings.autoSave.interval", "Интервал автосохранения (секунды)")}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="auto-save-interval"
                type="number"
                min="10"
                max="3600"
                value={autoSaveInterval}
                onChange={(e) => {
                  const value = Number.parseInt(e.target.value, 10)
                  if (!Number.isNaN(value) && value >= 10 && value <= 3600) {
                    handleAutoSaveIntervalChange(value)
                  }
                }}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">
                {t("dialogs.userSettings.autoSave.intervalHint", "10-3600 секунд")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                "dialogs.userSettings.autoSave.description",
                "Проект будет автоматически сохраняться через указанный интервал времени",
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

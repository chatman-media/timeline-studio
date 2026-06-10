import { Database, Folder, Save, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { container } from "@timeline-studio/core"
import { useModals } from "@timeline-studio/core/hooks"
import { appDirectoriesService } from "@timeline-studio/core/services"
import { useLanguage } from "@/features/language"
import { type LanguageCode, SUPPORTED_LANGUAGES } from "@/i18n/constants"
import { replaceHomeWithTilde } from "@/lib/path-utils"
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

  // Локальное состояние для placeholders путей
  const [defaultScreenshotsPath, setDefaultScreenshotsPath] = useState("")
  const [defaultPlayerScreenshotsPath, setDefaultPlayerScreenshotsPath] = useState("")

  const platform = useMemo(() => {
    try {
      return container.hasPlatform() ? container.getPlatform() : null
    } catch {
      return null
    }
  }, [])

  // Загружаем пути из AppDirectories при монтировании
  useEffect(() => {
    const loadDefaultPaths = async () => {
      try {
        const directories = await appDirectoriesService.getAppDirectories()
        // Заменяем домашнюю директорию на тильду для отображения
        setDefaultScreenshotsPath(replaceHomeWithTilde(directories.snapshot_dir))
        setDefaultPlayerScreenshotsPath(replaceHomeWithTilde(directories.media_dir))
      } catch (error) {
        void logger.warn("Could not load default paths from AppDirectories:", {
          error,
        })
      }
    }

    void loadDefaultPaths()
  }, [])

  /**
   * Обработчик изменения языка интерфейса
   */
  const handleLanguageSelect = (value: string) => {
    const newLanguage = value as LanguageCode
    setSelectedLanguage(newLanguage)
    void logger.info("Applying language change via new system:", {
      language: newLanguage,
    })
    void changeLanguage(newLanguage)
  }

  return (
    <div className="space-y-6" data-oid="6k75gj-">
      {/* Выбор языка интерфейса */}
      <div className="flex items-center justify-between" data-oid="ecj_1lx">
        <Label className="text-sm font-medium" data-oid=".cfdgbh">
          {t("dialogs.userSettings.interfaceLanguage")}
        </Label>
        <Select value={selectedLanguage} onValueChange={handleLanguageSelect} data-oid="wp8bxe.">
          <SelectTrigger className="w-[180px]" data-oid=":8atdyu">
            <SelectValue placeholder={t("dialogs.userSettings.interfaceLanguage")} data-oid="fua_w45" />
          </SelectTrigger>
          <SelectContent data-oid="j325:cw">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang} data-oid="c27qdxf">
                {t(`language.native.${lang}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator data-oid="xzp3u:s" />

      {/* Настройка пути для сохранения скриншотов */}
      <div className="space-y-3" data-oid="yg-us_l">
        <Label className="text-sm font-medium" data-oid="4227n:w">
          {t("dialogs.userSettings.screenshotsPath")}
        </Label>
        <div className="flex gap-2" data-oid="m0jjy6r">
          <div className="relative flex-1" data-oid="q1exzek">
            <Input
              value={screenshotsPath}
              onChange={(e) => handleScreenshotsPathChange(e.target.value)}
              placeholder={defaultScreenshotsPath || "Loading..."}
              className="h-9 pr-8 font-mono text-sm"
              data-oid="38t2k2w"
            />

            {screenshotsPath && screenshotsPath !== defaultScreenshotsPath && (
              <button
                type="button"
                onClick={() => handleScreenshotsPathChange(defaultScreenshotsPath)}
                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title={t("dialogs.userSettings.clearPath")}
                data-oid="zjp8_4q"
              >
                <X className="h-4 w-4" data-oid="qcid_2b" />
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
                  const promptResult = window.prompt(
                    t("dialogs.userSettings.selectFolderPrompt"),
                    defaultScreenshotsPath || "Loading...",
                  )
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
                  void logger.error("Ошибка при выборе директории:", {
                    error: String(error),
                  })
                  const promptResult = window.prompt(
                    t("dialogs.userSettings.selectFolderPrompt"),
                    defaultScreenshotsPath || "Loading...",
                  )
                  if (promptResult) {
                    handleScreenshotsPathChange(promptResult.trim())
                  }
                }
              })()
            }}
            data-oid="0e_f8tt"
          >
            <Folder className="h-4 w-4" data-oid="ful0c7g" />
          </Button>
        </div>
      </div>

      {/* Настройка пути для сохранения скриншотов плеера */}
      <div className="space-y-3" data-oid="onh67-.">
        <Label className="text-sm font-medium" data-oid="j:ifibr">
          {t("dialogs.userSettings.playerScreenshotsPath", "Путь для сохранения скриншотов видеоплеера")}
        </Label>
        <div className="flex gap-2" data-oid="b:eqqbm">
          <div className="relative flex-1" data-oid="aksfoxh">
            <Input
              value={playerScreenshotsPath}
              onChange={(e) => handlePlayerScreenshotsPathChange(e.target.value)}
              placeholder={defaultPlayerScreenshotsPath || "Loading..."}
              className="h-9 pr-8 font-mono text-sm"
              data-oid="vaxrgk9"
            />

            {playerScreenshotsPath && playerScreenshotsPath !== defaultPlayerScreenshotsPath && (
              <button
                type="button"
                onClick={() => handlePlayerScreenshotsPathChange(defaultPlayerScreenshotsPath)}
                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title={t("dialogs.userSettings.clearPath")}
                data-oid="rdg-f.d"
              >
                <X className="h-4 w-4" data-oid="6te0_.r" />
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
                  const promptResult = window.prompt(
                    t("dialogs.userSettings.selectFolderPrompt"),
                    defaultPlayerScreenshotsPath || "Loading...",
                  )
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
                  void logger.error("Ошибка при выборе директории:", {
                    error: String(error),
                  })
                  const promptResult = window.prompt(
                    t("dialogs.userSettings.selectFolderPrompt"),
                    defaultPlayerScreenshotsPath || "Loading...",
                  )
                  if (promptResult) {
                    handlePlayerScreenshotsPathChange(promptResult.trim())
                  }
                }
              })()
            }}
            data-oid="wt_2x9x"
          >
            <Folder className="h-4 w-4" data-oid="efbfqkz" />
          </Button>
        </div>
      </div>

      <Separator data-oid=".l1j3iy" />

      {/* Раздел производительности */}
      <div className="space-y-3" data-oid="o-owwrw">
        <Label className="text-sm font-medium" data-oid="ckd4u30">
          {t("dialogs.userSettings.performance.title")}
        </Label>
        <div className="flex gap-2 flex-wrap" data-oid="ay.n_4m">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModal("cache-statistics", { returnTo: "user-settings" })}
            className="flex items-center gap-2"
            data-oid="nu49ga4"
          >
            <Database className="h-4 w-4" data-oid="pt-rcwt" />
            {t("dialogs.userSettings.cacheStats", "Статистика кэша")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModal("cache-settings", { returnTo: "user-settings" })}
            className="flex items-center gap-2"
            data-oid="6r0g.b2"
          >
            <Database className="h-4 w-4" data-oid="z0bu5h4" />
            {t("dialogs.userSettings.cacheSettings", "Настройки кэша")}
          </Button>
        </div>
      </div>

      <Separator data-oid="vlhujjg" />

      {/* Настройки автосохранения */}
      <div className="space-y-4" data-oid="gzpm_58">
        <div className="flex items-center gap-2" data-oid="m9fqqqn">
          <Save className="h-4 w-4" data-oid=".xchemq" />
          <Label className="text-sm font-medium" data-oid="e15r-pv">
            {t("dialogs.userSettings.autoSave.title", "Автосохранение проекта")}
          </Label>
        </div>

        {/* Переключатель автосохранения */}
        <div className="flex items-center justify-between" data-oid="0ak-laj">
          <Label htmlFor="auto-save-enabled" className="text-sm" data-oid="nud1l:5">
            {t("dialogs.userSettings.autoSave.enable", "Включить автосохранение")}
          </Label>
          <Switch
            id="auto-save-enabled"
            checked={autoSaveEnabled}
            onCheckedChange={handleAutoSaveEnabledChange}
            data-oid="-4ty0l-"
          />
        </div>

        {/* Интервал автосохранения */}
        {autoSaveEnabled && (
          <div className="space-y-2" data-oid="-kpnu14">
            <Label htmlFor="auto-save-interval" className="text-sm" data-oid="ru.h3-3">
              {t("dialogs.userSettings.autoSave.interval", "Интервал автосохранения (секунды)")}
            </Label>
            <div className="flex items-center gap-2" data-oid="-jou2b7">
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
                data-oid="u-r1p1i"
              />

              <span className="text-sm text-muted-foreground" data-oid="jpefzq_">
                {t("dialogs.userSettings.autoSave.intervalHint", "10-3600 секунд")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground" data-oid="9qqpsi2">
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

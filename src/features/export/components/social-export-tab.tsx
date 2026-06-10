import { Alert, AlertDescription } from "@timeline-studio/ui/components/alert"
import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { Progress } from "@timeline-studio/ui/components/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Textarea } from "@timeline-studio/ui/components/textarea"
import { AlertCircle, CheckCircle, Info, LogIn, Upload } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { createLogger } from "@/lib/tauri-logger"
import { SOCIAL_NETWORKS } from "../constants/export-constants"
import { useSocialExport } from "../hooks/use-social-export"
import type { ExportProgress, SocialExportSettings } from "../types/export-types"

const logger = createLogger({ module: "SocialExportTab" })

// Иконка YouTube
const YouTubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-600" data-oid="m4xkenq">
    <path
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      data-oid=":lptfus"
    />
  </svg>
)

// Иконка TikTok
const TikTokIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-black" data-oid="leaw572">
    <path
      d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.37 6.37 0 0 0-1-.09A6.35 6.35 0 0 0 3 15.64 6.35 6.35 0 0 0 9.37 22a6.35 6.35 0 0 0 6.35-6.35V8.44a8.28 8.28 0 0 0 4.83 1.52V6.69h-.96z"
      data-oid="s4g37w."
    />
  </svg>
)

// Иконка Telegram
const TelegramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500" data-oid="pyh2w-n">
    <path
      d="M12 0a12 12 0 1 0 12 12A12 12 0 0 0 12 0zm5.568 8.16l-1.635 7.7c-.123.546-.447.679-.907.422l-2.503-1.845-1.208 1.163a.63.63 0 0 1-.5.247l.179-2.5 4.61-4.158c.2-.178-.044-.278-.31-.1L9.368 13.72l-2.463-.769c-.536-.167-.546-.536.112-.793l9.615-3.7c.448-.167.84.1.696.793z"
      data-oid="arixgd0"
    />
  </svg>
)

// Иконка Vimeo
const VimeoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#1ab7ea]" data-oid="yv012u6">
    <path
      d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797z"
      data-oid="evnd-uz"
    />
  </svg>
)

interface SocialExportTabProps {
  settings: SocialExportSettings
  onSettingsChange: (updates: Partial<SocialExportSettings>) => void
  onExport: (socialNetwork: string) => void
  onCancelExport: () => void
  onClose: () => void
  isRendering: boolean
  renderProgress: ExportProgress | null
  hasProject: boolean
}

export function SocialExportTab({
  settings,
  onSettingsChange,
  onExport,
  onCancelExport,
  onClose,
  isRendering,
  renderProgress,
  hasProject,
}: SocialExportTabProps) {
  const { t } = useTranslation()
  const { loginToSocialNetwork, logoutFromSocialNetwork, validateSocialExport, getOptimalSettings, getNetworkLimits } =
    useSocialExport()

  const [selectedNetwork, setSelectedNetwork] = useState<string>(settings.socialNetwork || "youtube")
  const [loginStates, setLoginStates] = useState<Record<string, boolean>>({})

  // Валидация в реальном времени
  const validation = useMemo(() => {
    return validateSocialExport(settings)
  }, [settings, validateSocialExport])

  // Получаем лимиты для выбранной сети
  const networkLimits = useMemo(() => {
    return getNetworkLimits(selectedNetwork)
  }, [selectedNetwork, getNetworkLimits])

  // Получаем оптимальные настройки
  const optimalSettings = useMemo(() => {
    return getOptimalSettings(selectedNetwork)
  }, [selectedNetwork, getOptimalSettings])

  // Функция для получения статуса валидации
  const getValidationStatus = () => {
    if (validation.valid) {
      return (validation.warnings?.length ?? 0) > 0 || (validation.suggestions?.length ?? 0) > 0 ? "warning" : "success"
    }
    return "error"
  }

  // Функция для форматирования размера файла
  const formatFileSize = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB"]
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${Math.round(size * 10) / 10}${units[unitIndex]}`
  }

  // Функция для форматирования времени
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  // Обработчик входа в социальную сеть
  const handleLogin = async (networkId: string) => {
    try {
      const success = await loginToSocialNetwork(networkId)
      setLoginStates((prev) => ({ ...prev, [networkId]: success }))
      if (success) {
        onSettingsChange({
          socialNetwork: networkId,
          isLoggedIn: true,
        })
      }
    } catch (error) {
      logger.error(`Login to ${networkId} failed: ${String(error)}`)
    }
  }

  // Обработчик выхода из социальной сети
  const handleLogout = async (networkId: string) => {
    try {
      await logoutFromSocialNetwork(networkId)
      setLoginStates((prev) => ({ ...prev, [networkId]: false }))
      onSettingsChange({ isLoggedIn: false })
    } catch (error) {
      logger.error(`Logout from ${networkId} failed: ${String(error)}`)
    }
  }

  // Обработчик экспорта в социальную сеть
  const handleSocialExport = async () => {
    if (!selectedNetwork) return

    try {
      // Сначала проверяем видео
      const validation = validateSocialExport(settings)
      if (!validation.valid) {
        logger.warn(`Video validation failed: ${String(validation.error)}`)
        // Показать ошибки валидации пользователю
        return
      }

      // Запускаем экспорт
      onExport(selectedNetwork)
    } catch (error) {
      logger.error(`Social export failed: ${String(error)}`)
    }
  }

  // Получение иконки для социальной сети
  const getSocialIcon = (networkId: string) => {
    switch (networkId) {
      case "youtube":
        return <YouTubeIcon data-oid="pf1gidk" />
      case "vimeo":
        return <VimeoIcon data-oid="0je:sm7" />
      case "tiktok":
        return <TikTokIcon data-oid="9.9ju22" />
      case "telegram":
        return <TelegramIcon data-oid="0-a:w0i" />
      default:
        return <Upload className="h-5 w-5" data-oid="rpzecjh" />
    }
  }

  // Получение сети по ID
  const getNetworkById = (id: string) => SOCIAL_NETWORKS.find((n) => n.id === id)
  const selectedNetworkData = getNetworkById(selectedNetwork)

  return (
    <div className="space-y-6" data-testid="social-export-tab" data-oid="9gx0cbn">
      {/* Выбор социальной сети */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-oid="1ma.q11">
        {SOCIAL_NETWORKS.map((network) => {
          const isLoggedIn = loginStates[network.id] || false
          const isSelected = selectedNetwork === network.id

          return (
            <Card
              key={network.id}
              className={`cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary border-primary" : ""}`}
              onClick={() => setSelectedNetwork(network.id)}
              data-oid="ux:f0dd"
            >
              <CardHeader className="pb-3" data-oid="0qij_.4">
                <div className="flex items-center justify-between" data-oid="uq4.kp8">
                  <div className="flex items-center gap-3" data-oid="v9jjj5i">
                    {getSocialIcon(network.id)}
                    <CardTitle className="text-lg" data-oid=".zbak3w">
                      {network.name}
                    </CardTitle>
                  </div>
                  {isLoggedIn && <div className="w-2 h-2 bg-green-500 rounded-full" data-oid="hh-mvo_" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-3" data-oid="z83pv_t">
                <CardDescription data-oid="d_u8lps">
                  Max: {network.maxResolution} • {network.maxFps}fps
                </CardDescription>

                {isSelected && (
                  <div className="space-y-3" data-oid="1ao:wy9">
                    {!isLoggedIn ? (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          void handleLogin(network.id)
                        }}
                        className="w-full"
                        size="sm"
                        data-testid="social-login-button"
                        data-oid="-1_a:od"
                      >
                        <LogIn className="h-4 w-4 mr-2" data-oid="7g0m7hi" />
                        {t("dialogs.export.login")}
                      </Button>
                    ) : (
                      <div className="space-y-2" data-oid="thty9f6">
                        <div className="text-sm text-green-600 font-medium" data-oid="hdkljez">
                          {t("dialogs.export.loggedIn")}
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleLogout(network.id)
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                          data-oid="lu5-5rj"
                        >
                          {t("dialogs.export.logout")}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Валидация и лимиты сети */}
      {selectedNetworkData && networkLimits && (
        <Card data-oid="4isob0w">
          <CardHeader data-oid="s1v52g9">
            <CardTitle className="flex items-center justify-between" data-oid="q6o6jg4">
              <div className="flex items-center gap-3" data-oid="736ujcr">
                {getSocialIcon(selectedNetwork)}
                {selectedNetworkData.name} Limits & Validation
              </div>
              <div className="flex items-center gap-2" data-oid="-7-sycr">
                {validation.valid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" data-oid="vu0vcpd" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" data-oid="-ld3:we" />
                )}
                <Badge variant={validation.valid ? "default" : "destructive"} data-oid="k8c190b">
                  {validation.valid ? "Valid" : "Invalid"}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" data-oid="1_s9yc3">
            {/* Лимиты платформы */}
            {networkLimits && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg" data-oid="ni.in41">
                <div className="text-center" data-oid="j4o1qtn">
                  <div className="text-sm font-medium" data-oid="drujmjy">
                    Max File Size
                  </div>
                  <div className="text-xs text-muted-foreground" data-oid="3.u5rb3">
                    {(networkLimits.maxFileSize / (1024 * 1024 * 1024)).toFixed(1)}
                    GB
                  </div>
                </div>
                <div className="text-center" data-oid="01n4bmu">
                  <div className="text-sm font-medium" data-oid="9hv_ro6">
                    Max Duration
                  </div>
                  <div className="text-xs text-muted-foreground" data-oid="q3m-1pk">
                    {Math.round(networkLimits.maxDuration / 3600)}h
                  </div>
                </div>
                <div className="text-center" data-oid="8g6l0f1">
                  <div className="text-sm font-medium" data-oid="-..yea7">
                    Max Resolution
                  </div>
                  <div className="text-xs text-muted-foreground" data-oid="d11hl3a">
                    {networkLimits.maxResolution}
                  </div>
                </div>
                <div className="text-center" data-oid="sfiiieg">
                  <div className="text-sm font-medium" data-oid="79i9agf">
                    Title Limit
                  </div>
                  <div className="text-xs text-muted-foreground" data-oid="kgt.c6u">
                    {networkLimits.titleMaxLength} chars
                  </div>
                </div>
              </div>
            )}

            {/* Ошибки валидации */}
            {!validation.valid && validation.errors && validation.errors.length > 0 && (
              <Alert variant="destructive" data-oid="--26k7v">
                <AlertCircle className="h-4 w-4" data-oid="8b5-vtd" />
                <AlertDescription data-oid="d.ts9q6">
                  <div className="space-y-1" data-oid="4jo6n2l">
                    {validation.errors.map((error, index) => (
                      <div key={index} data-oid="g1jv:o0">
                        {error}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Предупреждения */}
            {validation.warnings && validation.warnings.length > 0 && (
              <Alert data-oid=".hhy5et">
                <Info className="h-4 w-4" data-oid="jo-o9mv" />
                <AlertDescription data-oid="2x52kx4">
                  <div className="space-y-1" data-oid="usraqr2">
                    {validation.warnings.map((warning, index) => (
                      <div key={index} data-oid=".46f5qx">
                        {warning}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Предложения по оптимизации */}
            {validation.suggestions && validation.suggestions.length > 0 && (
              <Alert data-oid="5um4ilo">
                <Info className="h-4 w-4" data-oid="i94wd9l" />
                <AlertDescription data-oid="90r3oc4">
                  <div className="space-y-1" data-oid="w700zmc">
                    <div className="font-medium" data-oid="5d2_u2d">
                      Optimization suggestions:
                    </div>
                    {validation.suggestions.map((suggestion, index) => (
                      <div key={index} className="text-sm" data-oid="vx.r7-_">
                        • {suggestion}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Настройки выбранной сети */}
      {selectedNetworkData && (
        <Card data-oid="uifi_vn">
          <CardHeader data-oid="q-niom5">
            <CardTitle className="flex items-center gap-3" data-oid="_k317zb">
              {getSocialIcon(selectedNetwork)}
              {t("dialogs.export.uploadSettings", {
                platform: selectedNetworkData.name,
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" data-oid="dgjcq12">
            {/* Название видео */}
            <div className="space-y-2" data-oid="u4zi6w.">
              <Label className="flex items-center justify-between" data-oid="0sm93in">
                {t("dialogs.export.videoTitle")}
                {networkLimits && (
                  <span
                    className={`text-xs ${
                      networkLimits && (settings.title || "").length > networkLimits.titleMaxLength
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }`}
                    data-oid="o7za32-"
                  >
                    {(settings.title || "").length}/{networkLimits?.titleMaxLength || 0}
                  </span>
                )}
              </Label>
              <Input
                placeholder={t("dialogs.export.enterTitle")}
                value={settings.title || ""}
                onChange={(e) => onSettingsChange({ title: e.target.value })}
                disabled={isRendering}
                className={
                  networkLimits && (settings.title || "").length > networkLimits.titleMaxLength
                    ? "border-red-500 focus:border-red-500"
                    : ""
                }
                data-oid="n4jz5c4"
              />
            </div>

            {/* Описание */}
            <div className="space-y-2" data-oid="aa1-vqb">
              <Label className="flex items-center justify-between" data-oid="d2gz7l1">
                {t("dialogs.export.description")}
                {networkLimits && (
                  <span
                    className={`text-xs ${
                      networkLimits && (settings.description || "").length > networkLimits.descriptionMaxLength
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }`}
                    data-oid="5r9ok3j"
                  >
                    {(settings.description || "").length}/{networkLimits?.descriptionMaxLength || 0}
                  </span>
                )}
              </Label>
              <Textarea
                placeholder={t("dialogs.export.enterDescription")}
                value={settings.description || ""}
                onChange={(e) => onSettingsChange({ description: e.target.value })}
                disabled={isRendering}
                rows={3}
                className={
                  networkLimits && (settings.description || "").length > networkLimits.descriptionMaxLength
                    ? "border-red-500 focus:border-red-500"
                    : ""
                }
                data-oid="c0-5zxe"
              />
            </div>

            {/* Приватность */}
            <div className="space-y-2" data-oid="ik:tlar">
              <Label data-oid="0lgav8g">{t("dialogs.export.privacy")}</Label>
              <Select
                value={settings.privacy || "public"}
                onValueChange={(value) => onSettingsChange({ privacy: value as any })}
                disabled={isRendering}
                data-oid="1mx8eyt"
              >
                <SelectTrigger data-oid="z5noa9m">
                  <SelectValue data-oid="t5ris8t" />
                </SelectTrigger>
                <SelectContent data-oid=".m4r1lw">
                  <SelectItem value="public" data-oid="x9o_99x">
                    {t("dialogs.export.public")}
                  </SelectItem>
                  <SelectItem value="unlisted" data-oid=".edlo-3">
                    {t("dialogs.export.unlisted")}
                  </SelectItem>
                  <SelectItem value="private" data-oid="2q.a9.q">
                    {t("dialogs.export.private")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Теги (только для YouTube) */}
            {selectedNetwork === "youtube" && (
              <div className="space-y-2" data-oid=":14tqw_">
                <Label className="flex items-center justify-between" data-oid="f8bbj5k">
                  {t("dialogs.export.tags")}
                  {networkLimits && (
                    <span
                      className={`text-xs ${
                        networkLimits && (settings.tags || []).length > networkLimits.tagsMaxCount
                          ? "text-red-500"
                          : "text-muted-foreground"
                      }`}
                      data-oid="12.rzha"
                    >
                      {(settings.tags || []).length}/{networkLimits?.tagsMaxCount || 0}
                    </span>
                  )}
                </Label>
                <Input
                  placeholder={t("dialogs.export.enterTags")}
                  value={settings.tags?.join(", ") || ""}
                  onChange={(e) =>
                    onSettingsChange({
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                  disabled={isRendering}
                  className={
                    networkLimits && (settings.tags || []).length > networkLimits.tagsMaxCount
                      ? "border-red-500 focus:border-red-500"
                      : ""
                  }
                  data-oid="mxh0:ab"
                />
              </div>
            )}

            {/* Категория (только для YouTube) */}
            {selectedNetwork === "youtube" && (
              <div className="space-y-2" data-oid="xdifhrf">
                <Label data-oid="om.kgbs">{t("dialogs.export.category")}</Label>
                <Select
                  value={settings.category || "22"}
                  onValueChange={(value) => onSettingsChange({ category: value })}
                  disabled={isRendering}
                  data-oid="yudlcq-"
                >
                  <SelectTrigger data-oid="adnyr_2">
                    <SelectValue data-oid="jm6dh3p" />
                  </SelectTrigger>
                  <SelectContent data-oid="cpm:5at">
                    <SelectItem value="22" data-oid="qc4w0:x">
                      People & Blogs
                    </SelectItem>
                    <SelectItem value="24" data-oid="r40lhup">
                      Entertainment
                    </SelectItem>
                    <SelectItem value="25" data-oid="hoo55q3">
                      News & Politics
                    </SelectItem>
                    <SelectItem value="26" data-oid=".-gy2:n">
                      Howto & Style
                    </SelectItem>
                    <SelectItem value="27" data-oid="jccck5a">
                      Education
                    </SelectItem>
                    <SelectItem value="28" data-oid="k58zpws">
                      Science & Technology
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Канал (только для Telegram) */}
            {selectedNetwork === "telegram" && (
              <div className="space-y-2" data-oid="9_2apzi">
                <Label data-oid="8wcvylv">{t("dialogs.export.channel")}</Label>
                <Input
                  placeholder={t("dialogs.export.enterChannelId")}
                  value={settings.channelId || ""}
                  onChange={(e) => onSettingsChange({ channelId: e.target.value })}
                  disabled={isRendering}
                  data-oid="7942k7b"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Прогресс загрузки */}
      {isRendering && renderProgress && (
        <Card data-oid="n128535">
          <CardContent className="pt-6" data-oid="s:d44zl">
            <div className="space-y-2" data-oid="hc5uu:4">
              <div className="flex items-center justify-between text-sm" data-oid="44ivrt:">
                <span data-oid="au9zokv">{t("dialogs.export.uploadProgress")}</span>
                <span data-oid="glaqir4">{Math.round(renderProgress.percentage)}%</span>
              </div>
              <Progress value={renderProgress.percentage} className="h-2" data-oid="ptshy4o" />
              {renderProgress.message && (
                <div className="text-xs text-muted-foreground" data-oid="bxj1w0z">
                  {renderProgress.message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Кнопки управления */}
      <div className="flex gap-2 pt-4 border-t" data-oid="jfdir1c">
        {isRendering ? (
          <>
            <Button variant="outline" onClick={onCancelExport} className="flex-1" data-oid=".uaimj1">
              {t("dialogs.export.cancel")}
            </Button>
            <Button disabled className="flex-1" data-oid="icem7.l">
              {t("dialogs.export.uploading")}...
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} className="flex-1" data-oid="ch8ftci">
              {t("dialogs.export.close")}
            </Button>
            <Button
              onClick={handleSocialExport}
              disabled={!hasProject || !loginStates[selectedNetwork]}
              className="flex-1 bg-[#00CCC0] hover:bg-[#00B8B0] text-black"
              data-testid="social-export-button"
              data-oid="z:84:s4"
            >
              <Upload className="h-4 w-4 mr-2" data-oid="-dnnqlr" />
              {t("dialogs.export.uploadTo", {
                platform: selectedNetworkData?.name,
              })}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

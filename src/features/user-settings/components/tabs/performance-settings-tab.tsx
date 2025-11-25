import { Info, Zap } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { GpuStatus } from "@/features/video-compiler/components/gpu-status"

import { useUserSettings } from "../../hooks/use-user-settings"

/**
 * Типы прокси-серверов
 */
const PROXY_TYPES = ["http", "https", "socks5"] as const
type ProxyType = (typeof PROXY_TYPES)[number]

/**
 * Вкладка настроек производительности
 * Содержит настройки GPU ускорения и прокси-сервера
 */
export function PerformanceSettingsTab() {
  const { t } = useTranslation()
  const {
    // GPU настройки
    gpuAccelerationEnabled = true,
    preferredGpuEncoder = "auto",

    // Прокси настройки
    proxyEnabled = false,
    proxyType = "http",
    proxyHost = "",
    proxyPort = "",
    proxyUsername = "",
    proxyPassword = "",

    // Дополнительные настройки производительности
    maxConcurrentJobs = 2,
    renderQuality = "high",
    backgroundRenderingEnabled = true,
    renderDelay = 5,

    // Настройки оптимизации Timeline
    timelineVirtualizationEnabled = true,
    timelineVirtualizationOverscan = 5,
    timelineClipDetailsThreshold = 50,

    // Методы обновления
    handleGpuAccelerationChange,
    handlePreferredGpuEncoderChange,
    handleProxyEnabledChange,
    handleProxyTypeChange,
    handleProxyHostChange,
    handleProxyPortChange,
    handleProxyUsernameChange,
    handleProxyPasswordChange,
    handleMaxConcurrentJobsChange,
    handleRenderQualityChange,
    handleBackgroundRenderingChange,
    handleRenderDelayChange,
    handleTimelineVirtualizationEnabledChange,
    handleTimelineVirtualizationOverscanChange,
    handleTimelineClipDetailsThresholdChange,
  } = useUserSettings()

  // Локальное состояние для управления видимостью пароля
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-6">
      {/* GPU Ускорение */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <Label className="text-base font-semibold">{t("dialogs.userSettings.performance.gpuAcceleration")}</Label>
          </div>
          <Switch checked={gpuAccelerationEnabled} onCheckedChange={handleGpuAccelerationChange} />
        </div>

        {gpuAccelerationEnabled && (
          <div className="ml-7 space-y-4">
            {/* Компонент статуса GPU */}
            <GpuStatus showDetails={true} />

            {/* Выбор предпочитаемого GPU кодировщика */}
            <div className="space-y-2">
              <Label className="text-sm">{t("dialogs.userSettings.performance.preferredGpuEncoder")}</Label>
              <Select value={preferredGpuEncoder} onValueChange={handlePreferredGpuEncoderChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("dialogs.userSettings.performance.selectEncoder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">{t("dialogs.userSettings.performance.encoderAuto")}</SelectItem>
                  <SelectItem value="nvidia">{t("dialogs.userSettings.performance.encoderNvidia")}</SelectItem>
                  <SelectItem value="amd">{t("dialogs.userSettings.performance.encoderAmd")}</SelectItem>
                  <SelectItem value="intel">{t("dialogs.userSettings.performance.encoderIntel")}</SelectItem>
                  <SelectItem value="apple">{t("dialogs.userSettings.performance.encoderApple")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Настройки рендеринга */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">{t("dialogs.userSettings.performance.renderingSettings")}</Label>

        {/* Качество рендеринга */}
        <div className="space-y-2">
          <Label className="text-sm">{t("dialogs.userSettings.performance.renderQuality")}</Label>
          <Select value={renderQuality} onValueChange={handleRenderQualityChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("dialogs.userSettings.performance.selectQuality")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{t("dialogs.userSettings.performance.qualityLow")}</SelectItem>
              <SelectItem value="medium">{t("dialogs.userSettings.performance.qualityMedium")}</SelectItem>
              <SelectItem value="high">{t("dialogs.userSettings.performance.qualityHigh")}</SelectItem>
              <SelectItem value="ultra">{t("dialogs.userSettings.performance.qualityUltra")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Фоновый рендеринг с предпросмотром */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm">{t("dialogs.userSettings.performance.backgroundRendering")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("dialogs.userSettings.performance.backgroundRenderingDesc")}
            </p>
          </div>
          <Switch checked={backgroundRenderingEnabled} onCheckedChange={handleBackgroundRenderingChange} />
        </div>

        {/* Задержка начала рендеринга */}
        {backgroundRenderingEnabled && (
          <div className="space-y-2 ml-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">{t("dialogs.userSettings.performance.renderDelay")}</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("dialogs.userSettings.performance.renderDelayTooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("dialogs.userSettings.performance.startAfter")}</span>
              <Input
                type="number"
                value={renderDelay}
                onChange={(e) => handleRenderDelayChange(Number(e.target.value))}
                className="w-20"
                min="1"
                max="60"
              />
              <span className="text-sm text-muted-foreground">{t("dialogs.userSettings.performance.seconds")}</span>
            </div>
          </div>
        )}

        {/* Максимальное количество параллельных задач */}
        <div className="space-y-2">
          <Label className="text-sm">{t("dialogs.userSettings.performance.maxConcurrentJobs")}</Label>
          <Select value={String(maxConcurrentJobs)} onValueChange={(v) => handleMaxConcurrentJobsChange(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 {t("dialogs.userSettings.performance.task")}</SelectItem>
              <SelectItem value="2">2 {t("dialogs.userSettings.performance.tasks")}</SelectItem>
              <SelectItem value="4">4 {t("dialogs.userSettings.performance.tasks")}</SelectItem>
              <SelectItem value="8">8 {t("dialogs.userSettings.performance.tasks")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Оптимизация Timeline */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-semibold">
            {t("dialogs.userSettings.performance.timelineOptimization")}
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("dialogs.userSettings.performance.timelineOptimizationDesc")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Виртуализация Timeline */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm">{t("dialogs.userSettings.performance.enableVirtualization")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("dialogs.userSettings.performance.enableVirtualizationDesc")}
            </p>
          </div>
          <Switch checked={timelineVirtualizationEnabled} onCheckedChange={handleTimelineVirtualizationEnabledChange} />
        </div>

        {timelineVirtualizationEnabled && (
          <div className="ml-4 space-y-4">
            {/* Overscan настройка */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm">{t("dialogs.userSettings.performance.overscanBuffer")}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("dialogs.userSettings.performance.overscanBufferTooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={timelineVirtualizationOverscan}
                  onChange={(e) => handleTimelineVirtualizationOverscanChange(Number(e.target.value))}
                  className="w-20"
                  min="1"
                  max="20"
                />
                <span className="text-sm text-muted-foreground">{t("dialogs.userSettings.performance.elements")}</span>
              </div>
            </div>

            {/* Порог показа деталей клипов */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm">{t("dialogs.userSettings.performance.clipDetailsThreshold")}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("dialogs.userSettings.performance.clipDetailsThresholdTooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={timelineClipDetailsThreshold}
                  onChange={(e) => handleTimelineClipDetailsThresholdChange(Number(e.target.value))}
                  className="w-20"
                  min="20"
                  max="200"
                  step="10"
                />
                <span className="text-sm text-muted-foreground">{t("dialogs.userSettings.performance.pixels")}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Прокси-сервер */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">{t("dialogs.userSettings.performance.proxyServer")}</Label>
          <Switch checked={proxyEnabled} onCheckedChange={handleProxyEnabledChange} />
        </div>

        {proxyEnabled && (
          <div className="space-y-4">
            {/* Тип прокси */}
            <div className="space-y-2">
              <Label className="text-sm">{t("dialogs.userSettings.performance.proxyType")}</Label>
              <Select value={proxyType} onValueChange={handleProxyTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("dialogs.userSettings.performance.selectProxyType")} />
                </SelectTrigger>
                <SelectContent>
                  {PROXY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Хост и порт */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-2">
                <Label className="text-sm">{t("dialogs.userSettings.performance.proxyHost")}</Label>
                <Input
                  value={proxyHost}
                  onChange={(e) => handleProxyHostChange(e.target.value)}
                  placeholder="proxy.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t("dialogs.userSettings.performance.proxyPort")}</Label>
                <Input
                  value={proxyPort}
                  onChange={(e) => handleProxyPortChange(e.target.value)}
                  placeholder="8080"
                  type="number"
                />
              </div>
            </div>

            {/* Аутентификация */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">{t("dialogs.userSettings.performance.proxyAuth")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-sm">{t("dialogs.userSettings.performance.username")}</Label>
                  <Input
                    value={proxyUsername}
                    onChange={(e) => handleProxyUsernameChange(e.target.value)}
                    placeholder={t("dialogs.userSettings.performance.usernamePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">{t("dialogs.userSettings.performance.password")}</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={proxyPassword}
                      onChange={(e) => handleProxyPasswordChange(e.target.value)}
                      placeholder={t("dialogs.userSettings.performance.passwordPlaceholder")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {showPassword
                        ? t("dialogs.userSettings.performance.hide")
                        : t("dialogs.userSettings.performance.show")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

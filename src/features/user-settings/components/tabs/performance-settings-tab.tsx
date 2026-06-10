import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Separator } from "@timeline-studio/ui/components/separator"
import { Switch } from "@timeline-studio/ui/components/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@timeline-studio/ui/components/tooltip"
import { Info, Zap } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
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
    <div className="space-y-6" data-oid="w2khsu5">
      {/* GPU Ускорение */}
      <div className="space-y-4" data-oid="3:usmz-">
        <div className="flex items-center justify-between" data-oid="f8.sim.">
          <div className="flex items-center gap-2" data-oid="gziu823">
            <Zap className="h-5 w-5 text-primary" data-oid="d_vcsc4" />
            <Label className="text-base font-semibold" data-oid="pydib7h">
              {t("dialogs.userSettings.performance.gpuAcceleration")}
            </Label>
          </div>
          <Switch checked={gpuAccelerationEnabled} onCheckedChange={handleGpuAccelerationChange} data-oid="my82n7-" />
        </div>

        {gpuAccelerationEnabled && (
          <div className="ml-7 space-y-4" data-oid="xqfvoqo">
            {/* Компонент статуса GPU */}
            <GpuStatus showDetails={true} data-oid="llfcucm" />

            {/* Выбор предпочитаемого GPU кодировщика */}
            <div className="space-y-2" data-oid="0z8w-l8">
              <Label className="text-sm" data-oid="nj9ivbu">
                {t("dialogs.userSettings.performance.preferredGpuEncoder")}
              </Label>
              <Select value={preferredGpuEncoder} onValueChange={handlePreferredGpuEncoderChange} data-oid="tx-1of6">
                <SelectTrigger className="w-full" data-oid="e4f.h8k">
                  <SelectValue placeholder={t("dialogs.userSettings.performance.selectEncoder")} data-oid="b4rhti0" />
                </SelectTrigger>
                <SelectContent data-oid="3:gln8j">
                  <SelectItem value="auto" data-oid="_rmvygc">
                    {t("dialogs.userSettings.performance.encoderAuto")}
                  </SelectItem>
                  <SelectItem value="nvidia" data-oid="m3r0.ir">
                    {t("dialogs.userSettings.performance.encoderNvidia")}
                  </SelectItem>
                  <SelectItem value="amd" data-oid="jxya278">
                    {t("dialogs.userSettings.performance.encoderAmd")}
                  </SelectItem>
                  <SelectItem value="intel" data-oid="yhg33b8">
                    {t("dialogs.userSettings.performance.encoderIntel")}
                  </SelectItem>
                  <SelectItem value="apple" data-oid="46dskiu">
                    {t("dialogs.userSettings.performance.encoderApple")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <Separator data-oid="auhgogq" />

      {/* Настройки рендеринга */}
      <div className="space-y-4" data-oid="8nqv:7v">
        <Label className="text-base font-semibold" data-oid="k3o9rcv">
          {t("dialogs.userSettings.performance.renderingSettings")}
        </Label>

        {/* Качество рендеринга */}
        <div className="space-y-2" data-oid="icg3jss">
          <Label className="text-sm" data-oid="aad:zu9">
            {t("dialogs.userSettings.performance.renderQuality")}
          </Label>
          <Select value={renderQuality} onValueChange={handleRenderQualityChange} data-oid="-4wg62r">
            <SelectTrigger data-oid="h6mpq.2">
              <SelectValue placeholder={t("dialogs.userSettings.performance.selectQuality")} data-oid="h1r-u3i" />
            </SelectTrigger>
            <SelectContent data-oid="z6v-_ra">
              <SelectItem value="low" data-oid="klmyp0n">
                {t("dialogs.userSettings.performance.qualityLow")}
              </SelectItem>
              <SelectItem value="medium" data-oid="ud:h0tt">
                {t("dialogs.userSettings.performance.qualityMedium")}
              </SelectItem>
              <SelectItem value="high" data-oid="fspeo7i">
                {t("dialogs.userSettings.performance.qualityHigh")}
              </SelectItem>
              <SelectItem value="ultra" data-oid="lw3fj0r">
                {t("dialogs.userSettings.performance.qualityUltra")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Фоновый рендеринг с предпросмотром */}
        <div className="flex items-center justify-between" data-oid="02h31fv">
          <div className="space-y-1" data-oid="8yg1q92">
            <Label className="text-sm" data-oid="5tu1k3d">
              {t("dialogs.userSettings.performance.backgroundRendering")}
            </Label>
            <p className="text-xs text-muted-foreground" data-oid="cq4d77c">
              {t("dialogs.userSettings.performance.backgroundRenderingDesc")}
            </p>
          </div>
          <Switch
            checked={backgroundRenderingEnabled}
            onCheckedChange={handleBackgroundRenderingChange}
            data-oid="6zllhly"
          />
        </div>

        {/* Задержка начала рендеринга */}
        {backgroundRenderingEnabled && (
          <div className="space-y-2 ml-4" data-oid="8u925xg">
            <div className="flex items-center gap-2" data-oid="2-s9376">
              <Label className="text-sm" data-oid="_7lyxko">
                {t("dialogs.userSettings.performance.renderDelay")}
              </Label>
              <TooltipProvider data-oid="ckkxyvh">
                <Tooltip data-oid="ly.07w1">
                  <TooltipTrigger data-oid="az.1gkj">
                    <Info className="h-4 w-4 text-muted-foreground" data-oid="rwii32m" />
                  </TooltipTrigger>
                  <TooltipContent data-oid="4efu8p3">
                    <p data-oid="2nxub7-">{t("dialogs.userSettings.performance.renderDelayTooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2" data-oid="y0:f8k2">
              <span className="text-sm text-muted-foreground" data-oid="2pk6ni6">
                {t("dialogs.userSettings.performance.startAfter")}
              </span>
              <Input
                type="number"
                value={renderDelay}
                onChange={(e) => handleRenderDelayChange(Number(e.target.value))}
                className="w-20"
                min="1"
                max="60"
                data-oid="bf1d2gu"
              />

              <span className="text-sm text-muted-foreground" data-oid="0n2p085">
                {t("dialogs.userSettings.performance.seconds")}
              </span>
            </div>
          </div>
        )}

        {/* Максимальное количество параллельных задач */}
        <div className="space-y-2" data-oid="i788gf5">
          <Label className="text-sm" data-oid="r916---">
            {t("dialogs.userSettings.performance.maxConcurrentJobs")}
          </Label>
          <Select
            value={String(maxConcurrentJobs)}
            onValueChange={(v) => handleMaxConcurrentJobsChange(Number(v))}
            data-oid="ylelk-y"
          >
            <SelectTrigger data-oid="ffjg2_i">
              <SelectValue data-oid="wxks3id" />
            </SelectTrigger>
            <SelectContent data-oid="aba:0mm">
              <SelectItem value="1" data-oid=".aaajc:">
                1 {t("dialogs.userSettings.performance.task")}
              </SelectItem>
              <SelectItem value="2" data-oid="-7lndpj">
                2 {t("dialogs.userSettings.performance.tasks")}
              </SelectItem>
              <SelectItem value="4" data-oid="g:z-w30">
                4 {t("dialogs.userSettings.performance.tasks")}
              </SelectItem>
              <SelectItem value="8" data-oid="pt5xhao">
                8 {t("dialogs.userSettings.performance.tasks")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator data-oid="6rg408_" />

      {/* Оптимизация Timeline */}
      <div className="space-y-4" data-oid="ih6z5iz">
        <div className="flex items-center gap-2" data-oid="fq3:_b6">
          <Label className="text-base font-semibold" data-oid="::p_srk">
            {t("dialogs.userSettings.performance.timelineOptimization")}
          </Label>
          <TooltipProvider data-oid="kc9rbkf">
            <Tooltip data-oid="kjaq3mw">
              <TooltipTrigger data-oid="fyygwhv">
                <Info className="h-4 w-4 text-muted-foreground" data-oid="m51phdn" />
              </TooltipTrigger>
              <TooltipContent data-oid="kjoq.63">
                <p data-oid="j2050an">{t("dialogs.userSettings.performance.timelineOptimizationDesc")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Виртуализация Timeline */}
        <div className="flex items-center justify-between" data-oid="b2q_ans">
          <div className="space-y-1" data-oid="4-vw5kg">
            <Label className="text-sm" data-oid="cyaypyy">
              {t("dialogs.userSettings.performance.enableVirtualization")}
            </Label>
            <p className="text-xs text-muted-foreground" data-oid="cf0wbx7">
              {t("dialogs.userSettings.performance.enableVirtualizationDesc")}
            </p>
          </div>
          <Switch
            checked={timelineVirtualizationEnabled}
            onCheckedChange={handleTimelineVirtualizationEnabledChange}
            data-oid="5_a55yn"
          />
        </div>

        {timelineVirtualizationEnabled && (
          <div className="ml-4 space-y-4" data-oid="6bwo953">
            {/* Overscan настройка */}
            <div className="space-y-2" data-oid="r1djjy3">
              <div className="flex items-center gap-2" data-oid="wr91e.f">
                <Label className="text-sm" data-oid="miezt6m">
                  {t("dialogs.userSettings.performance.overscanBuffer")}
                </Label>
                <TooltipProvider data-oid="fp8ciig">
                  <Tooltip data-oid="9rz5c3.">
                    <TooltipTrigger data-oid="il1yspv">
                      <Info className="h-4 w-4 text-muted-foreground" data-oid="m6rhn_y" />
                    </TooltipTrigger>
                    <TooltipContent data-oid="bh7uep4">
                      <p data-oid="y5q15mt">{t("dialogs.userSettings.performance.overscanBufferTooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2" data-oid="mmzhhez">
                <Input
                  type="number"
                  value={timelineVirtualizationOverscan}
                  onChange={(e) => handleTimelineVirtualizationOverscanChange(Number(e.target.value))}
                  className="w-20"
                  min="1"
                  max="20"
                  data-oid="j70pusp"
                />

                <span className="text-sm text-muted-foreground" data-oid="jc.hrcg">
                  {t("dialogs.userSettings.performance.elements")}
                </span>
              </div>
            </div>

            {/* Порог показа деталей клипов */}
            <div className="space-y-2" data-oid="31bm:nn">
              <div className="flex items-center gap-2" data-oid="a42:w2d">
                <Label className="text-sm" data-oid="xm3mcym">
                  {t("dialogs.userSettings.performance.clipDetailsThreshold")}
                </Label>
                <TooltipProvider data-oid="blwwopl">
                  <Tooltip data-oid="4f_c8s9">
                    <TooltipTrigger data-oid="p.x0sv4">
                      <Info className="h-4 w-4 text-muted-foreground" data-oid="n-u:ea0" />
                    </TooltipTrigger>
                    <TooltipContent data-oid="mqz6s.:">
                      <p data-oid="cv1b1w7">{t("dialogs.userSettings.performance.clipDetailsThresholdTooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2" data-oid="v4ry4id">
                <Input
                  type="number"
                  value={timelineClipDetailsThreshold}
                  onChange={(e) => handleTimelineClipDetailsThresholdChange(Number(e.target.value))}
                  className="w-20"
                  min="20"
                  max="200"
                  step="10"
                  data-oid="w83-yyo"
                />

                <span className="text-sm text-muted-foreground" data-oid="py.b5zb">
                  {t("dialogs.userSettings.performance.pixels")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator data-oid="dvx.ye." />

      {/* Прокси-сервер */}
      <div className="space-y-4" data-oid="vf3udzb">
        <div className="flex items-center justify-between" data-oid="is2bk6f">
          <Label className="text-base font-semibold" data-oid="80vqd9g">
            {t("dialogs.userSettings.performance.proxyServer")}
          </Label>
          <Switch checked={proxyEnabled} onCheckedChange={handleProxyEnabledChange} data-oid="oam4t9f" />
        </div>

        {proxyEnabled && (
          <div className="space-y-4" data-oid="vy7zb:z">
            {/* Тип прокси */}
            <div className="space-y-2" data-oid="l.e.:yh">
              <Label className="text-sm" data-oid="5bbi1dh">
                {t("dialogs.userSettings.performance.proxyType")}
              </Label>
              <Select value={proxyType} onValueChange={handleProxyTypeChange} data-oid="36s8zk3">
                <SelectTrigger data-oid="wv:qkcg">
                  <SelectValue placeholder={t("dialogs.userSettings.performance.selectProxyType")} data-oid="u98x.pf" />
                </SelectTrigger>
                <SelectContent data-oid="t__swt:">
                  {PROXY_TYPES.map((type) => (
                    <SelectItem key={type} value={type} data-oid="o-0:-3_">
                      {type.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Хост и порт */}
            <div className="grid grid-cols-3 gap-2" data-oid="jqeizbf">
              <div className="col-span-2 space-y-2" data-oid="g:3ucti">
                <Label className="text-sm" data-oid="n7n.iux">
                  {t("dialogs.userSettings.performance.proxyHost")}
                </Label>
                <Input
                  value={proxyHost}
                  onChange={(e) => handleProxyHostChange(e.target.value)}
                  placeholder="proxy.example.com"
                  data-oid="ihe2-gj"
                />
              </div>
              <div className="space-y-2" data-oid=":g8zuo.">
                <Label className="text-sm" data-oid="hp3:-pc">
                  {t("dialogs.userSettings.performance.proxyPort")}
                </Label>
                <Input
                  value={proxyPort}
                  onChange={(e) => handleProxyPortChange(e.target.value)}
                  placeholder="8080"
                  type="number"
                  data-oid="v8poawg"
                />
              </div>
            </div>

            {/* Аутентификация */}
            <div className="space-y-4" data-oid=".wnx4cr">
              <Label className="text-sm font-medium" data-oid="zf0b9xl">
                {t("dialogs.userSettings.performance.proxyAuth")}
              </Label>
              <div className="grid grid-cols-2 gap-2" data-oid="qcpi49j">
                <div className="space-y-2" data-oid="wn5:le1">
                  <Label className="text-sm" data-oid="fy3yewd">
                    {t("dialogs.userSettings.performance.username")}
                  </Label>
                  <Input
                    value={proxyUsername}
                    onChange={(e) => handleProxyUsernameChange(e.target.value)}
                    placeholder={t("dialogs.userSettings.performance.usernamePlaceholder")}
                    data-oid="aj_ajk4"
                  />
                </div>
                <div className="space-y-2" data-oid="zopqmt1">
                  <Label className="text-sm" data-oid="du2r9:u">
                    {t("dialogs.userSettings.performance.password")}
                  </Label>
                  <div className="relative" data-oid="9b7s.v5">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={proxyPassword}
                      onChange={(e) => handleProxyPasswordChange(e.target.value)}
                      placeholder={t("dialogs.userSettings.performance.passwordPlaceholder")}
                      data-oid="98lv8xl"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
                      data-oid="zex:pz_"
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

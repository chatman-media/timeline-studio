/**
 * Компонент настроек экспорта переходов
 * Интегрируется с основным экспорт модалом
 */

import { AlertTriangle, CheckCircle, Cpu, Settings, Zap } from "lucide-react"
import { useId } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@timeline-studio/ui/components/collapsible"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Separator } from "@timeline-studio/ui/components/separator"
import { Slider } from "@timeline-studio/ui/components/slider"
import { Switch } from "@timeline-studio/ui/components/switch"
import type { TimelineProject } from "@/features/timeline/types"
import { cn } from "@/lib/utils"

import { useTransitionExport } from "../hooks/use-transition-export"
import type { TransitionExportSettings } from "../types/transition-export-types"

interface TransitionExportSettingsProps {
  settings: TransitionExportSettings
  onSettingsChange: (settings: Partial<TransitionExportSettings>) => void
  project?: TimelineProject
  className?: string
}

export function TransitionExportSettingsComponent({
  settings,
  onSettingsChange,
  project,
  className,
}: TransitionExportSettingsProps) {
  const { t } = useTranslation()
  const { hasTransitions, getTransitionInfo } = useTransitionExport()
  const id = useId()

  // Информация о переходах в проекте
  // TODO: availableTransitions должны быть переданы из родительского компонента
  const availableTransitions = new Map()
  const transitionInfo = project ? getTransitionInfo(project, availableTransitions) : null
  const hasProjectTransitions = project ? hasTransitions(project) : false

  // Обработчики изменений
  const handleSwitchChange = (field: keyof TransitionExportSettings) => (checked: boolean) => {
    onSettingsChange({ [field]: checked })
  }

  const handleSelectChange = (field: keyof TransitionExportSettings) => (value: string) => {
    onSettingsChange({ [field]: value })
  }

  const handleSliderChange = (field: keyof TransitionExportSettings) => (value: number[]) => {
    onSettingsChange({ [field]: value[0] })
  }

  // Получение рекомендуемых настроек
  const getRecommendedSettings = () => {
    if (!transitionInfo) return null

    const isComplexProject = transitionInfo.complexity > 20
    const hasGPUTransitions = transitionInfo.gpuAccelerated > 0

    return {
      transitionQuality: (isComplexProject ? "high" : "medium") as "high" | "medium",
      transitionRenderMode: (hasGPUTransitions ? "gpu" : "auto") as "gpu" | "auto",
      optimizeTransitions: true,
      parallelTransitionProcessing: transitionInfo.totalTransitions > 5,
      maxConcurrentTransitions: Math.min(4, Math.max(1, Math.floor(transitionInfo.totalTransitions / 3))),
    } as Partial<TransitionExportSettings>
  }

  const applyRecommendedSettings = () => {
    const recommended = getRecommendedSettings()
    if (recommended) {
      onSettingsChange(recommended)
    }
  }

  return (
    <div className={cn("space-y-6", className)} data-oid="nsvopo6">
      {/* Статус переходов */}
      <Card data-oid="bc3r:td">
        <CardHeader className="pb-3" data-oid="5bxqb:b">
          <CardTitle className="flex items-center gap-2 text-sm" data-oid="qqzo28k">
            {hasProjectTransitions ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" data-oid="ls.2ovj" />
                {t("export.transitions.statusFound")}
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-yellow-500" data-oid="tddkw:u" />
                {t("export.transitions.statusNotFound")}
              </>
            )}
          </CardTitle>
        </CardHeader>

        {hasProjectTransitions && transitionInfo && (
          <CardContent className="pt-0" data-oid="2cuh6y5">
            <div className="grid grid-cols-2 gap-4 text-sm" data-oid="5fhoss_">
              <div data-oid="g0tv8n.">
                <span className="text-muted-foreground" data-oid="u6ly6h4">
                  {t("export.transitions.totalCount")}:
                </span>
                <Badge variant="secondary" className="ml-2" data-oid="pw9qk6b">
                  {transitionInfo.totalTransitions}
                </Badge>
              </div>
              <div data-oid="x2w-y3f">
                <span className="text-muted-foreground" data-oid="-3eb6xj">
                  {t("export.transitions.gpuAccelerated")}:
                </span>
                <Badge variant="secondary" className="ml-2" data-oid="gvgmz44">
                  {transitionInfo.gpuAccelerated}
                </Badge>
              </div>
              <div data-oid="zibtkqa">
                <span className="text-muted-foreground" data-oid="llbpgk5">
                  {t("export.transitions.estimatedTime")}:
                </span>
                <Badge variant="secondary" className="ml-2" data-oid="588mkio">
                  {Math.round(transitionInfo.estimatedTime)}s
                </Badge>
              </div>
              <div data-oid="wxt7w83">
                <span className="text-muted-foreground" data-oid="oyth06d">
                  {t("export.transitions.complexity")}:
                </span>
                <Badge
                  variant={
                    transitionInfo.complexity > 20
                      ? "destructive"
                      : transitionInfo.complexity > 10
                        ? "default"
                        : "secondary"
                  }
                  className="ml-2"
                  data-oid="65i6mxn"
                >
                  {transitionInfo.complexity > 20
                    ? t("export.transitions.complexityHigh")
                    : transitionInfo.complexity > 10
                      ? t("export.transitions.complexityMedium")
                      : t("export.transitions.complexityLow")}
                </Badge>
              </div>
            </div>

            {/* Рекомендуемые настройки */}
            {getRecommendedSettings() && (
              <div className="mt-4 pt-4 border-t" data-oid="n8d9wsa">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyRecommendedSettings}
                  className="w-full"
                  data-oid="uotmklr"
                >
                  <Zap className="h-4 w-4 mr-2" data-oid="ef50-0s" />
                  {t("export.transitions.applyRecommended")}
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Основные настройки */}
      <div className="space-y-4" data-oid="6nxp9w9">
        {/* Включить экспорт переходов */}
        <div className="flex items-center justify-between" data-oid="a::is1s">
          <Label htmlFor={`${id}-include-transitions`} className="text-sm font-medium" data-oid="y8c6s_k">
            {t("export.transitions.includeTransitions")}
          </Label>
          <Switch
            id={`${id}-include-transitions`}
            checked={settings.includeTransitions ?? true}
            onCheckedChange={handleSwitchChange("includeTransitions")}
            disabled={!hasProjectTransitions}
            data-oid="i_:t5tz"
          />
        </div>

        {/* Настройки переходов (показываем только если переходы включены) */}
        {settings.includeTransitions !== false && hasProjectTransitions && (
          <div className="space-y-4 pl-4 border-l-2 border-muted" data-oid="8c92p6n">
            {/* Качество переходов */}
            <div className="space-y-2" data-oid="5xcm.tp">
              <Label className="text-sm" data-oid="srxcc_2">
                {t("export.transitions.quality")}
              </Label>
              <Select
                value={settings.transitionQuality || "medium"}
                onValueChange={handleSelectChange("transitionQuality")}
                data-oid="ul05ym2"
              >
                <SelectTrigger data-oid="752k60d">
                  <SelectValue data-oid="ebualov" />
                </SelectTrigger>
                <SelectContent data-oid="2ep3.:j">
                  <SelectItem value="low" data-oid="5aa6oq3">
                    <div className="flex items-center gap-2" data-oid="frkytgn">
                      <span data-oid="jl99bzv">{t("export.transitions.qualityLow")}</span>
                      <Badge variant="outline" className="text-xs" data-oid="pc.9cod">
                        {t("export.transitions.fast")}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium" data-oid="tkez1wn">
                    <div className="flex items-center gap-2" data-oid="s1a0-ta">
                      <span data-oid=".yby_63">{t("export.transitions.qualityMedium")}</span>
                      <Badge variant="outline" className="text-xs" data-oid="vt-0yva">
                        {t("export.transitions.balanced")}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="high" data-oid="5f7jo2k">
                    <div className="flex items-center gap-2" data-oid="n4k6nr4">
                      <span data-oid="ts6ipev">{t("export.transitions.qualityHigh")}</span>
                      <Badge variant="outline" className="text-xs" data-oid="d35-7uf">
                        {t("export.transitions.slower")}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="maximum" data-oid="8ywmpeo">
                    <div className="flex items-center gap-2" data-oid="gatf:v4">
                      <span data-oid="p-ytwxu">{t("export.transitions.qualityMaximum")}</span>
                      <Badge variant="outline" className="text-xs" data-oid="66686j.">
                        {t("export.transitions.slowest")}
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Режим рендеринга */}
            <div className="space-y-2" data-oid="09i2x-n">
              <Label className="text-sm" data-oid="8nwvhdb">
                {t("export.transitions.renderMode")}
              </Label>
              <Select
                value={settings.transitionRenderMode || "auto"}
                onValueChange={handleSelectChange("transitionRenderMode")}
                data-oid="6yz2tit"
              >
                <SelectTrigger data-oid="v9axvuo">
                  <SelectValue data-oid="d:9qv9v" />
                </SelectTrigger>
                <SelectContent data-oid="1_9bypp">
                  <SelectItem value="software" data-oid="yroeyo8">
                    <div className="flex items-center gap-2" data-oid="a8hklem">
                      <Cpu className="h-4 w-4" data-oid="agv41kv" />
                      <span data-oid="gg8ar8z">{t("export.transitions.renderModeSoftware")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="gpu" data-oid="4o_6dz.">
                    <div className="flex items-center gap-2" data-oid="ba-.q_7">
                      <Zap className="h-4 w-4" data-oid="x0r7t94" />
                      <span data-oid="tfvgk.u">{t("export.transitions.renderModeGPU")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="auto" data-oid="o60f38o">
                    <div className="flex items-center gap-2" data-oid="785gvwd">
                      <Settings className="h-4 w-4" data-oid="98:t091" />
                      <span data-oid="a.-47jd">{t("export.transitions.renderModeAuto")}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Оптимизация переходов */}
            <div className="flex items-center justify-between" data-oid="s5gkidh">
              <Label htmlFor={`${id}-optimize-transitions`} className="text-sm" data-oid="6gr:cxj">
                {t("export.transitions.optimizeTransitions")}
              </Label>
              <Switch
                id={`${id}-optimize-transitions`}
                checked={settings.optimizeTransitions ?? true}
                onCheckedChange={handleSwitchChange("optimizeTransitions")}
                data-oid="m_1l_ir"
              />
            </div>
          </div>
        )}
      </div>

      <Separator data-oid="kufn0bq" />

      {/* Расширенные настройки производительности */}
      <Collapsible data-oid="u6txk:e">
        <CollapsibleTrigger asChild data-oid="x.ay55x">
          <Button variant="outline" className="w-full justify-between" data-oid="gbviknb">
            <span className="flex items-center gap-2" data-oid="jju4s49">
              <Settings className="h-4 w-4" data-oid=".l_ox2u" />
              {t("export.transitions.advancedSettings")}
            </span>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4 mt-4" data-oid="erm6xil">
          {/* Размер кэша */}
          <div className="space-y-2" data-oid="h5b.8wt">
            <div className="flex items-center justify-between" data-oid="8h9:aka">
              <Label className="text-sm" data-oid="_wvp07r">
                {t("export.transitions.cacheSize")}
              </Label>
              <span className="text-sm text-muted-foreground" data-oid="1kwshv5">
                {settings.transitionCacheSize || 500} MB
              </span>
            </div>
            <Slider
              value={[settings.transitionCacheSize || 500]}
              onValueChange={handleSliderChange("transitionCacheSize")}
              max={2000}
              min={100}
              step={100}
              className="w-full"
              data-oid="i:a-blb"
            />
          </div>

          {/* Параллельная обработка */}
          <div className="flex items-center justify-between" data-oid="wu1kpt7">
            <Label htmlFor={`${id}-parallel-processing`} className="text-sm" data-oid="x186dvr">
              {t("export.transitions.parallelProcessing")}
            </Label>
            <Switch
              id={`${id}-parallel-processing`}
              checked={settings.parallelTransitionProcessing ?? true}
              onCheckedChange={handleSwitchChange("parallelTransitionProcessing")}
              data-oid="83f_w2_"
            />
          </div>

          {/* Максимальное количество параллельных переходов */}
          {settings.parallelTransitionProcessing !== false && (
            <div className="space-y-2" data-oid="6.72xwo">
              <div className="flex items-center justify-between" data-oid="m7r_svz">
                <Label className="text-sm" data-oid="wd6tqk:">
                  {t("export.transitions.maxConcurrent")}
                </Label>
                <span className="text-sm text-muted-foreground" data-oid="i0.-w3x">
                  {settings.maxConcurrentTransitions || 4}
                </span>
              </div>
              <Slider
                value={[settings.maxConcurrentTransitions || 4]}
                onValueChange={handleSliderChange("maxConcurrentTransitions")}
                max={8}
                min={1}
                step={1}
                className="w-full"
                data-oid=":voheqv"
              />
            </div>
          )}

          {/* Fallback опции */}
          <div className="flex items-center justify-between" data-oid="s6z9r:1">
            <Label htmlFor={`${id}-fallback-basic`} className="text-sm" data-oid="ij6aj3t">
              {t("export.transitions.fallbackToBasic")}
            </Label>
            <Switch
              id={`${id}-fallback-basic`}
              checked={settings.fallbackToBasicTransitions ?? true}
              onCheckedChange={handleSwitchChange("fallbackToBasicTransitions")}
              data-oid="4qouati"
            />
          </div>

          {/* Экспорт метаданных */}
          <div className="flex items-center justify-between" data-oid="nx2g.4m">
            <Label htmlFor={`${id}-export-metadata`} className="text-sm" data-oid="5tk94my">
              {t("export.transitions.exportMetadata")}
            </Label>
            <Switch
              id={`${id}-export-metadata`}
              checked={settings.exportTransitionMetadata ?? false}
              onCheckedChange={handleSwitchChange("exportTransitionMetadata")}
              data-oid="b33bdcu"
            />
          </div>

          {/* Отладка */}
          <div className="flex items-center justify-between" data-oid="gh:8ebv">
            <Label htmlFor={`${id}-debug-transitions`} className="text-sm" data-oid="hnsqjo6">
              {t("export.transitions.debugMode")}
            </Label>
            <Switch
              id={`${id}-debug-transitions`}
              checked={settings.debugTransitions ?? false}
              onCheckedChange={handleSwitchChange("debugTransitions")}
              data-oid="vjlplwn"
            />
          </div>

          {/* Логирование времени */}
          <div className="flex items-center justify-between" data-oid="wu.6e62">
            <Label htmlFor={`${id}-log-timing`} className="text-sm" data-oid="5nwvmup">
              {t("export.transitions.logTiming")}
            </Label>
            <Switch
              id={`${id}-log-timing`}
              checked={settings.logTransitionTiming ?? false}
              onCheckedChange={handleSwitchChange("logTransitionTiming")}
              data-oid="6cl4i4v"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

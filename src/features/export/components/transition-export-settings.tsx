/**
 * Компонент настроек экспорта переходов
 * Интегрируется с основным экспорт модалом
 */

import { AlertTriangle, CheckCircle, Cpu, Settings, Zap } from "lucide-react"
import { useId } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
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
    <div className={cn("space-y-6", className)}>
      {/* Статус переходов */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            {hasProjectTransitions ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                {t("export.transitions.statusFound")}
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                {t("export.transitions.statusNotFound")}
              </>
            )}
          </CardTitle>
        </CardHeader>

        {hasProjectTransitions && transitionInfo && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t("export.transitions.totalCount")}:</span>
                <Badge variant="secondary" className="ml-2">
                  {transitionInfo.totalTransitions}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">{t("export.transitions.gpuAccelerated")}:</span>
                <Badge variant="secondary" className="ml-2">
                  {transitionInfo.gpuAccelerated}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">{t("export.transitions.estimatedTime")}:</span>
                <Badge variant="secondary" className="ml-2">
                  {Math.round(transitionInfo.estimatedTime)}s
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">{t("export.transitions.complexity")}:</span>
                <Badge
                  variant={
                    transitionInfo.complexity > 20
                      ? "destructive"
                      : transitionInfo.complexity > 10
                        ? "default"
                        : "secondary"
                  }
                  className="ml-2"
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
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={applyRecommendedSettings} className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  {t("export.transitions.applyRecommended")}
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Основные настройки */}
      <div className="space-y-4">
        {/* Включить экспорт переходов */}
        <div className="flex items-center justify-between">
          <Label htmlFor={`${id}-include-transitions`} className="text-sm font-medium">
            {t("export.transitions.includeTransitions")}
          </Label>
          <Switch
            id={`${id}-include-transitions`}
            checked={settings.includeTransitions ?? true}
            onCheckedChange={handleSwitchChange("includeTransitions")}
            disabled={!hasProjectTransitions}
          />
        </div>

        {/* Настройки переходов (показываем только если переходы включены) */}
        {settings.includeTransitions !== false && hasProjectTransitions && (
          <div className="space-y-4 pl-4 border-l-2 border-muted">
            {/* Качество переходов */}
            <div className="space-y-2">
              <Label className="text-sm">{t("export.transitions.quality")}</Label>
              <Select
                value={settings.transitionQuality || "medium"}
                onValueChange={handleSelectChange("transitionQuality")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <span>{t("export.transitions.qualityLow")}</span>
                      <Badge variant="outline" className="text-xs">
                        {t("export.transitions.fast")}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <span>{t("export.transitions.qualityMedium")}</span>
                      <Badge variant="outline" className="text-xs">
                        {t("export.transitions.balanced")}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <span>{t("export.transitions.qualityHigh")}</span>
                      <Badge variant="outline" className="text-xs">
                        {t("export.transitions.slower")}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="maximum">
                    <div className="flex items-center gap-2">
                      <span>{t("export.transitions.qualityMaximum")}</span>
                      <Badge variant="outline" className="text-xs">
                        {t("export.transitions.slowest")}
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Режим рендеринга */}
            <div className="space-y-2">
              <Label className="text-sm">{t("export.transitions.renderMode")}</Label>
              <Select
                value={settings.transitionRenderMode || "auto"}
                onValueChange={handleSelectChange("transitionRenderMode")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="software">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      <span>{t("export.transitions.renderModeSoftware")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="gpu">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <span>{t("export.transitions.renderModeGPU")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="auto">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>{t("export.transitions.renderModeAuto")}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Оптимизация переходов */}
            <div className="flex items-center justify-between">
              <Label htmlFor={`${id}-optimize-transitions`} className="text-sm">
                {t("export.transitions.optimizeTransitions")}
              </Label>
              <Switch
                id={`${id}-optimize-transitions`}
                checked={settings.optimizeTransitions ?? true}
                onCheckedChange={handleSwitchChange("optimizeTransitions")}
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Расширенные настройки производительности */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t("export.transitions.advancedSettings")}
            </span>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4 mt-4">
          {/* Размер кэша */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">{t("export.transitions.cacheSize")}</Label>
              <span className="text-sm text-muted-foreground">{settings.transitionCacheSize || 500} MB</span>
            </div>
            <Slider
              value={[settings.transitionCacheSize || 500]}
              onValueChange={handleSliderChange("transitionCacheSize")}
              max={2000}
              min={100}
              step={100}
              className="w-full"
            />
          </div>

          {/* Параллельная обработка */}
          <div className="flex items-center justify-between">
            <Label htmlFor={`${id}-parallel-processing`} className="text-sm">
              {t("export.transitions.parallelProcessing")}
            </Label>
            <Switch
              id={`${id}-parallel-processing`}
              checked={settings.parallelTransitionProcessing ?? true}
              onCheckedChange={handleSwitchChange("parallelTransitionProcessing")}
            />
          </div>

          {/* Максимальное количество параллельных переходов */}
          {settings.parallelTransitionProcessing !== false && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t("export.transitions.maxConcurrent")}</Label>
                <span className="text-sm text-muted-foreground">{settings.maxConcurrentTransitions || 4}</span>
              </div>
              <Slider
                value={[settings.maxConcurrentTransitions || 4]}
                onValueChange={handleSliderChange("maxConcurrentTransitions")}
                max={8}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          )}

          {/* Fallback опции */}
          <div className="flex items-center justify-between">
            <Label htmlFor={`${id}-fallback-basic`} className="text-sm">
              {t("export.transitions.fallbackToBasic")}
            </Label>
            <Switch
              id={`${id}-fallback-basic`}
              checked={settings.fallbackToBasicTransitions ?? true}
              onCheckedChange={handleSwitchChange("fallbackToBasicTransitions")}
            />
          </div>

          {/* Экспорт метаданных */}
          <div className="flex items-center justify-between">
            <Label htmlFor={`${id}-export-metadata`} className="text-sm">
              {t("export.transitions.exportMetadata")}
            </Label>
            <Switch
              id={`${id}-export-metadata`}
              checked={settings.exportTransitionMetadata ?? false}
              onCheckedChange={handleSwitchChange("exportTransitionMetadata")}
            />
          </div>

          {/* Отладка */}
          <div className="flex items-center justify-between">
            <Label htmlFor={`${id}-debug-transitions`} className="text-sm">
              {t("export.transitions.debugMode")}
            </Label>
            <Switch
              id={`${id}-debug-transitions`}
              checked={settings.debugTransitions ?? false}
              onCheckedChange={handleSwitchChange("debugTransitions")}
            />
          </div>

          {/* Логирование времени */}
          <div className="flex items-center justify-between">
            <Label htmlFor={`${id}-log-timing`} className="text-sm">
              {t("export.transitions.logTiming")}
            </Label>
            <Switch
              id={`${id}-log-timing`}
              checked={settings.logTransitionTiming ?? false}
              onCheckedChange={handleSwitchChange("logTransitionTiming")}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

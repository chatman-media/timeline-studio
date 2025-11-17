import { Activity, BarChart3, CircleDot, Settings } from "lucide-react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useColorGrading } from "../../services/color-grading-provider"
import { ScopeViewer } from "./scope-viewer"

type ScopeType = "waveform" | "vectorscope" | "histogram"

export function ScopesSection() {
  const { t } = useTranslation()
  const { state, dispatch } = useColorGrading()
  const [activeScope, setActiveScope] = useState<ScopeType>("waveform")
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Обработчик переключения типа скопа
  const handleScopeChange = useCallback((scopeType: ScopeType) => {
    setActiveScope(scopeType)
  }, [])

  // Обработчик частоты обновления
  const handleRefreshRateChange = useCallback(
    (value: string) => {
      dispatch({
        type: "SET_SCOPE_REFRESH_RATE",
        value: Number(value),
      })
    },
    [dispatch],
  )

  // Обработчик переключения скопов
  const handleToggleScope = useCallback(
    (scopeType: ScopeType, enabled: boolean) => {
      dispatch({
        type: "TOGGLE_SCOPE",
        scopeType,
        enabled,
      })
    },
    [dispatch],
  )

  // Переключение полноэкранного режима
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  return (
    <div className="space-y-4" data-testid="scopes-section">
      {/* Заголовок секции */}
      <div className="text-sm text-muted-foreground">
        {t("colorGrading.scopes.description", "Real-time analysis of color and exposure")}
      </div>

      {/* Управление скопами */}
      <div className="space-y-3">
        {/* Waveform переключатель */}
        <div className="flex items-center justify-between">
          <Label htmlFor="waveform-enable" className="text-sm flex items-center gap-2 text-foreground">
            <Activity className="h-4 w-4" />
            {t("colorGrading.scopes.waveform", "Waveform")}
          </Label>
          <Switch
            checked={state.scopes.waveformEnabled}
            onCheckedChange={(checked) => handleToggleScope("waveform", checked)}
          />
        </div>

        {/* Vectorscope переключатель */}
        <div className="flex items-center justify-between">
          <Label htmlFor="vectorscope-enable" className="text-sm flex items-center gap-2 text-foreground">
            <CircleDot className="h-4 w-4" />
            {t("colorGrading.scopes.vectorscope", "Vectorscope")}
          </Label>
          <Switch
            checked={state.scopes.vectorscopeEnabled}
            onCheckedChange={(checked) => handleToggleScope("vectorscope", checked)}
          />
        </div>

        {/* Histogram переключатель */}
        <div className="flex items-center justify-between">
          <Label htmlFor="histogram-enable" className="text-sm flex items-center gap-2 text-foreground">
            <BarChart3 className="h-4 w-4" />
            {t("colorGrading.scopes.histogram", "Histogram")}
          </Label>
          <Switch
            checked={state.scopes.histogramEnabled}
            onCheckedChange={(checked) => handleToggleScope("histogram", checked)}
          />
        </div>
      </div>

      {/* Настройки частоты обновления */}
      <div className="space-y-2">
        <Label className="text-sm text-foreground/90">{t("colorGrading.scopes.refreshRate", "Refresh Rate")}</Label>
        <Select value={state.scopes.refreshRate.toString()} onValueChange={handleRefreshRateChange}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 FPS</SelectItem>
            <SelectItem value="30">30 FPS</SelectItem>
            <SelectItem value="60">60 FPS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Отображение скопов */}
      {(state.scopes.waveformEnabled || state.scopes.vectorscopeEnabled || state.scopes.histogramEnabled) && (
        <div className="mt-4 space-y-4">
          {/* Переключатель типов скопов */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {state.scopes.waveformEnabled && (
                <Button
                  variant={activeScope === "waveform" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleScopeChange("waveform")}
                  className="h-7"
                >
                  <Activity className="h-4 w-4 mr-1" />
                  {t("colorGrading.scopes.waveform", "Waveform")}
                </Button>
              )}
              {state.scopes.vectorscopeEnabled && (
                <Button
                  variant={activeScope === "vectorscope" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleScopeChange("vectorscope")}
                  className="h-7"
                >
                  <CircleDot className="h-4 w-4 mr-1" />
                  {t("colorGrading.scopes.vectorscope", "Vectorscope")}
                </Button>
              )}
              {state.scopes.histogramEnabled && (
                <Button
                  variant={activeScope === "histogram" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleScopeChange("histogram")}
                  className="h-7"
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  {t("colorGrading.scopes.histogram", "Histogram")}
                </Button>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="h-7">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Viewer для активного скопа */}
          <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-black/95 p-8" : ""}`}>
            <ScopeViewer
              type={activeScope}
              refreshRate={state.scopes.refreshRate}
              isFullscreen={isFullscreen}
              onClose={isFullscreen ? toggleFullscreen : undefined}
            />
          </div>

          {/* Подсказки для скопов */}
          <div className="text-xs text-muted-foreground/70 mt-2">
            {activeScope === "waveform" &&
              t("colorGrading.scopes.waveformHint", "Shows luminance distribution across the image")}
            {activeScope === "vectorscope" &&
              t("colorGrading.scopes.vectorscopeHint", "Shows color saturation and hue distribution")}
            {activeScope === "histogram" &&
              t("colorGrading.scopes.histogramHint", "Shows tonal distribution for RGB channels")}
          </div>
        </div>
      )}
    </div>
  )
}

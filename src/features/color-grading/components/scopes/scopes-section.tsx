import { Activity, BarChart3, CircleDot, Settings } from "lucide-react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@timeline-studio/ui/components/button"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Switch } from "@timeline-studio/ui/components/switch"
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
    <div className="space-y-4" data-testid="scopes-section" data-oid="a.6qrzi">
      {/* Заголовок секции */}
      <div className="text-sm text-muted-foreground" data-oid="-:d35iy">
        {t("colorGrading.scopes.description", "Real-time analysis of color and exposure")}
      </div>

      {/* Управление скопами */}
      <div className="space-y-3" data-oid="npqstnq">
        {/* Waveform переключатель */}
        <div className="flex items-center justify-between" data-oid="92w9tzw">
          <Label
            htmlFor="waveform-enable"
            className="text-sm flex items-center gap-2 text-foreground"
            data-oid="xflww6f"
          >
            <Activity className="h-4 w-4" data-oid="0ukr:jl" />
            {t("colorGrading.scopes.waveform", "Waveform")}
          </Label>
          <Switch
            checked={state.scopes.waveformEnabled}
            onCheckedChange={(checked) => handleToggleScope("waveform", checked)}
            data-oid="ogmokal"
          />
        </div>

        {/* Vectorscope переключатель */}
        <div className="flex items-center justify-between" data-oid="tlqo4.k">
          <Label
            htmlFor="vectorscope-enable"
            className="text-sm flex items-center gap-2 text-foreground"
            data-oid="hyh.:z7"
          >
            <CircleDot className="h-4 w-4" data-oid="qksdr_x" />
            {t("colorGrading.scopes.vectorscope", "Vectorscope")}
          </Label>
          <Switch
            checked={state.scopes.vectorscopeEnabled}
            onCheckedChange={(checked) => handleToggleScope("vectorscope", checked)}
            data-oid="attnegk"
          />
        </div>

        {/* Histogram переключатель */}
        <div className="flex items-center justify-between" data-oid="ois_82o">
          <Label
            htmlFor="histogram-enable"
            className="text-sm flex items-center gap-2 text-foreground"
            data-oid="pc8.q78"
          >
            <BarChart3 className="h-4 w-4" data-oid="1pn-xne" />
            {t("colorGrading.scopes.histogram", "Histogram")}
          </Label>
          <Switch
            checked={state.scopes.histogramEnabled}
            onCheckedChange={(checked) => handleToggleScope("histogram", checked)}
            data-oid="yra6le6"
          />
        </div>
      </div>

      {/* Настройки частоты обновления */}
      <div className="space-y-2" data-oid="y:xll8r">
        <Label className="text-sm text-foreground/90" data-oid="9nokqrf">
          {t("colorGrading.scopes.refreshRate", "Refresh Rate")}
        </Label>
        <Select value={state.scopes.refreshRate.toString()} onValueChange={handleRefreshRateChange} data-oid="kz57no_">
          <SelectTrigger className="h-8" data-oid="57-1rlg">
            <SelectValue data-oid="d848le_" />
          </SelectTrigger>
          <SelectContent data-oid="8nhdd_2">
            <SelectItem value="15" data-oid="qr10cpl">
              15 FPS
            </SelectItem>
            <SelectItem value="30" data-oid="w0y7:6k">
              30 FPS
            </SelectItem>
            <SelectItem value="60" data-oid=":brfix:">
              60 FPS
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Отображение скопов */}
      {(state.scopes.waveformEnabled || state.scopes.vectorscopeEnabled || state.scopes.histogramEnabled) && (
        <div className="mt-4 space-y-4" data-oid="owo-6ft">
          {/* Переключатель типов скопов */}
          <div className="flex items-center justify-between" data-oid="grhovsv">
            <div className="flex gap-2" data-oid="2l_u7g-">
              {state.scopes.waveformEnabled && (
                <Button
                  variant={activeScope === "waveform" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleScopeChange("waveform")}
                  className="h-7"
                  data-oid="gt3c_il"
                >
                  <Activity className="h-4 w-4 mr-1" data-oid="vf.8.vm" />
                  {t("colorGrading.scopes.waveform", "Waveform")}
                </Button>
              )}
              {state.scopes.vectorscopeEnabled && (
                <Button
                  variant={activeScope === "vectorscope" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleScopeChange("vectorscope")}
                  className="h-7"
                  data-oid="q:vcgys"
                >
                  <CircleDot className="h-4 w-4 mr-1" data-oid="xxk2_cp" />
                  {t("colorGrading.scopes.vectorscope", "Vectorscope")}
                </Button>
              )}
              {state.scopes.histogramEnabled && (
                <Button
                  variant={activeScope === "histogram" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleScopeChange("histogram")}
                  className="h-7"
                  data-oid="7bwjl5j"
                >
                  <BarChart3 className="h-4 w-4 mr-1" data-oid="3rb3q0i" />
                  {t("colorGrading.scopes.histogram", "Histogram")}
                </Button>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="h-7" data-oid=".fpsswc">
              <Settings className="h-4 w-4" data-oid="y5b7fq9" />
            </Button>
          </div>

          {/* Viewer для активного скопа */}
          <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-black/95 p-8" : ""}`} data-oid="fj-y62h">
            <ScopeViewer
              type={activeScope}
              refreshRate={state.scopes.refreshRate}
              isFullscreen={isFullscreen}
              onClose={isFullscreen ? toggleFullscreen : undefined}
              data-oid="fytroyu"
            />
          </div>

          {/* Подсказки для скопов */}
          <div className="text-xs text-muted-foreground/70 mt-2" data-oid="nsj30x_">
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

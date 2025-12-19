import { useTranslation } from "react-i18next"

import { useColorGradingContext } from "../../services/color-grading-provider"
import { ParameterSlider } from "../controls/parameter-slider"

export function HSLSection() {
  const { t } = useTranslation()
  const { state, updateBasicParameter } = useColorGradingContext()

  return (
    <div className="space-y-4" data-testid="hsl-section" data-oid="kfaoyea">
      {/* Заголовок секции */}
      <div className="text-sm text-muted-foreground" data-oid="8sx4:ne">
        {t("colorGrading.hsl.description", "Advanced HSL adjustments and secondary color correction")}
      </div>

      {/* HSL слайдеры */}
      <div className="space-y-3" data-oid="kxqb0dl">
        <ParameterSlider
          label={t("colorGrading.hsl.hue", "Hue")}
          value={state.basicParameters.hue}
          onChange={(value) => updateBasicParameter("hue", value)}
          min={-180}
          max={180}
          defaultValue={0}
          formatValue={(v) => `${v}°`}
          className="[&_input]:bg-linear-to-r [&_input]:from-red-500 [&_input]:via-yellow-500 [&_input]:via-green-500 [&_input]:via-cyan-500 [&_input]:via-blue-500 [&_input]:via-purple-500 [&_input]:to-red-500"
          data-oid="rg_6j5h"
        />

        <ParameterSlider
          label={t("colorGrading.hsl.saturation", "Saturation")}
          value={state.basicParameters.saturation}
          onChange={(value) => updateBasicParameter("saturation", value)}
          min={-100}
          max={100}
          defaultValue={0}
          formatValue={(v) => (v > 0 ? `+${v}` : v.toString())}
          className="[&_input]:bg-linear-to-r [&_input]:from-muted [&_input]:to-purple-500"
          data-oid="kaycsm."
        />

        <ParameterSlider
          label={t("colorGrading.hsl.luminance", "Luminance")}
          value={state.basicParameters.luminance}
          onChange={(value) => updateBasicParameter("luminance", value)}
          min={-100}
          max={100}
          defaultValue={0}
          formatValue={(v) => (v > 0 ? `+${v}` : v.toString())}
          className="[&_input]:bg-linear-to-r [&_input]:from-background [&_input]:via-muted [&_input]:to-foreground"
          data-oid="4opm0h9"
        />
      </div>

      {/* Дополнительные параметры */}
      <div className="border-t border-border pt-4 mt-6" data-oid="8mo7e5f">
        <div className="text-sm text-muted-foreground mb-3" data-oid="h:30oy5">
          {t("colorGrading.hsl.advanced", "Advanced")}
        </div>

        <div className="space-y-3" data-oid="k2gcw92">
          <ParameterSlider
            label={t("colorGrading.hsl.pivot", "Contrast Pivot")}
            value={state.basicParameters.pivot}
            onChange={(value) => updateBasicParameter("pivot", value)}
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.5}
            formatValue={(v) => v.toFixed(2)}
            data-oid="zv:0gss"
          />

          <ParameterSlider
            label={t("colorGrading.hsl.vibrance", "Vibrance")}
            value={state.basicParameters.saturation} // Можно добавить отдельный параметр vibrance
            onChange={(value) => updateBasicParameter("saturation", value)}
            min={-100}
            max={100}
            defaultValue={0}
            formatValue={(v) => (v > 0 ? `+${v}` : v.toString())}
            data-oid="xjie4dj"
          />
        </div>
      </div>
    </div>
  )
}

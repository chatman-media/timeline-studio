import { useTranslation } from "react-i18next"
import { useColorGradingContext } from "../../services/color-grading-provider"
import { ParameterSlider } from "../controls/parameter-slider"
import { ColorWheel } from "./color-wheel"

export function ColorWheelsSection() {
  const { t } = useTranslation()
  const { state, updateColorWheel, updateBasicParameter } = useColorGradingContext()

  return (
    <div className="space-y-4" data-testid="color-wheels-section" data-oid="urm:g5:">
      {/* Заголовок секции */}
      <div className="text-sm text-muted-foreground" data-oid="_g8.rd0">
        {t("colorGrading.colorWheels.description", "Adjust shadows (Lift), midtones (Gamma), and highlights (Gain)")}
      </div>

      {/* Цветовые колеса в горизонтальном ряду */}
      <div className="grid grid-cols-3 gap-4" data-oid="77ml477">
        <ColorWheel
          type="lift"
          label={t("colorGrading.colorWheels.lift", "Lift (Shadows)")}
          value={state.colorWheels.lift}
          onChange={(value) => updateColorWheel("lift", value)}
          data-oid="-uawjis"
        />

        <ColorWheel
          type="gamma"
          label={t("colorGrading.colorWheels.gamma", "Gamma (Midtones)")}
          value={state.colorWheels.gamma}
          onChange={(value) => updateColorWheel("gamma", value)}
          data-oid="u9oe:0e"
        />

        <ColorWheel
          type="gain"
          label={t("colorGrading.colorWheels.gain", "Gain (Highlights)")}
          value={state.colorWheels.gain}
          onChange={(value) => updateColorWheel("gain", value)}
          data-oid="hub.37x"
        />
      </div>

      {/* Базовые слайдеры */}
      <div className="space-y-3 mt-6" data-oid="dh8dj-g">
        <ParameterSlider
          label={t("colorGrading.parameters.temperature", "Temperature")}
          value={state.basicParameters.temperature}
          onChange={(value) => updateBasicParameter("temperature", value)}
          min={-100}
          max={100}
          defaultValue={0}
          formatValue={(v) => (v > 0 ? `+${v}` : v.toString())}
          data-oid="7uuq9wk"
        />

        <ParameterSlider
          label={t("colorGrading.parameters.tint", "Tint")}
          value={state.basicParameters.tint}
          onChange={(value) => updateBasicParameter("tint", value)}
          min={-100}
          max={100}
          defaultValue={0}
          formatValue={(v) => (v > 0 ? `+${v}` : v.toString())}
          data-oid="145:clj"
        />

        <ParameterSlider
          label={t("colorGrading.parameters.contrast", "Contrast")}
          value={state.basicParameters.contrast}
          onChange={(value) => updateBasicParameter("contrast", value)}
          min={-100}
          max={100}
          defaultValue={0}
          formatValue={(v) => (v > 0 ? `+${v}` : v.toString())}
          data-oid="h:l4ov."
        />

        <ParameterSlider
          label={t("colorGrading.parameters.saturation", "Saturation")}
          value={state.basicParameters.saturation}
          onChange={(value) => updateBasicParameter("saturation", value)}
          min={-100}
          max={100}
          defaultValue={0}
          formatValue={(v) => (v > 0 ? `+${v}` : v.toString())}
          data-oid="en::.9r"
        />
      </div>
    </div>
  )
}

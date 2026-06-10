import { Button } from "@timeline-studio/ui/components/button"
import { Label } from "@timeline-studio/ui/components/label"
import { Slider } from "@timeline-studio/ui/components/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@timeline-studio/ui/components/tooltip"
import { RotateCcw, Save } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { BaseEffect, EffectParameter } from "@/features/effects/types"

interface EffectParameterControlsProps {
  effect: BaseEffect
  onParametersChange: (params: Record<string, any>) => void
  selectedPreset?: string
  onSavePreset?: (name: string, params: Record<string, any>) => void
}

// Получаем конфигурацию из параметров эффекта
function getParameterConfig(param: EffectParameter): {
  min: number
  max: number
  step: number
  default: any
  label: { ru: string; en: string }
  description: { ru: string; en: string }
} {
  const label = {
    ru: param.name.ru || param.name.en,
    en: param.name.en,
  }

  const description = {
    ru: "",
    en: "",
  }

  switch (param.type) {
    case "number":
      return {
        min: param.min ?? 0,
        max: param.max ?? 100,
        step: param.step ?? 1,
        default: param.defaultValue,
        label,
        description,
      }
    case "boolean":
      return {
        min: 0,
        max: 1,
        step: 1,
        default: param.defaultValue ? 1 : 0,
        label,
        description,
      }
    case "dropdown": {
      // Для dropdown используем индексы опций
      const options = param.options || []
      const defaultIndex = options.findIndex((opt) => opt.value === param.defaultValue)
      return {
        min: 0,
        max: Math.max(0, options.length - 1),
        step: 1,
        default: defaultIndex >= 0 ? defaultIndex : 0,
        label,
        description,
      }
    }
    case "color":
      // Для цвета будем использовать другой компонент
      return {
        min: 0,
        max: 255,
        step: 1,
        default: 0,
        label,
        description,
      }
    default:
      return {
        min: 0,
        max: 100,
        step: 1,
        default: param.defaultValue,
        label,
        description,
      }
  }
}

// Старая конфигурация для обратной совместимости
const LEGACY_PARAMETER_CONFIG = {
  intensity: {
    min: 0,
    max: 100,
    step: 1,
    default: 50,
    label: { ru: "Интенсивность", en: "Intensity" },
    description: { ru: "Сила применения эффекта", en: "Effect strength" },
  },
  speed: {
    min: 0.1,
    max: 5.0,
    step: 0.1,
    default: 1.0,
    label: { ru: "Скорость", en: "Speed" },
    description: { ru: "Скорость воспроизведения", en: "Playback speed" },
  },
  angle: {
    min: 0,
    max: 360,
    step: 1,
    default: 0,
    label: { ru: "Угол", en: "Angle" },
    description: {
      ru: "Угол поворота в градусах",
      en: "Rotation angle in degrees",
    },
  },
  radius: {
    min: 0,
    max: 50,
    step: 0.5,
    default: 5,
    label: { ru: "Радиус", en: "Radius" },
    description: {
      ru: "Радиус размытия или эффекта",
      en: "Blur or effect radius",
    },
  },
  amount: {
    min: 0,
    max: 200,
    step: 1,
    default: 100,
    label: { ru: "Количество", en: "Amount" },
    description: { ru: "Количество эффекта", en: "Effect amount" },
  },
  threshold: {
    min: 0,
    max: 100,
    step: 1,
    default: 50,
    label: { ru: "Порог", en: "Threshold" },
    description: { ru: "Пороговое значение", en: "Threshold value" },
  },
  temperature: {
    min: -100,
    max: 100,
    step: 1,
    default: 0,
    label: { ru: "Температура", en: "Temperature" },
    description: { ru: "Цветовая температура", en: "Color temperature" },
  },
  tint: {
    min: -100,
    max: 100,
    step: 1,
    default: 0,
    label: { ru: "Оттенок", en: "Tint" },
    description: { ru: "Цветовой оттенок", en: "Color tint" },
  },
} as const

/**
 * Компонент для интерактивной настройки параметров эффекта
 */
export function EffectParameterControls({
  effect,
  onParametersChange,
  selectedPreset,
  onSavePreset,
}: EffectParameterControlsProps) {
  const { i18n, t } = useTranslation()
  const currentLang = i18n.language as "ru" | "en"

  // Состояние параметров
  const [parameters, setParameters] = useState<Record<string, any>>(() => {
    // Инициализируем значениями по умолчанию из эффекта
    const defaultParams: Record<string, any> = {}

    effect.parameters?.forEach((param) => {
      defaultParams[param.id] = param.defaultValue
    })

    return defaultParams
  })

  // Обновляем параметры при смене пресета
  useEffect(() => {
    if (selectedPreset && effect.presets) {
      const preset = effect.presets.find((p) => p.id === selectedPreset)
      if (preset) {
        setParameters(preset.parameters)
        onParametersChange(preset.parameters)
      }
    }
  }, [selectedPreset, effect.presets, onParametersChange])

  // Обработчик изменения параметра
  const handleParameterChange = useCallback(
    (paramName: string, value: number[]) => {
      const newValue = value[0]
      const newParameters = { ...parameters, [paramName]: newValue }
      setParameters(newParameters)
      onParametersChange(newParameters)
    },
    [parameters, onParametersChange],
  )

  // Сброс к значениям по умолчанию
  const handleReset = useCallback(() => {
    const defaultParams: Record<string, any> = {}

    effect.parameters?.forEach((param) => {
      defaultParams[param.id] = param.defaultValue
    })

    setParameters(defaultParams)
    onParametersChange(defaultParams)
  }, [effect.parameters, onParametersChange])

  // Сохранение пользовательского пресета
  const handleSavePreset = useCallback(() => {
    if (onSavePreset) {
      // Запрашиваем имя пресета у пользователя
      const presetName = prompt(t("effects.enterPresetName", "Введите название пресета:"))
      if (presetName && presetName.trim()) {
        onSavePreset(presetName.trim(), parameters)
      }
    }
  }, [onSavePreset, parameters, t])

  // Если у эффекта нет параметров, не показываем контролы
  if (!effect.parameters || effect.parameters.length === 0) {
    return null
  }

  return (
    <div className="space-y-4" data-oid="zfsrsr5">
      {/* Заголовок с кнопками действий */}
      <div className="flex items-center justify-between" data-oid="16r1vw5">
        <h3 className="font-medium" data-oid="aw.2lno">
          {t("effects.detail.parameters", "Параметры")}
        </h3>
        <div className="flex gap-2" data-oid="x8kzykw">
          <TooltipProvider data-oid="nm8ef34">
            <Tooltip data-oid="p.p5ur:">
              <TooltipTrigger asChild data-oid="99jsz-z">
                <Button variant="outline" size="sm" onClick={handleReset} data-oid="hwo97ex">
                  <RotateCcw size={14} data-oid="45.4k2m" />
                </Button>
              </TooltipTrigger>
              <TooltipContent data-oid="4dienqa">
                {t("effects.detail.resetToDefault", "Сбросить к значениям по умолчанию")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {onSavePreset && (
            <TooltipProvider data-oid="klgbu_-">
              <Tooltip data-oid="b2-1laf">
                <TooltipTrigger asChild data-oid="x0r3rs.">
                  <Button variant="outline" size="sm" onClick={handleSavePreset} data-oid=":qyy74b">
                    <Save size={14} data-oid="e2:w.du" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent data-oid="f.spdv1">
                  {t("effects.detail.savePreset", "Сохранить как пресет")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Контролы параметров */}
      <div className="space-y-4" data-oid="5:flm5p">
        {effect.parameters.map((param) => {
          const config = getParameterConfig(param)
          const currentValue = parameters[param.id] ?? param.defaultValue

          // Для цветов и сложных типов нужны специальные контролы
          if (param.type === "color") {
            // TODO: Добавить color picker
            return null
          }

          if (param.type === "dropdown") {
            // TODO: Добавить dropdown компонент с Select
            return null
          }

          // Преобразуем boolean в число для slider
          const sliderValue = param.type === "boolean" ? (currentValue ? 1 : 0) : currentValue

          return (
            <div key={param.id} className="space-y-2" data-oid="tzhuyue">
              <div className="flex items-center justify-between" data-oid="7:ea:10">
                <Label className="text-sm font-medium" data-oid="_pn8cqp">
                  {config.label[currentLang] || config.label.en}
                </Label>
                <span className="text-sm text-gray-500 font-mono" data-oid="sqtrq0n">
                  {param.type === "boolean"
                    ? currentValue
                      ? "Вкл"
                      : "Выкл"
                    : (param.type as string) === "dropdown" && param.options
                      ? param.options[currentValue]?.label[currentLang] ||
                        param.options[currentValue]?.label.en ||
                        currentValue
                      : currentValue}
                </span>
              </div>

              <TooltipProvider data-oid="v8y_ql:">
                <Tooltip data-oid="nh-o6mr">
                  <TooltipTrigger asChild data-oid="6ti2zma">
                    <div data-oid="5ku.x7f">
                      <Slider
                        value={[sliderValue]}
                        onValueChange={(value) => {
                          const newValue = param.type === "boolean" ? value[0] === 1 : value[0]
                          handleParameterChange(
                            param.id,
                            typeof newValue === "boolean" ? [newValue ? 1 : 0] : [newValue],
                          )
                        }}
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        className="w-full"
                        data-oid="4l6uv5k"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent data-oid="fe.rumt">
                    <div className="text-center" data-oid="clwm0p.">
                      <div className="font-medium" data-oid="gc2nk0s">
                        {config.label[currentLang] || config.label.en}
                      </div>
                      <div className="text-sm text-gray-400" data-oid="8vk_.nk">
                        {config.description[currentLang] || config.description.en}
                      </div>
                      <div className="text-xs text-gray-500 mt-1" data-oid="2101qdh">
                        {config.min} - {config.max}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )
        })}
      </div>

      {/* Информация о текущих параметрах */}
      <div className="text-xs text-gray-500 space-y-1" data-oid="xq6:e0y">
        <div data-oid="yccbxa9">{t("effects.detail.currentValues", "Текущие значения")}:</div>
        <div className="font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded" data-oid="t9c7x0n">
          {Object.entries(parameters).map(([key, value]) => (
            <div key={key} data-oid="tnd1fd3">
              {key}: {typeof value === "boolean" ? (value ? "true" : "false") : value}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

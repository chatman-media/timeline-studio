/**
 * Filter Parameter Controls Component
 *
 * Provides interactive controls for adjusting filter parameters
 */

import { useCallback, useState } from "react"

import { useTranslation } from "react-i18next"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import type { VideoFilter } from "../types/filters"

interface FilterParameterControlsProps {
  filter: VideoFilter
  onParamsChange?: (params: Record<string, any>) => void
  showPreview?: boolean
}

/**
 * Component for controlling filter parameters with interactive sliders
 *
 * Features:
 * - Interactive sliders for numeric parameters
 * - Real-time preview of changes
 * - Reset to default values
 * - Parameter grouping by category
 */
export function FilterParameterControls({ filter, onParamsChange, showPreview = true }: FilterParameterControlsProps) {
  const { t } = useTranslation()
  const [params, setParams] = useState(filter.params)

  /**
   * Handle parameter value change
   */
  const handleParamChange = useCallback(
    (paramName: string, value: number) => {
      const newParams = {
        ...params,
        [paramName]: value,
      }
      setParams(newParams)
      onParamsChange?.(newParams)
    },
    [params, onParamsChange],
  )

  /**
   * Reset all parameters to default values
   */
  const handleReset = useCallback(() => {
    setParams(filter.params)
    onParamsChange?.(filter.params)
  }, [filter.params, onParamsChange])

  /**
   * Get parameter configuration (min, max, step, default)
   */
  const getParamConfig = (paramName: string) => {
    const configs: Record<string, { min: number; max: number; step: number; default: number }> = {
      brightness: { min: -1, max: 1, step: 0.01, default: 0 },
      contrast: { min: 0, max: 2, step: 0.01, default: 1 },
      saturation: { min: 0, max: 2, step: 0.01, default: 1 },
      gamma: { min: 0.1, max: 3, step: 0.01, default: 1 },
      temperature: { min: -100, max: 100, step: 1, default: 0 },
      tint: { min: -100, max: 100, step: 1, default: 0 },
      hue: { min: -180, max: 180, step: 1, default: 0 },
      vibrance: { min: -1, max: 1, step: 0.01, default: 0 },
      shadows: { min: -1, max: 1, step: 0.01, default: 0 },
      highlights: { min: -1, max: 1, step: 0.01, default: 0 },
      blacks: { min: -1, max: 1, step: 0.01, default: 0 },
      whites: { min: -1, max: 1, step: 0.01, default: 0 },
      clarity: { min: -1, max: 1, step: 0.01, default: 0 },
      dehaze: { min: -1, max: 1, step: 0.01, default: 0 },
      vignette: { min: 0, max: 1, step: 0.01, default: 0 },
      grain: { min: 0, max: 1, step: 0.01, default: 0 },
    }

    return (
      configs[paramName] || {
        min: 0,
        max: 1,
        step: 0.01,
        default: 0,
      }
    )
  }

  /**
   * Format parameter value for display
   */
  const formatValue = (value: number, paramName: string) => {
    const config = getParamConfig(paramName)
    if (config.step >= 1) {
      return Math.round(value)
    }
    return value.toFixed(2)
  }

  /**
   * Get parameter label translation key
   */
  const getParamLabel = (paramName: string) => {
    return t(`filters.params.${paramName}`, paramName)
  }

  /**
   * Group parameters by category
   */
  const parameterGroups = {
    basic: ["brightness", "contrast", "saturation"],
    color: ["temperature", "tint", "hue", "vibrance"],
    tone: ["shadows", "highlights", "blacks", "whites"],
    effects: ["clarity", "dehaze", "vignette", "grain"],
  }

  /**
   * Render parameter slider
   */
  const renderParameterSlider = (paramName: string) => {
    const value = params[paramName as keyof typeof params]
    if (value === undefined) return null

    const config = getParamConfig(paramName)

    return (
      <div key={paramName} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">{getParamLabel(paramName)}</Label>
          <span className="text-xs text-muted-foreground">{formatValue(value, paramName)}</span>
        </div>
        <Slider
          value={[value]}
          min={config.min}
          max={config.max}
          step={config.step}
          onValueChange={(values) => handleParamChange(paramName, values[0])}
          className="w-full"
        />
      </div>
    )
  }

  /**
   * Render parameter group
   */
  const renderParameterGroup = (groupName: string, paramNames: string[]) => {
    const availableParams = paramNames.filter((name) => params[name as keyof typeof params] !== undefined)

    if (availableParams.length === 0) return null

    return (
      <div key={groupName} className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          {t(`filters.paramGroups.${groupName}`, groupName)}
        </h4>
        <div className="space-y-4">{availableParams.map(renderParameterSlider)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Info */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{filter.labels?.ru || filter.name}</h3>
        <p className="text-sm text-muted-foreground">{filter.description?.ru || filter.description?.en}</p>
      </div>

      {/* Parameter Groups */}
      <div className="space-y-6">
        {renderParameterGroup("basic", parameterGroups.basic)}
        {renderParameterGroup("color", parameterGroups.color)}
        {renderParameterGroup("tone", parameterGroups.tone)}
        {renderParameterGroup("effects", parameterGroups.effects)}
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("filters.resetParams", "Reset to Default")}
        </button>
      </div>

      {/* Preview Note */}
      {showPreview && (
        <div className="text-xs text-muted-foreground border-t pt-4">
          {t("filters.previewNote", "Changes are applied in real-time to the preview")}
        </div>
      )}
    </div>
  )
}

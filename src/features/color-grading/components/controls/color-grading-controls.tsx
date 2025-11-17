import { ChevronDown, Eye, EyeOff, RotateCcw, Save, Wand2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useModal } from "@/features/modals/services"

import { useColorGradingContext } from "../../services/color-grading-provider"
import { getAllPresetCategories } from "../../types/presets"

export function ColorGradingControls() {
  const { t } = useTranslation()
  const { openModal } = useModal()
  const {
    state,
    hasChanges,
    resetAll,
    togglePreview,
    applyToClip,
    loadPreset,
    savePreset,
    autoCorrect,
    availablePresets,
    dispatch,
  } = useColorGradingContext()

  const handleSavePreset = () => {
    openModal("color-grading", {
      onSave: savePreset,
    })
  }

  // Группируем пресеты по категориям
  const presetCategories = getAllPresetCategories()
  const presetsByCategory = presetCategories.reduce<Record<string, typeof availablePresets>>((acc, category) => {
    acc[category] = availablePresets.filter((preset) => preset.category === category)
    return acc
  }, {})

  return (
    <div className="flex justify-between items-center p-1" data-testid="color-grading-controls">
      {/* Левые кнопки - управление пресетами */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-8 px-3"
          title={t("colorGrading.controls.resetAllTooltip", "Reset all color corrections")}
          onClick={resetAll}
          disabled={!hasChanges}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          {t("colorGrading.controls.resetAll", "Reset All")}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-8 px-3"
          title={t("colorGrading.controls.autoCorrectTooltip", "Automatically adjust levels")}
          onClick={autoCorrect}
        >
          <Wand2 className="h-3 w-3 mr-1" />
          {t("colorGrading.controls.auto", "Auto")}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 px-3"
              title={t("colorGrading.controls.loadPresetTooltip", "Load color grading preset")}
            >
              {t("colorGrading.controls.loadPreset", "Load Preset")}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {presetCategories.map((category) => (
              <div key={category}>
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">
                  {t(`colorGrading.presets.categories.${category}`, category)}
                </DropdownMenuLabel>
                {presetsByCategory[category].map((preset) => (
                  <DropdownMenuItem key={preset.id} className="text-sm" onClick={() => loadPreset(preset.id)}>
                    {preset.name}
                    {preset.description && (
                      <span className="text-xs text-muted-foreground ml-2">{preset.description}</span>
                    )}
                  </DropdownMenuItem>
                ))}
                {category !== presetCategories[presetCategories.length - 1] && <DropdownMenuSeparator />}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-8 px-3"
          title={t("colorGrading.controls.savePresetTooltip", "Save current settings as preset")}
          onClick={handleSavePreset}
          disabled={!hasChanges}
        >
          <Save className="h-3 w-3 mr-1" />
          {t("colorGrading.controls.savePreset", "Save Preset")}
        </Button>
      </div>

      {/* Правые кнопки - применение */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8 px-3"
          title={t("colorGrading.controls.togglePreviewTooltip", "Toggle real-time preview")}
          onClick={() => togglePreview(!state.previewEnabled)}
        >
          {state.previewEnabled ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
          {t("colorGrading.controls.preview", "Preview")}
        </Button>

        <Button
          size="sm"
          className="text-xs h-8 px-4"
          title={t("colorGrading.controls.applyToClipTooltip", "Apply color grading to selected clip")}
          onClick={applyToClip}
          disabled={!state.selectedClip || !hasChanges}
        >
          {t("colorGrading.controls.applyToClip", "Apply to Clip")}
        </Button>
      </div>
    </div>
  )
}

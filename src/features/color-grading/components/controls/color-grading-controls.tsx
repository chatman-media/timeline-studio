import { ChevronDown, Eye, EyeOff, RotateCcw, Save, Wand2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@timeline-studio/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@timeline-studio/ui/components/dropdown-menu"
import { useModals } from "@/features/modals/services"

import { useColorGradingContext } from "../../services/color-grading-provider"
import { getAllPresetCategories } from "../../types/presets"

export function ColorGradingControls() {
  const { t } = useTranslation()
  const { openModal } = useModals()
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
    <div className="flex justify-between items-center p-1" data-testid="color-grading-controls" data-oid="n7h4bra">
      {/* Левые кнопки - управление пресетами */}
      <div className="flex gap-2" data-oid="syg3nmq">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-8 px-3"
          title={t("colorGrading.controls.resetAllTooltip", "Reset all color corrections")}
          onClick={resetAll}
          disabled={!hasChanges}
          data-oid="rhnwtga"
        >
          <RotateCcw className="h-3 w-3 mr-1" data-oid="ars6ttk" />
          {t("colorGrading.controls.resetAll", "Reset All")}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-8 px-3"
          title={t("colorGrading.controls.autoCorrectTooltip", "Automatically adjust levels")}
          onClick={autoCorrect}
          data-oid="hk_50f8"
        >
          <Wand2 className="h-3 w-3 mr-1" data-oid="hng_h_." />
          {t("colorGrading.controls.auto", "Auto")}
        </Button>

        <DropdownMenu data-oid="lpow971">
          <DropdownMenuTrigger asChild data-oid="ht7m62h">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 px-3"
              title={t("colorGrading.controls.loadPresetTooltip", "Load color grading preset")}
              data-oid="zkhuv4y"
            >
              {t("colorGrading.controls.loadPreset", "Load Preset")}
              <ChevronDown className="h-3 w-3 ml-1" data-oid="qn3lqv6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" data-oid="1wxxglp">
            {presetCategories.map((category) => (
              <div key={category} data-oid="2f:5jry">
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase" data-oid="znbp36v">
                  {t(`colorGrading.presets.categories.${category}`, category)}
                </DropdownMenuLabel>
                {presetsByCategory[category].map((preset) => (
                  <DropdownMenuItem
                    key={preset.id}
                    className="text-sm"
                    onClick={() => loadPreset(preset.id)}
                    data-oid=".ql0eij"
                  >
                    {preset.name}
                    {preset.description && (
                      <span className="text-xs text-muted-foreground ml-2" data-oid="_ts:339">
                        {preset.description}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
                {category !== presetCategories[presetCategories.length - 1] && (
                  <DropdownMenuSeparator data-oid="yb1.q.r" />
                )}
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
          data-oid="-u7h:wk"
        >
          <Save className="h-3 w-3 mr-1" data-oid="3sl.haz" />
          {t("colorGrading.controls.savePreset", "Save Preset")}
        </Button>
      </div>

      {/* Правые кнопки - применение */}
      <div className="flex gap-2" data-oid="bf2_xsu">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8 px-3"
          title={t("colorGrading.controls.togglePreviewTooltip", "Toggle real-time preview")}
          onClick={() => togglePreview(!state.previewEnabled)}
          data-oid="_d_uzeo"
        >
          {state.previewEnabled ? (
            <Eye className="h-3 w-3 mr-1" data-oid="tq3c-j." />
          ) : (
            <EyeOff className="h-3 w-3 mr-1" data-oid="j03zz:q" />
          )}
          {t("colorGrading.controls.preview", "Preview")}
        </Button>

        <Button
          size="sm"
          className="text-xs h-8 px-4"
          title={t("colorGrading.controls.applyToClipTooltip", "Apply color grading to selected clip")}
          onClick={applyToClip}
          disabled={!state.selectedClip || !hasChanges}
          data-oid="3eh5kin"
        >
          {t("colorGrading.controls.applyToClip", "Apply to Clip")}
        </Button>
      </div>
    </div>
  )
}

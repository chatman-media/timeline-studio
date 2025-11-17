import { useId, useState } from "react"

import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useModal } from "@/features/modals/services"

interface SavePresetModalData {
  onSave?: (presetName: string) => void
}

export function ColorGradingSavePresetModal() {
  const { t } = useTranslation()
  const { modalData, closeModal } = useModal()
  const { onSave } = (modalData as SavePresetModalData) || {}
  const presetNameId = useId()

  const [presetName, setPresetName] = useState("")

  const handleSave = () => {
    if (presetName.trim() && onSave) {
      onSave(presetName)
      closeModal()
      setPresetName("")
    }
  }

  return (
    <div className="bg-card border-border">
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={presetNameId} className="text-right text-foreground">
            {t("colorGrading.dialogs.savePreset.nameLabel", "Name")}
          </Label>
          <Input
            id={presetNameId}
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="col-span-3 bg-muted border-border text-foreground"
            placeholder={t("colorGrading.dialogs.savePreset.namePlaceholder", "My Preset")}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button variant="ghost" onClick={closeModal} className="cursor-pointer hover:bg-accent">
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          onClick={handleSave}
          disabled={!presetName.trim()}
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
        >
          {t("common.save", "Save")}
        </Button>
      </div>
    </div>
  )
}

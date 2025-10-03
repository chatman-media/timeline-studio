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
    <div className="bg-[#2D2D30] border-[#464647]">
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={presetNameId} className="text-right">
            {t("colorGrading.dialogs.savePreset.nameLabel", "Name")}
          </Label>
          <Input
            id={presetNameId}
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="col-span-3 bg-[#383838] border-[#464647]"
            placeholder={t("colorGrading.dialogs.savePreset.namePlaceholder", "My Preset")}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="ghost" onClick={closeModal} className="hover:bg-[#404040]">
          {t("common.cancel", "Cancel")}
        </Button>
        <Button onClick={handleSave} disabled={!presetName.trim()} className="bg-blue-600 hover:bg-blue-700">
          {t("common.save", "Save")}
        </Button>
      </div>
    </div>
  )
}

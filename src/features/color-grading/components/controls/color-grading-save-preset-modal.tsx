import { Button } from "@timeline-studio/ui/components/button"
import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { useModals } from "@/features/modals/services"

interface SavePresetModalData {
  onSave?: (presetName: string) => void
}

export function ColorGradingSavePresetModal() {
  const { t } = useTranslation()
  const { modalData, closeModal } = useModals()
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
    <div className="bg-card border-border" data-oid="bx58:nt">
      <div className="grid gap-4 py-4" data-oid="bgherv8">
        <div className="grid grid-cols-4 items-center gap-4" data-oid="b:_vf44">
          <Label htmlFor={presetNameId} className="text-right text-foreground" data-oid="g1i2kqd">
            {t("colorGrading.dialogs.savePreset.nameLabel", "Name")}
          </Label>
          <Input
            id={presetNameId}
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="col-span-3 bg-muted border-border text-foreground"
            placeholder={t("colorGrading.dialogs.savePreset.namePlaceholder", "My Preset")}
            data-oid="7req3fk"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-border" data-oid="9qtoezn">
        <Button variant="ghost" onClick={closeModal} className="cursor-pointer hover:bg-accent" data-oid="aqhc.g1">
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          onClick={handleSave}
          disabled={!presetName.trim()}
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
          data-oid="3cu9oq4"
        >
          {t("common.save", "Save")}
        </Button>
      </div>
    </div>
  )
}

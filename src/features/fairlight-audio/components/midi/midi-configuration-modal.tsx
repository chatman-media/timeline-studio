import { Button } from "@timeline-studio/ui/components/button"
import { useModals } from "@/features/modals/services"

export function MidiConfigurationModal() {
  const { openModal } = useModals()

  const handleOpen = () => {
    openModal("midi-configuration")
  }

  return (
    <Button variant="outline" onClick={handleOpen} data-oid="npc4lf3">
      Настройки MIDI
    </Button>
  )
}

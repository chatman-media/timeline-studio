import { Button } from "@/components/ui/button"
import { useModals } from "@/domains/system-integration"

export function MidiConfigurationModal() {
  const { openModal } = useModals()

  const handleOpen = () => {
    openModal("midi-configuration")
  }

  return (
    <Button variant="outline" onClick={handleOpen}>
      Настройки MIDI
    </Button>
  )
}

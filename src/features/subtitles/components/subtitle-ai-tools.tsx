import { Mic } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { useModals } from "@/domains/system-integration"

/**
 * Инструменты AI для работы с субтитрами
 * Интеграция с Whisper для автоматической транскрипции
 */
export function SubtitleAITools() {
  const { t } = useTranslation()
  const { openModal } = useModals()

  const handleOpen = () => {
    openModal("subtitle-ai-tools")
  }

  return (
    <Button variant="outline" size="sm" onClick={handleOpen}>
      <Mic className="mr-2 h-4 w-4" />
      {t("subtitles.ai.title", "AI Транскрипция")}
    </Button>
  )
}

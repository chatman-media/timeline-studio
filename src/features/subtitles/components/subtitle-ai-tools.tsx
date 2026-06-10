import { useModals } from "@timeline-studio/core/hooks"
import { Button } from "@timeline-studio/ui/components/button"
import { Mic } from "lucide-react"
import { useTranslation } from "react-i18next"

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
    <Button variant="outline" size="sm" onClick={handleOpen} data-oid="f4aq2dy">
      <Mic className="mr-2 h-4 w-4" data-oid="r2068b2" />
      {t("subtitles.ai.title", "AI Транскрипция")}
    </Button>
  )
}

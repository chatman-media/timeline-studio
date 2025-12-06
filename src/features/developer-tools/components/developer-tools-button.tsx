/**
 * Кнопка для открытия Developer Tools
 * Показывается в toolbar браузера на вкладке Effects
 */

import { Code2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DeveloperToolsButtonProps {
  onClick: () => void
}

export function DeveloperToolsButton({ onClick }: DeveloperToolsButtonProps) {
  const { t } = useTranslation()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={onClick} className="h-8" data-testid="developer-tools-button">
            <Code2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("developerTools.openButton", "Open Developer Tools")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

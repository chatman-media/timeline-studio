/**
 * Кнопка для открытия Developer Tools
 * Показывается в toolbar браузера на вкладке Effects
 */

import { Code2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@timeline-studio/ui/components/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@timeline-studio/ui/components/tooltip"

interface DeveloperToolsButtonProps {
  onClick: () => void
}

export function DeveloperToolsButton({ onClick }: DeveloperToolsButtonProps) {
  const { t } = useTranslation()

  return (
    <TooltipProvider data-oid="w3abdpn">
      <Tooltip data-oid="clv0vh5">
        <TooltipTrigger asChild data-oid="4qbglng">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className="h-6 w-6 cursor-pointer"
            data-testid="developer-tools-button"
            data-oid="2:40dpn"
          >
            <Code2 className="h-4 w-4" data-oid="kzs5ky:" />
          </Button>
        </TooltipTrigger>
        <TooltipContent data-oid="9yopebb">
          <p data-oid="fo2_o88">{t("developerTools.openButton", "Open Developer Tools")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

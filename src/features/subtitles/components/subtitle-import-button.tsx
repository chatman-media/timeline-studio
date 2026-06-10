/**
 * Кнопка для импорта субтитров
 */

import { Upload } from "lucide-react"

import { Button } from "@timeline-studio/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@timeline-studio/ui/components/dropdown-menu"
import { Progress } from "@timeline-studio/ui/components/progress"

import { useSubtitleImport } from "../hooks/use-subtitle-import"

export interface SubtitleImportButtonProps {
  trackId?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  onImportComplete?: () => void
}

export function SubtitleImportButton({
  trackId,
  variant = "outline",
  size = "sm",
  className,
  onImportComplete,
}: SubtitleImportButtonProps) {
  const { importFromFile, isImporting, importProgress } = useSubtitleImport({
    trackId,
    onImportComplete: () => {
      onImportComplete?.()
    },
  })

  const handleImportFromFile = async () => {
    await importFromFile()
  }

  return (
    <>
      {isImporting ? (
        <div className="flex items-center gap-2" data-oid="v5uh1ft">
          <Progress value={importProgress} className="w-24 h-2" data-oid="y4qaj-r" />
          <span className="text-xs text-muted-foreground" data-oid="se8k.mo">
            {importProgress}%
          </span>
        </div>
      ) : (
        <DropdownMenu data-oid="92aimov">
          <DropdownMenuTrigger asChild data-oid="_2x9d4j">
            <Button variant={variant} size={size} className={className} data-oid="8e.q1c-">
              <Upload className="mr-2 h-4 w-4" data-oid="yu2xil_" />
              Импорт субтитров
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" data-oid="4rf-3x8">
            <DropdownMenuItem onClick={handleImportFromFile} data-oid="sd6179r">
              <Upload className="mr-2 h-4 w-4" data-oid=":.p956q" />
              Из файла
            </DropdownMenuItem>
            <DropdownMenuSeparator data-oid="g06rlmm" />
            <div className="px-2 py-1.5 text-xs text-muted-foreground" data-oid="e0i3sjm">
              Поддерживаемые форматы:
            </div>
            <DropdownMenuItem disabled className="text-xs" data-oid="wnc1wp4">
              • SRT (SubRip)
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs" data-oid="b3tgutt">
              • VTT (WebVTT)
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs" data-oid="gxn2kd8">
              • ASS/SSA (Advanced SubStation)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  )
}

import { Separator } from "@timeline-studio/ui/components/separator"

import { SubtitleAITools } from "./subtitle-ai-tools"
import { SubtitleImportButton } from "./subtitle-import-button"
import { SubtitleSyncTools } from "./subtitle-sync-tools"
import { SubtitleTools } from "./subtitle-tools"

/**
 * Панель инструментов для работы с субтитрами
 * Объединяет все инструменты субтитров в одном месте
 */
export function SubtitleToolbar() {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-background p-2" data-oid="tfzwtav">
      <SubtitleImportButton data-oid="nak083w" />
      <Separator orientation="vertical" className="h-6" data-oid="p8irjcr" />
      <SubtitleTools data-oid="3f.erob" />
      <Separator orientation="vertical" className="h-6" data-oid="jusuz9l" />
      <SubtitleSyncTools data-oid="1e5y_hd" />
      <Separator orientation="vertical" className="h-6" data-oid="j8jn2sj" />
      <SubtitleAITools data-oid="xwjr00x" />
    </div>
  )
}

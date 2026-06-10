import { Button } from "@timeline-studio/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@timeline-studio/ui/components/dropdown-menu"
import { FileDown, FileUp, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useSubtitlesExport } from "../hooks/use-subtitles-export"
import { useSubtitlesImport } from "../hooks/use-subtitles-import"

/**
 * Компонент инструментов для работы с субтитрами
 * Предоставляет UI для импорта и экспорта субтитров
 */
export function SubtitleTools() {
  const { t } = useTranslation()
  const { importSubtitleFile, importSubtitleFiles, isImporting } = useSubtitlesImport()
  const { exportSubtitleFile, isExporting } = useSubtitlesExport()

  return (
    <div className="flex items-center gap-2" data-oid="0d.p2g_">
      {/* Кнопка импорта */}
      <DropdownMenu data-oid="_nfa0sj">
        <DropdownMenuTrigger asChild data-oid="8cftn2-">
          <Button variant="outline" size="sm" disabled={isImporting} data-oid="4_z3w3w">
            {isImporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" data-oid="64.x4l5" />
            ) : (
              <FileUp className="mr-2 h-4 w-4" data-oid="y1fq24f" />
            )}
            {t("subtitles.import.title", "Импорт")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" data-oid="zmhctax">
          <DropdownMenuLabel data-oid="3ly.lvx">
            {t("subtitles.import.selectFormat", "Выберите формат")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator data-oid=".toi950" />
          <DropdownMenuItem onClick={importSubtitleFile} data-oid="o7o.ov-">
            {t("subtitles.import.singleFile", "Импортировать один файл")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={importSubtitleFiles} data-oid="ydmf4e4">
            {t("subtitles.import.multipleFiles", "Импортировать несколько файлов")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Кнопка экспорта */}
      <DropdownMenu data-oid="cogf8mm">
        <DropdownMenuTrigger asChild data-oid="53oao9y">
          <Button variant="outline" size="sm" disabled={isExporting} data-oid="c7zfvch">
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" data-oid="v7ewvzq" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" data-oid="-h:67w." />
            )}
            {t("subtitles.export.title", "Экспорт")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" data-oid="9n.n5fh">
          <DropdownMenuLabel data-oid="3b_8pe1">
            {t("subtitles.export.selectFormat", "Выберите формат")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator data-oid="a0hqaqo" />
          <DropdownMenuItem onClick={() => exportSubtitleFile("srt")} data-oid="o:boqa3">
            {t("subtitles.export.srt", "SubRip (.srt)")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportSubtitleFile("vtt")} data-oid="e262mur">
            {t("subtitles.export.vtt", "WebVTT (.vtt)")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportSubtitleFile("ass")} data-oid="5goecko">
            {t("subtitles.export.ass", "Advanced SSA (.ass)")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

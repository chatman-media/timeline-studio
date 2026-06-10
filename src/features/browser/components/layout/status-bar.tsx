import { CopyPlus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@timeline-studio/ui/components/button"
import { getRemainingMediaCounts, getTopDateWithRemainingFiles, type MediaFile } from "@/features/media"

interface StatusBarProps {
  media: MediaFile[]
  onAddAllVideoFiles: () => Promise<void>
  onAddAllAudioFiles: () => Promise<void>
  onAddDateFiles: (files: MediaFile[]) => Promise<void>
  onAddAllFiles: () => Promise<void>
  sortedDates: { date: string; files: MediaFile[] }[]
  addedFilesPaths: Set<string>
}

/**
 * Компонент для отображения статуса браузера
 *
 * @param media - Массив медиа-файлов
 * @param onAddAllVideoFiles - Callback для добавления всех видеофайлов
 * @param onAddAllAudioFiles - Callback для добавления всех аудиофайлов
 * @param onAddDateFiles - Callback для добавления видеофайлов за определенную дату
 * @param onAddAllFiles - Callback для добавления всех файлов
 * @param sortedDates - Массив отсортированных дат и соответствующих им файлов
 * @param addedFiles - Массив добавленных файлов
 */
export function StatusBar({
  media,
  onAddAllVideoFiles,
  onAddAllAudioFiles,
  onAddDateFiles,
  onAddAllFiles,
  sortedDates,
  addedFilesPaths,
}: StatusBarProps) {
  const { t } = useTranslation()
  const { remainingVideoCount, remainingAudioCount, allFilesAdded } = getRemainingMediaCounts(media, addedFilesPaths)
  const topDateWithRemainingFiles = getTopDateWithRemainingFiles(sortedDates, addedFilesPaths)

  // DEBUG: логируем почему не показываются кнопки
  console.log("[StatusBar] Counts:", {
    totalMedia: media.length,
    addedFiles: addedFilesPaths.size,
    remainingVideoCount,
    remainingAudioCount,
    allFilesAdded,
    hasVideos: media.filter((f) => f.isVideo).length,
    hasAudio: media.filter((f) => f.isAudio).length,
  })

  return (
    <div className="flex w-full items-center justify-between gap-2 p-1 text-sm" data-oid="ojgzpl5">
      <div className="flex flex-col items-end justify-center gap-0 text-xs" data-oid="hg2xcgy">
        <span className="flex items-center gap-2 px-1 whitespace-nowrap" data-oid="6w35a15">
          {remainingVideoCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="bg-secondary flex h-6 cursor-pointer items-center gap-1 rounded-sm px-2 text-xs hover:bg-teal dark:hover:bg-teal"
              title={t("browser.media.addAllVideo")}
              onClick={onAddAllVideoFiles}
              data-oid="kad_ddy"
            >
              {remainingVideoCount} {t("browser.media.video")}
              <CopyPlus size={10} className="" data-oid="d0:w38w" />
            </Button>
          )}
          {remainingAudioCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="bg-secondary flex h-6 cursor-pointer items-center gap-1 rounded-sm px-2 text-xs hover:bg-teal dark:hover:bg-teal"
              title={t("browser.media.addAllAudio")}
              onClick={onAddAllAudioFiles}
              data-oid="pxjfmx."
            >
              {remainingAudioCount} {t("browser.media.audio")}
              <CopyPlus size={10} className="" data-oid="yzveuw4" />
            </Button>
          )}
        </span>
      </div>
      {topDateWithRemainingFiles && topDateWithRemainingFiles.remainingFiles.length > 0 && (
        <div className="flex flex-row items-end justify-center gap-0 text-xs" data-oid="g5mwiyd">
          {/* <Button
           variant="ghost"
           size="sm"
           className="flex items-center gap-1 text-xs rounded-sm cursor-pointer px-2 h-6 hover:bg-teal dark:hover:bg-teal"
           title={`Пропустить дату`}
           onClick={() => {}}
          >
           <SquareArrowDown size={10} className="" />
          </Button> */}
          <Button
            variant="ghost"
            size="sm"
            className="bg-secondary flex h-6 cursor-pointer items-center gap-1 rounded-sm px-2 text-xs hover:bg-teal dark:hover:bg-teal"
            title={`${t("browser.media.addDate")}: ${topDateWithRemainingFiles.date}`}
            onClick={() => {
              onAddDateFiles(topDateWithRemainingFiles.files)
            }}
            data-oid="x-:3xcu"
          >
            {`${topDateWithRemainingFiles.remainingFiles.length} ${t("browser.media.video")} ${topDateWithRemainingFiles.date}`}
            <CopyPlus size={10} className="" data-oid="vgu4hij" />
          </Button>
        </div>
      )}
      <div className="flex flex-col items-end justify-center gap-0 text-xs" data-oid="dlgwb5.">
        {(() => {
          console.log("[StatusBar] allFilesAdded check:", {
            allFilesAdded,
            showMessage: allFilesAdded,
            showButton: !allFilesAdded,
          })
          return allFilesAdded ? (
            <div className="flex items-center gap-1 px-2 font-medium text-[#49a293]" data-oid="pl8oigx">
              <span data-oid="hjc.dxl">{t("common.allFilesAdded")}</span>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="bg-secondary flex h-6 cursor-pointer items-center gap-1 rounded-sm px-2 text-xs hover:bg-teal dark:hover:bg-teal"
              title={t("browser.media.addAll")}
              onClick={() => {
                console.log("[StatusBar] Add All button clicked!")
                onAddAllFiles()
              }}
              data-oid="outpczt"
            >
              <span className="px-1 text-xs" data-oid=".6nf98u">
                {t("browser.media.addAll")}
              </span>
              <CopyPlus size={10} className="" data-oid="rq-fkj0" />
            </Button>
          )
        })()}
      </div>
    </div>
  )
}

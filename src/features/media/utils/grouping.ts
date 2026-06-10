import type { MediaFile } from "@timeline-studio/core/types"
import i18n from "@/i18n"
import { formatDateByLanguage } from "@/i18n/constants"
import type { DateGroup } from "../types/types"

/**
 * Группирует файлы по дате создания
 * @param media - Массив медиафайлов
 * @returns Массив групп файлов по датам
 */
export const groupFilesByDate = (media: MediaFile[]): DateGroup[] => {
  const currentLanguage = i18n.language || "ru"
  const noDateText = i18n.t("dates.noDate", { defaultValue: "No date" })

  const videoFilesByDate = media.reduce<Record<string, MediaFile[]>>((acc, file) => {
    // Форматируем дату с помощью универсального метода
    const date = file.startTime
      ? formatDateByLanguage(new Date(file.startTime * 1000), currentLanguage, {
          includeYear: true,
          longFormat: true,
        })
      : noDateText

    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(file)
    return acc
  }, {})

  return Object.entries(videoFilesByDate)
    .sort(([a], [b]) => {
      if (a === noDateText) return 1
      if (b === noDateText) return -1
      return new Date(b).getTime() - new Date(a).getTime()
    })
    .map(([date, files]) => ({ date, files }))
}

/**
 * Группирует файлы по базовому имени
 * @param files - Массив медиафайлов
 * @returns Объект с сгруппированными файлами
 */
export const getGroupedFiles = (files: MediaFile[]): Record<string, MediaFile[]> => {
  const groups: Record<string, MediaFile[]> = {}

  files.forEach((file) => {
    const match = /(.+?)(?:_(\d+))?\.([^.]+)$/.exec(file.name)
    if (match) {
      const baseName = match[1]
      if (!groups[baseName]) {
        groups[baseName] = []
      }
      groups[baseName].push(file)
    }
  })

  return Object.fromEntries(
    Object.entries(groups).map(([key, groupFiles]) => [
      key,
      groupFiles.sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0)),
    ]),
  )
}

/**
 * Находит дату с оставшимися файлами
 * @param sortedDates - Отсортированные даты с файлами
 * @param addedFiles - Множество уже добавленных файлов
 * @returns Объект с датой и оставшимися файлами или undefined
 */
export function getTopDateWithRemainingFiles(
  sortedDates: { date: string; files: MediaFile[] }[],
  addedFiles: Set<string>,
): { date: string; files: MediaFile[]; remainingFiles: MediaFile[] } | undefined {
  const isVideoWithAudio = (file: MediaFile): boolean => {
    const hasVideo = file.probeData?.streams.some((s) => s.codec_type === "video")
    return !!hasVideo
  }

  const datesByFileCount = [...sortedDates].sort((a, b) => {
    const aCount = a.files.filter((f) => !addedFiles.has(f.path) && isVideoWithAudio(f)).length
    const bCount = b.files.filter((f) => !addedFiles.has(f.path) && isVideoWithAudio(f)).length
    return bCount - aCount
  })

  const result = datesByFileCount
    .map((dateInfo) => ({
      ...dateInfo,
      remainingFiles: dateInfo.files.filter((file) => !addedFiles.has(file.path) && isVideoWithAudio(file)),
    }))
    .find((dateInfo) => dateInfo.remainingFiles.length > 0)

  return result
}

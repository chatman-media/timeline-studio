import type { MediaFile } from "@/domains/media-management"

/**
 * Проверяет, содержит ли файл аудиопоток
 * @param file - Медиафайл
 * @returns true, если файл содержит аудиопоток
 */
export function hasAudioStream(file: MediaFile): boolean {
  const hasAudio = file.probeData?.streams.some((stream) => stream.codec_type === "audio") ?? false
  return hasAudio
}

/**
 * Определяет тип медиафайла
 * @param file - Медиафайл
 * @returns "video" или "audio" или "image"
 */
export const getFileType = (file: MediaFile): "video" | "audio" | "image" => {
  const hasVideoStream = file.probeData?.streams.some((stream) => stream.codec_type === "video")
  if (file.isImage) return "image"
  if (hasVideoStream) return "video"
  return "audio"
}

/**
 * Подсчитывает количество оставшихся медиафайлов
 * @param media - Массив медиафайлов
 * @param addedFiles - Множество уже добавленных файлов
 * @returns Объект с количеством оставшихся видео и аудио файлов
 */
export function getRemainingMediaCounts(
  media: MediaFile[],
  addedFiles: Set<string>,
): {
  remainingVideoCount: number
  remainingAudioCount: number
  allFilesAdded: boolean
} {
  const remainingVideoCount = media.filter(
    (f) => getFileType(f) === "video" && f.path && !addedFiles.has(f.path) && hasAudioStream(f),
  ).length

  const remainingAudioCount = media.filter(
    (f) => getFileType(f) === "audio" && f.path && !addedFiles.has(f.path) && hasAudioStream(f),
  ).length

  // Файлы с аудио (видео и аудио файлы, исключаем изображения)
  const filesWithAudio = media.filter(hasAudioStream)

  // allFilesAdded = true только если есть хотя бы один файл И все файлы добавлены
  // ВАЖНО: .every() на пустом массиве возвращает true, поэтому нужна проверка filesWithAudio.length > 0
  const allFilesAdded =
    filesWithAudio.length > 0 && filesWithAudio.every((file) => file.path && addedFiles.has(file.path))

  return {
    remainingVideoCount,
    remainingAudioCount,
    allFilesAdded,
  }
}

/**
 * Определяет, является ли видео горизонтальным с учетом поворота
 * @param width - Ширина видео
 * @param height - Высота видео
 * @param rotation - Угол поворота (опционально)
 * @returns true если видео горизонтальное
 */
export function isHorizontalVideo(width: number, height: number, rotation?: number): boolean {
  // Если видео повернуто на 90 или 270 градусов, меняем местами ширину и высоту
  if (rotation === 90 || rotation === -90 || rotation === 270) {
    return width <= height
  }

  // Видео считается горизонтальным, если его ширина больше высоты
  return width > height
}

/**
 * Проверяет, пересекаются ли два временных интервала
 * @param start1 - Начало первого интервала
 * @param end1 - Конец первого интервала
 * @param start2 - Начало второго интервала
 * @param end2 - Конец второго интервала
 * @returns true, если интервалы пересекаются, иначе false
 */
export const doTimeRangesOverlap = (start1: number, end1: number, start2: number, end2: number): boolean => {
  // Добавим небольшой зазор (1 секунда) между видео, чтобы они не считались пересекающимися,
  // если конец одного видео совпадает с началом другого
  const overlapWithGap = start1 < end2 - 1 && start2 < end1 - 1

  // Проверяем, пересекаются ли временные интервалы
  // Если видео записаны в одно и то же время (с перекрытием), они должны быть на разных дорожках
  return overlapWithGap
}

import { useTranslation } from "react-i18next"

import type { MediaFile } from "@/features/media/types/media"
import { getAspectRatio, getFps } from "@/features/media/utils/video"
import { formatDuration, formatTimeWithMilliseconds } from "@/lib/date"
import { formatBitrate, formatFileSize } from "@/lib/utils"

interface FileMetadataProps {
  file: MediaFile
  size?: number
}

/**
 * Компонент для отображения метаданных файла
 *
 * @param file - Объект файла с метаданными
 * @param size - Размер контейнера в пикселях
 */
export const FileMetadata = function FileMetadata({ file, size = 100 }: FileMetadataProps) {
  const { i18n } = useTranslation()
  const videoStream = file.probeData?.streams.find((s) => s.codec_type === "video")

  return (
    <div className="grid w-full grid-rows-2 overflow-hidden" style={{ height: `${size}px` }}>
      <div className="flex w-full justify-between p-2">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
        {!file.isImage && file.probeData?.format.duration && (
          <p className="shrink-0 font-medium" style={{ fontSize: size > 100 ? "13px" : "12px" }}>
            {formatDuration(file.probeData.format.duration, 3, true)}
          </p>
        )}

        {file.isImage && file.createdAt && (
          <span className="shrink-0 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-200">
            {new Date(file.createdAt).toLocaleDateString(i18n.language === "en" ? "en-US" : "ru-RU", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        )}
      </div>

      {file.isVideo ? (
        <div className="flex w-full items-end p-2">
          <span className="shrink-0 text-xs whitespace-nowrap text-gray-700 dark:text-gray-200">
            {formatTimeWithMilliseconds(file.startTime ?? 0, true, true, false)}
          </span>

          <div className="ml-2 min-w-0 flex-1 overflow-hidden">
            <p className="flex items-center justify-between truncate text-xs">
              {videoStream && (
                <span>
                  <span className="ml-3 text-gray-700 dark:text-gray-200">
                    {videoStream.width}x{videoStream.height}
                  </span>
                  <span className="ml-3 text-gray-700 dark:text-gray-200">
                    {(((videoStream.width ?? 0) * (videoStream.height ?? 0)) / 1000000).toFixed(1)} MP
                  </span>
                  <span className="ml-3 text-gray-700 dark:text-gray-200">{getAspectRatio(videoStream)}</span>
                  <span className="ml-3 text-gray-700 dark:text-gray-200">
                    {formatBitrate(Number(videoStream.bit_rate))}
                  </span>
                  {getFps(videoStream) && (
                    <span className="ml-3 text-gray-700 dark:text-gray-200">{getFps(videoStream)} fps</span>
                  )}
                </span>
              )}
            </p>
          </div>

          {file.probeData?.format.size && (
            <p className="ml-2 shrink-0 text-xs whitespace-nowrap text-gray-700 dark:text-gray-200">
              {formatFileSize(file.probeData.format.size)}
            </p>
          )}
        </div>
      ) : (
        <div className="flex w-full items-end justify-end p-2">
          {file.probeData?.format.size && (
            <p className="shrink-0 text-xs whitespace-nowrap text-gray-700 dark:text-gray-200">
              {formatFileSize(file.probeData.format.size)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

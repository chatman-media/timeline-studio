import type { MediaFile } from "@timeline-studio/core/types"
import { useTranslation } from "react-i18next"
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

  // Для маленьких размеров (< 50px) показываем компактную версию в одну строку
  const isCompact = size < 50

  if (isCompact) {
    return (
      <div
        className="flex w-full items-center justify-between gap-2 overflow-hidden"
        style={{ height: `${size}px` }}
        data-oid="compact-metadata"
      >
        <p className="truncate text-xs font-medium text-gray-900 dark:text-gray-100" data-oid="compact-name">
          {file.name}
        </p>
        <div
          className="flex shrink-0 items-center gap-2 text-xs text-gray-700 dark:text-gray-200"
          data-oid="compact-info"
        >
          {!file.isImage && file.duration != null && file.duration > 0 && (
            <span data-oid="compact-duration">{formatDuration(file.duration, 3, true)}</span>
          )}
          {videoStream && (
            <span data-oid="compact-resolution">
              {videoStream.width}x{videoStream.height}
            </span>
          )}
          {file.probeData?.format.size && (
            <span data-oid="compact-size">{formatFileSize(file.probeData.format.size)}</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="grid w-full grid-rows-2 overflow-hidden" style={{ height: `${size}px` }} data-oid="k74eh-_">
      <div className="flex w-full justify-between p-2" data-oid="wcoshkw">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100" data-oid="kf-ri93">
          {file.name}
        </p>
        {!file.isImage && file.probeData?.format.duration && (
          <p className="shrink-0 font-medium" style={{ fontSize: size > 100 ? "13px" : "12px" }} data-oid="nfw8o2k">
            {formatDuration(file.probeData.format.duration, 3, true)}
          </p>
        )}

        {file.isImage && file.createdAt && (
          <span
            className="shrink-0 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-200"
            data-oid="l-gxdws"
          >
            {new Date(file.createdAt).toLocaleDateString(i18n.language === "en" ? "en-US" : "ru-RU", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        )}
      </div>

      {file.isVideo ? (
        <div className="flex w-full items-end p-2" data-oid="0rjgsiy">
          <span className="shrink-0 text-xs whitespace-nowrap text-gray-700 dark:text-gray-200" data-oid="r7xe2ax">
            {formatTimeWithMilliseconds(file.startTime ?? 0, true, true, false)}
          </span>

          <div className="ml-2 min-w-0 flex-1 overflow-hidden" data-oid="k6:xwmm">
            <p className="flex items-center justify-between truncate text-xs" data-oid=":69_6-8">
              {videoStream && (
                <span data-oid="upy.vlr">
                  <span className="ml-3 text-gray-700 dark:text-gray-200" data-oid="6j3:d3b">
                    {videoStream.width}x{videoStream.height}
                  </span>
                  <span className="ml-3 text-gray-700 dark:text-gray-200" data-oid="ove9g7f">
                    {(((videoStream.width ?? 0) * (videoStream.height ?? 0)) / 1000000).toFixed(1)} MP
                  </span>
                  <span className="ml-3 text-gray-700 dark:text-gray-200" data-oid="j8khu13">
                    {getAspectRatio(videoStream)}
                  </span>
                  <span className="ml-3 text-gray-700 dark:text-gray-200" data-oid="aijby8a">
                    {formatBitrate(Number(videoStream.bit_rate))}
                  </span>
                  {getFps(videoStream) && (
                    <span className="ml-3 text-gray-700 dark:text-gray-200" data-oid="tc8prr:">
                      {getFps(videoStream)} fps
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>

          {file.probeData?.format.size && (
            <p className="ml-2 shrink-0 text-xs whitespace-nowrap text-gray-700 dark:text-gray-200" data-oid="n6jr6zn">
              {formatFileSize(file.probeData.format.size)}
            </p>
          )}
        </div>
      ) : (
        <div className="flex w-full items-end justify-end p-2" data-oid="u-ui954">
          {file.probeData?.format.size && (
            <p className="shrink-0 text-xs whitespace-nowrap text-gray-700 dark:text-gray-200" data-oid="hdumlly">
              {formatFileSize(file.probeData.format.size)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

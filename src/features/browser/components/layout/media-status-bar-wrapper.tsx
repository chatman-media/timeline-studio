/**
 * Wrapper для StatusBar с интеграцией данных из браузера
 */

import { useMemo } from "react"
import type { MediaFile } from "@/domains/media-management"
import { useMediaManagement } from "@/domains/media-management"
import { useResources } from "@/domains/video-editing"
import { useBulkMediaActions } from "../../hooks/use-bulk-media-actions"
import { StatusBar } from "./status-bar"

export function MediaStatusBarWrapper() {
  const { mediaPool } = useMediaManagement()
  const { mediaResources, musicResources } = useResources()
  const { addAllVideoFiles, addAllAudioFiles, addDateFiles, addAllFiles } = useBulkMediaActions()

  // Преобразуем mediaPool в массив MediaFile
  const allMedia = useMemo(() => {
    return Array.from(mediaPool.entries()).map(([mediaId, mediaInfo]) => {
      // Получаем bitrate из метаданных если это видео
      const bitrate =
        mediaInfo.metadata?.type === "Video" || mediaInfo.metadata?.type === "Audio"
          ? mediaInfo.metadata.bitrate
          : undefined

      // Получаем codec из метаданных для video файлов
      const videoCodec =
        mediaInfo.metadata?.type === "Video" ? (mediaInfo.metadata as { codec?: string }).codec : undefined

      return {
        id: mediaId,
        path: mediaInfo.path,
        name: mediaInfo.name,
        videoCodec,
        startTime: Date.now() / 1000,
        size: bitrate && mediaInfo.duration ? Math.round((bitrate * mediaInfo.duration) / 8) : 0,
        duration: mediaInfo.duration ?? 0,
        thumbnailPath: mediaInfo.thumbnailPath,
        type: mediaInfo.type.toLowerCase(),
        isVideo: mediaInfo.type === "Video",
        isAudio: mediaInfo.type === "Audio",
        isImage: mediaInfo.type === "Image",
        isLoadingMetadata: false,
        proxy: mediaInfo.proxy,
        probeData: mediaInfo.metadata
          ? {
              format: {
                size: bitrate && mediaInfo.duration ? (bitrate * mediaInfo.duration) / 8 : 0,
                tags: {},
              },
              streams: videoCodec
                ? [
                    {
                      codec_type: "video" as const,
                      codec_name: videoCodec,
                      index: 0,
                    },
                  ]
                : [],
            }
          : undefined,
      } as MediaFile
    })
  }, [mediaPool])

  // Создаем Set путей добавленных файлов (только те что is_resource=true)
  // Включаем и mediaResources (видео/изображения) и musicResources (аудио)
  const addedFilesPaths = useMemo(() => {
    const allResourcePaths = [
      ...(mediaResources || []).map((r) => r.file.path),
      ...(musicResources || []).map((r) => r.file.path),
    ]
    return new Set(allResourcePaths)
  }, [mediaResources, musicResources])

  // Группируем файлы по датам для StatusBar
  const sortedDates = useMemo(() => {
    const dateGroups = new Map<string, MediaFile[]>()

    allMedia.forEach((file) => {
      if (!file.startTime) return

      const date = new Date(file.startTime * 1000)
      const dateKey = date.toISOString().split("T")[0]

      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, [])
      }
      dateGroups.get(dateKey)!.push(file)
    })

    return Array.from(dateGroups.entries())
      .map(([date, files]) => ({ date, files }))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [allMedia])

  // Обработчики для bulk операций
  const handleAddAllVideoFiles = async () => {
    await addAllVideoFiles(allMedia)
  }

  const handleAddAllAudioFiles = async () => {
    await addAllAudioFiles(allMedia)
  }

  const handleAddDateFiles = async (files: MediaFile[]) => {
    await addDateFiles(files)
  }

  const handleAddAllFiles = async () => {
    console.log("[MediaStatusBarWrapper] handleAddAllFiles called:", {
      allMediaCount: allMedia.length,
      addedFilesCount: addedFilesPaths.size,
      firstMedia: allMedia[0],
      mediaTypes: allMedia.reduce(
        (acc, f) => {
          const type = f.isVideo ? "video" : f.isAudio ? "audio" : f.isImage ? "image" : "unknown"
          acc[type] = (acc[type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    })
    await addAllFiles(allMedia)
  }

  return (
    <StatusBar
      media={allMedia}
      onAddAllVideoFiles={handleAddAllVideoFiles}
      onAddAllAudioFiles={handleAddAllAudioFiles}
      onAddDateFiles={handleAddDateFiles}
      onAddAllFiles={handleAddAllFiles}
      sortedDates={sortedDates}
      addedFilesPaths={addedFilesPaths}
      data-oid="media-status-bar"
    />
  )
}

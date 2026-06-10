import type { MediaFile } from "@timeline-studio/core/types"
import { Loader2 } from "lucide-react"
import { useEffect, useRef } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { AudioPreview } from "./audio-preview"
import { ImagePreview } from "./image-preview"
import { VideoPreview } from "./video-preview"

const logger = createLogger("MediaPreview")

interface MediaPreviewProps {
  file: MediaFile
  size?: number
  showFileName?: boolean
  dimensions?: [number, number]
  ignoreRatio?: boolean
}

/**
 * Предварительный просмотр медиафайла
 *
 * Функционал:
 * - Отображает превью медиафайла в зависимости от его типа
 * - Поддерживает различные размеры и форматы
 * - Опциональное отображение имени файла
 * - Кнопка добавления с состояниями (добавлено/не добавлено)
 * - Темная тема для UI элементов
 *
 * @param file - Объект медиафайла
 * @param size - Размер превью в пикселях (по умолчанию 200)
 * @param showFileName - Флаг для отображения имени файла
 * @param dimensions - Соотношение сторон контейнера [ширина, высота], по умолчанию [16, 9]
 * @param ignoreRatio - Флаг для игнорирования соотношения сторон (по умолчанию false)
 */
export function MediaPreview({
  file,
  size = 200,
  showFileName = false,
  dimensions = [16, 9],
  ignoreRatio = false,
}: MediaPreviewProps) {
  // Используем ref для отслеживания предыдущего состояния и избежания лишних логов
  const prevStateRef = useRef({ isLoadingMetadata: file.isLoadingMetadata, hasProbeData: !!file.probeData })

  // Логируем только при изменении состояния загрузки метаданных
  useEffect(() => {
    const currentState = { isLoadingMetadata: file.isLoadingMetadata, hasProbeData: !!file.probeData }
    const prevState = prevStateRef.current

    // Логируем только если состояние изменилось
    if (
      prevState.isLoadingMetadata !== currentState.isLoadingMetadata ||
      prevState.hasProbeData !== currentState.hasProbeData
    ) {
      logger.debug(
        `[MediaPreview] File ${file.name}: isLoadingMetadata=${file.isLoadingMetadata}, hasProbeData=${!!file.probeData}`,
      )
      prevStateRef.current = currentState
    }
  }, [file.name, file.isLoadingMetadata, file.probeData])

  // Если метаданные еще загружаются, показываем индикатор загрузки
  if (file.isLoadingMetadata) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center bg-gradient-to-br from-gray-900 to-black",
          ignoreRatio ? "w-full h-full" : "aspect-video",
        )}
        style={{
          width: ignoreRatio ? "100%" : `${((size * dimensions[0]) / dimensions[1]).toFixed(0)}px`,
          height: ignoreRatio ? "100%" : `${size}px`,
        }}
        data-oid="s.fjh-r"
      >
        <div className="flex flex-col items-center justify-center gap-3 px-4 text-center" data-oid="pkw2mz7">
          <Loader2 className="h-10 w-10 animate-spin text-blue-400" data-oid="2wxckbp" />
          <div className="flex flex-col gap-1" data-oid="o88oxxv">
            <div
              className="truncate text-sm font-medium text-white/90"
              style={{ maxWidth: "200px" }}
              data-oid="cw:-flz"
            >
              {file.name}
            </div>
            <div className="text-xs text-white/60 animate-pulse" data-oid="5tkfclb">
              Загрузка метаданных...
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (file.isVideo) {
    return (
      <VideoPreview
        file={file}
        size={size}
        showFileName={showFileName}
        dimensions={dimensions}
        ignoreRatio={ignoreRatio}
        data-oid="2104mx3"
      />
    )
  }

  if (file.isAudio) {
    return (
      <AudioPreview file={file} size={size} showFileName={showFileName} dimensions={dimensions} data-oid="81ow1v." />
    )
  }

  return <ImagePreview file={file} size={size} showFileName={showFileName} dimensions={dimensions} data-oid="qzevt5p" />
}

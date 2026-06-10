import type { MediaFile } from "@timeline-studio/core/types"
import { Play } from "lucide-react"
import { memo, useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { usePlayer } from "@/features/video-player"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"

const logger = createLogger("ApplyButton")

interface ApplyButtonProps {
  file: MediaFile
  size?: number
  hoverTime: number | null
}

/**
 * Кнопка для отправки медиа в плеер
 *
 * Функционал:
 * - Отображает кнопку для отправки видео/аудио в главный плеер
 * - При клике отправляет файл в плеер с выбранного фрагмента (hoverTime)
 * - Плавная анимация при наведении
 * - Темная тема для UI элементов
 *
 * @param file - Объект медиафайла
 * @param size - Размер кнопки (по умолчанию 150px)
 * @param hoverTime - Время начала воспроизведения (из hover состояния)
 */
export const ApplyButton = memo(function ApplyButton({ file, size = 150, hoverTime }: ApplyButtonProps) {
  const { t } = useTranslation()
  const [isHovering, setIsHovering] = useState(false)
  const { playerSetSource, playerSetMedia, setCurrentVideo, play } = usePlayer()

  const handleApply = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      logger.debugSync("Apply button clicked - sending to player", {
        fileName: file.name,
        fileId: file.id,
        hoverTime,
      })

      try {
        // Проверяем, что у файла есть id
        if (!file.id) {
          logger.errorSync("File has no ID, cannot send to player", {
            fileName: file.name,
            file,
          })
          return
        }

        // Устанавливаем медиа в локальное состояние плеера
        setCurrentVideo(file)

        logger.debugSync("Sending media to main player", {
          fileId: file.id,
          fileName: file.name,
          time: hoverTime || 0,
        })

        // Отправляем медиа в главный плеер через backend
        await playerSetSource("browser")
        await playerSetMedia(file.id, hoverTime || 0)
        await play()

        logger.infoSync("Media successfully sent to player", {
          fileName: file.name,
          fileId: file.id,
          time: hoverTime || 0,
        })
      } catch (error) {
        logger.errorSync("Error sending media to player", {
          error: String(error),
          fileName: file.name,
          fileId: file.id,
        })
      }
    },
    [file, hoverTime, playerSetSource, playerSetMedia, play, setCurrentVideo],
  )

  return (
    <button
      type="button"
      className={cn(
        "absolute z-2 left-1 bottom-1 cursor-pointer rounded-full p-1 transition-all duration-150 border-0 outline-none focus:ring-2 focus:ring-blue-500",
        "hidden", // Always hidden - кнопка не нужна
      )}
      style={{ color: "#ffffff" }}
      onClick={handleApply}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      title={t("browser.media.applyToPlayer")}
      data-oid="apply-btn"
    >
      <Play
        className={cn("transition-transform duration-150", isHovering && "scale-110")}
        strokeWidth={2}
        fill="#ffffff"
        style={{
          color: "#fff",
          height: `${6 + size / 30}px`,
          width: `${6 + size / 30}px`,
        }}
        data-oid="apply-icon"
      />
    </button>
  )
})

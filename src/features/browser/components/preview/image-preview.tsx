import { Image } from "lucide-react"
import { memo, useCallback, useEffect, useState } from "react"

import type { MediaFile } from "@/domains/media-management"
import type { TimelineResource } from "@/domains/shared/types/resources"
import { usePlayer } from "@/features/video-player"
import { createImageUrl } from "@/lib/media-url-utils"
import { createLogger } from "@/lib/tauri-logger"
import { checkFileAccess } from "@/lib/tauri-utils"

import { AddMediaButton } from "../layout/add-media-button"
import { FavoriteButton } from "../layout/favorite-button"

const logger = createLogger("ImagePreview")

interface ImagePreviewProps {
  file: MediaFile
  size?: number
  showFileName?: boolean
  dimensions?: [number, number]
}

/**
 * Предварительный просмотр изображения
 *
 * Функционал:
 * - Отображает превью изображения с поддержкой ленивой загрузки
 * - Автоматически определяет и показывает разрешение изображения после загрузки
 * - Настраиваемое соотношение сторон контейнера (по умолчанию 16:9)
 * - Поддерживает два размера UI (стандартный и большой при size > 100)
 * - Опциональное отображение имени файла
 * - Кнопка добавления с состояниями (добавлено/не добавлено)
 * - Темная тема для UI элементов
 *
 * @param file - Объект файла с путем и метаданными
 * @param size - Размер превью в пикселях (по умолчанию 60)
 * @param showFileName - Флаг для отображения имени файла
 * @param dimensions - Соотношение сторон контейнера [ширина, высота], по умолчанию [16, 9]
 */
export const ImagePreview = memo(function ImagePreview({
  file,
  size = 60,
  showFileName = false,
  dimensions = [16, 9],
}: ImagePreviewProps) {
  const { playerSetSource, playerSetMedia } = usePlayer()

  const calculateWidth = (): number => {
    const [width, height] = dimensions
    return (size * width) / height
  }

  // Состояние для хранения объекта URL
  const [imageUrl, setImageUrl] = useState<string>("")

  // Функция для получения URL изображения без загрузки в память
  const loadImageFile = useCallback(async (path: string) => {
    // Проверяем расширение файла - отклоняем видео и аудио форматы
    const extension = path.split(".").pop()?.toLowerCase()
    const videoExtensions = ["mp4", "mov", "avi", "mkv", "webm", "m4v", "flv", "wmv", "mpg", "mpeg"]
    const audioExtensions = ["mp3", "wav", "ogg", "m4a", "flac", "aac", "wma"]

    if (extension && (videoExtensions.includes(extension) || audioExtensions.includes(extension))) {
      logger.warnSync("Попытка загрузить видео/аудио файл как изображение", {
        path,
        extension,
      })
      // Возвращаем пустую строку, чтобы показать fallback иконку
      return ""
    }

    // Проверяем существование файла
    const fileExists = await checkFileAccess(path)
    if (!fileExists) {
      logger.warnSync("Файл не существует", { path })
      return ""
    }

    // Используем унифицированную утилиту для создания image URL
    const imageUrl = createImageUrl(path)
    logger.debugSync("[ImagePreview] Created image URL", {
      original: path,
      imageUrl,
      isAsset: imageUrl.startsWith("asset://"),
    })
    return imageUrl
  }, [])

  // Эффект для загрузки изображения при монтировании компонента
  useEffect(() => {
    let isMounted = true
    logger.debugSync("Монтирование ImagePreview", {
      fileName: file.name,
      filePath: file.path,
    })

    void loadImageFile(file.path).then((url) => {
      if (isMounted) {
        setImageUrl(url)
        logger.debugSync("URL изображения установлен", {
          url,
          fileName: file.name,
        })
      }
    })

    // Cleanup при размонтировании компонента
    return () => {
      isMounted = false
      logger.debugSync("Размонтирование ImagePreview", { fileName: file.name })
    }
  }, [file.path, file.name, loadImageFile])

  // Обработчик клика для отправки изображения в плеер
  const handleImageClick = useCallback(async () => {
    try {
      logger.debugSync("Клик по изображению", {
        fileName: file.name,
        fileId: file.id,
      })

      // Проверяем, что у файла есть id
      if (!file.id) {
        logger.errorSync("У файла нет ID", { fileName: file.name, file })
        return
      }

      logger.debugSync("Отправляем изображение в главный плеер", {
        fileId: file.id,
        fileName: file.name,
      })
      await playerSetSource("browser")
      await playerSetMedia(file.id, 0)

      logger.infoSync("Изображение успешно отправлено в плеер", {
        fileName: file.name,
        fileId: file.id,
      })
    } catch (error) {
      logger.errorSync("Ошибка отправки изображения в плеер", {
        error: String(error),
        fileName: file.name,
        fileId: file.id,
      })
    }
  }, [file, playerSetSource, playerSetMedia])

  return (
    <div
      className="group relative h-full shrink-0 cursor-pointer"
      style={{ height: `${size}px`, width: `${calculateWidth().toFixed(0)}px` }}
      onClick={handleImageClick}
    >
      {showFileName && (
        <div
          className={`absolute font-medium ${size > 100 ? "top-1 left-1" : "top-0.5 left-0.5"} ${size > 100 ? "px-1 py-0.5" : "px-0.5 py-0"} line-clamp-1 max-w-[calc(60%)] rounded-xs bg-black/50 text-xs leading-4`}
          style={{
            fontSize: size > 100 ? "13px" : "11px",
            color: "#fff", // Явно задаем чисто белый цвет для Tauri
          }}
        >
          {file.name}
        </div>
      )}
      <div className="relative flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
        <img
          src={imageUrl || undefined}
          alt={file.name}
          className="h-full w-full object-contain"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement

            // Если src пустой (видео/аудио файл), просто скрываем без логирования ошибки
            if (!target.src || target.src === window.location.href) {
              target.style.display = "none"
              logger.debugSync("Пустой src для изображения (вероятно видео/аудио файл)", {
                fileName: file.name,
              })

              // Показываем fallback иконку
              const parent = target.parentElement
              if (parent && !parent.querySelector(".fallback-icon")) {
                const fallbackDiv = document.createElement("div")
                fallbackDiv.className = "fallback-icon absolute inset-0 flex items-center justify-center"
                fallbackDiv.innerHTML = `<svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>`
                parent.appendChild(fallbackDiv)
                logger.debugSync("Fallback иконка добавлена", {
                  fileName: file.name,
                })
              }
              return
            }

            // Извлекаем данные из события сразу (до event pooling)
            const errorInfo = {
              src: target.src,
              fileName: file.name,
              filePath: file.path,
              eventType: e.type,
              naturalWidth: target.naturalWidth,
              naturalHeight: target.naturalHeight,
              currentSrc: target.currentSrc,
            }
            logger.errorSync("Ошибка загрузки изображения в img элементе", errorInfo)
            // Заменяем на иконку при ошибке
            target.style.display = "none"
            logger.debugSync("Скрываем img элемент и показываем fallback иконку", { fileName: file.name })

            // Показываем fallback иконку
            const parent = target.parentElement
            if (parent && !parent.querySelector(".fallback-icon")) {
              const fallbackDiv = document.createElement("div")
              fallbackDiv.className = "fallback-icon absolute inset-0 flex items-center justify-center"
              fallbackDiv.innerHTML = `<svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>`
              parent.appendChild(fallbackDiv)
              logger.debugSync("Fallback иконка добавлена", {
                fileName: file.name,
              })
            }
          }}
        />
      </div>
      <div
        className={`absolute ${size > 100 ? "bottom-1 left-1" : "bottom-0.5 left-0.5"} cursor-pointer rounded-xs bg-black/50 p-0.5`}
        style={{
          color: "#fff", // Явно задаем чисто белый цвет для Tauri
        }}
      >
        <Image size={size > 100 ? 16 : 12} />
      </div>
      <FavoriteButton file={file} size={size} type="media" />
      <AddMediaButton resource={{ id: file.id, type: "media" } as TimelineResource} size={size} type="media" />
    </div>
  )
})

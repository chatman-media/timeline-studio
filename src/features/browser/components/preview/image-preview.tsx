// import { convertFileSrc } from "@tauri-apps/api/core"

import { readFile } from "@tauri-apps/plugin-fs"
import { Image } from "lucide-react"
import { memo, useCallback, useEffect, useRef, useState } from "react"

import type { MediaFile } from "@/features/media/types/media"
import type { TimelineResource } from "@/features/resources/types"
import { usePlayer } from "@/features/video-player"
import { createLogger } from "@/lib/tauri-logger"
import { checkFileAccess, convertToAssetUrl } from "@/lib/tauri-utils"

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
  // Ref для отслеживания текущего blob URL который нужно очистить
  const blobUrlRef = useRef<string | null>(null)

  // Функция для чтения файла и создания объекта URL
  const loadImageFile = useCallback(async (path: string) => {
    try {
      logger.debugSync("Начинаем загрузку изображения", { path })

      // Проверяем расширение файла - отклоняем видео и аудио форматы
      const extension = path.split(".").pop()?.toLowerCase()
      const videoExtensions = ["mp4", "mov", "avi", "mkv", "webm", "m4v", "flv", "wmv", "mpg", "mpeg"]
      const audioExtensions = ["mp3", "wav", "ogg", "m4a", "flac", "aac", "wma"]

      if (extension && (videoExtensions.includes(extension) || audioExtensions.includes(extension))) {
        logger.warnSync("Попытка загрузить видео/аудио файл как изображение", { path, extension })
        // Возвращаем пустую строку, чтобы показать fallback иконку
        return ""
      }

      // Сначала проверяем существование файла
      const fileExists = await checkFileAccess(path)
      if (!fileExists) {
        logger.warnSync("Файл не существует", { path })
        const assetUrl = convertToAssetUrl(path)
        logger.debugSync("Используем asset URL для несуществующего файла", { assetUrl })
        return assetUrl
      }

      logger.debugSync("Чтение файла через readFile", { path })
      const fileData = await readFile(path)
      logger.debugSync("Файл успешно прочитан", { path, dataSize: fileData.length })

      // Определяем MIME тип по расширению
      const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        svg: "image/svg+xml",
        bmp: "image/bmp",
        tiff: "image/tiff",
        tif: "image/tiff",
      }
      const mimeType = mimeTypes[extension || ""] || "image/jpeg"

      const blob = new Blob([fileData as BlobPart], { type: mimeType })
      const url = URL.createObjectURL(blob)
      logger.infoSync("Создан blob URL для изображения", { path, blobUrl: url, mimeType, extension })
      return url
    } catch (error) {
      logger.errorSync("Ошибка при загрузке изображения", {
        error: String(error),
        message: error instanceof Error ? error.message : String(error),
        path,
        stack: error instanceof Error ? error.stack : undefined,
      })
      // В случае ошибки используем convertToAssetUrl
      const assetUrl = convertToAssetUrl(path)
      logger.debugSync("Используем fallback asset URL после ошибки", { assetUrl, originalPath: path })
      return assetUrl
    }
  }, [])

  // Эффект для загрузки изображения при монтировании компонента
  useEffect(() => {
    let isMounted = true
    logger.debugSync("Монтирование ImagePreview", { fileName: file.name, filePath: file.path })

    void loadImageFile(file.path).then((url) => {
      if (isMounted) {
        // Очищаем предыдущий blob URL если он есть
        if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
          logger.debugSync("Очищаем предыдущий blob URL", { oldUrl: blobUrlRef.current })
          URL.revokeObjectURL(blobUrlRef.current)
        }
        // Сохраняем новый URL в ref
        const isBlob = url.startsWith("blob:")
        blobUrlRef.current = isBlob ? url : null
        setImageUrl(url)
        logger.debugSync("URL изображения установлен", { url, isBlob, fileName: file.name })
      }
    })

    // Очистка объекта URL при размонтировании компонента или смене файла
    return () => {
      isMounted = false
      if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
        logger.debugSync("Размонтирование ImagePreview - очистка blob URL", {
          blobUrl: blobUrlRef.current,
          fileName: file.name,
        })
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [file.path, file.name, loadImageFile])

  // Обработчик клика для отправки изображения в плеер
  const handleImageClick = useCallback(async () => {
    try {
      logger.debugSync("Клик по изображению", { fileName: file.name, fileId: file.id })

      // Проверяем, что у файла есть id
      if (!file.id) {
        logger.errorSync("У файла нет ID", { fileName: file.name, file })
        return
      }

      logger.debugSync("Отправляем изображение в главный плеер", { fileId: file.id, fileName: file.name })
      await playerSetSource("browser")
      await playerSetMedia(file.id, 0)

      logger.infoSync("Изображение успешно отправлено в плеер", { fileName: file.name, fileId: file.id })
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
      className="group relative h-full flex-shrink-0 cursor-pointer"
      style={{ height: `${size}px`, width: `${calculateWidth().toFixed(0)}px` }}
      onClick={handleImageClick}
    >
      {showFileName && (
        <div
          className={`absolute font-medium ${size > 100 ? "top-1 left-1" : "top-0.5 left-0.5"} ${size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"} line-clamp-1 max-w-[calc(60%)] rounded-xs bg-black/50 text-xs leading-[16px]`}
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
          src={imageUrl || convertToAssetUrl(file.path)}
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
                logger.debugSync("Fallback иконка добавлена", { fileName: file.name })
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
              logger.debugSync("Fallback иконка добавлена", { fileName: file.name })
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

// import { convertFileSrc } from "@tauri-apps/api/core"

import { readFile } from "@tauri-apps/plugin-fs"
import { Image } from "lucide-react"
import { memo, useCallback, useEffect, useRef, useState } from "react"

import type { MediaFile } from "@/features/media/types/media"
import type { TimelineResource } from "@/features/resources/types"
import { usePlayer } from "@/features/video-player"
import { checkFileAccess, convertToAssetUrl } from "@/lib/tauri-utils"

import { AddMediaButton } from "../layout/add-media-button"
import { FavoriteButton } from "../layout/favorite-button"

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
      // Сначала проверяем существование файла
      const fileExists = await checkFileAccess(path)
      if (!fileExists) {
        console.warn("[ImagePreview] Файл не существует:", path)
        return convertToAssetUrl(path)
      }

      console.log("[ImagePreview] Чтение файла через readFile:", path)
      const fileData = await readFile(path)

      // Определяем MIME тип по расширению
      const extension = path.split(".").pop()?.toLowerCase()
      const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        svg: "image/svg+xml",
      }
      const mimeType = mimeTypes[extension || ""] || "image/jpeg"

      const blob = new Blob([fileData as BlobPart], { type: mimeType })
      const url = URL.createObjectURL(blob)
      console.log("[ImagePreview] Создан объект URL:", url)
      return url
    } catch (error) {
      console.error("[ImagePreview] Ошибка при загрузке изображения:", {
        error,
        message: error instanceof Error ? error.message : String(error),
        path,
        stack: error instanceof Error ? error.stack : undefined,
      })
      // В случае ошибки используем convertToAssetUrl
      const assetUrl = convertToAssetUrl(path)
      console.log("[ImagePreview] Используем fallback asset URL:", assetUrl)
      return assetUrl
    }
  }, [])

  // Эффект для загрузки изображения при монтировании компонента
  useEffect(() => {
    let isMounted = true

    void loadImageFile(file.path).then((url) => {
      if (isMounted) {
        // Очищаем предыдущий blob URL если он есть
        if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
          URL.revokeObjectURL(blobUrlRef.current)
        }
        // Сохраняем новый URL в ref
        blobUrlRef.current = url.startsWith("blob:") ? url : null
        setImageUrl(url)
      }
    })

    // Очистка объекта URL при размонтировании компонента или смене файла
    return () => {
      isMounted = false
      if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [file.path, loadImageFile])

  // Обработчик клика для отправки изображения в плеер
  const handleImageClick = useCallback(async () => {
    try {
      // Проверяем, что у файла есть id
      if (!file.id) {
        console.error("[ImagePreview] File has no id:", file)
        return
      }

      await playerSetSource("browser")
      await playerSetMedia(file.id, 0)

      console.log(`[ImagePreview] Image sent to main player: ${file.name}`)
    } catch (error) {
      console.error("[ImagePreview] Failed to send image to main player:", error)
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
            console.error("[ImagePreview] Ошибка загрузки изображения:", errorInfo)
            // Заменяем на иконку при ошибке
            target.style.display = "none"

            // Показываем fallback иконку
            const parent = target.parentElement
            if (parent && !parent.querySelector(".fallback-icon")) {
              const fallbackDiv = document.createElement("div")
              fallbackDiv.className = "fallback-icon absolute inset-0 flex items-center justify-center"
              fallbackDiv.innerHTML = `<svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>`
              parent.appendChild(fallbackDiv)
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

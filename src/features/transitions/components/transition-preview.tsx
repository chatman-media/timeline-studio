import { useDraggable } from "@dnd-kit/core"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { type MediaFile, MediaType } from "@/domains/media-management"
import type { TransitionResource } from "@/domains/shared/types/resources"
import { ApplyButton } from "@/features/browser"
import { AddMediaButton } from "@/features/browser/components/layout/add-media-button"
import { FavoriteButton } from "@/features/browser/components/layout/favorite-button"
import { useProjectSettings } from "@/features/project-settings/hooks/use-project-settings"
import type { Transition } from "@/features/transitions/types/transitions"
import { createLogger } from "@/lib/tauri-logger"

import { useTransitions } from "../hooks/use-transitions"

const logger = createLogger("TransitionPreview")

/**
 * Интерфейс пропсов для компонента TransitionPreview
 */
interface TransitionPreviewProps {
  transition?: Transition
  sourceVideo: MediaFile
  targetVideo: MediaFile
  transitionType: string
  onClick: () => void
  size: number
  previewWidth?: number
  previewHeight?: number
}

/**
 * Компонент для отображения превью перехода между видео
 * Показывает анимированный переход между двумя видео и позволяет добавить переход в проект
 */
export function TransitionPreview({
  transition,
  sourceVideo,
  targetVideo,
  transitionType,
  onClick,
  size,
  previewWidth,
  previewHeight,
}: TransitionPreviewProps) {
  const { t } = useTranslation() // Хук для интернационализации
  const { settings } = useProjectSettings() // Получаем настройки проекта

  const [isHovering, setIsHovering] = useState(false) // Состояние наведения мыши
  const [isError, setIsError] = useState(false) // Состояние ошибки загрузки видео
  const [isVisible, setIsVisible] = useState(false) // Видим ли элемент на экране
  const containerRef = useRef<HTMLDivElement>(null) // Ссылка на контейнер для Intersection Observer

  // Ссылки на элементы видео и таймеры
  const sourceVideoRef = useRef<HTMLVideoElement>(null) // Ссылка на исходное видео
  const targetVideoRef = useRef<HTMLVideoElement>(null) // Ссылка на целевое видео
  const transitionTimeoutRef = useRef<NodeJS.Timeout>(null) // Таймер для запуска перехода
  const loopTimeoutRef = useRef<NodeJS.Timeout>(null) // Таймер для зацикливания демонстрации

  // Получаем переходы из хука
  const { transitions } = useTransitions()

  // Получаем переход из пропсов или находим по типу
  const currentTransition =
    transition || transitions.find((t: Transition) => t.id === transitionType || t.type === transitionType)

  // Настраиваем drag & drop
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `transition-${currentTransition?.id || transitionType}`,
    data: {
      type: "transition",
      data: currentTransition || {
        id: transitionType,
        type: transitionType,
        labels: { ru: transitionType, en: transitionType },
        category: "basic",
        complexity: "basic",
        duration: { min: 0.5, max: 2.0, default: 1.0 },
      },
    },
  })

  // Вычисляем размеры превью с учетом aspect ratio проекта
  const { actualWidth, actualHeight } = useMemo(() => {
    // Если переданы конкретные размеры, используем их
    if (previewWidth && previewHeight) {
      return { actualWidth: previewWidth, actualHeight: previewHeight }
    }

    // Получаем пропорции из настроек проекта
    const projectAspectRatio = settings?.aspectRatio?.value
    const aspectWidth = projectAspectRatio?.width ?? 16
    const aspectHeight = projectAspectRatio?.height ?? 9
    const ratio = aspectWidth / aspectHeight

    // Рассчитываем размеры с учетом пропорций проекта
    const calculatedHeight = size
    const calculatedWidth = Math.round(calculatedHeight * ratio)

    return { actualWidth: calculatedWidth, actualHeight: calculatedHeight }
  }, [previewWidth, previewHeight, size, settings])

  // Мемоизируем объекты для кнопок
  const favoriteFile = useMemo(
    () => ({
      id: currentTransition?.id || transitionType,
      path: "",
      name: currentTransition?.labels?.ru || transitionType,
      type: MediaType.Unknown,
    }),
    [currentTransition?.id, currentTransition?.labels?.ru, transitionType],
  )

  // Функция для получения индикатора сложности
  const getComplexityIndicator = (complexity: string) => {
    switch (complexity) {
      case "basic":
        return { color: "bg-green-500", label: "BSC" }
      case "intermediate":
        return { color: "bg-yellow-500", label: "INT" }
      case "advanced":
        return { color: "bg-red-500", label: "ADV" }
      default:
        return { color: "bg-gray-500", label: "UNK" }
    }
  }

  // Функция для получения индикатора категории
  const getCategoryIndicator = (category: string) => {
    switch (category) {
      case "basic":
        return "BSC"
      case "advanced":
        return "ADV"
      case "creative":
        return "CRE"
      case "3d":
        return "3D"
      case "artistic":
        return "ART"
      case "cinematic":
        return "CIN"
      default:
        return "UNK"
    }
  }

  const complexityIndicator = useMemo(
    () => getComplexityIndicator(currentTransition?.complexity || "basic"),
    [currentTransition?.complexity],
  )
  const categoryIndicator = useMemo(
    () => getCategoryIndicator(currentTransition?.category || "basic"),
    [currentTransition?.category],
  )

  /**
   * Сбрасывает состояние видео элементов к начальному
   * Устанавливает время воспроизведения на начало и сбрасывает все CSS-стили
   */
  const resetVideos = useCallback(() => {
    if (!sourceVideoRef.current || !targetVideoRef.current) return

    const sourceVideo = sourceVideoRef.current
    const targetVideo = targetVideoRef.current

    // Сбрасываем время воспроизведения
    sourceVideo.currentTime = 0
    targetVideo.currentTime = 0

    // Сброс всех возможных стилей для исходного видео
    sourceVideo.style.transform = "scale(1)"
    sourceVideo.style.opacity = "1"
    sourceVideo.style.filter = "blur(0px) wave(0, 0%, 0%)"
    sourceVideo.style.clipPath = "none"
    sourceVideo.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
    sourceVideo.style.mixBlendMode = "normal"

    // Сброс всех возможных стилей для целевого видео
    targetVideo.style.opacity = "0" // Целевое видео изначально скрыто
    targetVideo.style.transform = "scale(1)"
    targetVideo.style.filter = "blur(0px)"
    targetVideo.style.clipPath = "none"
    targetVideo.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
    targetVideo.style.mixBlendMode = "normal"
  }, [])

  /**
   * Безопасно воспроизводит видео, игнорируя AbortError
   * AbortError возникает когда play() прерывается pause() или сменой src
   */
  const safePlay = useCallback((video: HTMLVideoElement) => {
    video.play().catch((error) => {
      // Игнорируем AbortError - это нормальное поведение при быстром hover/unhover
      if (error.name === "AbortError") {
        return
      }
      // Логируем другие ошибки
      logger.warn("Video play error", { error: String(error) })
    })
  }, [])

  /**
   * Запускает анимацию перехода между видео
   * Сначала показывает исходное видео, затем применяет эффект перехода и показывает целевое видео
   */
  const startTransition = useCallback(() => {
    if (!sourceVideoRef.current || !targetVideoRef.current || isError) return

    const sourceVideo = sourceVideoRef.current
    const targetVideo = targetVideoRef.current

    // Сбрасываем состояние видео перед началом перехода
    resetVideos()
    // Запускаем воспроизведение исходного видео
    safePlay(sourceVideo)

    // Устанавливаем таймер для начала перехода через 1 секунду
    transitionTimeoutRef.current = setTimeout(() => {
      // Показываем целевое видео
      targetVideo.style.opacity = "1"

      // Применяем соответствующий эффект перехода в зависимости от типа
      switch (transitionType) {
        case "zoom":
          // Эффект увеличения: исходное видео увеличивается и исчезает
          sourceVideo.style.transform = "scale(2)"
          sourceVideo.style.opacity = "0"
          break

        case "fade":
          // Эффект затухания: исходное видео плавно исчезает
          sourceVideo.style.opacity = "0"
          break

        case "slide":
          // Эффект слайда: исходное видео уезжает влево
          sourceVideo.style.transform = "translateX(-100%)"
          break

        case "scale":
          // Эффект масштабирования: исходное видео уменьшается и исчезает
          sourceVideo.style.transform = "scale(0.1)"
          sourceVideo.style.opacity = "0"
          targetVideo.style.transform = "scale(1)"
          break

        case "rotate":
          // Эффект вращения: исходное видео вращается и уменьшается
          sourceVideo.style.transform = "rotate(180deg) scale(0.5)"
          sourceVideo.style.opacity = "0"
          targetVideo.style.transform = "rotate(0deg) scale(1)"
          break

        case "flip":
          // Эффект переворота: исходное видео переворачивается по оси Y
          sourceVideo.style.transform = "rotateY(180deg)"
          sourceVideo.style.opacity = "0"
          targetVideo.style.transform = "rotateY(0deg)"
          break

        case "push":
          // Эффект выталкивания: исходное видео выталкивается влево
          sourceVideo.style.transform = "translateX(-100%)"
          targetVideo.style.transform = "translateX(0%)"
          targetVideo.style.transition = "transform 1s ease-in-out"
          break

        case "squeeze":
          // Эффект сжатия: исходное видео сжимается по горизонтали
          sourceVideo.style.transform = "scaleX(0)"
          sourceVideo.style.opacity = "0"
          break

        case "diagonal":
          // Эффект диагонали: исходное видео уходит по диагонали
          sourceVideo.style.transform = "translate(-100%, -100%)"
          sourceVideo.style.opacity = "0"
          break

        case "spiral":
          // Эффект спирали: исходное видео вращается и уменьшается
          sourceVideo.style.transform = "rotate(720deg) scale(0)"
          sourceVideo.style.opacity = "0"
          break

        case "fold":
          // Эффект складывания: исходное видео складывается как страница
          sourceVideo.style.transform = "perspective(500px) rotateX(90deg)"
          sourceVideo.style.opacity = "0"
          break

        case "wave":
          // Эффект волны: исходное видео искажается волной и исчезает
          sourceVideo.style.transform = "scale(1.5)"
          sourceVideo.style.filter = "wave(16, 50%, 50%)"
          sourceVideo.style.opacity = "0"
          break

        case "shutter":
          // Эффект шторки: исходное видео закрывается шторкой
          sourceVideo.style.clipPath = "inset(0 50% 0 50%)"
          sourceVideo.style.opacity = "0"
          break

        case "bounce":
          // Эффект отскока: исходное видео уменьшается с эффектом пружины
          sourceVideo.style.transform = "scale(0)"
          sourceVideo.style.opacity = "0"
          sourceVideo.style.transition = "all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)"
          break

        case "swirl":
          // Эффект вихря: исходное видео вращается быстрее и исчезает
          sourceVideo.style.transform = "rotate(1080deg) scale(0)"
          sourceVideo.style.opacity = "0"
          sourceVideo.style.transition = "all 1s cubic-bezier(0.4, 0, 0.2, 1)"
          break

        case "dissolve":
          // Эффект растворения: исходное и целевое видео смешиваются
          sourceVideo.style.mixBlendMode = "multiply"
          targetVideo.style.mixBlendMode = "screen"
          sourceVideo.style.opacity = "0"
          break

        // 3D эффекты
        case "cube-3d":
          // Эффект 3D куба: вращение как грани куба
          sourceVideo.style.transform = "perspective(1000px) rotateY(-90deg) translateZ(200px)"
          sourceVideo.style.opacity = "0"
          targetVideo.style.transform = "perspective(1000px) rotateY(0deg) translateZ(0)"
          break

        case "page-turn":
          // Эффект переворота страницы
          sourceVideo.style.transform = "perspective(1000px) rotateY(-180deg)"
          sourceVideo.style.transformOrigin = "right center"
          sourceVideo.style.opacity = "0"
          break

        case "shatter":
          // Эффект разбития стекла
          sourceVideo.style.transform = "scale(1.2)"
          sourceVideo.style.filter = "blur(4px)"
          sourceVideo.style.opacity = "0"
          break

        // Дополнительные эффекты из JSON
        case "wipe-horizontal":
          sourceVideo.style.clipPath = "inset(0 100% 0 0)"
          break

        case "wipe-vertical":
          sourceVideo.style.clipPath = "inset(100% 0 0 0)"
          break

        case "wipe-diagonal":
          sourceVideo.style.clipPath = "polygon(0 0, 0 0, 0 100%, 0 100%)"
          break

        case "radial-wipe":
          sourceVideo.style.clipPath = "circle(0% at 50% 50%)"
          break

        case "ripple":
          sourceVideo.style.filter = "blur(8px)"
          sourceVideo.style.transform = "scale(1.1)"
          sourceVideo.style.opacity = "0"
          break

        case "pixelize":
          sourceVideo.style.imageRendering = "pixelated"
          sourceVideo.style.transform = "scale(0.1) scale(10)"
          sourceVideo.style.opacity = "0"
          break

        case "morph":
          sourceVideo.style.filter = "blur(10px)"
          sourceVideo.style.transform = "scale(0.8)"
          sourceVideo.style.opacity = "0"
          break

        case "glitch":
          sourceVideo.style.filter = "hue-rotate(90deg) saturate(2)"
          sourceVideo.style.transform = "translateX(5px) translateY(-5px)"
          sourceVideo.style.opacity = "0"
          break

        case "kaleidoscope":
          sourceVideo.style.transform = "rotate(180deg) scale(0.5)"
          sourceVideo.style.filter = "hue-rotate(180deg)"
          sourceVideo.style.opacity = "0"
          break

        case "burn":
          sourceVideo.style.filter = "brightness(2) contrast(2) sepia(1)"
          sourceVideo.style.opacity = "0"
          break

        case "blinds":
          sourceVideo.style.clipPath =
            "repeating-linear-gradient(0deg, transparent 0px, transparent 10px, black 10px, black 20px)"
          sourceVideo.style.opacity = "0"
          break

        case "iris":
          sourceVideo.style.clipPath = "circle(0% at 50% 50%)"
          targetVideo.style.clipPath = "circle(100% at 50% 50%)"
          break

        case "zoom-blur":
          sourceVideo.style.filter = "blur(20px)"
          sourceVideo.style.transform = "scale(2)"
          sourceVideo.style.opacity = "0"
          break

        case "tv-static":
          sourceVideo.style.filter = "contrast(100) grayscale(1)"
          sourceVideo.style.opacity = "0"
          break

        default:
          // Неизвестный тип перехода, используем fade по умолчанию
          sourceVideo.style.opacity = "0"
          break
      }

      // Запускаем воспроизведение целевого видео
      safePlay(targetVideo)

      // Устанавливаем таймер для повторения перехода через 2 секунды
      loopTimeoutRef.current = setTimeout(() => {
        if (isHovering) {
          startTransition() // Повторяем переход, если курсор все еще наведен
        }
      }, 2000)
    }, 1000)
  }, [isHovering, transitionType, isError, safePlay]) // safePlay стабильный, не вызывает лишних ре-рендеров

  /**
   * Intersection Observer для ленивой загрузки видео
   */
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting)
        })
      },
      {
        rootMargin: "100px", // Начинаем загрузку за 100px до появления в viewport
        threshold: 0.1,
      },
    )

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  /**
   * Эффект для инициализации видео и обработки ошибок
   */
  useEffect(() => {
    if (!sourceVideoRef.current || !targetVideoRef.current) {
      logger.warn("Video elements not found", { transitionType })
      return
    }

    // Загружаем видео только когда элемент становится видимым
    if (!isVisible) return

    const sourceVideoElement = sourceVideoRef.current
    const targetVideoElement = targetVideoRef.current

    // Функция обработки ошибок загрузки видео
    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement
      const errorInfo = {
        transition: transitionType,
        src: target.src,
        error: target.error,
        networkState: target.networkState,
        readyState: target.readyState,
      }
      logger.error("Video load error", errorInfo)

      // Дополнительная информация об ошибке
      if (target.error) {
        const errorMessages: Record<number, string> = {
          [target.error.MEDIA_ERR_ABORTED]: "Video load aborted",
          [target.error.MEDIA_ERR_NETWORK]: "Network error loading video",
          [target.error.MEDIA_ERR_DECODE]: "Video decode error",
          [target.error.MEDIA_ERR_SRC_NOT_SUPPORTED]: "Video format not supported or file not found",
        }
        const message = errorMessages[target.error.code] || `Unknown video error: code ${target.error.code}`
        logger.error(message, { errorCode: target.error.code })
      }

      setIsError(true)
    }

    // Функция обработки успешной загрузки
    const handleLoadedData = () => {
      // Видео успешно загружено
    } // Добавляем обработчики событий для обоих видео
    sourceVideoElement.addEventListener("error", handleError)
    targetVideoElement.addEventListener("error", handleError)
    sourceVideoElement.addEventListener("loadeddata", handleLoadedData)
    targetVideoElement.addEventListener("loadeddata", handleLoadedData)

    // Сбрасываем видео к начальному состоянию, но НЕ запускаем автоматически
    resetVideos()
    // Устанавливаем первый кадр как превью
    sourceVideoElement.currentTime = 0
    targetVideoElement.currentTime = 0

    // Функция очистки при размонтировании компонента
    return () => {
      // Удаляем обработчики событий
      sourceVideoElement.removeEventListener("error", handleError)
      targetVideoElement.removeEventListener("error", handleError)
      sourceVideoElement.removeEventListener("loadeddata", handleLoadedData)
      targetVideoElement.removeEventListener("loadeddata", handleLoadedData)
      // Очищаем таймеры
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)
    }
  }, [isVisible]) // Перезапускаем когда элемент становится видимым

  /**
   * Эффект для управления переходами при наведении
   */
  useEffect(() => {
    if (isHovering) {
      // Если курсор наведен - запускаем переход
      startTransition()
    } else {
      // Если курсор не наведен - сбрасываем к исходному состоянию
      resetVideos()
      // Останавливаем все видео и показываем первый кадр
      if (sourceVideoRef.current) {
        sourceVideoRef.current.pause()
        sourceVideoRef.current.currentTime = 0
      }
      if (targetVideoRef.current) {
        targetVideoRef.current.pause()
        targetVideoRef.current.currentTime = 0
      }
      // Очищаем таймеры
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)
    }
  }, [isHovering]) // Убираем функции из зависимостей

  return (
    <div
      ref={(node) => {
        setNodeRef(node)
        containerRef.current = node
      }}
      className="flex flex-col items-center"
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      {...(attributes && typeof attributes === "object" ? attributes : {})}
      {...(listeners && typeof listeners === "object" ? listeners : {})}
      data-oid="xogxbr6"
    >
      <div className="group relative" data-oid="o8xq_mn">
        {/* Контейнер превью перехода */}
        <div
          className="flex cursor-pointer rounded-xs bg-gray-800 relative"
          style={{ width: `${actualWidth}px`, height: `${actualHeight}px` }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={onClick}
          data-oid="hyes5lv"
        >
          {/* Индикаторы сложности и категории */}
          {currentTransition && (
            <>
              {/* Индикатор сложности */}
              {/* <div className="absolute bottom-1 left-1 z-10">
              <div
               className={`${complexityIndicator.color} rounded-full w-3 h-3 flex items-center justify-center`}
               title={t(`transitions.complexity.${currentTransition.complexity}`, currentTransition.complexity)}
              >
               <span className="text-[8px] font-bold text-white">{complexityIndicator.label[0]}</span>
              </div>
              </div> */}

              {/* Индикатор категории */}
              <div className="absolute top-1 left-1 z-10" data-oid="d2ayk_l">
                <div
                  className="bg-black/80 bg-opacity-60 text-white rounded-xs px-1 py-0.5 text-[8px]"
                  title={t(`transitions.categories.${currentTransition.category}`, currentTransition.category)}
                  data-oid="vexfiij"
                >
                  {categoryIndicator}
                </div>
              </div>

              {/* Индикатор длительности */}
              {currentTransition.duration && (
                <div className="absolute bottom-1 left-1 z-10" data-oid="s3k4ocd">
                  <div
                    className="bg-black/80 bg-opacity-60 text-white rounded-xs px-1 py-0.5 text-[9px]"
                    data-oid="v4sgro1"
                  >
                    {currentTransition.duration.default.toFixed(1)}s
                  </div>
                </div>
              )}
            </>
          )}
          {isError ? (
            // Отображаем сообщение об ошибке, если видео не загрузилось
            <div className="flex h-full items-center justify-center text-white" data-oid="pxj_f6y">
              {t("timeline.player.videoLoadError")}
            </div>
          ) : (
            // Контейнер для видео с переходом
            <div
              className="relative flex h-full w-full cursor-pointer items-center justify-center rounded-md"
              data-oid="0o7-z7y"
            >
              {/* Исходное видео (видимое в начале) */}
              <video
                ref={sourceVideoRef}
                src={isVisible ? sourceVideo.path : undefined} // Загружаем только когда видимо
                className="h-full w-full origin-center object-cover transition-all duration-1000"
                muted
                loop
                playsInline
                preload={isVisible ? "metadata" : "none"}
                onError={() => setIsError(true)}
                data-testid="source-video"
                data-oid="lf-ad4t"
              />

              {/* Целевое видео (появляется при переходе) */}
              <video
                ref={targetVideoRef}
                src={isVisible ? targetVideo.path : undefined} // Загружаем только когда видимо
                className="absolute inset-0 h-full w-full origin-center object-cover opacity-0 transition-all duration-1000"
                muted
                loop
                playsInline
                preload={isVisible ? "metadata" : "none"}
                onError={() => setIsError(true)}
                data-testid="target-video"
                data-oid="w9..zn2"
              />

              {/* Кнопка добавления в избранное */}
              <FavoriteButton file={favoriteFile} size={size} type="transition" noTime={true} data-oid="1q61dbm" />

              {/* Кнопка для запуска перехода */}
              <ApplyButton
                resource={
                  {
                    id: currentTransition?.id || transitionType,
                    type: "transition",
                    name: currentTransition?.name,
                  } as TransitionResource
                }
                size={size}
                type="transition"
                data-oid="y-j0yy6"
              />

              {/* Кнопка добавления перехода в проект */}
              {transition && (
                <AddMediaButton
                  resource={
                    {
                      id: currentTransition?.id || transitionType,
                      type: "transition",
                      name: currentTransition?.name,
                    } as TransitionResource
                  }
                  size={size}
                  type="transition"
                  data-oid="1g4_p0z"
                />
              )}
            </div>
          )}
        </div>
      </div>
      {/* Название перехода */}
      <div className="mt-1 text-xs text-center truncate" style={{ maxWidth: `${actualWidth}px` }} data-oid="09-85je">
        {currentTransition?.labels?.ru || t(`transitions.types.${transitionType}`, transitionType)}
      </div>
    </div>
  )
}

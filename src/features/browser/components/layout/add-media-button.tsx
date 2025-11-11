import { Check, Plus, X } from "lucide-react"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { useResources } from "@/features/resources"
import type { ResourceType, TimelineResource } from "@/features/resources/types"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"

const logger = createLogger("AddMediaButton")

interface AddMediaButtonProps {
  resource: TimelineResource
  size: number
  type: ResourceType
}

/**
 * Кнопка для добавления/удаления медиафайла на таймлайн
 *
 * Функционал:
 * - Отображает кнопку добавления медиафайла на таймлайн
 * - Кнопка добавления с состояниями (добавлено/не добавлено)
 * - При наведении на добавленный элемент меняется на кнопку удаления
 * - Темная тема для UI элементов
 * - Плавная анимация при добавлении файла
 * - Задержка перед отображением кнопки удаления после добавления файла
 *
 * @param resource - Объект медиафайла
 * @param type - Тип ресурса (media, music, subtitles и т.д.)
 * @param size - Размер кнопки (по умолчанию 150)
 */
export const AddMediaButton = memo(function AddMediaButton({
  resource,
  size = 150,
  type = "media",
}: AddMediaButtonProps) {
  const { t } = useTranslation()
  const [isHovering, setIsHovering] = useState(false)
  const [isRecentlyAdded, setIsRecentlyAdded] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const prevIsAddedRef = useRef(false)

  const backendSync = getBackendSync()
  const {
    addMedia,
    addMusic,
    addEffect,
    addFilter,
    addTransition,
    addSubtitle,
    addTemplate,
    addStyleTemplate,
    removeResource,
    isAdded,
  } = useResources()

  // Обновляем состояние при изменении isAdded
  useEffect(() => {
    const currentIsAdded = isAdded(resource.id, type)

    if (currentIsAdded !== prevIsAddedRef.current) {
      // Если файл добавлен, устанавливаем флаг isRecentlyAdded
      if (currentIsAdded) {
        setIsRecentlyAdded(true)

        // Очищаем предыдущий таймер, если он есть
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }

        // Через 1 секунду сбрасываем флаг
        timerRef.current = setTimeout(() => {
          setIsRecentlyAdded(false)
          timerRef.current = null
        }, 1000)
      } else {
        // Если файл удален, сбрасываем флаг isRecentlyAdded
        setIsRecentlyAdded(false)

        // Очищаем таймер
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }

      // Обновляем предыдущее значение isAdded
      prevIsAddedRef.current = currentIsAdded
    }

    // Очищаем таймер при размонтировании компонента
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isAdded, resource.id, type])

  // Определяем, можно ли показывать кнопку удаления
  // Не показываем кнопку удаления в течение 3 секунд после добавления
  const canShowRemoveButton = !isRecentlyAdded

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      if (isAdded(resource.id, type) && canShowRemoveButton) {
        // Удаляем из добавленных
        void removeResource(resource.id, type)
      } else if (!isAdded(resource.id, type) && isHovering) {
        // Добавляем в добавленные в зависимости от типа
        switch (resource.type) {
          case "media":
            // Используем команду MoveToMediaPool для переноса из imported_media в media_pool
            void backendSync.executeCommand({
              type: "MoveToMediaPool",
              params: {
                media_id: resource.id,
              },
            })
            break
          case "music":
            void addMusic(resource.file)
            break
          case "effect":
            void addEffect(resource.effect)
            break
          case "filter":
            void addFilter(resource.filter)
            break
          case "transition":
            void addTransition(resource.transition)
            break
          case "subtitle":
            void addSubtitle(resource.style)
            break
          case "template":
            void addTemplate(resource.template)
            break
          case "styleTemplate":
            void addStyleTemplate(resource.template)
            break
          default:
            logger.warn(`Unknown resource type: ${(resource as any).type}`)
        }
        // Немедленно обновляем визуальное состояние
        setIsRecentlyAdded(true)
      }
    },
    [
      isAdded,
      isHovering,
      canShowRemoveButton,
      removeResource,
      backendSync,
      addMusic,
      addEffect,
      addFilter,
      addTransition,
      addSubtitle,
      addTemplate,
      addStyleTemplate,
      resource,
      type,
    ],
  )

  return (
    <button
      type="button"
      className={cn(
        "absolute z-[1] right-1 bottom-1 cursor-pointer rounded-full p-1 transition-all duration-150 dark:hover:text-black/50 border-0 outline-none focus:ring-2 focus:ring-teal",
        isAdded(resource.id, type)
          ? isRecentlyAdded
            ? "visible scale-110 bg-teal dark:bg-teal" // Яркий цвет и увеличенный размер для недавно добавленных
            : "visible bg-teal dark:bg-teal" // Добавлен класс visible
          : "invisible bg-secondary dark:bg-secondary group-hover:visible group-hover:bg-teal-light hover:bg-teal-light dark:group-hover:bg-teal dark:hover:bg-teal", // Скрыта по умолчанию, видима при наведении
      )}
      style={{ color: "#ffffff" }}
      onClick={(e) => handleToggleFavorite(e)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      title={
        isAdded(resource.id, type)
          ? isHovering && canShowRemoveButton
            ? t("browser.media.remove")
            : t("browser.media.added")
          : t("browser.media.add")
      }
    >
      {isAdded(resource.id, type) ? (
        isHovering && canShowRemoveButton ? (
          <X
            className={"transition-transform duration-150 hover:scale-110"}
            strokeWidth={2}
            style={{ color: "#000", height: `${6 + size / 30}px`, width: `${6 + size / 30}px` }}
          />
        ) : (
          <Check strokeWidth={3} style={{ color: "#fff", height: `${6 + size / 30}px`, width: `${6 + size / 30}px` }} />
        )
      ) : (
        <Plus
          className={"transition-transform duration-150 hover:scale-110"}
          strokeWidth={2}
          style={{ color: "#fff", height: `${6 + size / 30}px`, width: `${6 + size / 30}px` }}
        />
      )}
    </button>
  )
})

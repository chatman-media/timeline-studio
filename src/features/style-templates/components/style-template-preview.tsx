import { Play } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { AddMediaButton } from "@/features/browser/components/layout/add-media-button"
import { ApplyButton } from "@/features/browser/components/layout/apply-button"
import { FavoriteButton } from "@/features/browser/components/layout/favorite-button"
import { useResources } from "@/features/resources"
import type { StyleTemplateResource } from "@/features/resources/types"
import type { StyleTemplate } from "../types"

interface StyleTemplatePreviewProps {
  template: StyleTemplate
  size: number
  onSelect: (templateId: string) => void
  previewWidth: number
  previewHeight: number
}

/**
 * Компонент превью стилистического шаблона
 * Отображает миниатюру, название, длительность и индикаторы функций
 */
export function StyleTemplatePreview({
  template,
  size,
  onSelect,
  previewWidth,
  previewHeight,
}: StyleTemplatePreviewProps): React.ReactElement {
  const { t, i18n } = useTranslation()
  const [isHovered, setIsHovered] = useState(false)
  const { isStyleTemplateAdded } = useResources()

  // Получаем текущий язык
  const currentLanguage = (i18n.language || "ru") as "ru" | "en"

  // Проверяем, добавлен ли шаблон в ресурсы
  const isAdded = useMemo(() => isStyleTemplateAdded(template), [isStyleTemplateAdded, template])

  // Делаем превью квадратными, как в Effects
  const width = previewWidth ?? size
  const height = previewHeight ?? (size * 9) / 16

  // Получаем локализованное название категории
  const getCategoryName = useCallback(
    (category: string) => {
      const categoryMap: Record<string, string> = {
        intro: t("styleTemplates.categories.intro", "Интро"),
        outro: t("styleTemplates.categories.outro", "Концовка"),
        "lower-third": t("styleTemplates.categories.lowerThird", "Нижняя треть"),
        title: t("styleTemplates.categories.title", "Заголовок"),
        transition: t("styleTemplates.categories.transition", "Переход"),
        overlay: t("styleTemplates.categories.overlay", "Наложение"),
      }
      return categoryMap[category] || category
    },
    [t],
  )

  // Получаем локализованное название стиля
  const getStyleName = useCallback(
    (style: string) => {
      const styleMap: Record<string, string> = {
        modern: t("styleTemplates.styles.modern", "Современный"),
        vintage: t("styleTemplates.styles.vintage", "Винтаж"),
        minimal: t("styleTemplates.styles.minimal", "Минимализм"),
        corporate: t("styleTemplates.styles.corporate", "Корпоративный"),
        creative: t("styleTemplates.styles.creative", "Креативный"),
        cinematic: t("styleTemplates.styles.cinematic", "Кинематографический"),
      }
      return styleMap[style] || style
    },
    [t],
  )

  const handlePreview = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onSelect(template.id)
    },
    [onSelect, template.id],
  )

  const handleClick = useCallback(() => {
    // Only trigger preview, don't automatically add to resources
    onSelect(template.id)
  }, [onSelect, template.id])

  return (
    <div className="flex flex-col items-center">
      {/* Контейнер превью шаблона */}
      <div
        className="group relative cursor-pointer rounded-xs bg-black"
        style={{ width: `${width}px`, height: `${height}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={template.name[currentLanguage]}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xs"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              objectFit: "cover",
            }}
          />
        ) : (
          // Заглушка если нет превью
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center bg-gray-800 rounded-xs"
            style={{ width: `${width}px`, height: `${height}px` }}
          >
            <div className="text-center text-gray-400">
              <div className="text-xs">{getCategoryName(template.category)}</div>
            </div>
          </div>
        )}

        {/* Кнопка воспроизведения при наведении */}
        {isHovered && template.previewVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div
              className="rounded-full bg-teal p-3 transition-transform hover:scale-110 cursor-pointer"
              onClick={handlePreview}
              data-testid="play-button"
            >
              <Play className="h-6 w-6 text-white" fill="white" data-testid="play-icon" />
            </div>
          </div>
        )}

        {/* Индикаторы стиля и категории */}
        <div className="absolute top-1 left-1">
          <div className="bg-black bg-opacity-60 text-white rounded px-1 py-0.5 text-[8px]">
            {getStyleName(template.style).slice(0, 3).toUpperCase()}
          </div>
        </div>

        <div className="absolute bottom-1 left-1">
          <div className="bg-black bg-opacity-60 text-white rounded px-1 py-0.5 text-[8px]">
            {getCategoryName(template.category).slice(0, 3).toUpperCase()}
          </div>
        </div>

        {/* Индикатор длительности */}
        <div className="absolute bottom-1 right-1">
          <div className="duration bg-black bg-opacity-60 text-white rounded px-1 py-0.5 text-[8px]">
            {template.duration.toFixed(1)}s
          </div>
        </div>

        {/* Кнопка избранного */}
        <FavoriteButton
          file={{
            id: template.id,
            path: "",
            name: template.name[currentLanguage],
          }}
          size={size}
          type="styleTemplate"
        />

        {/* Кнопка применения шаблона */}
        {template && (
          <ApplyButton
            resource={
              {
                id: template.id,
                type: "styleTemplate",
                name: template.name[currentLanguage],
              } as StyleTemplateResource
            }
            size={size}
            type="styleTemplate"
          />
        )}

        {/* Кнопка добавления в ресурсы */}
        <div
          className={`${isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}
        >
          <AddMediaButton
            resource={
              { id: template.id, type: "styleTemplate", name: template.name[currentLanguage] } as StyleTemplateResource
            }
            size={size}
            type="styleTemplate"
          />
        </div>
      </div>

      {/* Название шаблона */}
      <div className="mt-1 text-xs text-center">{template.name[currentLanguage]}</div>
    </div>
  )
}

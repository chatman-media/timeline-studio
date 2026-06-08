import { Play } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { MediaType } from "@/domains/media-management"
import type { StyleTemplateResource } from "@/domains/shared/types/resources"
import { AddMediaButton } from "@/features/browser/components/layout/add-media-button"
import { FavoriteButton } from "@/features/browser/components/layout/favorite-button"
import { useResources } from "@/features/timeline/providers/resources-provider"
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
    <div className="flex flex-col items-center" data-oid="adfnn9h">
      {/* Контейнер превью шаблона */}
      <div
        className="group relative cursor-pointer rounded-xs bg-black"
        style={{ width: `${width}px`, height: `${height}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        data-oid="ll2ubd5"
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
            data-oid="r46zj5w"
          />
        ) : (
          // Заглушка если нет превью
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center bg-gray-800 rounded-xs"
            style={{ width: `${width}px`, height: `${height}px` }}
            data-oid="o0msd5z"
          >
            <div className="text-center text-gray-400" data-oid=":.nvy9w">
              <div className="text-xs" data-oid="j1wob18">
                {getCategoryName(template.category)}
              </div>
            </div>
          </div>
        )}

        {/* Кнопка воспроизведения при наведении */}
        {isHovered && template.previewVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50" data-oid="5f-jzj6">
            <div
              className="rounded-full bg-teal p-3 transition-transform hover:scale-110 cursor-pointer"
              onClick={handlePreview}
              data-testid="play-button"
              data-oid="idcycjo"
            >
              <Play className="h-6 w-6 text-white" fill="white" data-testid="play-icon" data-oid="pn54gje" />
            </div>
          </div>
        )}

        {/* Индикаторы стиля и категории */}
        <div className="absolute top-1 left-1" data-oid="i9ouznz">
          <div className="bg-black bg-opacity-60 text-white rounded px-1 py-0.5 text-[8px]" data-oid="of.qz79">
            {getStyleName(template.style).slice(0, 3).toUpperCase()}
          </div>
        </div>

        <div className="absolute bottom-1 left-1" data-oid=":kl0za7">
          <div className="bg-black bg-opacity-60 text-white rounded px-1 py-0.5 text-[8px]" data-oid="ld4lk-9">
            {getCategoryName(template.category).slice(0, 3).toUpperCase()}
          </div>
        </div>

        {/* Индикатор длительности */}
        <div className="absolute bottom-1 right-1" data-oid="7oczk_p">
          <div className="duration bg-black bg-opacity-60 text-white rounded px-1 py-0.5 text-[8px]" data-oid="6ze4exz">
            {template.duration.toFixed(1)}s
          </div>
        </div>

        {/* Кнопка избранного */}
        <FavoriteButton
          file={{
            id: template.id,
            path: "",
            name: template.name[currentLanguage],
            type: MediaType.Graphics,
          }}
          size={size}
          type="styleTemplate"
          data-oid="igl6i04"
        />

        {/* Кнопка добавления в ресурсы */}
        <div
          className={`${isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}
          data-oid="nfarhzu"
        >
          <AddMediaButton
            resource={
              {
                id: template.id,
                type: "styleTemplate",
                name: template.name[currentLanguage],
              } as StyleTemplateResource
            }
            size={size}
            type="styleTemplate"
            data-oid="b8fv3fd"
          />
        </div>
      </div>

      {/* Название шаблона */}
      <div className="mt-1 text-xs text-center" data-oid="mrks_pe">
        {template.name[currentLanguage]}
      </div>
    </div>
  )
}

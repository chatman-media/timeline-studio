import {
  Blend,
  Clapperboard,
  FlipHorizontal2,
  Music,
  Package,
  Palette,
  Sparkles,
  Sticker,
  Subtitles,
  Type,
  Video,
  X,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { MediaPreview } from "@/features/browser/components/preview/media-preview"
import { type DraggableType, useDraggable } from "@/features/drag-drop"
import { useResources } from "@/features/resources/services/resources-provider"
import type { TimelineResource } from "@/features/resources/types"

/**
 * Компонент для отдельного ресурса с поддержкой drag
 */
function ResourceItem({
  resource,
  onRemove,
}: {
  resource: TimelineResource
  onRemove: (id: string, type: string) => void
}) {
  const { t } = useTranslation()

  // Определяем тип для DragDropManager
  const getDraggableType = (resourceType: TimelineResource["type"]): DraggableType => {
    switch (resourceType) {
      case "media":
        return "media"
      case "music":
        return "music"
      case "effect":
        return "effect"
      case "filter":
        return "filter"
      case "transition":
        return "transition"
      case "template":
        return "template"
      case "styleTemplate":
        return "style-template"
      case "subtitle":
        return "subtitle-style"
      default:
        return "media"
    }
  }

  // Получаем данные для перетаскивания в зависимости от типа ресурса
  const getDragData = () => {
    if (resource.type === "media" || resource.type === "music") {
      return resource.file
    }
    if (resource.type === "effect") {
      return resource.effect
    }
    if (resource.type === "filter") {
      return resource.filter
    }
    if (resource.type === "transition") {
      return resource.transition
    }
    if (resource.type === "template") {
      return resource.template
    }
    if (resource.type === "styleTemplate") {
      return resource.template
    }
    if (resource.type === "subtitle") {
      return resource.style
    }
    return null
  }

  // Получаем URL для превью
  const getPreviewUrl = () => {
    const data = getDragData()
    if (!data) return ""

    if ("path" in data) return data.path
    if ("thumbnail" in data) return data.thumbnail
    return ""
  }

  // Используем DragDropManager для перетаскивания
  const dragProps = useDraggable(getDraggableType(resource.type), getDragData, () => ({
    url: getPreviewUrl(),
    width: 120,
    height: 80,
  }))

  // Для media и music показываем превью
  const shouldShowPreview = resource.type === "media" || resource.type === "music"

  if (shouldShowPreview && resource.file) {
    return (
      <div
        key={resource.id}
        className="group relative mb-2 flex w-[110px] flex-shrink-0 cursor-pointer flex-col overflow-hidden rounded-sm border border-[#333] transition-all duration-150 hover:border-[#555]"
        {...dragProps}
      >
        {/* Превью медиафайла */}
        <div className="relative h-[62px] w-full overflow-hidden bg-black">
          <MediaPreview file={resource.file} size={62} ignoreRatio />
        </div>

        {/* Название файла под превью */}
        <div className="flex items-center justify-between bg-[#222] px-1.5 py-1">
          <div className="flex-1 overflow-hidden">
            <div className="truncate text-[9px] text-gray-300">{resource.name}</div>
          </div>
        </div>

        {/* Кнопка удаления - показывается при наведении */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(resource.id, resource.type)
          }}
          className="absolute right-1 top-1 z-10 rounded bg-black/50 p-0.5 opacity-0 transition-opacity duration-150 hover:bg-red-500/80 group-hover:opacity-100"
        >
          <X className="h-3 w-3 text-white" />
        </button>
      </div>
    )
  }

  // Для остальных ресурсов (effects, filters, transitions, templates) - preview-подобный вид
  // Определяем цветовую тему для каждого типа
  const getTypeColor = () => {
    switch (resource.type) {
      case "effect":
        return "from-purple-500/20 to-purple-700/20 border-purple-500/30"
      case "filter":
        return "from-blue-500/20 to-blue-700/20 border-blue-500/30"
      case "transition":
        return "from-green-500/20 to-green-700/20 border-green-500/30"
      case "template":
        return "from-orange-500/20 to-orange-700/20 border-orange-500/30"
      case "styleTemplate":
        return "from-pink-500/20 to-pink-700/20 border-pink-500/30"
      case "subtitle":
        return "from-yellow-500/20 to-yellow-700/20 border-yellow-500/30"
      default:
        return "from-gray-500/20 to-gray-700/20 border-gray-500/30"
    }
  }

  const getTypeIcon = () => {
    const iconClass = "h-8 w-8"
    switch (resource.type) {
      case "subtitle":
        return <Subtitles className={iconClass} />
      case "effect":
        return <Sparkles className={iconClass} />
      case "filter":
        return <Palette className={iconClass} />
      case "transition":
        return <FlipHorizontal2 className={iconClass} />
      case "template":
        return <Clapperboard className={iconClass} />
      case "styleTemplate":
        return <Type className={iconClass} />
      default:
        return <Package className={iconClass} />
    }
  }

  return (
    <div
      key={resource.id}
      className="group relative mb-2 flex w-[110px] flex-shrink-0 cursor-pointer flex-col overflow-hidden rounded-sm border transition-all duration-150 hover:border-[#555]"
      {...dragProps}
    >
      {/* Preview область с градиентом и иконкой */}
      <div className={`relative flex h-[62px] w-full items-center justify-center bg-gradient-to-br ${getTypeColor()}`}>
        <div className="flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
          {getTypeIcon()}
        </div>
      </div>

      {/* Название под preview */}
      <div className="flex items-center justify-between bg-[#222] px-1.5 py-1">
        <div className="flex-1 overflow-hidden">
          <div className="truncate text-[9px] text-gray-300">
            {resource.type === "template"
              ? t(`templates.templateLabels.${resource.name}`, resource.name)
              : resource.type === "styleTemplate"
                ? t(`styleTemplates.${resource.name}`, resource.name)
                : resource.name}
          </div>
        </div>
      </div>

      {/* Кнопка удаления - показывается при наведении */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove(resource.id, resource.type)
        }}
        className="absolute right-1 top-1 z-10 rounded bg-black/50 p-0.5 opacity-0 transition-opacity duration-150 hover:bg-red-500/80 group-hover:opacity-100"
      >
        <X className="h-3 w-3 text-white" />
      </button>
    </div>
  )
}

/**
 * Компонент для отображения ресурсов таймлайна в левой панели
 */
export function ResourcesPanel() {
  const { t } = useTranslation()

  // Полностью отключаем логирование
  const {
    effectResources,
    filterResources,
    transitionResources,
    templateResources,
    styleTemplateResources,
    mediaResources,
    musicResources,
    subtitleResources,
    removeResource,
  } = useResources()

  // Полностью отключаем логирование

  // Категории ресурсов с их данными
  const categories = [
    {
      id: "media",
      name: t("browser.tabs.media"),
      icon: <Clapperboard className="h-3.5 w-3.5 text-gray-400" />,
      resources: mediaResources,
    },
    {
      id: "music",
      name: t("browser.tabs.music"),
      icon: <Music className="h-3.5 w-3.5 text-gray-400" />,
      resources: musicResources,
    },
    {
      id: "subtitles",
      name: t("browser.tabs.subtitles"),
      icon: <Type className="h-3.5 w-3.5 text-gray-400" />,
      resources: subtitleResources,
    },
    {
      id: "effects",
      name: t("browser.tabs.effects"),
      icon: <Sparkles className="h-3.5 w-3.5 text-gray-400" />,
      resources: effectResources,
    },
    {
      id: "filters",
      name: t("browser.tabs.filters"),
      icon: <Blend className="h-3.5 w-3.5 text-gray-400" />,
      resources: filterResources,
    },
    {
      id: "transitions",
      name: t("browser.tabs.transitions"),
      icon: <FlipHorizontal2 className="h-3.5 w-3.5 text-gray-400" />,
      resources: transitionResources,
    },
    {
      id: "templates",
      name: t("browser.tabs.templates"),
      icon: <Video className="h-3.5 w-3.5 text-gray-400" />,
      resources: templateResources,
    },
    {
      id: "styleTemplates",
      name: t("browser.tabs.styleTemplates"),
      icon: <Sticker className="h-3.5 w-3.5 text-gray-400" />,
      resources: styleTemplateResources,
    },
  ]

  // Функция для отображения списка ресурсов
  const renderResourceList = (resources: TimelineResource[]) => {
    if (resources.length === 0) {
      return null // Если ресурсов нет, не показываем ничего
    }

    return (
      <div>
        <div className="flex flex-wrap gap-1 px-1 py-1">
          {resources.map((resource) => (
            <ResourceItem key={resource.id} resource={resource} onRemove={removeResource} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-2 py-1 pl-3 pb-[3px]">
        <h2 className="text-sm font-medium text-white">{t("timeline.resources.title", "Ресурсы")}</h2>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-white cursor-pointer"
            onClick={() => {}}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Прокручиваемый контейнер для всех категорий */}
      <div className="scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent flex-1 overflow-y-auto">
        <div className="space-y-2 p-1.5">
          {categories.map((category) => (
            <div key={category.id} className="space-y-1">
              {/* Заголовок категории */}
              <div className="flex items-center gap-1.5 border-b border-[#333] pb-1 text-[11px] font-medium">
                {category.icon}
                {category.name}
                {category.resources.length > 0 && (
                  <span className="ml-1 text-[9px]">({category.resources.length})</span>
                )}
              </div>

              {/* Список ресурсов категории */}
              {renderResourceList(category.resources)}

              {/* Сообщение, если нет ресурсов */}
              {category.resources.length === 0 && (
                <div className="pl-1 text-[10px] text-muted-foreground">
                  {t("timeline.resources.noResources", "Нет добавленных ресурсов")}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

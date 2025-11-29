import { Clapperboard, FlipHorizontal2, Package, Palette, Sparkles, Subtitles, Type, X } from "lucide-react"
import { memo, useMemo } from "react"

import { MediaPreview } from "@/features/browser/components/preview/media-preview"
import { type DraggableType, useDraggable } from "@/features/drag-drop"
import type { TimelineResource } from "@/features/resources/types"

interface ResourceThumbnailProps {
  resource: TimelineResource
  onRemove: (id: string, type: string) => void
}

/**
 * Компактная превьюшка ресурса с drag & drop
 * Размер: 96x120px (80x80 превью + имя + отступы)
 */
export const ResourceThumbnail = memo(
  ({ resource, onRemove }: ResourceThumbnailProps) => {
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

    // Badge типа ресурса
    const getTypeBadge = (type: TimelineResource["type"]): string => {
      const badges = {
        media: "VID",
        music: "MUS",
        effect: "EFX",
        filter: "FLT",
        transition: "TRN",
        template: "TPL",
        styleTemplate: "STY",
        subtitle: "SUB",
      }
      return badges[type] || "RES"
    }

    // Контент превью в зависимости от типа
    const previewContent = useMemo(() => {
      switch (resource.type) {
        case "media":
        case "music":
          return <MediaPreview file={resource.file} size={80} ignoreRatio />

        case "effect":
          return <Sparkles size={32} className="text-purple-400" strokeWidth={1.5} />

        case "filter":
          return <Palette size={32} className="text-pink-400" strokeWidth={1.5} />

        case "transition":
          return <FlipHorizontal2 size={32} className="text-blue-400" strokeWidth={1.5} />

        case "template":
          return <Clapperboard size={32} className="text-green-400" strokeWidth={1.5} />

        case "styleTemplate":
          return <Type size={32} className="text-orange-400" strokeWidth={1.5} />

        case "subtitle":
          return <Subtitles size={32} className="text-yellow-400" strokeWidth={1.5} />

        default:
          return <Package size={32} className="text-gray-400" strokeWidth={1.5} />
      }
    }, [resource.type, resource.resourceId])

    // Drag & Drop
    const dragProps = useDraggable(getDraggableType(resource.type), getDragData, () => ({
      url: getPreviewUrl(),
      width: 80,
      height: 80,
    }))

    return (
      <div
        className="group relative flex w-24 flex-shrink-0 cursor-grab flex-col active:cursor-grabbing"
        {...dragProps}
      >
        {/* Превью */}
        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary transition-transform group-hover:-translate-y-0.5">
          {previewContent}

          {/* Badge типа */}
          <div className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
            {getTypeBadge(resource.type)}
          </div>

          {/* Кнопка удаления (показывается при hover) */}
          <button
            className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/80 opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(resource.id, resource.type)
            }}
            aria-label="Remove resource"
          >
            <X size={12} className="text-white" />
          </button>
        </div>

        {/* Имя ресурса */}
        <div
          className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap px-1 text-center text-[11px] text-muted-foreground"
          title={resource.name}
        >
          {resource.name}
        </div>
      </div>
    )
  },
  (prev, next) => {
    // Ре-рендер только если изменился ID или имя
    return prev.resource.id === next.resource.id && prev.resource.name === next.resource.name
  },
)

ResourceThumbnail.displayName = "ResourceThumbnail"

import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useResources } from "@/domains/video-editing"
import type { DraggableItem, DraggableType } from "@/features/drag-drop"
import { useDropZone } from "@/features/drag-drop"
import type { ResourceType, TimelineResource } from "@/features/resources/types"
import { ResourceThumbnail } from "./resource-thumbnail"

/**
 * Типы ресурсов которые можно бросить на панель
 */
const ACCEPTED_TYPES: DraggableType[] = [
  "media",
  "music",
  "effect",
  "filter",
  "transition",
  "template",
  "style-template",
  "subtitle-style",
]

/**
 * Горизонтальная панель ресурсов с простым скроллом
 * Все ресурсы в одном ряду, новые первыми
 */
export function ResourcesPanel() {
  const { t } = useTranslation()

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
    addMedia,
    addMusic,
    addEffect,
    addFilter,
    addTransition,
    addTemplate,
    addStyleTemplate,
    addSubtitle,
  } = useResources()

  /**
   * Обработчик drop - добавляет ресурс в панель
   */
  const handleDrop = useCallback(
    async (item: DraggableItem, _event: DragEvent) => {
      try {
        switch (item.type) {
          case "media":
            await addMedia(item.data)
            break
          case "music":
            await addMusic(item.data)
            break
          case "effect":
            await addEffect(item.data)
            break
          case "filter":
            await addFilter(item.data)
            break
          case "transition":
            await addTransition(item.data)
            break
          case "template":
            await addTemplate(item.data)
            break
          case "style-template":
            await addStyleTemplate(item.data)
            break
          case "subtitle-style":
            await addSubtitle(item.data)
            break
        }
      } catch (error) {
        console.error("Failed to add resource:", error)
      }
    },
    [addMedia, addMusic, addEffect, addFilter, addTransition, addTemplate, addStyleTemplate, addSubtitle],
  )

  // Регистрируем drop zone
  const { ref: dropRef, onDragOver, onDrop } = useDropZone("resources-panel", ACCEPTED_TYPES, handleDrop)

  // Объединяем все ресурсы в один плоский список
  const allResources = useMemo(() => {
    const categories: Array<{
      type: ResourceType
      resources: TimelineResource[]
    }> = [
      { type: "media", resources: mediaResources },
      { type: "music", resources: musicResources },
      { type: "effect", resources: effectResources },
      { type: "filter", resources: filterResources },
      { type: "transition", resources: transitionResources },
      { type: "template", resources: templateResources },
      { type: "styleTemplate", resources: styleTemplateResources },
      { type: "subtitle", resources: subtitleResources },
    ]

    // Объединяем все ресурсы
    const combined = categories.flatMap((cat) => cat.resources)

    // Сортируем по времени добавления (новые первыми)
    return combined.sort((a, b) => b.addedAt - a.addedAt)
  }, [
    mediaResources,
    musicResources,
    effectResources,
    filterResources,
    transitionResources,
    templateResources,
    styleTemplateResources,
    subtitleResources,
  ])

  const totalCount = allResources.length

  return (
    <div
      ref={dropRef as React.RefObject<HTMLDivElement>}
      className="flex h-full flex-col bg-background transition-colors"
      onDragOver={onDragOver}
      onDrop={onDrop}
      data-oid="a31x4p1"
    >
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b border-border px-3" data-oid="ce8_b__">
        <h2 className="text-sm font-medium text-foreground" data-oid="_s45o_6">
          {t("timeline.resources.title", "Ресурсы")}
          {totalCount > 0 && (
            <span className="ml-2 text-xs text-muted-foreground" data-oid="hocsv13">
              ({totalCount})
            </span>
          )}
        </h2>
      </div>

      {/* Горизонтальный скролл контейнер */}
      <div className="flex-1 overflow-hidden" data-oid="ba--jxw">
        {totalCount === 0 ? (
          // Empty state - drop zone hint
          <div className="flex h-full items-center justify-center px-4" data-oid="t1n_i2o">
            <p className="text-center text-sm text-muted-foreground" data-oid="1thpvvs">
              {t("timeline.resources.empty", "Перетащите сюда эффекты, фильтры, переходы или медиафайлы")}
            </p>
          </div>
        ) : (
          // Горизонтальный скролл список
          <div
            className="flex h-full gap-2 overflow-x-auto overflow-y-hidden px-3 py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border"
            style={{
              scrollBehavior: "smooth",
              willChange: "scroll-position",
            }}
            data-oid="1_gpitp"
          >
            {allResources.map((resource) => (
              <ResourceThumbnail key={resource.id} resource={resource} onRemove={removeResource} data-oid="4igmwb_" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useResources } from "@/features/resources/services/resources-provider"
import type { ResourceType, TimelineResource } from "@/features/resources/types"
import { ResourceThumbnail } from "./resource-thumbnail"

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
  } = useResources()

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
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="text-sm font-medium text-foreground">
          {t("timeline.resources.title", "Ресурсы")}
          {totalCount > 0 && <span className="ml-2 text-xs text-muted-foreground">({totalCount})</span>}
        </h2>
      </div>

      {/* Горизонтальный скролл контейнер */}
      <div className="flex-1 overflow-hidden">
        {totalCount === 0 ? (
          // Empty state
          <div className="flex h-full items-center justify-center px-4">
            <p className="text-center text-sm text-muted-foreground">
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
          >
            {allResources.map((resource) => (
              <ResourceThumbnail key={resource.id} resource={resource} onRemove={removeResource} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

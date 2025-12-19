import React, { memo, Suspense, useMemo } from "react"

interface LazyTabContentProps {
  tabValue: string
  activeTab: string
  className?: string
}

/**
 * Динамическая загрузка адаптеров только при необходимости
 */
const getAdapterComponent = (tabValue: string) => {
  switch (tabValue) {
    case "media":
      return React.lazy(() =>
        import("./tab-adapters/media-adapter-content").then((module) => ({
          default: module.MediaAdapterContent,
        })),
      )
    case "music":
      return React.lazy(() =>
        import("./tab-adapters/music-adapter-content").then((module) => ({
          default: module.MusicAdapterContent,
        })),
      )
    case "effects":
      return React.lazy(() =>
        import("./tab-adapters/effects-adapter-content").then((module) => ({
          default: module.EffectsAdapterContent,
        })),
      )
    case "filters":
      return React.lazy(() =>
        import("./tab-adapters/filters-adapter-content").then((module) => ({
          default: module.FiltersAdapterContent,
        })),
      )
    case "transitions":
      return React.lazy(() =>
        import("./tab-adapters/transitions-adapter-content").then((module) => ({
          default: module.TransitionsAdapterContent,
        })),
      )
    case "subtitles":
      return React.lazy(() =>
        import("./tab-adapters/subtitles-adapter-content").then((module) => ({
          default: module.SubtitlesAdapterContent,
        })),
      )
    case "templates":
      return React.lazy(() =>
        import("./tab-adapters/templates-adapter-content").then((module) => ({
          default: module.TemplatesAdapterContent,
        })),
      )
    case "style_templates":
      return React.lazy(() =>
        import("./tab-adapters/style-templates-adapter-content").then((module) => ({
          default: module.StyleTemplatesAdapterContent,
        })),
      )
    default:
      return null
  }
}

/**
 * Компонент для ленивой загрузки контента вкладки
 * Загружается только когда вкладка становится активной
 */
export const LazyTabContent = memo(({ tabValue, activeTab }: LazyTabContentProps) => {
  // Рендерим контент только для активной вкладки
  const isActive = activeTab === tabValue

  // Check if tab is active

  const AdapterComponent = useMemo(() => {
    // Create lazy component only for active tab
    return isActive ? getAdapterComponent(tabValue) : null
  }, [isActive, tabValue])

  // Не рендерим ничего для неактивных вкладок
  if (!AdapterComponent) {
    return null
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center" data-oid="yqdcfjh">
          <div className="text-muted-foreground" data-oid="h8m1h3v">
            Загрузка...
          </div>
        </div>
      }
      data-oid="p7wm:j-"
    >
      <AdapterComponent data-oid="fqxqo69" />
    </Suspense>
  )
})

LazyTabContent.displayName = "LazyTabContent"

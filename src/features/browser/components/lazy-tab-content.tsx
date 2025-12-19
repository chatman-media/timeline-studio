import React, { memo, Suspense, useMemo } from "react"

interface LazyTabContentProps {
  tabValue: string
  activeTab: string
  className?: string
}

/**
 * Кэш загруженных компонентов вкладок
 * Хранит lazy-компоненты чтобы не создавать их заново при каждом переключении
 */
const adapterCache = new Map<string, React.LazyExoticComponent<React.ComponentType<any>>>()

/**
 * Получает или создаёт lazy-компонент для вкладки
 * Кэширует компоненты для повторного использования
 */
const getOrCreateAdapterComponent = (tabValue: string) => {
  if (adapterCache.has(tabValue)) {
    return adapterCache.get(tabValue)!
  }

  let component: React.LazyExoticComponent<React.ComponentType<any>> | null = null

  switch (tabValue) {
    case "media":
      component = React.lazy(() =>
        import("./tab-adapters/media-adapter-content").then((module) => ({
          default: module.MediaAdapterContent,
        })),
      )
      break
    case "music":
      component = React.lazy(() =>
        import("./tab-adapters/music-adapter-content").then((module) => ({
          default: module.MusicAdapterContent,
        })),
      )
      break
    case "effects":
      component = React.lazy(() =>
        import("./tab-adapters/effects-adapter-content").then((module) => ({
          default: module.EffectsAdapterContent,
        })),
      )
      break
    case "filters":
      component = React.lazy(() =>
        import("./tab-adapters/filters-adapter-content").then((module) => ({
          default: module.FiltersAdapterContent,
        })),
      )
      break
    case "transitions":
      component = React.lazy(() =>
        import("./tab-adapters/transitions-adapter-content").then((module) => ({
          default: module.TransitionsAdapterContent,
        })),
      )
      break
    case "subtitles":
      component = React.lazy(() =>
        import("./tab-adapters/subtitles-adapter-content").then((module) => ({
          default: module.SubtitlesAdapterContent,
        })),
      )
      break
    case "templates":
      component = React.lazy(() =>
        import("./tab-adapters/templates-adapter-content").then((module) => ({
          default: module.TemplatesAdapterContent,
        })),
      )
      break
    case "style_templates":
      component = React.lazy(() =>
        import("./tab-adapters/style-templates-adapter-content").then((module) => ({
          default: module.StyleTemplatesAdapterContent,
        })),
      )
      break
    default:
      return null
  }

  if (component) {
    adapterCache.set(tabValue, component)
  }

  return component
}

/**
 * Компонент для ленивой загрузки контента вкладки с кэшированием
 *
 * Особенности:
 * - Кэширует lazy-компоненты вкладок
 * - Скрывает неактивные вкладки через CSS (display: none)
 * - Сохраняет состояние вкладки при переключении
 */
export const LazyTabContent = memo(({ tabValue, activeTab }: LazyTabContentProps) => {
  // Получаем или создаём компонент для вкладки (кэшируется)
  const AdapterComponent = useMemo(() => getOrCreateAdapterComponent(tabValue), [tabValue])

  // Не рендерим если компонент не найден
  if (!AdapterComponent) {
    return null
  }

  // Определяем активна ли эта вкладка
  const isActive = activeTab === tabValue

  return (
    <div
      style={{
        display: isActive ? "block" : "none",
        height: "100%",
        width: "100%",
      }}
      data-tab={tabValue}
      data-active={isActive}
    >
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
    </div>
  )
})

LazyTabContent.displayName = "LazyTabContent"

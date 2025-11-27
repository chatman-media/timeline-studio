import { memo } from "react"

import { TabsContent } from "@/components/ui/tabs"
import { UniversalList } from "@/features/browser/components/universal-list"

import { useEffectsAdapter } from "../adapters/use-effects-adapter"
import { useFiltersAdapter } from "../adapters/use-filters-adapter"
import { useMediaAdapter } from "../adapters/use-media-adapter"
import { useMusicAdapter } from "../adapters/use-music-adapter"
import { useProjectTemplatesAdapter } from "../adapters/use-project-templates-adapter"
import { useScenariosAdapter } from "../adapters/use-scenarios-adapter"
import { useStyleTemplatesAdapter } from "../adapters/use-style-templates-adapter"
import { useSubtitlesAdapter } from "../adapters/use-subtitles-adapter"
import { useTemplatesAdapter } from "../adapters/use-templates-adapter"
import { useTransitionsAdapter } from "../adapters/use-transitions-adapter"

interface TabContentProps {
  tabValue: string
  activeTab: string
  className: string
}

// Компоненты для каждой вкладки с ленивой загрузкой
// Клик по медиа обрабатывается внутри VideoPreview (воспроизведение в плеере)
// Кнопка "+" добавляет в ресурсы, Drag & Drop переносит на таймлайн
const MediaTabContent = memo(() => {
  const adapter = useMediaAdapter()
  return <UniversalList adapter={adapter} />
})

const MusicTabContent = memo(() => {
  const adapter = useMusicAdapter()
  return <UniversalList adapter={adapter} />
})

const EffectsTabContent = memo(() => {
  const adapter = useEffectsAdapter()
  return <UniversalList adapter={adapter} />
})

const FiltersTabContent = memo(() => {
  const adapter = useFiltersAdapter()
  return <UniversalList adapter={adapter} />
})

const TransitionsTabContent = memo(() => {
  const adapter = useTransitionsAdapter()
  return <UniversalList adapter={adapter} />
})

const SubtitlesTabContent = memo(() => {
  const adapter = useSubtitlesAdapter()
  return <UniversalList adapter={adapter} />
})

const TemplatesTabContent = memo(() => {
  const adapter = useTemplatesAdapter()
  return <UniversalList adapter={adapter} />
})

const StyleTemplatesTabContent = memo(() => {
  const adapter = useStyleTemplatesAdapter()
  return <UniversalList adapter={adapter} />
})

const ProjectsTabContent = memo(() => {
  const adapter = useProjectTemplatesAdapter()
  return <UniversalList adapter={adapter} />
})

const ScenariosTabContent = memo(() => {
  const adapter = useScenariosAdapter()
  return <UniversalList adapter={adapter} />
})

// Компоненты с именами
MediaTabContent.displayName = "MediaTabContent"
MusicTabContent.displayName = "MusicTabContent"
EffectsTabContent.displayName = "EffectsTabContent"
FiltersTabContent.displayName = "FiltersTabContent"
TransitionsTabContent.displayName = "TransitionsTabContent"
SubtitlesTabContent.displayName = "SubtitlesTabContent"
TemplatesTabContent.displayName = "TemplatesTabContent"
StyleTemplatesTabContent.displayName = "StyleTemplatesTabContent"
ProjectsTabContent.displayName = "ProjectsTabContent"
ScenariosTabContent.displayName = "ScenariosTabContent"

/**
 * Компонент для рендеринга контента вкладки с ленивой загрузкой
 * Адаптер загружается только когда вкладка активна
 */
export const TabContent = memo(({ tabValue, activeTab, className }: TabContentProps) => {
  // Рендерим контент только если вкладка активна
  if (activeTab !== tabValue) {
    return (
      <TabsContent value={tabValue} className={className}>
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      </TabsContent>
    )
  }

  const renderContent = () => {
    switch (tabValue) {
      case "media":
        return <MediaTabContent />
      case "music":
        return <MusicTabContent />
      case "effects":
        return <EffectsTabContent />
      case "filters":
        return <FiltersTabContent />
      case "transitions":
        return <TransitionsTabContent />
      case "subtitles":
        return <SubtitlesTabContent />
      case "templates":
        return <TemplatesTabContent />
      case "style-templates":
        return <StyleTemplatesTabContent />
      case "projects":
        return <ProjectsTabContent />
      case "scenarios":
        return <ScenariosTabContent />
      default:
        return (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">Адаптер для &quot;{tabValue}&quot; не найден</div>
          </div>
        )
    }
  }

  return (
    <TabsContent value={tabValue} className={className}>
      {renderContent()}
    </TabsContent>
  )
})

TabContent.displayName = "TabContent"

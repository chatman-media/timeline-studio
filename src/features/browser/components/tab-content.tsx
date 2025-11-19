import { memo, useMemo } from "react"

import { TabsContent } from "@/components/ui/tabs"
import { UniversalList } from "@/features/browser/components/universal-list"
import { useTimelineActions } from "@/features/timeline/hooks"

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

// Компонент для каждой вкладки с ленивой загрузкой
const MediaTabContent = memo(() => {
  const adapter = useMediaAdapter()
  const { addSingleMediaToTimeline } = useTimelineActions()

  const handleItemSelect = useMemo(() => (item: any) => addSingleMediaToTimeline(item), [addSingleMediaToTimeline])

  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} />
})

const MusicTabContent = memo(() => {
  const adapter = useMusicAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])
  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} />
})

const EffectsTabContent = memo(() => {
  const adapter = useEffectsAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])
  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} />
})

const FiltersTabContent = memo(() => {
  const adapter = useFiltersAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])
  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} />
})

const TransitionsTabContent = memo(() => {
  const adapter = useTransitionsAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])
  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} />
})

const SubtitlesTabContent = memo(() => {
  const adapter = useSubtitlesAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])
  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} />
})

const TemplatesTabContent = memo(() => {
  const adapter = useTemplatesAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])
  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} />
})

const StyleTemplatesTabContent = memo(() => {
  const adapter = useStyleTemplatesAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])
  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} />
})

const ProjectsTabContent = memo(() => {
  const adapter = useProjectTemplatesAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])
  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} />
})

const ScenariosTabContent = memo(() => {
  const adapter = useScenariosAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])
  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} />
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

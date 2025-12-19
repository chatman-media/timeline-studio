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
  return <UniversalList adapter={adapter} data-oid="d4r.hq6" />
})

const MusicTabContent = memo(() => {
  const adapter = useMusicAdapter()
  return <UniversalList adapter={adapter} data-oid=":a4uc20" />
})

const EffectsTabContent = memo(() => {
  const adapter = useEffectsAdapter()
  return <UniversalList adapter={adapter} data-oid=":w7zjl6" />
})

const FiltersTabContent = memo(() => {
  const adapter = useFiltersAdapter()
  return <UniversalList adapter={adapter} data-oid="k33a85u" />
})

const TransitionsTabContent = memo(() => {
  const adapter = useTransitionsAdapter()
  return <UniversalList adapter={adapter} data-oid="22fgdfy" />
})

const SubtitlesTabContent = memo(() => {
  const adapter = useSubtitlesAdapter()
  return <UniversalList adapter={adapter} data-oid="ji1.asd" />
})

const TemplatesTabContent = memo(() => {
  const adapter = useTemplatesAdapter()
  return <UniversalList adapter={adapter} data-oid="73nthhv" />
})

const StyleTemplatesTabContent = memo(() => {
  const adapter = useStyleTemplatesAdapter()
  return <UniversalList adapter={adapter} data-oid="-hp0j6q" />
})

const ProjectsTabContent = memo(() => {
  const adapter = useProjectTemplatesAdapter()
  return <UniversalList adapter={adapter} data-oid="4ltzq9g" />
})

const ScenariosTabContent = memo(() => {
  const adapter = useScenariosAdapter()
  return <UniversalList adapter={adapter} data-oid="fo6-x-d" />
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
      <TabsContent value={tabValue} className={className} data-oid="1bp23r8">
        <div className="flex h-full items-center justify-center" data-oid="8o50rij">
          <div className="text-muted-foreground" data-oid="335h.ig">
            Загрузка...
          </div>
        </div>
      </TabsContent>
    )
  }

  const renderContent = () => {
    switch (tabValue) {
      case "media":
        return <MediaTabContent data-oid="a2sy3:9" />
      case "music":
        return <MusicTabContent data-oid="yezyqw7" />
      case "effects":
        return <EffectsTabContent data-oid="egpkw2f" />
      case "filters":
        return <FiltersTabContent data-oid="8o5waz9" />
      case "transitions":
        return <TransitionsTabContent data-oid="jr:n0q0" />
      case "subtitles":
        return <SubtitlesTabContent data-oid="s.5um8d" />
      case "templates":
        return <TemplatesTabContent data-oid="xhdnv90" />
      case "style_templates":
        return <StyleTemplatesTabContent data-oid=".0f2pf3" />
      case "projects":
        return <ProjectsTabContent data-oid="zjdruu-" />
      case "scenarios":
        return <ScenariosTabContent data-oid="1_amw1z" />
      default:
        return (
          <div className="flex h-full items-center justify-center" data-oid="bd.6rjv">
            <div className="text-muted-foreground" data-oid="_899ptx">
              Адаптер для &quot;{tabValue}&quot; не найден
            </div>
          </div>
        )
    }
  }

  return (
    <TabsContent value={tabValue} className={className} data-oid="2bu899z">
      {renderContent()}
    </TabsContent>
  )
})

TabContent.displayName = "TabContent"

import { Blend, Clapperboard, FlipHorizontal2, Music, Sparkles, Sticker, Type, Video } from "lucide-react"
import { memo, useCallback } from "react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

export const TAB_BUTTON_STYLES =
  "h-[50px] text-xs text-gray-600 dark:bg-[#2D2D2D] border-none " +
  "hover:text-gray-900 dark:text-gray-400 dark:hover:bg-background dark:hover:text-gray-100 " +
  "flex flex-col items-center justify-center gap-1 py-2 px-2 " +
  "cursor-pointer rounded-none transition-colors"

export const TAB_ACTIVE_STYLES =
  "bg-background text-teal dark:text-[#35d1c1] cursor-default " + "[&>svg]:text-[#38dacac3]"

interface BrowserTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

interface TabButtonProps {
  value: string
  activeTab: string
  onClick: (value: string) => void
  children: React.ReactNode
  testId?: string
}

const TabButton = memo(({ value, activeTab, onClick, children, testId }: TabButtonProps) => {
  const isActive = activeTab === value

  const handleClick = useCallback(() => {
    if (!isActive) {
      onClick(value)
    }
  }, [isActive, onClick, value])

  return (
    <button
      className={cn(TAB_BUTTON_STYLES, isActive && TAB_ACTIVE_STYLES)}
      onClick={handleClick}
      data-testid={testId}
      type="button"
      data-oid="55c8tma"
    >
      {children}
    </button>
  )
})

TabButton.displayName = "TabButton"

export const BrowserTabs = memo(({ activeTab, onTabChange }: BrowserTabsProps) => {
  const { t } = useTranslation()

  return (
    <div
      className="h-[50px] shrink-0 flex justify-start border-none rounded-none dark:bg-[#2D2D2D] m-0 p-0"
      data-oid="vv8xeep"
    >
      <TabButton value="media" activeTab={activeTab} onClick={onTabChange} testId="media-tab" data-oid="9ny85yf">
        <Clapperboard className="h-4 w-4" data-oid="mbgqi7b" />
        <span data-oid="xi0nyx4">{t("browser.tabs.media")}</span>
      </TabButton>
      <TabButton value="music" activeTab={activeTab} onClick={onTabChange} testId="music-tab" data-oid="s322fuj">
        <Music className="h-4 w-4" data-oid="t702c4_" />
        <span data-oid="x_z65gm">{t("browser.tabs.music")}</span>
      </TabButton>
      <TabButton
        value="subtitles"
        activeTab={activeTab}
        onClick={onTabChange}
        testId="subtitles-tab"
        data-oid="5fiq6hv"
      >
        <Type className="h-4 w-4" data-oid="v9mfdd6" />
        <span data-oid="00a9d:6">{t("browser.tabs.subtitles")}</span>
      </TabButton>
      <TabButton value="effects" activeTab={activeTab} onClick={onTabChange} testId="effects-tab" data-oid="4yz4a-y">
        <Sparkles className="h-4 w-4" data-oid="8hl9zs." />
        <span data-oid="4bdsvr-">{t("browser.tabs.effects")}</span>
      </TabButton>
      <TabButton value="filters" activeTab={activeTab} onClick={onTabChange} testId="filters-tab" data-oid="p-0zwic">
        <Blend className="h-4 w-4" data-oid="yklcdaz" />
        <span data-oid="io:0m54">{t("browser.tabs.filters")}</span>
      </TabButton>
      <TabButton
        value="transitions"
        activeTab={activeTab}
        onClick={onTabChange}
        testId="transitions-tab"
        data-oid="hhw.az9"
      >
        <FlipHorizontal2 className="h-4 w-4" data-oid="wngdxwk" />
        <span data-oid="4alv5fg">{t("browser.tabs.transitions")}</span>
      </TabButton>
      <TabButton
        value="templates"
        activeTab={activeTab}
        onClick={onTabChange}
        testId="templates-tab"
        data-oid="12nbk18"
      >
        <Video className="h-4 w-4" data-oid="3:ezsji" />
        <span data-oid="20c8bw_">{t("browser.tabs.templates")}</span>
      </TabButton>
      {/* Temporarily disabled - style templates need completion
          <TabButton
           value="style_templates"
           activeTab={activeTab}
           onClick={onTabChange}
           testId="style_templates-tab"
          >
           <Sticker className="h-4 w-4" />
           <span>{t("browser.tabs.styleTemplates")}</span>
          </TabButton>
      */}
      {/* Temporarily disabled - projects and scenarios features need completion
          <TabButton value="projects" activeTab={activeTab} onClick={onTabChange} testId="projects-tab">
           <LayoutTemplate className="h-4 w-4" />
           <span>{t("browser.tabs.projects")}</span>
          </TabButton>
          <TabButton value="scenarios" activeTab={activeTab} onClick={onTabChange} testId="scenarios-tab">
           <Wand2 className="h-4 w-4" />
           <span>{t("browser.tabs.scenarios")}</span>
          </TabButton>
          */}
    </div>
  )
})

BrowserTabs.displayName = "BrowserTabs"

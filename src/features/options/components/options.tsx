import { AudioLines, Gauge, Info, Palette } from "lucide-react"
import { type JSX, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { MediaFile } from "@/domains/media-management"
import { TAB_BUTTON_STYLES } from "@/features/browser"
import { ColorSettings } from "@/features/color-grading"
import { cn } from "@/lib/utils"

import { AudioSettings } from "./audio-settings"
import { InfoSettings } from "./info-settings"
import { SpeedSettings } from "./speed-settings"

type OptionsTab = "audio" | "color" | "speed" | "info"

const TABS: Array<{ id: OptionsTab; labelKey: string; icon: JSX.Element }> = [
  { id: "color", labelKey: "options.tabs.color", icon: <Palette /> },
  { id: "speed", labelKey: "options.tabs.speed", icon: <Gauge /> },
  { id: "audio", labelKey: "options.tabs.audio", icon: <AudioLines /> },
  { id: "info", labelKey: "options.tabs.info", icon: <Info /> },
]

export interface OptionsProps {
  selectedMediaFile?: MediaFile | null
}

export function Options({ selectedMediaFile }: OptionsProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<OptionsTab>("color")

  // Автоматически переключаемся на вкладку "info" при выборе медиафайла
  useEffect(() => {
    if (selectedMediaFile) {
      setActiveTab("info")
    }
  }, [selectedMediaFile])

  const renderTabContent = () => {
    switch (activeTab) {
      case "audio":
        return <AudioSettings />
      case "color":
        return <ColorSettings />
      case "speed":
        return <SpeedSettings />
      case "info":
        return <InfoSettings selectedMediaFile={selectedMediaFile} />
      default:
        return <ColorSettings />
    }
  }

  return (
    <div className="flex h-full flex-col bg-background p-0 m-0" data-testid="options">
      <Tabs
        className="flex flex-col h-full justify-start border-none rounded-none m-0 p-0"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as OptionsTab)}
        data-testid="options-tabs"
      >
        {/* Вкладки */}
        <TabsList
          className="grid w-full grid-cols-4 shrink-0 border-none bg-muted/50 rounded-none m-0 p-0"
          data-testid="options-tabs-list"
        >
          {TABS.map((tab) => (
            <TabsTrigger
              className={cn(TAB_BUTTON_STYLES, "h-[35px] flex-row items-center justify-center gap-2")}
              key={tab.id}
              value={tab.id}
              data-testid={`options-tab-${tab.id}`}
            >
              {tab.icon}
              <span className="">{t(tab.labelKey)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Содержимое вкладок */}
        {TABS.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className="flex-1 min-h-0 overflow-hidden p-0"
            data-testid={`options-content-${tab.id}`}
          >
            {activeTab === tab.id && (
              <div className="h-full" data-testid={`options-${tab.id}-settings`}>
                {renderTabContent()}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

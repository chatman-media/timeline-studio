import { AudioLines, Gauge, Info, Palette } from "lucide-react"
import { type JSX, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { MediaFile } from "@timeline-studio/core/types"
import { TAB_BUTTON_STYLES } from "@/features/browser"
import { ColorSettings } from "@/features/color-grading"
import { cn } from "@/lib/utils"

import { AudioSettings } from "./audio-settings"
import { InfoSettings } from "./info-settings"
import { SpeedSettings } from "./speed-settings"

type OptionsTab = "audio" | "color" | "speed" | "info"

const TABS: Array<{ id: OptionsTab; labelKey: string; icon: JSX.Element }> = [
  {
    id: "color",
    labelKey: "options.tabs.color",
    icon: <Palette data-oid="xufr.iq" />,
  },
  {
    id: "speed",
    labelKey: "options.tabs.speed",
    icon: <Gauge data-oid="v9y0.xw" />,
  },
  {
    id: "audio",
    labelKey: "options.tabs.audio",
    icon: <AudioLines data-oid="oyfrz41" />,
  },
  {
    id: "info",
    labelKey: "options.tabs.info",
    icon: <Info data-oid="--7lier" />,
  },
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
        return <AudioSettings data-oid="e-7_qt3" />
      case "color":
        return <ColorSettings data-oid="uj:mgyt" />
      case "speed":
        return <SpeedSettings data-oid="5ng:.1c" />
      case "info":
        return <InfoSettings selectedMediaFile={selectedMediaFile} data-oid="18v-u7r" />
      default:
        return <ColorSettings data-oid="12c1q3d" />
    }
  }

  return (
    <div className="flex h-full flex-col bg-background p-0 m-0" data-testid="options" data-oid="5k-n7gs">
      <Tabs
        className="flex flex-col h-full justify-start border-none rounded-none m-0 p-0"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as OptionsTab)}
        data-testid="options-tabs"
        data-oid="pxpi._h"
      >
        {/* Вкладки */}
        <TabsList
          className="grid w-full grid-cols-4 shrink-0 border-none bg-muted/50 rounded-none m-0 p-0"
          data-testid="options-tabs-list"
          data-oid=":1ddjrr"
        >
          {TABS.map((tab) => (
            <TabsTrigger
              className={cn(TAB_BUTTON_STYLES, "h-[35px] flex-row items-center justify-center gap-2")}
              key={tab.id}
              value={tab.id}
              data-testid={`options-tab-${tab.id}`}
              data-oid="1l-p304"
            >
              {tab.icon}
              <span className="" data-oid="bqf7wj-">
                {t(tab.labelKey)}
              </span>
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
            data-oid="h:a691p"
          >
            {activeTab === tab.id && (
              <div className="h-full" data-testid={`options-${tab.id}-settings`} data-oid="in22nfi">
                {renderTabContent()}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

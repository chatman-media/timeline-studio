import {
  Blend,
  FlipHorizontal2,
  Grid2X2,
  Image,
  Music,
  Sparkles,
  Sticker,
  Type,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_TRIGGER_STYLES =
  "text-xs text-gray-600 dark:bg-[#2D2D2D] border-none " +
  "dark:data-[state=active]:bg-[#252526] dark:data-[state=active]:text-[#35d1c1] data-[state=active]:text-text-gray-900" +
  "hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#252526] dark:hover:text-gray-100 " +
  "flex flex-col items-center justify-center gap-1 py-2 " +
  "[&>svg]:data-[state=active]:text-[#38dacac3] cursor-pointer data-[state=active]:cursor-default rounded-none";

interface BrowserTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function BrowserTabs({ activeTab, onTabChange }: BrowserTabsProps) {
  const { t } = useTranslation();

  return (
    <TabsList className="h-[50px] flex-shrink-0 justify-start border-none rounded-none dark:bg-[#252526] m-0 p-0">
      <TabsTrigger
        value="media"
        className={TAB_TRIGGER_STYLES}
        onClick={() => onTabChange("media")}
        data-state={activeTab === "media" ? "active" : "inactive"}
      >
        <Image className="h-4 w-4" />
        <span>{t("browser.tabs.media")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="music"
        className={TAB_TRIGGER_STYLES}
        onClick={() => onTabChange("music")}
        data-state={activeTab === "music" ? "active" : "inactive"}
      >
        <Music className="h-4 w-4" />
        <span>{t("browser.tabs.music")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="subtitles"
        className={TAB_TRIGGER_STYLES}
        onClick={() => onTabChange("subtitles")}
        data-state={activeTab === "subtitles" ? "active" : "inactive"}
      >
        <Type className="h-4 w-4" />
        <span>{t("browser.tabs.subtitles")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="effects"
        className={TAB_TRIGGER_STYLES}
        onClick={() => onTabChange("effects")}
        data-state={activeTab === "effects" ? "active" : "inactive"}
      >
        <Sparkles className="h-4 w-4" />
        <span>{t("browser.tabs.effects")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="filters"
        className={TAB_TRIGGER_STYLES}
        onClick={() => onTabChange("filters")}
        data-state={activeTab === "filters" ? "active" : "inactive"}
      >
        <Blend className="h-4 w-4" />
        <span>{t("browser.tabs.filters")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="transitions"
        className={TAB_TRIGGER_STYLES}
        onClick={() => onTabChange("transitions")}
        data-state={activeTab === "transitions" ? "active" : "inactive"}
      >
        <FlipHorizontal2 className="h-4 w-4" />
        <span>{t("browser.tabs.transitions")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="templates"
        className={TAB_TRIGGER_STYLES}
        onClick={() => onTabChange("templates")}
        data-state={activeTab === "templates" ? "active" : "inactive"}
      >
        <Grid2X2 className="h-4 w-4" />
        <span>{t("browser.tabs.templates")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="style-templates"
        className={TAB_TRIGGER_STYLES}
        onClick={() => onTabChange("style-templates")}
        data-state={activeTab === "style-templates" ? "active" : "inactive"}
      >
        <Sticker className="h-4 w-4" />
        <span>{t("browser.tabs.styleTemplates")}</span>
      </TabsTrigger>
    </TabsList>
  );
}

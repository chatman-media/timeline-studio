import { useState } from "react"

import { useTranslation } from "react-i18next"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { AiServicesTab } from "./tabs/ai-services-tab"
import { AppearanceTab } from "./tabs/appearance-tab"
import { DevelopmentTab } from "./tabs/development-tab"
import { GeneralSettingsTab } from "./tabs/general-settings-tab"
import { PerformanceSettingsTab } from "./tabs/performance-settings-tab"
import { SocialNetworksTab } from "./tabs/social-networks-tab"
import { VersionControlTab } from "./tabs/version-control-tab"

/**
 * Компонент модального окна настроек пользователя с вкладками
 * Организует настройки по категориям для удобства навигации
 */
export function UserSettingsModalTabs() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("general")

  // Определяем, показывать ли вкладку разработки (только в dev режиме)
  const isDevelopment = process.env.NODE_ENV === "development"

  return (
    <div className="flex flex-col h-full" data-oid="77q8soy">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full" data-oid="3cco27a">
        {/* Список вкладок */}
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-7" data-oid="xt:xm6c">
          <TabsTrigger value="general" className="text-xs" data-oid="5qgvacg">
            {t("dialogs.userSettings.tabs.general", "Основные")}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs">
            {t("dialogs.userSettings.tabs.appearance", "Внешний вид")}
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-xs" data-oid="47xj-dl">
            {t("dialogs.userSettings.tabs.performance", "Производительность")}
          </TabsTrigger>
          <TabsTrigger value="ai-services" className="text-xs" data-oid="no71qiq">
            {t("dialogs.userSettings.tabs.aiServices", "AI Сервисы")}
          </TabsTrigger>
          <TabsTrigger value="social-networks" className="text-xs" data-oid="4jrz9jp">
            {t("dialogs.userSettings.tabs.socialNetworks", "Соц. сети")}
          </TabsTrigger>
          <TabsTrigger value="version-control" className="text-xs" data-oid="1i808ht">
            {t("dialogs.userSettings.tabs.versionControl", "Версии")}
          </TabsTrigger>
          {isDevelopment && (
            <TabsTrigger value="development" className="text-xs" data-oid="sfj3i0t">
              {t("dialogs.userSettings.tabs.development", "Разработка")}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Содержимое вкладок */}
        <div className="flex-1 mt-4 overflow-auto" data-oid="vhbz:ee">
          <TabsContent value="general" className="h-full mt-0" data-oid="ac0:a26">
            <GeneralSettingsTab data-oid="z-k0kw." />
          </TabsContent>

          <TabsContent value="appearance" className="h-full mt-0">
            <AppearanceTab />
          </TabsContent>

          <TabsContent value="performance" className="h-full mt-0" data-oid="tw5pfrn">
            <PerformanceSettingsTab data-oid="itz_eek" />
          </TabsContent>

          <TabsContent value="ai-services" className="h-full mt-0" data-oid="dqeys7c">
            <AiServicesTab data-oid="bvofasf" />
          </TabsContent>

          <TabsContent value="social-networks" className="h-full mt-0" data-oid="icm7ioh">
            <SocialNetworksTab data-oid="km:-8lv" />
          </TabsContent>

          <TabsContent value="version-control" className="h-full mt-0" data-oid="bww9g6j">
            <VersionControlTab data-oid="yjok-d6" />
          </TabsContent>

          {isDevelopment && (
            <TabsContent value="development" className="h-full mt-0" data-oid="._x4ff.">
              <DevelopmentTab data-oid="r47pzoa" />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  )
}

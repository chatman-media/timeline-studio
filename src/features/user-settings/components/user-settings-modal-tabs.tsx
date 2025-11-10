import { useState } from "react"

import { useTranslation } from "react-i18next"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { AiServicesTab } from "./tabs/ai-services-tab"
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
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        {/* Список вкладок */}
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-6">
          <TabsTrigger value="general" className="text-xs">
            {t("dialogs.userSettings.tabs.general", "Основные")}
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-xs">
            {t("dialogs.userSettings.tabs.performance", "Производительность")}
          </TabsTrigger>
          <TabsTrigger value="ai-services" className="text-xs">
            {t("dialogs.userSettings.tabs.aiServices", "AI Сервисы")}
          </TabsTrigger>
          <TabsTrigger value="social-networks" className="text-xs">
            {t("dialogs.userSettings.tabs.socialNetworks", "Соц. сети")}
          </TabsTrigger>
          <TabsTrigger value="version-control" className="text-xs">
            {t("dialogs.userSettings.tabs.versionControl", "Версии")}
          </TabsTrigger>
          {isDevelopment && (
            <TabsTrigger value="development" className="text-xs">
              {t("dialogs.userSettings.tabs.development", "Разработка")}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Содержимое вкладок */}
        <div className="flex-1 mt-4 overflow-auto">
          <TabsContent value="general" className="h-full mt-0">
            <GeneralSettingsTab />
          </TabsContent>

          <TabsContent value="performance" className="h-full mt-0">
            <PerformanceSettingsTab />
          </TabsContent>

          <TabsContent value="ai-services" className="h-full mt-0">
            <AiServicesTab />
          </TabsContent>

          <TabsContent value="social-networks" className="h-full mt-0">
            <SocialNetworksTab />
          </TabsContent>

          <TabsContent value="version-control" className="h-full mt-0">
            <VersionControlTab />
          </TabsContent>

          {isDevelopment && (
            <TabsContent value="development" className="h-full mt-0">
              <DevelopmentTab />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  )
}

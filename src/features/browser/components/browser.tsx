import { type BrowserTab, useBrowserState } from "@/domains/browser"
import { useBrowserAIIntegration } from "@/features/ai-chat"
import { EffectsProvider } from "../providers/browser-resources-provider"
import { BrowserContent } from "./browser-content"
import { BrowserTabs } from "./browser-tabs"

// Внутренний компонент, который использует состояние браузера
function BrowserWithState() {
  const { activeTab, switchTab } = useBrowserState()

  // Подключаем AI интеграцию
  const { isReady } = useBrowserAIIntegration()

  const handleTabChange = (value: string) => {
    switchTab(value as BrowserTab)
  }

  return (
    <div className="relative h-full w-full flex flex-col gap-0 dark:bg-[#2D2D2D]" data-oid="_41dqo7">
      {/* Табы вне Tabs компонента для избежания ререндера */}
      <BrowserTabs activeTab={activeTab} onTabChange={handleTabChange} data-oid="fv88s.9" />
      <BrowserContent data-oid="n1b932_" />
    </div>
  )
}

// Клиентский компонент Browser
// Note: BrowserProvider теперь на верхнем уровне (providers.tsx)
export function Browser() {
  return (
    <EffectsProvider
      config={{
        initialSources: ["built-in"],
        backgroundLoadDelay: 1500,
        enableCaching: true,
        maxCacheSize: 50 * 1024 * 1024, // 50MB
      }}
      onError={(_error) => {
        // Handle effects provider error
      }}
      data-oid="njmdhzy"
    >
      <BrowserWithState data-oid="zr62jin" />
    </EffectsProvider>
  )
}

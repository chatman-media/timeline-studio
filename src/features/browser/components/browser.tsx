import { useBrowserAIIntegration } from "@/features/ai-chat/hooks/use-browser-ai-integration"
import { useBrowserState } from "@/domains/browser"
import { EffectsProvider } from "../providers/browser-resources-provider"
import { BrowserContent } from "./browser-content"
import { BrowserTabs } from "./browser-tabs"

// Внутренний компонент, который использует состояние браузера
function BrowserWithState() {
  const { activeTab, switchTab } = useBrowserState()

  // Подключаем AI интеграцию
  const { isReady } = useBrowserAIIntegration()

  const handleTabChange = (value: string) => {
    switchTab(value as any) // TODO: типизировать правильно
  }

  return (
    <div className="relative h-full w-full flex flex-col gap-0 dark:bg-[#2D2D2D]">
      {/* Табы вне Tabs компонента для избежания ререндера */}
      <BrowserTabs activeTab={activeTab} onTabChange={handleTabChange} />
      <BrowserContent />
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
    >
      <BrowserWithState />
    </EffectsProvider>
  )
}

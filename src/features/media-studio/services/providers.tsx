/**
 * Providers
 *
 * Провайдеры с интеграцией backend state management
 */

"use client"

import { type ReactNode } from "react"
import { AppInitProvider } from "@/adapters/react"
import { BrowserProvider } from "@/domains/browser"
import { MediaManagementProvider } from "@/domains/media-management"
import { AppProvider } from "@/domains/project-management/providers"
import { TimelineProvider } from "@/domains/video-editing/providers/timeline-providers"
import { ChatProvider } from "@/features/ai-chat/services/chat-provider"
import { MCPProvider } from "@/features/ai-chat/services/mcp-provider"
import { ThemeProvider } from "@/features/media-studio/components/top-bar/theme/theme-context"
import { ModalProvider } from "@/features/modals/services/modal-provider"
import { ProjectSettingsProvider } from "@/features/project-settings/services/project-settings-provider"
import { ResourcesProvider } from "@/features/resources/services/resources-provider"
import { PlayerProvider } from "@/features/video-player/services/player-provider"
import { TauriMockProvider } from "@/global/tauri-mock-provider"
import { I18nProvider } from "@/i18n/services/i18n-provider"

interface ProvidersProps {
  children: ReactNode
}

// Создаем композитный провайдер для уменьшения вложенности
const composeProviders = (...providers: React.ComponentType<{ children: ReactNode }>[]) => {
  return ({ children }: { children: ReactNode }) => {
    return providers.reduceRight((child, Provider) => <Provider>{child}</Provider>, children)
  }
}

// Создаем единый провайдер из всех контекстов
// ВАЖНО: Порядок провайдеров оптимизирован для новой архитектуры!
// AppInitProvider регистрирует адаптеры в DI контейнере
const AppProviderComposite = composeProviders(
  TauriMockProvider, // Должен быть первым для инициализации моков Tauri
  AppInitProvider, // ✅ Инициализация DI контейнера с адаптерами (Tauri/Mock)
  I18nProvider, // Легкий провайдер для локализации (не блокирует рендер)
  ThemeProvider, // Легкий провайдер для темы
  ModalProvider, // Легкий провайдер для модальных окон

  // ✅ НОВАЯ АРХИТЕКТУРА
  AppProvider, // Новый провайдер с backend state management

  // Остальные провайдеры (некоторые будут мигрированы позже)
  // UserSettingsProvider, // Пользовательские настройки больше не обязательны: читаются через доменный хук
  ProjectSettingsProvider, // ✅ Новый провайдер настроек проекта с backend синхронизацией
  // ShortcutsProvider, // ОТКЛЮЧЕНО: отключено по запросу
  MediaManagementProvider, // ✅ Провайдер управления медиа с event-driven архитектурой
  ResourcesProvider, // ✅ Новый провайдер ресурсов с backend интеграцией
  BrowserProvider, // ✅ Провайдер браузера с полной интеграцией backend state

  // ✅ НОВАЯ TIMELINE АРХИТЕКТУРА
  TimelineProvider, // Новый провайдер timeline с backend интеграцией

  PlayerProvider, // ✅ Новый провайдер видеоплеера с backend синхронизацией
  ChatProvider, // ✅ Новый провайдер чата с backend интеграцией для истории
  MCPProvider, // ✅ Провайдер MCP для интеграции Claude Code с инструментами видеомонтажа
  // AIIntelligenceProvider, // ОТКЛЮЧЕНО: может быть тяжелым и вызывать зависания
)

export function Providers({ children }: ProvidersProps) {
  return <AppProviderComposite>{children}</AppProviderComposite>
}

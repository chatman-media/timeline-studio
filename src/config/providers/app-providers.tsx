/**
 * App Providers - FEOD App Layer
 *
 * Композиция всех провайдеров приложения.
 * Использует Orchestrator Pattern с DI Container для управления состоянием.
 *
 * ⚠️ ВАЖНО: Импортируется ТОЛЬКО в /src/app/layout.tsx!
 * Никакие другие файлы не должны импортировать из /src/config/
 */

"use client"

import { type ReactNode } from "react"
import { AppInitProvider } from "@/adapters/react"
import { BrowserProvider as CoreBrowserProvider } from "@/core/services/browser-context"
import { setAITools } from "@/core/services/ai-tools-registry"
import { setMediaManagementBindings } from "@/core/services/media-management-registry"
import { ChatProvider, MCPProvider } from "@/domains/ai-services"
import { allAITools } from "@/domains/ai-tools"
import { BrowserProvider as DomainBrowserProvider, useBrowser as useDomainBrowser } from "@/domains/browser"
import * as mediaManagementBindings from "@/domains/media-management"
import { AppProvider, ProjectSettingsProvider } from "@/domains/project-management/providers"
import { getSystemIntegrationOrchestrator } from "@/domains/system-integration"
import { ColorSchemeProvider } from "@/features/color-scheme"
import { PlayerProvider } from "@/features/timeline/providers/player-provider"
import { ResourcesProvider } from "@/features/timeline/providers/resources-provider"
import { TimelineProvider } from "@/features/timeline/providers/timeline-providers"
import { I18nProvider } from "@/i18n/services/i18n-provider"
import { TauriMockProvider } from "@/test/providers/tauri-mock-provider"
import { ThemeProvider } from "./theme-provider"

interface ProvidersProps {
  children: ReactNode
}

// Создаем композитный провайдер для уменьшения вложенности
const composeProviders = (...providers: React.ComponentType<{ children: ReactNode }>[]) => {
  return ({ children }: { children: ReactNode }) => {
    return providers.reduceRight((child, Provider) => <Provider data-oid="m4b5f48">{child}</Provider>, children)
  }
}

function SystemIntegrationBootstrapProvider({ children }: { children: ReactNode }) {
  getSystemIntegrationOrchestrator()
  return <>{children}</>
}

function AIToolsBootstrapProvider({ children }: { children: ReactNode }) {
  setAITools(allAITools)
  return <>{children}</>
}

function MediaManagementBindingsBootstrapProvider({ children }: { children: ReactNode }) {
  setMediaManagementBindings(mediaManagementBindings)
  return <>{children}</>
}

function BrowserCoreBridgeProvider({ children }: { children: ReactNode }) {
  const browser = useDomainBrowser()
  return <CoreBrowserProvider value={browser}>{children}</CoreBrowserProvider>
}

/**
 * Композиция провайдеров (FEOD App Layer)
 *
 * КРИТИЧЕСКИ ВАЖЕН ПОРЯДОК! Структура по концепции Orchestrator Pattern:
 *
 * [1] ИНФРАСТРУКТУРНЫЕ (обязательно первыми):
 *     TauriMockProvider    → Моки Tauri API для browser режима
 *     AppInitProvider      → Инициализация DI контейнера:
 *                             - IBackendService (Tauri commands/events)
 *                             - IPlatformService (платформа и ОС)
 *                             - IStorageService (файловая система)
 *
 * [2] ЛЕГКИЕ КОНФИГУРАЦИОННЫЕ:
 *     I18nProvider         → Локализация (не блокирует рендер)
 *     ThemeProvider        → Тема приложения
 *     ModalProvider        → Управление модальными окнами
 *
 * [3] ДОМЕННЫЕ (используют Orchestrators с backend из DI):
 *     AppProvider                → ProjectManagementOrchestrator
 *     ProjectSettingsProvider    → Настройки проекта
 *     MediaManagementProvider    → MediaManagementOrchestrator
 *     ResourcesProvider          → Ресурсы (эффекты/фильтры)
 *     BrowserProvider            → BrowserOrchestrator
 *     TimelineProvider           → VideoEditingOrchestrator
 *     PlayerProvider             → Видеоплеер
 *     ChatProvider               → AI чат
 *     MCPProvider                → MCP интеграция
 *
 * ⚠️ ВАЖНО: Доменные провайдеры зависят от AppInitProvider!
 * Их orchestrators получают IBackendService из DI контейнера.
 *
 * См. /src/config/README.md для архитектурных деталей
 */
const AppProviderComposite = composeProviders(
  // [1] ИНФРАСТРУКТУРНЫЕ
  TauriMockProvider, // Моки Tauri для browser режима (первым!)
  AppInitProvider, // DI контейнер: регистрирует Backend/Platform/Storage адаптеры

  // [2] ЛЕГКИЕ КОНФИГУРАЦИОННЫЕ
  I18nProvider, // Локализация
  ThemeProvider, // Тема (light/dark/system через next-themes)
  ColorSchemeProvider, // Применение цветовых схем + синхронизация режима темы со стором
  SystemIntegrationBootstrapProvider, // Регистрирует backend-aware modal service в core container
  AIToolsBootstrapProvider, // Регистрирует domain AI tools через core registry

  // [3] ДОМЕННЫЕ С ORCHESTRATORS
  AppProvider, // ProjectManagementOrchestrator - управление проектами/настройками
  ProjectSettingsProvider, // Настройки проекта с backend синхронизацией
  MediaManagementBindingsBootstrapProvider, // Регистрирует domain media hooks через core registry
  mediaManagementBindings.MediaManagementProvider, // MediaManagementOrchestrator - управление медиа файлами
  ResourcesProvider, // Ресурсы (effects/filters/transitions) с backend интеграцией
  DomainBrowserProvider, // BrowserOrchestrator - медиа браузер с backend state
  BrowserCoreBridgeProvider, // Публикует browser state в core context для features

  TimelineProvider, // VideoEditingOrchestrator - timeline редактор

  PlayerProvider, // Видеоплеер с backend синхронизацией
  ChatProvider, // AI чат с backend интеграцией для истории
  MCPProvider, // MCP для интеграции Claude Code с инструментами видеомонтажа
)

export function Providers({ children }: ProvidersProps) {
  return <AppProviderComposite data-oid="u1xqel_">{children}</AppProviderComposite>
}

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

import { AppInitProvider } from "@timeline-studio/adapters/react"
import { setAITools } from "@timeline-studio/core/services/ai-tools-registry"
import { BrowserProvider as CoreBrowserProvider } from "@timeline-studio/core/services/browser-context"
import { setMediaManagementBindings } from "@timeline-studio/core/services/media-management-registry"
import { setMontagePlannerBindings } from "@timeline-studio/core/services/montage-planner-registry"
import { setVideoEditingBindings } from "@timeline-studio/core/services/video-editing-registry"
import {
  ChatProvider,
  MCPProvider,
  montagePlannerMachine,
  unifiedOrchestrator,
} from "@timeline-studio/domains/ai-services"
import {
  applyPlanToTimeline,
  ContentAnalyzer,
  createMarkersFromPlan,
  MomentDetector,
  PlanGenerator,
  RhythmCalculator,
} from "@timeline-studio/domains/ai-services/services/montage-planning"
import { allAITools } from "@timeline-studio/domains/ai-tools"
import {
  BrowserProvider as DomainBrowserProvider,
  useBrowser as useDomainBrowser,
} from "@timeline-studio/domains/browser"
import * as mediaManagementBindings from "@timeline-studio/domains/media-management"
import { AppProvider, ProjectSettingsProvider } from "@timeline-studio/domains/project-management/providers"
import { DOMAIN_EVENTS, eventBus } from "@timeline-studio/domains/shared/events"
import { getSystemIntegrationOrchestrator } from "@timeline-studio/domains/system-integration"
import { getVideoEditingOrchestrator, UndoRedoHelpers, useUndoRedo } from "@timeline-studio/domains/video-editing"
import { type ReactNode } from "react"
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

function MontagePlannerBindingsBootstrapProvider({ children }: { children: ReactNode }) {
  setMontagePlannerBindings({
    applyPlanToTimeline,
    ContentAnalyzer,
    createMarkersFromPlan,
    DOMAIN_EVENTS,
    eventBus,
    MomentDetector,
    montagePlannerMachine,
    PlanGenerator,
    RhythmCalculator,
    unifiedOrchestrator,
  })
  return <>{children}</>
}

function VideoEditingBindingsBootstrapProvider({ children }: { children: ReactNode }) {
  setVideoEditingBindings({
    getVideoEditingOrchestrator,
    UndoRedoHelpers,
    useUndoRedo,
  })
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
  MontagePlannerBindingsBootstrapProvider, // Регистрирует domain montage planner API через core registry

  // [3] ДОМЕННЫЕ С ORCHESTRATORS
  AppProvider, // ProjectManagementOrchestrator - управление проектами/настройками
  ProjectSettingsProvider, // Настройки проекта с backend синхронизацией
  MediaManagementBindingsBootstrapProvider, // Регистрирует domain media hooks через core registry
  mediaManagementBindings.MediaManagementProvider, // MediaManagementOrchestrator - управление медиа файлами
  ResourcesProvider, // Ресурсы (effects/filters/transitions) с backend интеграцией
  DomainBrowserProvider, // BrowserOrchestrator - медиа браузер с backend state
  BrowserCoreBridgeProvider, // Публикует browser state в core context для features

  VideoEditingBindingsBootstrapProvider, // Регистрирует domain video editing API через core registry
  TimelineProvider, // VideoEditingOrchestrator - timeline редактор

  PlayerProvider, // Видеоплеер с backend синхронизацией
  ChatProvider, // AI чат с backend интеграцией для истории
  MCPProvider, // MCP для интеграции Claude Code с инструментами видеомонтажа
)

export function Providers({ children }: ProvidersProps) {
  return <AppProviderComposite data-oid="u1xqel_">{children}</AppProviderComposite>
}

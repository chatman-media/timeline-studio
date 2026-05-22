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
import { ChatProvider, MCPProvider } from "@/domains/ai-services"
import { BrowserProvider } from "@/domains/browser"
import { MediaManagementProvider } from "@/domains/media-management"
import { AppProvider, ProjectSettingsProvider } from "@/domains/project-management/providers"
import { PlayerProvider, ResourcesProvider, TimelineProvider } from "@/domains/video-editing"
import { ColorSchemeProvider } from "@/features/color-scheme"
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

  // [3] ДОМЕННЫЕ С ORCHESTRATORS
  AppProvider, // ProjectManagementOrchestrator - управление проектами/настройками
  ProjectSettingsProvider, // Настройки проекта с backend синхронизацией
  MediaManagementProvider, // MediaManagementOrchestrator - управление медиа файлами
  ResourcesProvider, // Ресурсы (effects/filters/transitions) с backend интеграцией
  BrowserProvider, // BrowserOrchestrator - медиа браузер с backend state

  TimelineProvider, // VideoEditingOrchestrator - timeline редактор

  PlayerProvider, // Видеоплеер с backend синхронизацией
  ChatProvider, // AI чат с backend интеграцией для истории
  MCPProvider, // MCP для интеграции Claude Code с инструментами видеомонтажа
)

export function Providers({ children }: ProvidersProps) {
  return <AppProviderComposite data-oid="u1xqel_">{children}</AppProviderComposite>
}

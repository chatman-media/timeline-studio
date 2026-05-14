import { type RenderOptions, render } from "@testing-library/react"
import type { ReactElement, ReactNode } from "react"
import { ThemeProvider } from "@/config/providers"
import { ChatProvider } from "@/domains/ai-services"
import { AppProvider, ProjectSettingsProvider } from "@/domains/project-management/providers"
import { PlayerProvider, ResourcesProvider } from "@/domains/video-editing"
import { BrowserStateProvider } from "@/features/browser/services/browser-state-provider"
import { ModalProvider } from "@/features/modals/services/modal-provider"
import { TimelineProvider } from "@/features/timeline/providers/timeline-providers"
import { UserSettingsProvider } from "@/features/user-settings"
import { I18nProvider } from "@/i18n/services/i18n-provider"

// ✅ Базовые провайдеры (минимум для большинства компонентов)
export const BaseProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider data-oid="-z180nx">
      <I18nProvider data-oid="zdb4jne">
        <AppProvider data-oid="tbx3hpt">
          <ModalProvider data-oid="o_ef8r6">{children}</ModalProvider>
        </AppProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}

// ✅ Провайдеры для медиа компонентов
export const MediaProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders data-oid="csylne6">
      <ResourcesProvider data-oid="0:lpksz">{children}</ResourcesProvider>
    </BaseProviders>
  )
}

// ✅ Провайдеры для видеоплеера
export const PlayerProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders data-oid="-xuoqoy">
      <UserSettingsProvider data-oid="wwy91oy">
        <PlayerProvider data-oid="fryi5rz">{children}</PlayerProvider>
      </UserSettingsProvider>
    </BaseProviders>
  )
}

// ✅ Провайдеры для Timeline
export const TimelineProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders data-oid="d3vf352">
      <ModalProvider data-oid="9roh4hm">
        <ProjectSettingsProvider data-oid="37jv90h">
          <UserSettingsProvider data-oid="pg-:qf4">
            <ResourcesProvider data-oid="_7-2mxm">
              <PlayerProvider data-oid="i.kwh2t">
                <ChatProvider data-oid="_nujffq">
                  <TimelineProvider data-oid="ft438l0">{children}</TimelineProvider>
                </ChatProvider>
              </PlayerProvider>
            </ResourcesProvider>
          </UserSettingsProvider>
        </ProjectSettingsProvider>
      </ModalProvider>
    </BaseProviders>
  )
}

// ✅ Провайдеры для модалов
export const ModalProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders data-oid="j8:93-c">
      <ModalProvider data-oid="-fuaw2d">
        <ProjectSettingsProvider data-oid="_r494fo">
          <UserSettingsProvider data-oid="osrj24x">{children}</UserSettingsProvider>
        </ProjectSettingsProvider>
      </ModalProvider>
    </BaseProviders>
  )
}

// ✅ Провайдеры для чата
export const ChatProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders data-oid="5eaagia">
      <UserSettingsProvider data-oid="ezhcck4">
        <ModalProvider data-oid="8y6zkwe">
          <ChatProvider data-oid="19gqig.">{children}</ChatProvider>
        </ModalProvider>
      </UserSettingsProvider>
    </BaseProviders>
  )
}

const TemplateProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders data-oid="wq0xjzc">
      <UserSettingsProvider data-oid="1pv4m5q">
        <ResourcesProvider data-oid="mtl2.i-">
          <PlayerProvider data-oid="1_gz-.8">{children}</PlayerProvider>
        </ResourcesProvider>
      </UserSettingsProvider>
    </BaseProviders>
  )
}

// ✅ Провайдеры для браузера (субтитры, эффекты и т.д.)
export const BrowserProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders data-oid="hbjvpb5">
      <ProjectSettingsProvider data-oid="692.2-1">
        <UserSettingsProvider data-oid="4td.7-5">
          <ResourcesProvider data-oid="v3oxspu">
            <BrowserStateProvider data-oid="_ts:.pg">{children}</BrowserStateProvider>
          </ResourcesProvider>
        </UserSettingsProvider>
      </ProjectSettingsProvider>
    </BaseProviders>
  )
}

// ✅ Специализированные функции рендеринга
export const renderWithBase = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
  return render(ui, { wrapper: BaseProviders, ...options })
}

export const renderWithMedia = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
  return render(ui, { wrapper: MediaProviders, ...options })
}

export const renderWithPlayer = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
  return render(ui, { wrapper: PlayerProviders, ...options })
}

export const renderWithTimeline = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
  return render(ui, { wrapper: TimelineProviders, ...options })
}

export const renderWithModal = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
  return render(ui, { wrapper: ModalProviders, ...options })
}

export const renderWithChat = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
  return render(ui, { wrapper: ChatProviders, ...options })
}

export const renderWithTemplates = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
  return render(ui, { wrapper: TemplateProviders, ...options })
}

export const renderWithBrowser = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
  return render(ui, { wrapper: BrowserProviders, ...options })
}

// 🎯 Умная функция рендеринга (по умолчанию базовые провайдеры)
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
  return render(ui, { wrapper: BaseProviders, ...options })
}

// Реэкспортируем только то, что нам нужно
export { fireEvent, screen, waitFor, within } from "@testing-library/react"
// Переопределение функции render (теперь с базовыми провайдерами)
// Алиас для совместимости с существующими тестами
// Экспорт wrapper для использования в renderHook
export { BaseProviders as wrapper, customRender as render, renderWithTemplates as renderWithProviders }

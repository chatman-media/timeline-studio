import { type RenderOptions, render } from "@testing-library/react"
import type { ReactElement, ReactNode } from "react"
import { TimelineProvider } from "@/domains/video-editing/providers/timeline-providers"
import { ChatProvider } from "@/features/ai-chat/services/chat-provider"
import { AppProvider } from "@/features/app-state/services/app-provider"
import { BrowserStateProvider } from "@/features/browser/services/browser-state-provider"
import { ThemeProvider } from "@/features/media-studio/components/top-bar/theme/theme-context"
import { ModalProvider } from "@/features/modals/services/modal-provider"
import { ProjectSettingsProvider } from "@/features/project-settings"
import { ResourcesProvider } from "@/features/resources"
import { UserSettingsProvider } from "@/features/user-settings"
import { PlayerProvider } from "@/features/video-player/services/player-provider"
import { I18nProvider } from "@/i18n/services/i18n-provider"

// ✅ Базовые провайдеры (минимум для большинства компонентов)
export const BaseProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppProvider>
          <ModalProvider>{children}</ModalProvider>
        </AppProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}

// ✅ Провайдеры для медиа компонентов
export const MediaProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders>
      <ResourcesProvider>{children}</ResourcesProvider>
    </BaseProviders>
  )
}

// ✅ Провайдеры для видеоплеера
export const PlayerProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders>
      <UserSettingsProvider>
        <PlayerProvider>{children}</PlayerProvider>
      </UserSettingsProvider>
    </BaseProviders>
  )
}

// ✅ Провайдеры для Timeline
export const TimelineProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders>
      <ModalProvider>
        <ProjectSettingsProvider>
          <UserSettingsProvider>
            <ResourcesProvider>
              <PlayerProvider>
                <ChatProvider>
                  <TimelineProvider>{children}</TimelineProvider>
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
    <BaseProviders>
      <ModalProvider>
        <ProjectSettingsProvider>
          <UserSettingsProvider>{children}</UserSettingsProvider>
        </ProjectSettingsProvider>
      </ModalProvider>
    </BaseProviders>
  )
}

// ✅ Провайдеры для чата
export const ChatProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders>
      <UserSettingsProvider>
        <ModalProvider>
          <ChatProvider>{children}</ChatProvider>
        </ModalProvider>
      </UserSettingsProvider>
    </BaseProviders>
  )
}

const TemplateProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders>
      <UserSettingsProvider>
        <ResourcesProvider>
          <PlayerProvider>{children}</PlayerProvider>
        </ResourcesProvider>
      </UserSettingsProvider>
    </BaseProviders>
  )
}

// ✅ Провайдеры для браузера (субтитры, эффекты и т.д.)
export const BrowserProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders>
      <ProjectSettingsProvider>
        <UserSettingsProvider>
          <ResourcesProvider>
            <BrowserStateProvider>{children}</BrowserStateProvider>
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
export { customRender as render }

// Алиас для совместимости с существующими тестами
export { renderWithTemplates as renderWithProviders }

// Экспорт wrapper для использования в renderHook
export { BaseProviders as wrapper }

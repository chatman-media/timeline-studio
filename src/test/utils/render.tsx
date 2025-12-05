import { type RenderOptions as RTLRenderOptions, render as rtlRender } from "@testing-library/react"
import type React from "react"

// Provider imports

import { ThemeProvider } from "@/config/providers"
import { I18nProvider } from "@/i18n/services/i18n-provider"

// Type-safe provider configuration
interface ProviderConfig {
  timeline?: {
    initialProject?: any
    initialState?: any
  }
  media?: {
    initialFiles?: any[]
    initialState?: any
  }
  player?: {
    initialState?: any
  }
  appSettings?: {
    initialSettings?: any
  }
  userSettings?: {
    initialSettings?: any
  }
  projectSettings?: {
    initialSettings?: any
  }
  resources?: {
    initialResources?: any[]
  }
  theme?: {
    defaultTheme?: "light" | "dark" | "system"
    storageKey?: string
  }
  i18n?: {
    language?: string
    fallbackLanguage?: string
  }
}

interface RenderOptions extends Omit<RTLRenderOptions, "wrapper"> {
  providers?: Array<keyof ProviderConfig>
  providerConfig?: ProviderConfig
}

// Dynamic provider imports to avoid circular dependencies
const getProviders = async () => {
  const providers = {
    TimelineProvider: null as any,
    BrowserStateProvider: null as any,
    PlayerProvider: null as any,
    AppSettingsProvider: null as any,
    UserSettingsProvider: null as any,
    ProjectSettingsProvider: null as any,
    ResourcesProvider: null as any,
  }

  try {
    const { TimelineProvider } = await import("@/domains/video-editing/providers/timeline-providers")
    providers.TimelineProvider = TimelineProvider
  } catch (_e) {
    // Provider not available
  }

  try {
    const { BrowserStateProvider } = await import("@/features/browser/services/browser-state-provider")
    providers.BrowserStateProvider = BrowserStateProvider
  } catch (_e) {
    // Provider not available
  }

  try {
    const { PlayerProvider } = await import("@/domains/video-editing/providers")
    providers.PlayerProvider = PlayerProvider
  } catch (_e) {
    // Provider not available
  }

  try {
    const { AppProvider } = await import("@/domains/project-management/providers/app-provider")
    providers.AppSettingsProvider = AppProvider
  } catch (_e) {
    // Provider not available
  }

  // IMPORTANT: import via barrel so test setup mock applies and provider becomes a no-op in tests
  try {
    const { UserSettingsProvider } = await import("@/features/user-settings")
    providers.UserSettingsProvider = UserSettingsProvider
  } catch (_e) {
    // Provider not available (or mocked as no-op in tests)
  }

  try {
    const { ProjectSettingsProvider } = await import("@/domains/project-management/providers")
    providers.ProjectSettingsProvider = ProjectSettingsProvider
  } catch (_e) {
    // Provider not available
  }

  try {
    const { ResourcesProvider } = await import("@/domains/video-editing/providers")
    providers.ResourcesProvider = ResourcesProvider
  } catch (_e) {
    // Provider not available
  }

  return providers
}

export function createWrapper(options: RenderOptions = {}) {
  const { providers = ["theme", "i18n"] } = options

  return ({ children }: { children: React.ReactNode }) => {
    let wrapped = children

    // Always wrap with basic providers first
    if (providers.includes("i18n")) {
      wrapped = <I18nProvider>{wrapped}</I18nProvider>
    }

    if (providers.includes("theme")) {
      wrapped = <ThemeProvider>{wrapped}</ThemeProvider>
    }

    // Wrap with feature providers (these require dynamic imports)
    // For now, return the basic wrapper - feature providers will be added dynamically
    return wrapped
  }
}

// Synchronous render function for simple cases
export function render(ui: React.ReactElement, options: RenderOptions = {}) {
  const { providers, providerConfig, ...renderOptions } = options

  const Wrapper = createWrapper({ providers, providerConfig })

  return rtlRender(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  })
}

// Async render function for complex cases with dynamic providers
export async function renderAsync(ui: React.ReactElement, options: RenderOptions = {}) {
  const { providers = ["theme", "i18n"], providerConfig = {}, ...renderOptions } = options

  // Get all available providers
  const availableProviders = await getProviders()

  const AsyncWrapper = ({ children }: { children: React.ReactNode }) => {
    let wrapped = children

    // Apply providers in correct order (outermost first)
    if (providers.includes("resources") && availableProviders.ResourcesProvider) {
      const config = providerConfig.resources || {}
      wrapped = (
        <availableProviders.ResourcesProvider initialResources={config.initialResources}>
          {wrapped}
        </availableProviders.ResourcesProvider>
      )
    }

    if (providers.includes("projectSettings") && availableProviders.ProjectSettingsProvider) {
      const config = providerConfig.projectSettings || {}
      wrapped = (
        <availableProviders.ProjectSettingsProvider initialSettings={config.initialSettings}>
          {wrapped}
        </availableProviders.ProjectSettingsProvider>
      )
    }

    if (providers.includes("userSettings") && availableProviders.UserSettingsProvider) {
      const config = providerConfig.userSettings || {}
      wrapped = (
        <availableProviders.UserSettingsProvider initialSettings={config.initialSettings}>
          {wrapped}
        </availableProviders.UserSettingsProvider>
      )
    }

    if (providers.includes("appSettings") && availableProviders.AppSettingsProvider) {
      const config = providerConfig.appSettings || {}
      wrapped = (
        <availableProviders.AppSettingsProvider initialSettings={config.initialSettings}>
          {wrapped}
        </availableProviders.AppSettingsProvider>
      )
    }

    if (providers.includes("player") && availableProviders.PlayerProvider) {
      const config = providerConfig.player || {}
      wrapped = (
        <availableProviders.PlayerProvider initialState={config.initialState}>
          {wrapped}
        </availableProviders.PlayerProvider>
      )
    }

    if (providers.includes("media") && availableProviders.BrowserStateProvider) {
      const config = providerConfig.media || {}
      wrapped = (
        <availableProviders.BrowserStateProvider initialState={config.initialState}>
          {wrapped}
        </availableProviders.BrowserStateProvider>
      )
    }

    if (providers.includes("timeline") && availableProviders.TimelineProvider) {
      const config = providerConfig.timeline || {}
      wrapped = (
        <availableProviders.TimelineProvider initialState={config.initialState}>
          {wrapped}
        </availableProviders.TimelineProvider>
      )
    }

    if (providers.includes("theme")) {
      wrapped = <ThemeProvider>{wrapped}</ThemeProvider>
    }

    if (providers.includes("i18n")) {
      wrapped = <I18nProvider>{wrapped}</I18nProvider>
    }

    return wrapped
  }

  return rtlRender(ui, {
    wrapper: AsyncWrapper,
    ...renderOptions,
  })
}

// Utility render functions for common scenarios
export const renderWithTheme = (ui: React.ReactElement, theme: "light" | "dark" = "light") =>
  render(ui, {
    providers: ["theme"],
    providerConfig: { theme: { defaultTheme: theme } },
  })

export const renderWithProviders = (
  ui: React.ReactElement,
  providers: Array<keyof ProviderConfig> = ["theme", "i18n"],
) => render(ui, { providers })

export const renderWithTimeline = (ui: React.ReactElement, initialProject?: any) =>
  renderAsync(ui, {
    providers: ["theme", "i18n", "timeline"],
    providerConfig: { timeline: { initialProject } },
  })

export const renderWithMedia = (ui: React.ReactElement, initialFiles?: any[]) =>
  renderAsync(ui, {
    providers: ["theme", "i18n", "media"],
    providerConfig: { media: { initialFiles } },
  })

export {
  act,
  buildQueries,
  cleanup,
  findAllByAltText,
  findAllByDisplayValue,
  findAllByLabelText,
  findAllByPlaceholderText,
  findAllByRole,
  findAllByTestId,
  findAllByText,
  findAllByTitle,
  findByAltText,
  findByDisplayValue,
  findByLabelText,
  findByPlaceholderText,
  findByRole,
  findByTestId,
  findByText,
  findByTitle,
  fireEvent,
  getAllByAltText,
  getAllByDisplayValue,
  getAllByLabelText,
  getAllByPlaceholderText,
  getAllByRole,
  getAllByTestId,
  getAllByText,
  getAllByTitle,
  getByAltText,
  getByDisplayValue,
  getByLabelText,
  getByPlaceholderText,
  getByRole,
  getByTestId,
  getByText,
  getByTitle,
  getNodeText,
  getQueriesForElement,
  isInaccessible,
  logRoles,
  prettyDOM,
  prettyFormat,
  queries,
  queryAllByAltText,
  queryAllByDisplayValue,
  queryAllByLabelText,
  queryAllByPlaceholderText,
  queryAllByRole,
  queryAllByTestId,
  queryAllByText,
  queryAllByTitle,
  queryByAltText,
  queryByDisplayValue,
  queryByLabelText,
  queryByPlaceholderText,
  queryByRole,
  queryByTestId,
  queryByText,
  queryByTitle,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react"

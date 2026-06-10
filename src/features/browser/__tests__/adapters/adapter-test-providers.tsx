import type React from "react"
import type { ReactNode } from "react"

import { vi } from "vitest"

// Минимальный провайдер для тестирования адаптеров
// Избегаем циклических зависимостей, предоставляя только необходимый контекст
export const AdapterTestProviders = ({ children }: { children: ReactNode }) => {
  return <>{children}</>
}

// Моки для всех необходимых провайдеров без их реального импорта
export const setupAdapterMocks = () => {
  // Mock hooks from project-management domain
  vi.mock("@timeline-studio/domains/project-management/hooks", () => ({
    useFavorites: vi.fn(() => ({
      isItemFavorite: vi.fn(() => false),
    })),
    useAppSettings: vi.fn(() => ({
      getMusicFiles: vi.fn(() => ({ allFiles: [] })),
    })),
  }))

  // Mock I18nProvider
  vi.mock("@/i18n/services/i18n-provider", () => ({
    I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  }))

  vi.mock("@/i18n", () => ({
    default: {
      t: vi.fn((key) => key),
      language: "ru",
    },
  }))

  // Mock ThemeProvider
  vi.mock("@/features/top-bar/components/theme/theme-context", () => ({
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  }))

  // Mock ResourcesProvider
  vi.mock("@/features/resources", () => ({
    ResourcesProvider: ({ children }: { children: React.ReactNode }) => children,
    useResources: vi.fn(() => ({})),
  }))

  // Mock ProjectSettingsProvider
  vi.mock("@/features/project-settings", () => ({
    ProjectSettingsProvider: ({ children }: { children: React.ReactNode }) => children,
    useProjectSettings: vi.fn(() => ({
      settings: {
        fps: 30,
        resolution: { width: 1920, height: 1080 },
      },
    })),
  }))

  // Mock BrowserStateProvider
  vi.mock("@/features/browser/services/browser-state-provider", () => ({
    BrowserStateProvider: ({ children }: { children: React.ReactNode }) => children,
    useBrowserState: vi.fn(() => ({
      state: {},
      send: vi.fn(),
    })),
  }))
}

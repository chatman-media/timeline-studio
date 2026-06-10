import { vi } from "vitest"

// Мокаем все провайдеры из providers.tsx чтобы избежать циклических зависимостей
vi.mock("@/features/media-studio/services/providers.tsx", () => ({
  Providers: ({ children }: any) => children,
}))

// Мокаем TauriMockProvider
vi.mock("@/features/media-studio/services/tauri-mock-provider", () => ({
  TauriMockProvider: ({ children }: any) => children,
}))

// Мокаем I18nProvider
vi.mock("@/i18n/services/i18n-provider", () => ({
  I18nProvider: ({ children }: any) => children,
}))

// Мокаем ThemeProvider
vi.mock("@/features/top-bar/components/theme/theme-context", () => ({
  ThemeProvider: ({ children }: any) => children,
}))

// ModalProvider is no longer needed with new modal architecture
// Modal state is now managed via useModals hook from @timeline-studio/domains/system-integration

// Мокаем AppProvider и связанные хуки
vi.mock("@timeline-studio/domains/project-management/providers/app-provider", () => ({
  AppProvider: ({ children }: any) => children,
  useApp: vi.fn(() => ({
    projectState: { project: null },
    executeCommand: vi.fn(),
    isConnected: true,
    isConnecting: false,
    connectionError: null,
  })),
}))

vi.mock("@timeline-studio/domains/project-management/hooks", () => ({
  useFavorites: vi.fn(() => ({
    isItemFavorite: vi.fn(() => false),
  })),
}))

vi.mock("@timeline-studio/domains/project-management/hooks/use-music-files", () => ({
  useMusicFiles: vi.fn(() => ({
    musicFiles: [],
    addMusicFile: vi.fn(),
    removeMusicFile: vi.fn(),
    updateMusicFile: vi.fn(),
  })),
}))

// Мокаем BrowserStateProvider
vi.mock("@/features/browser/services/browser-state-provider", () => ({
  BrowserStateProvider: ({ children }: any) => children,
  useBrowserState: vi.fn(() => ({
    state: {},
    send: vi.fn(),
  })),
}))

// Мокаем ProjectSettingsProvider
vi.mock("@/features/project-settings", () => ({
  ProjectSettingsProvider: ({ children }: any) => children,
  useProjectSettings: vi.fn(() => ({
    settings: {
      fps: 30,
      resolution: { width: 1920, height: 1080 },
      aspectRatio: {
        label: "16:9",
        value: { width: 1920, height: 1080 },
      },
    },
  })),
}))

// Мокаем UserSettingsProvider
vi.mock("@/features/user-settings", () => ({
  UserSettingsProvider: ({ children }: any) => children,
}))

// Мокаем ShortcutsProvider
vi.mock("@/features/keyboard-shortcuts", () => ({
  ShortcutsProvider: ({ children }: any) => children,
}))

// Мокаем ResourcesProvider
vi.mock("@/features/resources", () => ({
  ResourcesProvider: ({ children }: any) => children,
  useResources: vi.fn(() => ({})),
}))

// Мокаем ResourcesProvider альтернативный путь
vi.mock("@timeline-studio/domains/video-editing", () => ({
  ResourcesProvider: ({ children }: any) => children,
}))

// Мокаем TimelineProvider
vi.mock("@/features/timeline/providers/timeline-providers", () => ({
  TimelineProvider: ({ children }: any) => children,
}))

// Мокаем PlayerProvider
vi.mock("@timeline-studio/domains/video-editing/player-provider", () => ({
  PlayerProvider: ({ children }: any) => children,
}))

// Мокаем ChatProvider
vi.mock("@timeline-studio/domains/ai-services/providers/chat-provider", () => ({
  ChatProvider: ({ children }: any) => children,
}))

// Мокаем BrowserResourcesProvider (EffectsProvider устарел)
const mockBrowserResourcesProvider = vi.fn(() => ({
  api: {
    getEffects: vi.fn(() => []),
    getFilters: vi.fn(() => []),
    getTransitions: vi.fn(() => []),
    getResources: vi.fn(() => []),
    getResourceById: vi.fn(() => null),
    searchResources: vi.fn(() => []),
    getResourcesByCategory: vi.fn(() => []),
    getResourcesByTags: vi.fn(() => []),
    getResourcesByComplexity: vi.fn(() => []),
    loadSource: vi.fn(() => Promise.resolve({ success: true, data: [], source: "built-in", timestamp: Date.now() })),
    isSourceLoaded: vi.fn(() => true),
    refreshSource: vi.fn(() => Promise.resolve({ success: true, data: [], source: "built-in", timestamp: Date.now() })),
    preloadCategory: vi.fn(() =>
      Promise.resolve({ success: true, data: [], source: "built-in", timestamp: Date.now() }),
    ),
    getSourceConfig: vi.fn(() => null),
    updateSourceConfig: vi.fn(),
    getLoadingState: vi.fn(() => ({
      isLoading: false,
      loadedSources: new Set(["built-in"]),
      loadingQueue: [],
      error: null,
      progress: 100,
    })),
    getStats: vi.fn(() => ({
      total: 0,
      byType: {},
      bySource: {},
      cacheSize: 0,
      memoryUsage: 0,
    })),
    getCacheSize: vi.fn(() => 0),
    clearCache: vi.fn(),
    clearSourceCache: vi.fn(),
    invalidateCache: vi.fn(),
    onLoadingStateChange: vi.fn(() => () => {}),
    onResourcesUpdate: vi.fn(() => () => {}),
    onError: vi.fn(() => () => {}),
  },
  config: {
    initialSources: ["built-in"],
    backgroundLoadDelay: 1000,
    enableCaching: true,
    maxCacheSize: 100,
  },
  isInitialized: true,
}))

vi.mock("@/features/browser/providers/browser-resources-provider", () => ({
  BrowserResourcesProvider: ({ children }: any) => children,
  EffectsProvider: ({ children }: any) => children,
  useBrowserResourcesProvider: mockBrowserResourcesProvider,
  useEffectsProvider: mockBrowserResourcesProvider,
}))

// Мокаем i18n
vi.mock("@/i18n", () => ({
  default: {
    t: vi.fn((key) => key),
    on: vi.fn(),
    off: vi.fn(),
    changeLanguage: vi.fn(() => Promise.resolve()),
  },
}))

// Экспортируем функцию для настройки специфичных моков
export function setupAdapterMocks() {
  // Здесь можно добавить дополнительную настройку моков если нужно
}

// Экспортируем функцию для очистки моков
export function clearAdapterMocks() {
  vi.clearAllMocks()
}

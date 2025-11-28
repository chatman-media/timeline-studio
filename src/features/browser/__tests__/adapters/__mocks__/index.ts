import { vi } from "vitest"

/**
 * Общие моки для тестирования адаптеров
 */

// Мок для i18n
export const mockI18n = {
  default: {
    t: vi.fn((key: string) => key),
    language: "ru",
  },
}

// Мок для project-management hooks
export const mockProjectManagementHooks = {
  useAppSettings: vi.fn(() => ({
    isLoading: false,
    getError: vi.fn(() => null),
    state: {
      context: {
        mediaFiles: { allFiles: [] },
        musicFiles: { allFiles: [] },
      },
    },
  })),
  useFavorites: vi.fn(() => ({
    isItemFavorite: vi.fn(() => false),
  })),
  useMusicFiles: vi.fn(() => ({
    musicFiles: [],
    updateMusicFiles: vi.fn(),
  })),
  useCurrentProject: vi.fn(() => ({
    currentProject: null,
    openProject: vi.fn(),
    saveProject: vi.fn(),
    createNewProject: vi.fn(),
  })),
}

// Мок для project-management providers
export const mockProjectManagementProviders = {
  AppProvider: ({ children }: { children: any }) => children,
}

// Мок для timeline
export const mockTimeline = {
  useTimelineActions: vi.fn(() => ({
    isMusicAdded: vi.fn(() => false),
  })),
  TimelineProvider: ({ children }: { children: any }) => children,
}

// Мок для media
export const mockMedia = {
  getFileType: vi.fn((file: any) => {
    if (file.extension === ".mp4") return "video"
    if (file.extension === ".jpg" || file.extension === ".png") return "image"
    return "unknown"
  }),
}

// Мок для effects
export const mockEffects = {
  useEffects: vi.fn(() => ({
    isLoading: false,
    error: null,
    effects: [],
  })),
}

// Мок для filters
export const mockFilters = {
  useFilters: vi.fn(() => ({
    isLoading: false,
    error: null,
    filters: [],
  })),
}

// Мок для transitions
export const mockTransitions = {
  useTransitions: vi.fn(() => ({
    isLoading: false,
    error: null,
    transitions: [],
  })),
}

// Мок для subtitles
export const mockSubtitles = {
  useSubtitleStyles: vi.fn(() => ({
    isLoading: false,
    error: null,
    subtitleStyles: [],
  })),
}

// Мок для templates
export const mockTemplates = {
  useTemplates: vi.fn(() => ({
    isLoading: false,
    error: null,
    templates: [],
  })),
}

// Мок для style-templates
export const mockStyleTemplates = {
  useStyleTemplates: vi.fn(() => ({
    isLoading: false,
    error: null,
    styleTemplates: [],
  })),
}

// HTML Audio Element mock
export const mockAudio = {
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  onended: null as (() => void) | null,
}

// Экспорт всех моков
export const allMocks = {
  "@/i18n": mockI18n,
  "@/domains/project-management/hooks": mockProjectManagementHooks,
  "@/domains/project-management/providers/app-provider": mockProjectManagementProviders,
  "@/features/timeline": mockTimeline,
  "@/features/media": mockMedia,
  "@/features/effects": mockEffects,
  "@/features/filters": mockFilters,
  "@/features/transitions": mockTransitions,
  "@/features/subtitles": mockSubtitles,
  "@/features/templates": mockTemplates,
  "@/features/style-templates": mockStyleTemplates,
}

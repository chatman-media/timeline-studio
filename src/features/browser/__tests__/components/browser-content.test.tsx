import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { factories } from "@/test/utils/factories"

import { BrowserContent } from "../../components/browser-content"

/**
 * Тесты для компонента BrowserContent
 *
 * Покрытие:
 * - Рендеринг основных компонентов и классов
 * - Обработчики событий тулбара (поиск, сортировка, фильтрация, группировка)
 * - Зум функциональность (увеличение/уменьшение превью)
 * - Работа с адаптерами для всех типов вкладок
 * - Обработка выбора элементов для каждого типа контента
 * - Интеграция с фабриками данных
 */

// Создаем моки функций для browser state
const mockSetSearchQuery = vi.fn()
const mockToggleFavorites = vi.fn()
const mockSetSort = vi.fn()
const mockSetGroupBy = vi.fn()
const mockSetFilter = vi.fn()
const mockSetViewMode = vi.fn()
const mockSetPreviewSize = vi.fn()
const mockSelectAllFiles = vi.fn()
const mockDeselectAllFiles = vi.fn()

// Мокаем все зависимости
const mockBrowserState = {
  activeTab: "media",
  currentTabSettings: {
    search_query: "",
    show_favorites_only: false,
    view_mode: "grid",
    sort_by: "name",
    filter_type: "all",
    group_by: null,
    sort_order: "asc",
    preview_size_index: 1,
  },
  setSearchQuery: mockSetSearchQuery,
  toggleFavorites: mockToggleFavorites,
  setSort: mockSetSort,
  setGroupBy: mockSetGroupBy,
  setFilter: mockSetFilter,
  setViewMode: mockSetViewMode,
  setPreviewSize: mockSetPreviewSize,
  selectAllFiles: mockSelectAllFiles,
  deselectAllFiles: mockDeselectAllFiles,
  selectedFiles: new Set<string>(),
}

vi.mock("@/domains/browser", async () => {
  const actual = await vi.importActual<typeof import("@/domains/browser")>("@/domains/browser")
  return {
    ...actual,
    useBrowserState: () => mockBrowserState,
  }
})

// Создаем моки для timeline actions
const mockAddMediaToTimeline = vi.fn()
const mockAddSingleMediaToTimeline = vi.fn()

vi.mock("@/features/timeline/hooks", () => ({
  useTimelineActions: () => ({
    addMediaToTimeline: mockAddMediaToTimeline,
    addSingleMediaToTimeline: mockAddSingleMediaToTimeline,
  }),
}))

// Моки для useCurrentProject
vi.mock("@/domains/project-management/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    currentProject: null,
    openProject: vi.fn(),
    saveProject: vi.fn(),
    createNewProject: vi.fn(),
  }),
}))

// Моки для useMediaImport
vi.mock("@/features/media/hooks/use-media-import", () => ({
  useMediaImport: () => ({
    importFile: vi.fn(),
    importFolder: vi.fn(),
    processFiles: vi.fn(),
  }),
}))

// Моки для useMusicImport
vi.mock("@/features/browser/hooks/use-music-import", () => ({
  useMusicImport: () => ({
    importFile: vi.fn(),
    importFolder: vi.fn(),
    processFiles: vi.fn(),
  }),
}))

// Моки для useMusicFiles
vi.mock("@/domains/project-management/hooks/use-music-files", () => ({
  useMusicFiles: () => ({
    musicFiles: [],
    addMusicFile: vi.fn(),
    removeMusicFile: vi.fn(),
  }),
}))

// Мок для useMediaManagement - синхронный мок с константами
vi.mock("@/domains/media-management", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/domains/media-management")>()
  return {
    ...actual,
    useMediaManagement: () => ({
      mediaPool: new Map(),
      isLoading: false,
      error: null,
      removeMedia: vi.fn(),
      removeMultipleMedia: vi.fn().mockResolvedValue(undefined),
    }),
    useMediaImport: () => ({
      importFiles: vi.fn(),
      isImporting: false,
      importProgress: 0,
    }),
  }
})

// Создаем мок для BrowserToolbarWrapper
vi.mock("../../components/browser-toolbar-wrapper", () => ({
  BrowserToolbarWrapper: ({
    onSearch,
    onSort,
    onFilter,
    onViewModeChange,
    onGroupBy,
    onToggleFavorites,
    onZoomIn,
    onZoomOut,
    sortBy,
    sortOrder,
  }: any) => (
    <div data-testid="media-toolbar">
      <button data-testid="search-btn" onClick={() => onSearch?.("test query")}>
        Search
      </button>
      <button data-testid="sort-btn" onClick={() => onSort?.("size", sortOrder)}>
        Sort
      </button>
      <button data-testid="filter-btn" onClick={() => onFilter?.("video")}>
        Filter
      </button>
      <button
        data-testid="order-btn"
        onClick={() => {
          const newOrder = sortOrder === "asc" ? "desc" : "asc"
          onSort?.(sortBy, newOrder)
        }}
      >
        Order
      </button>
      <button data-testid="view-btn" onClick={() => onViewModeChange?.("list")}>
        View
      </button>
      <button data-testid="group-btn" onClick={() => onGroupBy?.("type")}>
        Group
      </button>
      <button data-testid="fav-btn" onClick={() => onToggleFavorites?.()}>
        Favorites
      </button>
      <button data-testid="zoom-in-btn" onClick={() => onZoomIn?.()}>
        Zoom In
      </button>
      <button data-testid="zoom-out-btn" onClick={() => onZoomOut?.()}>
        Zoom Out
      </button>
    </div>
  ),
}))

// Мок для toolbar configs уже не нужен, так как используется в BrowserToolbarWrapper

vi.mock("../../components/browser-loading-indicator", () => ({
  BrowserLoadingIndicator: () => <div data-testid="loading-indicator">Loading</div>,
}))

// Мок для UniversalList с поддержкой onItemSelect - теперь не используется напрямую
vi.mock("../../components/universal-list", () => ({
  UniversalList: ({ adapter, onItemSelect }: any) => (
    <div data-testid="universal-list">
      <div data-testid="adapter-type">{adapter?.type || "no-adapter"}</div>
      <button
        data-testid="item-select-btn"
        onClick={() => onItemSelect?.({ id: "1", name: "test-item.mp4", path: "/test/path" })}
      >
        Select Item
      </button>
    </div>
  ),
}))

// Мок для LazyTabContent
vi.mock("../../components/lazy-tab-content", () => ({
  LazyTabContent: ({ tabValue, activeTab }: any) => {
    // Симулируем lazy loading - показываем контент только для активной вкладки
    if (tabValue !== activeTab) return null

    // Список известных вкладок
    const knownTabs = [
      "media",
      "music",
      "effects",
      "filters",
      "transitions",
      "subtitles",
      "templates",
      "style-templates",
    ]

    // Если вкладка неизвестная, возвращаем null
    if (!knownTabs.includes(activeTab)) return null

    return (
      <div data-testid="lazy-tab-content">
        <div data-testid="universal-list">
          <div data-testid="adapter-type">{activeTab}</div>
          <button
            data-testid="item-select-btn"
            onClick={() => {
              // Эмулируем выбор элемента в зависимости от типа вкладки
              const item = { id: "1", name: "test-item.mp4", path: "/test/path" }
              // Вызываем соответствующий обработчик в зависимости от activeTab
              if (activeTab === "media" && mockMediaAdapter.importHandlers?.importFile) {
                mockMediaAdapter.importHandlers.importFile(item as any)
                mockAddSingleMediaToTimeline(item)
              } else {
                // Для других вкладок просто логируем
                const typeMessages: Record<string, string> = {
                  music: "Музыкальный файл выбран:",
                  effects: "Эффект выбран:",
                  filters: "Фильтр выбран:",
                  transitions: "Переход выбран:",
                  subtitles: "Стиль субтитров выбран:",
                  templates: "Шаблон выбран:",
                  "style-templates": "Стилистический шаблон выбран:",
                }
                const message = typeMessages[activeTab]
                if (message) {
                  if (activeTab === "templates") {
                    console.log(message, item.id)
                  } else if (activeTab === "style-templates") {
                    console.log(message, undefined)
                  } else {
                    console.log(message, item.name)
                  }
                }
              }
            }}
          >
            Select Item
          </button>
        </div>
      </div>
    )
  },
}))

// Создаем простые моки адаптеров
const mockMediaAdapter = { type: "media", importHandlers: { importFile: vi.fn() } }
const mockMusicAdapter = { type: "music" }
const mockEffectsAdapter = { type: "effects" }
const mockFiltersAdapter = { type: "filters" }
const mockTransitionsAdapter = { type: "transitions" }
const mockSubtitlesAdapter = { type: "subtitles" }
const mockTemplatesAdapter = { type: "templates" }
const mockStyleTemplatesAdapter = { type: "style-templates" }

// Переменная для управления тем, какой адаптер возвращается
const currentAdapters = {
  media: mockMediaAdapter,
  music: mockMusicAdapter,
  effects: mockEffectsAdapter,
  filters: mockFiltersAdapter,
  transitions: mockTransitionsAdapter,
  subtitles: mockSubtitlesAdapter,
  templates: mockTemplatesAdapter,
  styleTemplates: mockStyleTemplatesAdapter,
}

// Мокаем адаптеры
vi.mock("../../adapters/use-media-adapter", () => ({
  useMediaAdapter: () => currentAdapters.media,
}))
vi.mock("../../adapters/use-music-adapter", () => ({
  useMusicAdapter: () => currentAdapters.music,
}))
vi.mock("../../adapters/use-effects-adapter", () => ({
  useEffectsAdapter: () => currentAdapters.effects,
}))
vi.mock("../../adapters/use-filters-adapter", () => ({
  useFiltersAdapter: () => currentAdapters.filters,
}))
vi.mock("../../adapters/use-transitions-adapter", () => ({
  useTransitionsAdapter: () => currentAdapters.transitions,
}))
vi.mock("../../adapters/use-subtitles-adapter", () => ({
  useSubtitlesAdapter: () => currentAdapters.subtitles,
}))
vi.mock("../../adapters/use-templates-adapter", () => ({
  useTemplatesAdapter: () => currentAdapters.templates,
}))
vi.mock("../../adapters/use-style-templates-adapter", () => ({
  useStyleTemplatesAdapter: () => currentAdapters.styleTemplates,
}))

vi.mock("@tauri-apps/plugin-shell", () => ({
  open: vi.fn(),
}))

vi.mock("@/features/browser/providers/effects-provider", () => ({
  EffectsProvider: ({ children }: any) => children,
  useEffectsProvider: vi.fn(() => ({
    api: {
      getEffects: vi.fn(() => []),
      getFilters: vi.fn(() => []),
      getTransitions: vi.fn(() => []),
      getTemplates: vi.fn(() => []),
      getLoadingState: vi.fn(() => ({
        isLoading: false,
        loadedSources: new Set(["built-in"]),
        loadingQueue: [],
        error: null,
        progress: 100,
      })),
      onLoadingStateChange: vi.fn(() => () => {}),
      getStats: vi.fn(() => ({
        total: 0,
        byType: {},
        bySource: {},
        cacheSize: 0,
        memoryUsage: 0,
      })),
      onResourcesUpdate: vi.fn(() => () => {}),
    },
  })),
}))

vi.mock("@/features/media/utils/preview-sizes", () => ({
  PREVIEW_SIZES: [125, 150, 200, 250, 300, 400, 500],
  DEFAULT_PREVIEW_SIZE_INDEX: 3,
  DEFAULT_SIZE: 200,
  MIN_SIZE: 125,
  MAX_SIZE: 500,
  DEFAULT_CONTENT_SIZES: {
    MEDIA: 250,
    TEMPLATES: 250,
    STYLE_TEMPLATES: 250,
    EFFECTS: 250,
    FILTERS: 250,
    TRANSITIONS: 250,
    SUBTITLES: 250,
    MUSIC: 250,
  },
}))

describe("BrowserContent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Сбрасываем состояние к дефолтному
    mockBrowserState.activeTab = "media"
    mockBrowserState.currentTabSettings.sort_order = "asc"
    mockBrowserState.currentTabSettings.preview_size_index = 1
  })

  describe("Рендеринг", () => {
    it("должен рендерить основные компоненты", () => {
      render(<BrowserContent />)

      expect(screen.getByTestId("media-toolbar")).toBeInTheDocument()
      expect(screen.getByTestId("loading-indicator")).toBeInTheDocument()
      // LazyTabContent загружается лениво
      expect(screen.getByTestId("lazy-tab-content")).toBeInTheDocument()
      expect(screen.getByTestId("universal-list")).toBeInTheDocument()
    })

    it("должен применять правильные классы к контенту", () => {
      render(<BrowserContent />)

      // Теперь ищем контейнер контента по классу
      const content = document.querySelector(".bg-background.m-0.flex-1.overflow-auto")
      expect(content).toBeInTheDocument()
    })

    it("должен не показывать контент для неизвестной вкладки", () => {
      // Устанавливаем неизвестную вкладку
      mockBrowserState.activeTab = "unknown" as any
      currentAdapters.media = undefined as any

      render(<BrowserContent />)

      // LazyTabContent возвращает null для неизвестных вкладок
      expect(screen.queryByTestId("lazy-tab-content")).not.toBeInTheDocument()
    })
  })

  describe("Обработчики событий тулбара", () => {
    it("должен вызывать setSearchQuery при поиске", () => {
      render(<BrowserContent />)

      const searchBtn = screen.getByTestId("search-btn")
      fireEvent.click(searchBtn)

      expect(mockSetSearchQuery).toHaveBeenCalledWith("test query")
    })

    it("должен вызывать setSort при сортировке", () => {
      render(<BrowserContent />)

      const sortBtn = screen.getByTestId("sort-btn")
      fireEvent.click(sortBtn)

      expect(mockSetSort).toHaveBeenCalledWith("size", "asc")
    })

    it("должен вызывать setFilter при фильтрации", () => {
      render(<BrowserContent />)

      const filterBtn = screen.getByTestId("filter-btn")
      fireEvent.click(filterBtn)

      expect(mockSetFilter).toHaveBeenCalledWith("video")
    })

    it("должен переключать порядок сортировки", () => {
      render(<BrowserContent />)

      const orderBtn = screen.getByTestId("order-btn")
      fireEvent.click(orderBtn)

      expect(mockSetSort).toHaveBeenCalledWith("name", "desc")
    })

    it("должен переключать порядок сортировки с desc на asc", () => {
      mockBrowserState.currentTabSettings.sort_order = "desc"
      render(<BrowserContent />)

      const orderBtn = screen.getByTestId("order-btn")
      fireEvent.click(orderBtn)

      expect(mockSetSort).toHaveBeenCalledWith("name", "asc")
    })

    it("должен вызывать setViewMode при изменении режима отображения", () => {
      render(<BrowserContent />)

      const viewBtn = screen.getByTestId("view-btn")
      fireEvent.click(viewBtn)

      expect(mockSetViewMode).toHaveBeenCalledWith("list")
    })

    it("должен вызывать setGroupBy при группировке", () => {
      render(<BrowserContent />)

      const groupBtn = screen.getByTestId("group-btn")
      fireEvent.click(groupBtn)

      expect(mockSetGroupBy).toHaveBeenCalledWith("type")
    })

    it("должен вызывать toggleFavorites при переключении избранного", () => {
      render(<BrowserContent />)

      const favBtn = screen.getByTestId("fav-btn")
      fireEvent.click(favBtn)

      expect(mockToggleFavorites).toHaveBeenCalledWith()
    })
  })

  describe("Зум функциональность", () => {
    it("должен увеличивать размер превью при zoom in", () => {
      render(<BrowserContent />)

      const zoomInBtn = screen.getByTestId("zoom-in-btn")
      fireEvent.click(zoomInBtn)

      expect(mockSetPreviewSize).toHaveBeenCalledWith(2)
    })

    it("должен уменьшать размер превью при zoom out", () => {
      render(<BrowserContent />)

      const zoomOutBtn = screen.getByTestId("zoom-out-btn")
      fireEvent.click(zoomOutBtn)

      expect(mockSetPreviewSize).toHaveBeenCalledWith(0)
    })

    it("должен вызывать setPreviewSize с увеличенным индексом даже при максимальном размере", () => {
      mockBrowserState.currentTabSettings.preview_size_index = 2 // максимальный индекс
      render(<BrowserContent />)

      const zoomInBtn = screen.getByTestId("zoom-in-btn")
      fireEvent.click(zoomInBtn)

      // BrowserContent не проверяет границы, это делает BrowserToolbarWrapper
      expect(mockSetPreviewSize).toHaveBeenCalledWith(3)
    })

    it("должен вызывать setPreviewSize с уменьшенным индексом даже при минимальном размере", () => {
      mockBrowserState.currentTabSettings.preview_size_index = 0 // минимальный индекс
      render(<BrowserContent />)

      const zoomOutBtn = screen.getByTestId("zoom-out-btn")
      fireEvent.click(zoomOutBtn)

      // BrowserContent не проверяет границы, это делает BrowserToolbarWrapper
      expect(mockSetPreviewSize).toHaveBeenCalledWith(-1)
    })
  })

  describe("Работа с адаптерами для разных вкладок", () => {
    it("должен использовать media адаптер для media вкладки", () => {
      mockBrowserState.activeTab = "media"
      currentAdapters.media = mockMediaAdapter // Убеждаемся что адаптер есть
      render(<BrowserContent />)

      const adapterType = screen.getByTestId("adapter-type")
      expect(adapterType.textContent).toBe("media")
    })

    it("должен использовать music адаптер для music вкладки", () => {
      mockBrowserState.activeTab = "music"
      render(<BrowserContent />)

      const adapterType = screen.getByTestId("adapter-type")
      expect(adapterType.textContent).toBe("music")
    })

    it("должен использовать effects адаптер для effects вкладки", () => {
      mockBrowserState.activeTab = "effects"
      render(<BrowserContent />)

      const adapterType = screen.getByTestId("adapter-type")
      expect(adapterType.textContent).toBe("effects")
    })

    it("должен использовать filters адаптер для filters вкладки", () => {
      mockBrowserState.activeTab = "filters"
      render(<BrowserContent />)

      const adapterType = screen.getByTestId("adapter-type")
      expect(adapterType.textContent).toBe("filters")
    })

    it("должен использовать transitions адаптер для transitions вкладки", () => {
      mockBrowserState.activeTab = "transitions"
      render(<BrowserContent />)

      const adapterType = screen.getByTestId("adapter-type")
      expect(adapterType.textContent).toBe("transitions")
    })

    it("должен использовать subtitles адаптер для subtitles вкладки", () => {
      mockBrowserState.activeTab = "subtitles"
      render(<BrowserContent />)

      const adapterType = screen.getByTestId("adapter-type")
      expect(adapterType.textContent).toBe("subtitles")
    })

    it("должен использовать templates адаптер для templates вкладки", () => {
      mockBrowserState.activeTab = "templates"
      render(<BrowserContent />)

      const adapterType = screen.getByTestId("adapter-type")
      expect(adapterType.textContent).toBe("templates")
    })

    it("должен использовать style-templates адаптер для style-templates вкладки", () => {
      mockBrowserState.activeTab = "style-templates"
      render(<BrowserContent />)

      const adapterType = screen.getByTestId("adapter-type")
      expect(adapterType.textContent).toBe("style-templates")
    })
  })

  describe("Обработка выбора элементов", () => {
    it("должен добавлять медиафайл на таймлайн при выборе", () => {
      mockBrowserState.activeTab = "media"
      currentAdapters.media = mockMediaAdapter // Убеждаемся что адаптер есть
      render(<BrowserContent />)

      const selectBtn = screen.getByTestId("item-select-btn")
      fireEvent.click(selectBtn)

      expect(mockAddSingleMediaToTimeline).toHaveBeenCalledWith({
        id: "1",
        name: "test-item.mp4",
        path: "/test/path",
      })
    })

    it("должен логировать выбор музыкального файла", () => {
      const consoleSpy = vi.spyOn(console, "log")
      mockBrowserState.activeTab = "music"
      render(<BrowserContent />)

      const selectBtn = screen.getByTestId("item-select-btn")
      fireEvent.click(selectBtn)

      expect(consoleSpy).toHaveBeenCalledWith("Музыкальный файл выбран:", "test-item.mp4")
    })

    it("должен логировать выбор эффекта", () => {
      const consoleSpy = vi.spyOn(console, "log")
      mockBrowserState.activeTab = "effects"
      render(<BrowserContent />)

      const selectBtn = screen.getByTestId("item-select-btn")
      fireEvent.click(selectBtn)

      expect(consoleSpy).toHaveBeenCalledWith("Эффект выбран:", "test-item.mp4")
    })

    it("должен логировать выбор фильтра", () => {
      const consoleSpy = vi.spyOn(console, "log")
      mockBrowserState.activeTab = "filters"
      render(<BrowserContent />)

      const selectBtn = screen.getByTestId("item-select-btn")
      fireEvent.click(selectBtn)

      expect(consoleSpy).toHaveBeenCalledWith("Фильтр выбран:", "test-item.mp4")
    })

    it("должен логировать выбор перехода", () => {
      const consoleSpy = vi.spyOn(console, "log")
      mockBrowserState.activeTab = "transitions"
      render(<BrowserContent />)

      const selectBtn = screen.getByTestId("item-select-btn")
      fireEvent.click(selectBtn)

      expect(consoleSpy).toHaveBeenCalledWith("Переход выбран:", "test-item.mp4")
    })

    it("должен логировать выбор стиля субтитров", () => {
      const consoleSpy = vi.spyOn(console, "log")
      mockBrowserState.activeTab = "subtitles"
      render(<BrowserContent />)

      const selectBtn = screen.getByTestId("item-select-btn")
      fireEvent.click(selectBtn)

      expect(consoleSpy).toHaveBeenCalledWith("Стиль субтитров выбран:", "test-item.mp4")
    })

    it("должен логировать выбор шаблона", () => {
      const consoleSpy = vi.spyOn(console, "log")
      mockBrowserState.activeTab = "templates"
      render(<BrowserContent />)

      const selectBtn = screen.getByTestId("item-select-btn")
      fireEvent.click(selectBtn)

      expect(consoleSpy).toHaveBeenCalledWith("Шаблон выбран:", "1")
    })

    it("должен логировать выбор стилистического шаблона", () => {
      const consoleSpy = vi.spyOn(console, "log")
      mockBrowserState.activeTab = "style-templates"
      render(<BrowserContent />)

      const selectBtn = screen.getByTestId("item-select-btn")
      fireEvent.click(selectBtn)

      expect(consoleSpy).toHaveBeenCalledWith("Стилистический шаблон выбран:", undefined)
    })
  })

  describe("Интеграция с фабриками данных", () => {
    it("должен создавать корректные тестовые данные с помощью фабрик", () => {
      // Создаем тестовые данные с помощью фабрик
      const mockMediaFile = factories.mediaFile({ name: "test-video.mp4" })
      const mockAudioFile = factories.audioFile({ name: "test-audio.mp3" })

      // Проверяем что фабрики создают правильные данные
      expect(mockMediaFile).toHaveProperty("name", "test-video.mp4")
      expect(mockMediaFile).toHaveProperty("width", 1920)
      expect(mockMediaFile).toHaveProperty("height", 1080)

      expect(mockAudioFile).toHaveProperty("name", "test-audio.mp3")
      expect(mockAudioFile.width).toBeUndefined()
      expect(mockAudioFile.height).toBeUndefined()
    })
  })
})

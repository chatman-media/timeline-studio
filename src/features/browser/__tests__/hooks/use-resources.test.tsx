import { render, screen, waitFor } from "@testing-library/react"
import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { resetTransitionsState } from "@/features/transitions/hooks/use-transitions"

import {
  useEffects,
  useEffectsSearch,
  useFilters,
  useFiltersSearch,
  useLoadingState,
  useResourceById,
  useResourceSources,
  useResources,
  useResourcesAdapter,
  useResourcesByCategory,
  useResourcesByComplexity,
  useResourcesByTags,
  useResourcesCache,
  useResourcesSearch,
  useResourcesStats,
  useTransitions,
  useTransitionsSearch,
} from "../../hooks/use-resources"
import { EffectsProvider, resetEffectsProviderState } from "../../providers/browser-resources-provider"

// Мокаем JSON файл с переходами
vi.mock("@/features/transitions/data/transitions.json", () => ({
  default: {
    transitions: [
      {
        id: "test-transition-1",
        type: "fade",
        labels: { ru: "Исчезновение", en: "Fade" },
        description: { ru: "Плавное исчезновение", en: "Smooth fade" },
        category: "basic",
        complexity: "basic",
        tags: ["smooth", "classic"],
        duration: { min: 0.1, max: 5, default: 1 },
      },
    ],
  },
}))

// Мокаем ленивые загрузчики ресурсов
vi.mock("../../services/resource-loaders", () => ({
  loadAllResourcesLazy: vi.fn().mockResolvedValue({
    effects: {
      success: true,
      data: [
        {
          id: "test-effect-1",
          name: "Test Effect 1",
          type: "blur",
          category: "artistic",
          complexity: "basic",
          tags: ["test", "popular"],
          description: { ru: "Тестовый эффект 1", en: "Test Effect 1" },
          ffmpegCommand: () => "blur=5",
          params: { intensity: 50 },
          previewPath: "/test1.mp4",
          labels: { en: "Test Effect 1", ru: "Тестовый эффект 1" },
        },
        {
          id: "test-effect-2",
          name: "Test Effect 2",
          type: "brightness",
          category: "color-correction",
          complexity: "intermediate",
          tags: ["test", "color"],
          description: { ru: "Тестовый эффект 2", en: "Test Effect 2" },
          ffmpegCommand: () => "brightness=0.1",
          params: { intensity: 75 },
          previewPath: "/test2.mp4",
          labels: { en: "Test Effect 2", ru: "Тестовый эффект 2" },
        },
      ],
      source: "built-in",
      timestamp: Date.now(),
    },
    filters: {
      success: true,
      data: [
        {
          id: "test-filter-1",
          name: "Test Filter 1",
          category: "technical",
          complexity: "advanced",
          tags: ["log", "professional"],
          description: { ru: "Тестовый фильтр", en: "Test Filter" },
          labels: { en: "Test Filter", ru: "Тестовый фильтр" },
        },
      ],
      source: "built-in",
      timestamp: Date.now(),
    },
    transitions: {
      success: true,
      data: [
        {
          id: "test-transition-1",
          type: "fade",
          labels: { ru: "Исчезновение", en: "Fade" },
          description: { ru: "Плавное исчезновение", en: "Smooth fade" },
          category: "basic",
          complexity: "basic",
          tags: ["smooth", "classic"],
          duration: { min: 0.1, max: 5, default: 1 },
        },
      ],
      source: "built-in",
      timestamp: Date.now(),
    },
  }),
}))

// Общая очистка состояния перед каждым тестом
beforeEach(async () => {
  vi.clearAllMocks()
  resetEffectsProviderState()
  resetTransitionsState()
  // Небольшая задержка для гарантии очистки состояния
  await new Promise((resolve) => setTimeout(resolve, 10))
})

// Вспомогательная функция для ожидания загрузки провайдера
const waitForProviderReady = async () => {
  await waitFor(
    () => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    },
    { timeout: 5000 },
  )
  // Дополнительная задержка для стабильности
  await new Promise((resolve) => setTimeout(resolve, 50))
}

describe("useEffects", () => {
  function TestComponent() {
    const { effects, loading } = useEffects()
    return (
      <div>
        <div data-testid="loading">{String(loading)}</div>
        <div data-testid="effects-count">{effects.length}</div>
        {effects.map((effect) => (
          <div key={effect.id} data-testid="effect-item">
            {typeof effect.name === "string" ? effect.name : effect.name.en || ""}
          </div>
        ))}
      </div>
    )
  }

  it("должен загружать и возвращать эффекты", async () => {
    render(
      <EffectsProvider key="useEffects-test">
        <TestComponent />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("effects-count")).toHaveTextContent("2")
    expect(screen.getByText("Test Effect 1")).toBeInTheDocument()
    expect(screen.getByText("Test Effect 2")).toBeInTheDocument()
  })
})

describe("useFilters", () => {
  function TestComponent() {
    const { filters, loading } = useFilters()
    return (
      <div>
        <div data-testid="loading">{String(loading)}</div>
        <div data-testid="filters-count">{filters.length}</div>
        {filters.map((filter) => (
          <div key={filter.id} data-testid="filter-item">
            {filter.name}
          </div>
        ))}
      </div>
    )
  }

  it("должен загружать и возвращать фильтры", async () => {
    render(
      <EffectsProvider key="useFilters-test">
        <TestComponent />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("filters-count")).toHaveTextContent("1")
    expect(screen.getByText("Test Filter 1")).toBeInTheDocument()
  })
})

describe("useTransitions", () => {
  function TestComponent() {
    const { transitions, loading } = useTransitions()
    return (
      <div>
        <div data-testid="loading">{String(loading)}</div>
        <div data-testid="transitions-count">{transitions.length}</div>
        {transitions.map((transition) => (
          <div key={transition.id} data-testid="transition-item">
            {transition.labels?.en}
          </div>
        ))}
      </div>
    )
  }

  it("должен загружать и возвращать переходы", async () => {
    render(
      <EffectsProvider key="useTransitions-test">
        <TestComponent />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("transitions-count")).toHaveTextContent("1")
    expect(screen.getByText("Fade")).toBeInTheDocument()
  })
})

describe("useResourceById", () => {
  function TestComponent({ id }: { id: string }) {
    const { resource, loading } = useResourceById("effect", id)
    const resourceName = resource?.name
    const displayName =
      typeof resourceName === "string" ? resourceName : resourceName?.en || "Not found"
    return (
      <div>
        <div data-testid="loading">{String(loading)}</div>
        <div data-testid="resource-name">{displayName}</div>
      </div>
    )
  }

  it("должен находить ресурс по ID", async () => {
    render(
      <EffectsProvider key="useResourceById-found-test">
        <TestComponent id="test-effect-1" />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("resource-name")).toHaveTextContent("Test Effect 1")
  })

  it("должен возвращать null для несуществующего ID", async () => {
    render(
      <EffectsProvider key="useResourceById-notfound-test">
        <TestComponent id="non-existent" />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("resource-name")).toHaveTextContent("Not found")
  })
})

describe("useResourcesSearch", () => {
  function TestComponent({ options }: { options: any }) {
    const { results, loading } = useResourcesSearch("effect", options)
    return (
      <div>
        <div data-testid="loading">{String(loading)}</div>
        <div data-testid="results-count">{results.length}</div>
        {results.map((item) => (
          <div key={item.id} data-testid="search-result">
            {typeof item.name === "string" ? item.name : item.name?.en || ""}
          </div>
        ))}
      </div>
    )
  }

  it("должен выполнять поиск по запросу", async () => {
    render(
      <EffectsProvider key="search-query-test">
        <TestComponent options={{ query: "Effect 1" }} />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("results-count")).toHaveTextContent("1")
    expect(screen.getByText("Test Effect 1")).toBeInTheDocument()
  })

  it("должен фильтровать по категории", async () => {
    render(
      <EffectsProvider key="search-category-test">
        <TestComponent options={{ category: "artistic" }} />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("results-count")).toHaveTextContent("1")
    expect(screen.getByText("Test Effect 1")).toBeInTheDocument()
  })

  it("должен фильтровать по тегам", async () => {
    render(
      <EffectsProvider key="search-tags-test">
        <TestComponent options={{ tags: ["popular"] }} />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("results-count")).toHaveTextContent("1")
    expect(screen.getByText("Test Effect 1")).toBeInTheDocument()
  })

  it("должен фильтровать по сложности", async () => {
    render(
      <EffectsProvider key="search-complexity-test">
        <TestComponent options={{ complexity: "intermediate" }} />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("results-count")).toHaveTextContent("1")
    expect(screen.getByText("Test Effect 2")).toBeInTheDocument()
  })
})

describe("useResourcesByCategory", () => {
  function TestComponent({ category }: { category: string }) {
    const { results } = useResourcesByCategory("effect", category)
    return (
      <div>
        <div data-testid="results-count">{results.length}</div>
      </div>
    )
  }

  it("должен возвращать ресурсы по категории", async () => {
    render(
      <EffectsProvider key="category-test">
        <TestComponent category="artistic" />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("results-count")).toHaveTextContent("1")
    })
  })
})

describe("useResourcesByTags", () => {
  function TestComponent({ tags }: { tags: string[] }) {
    const { results } = useResourcesByTags("effect", tags)
    return (
      <div>
        <div data-testid="results-count">{results.length}</div>
      </div>
    )
  }

  it("должен возвращать ресурсы по тегам", async () => {
    render(
      <EffectsProvider key="tags-test">
        <TestComponent tags={["popular"]} />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("results-count")).toHaveTextContent("1")
    })
  })
})

describe("useResourcesByComplexity", () => {
  function TestComponent({ complexity }: { complexity: string }) {
    const { results } = useResourcesByComplexity("effect", complexity)
    return (
      <div>
        <div data-testid="results-count">{results.length}</div>
      </div>
    )
  }

  it("должен возвращать ресурсы по сложности", async () => {
    render(
      <EffectsProvider key="complexity-test">
        <TestComponent complexity="basic" />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("results-count")).toHaveTextContent("1")
    })
  })
})

describe("useLoadingState", () => {
  function TestComponent() {
    const loadingState = useLoadingState()
    return (
      <div>
        <div data-testid="is-loading">{String(loadingState.isLoading)}</div>
        <div data-testid="progress">{loadingState.progress}</div>
        <div data-testid="loaded-sources">{loadingState.loadedSources.size}</div>
      </div>
    )
  }

  it("должен возвращать состояние загрузки", async () => {
    render(
      <EffectsProvider key="loading-state-test">
        <TestComponent />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("is-loading")).toHaveTextContent("false")
    })

    expect(screen.getByTestId("loaded-sources")).toHaveTextContent("1")
  })
})

describe("useResourcesStats", () => {
  function TestComponent() {
    const stats = useResourcesStats()
    return (
      <div>
        <div data-testid="total">{stats.total}</div>
        <div data-testid="effects">{stats.byType.effect}</div>
        <div data-testid="filters">{stats.byType.filter}</div>
        <div data-testid="transitions">{stats.byType.transition}</div>
      </div>
    )
  }

  it("должен возвращать статистику ресурсов", async () => {
    render(
      <EffectsProvider key="stats-test">
        <TestComponent />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("total")).toHaveTextContent("4")
    })

    expect(screen.getByTestId("effects")).toHaveTextContent("2")
    expect(screen.getByTestId("filters")).toHaveTextContent("1")
    expect(screen.getByTestId("transitions")).toHaveTextContent("1")
  })
})

describe("useResources", () => {
  function TestComponent({ type }: { type: any }) {
    const { resources, loading } = useResources(type)
    return (
      <div>
        <div data-testid="loading">{String(loading)}</div>
        <div data-testid="resources-count">{resources.length}</div>
        {resources.map((resource) => (
          <div key={resource.id} data-testid="resource-item">
            {typeof resource.name === "string" ? resource.name : resource.name?.en || ""}
          </div>
        ))}
      </div>
    )
  }

  it("должен загружать ресурсы по типу", async () => {
    render(
      <EffectsProvider key="useResources-test">
        <TestComponent type="effect" />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("resources-count")).toHaveTextContent("2")
    expect(screen.getByText("Test Effect 1")).toBeInTheDocument()
    expect(screen.getByText("Test Effect 2")).toBeInTheDocument()
  })
})

describe("useResourceSources", () => {
  function TestComponent() {
    const { loadSource, refreshSource, isSourceLoaded, getSourceConfig, updateSourceConfig, loadingState } =
      useResourceSources()
    const [loaded, setLoaded] = useState(false)
    const [config, setConfig] = useState<any>(null)
    const [refreshed, setRefreshed] = useState(false)

    useEffect(() => {
      setLoaded(isSourceLoaded("built-in"))
      setConfig(getSourceConfig("built-in"))
    }, [isSourceLoaded, getSourceConfig])

    const handleLoad = async () => {
      // Загружаем встроенный источник заново для теста
      await loadSource("built-in")
    }

    const handleRefresh = async () => {
      await refreshSource("built-in")
      setRefreshed(true)
    }

    const handleUpdateConfig = () => {
      updateSourceConfig("built-in", { test: true })
    }

    return (
      <div>
        <div data-testid="is-loaded">{String(loaded)}</div>
        <div data-testid="config">{JSON.stringify(config)}</div>
        <div data-testid="loading-state">{String(loadingState.isLoading)}</div>
        <div data-testid="refreshed">{String(refreshed)}</div>
        <button onClick={handleLoad}>Load Built-in</button>
        <button onClick={handleRefresh}>Refresh</button>
        <button onClick={handleUpdateConfig}>Update Config</button>
      </div>
    )
  }

  it("должен управлять источниками данных", async () => {
    render(
      <EffectsProvider key="sources-test">
        <TestComponent />
      </EffectsProvider>,
    )

    // Ждем пока loading state станет false
    await waitFor(
      () => {
        expect(screen.getByTestId("loading-state")).toHaveTextContent("false")
      },
      { timeout: 5000 },
    )

    // Проверяем что config доступен
    expect(screen.getByTestId("config")).toHaveTextContent("built-in")

    // Проверяем что кнопки управления источниками доступны
    expect(screen.getByText("Load Built-in")).toBeInTheDocument()
    expect(screen.getByText("Refresh")).toBeInTheDocument()
    expect(screen.getByText("Update Config")).toBeInTheDocument()
  })
})

describe("useResourcesCache", () => {
  function TestComponent() {
    const { clearCache, clearSourceCache, invalidateCache, getCacheSize } = useResourcesCache()
    const [cacheSize, setCacheSize] = useState(0)

    useEffect(() => {
      setCacheSize(getCacheSize())
    }, [getCacheSize])

    const handleClearCache = () => {
      clearCache("effect")
      setCacheSize(getCacheSize())
    }

    const handleClearSourceCache = () => {
      clearSourceCache("built-in")
      setCacheSize(getCacheSize())
    }

    const handleInvalidateCache = () => {
      invalidateCache()
      setCacheSize(getCacheSize())
    }

    return (
      <div>
        <div data-testid="cache-size">{cacheSize}</div>
        <button onClick={handleClearCache}>Clear Effects Cache</button>
        <button onClick={handleClearSourceCache}>Clear Source Cache</button>
        <button onClick={handleInvalidateCache}>Invalidate Cache</button>
      </div>
    )
  }

  it("должен управлять кэшем", async () => {
    render(
      <EffectsProvider key="cache-test">
        <TestComponent />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("cache-size")).toBeInTheDocument()
    })

    // Проверяем, что методы кэша доступны
    const clearButton = screen.getByText("Clear Effects Cache")
    const clearSourceButton = screen.getByText("Clear Source Cache")
    const invalidateButton = screen.getByText("Invalidate Cache")

    expect(clearButton).toBeInTheDocument()
    expect(clearSourceButton).toBeInTheDocument()
    expect(invalidateButton).toBeInTheDocument()
  })
})

describe("useResourcesAdapter", () => {
  function TestComponent({ type, options }: { type: any; options?: any }) {
    const adapter = useResourcesAdapter({ type, searchOptions: options })
    return (
      <div>
        <div data-testid="items-count">{adapter.items.length}</div>
        <div data-testid="loading">{String(adapter.loading)}</div>
        <div data-testid="error">{adapter.error || "none"}</div>
        <div data-testid="total-stats">{adapter.stats.total}</div>
        {adapter.items.map((item) => (
          <div key={item.id} data-testid="adapter-item">
            {typeof item.name === "string" ? item.name : item.name?.en || ""}
          </div>
        ))}
      </div>
    )
  }

  it("должен предоставлять унифицированный интерфейс адаптера", async () => {
    render(
      <EffectsProvider key="adapter-test">
        <TestComponent type="effect" />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("items-count")).toHaveTextContent("2")
    expect(screen.getByTestId("loading")).toHaveTextContent("false")
    expect(screen.getByTestId("error")).toHaveTextContent("none")
    expect(screen.getByTestId("total-stats")).toHaveTextContent("4")
  })

  it("должен фильтровать через адаптер", async () => {
    render(
      <EffectsProvider key="adapter-filter-test">
        <TestComponent type="effect" options={{ category: "artistic" }} />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("items-count")).toHaveTextContent("1")
    expect(screen.getByText("Test Effect 1")).toBeInTheDocument()
  })
})

describe("Typed search hooks", () => {
  function TestEffectsSearch() {
    const { results } = useEffectsSearch({ category: "artistic" })
    return (
      <div>
        <div data-testid="effects-search-count">{results.length}</div>
      </div>
    )
  }

  function TestFiltersSearch() {
    const { results } = useFiltersSearch({ category: "technical" })
    return (
      <div>
        <div data-testid="filters-search-count">{results.length}</div>
      </div>
    )
  }

  function TestTransitionsSearch() {
    const { results } = useTransitionsSearch({ category: "basic" })
    return (
      <div>
        <div data-testid="transitions-search-count">{results.length}</div>
      </div>
    )
  }

  it("должен выполнять типизированный поиск эффектов", async () => {
    render(
      <EffectsProvider key="typed-effects-test">
        <TestEffectsSearch />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("effects-search-count")).toHaveTextContent("1")
    })
  })

  it("должен выполнять типизированный поиск фильтров", async () => {
    render(
      <EffectsProvider key="typed-filters-test">
        <TestFiltersSearch />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("filters-search-count")).toHaveTextContent("1")
    })
  })

  it("должен выполнять типизированный поиск переходов", async () => {
    render(
      <EffectsProvider key="typed-transitions-test">
        <TestTransitionsSearch />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("transitions-search-count")).toHaveTextContent("1")
    })
  })
})

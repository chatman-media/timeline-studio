/**
 * @vitest-environment jsdom
 */
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
      <div data-oid="7y9293.">
        <div data-testid="loading" data-oid=":::bymj">
          {String(loading)}
        </div>
        <div data-testid="effects-count" data-oid="x9lbrt4">
          {effects.length}
        </div>
        {effects.map((effect) => (
          <div key={effect.id} data-testid="effect-item" data-oid="8fxhx5a">
            {typeof effect.name === "string" ? effect.name : effect.name.en || ""}
          </div>
        ))}
      </div>
    )
  }

  it("должен загружать и возвращать эффекты", async () => {
    render(
      <EffectsProvider key="useEffects-test" data-oid="od-rwpl">
        <TestComponent data-oid="2b4l_6t" />
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
      <div data-oid="1kh.n8o">
        <div data-testid="loading" data-oid="vm:w3k_">
          {String(loading)}
        </div>
        <div data-testid="filters-count" data-oid="x1n:d57">
          {filters.length}
        </div>
        {filters.map((filter) => (
          <div key={filter.id} data-testid="filter-item" data-oid="_d0a9y6">
            {filter.name}
          </div>
        ))}
      </div>
    )
  }

  it("должен загружать и возвращать фильтры", async () => {
    render(
      <EffectsProvider key="useFilters-test" data-oid="d5n:_-h">
        <TestComponent data-oid="4c6mv.." />
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
      <div data-oid="gn39p50">
        <div data-testid="loading" data-oid="m58_cw_">
          {String(loading)}
        </div>
        <div data-testid="transitions-count" data-oid="k.0pf3q">
          {transitions.length}
        </div>
        {transitions.map((transition) => (
          <div key={transition.id} data-testid="transition-item" data-oid="w4v9:mt">
            {transition.labels?.en}
          </div>
        ))}
      </div>
    )
  }

  it("должен загружать и возвращать переходы", async () => {
    render(
      <EffectsProvider key="useTransitions-test" data-oid="xzd5ko-">
        <TestComponent data-oid="5m85p1:" />
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
    const displayName = typeof resourceName === "string" ? resourceName : resourceName?.en || "Not found"
    return (
      <div data-oid="mpz3flc">
        <div data-testid="loading" data-oid="4.7:5-x">
          {String(loading)}
        </div>
        <div data-testid="resource-name" data-oid="k.hygh9">
          {displayName}
        </div>
      </div>
    )
  }

  it("должен находить ресурс по ID", async () => {
    render(
      <EffectsProvider key="useResourceById-found-test" data-oid="agzuzkn">
        <TestComponent id="test-effect-1" data-oid="ku-v-xl" />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("resource-name")).toHaveTextContent("Test Effect 1")
  })

  it("должен возвращать null для несуществующего ID", async () => {
    render(
      <EffectsProvider key="useResourceById-notfound-test" data-oid="cvzzbay">
        <TestComponent id="non-existent" data-oid="klf-uy3" />
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
      <div data-oid="q0umgxm">
        <div data-testid="loading" data-oid=":m5c390">
          {String(loading)}
        </div>
        <div data-testid="results-count" data-oid="hsnf3n_">
          {results.length}
        </div>
        {results.map((item) => (
          <div key={item.id} data-testid="search-result" data-oid="p.ej1zz">
            {typeof item.name === "string" ? item.name : item.name?.en || ""}
          </div>
        ))}
      </div>
    )
  }

  it("должен выполнять поиск по запросу", async () => {
    render(
      <EffectsProvider key="search-query-test" data-oid=".8b56fl">
        <TestComponent options={{ query: "Effect 1" }} data-oid="ptc2zx9" />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("results-count")).toHaveTextContent("1")
    expect(screen.getByText("Test Effect 1")).toBeInTheDocument()
  })

  it("должен фильтровать по категории", async () => {
    render(
      <EffectsProvider key="search-category-test" data-oid="agg.un4">
        <TestComponent options={{ category: "artistic" }} data-oid="du3uz9e" />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("results-count")).toHaveTextContent("1")
    expect(screen.getByText("Test Effect 1")).toBeInTheDocument()
  })

  it("должен фильтровать по тегам", async () => {
    render(
      <EffectsProvider key="search-tags-test" data-oid="43y62p6">
        <TestComponent options={{ tags: ["popular"] }} data-oid="7v8o.8_" />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("results-count")).toHaveTextContent("1")
    expect(screen.getByText("Test Effect 1")).toBeInTheDocument()
  })

  it("должен фильтровать по сложности", async () => {
    render(
      <EffectsProvider key="search-complexity-test" data-oid="291eu6w">
        <TestComponent options={{ complexity: "intermediate" }} data-oid=":jz:fep" />
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
      <div data-oid="cp64fd4">
        <div data-testid="results-count" data-oid="6g8v8w.">
          {results.length}
        </div>
      </div>
    )
  }

  it("должен возвращать ресурсы по категории", async () => {
    render(
      <EffectsProvider key="category-test" data-oid="-stwp7i">
        <TestComponent category="artistic" data-oid="21lveuv" />
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
      <div data-oid="u:y7sgs">
        <div data-testid="results-count" data-oid="g7pe1w-">
          {results.length}
        </div>
      </div>
    )
  }

  it("должен возвращать ресурсы по тегам", async () => {
    render(
      <EffectsProvider key="tags-test" data-oid="pzmj4x.">
        <TestComponent tags={["popular"]} data-oid=":5238zp" />
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
      <div data-oid="3cj_1ra">
        <div data-testid="results-count" data-oid="jrjogmr">
          {results.length}
        </div>
      </div>
    )
  }

  it("должен возвращать ресурсы по сложности", async () => {
    render(
      <EffectsProvider key="complexity-test" data-oid="de9tp4l">
        <TestComponent complexity="basic" data-oid="psjv2x7" />
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
      <div data-oid="y8r:bzo">
        <div data-testid="is-loading" data-oid="qbmgjjk">
          {String(loadingState.isLoading)}
        </div>
        <div data-testid="progress" data-oid="xixl:n7">
          {loadingState.progress}
        </div>
        <div data-testid="loaded-sources" data-oid="t2b5tg_">
          {loadingState.loadedSources.size}
        </div>
      </div>
    )
  }

  it("должен возвращать состояние загрузки", async () => {
    render(
      <EffectsProvider key="loading-state-test" data-oid="8g:tqgt">
        <TestComponent data-oid="or3y-md" />
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
      <div data-oid="s4:7gf0">
        <div data-testid="total" data-oid="n.i8r1i">
          {stats.total}
        </div>
        <div data-testid="effects" data-oid="9s1w5hv">
          {stats.byType.effect}
        </div>
        <div data-testid="filters" data-oid="shudegl">
          {stats.byType.filter}
        </div>
        <div data-testid="transitions" data-oid="nruzk7h">
          {stats.byType.transition}
        </div>
      </div>
    )
  }

  it("должен возвращать статистику ресурсов", async () => {
    render(
      <EffectsProvider key="stats-test" data-oid="46t_as:">
        <TestComponent data-oid="_uh85x7" />
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
      <div data-oid="7xo95f3">
        <div data-testid="loading" data-oid="77pqv0a">
          {String(loading)}
        </div>
        <div data-testid="resources-count" data-oid="2rwsni7">
          {resources.length}
        </div>
        {resources.map((resource) => (
          <div key={resource.id} data-testid="resource-item" data-oid="4sbn_1m">
            {typeof resource.name === "string" ? resource.name : resource.name?.en || ""}
          </div>
        ))}
      </div>
    )
  }

  it("должен загружать ресурсы по типу", async () => {
    render(
      <EffectsProvider key="useResources-test" data-oid="3pe2_f.">
        <TestComponent type="effect" data-oid="_wgbcon" />
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
      <div data-oid="djsbs-5">
        <div data-testid="is-loaded" data-oid="anbazrr">
          {String(loaded)}
        </div>
        <div data-testid="config" data-oid="mfa7j42">
          {JSON.stringify(config)}
        </div>
        <div data-testid="loading-state" data-oid="paqmwrd">
          {String(loadingState.isLoading)}
        </div>
        <div data-testid="refreshed" data-oid="bk.i3sy">
          {String(refreshed)}
        </div>
        <button onClick={handleLoad} data-oid="3smpjf3">
          Load Built-in
        </button>
        <button onClick={handleRefresh} data-oid="465fqkn">
          Refresh
        </button>
        <button onClick={handleUpdateConfig} data-oid="ynwadxs">
          Update Config
        </button>
      </div>
    )
  }

  it("должен управлять источниками данных", async () => {
    render(
      <EffectsProvider key="sources-test" data-oid="4afr5x1">
        <TestComponent data-oid="i:titl2" />
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
      <div data-oid="dz137uv">
        <div data-testid="cache-size" data-oid="3ylj7-g">
          {cacheSize}
        </div>
        <button onClick={handleClearCache} data-oid="uz15v4h">
          Clear Effects Cache
        </button>
        <button onClick={handleClearSourceCache} data-oid="azki1gf">
          Clear Source Cache
        </button>
        <button onClick={handleInvalidateCache} data-oid="kki-2ut">
          Invalidate Cache
        </button>
      </div>
    )
  }

  it("должен управлять кэшем", async () => {
    render(
      <EffectsProvider key="cache-test" data-oid=".6:nxza">
        <TestComponent data-oid="m.0cbvv" />
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
      <div data-oid="3p-v7kg">
        <div data-testid="items-count" data-oid="kgtokk0">
          {adapter.items.length}
        </div>
        <div data-testid="loading" data-oid="ttap7a4">
          {String(adapter.loading)}
        </div>
        <div data-testid="error" data-oid="hncgdsm">
          {adapter.error || "none"}
        </div>
        <div data-testid="total-stats" data-oid="zfjur4z">
          {adapter.stats.total}
        </div>
        {adapter.items.map((item) => (
          <div key={item.id} data-testid="adapter-item" data-oid="sh177f9">
            {typeof item.name === "string" ? item.name : item.name?.en || ""}
          </div>
        ))}
      </div>
    )
  }

  it("должен предоставлять унифицированный интерфейс адаптера", async () => {
    render(
      <EffectsProvider key="adapter-test" data-oid="yvfhr39">
        <TestComponent type="effect" data-oid="g8c3c8t" />
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
      <EffectsProvider key="adapter-filter-test" data-oid="-wyz08i">
        <TestComponent type="effect" options={{ category: "artistic" }} data-oid="d3i4ogg" />
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
      <div data-oid="086qwdn">
        <div data-testid="effects-search-count" data-oid=".ij.72o">
          {results.length}
        </div>
      </div>
    )
  }

  function TestFiltersSearch() {
    const { results } = useFiltersSearch({ category: "technical" })
    return (
      <div data-oid="-vp3cau">
        <div data-testid="filters-search-count" data-oid="irrrnc0">
          {results.length}
        </div>
      </div>
    )
  }

  function TestTransitionsSearch() {
    const { results } = useTransitionsSearch({ category: "basic" })
    return (
      <div data-oid="j.n:mym">
        <div data-testid="transitions-search-count" data-oid="xkdlzfe">
          {results.length}
        </div>
      </div>
    )
  }

  it("должен выполнять типизированный поиск эффектов", async () => {
    render(
      <EffectsProvider key="typed-effects-test" data-oid="40q56n0">
        <TestEffectsSearch data-oid=".8lm1jp" />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("effects-search-count")).toHaveTextContent("1")
    })
  })

  it("должен выполнять типизированный поиск фильтров", async () => {
    render(
      <EffectsProvider key="typed-filters-test" data-oid="2szete9">
        <TestFiltersSearch data-oid="ut4cp0q" />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("filters-search-count")).toHaveTextContent("1")
    })
  })

  it("должен выполнять типизированный поиск переходов", async () => {
    render(
      <EffectsProvider key="typed-transitions-test" data-oid=":gw9xt4">
        <TestTransitionsSearch data-oid="lrun.8u" />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("transitions-search-count")).toHaveTextContent("1")
    })
  })
})

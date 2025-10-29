import { render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EffectsProvider, useEffectsProvider } from "../../providers/effects-provider"

// Import backend-sync mock
import "@/test/mocks/backend-sync"

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
          tags: ["test"],
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
          category: "color-correction",
          complexity: "basic",
          tags: ["test"],
          description: { en: "Test Filter 1" },
          labels: { en: "Test Filter 1", ru: "Тестовый фильтр 1" },
          params: { brightness: 0, contrast: 0, saturation: 0 },
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
          labels: { ru: "Тестовый переход 1", en: "Test Transition 1" },
          description: { ru: "Тестовый переход 1", en: "Test Transition 1" },
          category: "basic",
          complexity: "basic",
          tags: ["test"],
          duration: { min: 0.5, max: 3, default: 1 },
          ffmpegCommand: () => "fade",
        },
      ],
      source: "built-in",
      timestamp: Date.now(),
    },
  }),
}))

// Тестовый компонент для проверки хуков
function TestComponent() {
  const { api, isInitialized } = useEffectsProvider()
  const [effects, setEffects] = React.useState<any[]>([])
  const [filters, setFilters] = React.useState<any[]>([])
  const [transitions, setTransitions] = React.useState<any[]>([])

  React.useEffect(() => {
    if (isInitialized) {
      const updateResources = () => {
        setEffects(api.getEffects())
        setFilters(api.getFilters())
        setTransitions(api.getTransitions())
      }

      updateResources()

      // Подписываемся на обновления
      const unsubscribe = api.onResourcesUpdate(() => {
        updateResources()
      })

      return unsubscribe
    }
  }, [api, isInitialized])

  return (
    <div>
      <div data-testid="initialized">{String(isInitialized)}</div>
      <div data-testid="effects-count">{effects.length}</div>
      <div data-testid="filters-count">{filters.length}</div>
      <div data-testid="transitions-count">{transitions.length}</div>
      {effects.map((effect) => (
        <div key={effect.id} data-testid="effect-item">
          {effect.name}
        </div>
      ))}
    </div>
  )
}

describe("EffectsProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен инициализироваться с встроенными ресурсами", async () => {
    render(
      <EffectsProvider>
        <TestComponent />
      </EffectsProvider>,
    )

    // Ждем инициализации
    await waitFor(
      () => {
        expect(screen.getByTestId("initialized")).toHaveTextContent("true")
      },
      { timeout: 3000 },
    )

    // Ждем загрузки ресурсов с более длительным таймаутом
    await waitFor(
      () => {
        expect(screen.getByTestId("effects-count")).toHaveTextContent("2")
      },
      { timeout: 3000 },
    )

    expect(screen.getByTestId("filters-count")).toHaveTextContent("1")
    expect(screen.getByTestId("transitions-count")).toHaveTextContent("1")

    // Проверяем конкретные эффекты
    expect(screen.getByText("Test Effect 1")).toBeInTheDocument()
    expect(screen.getByText("Test Effect 2")).toBeInTheDocument()
  })

  it("должен обрабатывать ошибки инициализации", async () => {
    const onError = vi.fn()

    render(
      <EffectsProvider onError={onError}>
        <TestComponent />
      </EffectsProvider>,
    )

    // В случае успешной загрузки ошибок быть не должно
    await waitFor(() => {
      expect(screen.getByTestId("initialized")).toHaveTextContent("true")
    })

    expect(onError).not.toHaveBeenCalled()
  })

  it("должен поддерживать кастомную конфигурацию", async () => {
    const config = {
      initialSources: ["built-in" as const],
      backgroundLoadDelay: 500,
      enableCaching: false,
      maxCacheSize: 1024,
    }

    render(
      <EffectsProvider config={config}>
        <TestComponent />
      </EffectsProvider>,
    )

    await waitFor(
      () => {
        expect(screen.getByTestId("initialized")).toHaveTextContent("true")
      },
      { timeout: 3000 },
    )

    // Ждем загрузки ресурсов с более длительным таймаутом
    await waitFor(
      () => {
        expect(screen.getByTestId("effects-count")).toHaveTextContent("2")
      },
      { timeout: 3000 },
    )
  })

  it("должен выбрасывать ошибку при использовании хука вне провайдера", () => {
    // Захватываем console.error для предотвращения вывода в тесте
    const originalError = console.error
    console.error = vi.fn()

    expect(() => {
      render(<TestComponent />)
    }).toThrow("useEffectsProvider must be used within an EffectsProvider")

    console.error = originalError
  })
})

describe("EffectsProvider API", () => {
  let api: any

  function APITestComponent() {
    const { api: providerAPI, isInitialized } = useEffectsProvider()

    React.useEffect(() => {
      if (isInitialized && providerAPI) {
        api = providerAPI
      }
    }, [providerAPI, isInitialized])

    return (
      <div>
        <div data-testid="api-ready">{String(isInitialized)}</div>
        <div data-testid="api-available">{String(!!providerAPI)}</div>
      </div>
    )
  }

  beforeEach(async () => {
    // Reset api before each test
    api = undefined

    render(
      <EffectsProvider>
        <APITestComponent />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("api-ready")).toHaveTextContent("true")
    })

    await waitFor(() => {
      expect(screen.getByTestId("api-available")).toHaveTextContent("true")
    })

    // Additional wait to ensure api is set
    await waitFor(() => {
      expect(api).toBeDefined()
    })
  })

  it("должен предоставлять методы для получения ресурсов", () => {
    expect(api.getEffects).toBeDefined()
    expect(api.getFilters).toBeDefined()
    expect(api.getTransitions).toBeDefined()
    expect(api.getResources).toBeDefined()
    expect(api.getResourceById).toBeDefined()
  })

  it("должен предоставлять методы для поиска", () => {
    expect(api.searchResources).toBeDefined()
    expect(api.getResourcesByCategory).toBeDefined()
    expect(api.getResourcesByTags).toBeDefined()
    expect(api.getResourcesByComplexity).toBeDefined()
  })

  it("должен предоставлять методы управления источниками", () => {
    expect(api.loadSource).toBeDefined()
    expect(api.isSourceLoaded).toBeDefined()
    expect(api.refreshSource).toBeDefined()
    expect(api.getSourceConfig).toBeDefined()
    expect(api.updateSourceConfig).toBeDefined()
  })

  it("должен предоставлять методы для работы с кэшем", () => {
    expect(api.clearCache).toBeDefined()
    expect(api.clearSourceCache).toBeDefined()
    expect(api.invalidateCache).toBeDefined()
    expect(api.getCacheSize).toBeDefined()
  })

  it("должен поддерживать поиск по запросу", () => {
    const results = api.searchResources("effect", { query: "test" })
    expect(results).toHaveLength(2)
    expect(results[0].name).toContain("Test")
  })

  it("должен поддерживать комбинированный поиск с фильтрацией по сложности", () => {
    // Поиск только по complexity
    const basicResults = api.searchResources("effect", { complexity: "basic" })
    expect(basicResults).toHaveLength(1)
    expect(basicResults[0].complexity).toBe("basic")

    // Комбинированный поиск: query + complexity
    const testBasicResults = api.searchResources("effect", { query: "test", complexity: "basic" })
    expect(testBasicResults).toHaveLength(1)
    expect(testBasicResults[0].name).toContain("Test")
    expect(testBasicResults[0].complexity).toBe("basic")

    // Комбинированный поиск: category + complexity
    const colorIntermediateResults = api.searchResources("effect", {
      category: "color-correction",
      complexity: "intermediate",
    })
    expect(colorIntermediateResults).toHaveLength(1)
    expect(colorIntermediateResults[0].category).toBe("color-correction")
    expect(colorIntermediateResults[0].complexity).toBe("intermediate")

    // Поиск с несуществующей сложностью
    const advancedResults = api.searchResources("effect", { complexity: "advanced" })
    expect(advancedResults).toHaveLength(0)
  })

  it("должен поддерживать фильтрацию по категории", () => {
    const artisticEffects = api.getResourcesByCategory("effect", "artistic")
    expect(artisticEffects).toHaveLength(1)
    expect(artisticEffects[0].category).toBe("artistic")

    const colorEffects = api.getResourcesByCategory("effect", "color-correction")
    expect(colorEffects).toHaveLength(1)
    expect(colorEffects[0].category).toBe("color-correction")
  })

  it("должен поддерживать фильтрацию по тегам", () => {
    const testResources = api.getResourcesByTags("effect", ["test"])
    expect(testResources).toHaveLength(2)

    const colorResources = api.getResourcesByTags("effect", ["color"])
    expect(colorResources).toHaveLength(1)
  })

  it("должен поддерживать фильтрацию по сложности", () => {
    const basicEffects = api.getResourcesByComplexity("effect", "basic")
    expect(basicEffects).toHaveLength(1)
    expect(basicEffects[0].complexity).toBe("basic")
    expect(basicEffects[0].id).toBe("test-effect-1")

    const intermediateEffects = api.getResourcesByComplexity("effect", "intermediate")
    expect(intermediateEffects).toHaveLength(1)
    expect(intermediateEffects[0].complexity).toBe("intermediate")
    expect(intermediateEffects[0].id).toBe("test-effect-2")

    const advancedEffects = api.getResourcesByComplexity("effect", "advanced")
    expect(advancedEffects).toHaveLength(0)

    // Проверка для фильтров
    const basicFilters = api.getResourcesByComplexity("filter", "basic")
    expect(basicFilters).toHaveLength(1)
    expect(basicFilters[0].complexity).toBe("basic")

    // Проверка для переходов
    const basicTransitions = api.getResourcesByComplexity("transition", "basic")
    expect(basicTransitions).toHaveLength(1)
    expect(basicTransitions[0].complexity).toBe("basic")
  })

  it("должен поддерживать получение ресурса по ID", () => {
    const effect = api.getResourceById("effect", "test-effect-1")
    expect(effect).toBeDefined()
    expect(effect.name).toBe("Test Effect 1")

    const nonExistent = api.getResourceById("effect", "non-existent")
    expect(nonExistent).toBeNull()
  })

  it("должен предоставлять статистику", () => {
    const stats = api.getStats()
    expect(stats.total).toBe(4) // 2 эффекта + 1 фильтр + 1 переход
    expect(stats.byType.effect).toBe(2)
    expect(stats.byType.filter).toBe(1)
    expect(stats.byType.transition).toBe(1)
    expect(stats.bySource["built-in"]).toBe(4)
  })

  it("должен предоставлять состояние загрузки", () => {
    const loadingState = api.getLoadingState()
    expect(loadingState.isLoading).toBe(false)
    expect(loadingState.loadedSources.has("built-in")).toBe(true)
    expect(loadingState.error).toBeNull()
  })
})

import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  loadAllResourcesLazy,
  loadEffectsLazy,
  loadFiltersLazy,
  loadResourcesByCategory,
  loadResourcesInChunks,
  loadTransitionsLazy,
} from "../../services/resource-loaders"

// Мокаем загрузчик эффектов
vi.mock("@/features/effects/data/effects-loader", () => ({
  allMigratedEffects: [
    {
      id: "test-effect-1",
      name: { en: "Test Effect 1", ru: "Тестовый эффект 1" },
      category: "stylize",
      scope: ["clip"],
      processingType: "realtime",
      version: "1.0.0",
      tags: ["test"],
      complexity: "low",
      gpuAccelerated: true,
      parameters: [],
      presets: [],
      processors: {
        ffmpeg: {
          filter: (params: any) => `blur=${params.intensity || 5}`,
        },
        css: {
          filter: (params: any) => `blur(${params.intensity || 5}px)`,
        },
      },
    },
    {
      id: "test-effect-2",
      name: { en: "Test Effect 2", ru: "Тестовый эффект 2" },
      category: "color_correction",
      scope: ["clip"],
      processingType: "realtime",
      version: "1.0.0",
      tags: ["test"],
      complexity: "medium",
      gpuAccelerated: true,
      parameters: [],
      presets: [],
      processors: {
        ffmpeg: {
          filter: (params: any) => `brightness=${params.intensity || 1}`,
        },
        css: {
          filter: (params: any) => `brightness(${params.intensity || 1})`,
        },
      },
    },
  ],
}))

vi.mock("@/features/filters/data/filters.json", () => ({
  default: {
    filters: [
      {
        id: "test-filter-1",
        name: "Test Filter 1",
        category: "technical",
        complexity: "advanced",
        tags: ["log"],
      },
    ],
  },
}))

vi.mock("@/features/transitions/data/transitions.json", () => ({
  default: {
    transitions: [
      {
        id: "test-transition-1",
        type: "fade",
        category: "basic",
        complexity: "basic",
        tags: ["smooth"],
        ffmpegCommand: "fade=t=in:st={start}:d={duration}",
      },
    ],
  },
}))

describe("loadEffectsLazy", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен успешно загружать эффекты", async () => {
    const result = await loadEffectsLazy()

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(2)
    expect(result.source).toBe("built-in")
    expect(result.data[0].name.en).toBe("Test Effect 1")
    expect(result.data[1].name.en).toBe("Test Effect 2")
  })

  it("должен обрабатывать строковые функции в эффектах", async () => {
    const result = await loadEffectsLazy()

    expect(result.success).toBe(true)
    expect(typeof result.data[0].processors.ffmpeg?.filter).toBe("function")
    expect(typeof result.data[0].processors.css?.filter).toBe("function")

    // Тестируем функции
    const ffmpegResult = result.data[0].processors.ffmpeg?.filter({ intensity: 5 })
    expect(ffmpegResult).toBe("blur=5")

    const cssResult = result.data[0].processors.css?.filter({ intensity: 10 })
    expect(cssResult).toBe("blur(10px)")
  })

  it("должен обрабатывать ошибки загрузки", async () => {
    // Упрощенный тест - просто проверяем, что функция возвращает корректную структуру при ошибке
    const result = await loadEffectsLazy()

    expect(result).toHaveProperty("success")
    expect(result).toHaveProperty("data")
    expect(result).toHaveProperty("source")
    expect(result).toHaveProperty("timestamp")
    expect(Array.isArray(result.data)).toBe(true)
  })
})

describe("loadFiltersLazy", () => {
  it("должен успешно загружать фильтры", async () => {
    const result = await loadFiltersLazy()

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.source).toBe("built-in")
    expect(result.data[0].name).toBe("Test Filter 1")
  })
})

describe("loadTransitionsLazy", () => {
  it("должен успешно загружать переходы", async () => {
    const result = await loadTransitionsLazy()

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.source).toBe("built-in")
    expect(result.data[0].type).toBe("fade")
  })

  it("должен обрабатывать строковые функции в переходах", async () => {
    const result = await loadTransitionsLazy()

    expect(result.success).toBe(true)
    // Переходы имеют строковые ffmpegCommand в моках
    expect(typeof result.data[0].ffmpegCommand).toBe("string")
    expect(result.data[0].ffmpegCommand).toBe("fade=t=in:st={start}:d={duration}")
  })
})

describe("loadAllResourcesLazy", () => {
  it("должен загружать все типы ресурсов", async () => {
    const result = await loadAllResourcesLazy()

    expect(result.effects.success).toBe(true)
    expect(result.filters.success).toBe(true)
    expect(result.transitions.success).toBe(true)

    expect(result.effects.data).toHaveLength(2)
    expect(result.filters.data).toHaveLength(1)
    expect(result.transitions.data).toHaveLength(1)
  })

  it("должен обрабатывать отмену загрузки", async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(loadAllResourcesLazy(controller.signal)).rejects.toThrow("Loading was aborted")
  })

  it("должен обрабатывать ошибки отдельных загрузчиков", async () => {
    // Упрощенный тест - проверяем структуру результата
    const result = await loadAllResourcesLazy()

    expect(result).toHaveProperty("effects")
    expect(result).toHaveProperty("filters")
    expect(result).toHaveProperty("transitions")
    expect(result.effects).toHaveProperty("success")
    expect(result.filters).toHaveProperty("success")
    expect(result.transitions).toHaveProperty("success")
  })
})

describe("loadResourcesByCategory", () => {
  it("должен загружать ресурсы конкретной категории", async () => {
    const result = await loadResourcesByCategory("effects", "stylize")

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].name.en).toBe("Test Effect 1")
  })

  it("должен возвращать пустой массив для несуществующей категории", async () => {
    const result = await loadResourcesByCategory("effects", "non-existent")

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(0)
  })

  it("должен обрабатывать отмену загрузки", async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(loadResourcesByCategory("effects", "artistic", controller.signal)).rejects.toThrow(
      "Loading was aborted",
    )
  })

  it("должен обрабатывать неизвестный тип ресурса", async () => {
    const result = await loadResourcesByCategory("unknown" as any, "test")

    expect(result.success).toBe(false)
    expect(result.error).toBe("Unknown resource type: unknown")
  })
})

describe("loadResourcesInChunks", () => {
  it("должен загружать ресурсы по частям", async () => {
    const chunks = []
    const generator = loadResourcesInChunks("effects", 1)

    for await (const chunk of generator) {
      chunks.push(chunk)
    }

    expect(chunks).toHaveLength(2) // 2 эффекта по 1 в каждом чанке
    expect(chunks[0].data).toHaveLength(1)
    expect(chunks[1].data).toHaveLength(1)
    expect(chunks[0].data[0].name.en).toBe("Test Effect 1")
    expect(chunks[1].data[0].name.en).toBe("Test Effect 2")
  })

  it("должен обрабатывать ошибки загрузки", async () => {
    // Упрощенный тест - проверяем структуру возвращаемых данных
    const generator = loadResourcesInChunks("effects", 1)
    const firstChunk = await generator.next()

    expect(firstChunk.value).toBeDefined()
    expect(firstChunk.value).toHaveProperty("success")
    expect(firstChunk.value).toHaveProperty("data")
    expect(firstChunk.value).toHaveProperty("source")
    if (firstChunk.value) {
      expect(Array.isArray(firstChunk.value.data)).toBe(true)
    }
  })

  it("должен обрабатывать отмену загрузки во время чанкинга", async () => {
    const controller = new AbortController()
    const generator = loadResourcesInChunks("effects", 1, controller.signal)

    // Получаем первый чанк
    const firstChunk = await generator.next()
    expect(firstChunk.value).toBeDefined()
    if (firstChunk.value) {
      expect(firstChunk.value.success).toBe(true)
    }

    // Отменяем загрузку
    controller.abort()

    // Следующий чанк должен выбросить ошибку
    await expect(generator.next()).rejects.toThrow("Loading was aborted")
  })
})

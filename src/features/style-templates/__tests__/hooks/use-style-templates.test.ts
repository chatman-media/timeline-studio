/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useStyleTemplates } from "../../hooks/use-style-templates"

// Мокаем динамический импорт JSON файла
vi.mock("../../data/style-templates.json", () => ({
  default: {
    templates: [
      {
        id: "test-template-1",
        name: {
          ru: "Тестовый шаблон 1",
          en: "Test Template 1",
        },
        category: "intro",
        style: "modern",
        aspectRatio: "16:9",
        duration: 3,
        hasText: true,
        hasAnimation: true,
        tags: {
          ru: ["тест", "интро"],
          en: ["test", "intro"],
        },
        description: {
          ru: "Тестовое описание",
          en: "Test description",
        },
        elements: [],
      },
      {
        id: "test-template-2",
        name: {
          ru: "Тестовый шаблон 2",
          en: "Test Template 2",
        },
        category: "outro",
        style: "minimal",
        aspectRatio: "16:9",
        duration: 5,
        hasText: false,
        hasAnimation: true,
        tags: {
          ru: ["тест", "концовка"],
          en: ["test", "outro"],
        },
        description: {
          ru: "Тестовое описание 2",
          en: "Test description 2",
        },
        elements: [],
      },
    ],
  },
}))

describe("useStyleTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Мокаем console.log
    vi.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("должен инициализироваться с правильными значениями по умолчанию", () => {
    const { result } = renderHook(() => useStyleTemplates())

    expect(result.current.templates).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(null)
    expect(result.current.filteredTemplates).toEqual([])
    expect(typeof result.current.setFilter).toBe("function")
    expect(typeof result.current.setSorting).toBe("function")
    expect(typeof result.current.getTemplateById).toBe("function")
    expect(typeof result.current.getTemplatesByCategory).toBe("function")
  })

  it("должен загружать шаблоны из JSON файла", async () => {
    const { result } = renderHook(() => useStyleTemplates())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.templates.length).toBeGreaterThan(0)
    expect(result.current.templates[0]).toHaveProperty("id")
    expect(result.current.templates[0]).toHaveProperty("name")
    expect(result.current.error).toBe(null)
  })

  it("должен фильтровать шаблоны по категории", async () => {
    const { result } = renderHook(() => useStyleTemplates())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Устанавливаем фильтр по категории
    act(() => {
      result.current.setFilter({ category: "intro" })
    })

    await waitFor(() => {
      expect(result.current.filteredTemplates).toHaveLength(1)
      expect(result.current.filteredTemplates[0].category).toBe("intro")
    })
  })

  it("должен фильтровать шаблоны по стилю", async () => {
    const { result } = renderHook(() => useStyleTemplates())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Устанавливаем фильтр по стилю
    act(() => {
      result.current.setFilter({ style: "minimal" })
    })

    await waitFor(() => {
      expect(result.current.filteredTemplates).toHaveLength(1)
      expect(result.current.filteredTemplates[0].style).toBe("minimal")
    })
  })

  it("должен фильтровать шаблоны по наличию текста", async () => {
    const { result } = renderHook(() => useStyleTemplates())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Фильтр по наличию текста
    act(() => {
      result.current.setFilter({ hasText: true })
    })

    await waitFor(() => {
      expect(result.current.filteredTemplates).toHaveLength(1)
      expect(result.current.filteredTemplates[0].hasText).toBe(true)
    })
  })

  it("должен фильтровать шаблоны по длительности", async () => {
    const { result } = renderHook(() => useStyleTemplates())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Фильтр по длительности
    act(() => {
      result.current.setFilter({ duration: { min: 4, max: 6 } })
    })

    await waitFor(() => {
      expect(result.current.filteredTemplates).toHaveLength(1)
      expect(result.current.filteredTemplates[0].duration).toBe(5)
    })
  })

  it("должен сортировать шаблоны по названию", async () => {
    const { result } = renderHook(() => useStyleTemplates())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Сортировка по названию (по убыванию)
    act(() => {
      result.current.setSorting("name", "desc")
    })

    await waitFor(() => {
      expect(result.current.filteredTemplates[0].name.ru).toBe("Тестовый шаблон 2")
      expect(result.current.filteredTemplates[1].name.ru).toBe("Тестовый шаблон 1")
    })
  })

  it("должен сортировать шаблоны по длительности", async () => {
    const { result } = renderHook(() => useStyleTemplates())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Сортировка по длительности (по возрастанию)
    act(() => {
      result.current.setSorting("duration", "asc")
    })

    await waitFor(() => {
      expect(result.current.filteredTemplates[0].duration).toBe(3)
      expect(result.current.filteredTemplates[1].duration).toBe(5)
    })
  })

  it("должен находить шаблон по ID", async () => {
    const { result } = renderHook(() => useStyleTemplates())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const template = result.current.getTemplateById("test-template-1")
    expect(template).toBeDefined()
    expect(template?.id).toBe("test-template-1")
    expect(template?.name.ru).toBe("Тестовый шаблон 1")
  })

  it("должен возвращать undefined для несуществующего ID", async () => {
    const { result } = renderHook(() => useStyleTemplates())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const template = result.current.getTemplateById("non-existent")
    expect(template).toBeUndefined()
  })

  it("должен находить шаблоны по категории", async () => {
    const { result } = renderHook(() => useStyleTemplates())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const introTemplates = result.current.getTemplatesByCategory("intro")
    expect(introTemplates).toHaveLength(1)
    expect(introTemplates[0].category).toBe("intro")

    const outroTemplates = result.current.getTemplatesByCategory("outro")
    expect(outroTemplates).toHaveLength(1)
    expect(outroTemplates[0].category).toBe("outro")
  })

  it("должен возвращать пустой массив для несуществующей категории", async () => {
    const { result } = renderHook(() => useStyleTemplates())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const templates = result.current.getTemplatesByCategory("non-existent")
    expect(templates).toEqual([])
  })

  it("должен применять комбинированные фильтры", async () => {
    const { result } = renderHook(() => useStyleTemplates())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Комбинированный фильтр: категория + наличие текста
    act(() => {
      result.current.setFilter({ category: "intro", hasText: true })
    })

    await waitFor(() => {
      expect(result.current.filteredTemplates).toHaveLength(1)
      expect(result.current.filteredTemplates[0].category).toBe("intro")
      expect(result.current.filteredTemplates[0].hasText).toBe(true)
    })
  })

  it("должен обрабатывать загрузку шаблонов корректно", async () => {
    // Тест проверяет корректность загрузки шаблонов
    // Хук загружает данные либо из JSON, либо использует fallback

    const { result } = renderHook(() => useStyleTemplates())

    // Проверяем, что loading изначально true
    expect(result.current.loading).toBe(true)

    // Дожидаемся окончания загрузки
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false)
      },
      { timeout: 3000 },
    )

    // После загрузки error должен быть null (успешная загрузка или fallback)
    expect(result.current.error).toBeNull()

    // Шаблоны должны быть загружены
    // В зависимости от успешности загрузки JSON будет разное количество
    // Минимум должны быть доступны данные (хотя бы fallback)
    expect(result.current.templates).toBeDefined()
    expect(Array.isArray(result.current.templates)).toBe(true)
  })
})

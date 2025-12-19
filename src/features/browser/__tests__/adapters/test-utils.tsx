import { type RenderOptions, render } from "@testing-library/react"
import type React from "react"
import type { ReactElement } from "react"
import { vi } from "vitest"

/**
 * Тестовые утилиты для адаптеров
 */

// Провайдер для тестирования с необходимыми контекстами
const TestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div data-testid="test-provider" data-oid="xp210j4">
      {children}
    </div>
  )
}

// Кастомная функция рендеринга
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: TestProvider, ...options })

// Фабрики тестовых данных
export const createMockMediaFile = (overrides = {}) => ({
  id: "test-media",
  name: "test.mp4",
  path: "/test.mp4",
  extension: ".mp4",
  size: 1024000,
  createdAt: "2024-01-01T00:00:00Z",
  duration: 120,
  probeData: {
    format: { duration: 120 },
    streams: [{ codec_type: "video" }],
  },
  isVideo: false,
  isImage: false,
  isAudio: false,
  ...overrides,
})

export const createMockMusicFile = (overrides = {}) => ({
  id: "test-music",
  name: "test.mp3",
  path: "/test.mp3",
  extension: ".mp3",
  size: 3145728,
  createdAt: "2024-01-01T00:00:00Z",
  probeData: {
    format: {
      duration: 180,
      tags: {
        artist: "Test Artist",
        title: "Test Song",
      },
    },
  },
  ...overrides,
})

export const createMockEffect = (overrides = {}) => ({
  id: "test-effect",
  name: "Test Effect",
  description: "Test effect description",
  category: "filter",
  cssFilter: "blur(5px)",
  icon: "🌫️",
  ...overrides,
})

export const createMockFilter = (overrides = {}) => ({
  id: "test-filter",
  name: "Test Filter",
  description: "Test filter description",
  category: "color",
  cssFilter: "brightness(1.2)",
  icon: "☀️",
  ...overrides,
})

export const createMockTransition = (overrides = {}) => ({
  id: "test-transition",
  name: "Test Transition",
  description: "Test transition description",
  category: "fade",
  duration: 1000,
  icon: "🌅",
  ...overrides,
})

export const createMockSubtitleStyle = (overrides = {}) => ({
  id: "test-subtitle",
  name: "Test Subtitle",
  description: "Test subtitle description",
  category: "basic",
  cssStyles: {
    color: "#ffffff",
    fontSize: "16px",
  },
  ...overrides,
})

export const createMockTemplate = (overrides = {}) => ({
  id: "test-template",
  name: { en: "Test Template", ru: "Тестовый шаблон" },
  description: {
    en: "Test template description",
    ru: "Описание тестового шаблона",
  },
  category: "grid",
  cellCount: 4,
  aspectRatio: "16:9",
  thumbnail: "/templates/test.png",
  ...overrides,
})

export const createMockStyleTemplate = (overrides = {}) => ({
  id: "test-style-template",
  name: { en: "Test Style Template", ru: "Тестовый стиль шаблон" },
  description: {
    en: "Test style template description",
    ru: "Описание тестового стиль шаблона",
  },
  category: "intro",
  duration: 2000,
  hasAnimation: true,
  thumbnail: "/style-templates/test.png",
  ...overrides,
})

// Хелперы для моков
export const createMockAdapter = (overrides = {}) => ({
  useData: vi.fn(() => ({
    isLoading: false,
    error: null,
    items: [],
  })),
  PreviewComponent: vi.fn(() => <div data-testid="mock-preview" data-oid="ovju8zo" />),
  getSortValue: vi.fn((item, _sortBy) => item.name || ""),
  getSearchableText: vi.fn((item) => [item.name || ""]),
  getGroupValue: vi.fn(() => "Test Group"),
  matchesFilter: vi.fn(() => true),
  favoriteType: "test",
  ...overrides,
})

// Утилиты для тестирования сортировки
export const testSortingBehavior = (adapter: any, items: any[], sortBy: string, expectedOrder: string[]) => {
  const sortedItems = items.sort((a, b) => {
    const valueA = adapter.getSortValue(a, sortBy)
    const valueB = adapter.getSortValue(b, sortBy)
    return typeof valueA === "string" ? valueA.localeCompare(valueB) : valueA - valueB
  })

  const actualOrder = sortedItems.map((item) => adapter.getSortValue(item, sortBy))
  expect(actualOrder).toEqual(expectedOrder)
}

// Утилиты для тестирования фильтрации
export const testFilterBehavior = (adapter: any, items: any[], filterType: string, expectedMatches: boolean[]) => {
  const results = items.map((item) => adapter.matchesFilter?.(item, filterType) ?? true)
  expect(results).toEqual(expectedMatches)
}

// Утилиты для тестирования группировки
export const testGroupingBehavior = (adapter: any, items: any[], groupBy: string, expectedGroups: string[]) => {
  const groups = items.map((item) => adapter.getGroupValue(item, groupBy))
  expect(groups).toEqual(expectedGroups)
}

// Экспорт кастомной функции рендеринга
export { customRender as render }

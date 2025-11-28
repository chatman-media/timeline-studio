import { vi } from "vitest"

// Мокаем зависимости для тестов фильтров
vi.mock("@/domains/project-management/hooks", () => ({
  useFavorites: vi.fn(() => ({
    isItemFavorite: vi.fn((item: any, type: string) => type === "filter" && item.id === "favorite-filter"),
  })),
}))

vi.mock("@/features/filters/components/filter-preview", () => ({
  FilterPreview: ({ filter, onClick, size, previewWidth, previewHeight }: any) => {
    const div = document.createElement("div")
    div.setAttribute("data-testid", "filter-preview")
    if (onClick) div.onclick = onClick
    div.style.width = `${previewWidth || size}px`
    div.style.height = `${previewHeight || size}px`
    div.textContent = filter.name
    return div
  },
}))

vi.mock("@/features/filters/hooks/use-filters", () => ({
  useFilters: vi.fn(() => ({
    filters: [],
    loading: false,
    error: null,
  })),
}))

/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  BrowserLoadingIndicator,
  BrowserResourcesSkeleton,
  BrowserTabLoadingBadge,
} from "../../components/browser-loading-indicator"
import { useLoadingState, useResourcesStats } from "../../hooks/use-resources"

// Мокаем хуки
vi.mock("../../hooks/use-resources")

// Мокаем UI компоненты
vi.mock("@timeline-studio/ui/components/badge", () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className} data-oid="4p9yxiv">
      {children}
    </span>
  ),
}))

vi.mock("@timeline-studio/ui/components/skeleton", () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} data-oid="-th9k6f" />,
}))

describe("BrowserLoadingIndicator", () => {
  const mockLoadingState = {
    isLoading: false,
    error: null,
    progress: 0,
    loadedSources: new Set<"built-in" | "local" | "remote" | "imported">(),
    loadingQueue: [] as ("built-in" | "local" | "remote" | "imported")[],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useLoadingState).mockReturnValue(mockLoadingState)
  })

  describe("Видимость компонента", () => {
    it("не должен отображаться когда нет загрузки", () => {
      const { container } = render(<BrowserLoadingIndicator data-oid="swv7t00" />)
      expect(container.firstChild).toBeNull()
    })

    it("должен отображаться при загрузке", () => {
      vi.mocked(useLoadingState).mockReturnValue({
        ...mockLoadingState,
        isLoading: true,
      })

      render(<BrowserLoadingIndicator data-oid="i7algpm" />)
      expect(screen.getByText("Загрузка ресурсов...")).toBeInTheDocument()
    })
  })

  describe("Состояния загрузки", () => {
    it("должен показывать анимированный спиннер при загрузке", () => {
      vi.mocked(useLoadingState).mockReturnValue({
        ...mockLoadingState,
        isLoading: true,
      })

      render(<BrowserLoadingIndicator data-oid="ximcmxt" />)

      const spinner = screen.getByText("Загрузка ресурсов...").previousElementSibling
      expect(spinner).toHaveClass("animate-spin")
    })

    it("должен показывать простой текст загрузки", () => {
      vi.mocked(useLoadingState).mockReturnValue({
        ...mockLoadingState,
        isLoading: true,
      })

      render(<BrowserLoadingIndicator data-oid="1c83qjf" />)
      expect(screen.getByText("Загрузка ресурсов...")).toBeInTheDocument()
    })
  })
})

describe("BrowserResourcesSkeleton", () => {
  it("должен рендерить скелетон с правильной структурой", () => {
    render(<BrowserResourcesSkeleton data-oid="8ydf7t-" />)

    // Заголовок
    const skeletons = screen.getAllByTestId("skeleton")
    expect(skeletons).toHaveLength(38) // 2 в заголовке + 12 * 3 в карточках

    // Проверяем структуру сетки
    const grid = skeletons[2].parentElement?.parentElement
    const expectedClasses = ["grid", "grid-cols-2", "md:grid-cols-3", "lg:grid-cols-4", "xl:grid-cols-6"]
    expectedClasses.forEach((className) => {
      expect(grid).toHaveClass(className)
    })
  })

  it("должен рендерить 12 карточек", () => {
    render(<BrowserResourcesSkeleton data-oid="whpuy9q" />)

    // Каждая карточка содержит 3 скелетона
    const skeletons = screen.getAllByTestId("skeleton")
    const cardSkeletons = skeletons.slice(2) // Пропускаем 2 скелетона заголовка
    expect(cardSkeletons).toHaveLength(36) // 12 карточек * 3 скелетона
  })
})

describe("BrowserTabLoadingBadge", () => {
  const mockLoadingState = {
    isLoading: false,
    error: null,
    progress: 0,
    loadedSources: new Set<"built-in" | "local" | "remote" | "imported">(),
    loadingQueue: [] as ("built-in" | "local" | "remote" | "imported")[],
  }

  const mockStats = {
    total: 0,
    byType: {
      media: 0,
      music: 0,
      subtitle: 0,
      effect: 0,
      filter: 0,
      transition: 0,
      template: 0,
      styleTemplate: 0,
    },
    bySource: {
      "built-in": 0,
      local: 0,
      remote: 0,
      imported: 0,
    },
    cacheSize: 0,
    memoryUsage: 0,
  }

  beforeEach(() => {
    vi.mocked(useLoadingState).mockReturnValue(mockLoadingState)
    vi.mocked(useResourcesStats).mockReturnValue(mockStats)
  })

  it("не должен отображаться когда нет ресурсов и загрузки", () => {
    const { container } = render(<BrowserTabLoadingBadge resourceType="effect" data-oid="13lxldl" />)
    expect(container.firstChild).toBeNull()
  })

  it("должен показывать количество ресурсов", () => {
    vi.mocked(useResourcesStats).mockReturnValue({
      total: 100,
      byType: {
        media: 0,
        music: 0,
        subtitle: 0,
        effect: 25,
        filter: 0,
        transition: 0,
        template: 0,
        styleTemplate: 0,
      },
      bySource: {
        "built-in": 100,
        local: 0,
        remote: 0,
        imported: 0,
      },
      cacheSize: 0,
      memoryUsage: 0,
    })

    render(<BrowserTabLoadingBadge resourceType="effect" data-oid="d45jiue" />)
    expect(screen.getByText("25")).toBeInTheDocument()
  })

  it("должен показывать спиннер при загрузке", () => {
    vi.mocked(useLoadingState).mockReturnValue({
      ...mockLoadingState,
      isLoading: true,
    })

    render(<BrowserTabLoadingBadge resourceType="effect" data-oid="erqmk1f" />)

    const badge = screen.getByTestId("badge")
    expect(badge).toHaveAttribute("data-variant", "secondary")

    const spinner = badge.querySelector(".animate-spin")
    expect(spinner).toBeInTheDocument()
  })

  it("должен использовать правильный вариант badge", () => {
    vi.mocked(useResourcesStats).mockReturnValue({
      total: 10,
      byType: {
        media: 0,
        music: 0,
        subtitle: 0,
        effect: 10,
        filter: 0,
        transition: 0,
        template: 0,
        styleTemplate: 0,
      },
      bySource: {
        "built-in": 10,
        local: 0,
        remote: 0,
        imported: 0,
      },
      cacheSize: 0,
      memoryUsage: 0,
    })

    // Без загрузки
    const { rerender } = render(<BrowserTabLoadingBadge resourceType="effect" data-oid="t_fvh8l" />)
    expect(screen.getByTestId("badge")).toHaveAttribute("data-variant", "outline")

    // С загрузкой
    vi.mocked(useLoadingState).mockReturnValue({
      ...mockLoadingState,
      isLoading: true,
    })
    rerender(<BrowserTabLoadingBadge resourceType="effect" data-oid="9p_akrr" />)
    expect(screen.getByTestId("badge")).toHaveAttribute("data-variant", "secondary")
  })

  it("должен работать с разными типами ресурсов", () => {
    vi.mocked(useResourcesStats).mockReturnValue({
      total: 60,
      byType: {
        media: 0,
        music: 0,
        subtitle: 0,
        effect: 20,
        filter: 15,
        transition: 25,
        template: 0,
        styleTemplate: 0,
      },
      bySource: {
        "built-in": 60,
        local: 0,
        remote: 0,
        imported: 0,
      },
      cacheSize: 0,
      memoryUsage: 0,
    })

    const { rerender } = render(<BrowserTabLoadingBadge resourceType="effect" data-oid="xos39t6" />)
    expect(screen.getByText("20")).toBeInTheDocument()

    rerender(<BrowserTabLoadingBadge resourceType="filter" data-oid="396b1sx" />)
    expect(screen.getByText("15")).toBeInTheDocument()

    rerender(<BrowserTabLoadingBadge resourceType="transition" data-oid="h25du-." />)
    expect(screen.getByText("25")).toBeInTheDocument()
  })
})

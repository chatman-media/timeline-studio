/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { UniversalList } from "../../components/universal-list"

// Мокаем зависимости
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "ru" },
  }),
}))

vi.mock("@/features/browser/services", () => ({
  useBrowserState: () => ({
    currentTabSettings: {
      search_query: "",
      show_favorites_only: false,
      view_mode: "thumbnails",
      sort_by: "name",
      filter_type: "all",
      group_by: "none",
      sort_order: "asc",
      preview_size_index: 1,
    },
  }),
}))

vi.mock("@/features/media/utils/preview-sizes", () => ({
  PREVIEW_SIZES: [125, 150, 200, 250, 300, 400, 500],
  DEFAULT_PREVIEW_SIZE_INDEX: 3,
  DEFAULT_SIZE: 200,
  MIN_SIZE: 125,
  MAX_SIZE: 500,
}))

vi.mock("../../utils", () => ({
  filterItems: (items: any[]) => items,
  sortItems: (items: any[]) => items,
  groupItems: (_items: any[]) => [],
}))

vi.mock("../../components/content-group", () => ({
  ContentGroup: () => (
    <div data-testid="content-group" data-oid=":8qynlv">
      Content Group
    </div>
  ),
}))

vi.mock("../../components/no-files", () => ({
  NoFiles: ({ contentType }: any) => (
    <div data-testid="no-files" data-oid=".r:d-lc">
      No files for {contentType}
    </div>
  ),
}))

describe("UniversalList", () => {
  const mockAdapter = {
    useData: () => ({ items: [], loading: false, error: null }),
    getSearchableText: (item: any) => [item.name],
    getSortValue: (item: any) => item.name,
    matchesFilter: () => true,
    isFavorite: () => false,
    getGroupValue: () => "default",
    favoriteType: "media",
    importHandlers: undefined,
    PreviewComponent: () => null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Состояния рендеринга", () => {
    it("должен показывать индикатор загрузки", () => {
      const loadingAdapter = {
        ...mockAdapter,
        useData: () => ({ items: [], loading: true, error: null }),
      }

      render(<UniversalList adapter={loadingAdapter} data-oid="y3-xipn" />)

      expect(screen.getByText("common.loading")).toBeInTheDocument()
    })

    it("должен показывать ошибку", () => {
      const errorAdapter = {
        ...mockAdapter,
        useData: () => ({
          items: [],
          loading: false,
          error: new Error("Test error"),
        }),
      }

      render(<UniversalList adapter={errorAdapter} data-oid="-q74jlt" />)

      expect(screen.getByText(/common.error/)).toBeInTheDocument()
      expect(screen.getByText(/Test error/)).toBeInTheDocument()
    })

    it("должен показывать NoFiles когда список пуст", () => {
      render(<UniversalList adapter={mockAdapter} data-oid="qinpq-x" />)

      expect(screen.getByTestId("no-files")).toBeInTheDocument()
    })
  })
})

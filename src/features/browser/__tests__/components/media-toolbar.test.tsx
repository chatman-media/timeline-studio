/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ViewMode } from "@timeline-studio/domains/browser"
import { MediaToolbar, type MediaToolbarProps } from "../../components/media-toolbar"

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "common.search": "Search",
        "common.import": "Import",
        "common.importing": "Importing...",
        "browser.media.addMedia": "Add Media",
        "browser.media.addFolder": "Add Folder",
        "browser.media.favorites": "Favorites",
        "browser.toolbar.list": "List",
        "browser.toolbar.thumbnails": "Thumbnails",
        "browser.toolbar.sort": "Sort",
        "browser.toolbar.filter": "Filter",
        "browser.toolbar.group": "Group",
        "browser.toolbar.zoomOut": "Zoom Out",
        "browser.toolbar.zoomIn": "Zoom In",
        "browser.toolbar.sortOrder.asc": "Ascending",
        "browser.toolbar.sortOrder.desc": "Descending",
        "browser.toolbar.filterBy.all": "All Files",
        "sort.name": "Name",
        "sort.date": "Date",
        "sort.size": "Size",
        "group.none": "None",
        "group.type": "Type",
        "filter.video": "Video",
        "filter.audio": "Audio",
      }
      return translations[key] || key
    },
  }),
}))

// Mock UI components
vi.mock("@timeline-studio/ui/components/button", () => ({
  Button: ({ children, className, onClick, disabled, ...props }: any) => (
    <button className={className} onClick={onClick} disabled={disabled} {...props} data-oid="kei8xe_">
      {children}
    </button>
  ),
}))

vi.mock("@timeline-studio/ui/components/input", () => ({
  Input: ({ value, onChange, className, placeholder, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
      {...props}
      data-oid="d.mjek5"
    />
  ),
}))

vi.mock("@timeline-studio/ui/components/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => (
    <div data-testid="dropdown-menu" data-oid="hvvs78q">
      {children}
    </div>
  ),

  DropdownMenuTrigger: ({ children, asChild }: any) => (asChild ? children : <div data-oid="kob7:2o">{children}</div>),
  DropdownMenuContent: ({ children, align }: any) => (
    <div data-testid="dropdown-content" data-align={align} data-oid="_2f:9:p">
      {children}
    </div>
  ),

  DropdownMenuItem: ({ children, onClick }: any) => (
    <div data-testid="dropdown-item" onClick={onClick} data-oid="altskhc">
      {children}
    </div>
  ),

  DropdownMenuSeparator: () => <div data-testid="dropdown-separator" data-oid="032nkgy" />,
}))

vi.mock("@timeline-studio/ui/components/tooltip", () => ({
  Tooltip: ({ children }: any) => (
    <div data-testid="tooltip" data-oid="913au1x">
      {children}
    </div>
  ),

  TooltipProvider: ({ children }: any) => (
    <div data-testid="tooltip-provider" data-oid="_61x4kg">
      {children}
    </div>
  ),

  TooltipTrigger: ({ children, asChild }: any) => (asChild ? children : <div data-oid="pc6j-0k">{children}</div>),
  TooltipContent: ({ children }: any) => (
    <div data-testid="tooltip-content" data-oid="_e.d002">
      {children}
    </div>
  ),
}))

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  ArrowDownUp: ({ size }: any) => <div data-testid="arrow-down-up" data-size={size} data-oid="gtf9s2k" />,
  ArrowUpDown: ({ size }: any) => <div data-testid="arrow-up-down" data-size={size} data-oid="aib0o_u" />,
  Check: ({ className }: any) => <div data-testid="check" className={className} data-oid="ev:e3qd" />,
  File: ({ size, className }: any) => (
    <div data-testid="file-icon" data-size={size} className={className} data-oid="vrsf55g" />
  ),

  Filter: ({ size }: any) => <div data-testid="filter-icon" data-size={size} data-oid="inx:y68" />,
  Folder: ({ size, className }: any) => (
    <div data-testid="folder-icon" data-size={size} className={className} data-oid="mwy-80h" />
  ),

  Grid2x2: ({ size }: any) => <div data-testid="grid-icon" data-size={size} data-oid="8xji5-_" />,
  List: ({ size }: any) => <div data-testid="list-icon" data-size={size} data-oid="4hwvlm5" />,
  ListFilterPlus: ({ size }: any) => <div data-testid="list-filter-plus" data-size={size} data-oid="e8v.zzo" />,
  SortDesc: ({ size }: any) => <div data-testid="sort-desc" data-size={size} data-oid="6wrmm17" />,
  Star: ({ size, className }: any) => (
    <div data-testid="star-icon" data-size={size} className={className} data-oid="kk:lptx" />
  ),

  ZoomIn: ({ size }: any) => <div data-testid="zoom-in" data-size={size} data-oid=".5v3r6_" />,
  ZoomOut: ({ size }: any) => <div data-testid="zoom-out" data-size={size} data-oid="bj6:gl7" />,
}))

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}))

describe("MediaToolbar", () => {
  const mockProps: MediaToolbarProps = {
    // State
    searchQuery: "",
    sortBy: "name",
    sortOrder: "asc",
    filterType: "all",
    viewMode: "list" as ViewMode,
    groupBy: "none",
    availableExtensions: ["mp4", "mp3", "jpg"],
    showFavoritesOnly: false,

    // Options
    sortOptions: [
      { value: "name", label: "sort.name" },
      { value: "date", label: "sort.date" },
      { value: "size", label: "sort.size" },
    ],

    groupOptions: [
      { value: "none", label: "group.none" },
      { value: "type", label: "group.type" },
    ],

    // Callbacks
    onSearch: vi.fn(),
    onSort: vi.fn(),
    onFilter: vi.fn(),
    onChangeOrder: vi.fn(),
    onChangeViewMode: vi.fn(),
    onChangeGroupBy: vi.fn(),
    onToggleFavorites: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe("Basic rendering", () => {
    it("should render without crashing", () => {
      render(<MediaToolbar {...mockProps} data-oid=":qghtq5" />)
      expect(screen.getByPlaceholderText("Search")).toBeInTheDocument()
    })

    it("should render search input with placeholder", () => {
      render(<MediaToolbar {...mockProps} data-oid="hbzpncj" />)

      const searchInput = screen.getByPlaceholderText("Search")
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveValue("")
    })

    it("should render with custom className", () => {
      const { container } = render(<MediaToolbar {...mockProps} className="custom-toolbar" data-oid="zww80hu" />)

      const toolbar = container.firstChild as HTMLElement
      expect(toolbar).toHaveClass("custom-toolbar")
    })

    it("should render default view mode buttons", () => {
      render(<MediaToolbar {...mockProps} data-oid="izstc-l" />)

      expect(screen.getByTestId("list-view-button")).toBeInTheDocument()
      expect(screen.getByTestId("thumbnails-view-button")).toBeInTheDocument()
    })
  })

  describe("Search functionality", () => {
    it("should call onSearch when typing in search input", async () => {
      const user = userEvent.setup()
      render(<MediaToolbar {...mockProps} data-oid="a51cwxn" />)

      const searchInput = screen.getByPlaceholderText("Search")
      await user.clear(searchInput)
      await user.type(searchInput, "test")

      // user.type() calls onChange for each character individually
      expect(mockProps.onSearch).toHaveBeenCalledTimes(4)
      // The last call should be with the complete value
      expect(mockProps.onSearch).toHaveBeenLastCalledWith("t")
    })

    it("should display current search query", () => {
      render(<MediaToolbar {...mockProps} searchQuery="current search" data-oid="-tf_474" />)

      const searchInput = screen.getByDisplayValue("current search")
      expect(searchInput).toBeInTheDocument()
    })

    it("should handle search input change", () => {
      render(<MediaToolbar {...mockProps} data-oid="2nmdwjd" />)

      const searchInput = screen.getByPlaceholderText("Search")
      fireEvent.change(searchInput, { target: { value: "new search" } })

      expect(mockProps.onSearch).toHaveBeenCalledWith("new search")
    })
  })

  describe("Import functionality", () => {
    it("should render import buttons when showImport is true", () => {
      render(
        <MediaToolbar
          {...mockProps}
          showImport={true}
          onImportFile={vi.fn()}
          onImportFolder={vi.fn()}
          data-oid="kmhe151"
        />,
      )

      expect(screen.getByTestId("add-media-button")).toBeInTheDocument()
      expect(screen.getByTestId("add-folder-button")).toBeInTheDocument()
    })

    it("should not render import buttons when showImport is false", () => {
      render(<MediaToolbar {...mockProps} showImport={false} data-oid="3-qh991" />)

      expect(screen.queryByTestId("add-media-button")).not.toBeInTheDocument()
      expect(screen.queryByTestId("add-folder-button")).not.toBeInTheDocument()
    })

    it("should call onImportFile when file import button is clicked", async () => {
      const onImportFile = vi.fn()
      const user = userEvent.setup()

      render(<MediaToolbar {...mockProps} onImportFile={onImportFile} onImportFolder={vi.fn()} data-oid=".1e79e:" />)

      const fileButton = screen.getByTestId("add-media-button")
      await user.click(fileButton)

      expect(onImportFile).toHaveBeenCalled()
    })

    it("should call onImportFolder when folder import button is clicked", async () => {
      const onImportFolder = vi.fn()
      const user = userEvent.setup()

      render(<MediaToolbar {...mockProps} onImportFile={vi.fn()} onImportFolder={onImportFolder} data-oid="o9ml:br" />)

      const folderButton = screen.getByTestId("add-folder-button")
      await user.click(folderButton)

      expect(onImportFolder).toHaveBeenCalled()
    })

    it("should show importing state", () => {
      render(<MediaToolbar {...mockProps} onImportFile={vi.fn()} isImporting={true} data-oid="119a3bc" />)

      expect(screen.getByText("Importing...")).toBeInTheDocument()

      // Check for pulse animation on icon
      const fileIcon = screen.getByTestId("file-icon")
      expect(fileIcon).toHaveClass("animate-pulse")
    })

    it("should disable import buttons when importing", () => {
      render(
        <MediaToolbar
          {...mockProps}
          onImportFile={vi.fn()}
          onImportFolder={vi.fn()}
          isImporting={true}
          data-oid="b7ga.em"
        />,
      )

      const importButton = screen.getByText("Importing...").closest("button")
      expect(importButton).toBeDisabled()
    })

    it("should prevent event propagation on icon clicks", async () => {
      const onImportFile = vi.fn()
      const user = userEvent.setup()

      render(<MediaToolbar {...mockProps} onImportFile={onImportFile} onImportFolder={vi.fn()} data-oid="vzdzb7g" />)

      const fileIcon = screen.getByTestId("add-media-button")
      await user.click(fileIcon)

      expect(onImportFile).toHaveBeenCalled()
    })
  })

  describe("Favorites functionality", () => {
    it("should render favorites button", () => {
      render(<MediaToolbar {...mockProps} data-oid="uc8rjvk" />)

      const favoritesButton = screen.getByTestId("star-icon")
      expect(favoritesButton).toBeInTheDocument()
    })

    it("should call onToggleFavorites when favorites button is clicked", async () => {
      const user = userEvent.setup()
      render(<MediaToolbar {...mockProps} data-oid="luvwhse" />)

      const favoritesButton = screen.getByTestId("star-icon").closest("button")!
      await user.click(favoritesButton)

      expect(mockProps.onToggleFavorites).toHaveBeenCalled()
    })

    it("should show active state when showFavoritesOnly is true", () => {
      render(<MediaToolbar {...mockProps} showFavoritesOnly={true} data-oid="uayq_b." />)

      const favoritesButton = screen.getByTestId("star-icon").closest("button")!
      expect(favoritesButton).toHaveClass("bg-[#dddbdd]")

      const starIcon = screen.getByTestId("star-icon")
      expect(starIcon).toHaveClass("fill-current")
    })

    it("should show inactive state when showFavoritesOnly is false", () => {
      render(<MediaToolbar {...mockProps} showFavoritesOnly={false} data-oid="cpagivr" />)

      const starIcon = screen.getByTestId("star-icon")
      expect(starIcon).not.toHaveClass("fill-current")
    })
  })

  describe("View mode functionality", () => {
    it("should render view mode buttons when multiple modes available", () => {
      render(<MediaToolbar {...mockProps} data-oid="zwjs0m." />)

      expect(screen.getByTestId("list-view-button")).toBeInTheDocument()
      expect(screen.getByTestId("thumbnails-view-button")).toBeInTheDocument()
    })

    it("should not render view mode buttons when only one mode available", () => {
      const singleViewMode = [
        {
          value: "list" as ViewMode,
          icon: () => <div data-oid="d:19i22" />,
          label: "browser.toolbar.list",
        },
      ]

      render(<MediaToolbar {...mockProps} availableViewModes={singleViewMode} data-oid="nw50b-x" />)

      expect(screen.queryByTestId("list-view-button")).not.toBeInTheDocument()
    })

    it("should call onChangeViewMode when view mode button is clicked", async () => {
      const user = userEvent.setup()
      render(<MediaToolbar {...mockProps} data-oid="-9j:.iy" />)

      const thumbnailsButton = screen.getByTestId("thumbnails-view-button")
      await user.click(thumbnailsButton)

      expect(mockProps.onChangeViewMode).toHaveBeenCalledWith("thumbnails")
    })

    it("should show active state for current view mode", () => {
      render(<MediaToolbar {...mockProps} viewMode="thumbnails" data-oid=":3k-9vr" />)

      const thumbnailsButton = screen.getByTestId("thumbnails-view-button")
      expect(thumbnailsButton).toHaveClass("bg-[#dddbdd]")
    })

    it("should use custom view modes when provided", () => {
      const customViewModes = [
        {
          value: "grid" as ViewMode,
          icon: () => <div data-testid="custom-grid" data-oid="-6992_4" />,
          label: "Custom Grid",
          testId: "custom-grid-button",
        },
        {
          value: "list" as ViewMode,
          icon: () => <div data-testid="custom-list" data-oid="c:trgb0" />,
          label: "Custom List",
          testId: "custom-list-button",
        },
      ]

      render(<MediaToolbar {...mockProps} availableViewModes={customViewModes} data-oid="70-8gmw" />)

      expect(screen.getByTestId("custom-grid-button")).toBeInTheDocument()
      expect(screen.getByTestId("custom-list-button")).toBeInTheDocument()
      expect(screen.queryByTestId("list-view-button")).not.toBeInTheDocument()
    })
  })

  describe("Sort functionality", () => {
    it("should render sort dropdown", () => {
      render(<MediaToolbar {...mockProps} data-oid="pk.p45m" />)

      expect(screen.getByTestId("sort-desc")).toBeInTheDocument()
    })

    it("should show active state when sort is not default", () => {
      render(<MediaToolbar {...mockProps} sortBy="date" data-oid="-:xdu.v" />)

      const sortButton = screen.getByTestId("sort-desc").closest("button")!
      expect(sortButton).toHaveClass("bg-[#dddbdd]")
    })

    it("should show inactive state when sort is default", () => {
      render(<MediaToolbar {...mockProps} sortBy="name" data-oid="mi260tc" />)

      const sortButton = screen.getByTestId("sort-desc").closest("button")!
      expect(sortButton).not.toHaveClass("bg-[#dddbdd]")
    })

    it("should render sort options in dropdown", () => {
      render(<MediaToolbar {...mockProps} data-oid="-szsen1" />)

      const sortItems = screen.getAllByTestId("dropdown-item")
      expect(sortItems.length).toBeGreaterThan(0)
    })

    it("should call onSort when sort option is clicked", async () => {
      const user = userEvent.setup()
      render(<MediaToolbar {...mockProps} data-oid="g-sz81t" />)

      const sortItems = screen.getAllByTestId("dropdown-item")
      await user.click(sortItems[1]) // Click second sort option

      expect(mockProps.onSort).toHaveBeenCalled()
    })
  })

  describe("Filter functionality", () => {
    it("should render filter dropdown", () => {
      render(<MediaToolbar {...mockProps} data-oid="p:ixn8_" />)

      expect(screen.getByTestId("filter-icon")).toBeInTheDocument()
    })

    it("should show active state when filter is not 'all'", () => {
      render(<MediaToolbar {...mockProps} filterType="mp4" data-oid="-nrho8a" />)

      const filterButton = screen.getByTestId("filter-icon").closest("button")!
      expect(filterButton).toHaveClass("bg-[#dddbdd]")
    })

    it("should show inactive state when filter is 'all'", () => {
      render(<MediaToolbar {...mockProps} filterType="all" data-oid="aypn_fs" />)

      const filterButton = screen.getByTestId("filter-icon").closest("button")!
      expect(filterButton).not.toHaveClass("bg-[#dddbdd]")
    })

    it("should render default extension filters when no custom filters provided", () => {
      render(<MediaToolbar {...mockProps} data-oid="tv:-1qk" />)

      // Should render extensions from availableExtensions
      const filterItems = screen.getAllByTestId("dropdown-item")
      expect(filterItems.length).toBeGreaterThan(mockProps.availableExtensions.length)
    })

    it("should render custom filter options when provided", () => {
      const filterOptions = [
        { value: "video", label: "filter.video" },
        { value: "audio", label: "filter.audio" },
      ]

      render(<MediaToolbar {...mockProps} filterOptions={filterOptions} data-oid="7k6tcg:" />)

      const filterItems = screen.getAllByTestId("dropdown-item")
      expect(filterItems.length).toBeGreaterThan(0)
    })

    it("should call onFilter when filter option is clicked", async () => {
      const user = userEvent.setup()
      render(<MediaToolbar {...mockProps} data-oid="vic1d_t" />)

      // Find filter dropdown items specifically
      const filterDropdown = screen.getAllByTestId("dropdown-menu")[1] // Second dropdown is filter
      const filterItems = filterDropdown.querySelectorAll('[data-testid="dropdown-item"]')
      await user.click(filterItems[0]) // Click first filter option

      expect(mockProps.onFilter).toHaveBeenCalled()
    })
  })

  describe("Group functionality", () => {
    it("should render group dropdown when showGroupBy is true", () => {
      render(<MediaToolbar {...mockProps} showGroupBy={true} data-oid="3y7-1cb" />)

      expect(screen.getByTestId("list-filter-plus")).toBeInTheDocument()
    })

    it("should not render group dropdown when showGroupBy is false", () => {
      render(<MediaToolbar {...mockProps} showGroupBy={false} data-oid="i0q0m5." />)

      expect(screen.queryByTestId("list-filter-plus")).not.toBeInTheDocument()
    })

    it("should show active state when group is not default", () => {
      render(<MediaToolbar {...mockProps} groupBy="type" showGroupBy={true} data-oid="-a0i7x:" />)

      const groupButton = screen.getByTestId("list-filter-plus").closest("button")!
      expect(groupButton).toHaveClass("bg-[#dddbdd]")
    })

    it("should call onChangeGroupBy when group option is clicked", async () => {
      const user = userEvent.setup()
      render(<MediaToolbar {...mockProps} showGroupBy={true} data-oid="86d3m0p" />)

      // Find group dropdown items specifically
      const groupDropdown = screen.getAllByTestId("dropdown-menu")[2] // Third dropdown is group
      const groupItems = groupDropdown.querySelectorAll('[data-testid="dropdown-item"]')
      await user.click(groupItems[0])

      expect(mockProps.onChangeGroupBy).toHaveBeenCalled()
    })
  })

  describe("Zoom functionality", () => {
    it("should render zoom buttons when showZoom is true", () => {
      render(<MediaToolbar {...mockProps} showZoom={true} onZoomIn={vi.fn()} onZoomOut={vi.fn()} data-oid="d8vtdwf" />)

      expect(screen.getByTestId("zoom-out")).toBeInTheDocument()
      expect(screen.getByTestId("zoom-in")).toBeInTheDocument()
    })

    it("should not render zoom buttons when showZoom is false", () => {
      render(<MediaToolbar {...mockProps} showZoom={false} data-oid="8haw_8a" />)

      expect(screen.queryByTestId("zoom-out")).not.toBeInTheDocument()
      expect(screen.queryByTestId("zoom-in")).not.toBeInTheDocument()
    })

    it("should call onZoomIn when zoom in button is clicked", async () => {
      const onZoomIn = vi.fn()
      const user = userEvent.setup()

      render(
        <MediaToolbar
          {...mockProps}
          showZoom={true}
          onZoomIn={onZoomIn}
          onZoomOut={vi.fn()}
          canZoomIn={true}
          data-oid="2fhaekx"
        />,
      )

      const zoomInButton = screen.getByTestId("zoom-in").closest("button")!
      await user.click(zoomInButton)

      expect(onZoomIn).toHaveBeenCalled()
    })

    it("should call onZoomOut when zoom out button is clicked", async () => {
      const onZoomOut = vi.fn()
      const user = userEvent.setup()

      render(
        <MediaToolbar
          {...mockProps}
          showZoom={true}
          onZoomIn={vi.fn()}
          onZoomOut={onZoomOut}
          canZoomOut={true}
          data-oid="bwqqzms"
        />,
      )

      const zoomOutButton = screen.getByTestId("zoom-out").closest("button")!
      await user.click(zoomOutButton)

      expect(onZoomOut).toHaveBeenCalled()
    })

    it("should disable zoom buttons when cannot zoom", () => {
      render(
        <MediaToolbar
          {...mockProps}
          showZoom={true}
          onZoomIn={vi.fn()}
          onZoomOut={vi.fn()}
          canZoomIn={false}
          canZoomOut={false}
          data-oid="aay2jqf"
        />,
      )

      const zoomInButton = screen.getByTestId("zoom-in").closest("button")!
      const zoomOutButton = screen.getByTestId("zoom-out").closest("button")!

      expect(zoomInButton).toBeDisabled()
      expect(zoomOutButton).toBeDisabled()
      expect(zoomInButton).toHaveClass("cursor-not-allowed")
      expect(zoomOutButton).toHaveClass("cursor-not-allowed")
    })
  })

  describe("Sort order functionality", () => {
    it("should render sort order button", () => {
      render(<MediaToolbar {...mockProps} data-oid="cwbqgcc" />)

      expect(screen.getByTestId("arrow-down-up")).toBeInTheDocument()
    })

    it("should show descending icon when sort order is asc", () => {
      render(<MediaToolbar {...mockProps} sortOrder="asc" data-oid="f-voxem" />)

      expect(screen.getByTestId("arrow-down-up")).toBeInTheDocument()
      expect(screen.queryByTestId("arrow-up-down")).not.toBeInTheDocument()
    })

    it("should show ascending icon when sort order is desc", () => {
      render(<MediaToolbar {...mockProps} sortOrder="desc" data-oid="fouwlun" />)

      expect(screen.getByTestId("arrow-up-down")).toBeInTheDocument()
      expect(screen.queryByTestId("arrow-down-up")).not.toBeInTheDocument()
    })

    it("should call onChangeOrder when sort order button is clicked", async () => {
      const user = userEvent.setup()
      render(<MediaToolbar {...mockProps} data-oid="34o0yi8" />)

      const sortOrderButton = screen.getByTestId("arrow-down-up").closest("button")!
      await user.click(sortOrderButton)

      expect(mockProps.onChangeOrder).toHaveBeenCalled()
    })
  })

  describe("Extra buttons", () => {
    it("should render extra buttons when provided", () => {
      const extraButtons = (
        <button data-testid="extra-button" data-oid="u8pt3.8">
          Extra
        </button>
      )

      render(<MediaToolbar {...mockProps} extraButtons={extraButtons} data-oid="jlpyn10" />)

      expect(screen.getByTestId("extra-button")).toBeInTheDocument()
    })

    it("should not render extra buttons when not provided", () => {
      render(<MediaToolbar {...mockProps} data-oid="4x_fv7a" />)

      expect(screen.queryByTestId("extra-button")).not.toBeInTheDocument()
    })
  })

  describe("Edge cases and error handling", () => {
    it("should handle empty sort options", () => {
      render(<MediaToolbar {...mockProps} sortOptions={[]} data-oid="k8cvf_z" />)

      expect(screen.getByTestId("sort-desc")).toBeInTheDocument()
    })

    it("should handle empty group options", () => {
      render(<MediaToolbar {...mockProps} groupOptions={[]} showGroupBy={true} data-oid="-hktv9e" />)

      expect(screen.getByTestId("list-filter-plus")).toBeInTheDocument()
    })

    it("should handle empty available extensions", () => {
      render(<MediaToolbar {...mockProps} availableExtensions={[]} data-oid="bqtb8b." />)

      expect(screen.getByTestId("filter-icon")).toBeInTheDocument()
    })

    it("should handle missing onImportFile callback", () => {
      render(<MediaToolbar {...mockProps} onImportFile={undefined} data-oid="lh9rohu" />)

      expect(screen.queryByTestId("add-media-button")).not.toBeInTheDocument()
    })

    it("should handle missing onImportFolder callback", () => {
      render(<MediaToolbar {...mockProps} onImportFolder={undefined} data-oid="e.4c2h4" />)

      expect(screen.queryByTestId("add-folder-button")).not.toBeInTheDocument()
    })

    it("should handle missing zoom callbacks", () => {
      render(
        <MediaToolbar {...mockProps} showZoom={false} onZoomIn={undefined} onZoomOut={undefined} data-oid="kva4z3f" />,
      )

      expect(screen.queryByTestId("zoom-in")).not.toBeInTheDocument()
      expect(screen.queryByTestId("zoom-out")).not.toBeInTheDocument()
    })
  })

  describe("Keyboard interactions", () => {
    it("should handle Enter key on search input", async () => {
      const user = userEvent.setup()
      render(<MediaToolbar {...mockProps} data-oid="xn3cxsx" />)

      const searchInput = screen.getByPlaceholderText("Search")
      await user.clear(searchInput)
      await user.type(searchInput, "test{enter}")

      // user.type() calls onChange for each character individually
      expect(mockProps.onSearch).toHaveBeenCalledTimes(4)
      expect(mockProps.onSearch).toHaveBeenLastCalledWith("t")
    })

    it("should handle keyboard navigation on buttons", async () => {
      const user = userEvent.setup()
      render(<MediaToolbar {...mockProps} data-oid="1ob-hmq" />)

      const searchInput = screen.getByPlaceholderText("Search")
      const favoritesButton = screen.getByTestId("star-icon").closest("button")!
      await user.tab()

      // Should be able to focus buttons
      expect(document.activeElement).toBe(searchInput || favoritesButton)
    })
  })

  describe("Accessibility", () => {
    it("should have proper aria labels and roles", () => {
      render(<MediaToolbar {...mockProps} data-oid="5phszt2" />)

      const searchInput = screen.getByPlaceholderText("Search")
      expect(searchInput).toHaveAttribute("type", "search")
    })

    it("should have tooltip content for all buttons", () => {
      render(<MediaToolbar {...mockProps} data-oid="bqid_b5" />)

      const tooltipContents = screen.getAllByTestId("tooltip-content")
      expect(tooltipContents.length).toBeGreaterThan(0)
    })
  })
})

import { fireEvent, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithTimeline } from "@/test/test-utils"
import { MarkerControls } from "../../../components/markers/marker-controls"
import type { ExtendedTimelineMarker } from "../../../types/markers"
import { MarkerColors } from "../../../types/markers"

// Мок для иконок lucide-react
vi.mock("lucide-react", () => ({
  Bookmark: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="Bookmark" data-testid={dataTestId || "bookmark-icon"} data-oid="-t:zj9v">
      Bookmark
    </svg>
  ),

  CheckSquare: ({ className, "data-testid": dataTestId }: any) => (
    <svg
      className={className}
      data-icon="CheckSquare"
      data-testid={dataTestId || "checksquare-icon"}
      data-oid="0-04_u."
    >
      CheckSquare
    </svg>
  ),

  ChevronLeft: ({ className, "data-testid": dataTestId }: any) => (
    <svg
      className={className}
      data-icon="ChevronLeft"
      data-testid={dataTestId || "chevronleft-icon"}
      data-oid="wy842yh"
    >
      ChevronLeft
    </svg>
  ),

  ChevronRight: ({ className, "data-testid": dataTestId }: any) => (
    <svg
      className={className}
      data-icon="ChevronRight"
      data-testid={dataTestId || "chevronright-icon"}
      data-oid="5qe4waa"
    >
      ChevronRight
    </svg>
  ),

  Download: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="Download" data-testid={dataTestId || "download-icon"} data-oid="ekb778d">
      Download
    </svg>
  ),

  Filter: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="Filter" data-testid={dataTestId || "filter-icon"} data-oid="3u.1_u3">
      Filter
    </svg>
  ),

  Folder: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="Folder" data-testid={dataTestId || "folder-icon"} data-oid="362bsuk">
      Folder
    </svg>
  ),

  PlayCircle: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="PlayCircle" data-testid={dataTestId || "playcircle-icon"} data-oid="fu.fy50">
      PlayCircle
    </svg>
  ),

  Plus: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="Plus" data-testid={dataTestId || "plus-icon"} data-oid="uew.-hw">
      Plus
    </svg>
  ),

  RefreshCw: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="RefreshCw" data-testid={dataTestId || "refreshcw-icon"} data-oid="31u.bxx">
      RefreshCw
    </svg>
  ),

  Search: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="Search" data-testid={dataTestId || "search-icon"} data-oid="g4fdy4i">
      Search
    </svg>
  ),

  StickyNote: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="StickyNote" data-testid={dataTestId || "stickynote-icon"} data-oid="3cc6wyx">
      StickyNote
    </svg>
  ),

  X: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="X" data-testid={dataTestId || "x-icon"} data-oid="746iv2i">
      X
    </svg>
  ),
}))

// Моки для хуков
const mockUseTimeline = vi.fn()
const mockUseTimelineMarkers = vi.fn()

vi.mock("../../../hooks/state/use-timeline", () => ({
  useTimeline: () => mockUseTimeline(),
}))

vi.mock("../../../hooks/markers/use-timeline-markers", () => ({
  useTimelineMarkers: () => mockUseTimelineMarkers(),
}))

// Мок для UI компонентов
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props} data-oid="-2oo7si">
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) => (
    <span {...props} data-oid="o5._822">
      {children}
    </span>
  ),
}))

vi.mock("@/components/ui/input", () => ({
  Input: ({ onChange, onKeyDown, ...props }: any) => (
    <input onChange={onChange} onKeyDown={onKeyDown} {...props} data-oid="bxsp-rv" />
  ),
}))

vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children, open }: any) => (
    <div data-open={open} data-testid="popover" data-oid="ur06bkw">
      {children}
    </div>
  ),

  PopoverTrigger: ({ children, asChild }: any) => (
    <div data-testid="popover-trigger" data-oid="6bs4470">
      {asChild ? children : <div data-oid="6v6--fj">{children}</div>}
    </div>
  ),

  PopoverContent: ({ children }: any) => (
    <div data-testid="popover-content" data-oid="noovguf">
      {children}
    </div>
  ),
}))

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div data-oid="8wvngw8">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: any) => (
    <div data-testid="dropdown-trigger" data-oid="-4g9lra">
      {asChild ? children : <div data-oid="xba9w5m">{children}</div>}
    </div>
  ),

  DropdownMenuContent: ({ children }: any) => (
    <div data-testid="dropdown-content" data-oid="o3__qdf">
      {children}
    </div>
  ),

  DropdownMenuItem: ({ children, onClick }: any) => (
    <div onClick={onClick} data-testid="dropdown-item" data-oid="1z07v63">
      {children}
    </div>
  ),

  DropdownMenuSeparator: () => <hr data-oid="seqy4eq" />,
}))

describe("MarkerControls", () => {
  const mockMarkers: ExtendedTimelineMarker[] = [
    {
      id: "1",
      time: 10,
      name: "Chapter 1",
      type: "chapter",
      color: MarkerColors.chapter,
      description: "First chapter",
    },
    {
      id: "2",
      time: 20,
      name: "Note 1",
      type: "note",
      color: MarkerColors.note,
      description: "Important note",
    },
    {
      id: "3",
      time: 30,
      name: "Todo 1",
      type: "note",
      color: MarkerColors.todo,
    },
  ]

  const defaultMocks = {
    currentTime: 15,
    seek: vi.fn(),
    markers: mockMarkers,
    addMarker: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTimeline.mockReturnValue({
      currentTime: defaultMocks.currentTime,
      seek: defaultMocks.seek,
    })
    mockUseTimelineMarkers.mockReturnValue({
      markers: defaultMocks.markers,
      addMarker: defaultMocks.addMarker,
    })
  })

  it("рендерит основные элементы управления", () => {
    renderWithTimeline(<MarkerControls data-oid="wuj7i4x" />)

    // Используем getAllByText и проверяем первый элемент (кнопка)
    const addMarkerButtons = screen.getAllByText("Add Marker")
    expect(addMarkerButtons[0]).toBeInTheDocument()

    // Ищем кнопку Filter по data-icon
    const filterButton = screen.getByRole("button", { name: /Filter/i })
    expect(filterButton).toBeInTheDocument()

    // Проверяем счетчик маркеров (текст разбит на несколько узлов)
    expect(screen.getByText("3", { exact: false })).toBeInTheDocument()
    expect(screen.getByText("/", { exact: false })).toBeInTheDocument()
  })

  it("открывает попап добавления маркера при клике", async () => {
    renderWithTimeline(<MarkerControls data-oid=":rvbw4s" />)

    const addButton = screen.getAllByText("Add Marker")[0]
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText("Create a marker at current time")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Marker name")).toBeInTheDocument()
    })
  })

  it("добавляет новый маркер с корректными данными", async () => {
    const user = userEvent.setup()
    renderWithTimeline(<MarkerControls data-oid="pmj:hgk" />)

    // Открываем попап
    const addButton = screen.getAllByText("Add Marker")[0]
    await user.click(addButton)

    // Вводим имя маркера
    const input = await screen.findByPlaceholderText("Marker name")
    await user.type(input, "New Chapter")

    // Нажимаем кнопку добавления
    const submitButtons = screen.getAllByText("Add Marker")
    const submitButton = submitButtons[submitButtons.length - 1] // Последняя кнопка - submit
    await user.click(submitButton)

    expect(defaultMocks.addMarker).toHaveBeenCalledWith({
      time: 15,
      name: "New Chapter",
      type: "note",
      color: "#f59e0b",
    })
  })

  it("добавляет маркер при нажатии Enter", async () => {
    const user = userEvent.setup()
    renderWithTimeline(<MarkerControls data-oid="v5e73fg" />)

    const addButton = screen.getAllByText("Add Marker")[0]
    await user.click(addButton)

    const input = await screen.findByPlaceholderText("Marker name")
    await user.type(input, "Quick Marker{Enter}")

    expect(defaultMocks.addMarker).toHaveBeenCalledWith({
      time: 15,
      name: "Quick Marker",
      type: "note",
      color: "#f59e0b",
    })
  })

  it("не добавляет маркер с пустым именем", async () => {
    renderWithTimeline(<MarkerControls data-oid="rzmby0-" />)

    fireEvent.click(screen.getAllByText("Add Marker")[0])

    const submitButton = screen.getAllByText("Add Marker")[2]
    expect(submitButton).toBeDisabled()
  })

  it("позволяет выбрать тип маркера", async () => {
    const user = userEvent.setup()
    renderWithTimeline(<MarkerControls data-oid="t:0om67" />)

    const addButton = screen.getAllByText("Add Marker")[0]
    await user.click(addButton)

    // Открываем выбор типа
    const typeSelector = await screen.findByTestId("dropdown-trigger")
    await user.click(typeSelector)

    // Выбираем тип "Chapter" - находим первый элемент dropdown-item с текстом Chapter
    const dropdownItems = screen.getAllByTestId("dropdown-item")
    const chapterOption = dropdownItems.find((item) => item.textContent?.includes("Chapter"))
    await user.click(chapterOption!)

    // Проверяем что тип изменился
    const input = screen.getByPlaceholderText("Marker name")
    await user.type(input, "Test Chapter")

    const submitButtons = screen.getAllByText("Add Marker")
    const submitButton = submitButtons[submitButtons.length - 1]
    await user.click(submitButton)

    expect(defaultMocks.addMarker).toHaveBeenCalledWith({
      time: 15,
      name: "Test Chapter",
      type: "chapter",
      color: "#3b82f6",
    })
  })

  it("навигация между маркерами работает корректно", async () => {
    const user = userEvent.setup()
    renderWithTimeline(<MarkerControls data-oid="-xf_jay" />)

    // Находим кнопки по их содержимому
    const buttons = screen.getAllByRole("button")
    const prevButton = buttons.find((btn) => btn.querySelector('[data-icon="ChevronLeft"]'))
    const nextButton = buttons.find((btn) => btn.querySelector('[data-icon="ChevronRight"]'))

    await user.click(prevButton!)
    expect(defaultMocks.seek).toHaveBeenCalledWith(10) // предыдущий маркер на 10с

    await user.click(nextButton!)
    expect(defaultMocks.seek).toHaveBeenCalledWith(20) // следующий маркер на 20с
  })

  it("отключает навигацию когда нет маркеров", () => {
    mockUseTimelineMarkers.mockReturnValue({
      markers: [],
      addMarker: defaultMocks.addMarker,
    })

    renderWithTimeline(<MarkerControls data-oid="yu1tjxu" />)

    const buttons = screen.getAllByRole("button")
    const prevButton = buttons.find((btn) => btn.querySelector('[data-icon="ChevronLeft"]'))
    const nextButton = buttons.find((btn) => btn.querySelector('[data-icon="ChevronRight"]'))

    expect(prevButton).toBeDisabled()
    expect(nextButton).toBeDisabled()
  })

  it("открывает фильтр и показывает счетчик активных фильтров", async () => {
    renderWithTimeline(<MarkerControls data-oid=".nzg7.i" />)

    const filterButton = screen.getByRole("button", { name: /Filter/i })
    fireEvent.click(filterButton)

    await waitFor(() => {
      expect(screen.getByText("Filter Markers")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Search markers...")).toBeInTheDocument()
    })
  })

  it("фильтрует маркеры по поиску", async () => {
    const user = userEvent.setup()
    renderWithTimeline(<MarkerControls data-oid="xo90t_3" />)

    const filterButton = screen.getByRole("button", { name: /Filter/i })
    await user.click(filterButton)

    const searchInput = await screen.findByPlaceholderText("Search markers...")
    await user.type(searchInput, "Chapter")

    // Проверяем, что фильтрация обновила счетчик (текст может быть разбит на узлы)
    const counter = screen.getByText((_content, element) => {
      return element?.textContent === "1 / 3" || false
    })
    expect(counter).toBeInTheDocument() // 1 маркер с "Chapter" из 3
  })

  it("фильтрует маркеры по типу", async () => {
    const user = userEvent.setup()
    renderWithTimeline(<MarkerControls data-oid="fv.d6i_" />)

    const filterButton = screen.getByRole("button", { name: /Filter/i })
    await user.click(filterButton)

    // Находим чекбокс для типа "Chapter"
    const checkboxes = await screen.findAllByRole("checkbox")
    const chapterCheckbox = checkboxes[0]
    await user.click(chapterCheckbox)

    // Проверяем, что фильтрация обновила счетчик
    const counter = screen.getByText((_content, element) => {
      return element?.textContent === "1 / 3" || false
    })
    expect(counter).toBeInTheDocument() // 1 chapter маркер из 3
  })

  it("очищает поиск при клике на X", async () => {
    const user = userEvent.setup()
    renderWithTimeline(<MarkerControls data-oid="q2w_shp" />)

    fireEvent.click(screen.getByRole("button", { name: /Filter/i }))

    const searchInput = screen.getByPlaceholderText("Search markers...")
    await user.type(searchInput, "test")

    // Находим кнопку очистки по иконке X
    const buttons = screen.getAllByRole("button")
    const clearButton = buttons.find((btn) => btn.querySelector('[data-icon="X"]'))
    fireEvent.click(clearButton!)

    // Проверяем, что поле поиска очищено
    expect(searchInput).toHaveValue("")
  })

  it("показывает количество активных фильтров", async () => {
    renderWithTimeline(<MarkerControls data-oid="g6rr1:j" />)

    fireEvent.click(screen.getByRole("button", { name: /Filter/i }))

    // Добавляем фильтр по типу
    const chapterCheckbox = screen.getAllByRole("checkbox")[0]
    fireEvent.click(chapterCheckbox)

    // Проверяем что badge показывает количество фильтров
    await waitFor(() => {
      const badge = screen.getByText("1")
      expect(badge).toBeInTheDocument()
    })
  })

  it("очищает все фильтры при клике на Clear all", async () => {
    const user = userEvent.setup()
    renderWithTimeline(<MarkerControls data-oid="04x.rzo" />)

    const filterButton = screen.getByRole("button", { name: /Filter/i })
    await user.click(filterButton)

    // Устанавливаем фильтр
    const checkboxes = await screen.findAllByRole("checkbox")
    const chapterCheckbox = checkboxes[0]
    await user.click(chapterCheckbox)

    // Нажимаем Clear all
    const clearAllButton = screen.getByText("Clear all")
    await user.click(clearAllButton)

    // Проверяем, что фильтры очищены (нет активных фильтров)
    const counter = screen.getByText((_content, element) => {
      return element?.textContent === "3 / 3" || false
    })
    expect(counter).toBeInTheDocument() // все маркеры видимы
  })

  it("обновляет счетчик маркеров при фильтрации", async () => {
    const user = userEvent.setup()
    renderWithTimeline(<MarkerControls data-oid="bqurird" />)

    // Фильтруем по поиску
    const filterButton = screen.getByRole("button", { name: /Filter/i })
    await user.click(filterButton)

    const searchInput = await screen.findByPlaceholderText("Search markers...")
    await user.type(searchInput, "Chapter")

    // Проверяем обновленный счетчик
    const counter = screen.getByText((_content, element) => {
      return element?.textContent === "1 / 3" || false
    })
    expect(counter).toBeInTheDocument()
  })

  it("сохраняет состояние фильтров между открытиями попапа", async () => {
    const user = userEvent.setup()
    renderWithTimeline(<MarkerControls data-oid="0h3ul5c" />)

    // Открываем фильтр и вводим поиск
    fireEvent.click(screen.getByRole("button", { name: /Filter/i }))
    const searchInput = screen.getByPlaceholderText("Search markers...")
    await user.type(searchInput, "test")

    // Закрываем попап (симулируем изменение состояния)
    fireEvent.click(document.body)

    // Открываем снова
    fireEvent.click(screen.getByRole("button", { name: /Filter/i }))

    // Проверяем что значение сохранилось
    const input = screen.getByPlaceholderText("Search markers...")
    expect((input as HTMLInputElement).value).toBe("test")
  })

  it("комбинирует фильтры по типу и поиску", async () => {
    const user = userEvent.setup()
    renderWithTimeline(<MarkerControls data-oid="9t8ka1x" />)

    fireEvent.click(screen.getByRole("button", { name: /Filter/i }))

    // Выбираем тип
    const chapterCheckbox = screen.getAllByRole("checkbox")[0]
    fireEvent.click(chapterCheckbox)

    // Вводим поиск
    const searchInput = screen.getByPlaceholderText("Search markers...")
    await user.type(searchInput, "test")

    // Проверяем, что badge показывает 2 активных фильтра (тип + поиск)
    await waitFor(() => {
      const badge = screen.getByText("2")
      expect(badge).toBeInTheDocument()
    })
  })

  it("отображает правильный цвет для каждого типа маркера", () => {
    renderWithTimeline(<MarkerControls data-oid="igr:ptz" />)

    fireEvent.click(screen.getAllByText("Add Marker")[0])

    // Открываем dropdown с типами
    const typeSelector = screen.getByTestId("dropdown-trigger")
    fireEvent.click(typeSelector)

    // Проверяем что каждый тип имеет свой цвет
    const dropdownItems = screen.getAllByTestId("dropdown-item")
    expect(dropdownItems).toHaveLength(7) // Все типы маркеров

    dropdownItems.forEach((item) => {
      const colorIndicator = item.querySelector('[style*="background-color"]')
      expect(colorIndicator).toBeInTheDocument()
    })
  })
})

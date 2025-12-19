/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { EditMode } from "../../types/edit-modes"
import { EDIT_MODE_CONFIGS } from "../../types/edit-modes"
import { EditModeButtonGroup, EditModeSelector } from "../edit-mode-selector"

// Мокаем хук
const mockSetEditMode = vi.fn()
const mockEditMode: EditMode = "select"

vi.mock("../../hooks/editing/use-edit-mode", () => ({
  useEditModeContext: () => ({
    editMode: mockEditMode,
    setEditMode: mockSetEditMode,
  }),
}))

describe("EditModeSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("рендерит все режимы редактирования", () => {
    render(<EditModeSelector data-oid="m636o6f" />)

    Object.values(EDIT_MODE_CONFIGS).forEach((config) => {
      expect(screen.getByRole("button", { name: config.name })).toBeInTheDocument()
    })
  })

  it("показывает активный режим", () => {
    render(<EditModeSelector data-oid="svg8lae" />)

    const selectButton = screen.getByRole("button", {
      name: EDIT_MODE_CONFIGS.select.name,
    })
    expect(selectButton).toHaveAttribute("aria-pressed", "true")
  })

  it("меняет режим при клике", async () => {
    const user = userEvent.setup()
    render(<EditModeSelector data-oid="y2tovlq" />)

    const trimButton = screen.getByRole("button", {
      name: EDIT_MODE_CONFIGS.trim.name,
    })
    await user.click(trimButton)

    expect(mockSetEditMode).toHaveBeenCalledWith("trim")
  })

  it("показывает тултип с горячей клавишей", async () => {
    const user = userEvent.setup()
    render(<EditModeSelector data-oid="ke4fxz2" />)

    const selectButton = screen.getByRole("button", {
      name: EDIT_MODE_CONFIGS.select.name,
    })
    await user.hover(selectButton)

    // Ждем появления тултипа
    await waitFor(() => {
      // Используем getAllByText так как может быть несколько тултипов
      const tooltips = screen.getAllByText(EDIT_MODE_CONFIGS.select.description)
      expect(tooltips.length).toBeGreaterThan(0)
    })

    // Проверяем горячую клавишу
    await waitFor(() => {
      const hotkeys = screen.getAllByText(EDIT_MODE_CONFIGS.select.hotkey)
      expect(hotkeys.length).toBeGreaterThan(0)
    })
  })

  it("поддерживает разные размеры", () => {
    const { rerender } = render(<EditModeSelector size="sm" data-oid="1behelr" />)
    let button = screen.getAllByRole("button")[0]
    expect(button.className).toContain("h-8")
    expect(button.className).toContain("w-8")

    rerender(<EditModeSelector size="md" data-oid="zhr5sr2" />)
    button = screen.getAllByRole("button")[0]
    expect(button.className).toContain("h-10")
    expect(button.className).toContain("w-10")

    rerender(<EditModeSelector size="lg" data-oid="txh3r.s" />)
    button = screen.getAllByRole("button")[0]
    expect(button.className).toContain("h-12")
    expect(button.className).toContain("w-12")
  })

  it("поддерживает вертикальную ориентацию", () => {
    render(<EditModeSelector orientation="vertical" data-oid="c3ml1n9" />)

    const container = screen.getByRole("button", {
      name: EDIT_MODE_CONFIGS.select.name,
    }).parentElement
    expect(container).toHaveClass("flex-col")
  })

  it("применяет кастомные классы", () => {
    render(<EditModeSelector className="custom-class" data-oid="atf6n00" />)

    const container = screen.getByRole("button", {
      name: EDIT_MODE_CONFIGS.select.name,
    }).parentElement
    expect(container).toHaveClass("custom-class")
  })
})

describe("EditModeButtonGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("рендерит только первые 4 режима", () => {
    render(<EditModeButtonGroup data-oid="-_a_j2b" />)

    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(4)

    // Проверяем первые 4 режима
    const firstFourModes = Object.values(EDIT_MODE_CONFIGS).slice(0, 4)
    firstFourModes.forEach((config) => {
      expect(screen.getByTitle(`${config.name} (${config.hotkey})`)).toBeInTheDocument()
    })
  })

  it("показывает активный режим с другим вариантом", () => {
    render(<EditModeButtonGroup data-oid="--4k1:2" />)

    const selectButton = screen.getByTitle(`${EDIT_MODE_CONFIGS.select.name} (${EDIT_MODE_CONFIGS.select.hotkey})`)
    // Проверяем что кнопка содержит класс bg-secondary который указывает на активный вариант
    expect(selectButton.className).toContain("bg-secondary")
  })

  it("меняет режим при клике", async () => {
    const user = userEvent.setup()
    render(<EditModeButtonGroup data-oid="98iwdvv" />)

    const trimButton = screen.getByTitle(`${EDIT_MODE_CONFIGS.trim.name} (${EDIT_MODE_CONFIGS.trim.hotkey})`)
    await user.click(trimButton)

    expect(mockSetEditMode).toHaveBeenCalledWith("trim")
  })

  it("правильно применяет закругления к кнопкам", () => {
    render(<EditModeButtonGroup data-oid="bquc.s5" />)

    const buttons = screen.getAllByRole("button")
    expect(buttons[0]).toHaveClass("rounded-l-md")
    expect(buttons[3]).toHaveClass("rounded-r-md")

    // Средние кнопки не должны иметь закруглений
    expect(buttons[1]).toHaveClass("rounded-none")
    expect(buttons[2]).toHaveClass("rounded-none")
  })

  it("применяет кастомные классы", () => {
    render(<EditModeButtonGroup className="custom-class" data-oid="9a2p7x1" />)

    const container = screen.getByLabelText("Edit mode selection").parentElement
    expect(container).toHaveClass("custom-class")
  })
})

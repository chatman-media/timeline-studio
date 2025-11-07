import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { TemplateRenderer } from "../../components/template-renderer"
import { createCellConfig, createDividerConfig, type MediaTemplateConfig } from "../../lib/template-config"

describe("TemplateRenderer", () => {
  // Mock функция для рендеринга ячеек
  const mockRenderCell = vi.fn((index: number) => <div data-testid={`cell-${index}`}>Cell {index + 1}</div>)

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("renders vertical split template correctly", () => {
    const config: MediaTemplateConfig = {
      id: "test-vertical",
      split: "vertical",
      screens: 2,
      cells: [createCellConfig(0), createCellConfig(1)],
      dividers: createDividerConfig("default"),
    }

    render(<TemplateRenderer config={config} renderCell={mockRenderCell} />)

    expect(screen.getByTestId("cell-0")).toBeInTheDocument()
    expect(screen.getByTestId("cell-1")).toBeInTheDocument()
    expect(mockRenderCell).toHaveBeenCalledTimes(2)
  })

  it("renders horizontal split template correctly", () => {
    const config: MediaTemplateConfig = {
      id: "test-horizontal",
      split: "horizontal",
      screens: 3,
      cells: [createCellConfig(0), createCellConfig(1), createCellConfig(2)],
      dividers: createDividerConfig("default"),
    }

    render(<TemplateRenderer config={config} renderCell={mockRenderCell} />)

    expect(screen.getByTestId("cell-0")).toBeInTheDocument()
    expect(screen.getByTestId("cell-1")).toBeInTheDocument()
    expect(screen.getByTestId("cell-2")).toBeInTheDocument()
    expect(mockRenderCell).toHaveBeenCalledTimes(3)
  })

  it("renders grid template correctly", () => {
    const config: MediaTemplateConfig = {
      id: "test-grid",
      split: "grid",
      screens: 4,
      gridConfig: {
        columns: 2,
        rows: 2,
      },
      cells: Array.from({ length: 4 }, (_, i) => createCellConfig(i)),
      layout: {
        gap: "4px",
        backgroundColor: "#000",
      },
    }

    const { container } = render(<TemplateRenderer config={config} renderCell={mockRenderCell} />)

    expect(screen.getByTestId("cell-0")).toBeInTheDocument()
    expect(screen.getByTestId("cell-1")).toBeInTheDocument()
    expect(screen.getByTestId("cell-2")).toBeInTheDocument()
    expect(screen.getByTestId("cell-3")).toBeInTheDocument()
    expect(mockRenderCell).toHaveBeenCalledTimes(4)

    // Проверяем стили grid
    const gridContainer = container.firstChild as HTMLElement
    expect(gridContainer.style.display).toBe("grid")
    expect(gridContainer.style.gridTemplateColumns).toBe("repeat(2, 1fr)")
    expect(gridContainer.style.gridTemplateRows).toBe("repeat(2, 1fr)")
  })

  it("renders diagonal template correctly", () => {
    const config: MediaTemplateConfig = {
      id: "test-diagonal",
      split: "diagonal",
      screens: 2,
      splitPoints: [
        { x: 60, y: 0 },
        { x: 40, y: 100 },
      ],
      cells: [createCellConfig(0), createCellConfig(1)],
      dividers: createDividerConfig("default"),
    }

    const { container } = render(<TemplateRenderer config={config} renderCell={mockRenderCell} />)

    expect(screen.getByTestId("cell-0")).toBeInTheDocument()
    expect(screen.getByTestId("cell-1")).toBeInTheDocument()
    expect(mockRenderCell).toHaveBeenCalledTimes(2)

    // Проверяем наличие SVG с диагональной линией
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
    const line = svg?.querySelector("line")
    expect(line).toBeInTheDocument()
    expect(line?.getAttribute("x1")).toBe("60%")
    expect(line?.getAttribute("y1")).toBe("0%")
    expect(line?.getAttribute("x2")).toBe("40%")
    expect(line?.getAttribute("y2")).toBe("100%")
  })

  it("applies cell configuration styles correctly", () => {
    const config: MediaTemplateConfig = {
      id: "test-styled",
      split: "vertical",
      screens: 2,
      cells: [
        createCellConfig(0, {
          background: { color: "#ff0000" },
          border: { width: "2px", color: "#00ff00", style: "solid" },
          padding: "10px",
        }),
        createCellConfig(1, {
          background: { color: "#0000ff" },
          border: { width: "1px", color: "#ffff00", style: "dashed" },
          margin: "5px",
        }),
      ],
      dividers: createDividerConfig("default"),
    }

    const { container } = render(<TemplateRenderer config={config} renderCell={mockRenderCell} />)

    const cells = container.querySelectorAll(".relative")
    expect(cells[0]).toHaveStyle({
      backgroundColor: "#ff0000",
      borderWidth: "2px",
      borderColor: "#00ff00",
      borderStyle: "solid",
      padding: "10px",
    })
    expect(cells[1]).toHaveStyle({
      backgroundColor: "#0000ff",
      borderWidth: "1px",
      borderColor: "#ffff00",
      borderStyle: "dashed",
      margin: "5px",
    })
  })

  it("renders custom template with correct layout", () => {
    const config: MediaTemplateConfig = {
      id: "split-mixed-1-landscape",
      split: "custom",
      screens: 3,
      cells: [createCellConfig(0), createCellConfig(1), createCellConfig(2)],
      layout: {
        gap: "8px",
      },
    }

    const { container } = render(<TemplateRenderer config={config} renderCell={mockRenderCell} />)

    expect(screen.getByTestId("cell-0")).toBeInTheDocument()
    expect(screen.getByTestId("cell-1")).toBeInTheDocument()
    expect(screen.getByTestId("cell-2")).toBeInTheDocument()
    expect(mockRenderCell).toHaveBeenCalledTimes(3)

    // Проверяем flex стили для custom шаблона
    const customContainer = container.firstChild as HTMLElement
    expect(customContainer.style.display).toBe("flex")
    expect(customContainer.style.flexWrap).toBe("wrap")
    expect(customContainer.style.gap).toBe("8px")
  })

  it("handles missing divider configuration", () => {
    const config: MediaTemplateConfig = {
      id: "test-no-divider",
      split: "vertical",
      screens: 2,
      cells: [createCellConfig(0), createCellConfig(1)],
      dividers: { show: false }, // Явно отключаем разделители
    }

    const { container } = render(<TemplateRenderer config={config} renderCell={mockRenderCell} />)

    // Ищем элементы, которые могут быть разделителями
    // В вертикальном шаблоне разделители имеют height: 100%
    const potentialDividers = Array.from(container.querySelectorAll("div")).filter(
      (el) => el.style.height === "100%" && el.style.width && !el.textContent,
    )

    // Не должно быть разделителей
    expect(potentialDividers).toHaveLength(0)
  })

  it("renders cell titles when configured", () => {
    const config: MediaTemplateConfig = {
      id: "test-titles",
      split: "vertical",
      screens: 2,
      cells: [
        createCellConfig(0, {
          title: {
            show: true,
            text: "Camera 1",
            position: "top-left",
            style: { color: "#fff", fontSize: "14px" },
          },
        }),
        createCellConfig(1, {
          title: {
            show: true,
            text: "Camera 2",
            position: "bottom-right",
            style: { color: "#ccc", fontSize: "12px" },
          },
        }),
      ],
    }

    render(<TemplateRenderer config={config} renderCell={mockRenderCell} />)

    expect(screen.getByText("Camera 1")).toBeInTheDocument()
    expect(screen.getByText("Camera 2")).toBeInTheDocument()

    const title1 = screen.getByText("Camera 1")
    expect(title1).toHaveStyle({ color: "#fff", fontSize: "14px" })
    expect(title1.className).toContain("top-4")
    expect(title1.className).toContain("left-4")

    const title2 = screen.getByText("Camera 2")
    expect(title2).toHaveStyle({ color: "#ccc", fontSize: "12px" })
    expect(title2.className).toContain("bottom-4")
    expect(title2.className).toContain("right-4")
  })
})

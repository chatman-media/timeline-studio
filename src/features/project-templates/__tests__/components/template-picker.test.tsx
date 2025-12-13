/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { TemplatePicker } from "../../components/template-picker"
import { projectTemplateManager } from "../../services"
import type { ProjectTemplate } from "../../types/project-template"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

describe("TemplatePicker", () => {
  let mockTemplates: ProjectTemplate[]

  beforeEach(() => {
    mockTemplates = [
      {
        id: "youtube-1",
        name: { en: "YouTube Standard", ru: "YouTube стандарт" },
        description: { en: "Standard YouTube video", ru: "Стандартное видео для YouTube" },
        category: "youtube",
        targetPlatform: "youtube",
        aspectRatio: "16:9",
        estimatedDuration: 600,
        settings: {
          resolution: "1920x1080",
          frameRate: "30",
          aspectRatio: {
            label: "16:9",
            textLabel: "Широкоэкнранный",
            description: "YouTube",
            value: { width: 1920, height: 1080, name: "16:9" },
          },
          colorSpace: "sdr",
        },
        structure: { tracks: [], sections: [] },
        placeholders: {},
      },
      {
        id: "instagram-1",
        name: { en: "Instagram Reel", ru: "Instagram Reel" },
        description: { en: "Short vertical video", ru: "Короткое вертикальное видео" },
        category: "social",
        targetPlatform: "instagram",
        aspectRatio: "9:16",
        estimatedDuration: 60,
        settings: {
          resolution: "1080x1920",
          frameRate: "30",
          aspectRatio: {
            label: "9:16",
            textLabel: "Портрет",
            description: "TikTok, YouTube Shorts",
            value: { width: 1080, height: 1920, name: "9:16" },
          },
          colorSpace: "sdr",
        },
        structure: { tracks: [], sections: [] },
        placeholders: {},
      },
    ] as unknown as ProjectTemplate[]

    vi.spyOn(projectTemplateManager, "getAllTemplates").mockReturnValue(mockTemplates)
    vi.spyOn(projectTemplateManager, "searchTemplates").mockReturnValue(mockTemplates)
  })

  describe("rendering", () => {
    it("should render template picker", () => {
      render(<TemplatePicker />)

      expect(screen.getByText("Шаблоны проектов")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Поиск шаблонов...")).toBeInTheDocument()
    })

    it("should render header when showHeader is true", () => {
      render(<TemplatePicker showHeader={true} />)

      expect(screen.getByText("Шаблоны проектов")).toBeInTheDocument()
      expect(screen.getByText("Выберите шаблон для быстрого старта проекта")).toBeInTheDocument()
    })

    it("should not render header when showHeader is false", () => {
      render(<TemplatePicker showHeader={false} />)

      expect(screen.queryByText("Шаблоны проектов")).not.toBeInTheDocument()
    })

    it("should render close button when onClose is provided", () => {
      const onClose = vi.fn()
      render(<TemplatePicker onClose={onClose} />)

      const closeButton = screen.getByRole("button", { name: "X" })
      expect(closeButton).toBeInTheDocument()
    })

    it("should render all templates in grid view", () => {
      render(<TemplatePicker />)

      expect(screen.getByText("YouTube стандарт")).toBeInTheDocument()
      expect(screen.getByText("Instagram Reel")).toBeInTheDocument()
    })

    it("should show empty state when no templates", () => {
      vi.spyOn(projectTemplateManager, "getAllTemplates").mockReturnValue([])

      render(<TemplatePicker />)

      expect(screen.getByText("Шаблоны не найдены")).toBeInTheDocument()
    })
  })

  describe("view modes", () => {
    it("should render grid view by default", () => {
      render(<TemplatePicker />)

      const gridContainer = screen.getByText("YouTube стандарт").closest(".grid")
      expect(gridContainer).toBeInTheDocument()
    })

    it("should switch to list view", () => {
      render(<TemplatePicker />)

      const listButton = screen.getAllByRole("tab")[1]
      fireEvent.click(listButton)

      // In list view, the structure is different
      const templateCard = screen.getByText("YouTube стандарт").closest(".flex")
      expect(templateCard).toBeInTheDocument()
    })
  })

  describe("search", () => {
    it("should update search query", () => {
      render(<TemplatePicker />)

      const searchInput = screen.getByPlaceholderText("Поиск шаблонов...")
      fireEvent.change(searchInput, { target: { value: "youtube" } })

      expect(searchInput).toHaveValue("youtube")
    })

    it("should call searchTemplates when query changes", () => {
      const searchSpy = vi.spyOn(projectTemplateManager, "searchTemplates")

      render(<TemplatePicker />)

      const searchInput = screen.getByPlaceholderText("Поиск шаблонов...")
      fireEvent.change(searchInput, { target: { value: "youtube" } })

      expect(searchSpy).toHaveBeenCalledWith("youtube")
    })
  })

  describe("filters", () => {
    it("should show filters popover when showFilters is true", () => {
      render(<TemplatePicker showFilters={true} />)

      const filterButton = screen.getByRole("button", { name: "Filter" })
      fireEvent.click(filterButton)

      expect(screen.getByText("Категория")).toBeInTheDocument()
      expect(screen.getByText("Платформа")).toBeInTheDocument()
    })

    it("should not show filter button when showFilters is false", () => {
      render(<TemplatePicker showFilters={false} />)

      // Filter button should not be present
      expect(screen.queryByRole("button", { name: "Filter" })).not.toBeInTheDocument()
    })

    it("should clear filters", () => {
      render(<TemplatePicker />)

      // Open filters
      const filterButton = screen.getAllByRole("button").find((b) => b.querySelector("svg"))
      if (filterButton) {
        fireEvent.click(filterButton)
      }

      const clearButton = screen.getByText("Сбросить фильтры")
      fireEvent.click(clearButton)

      // Search input should be cleared
      const searchInput = screen.getByPlaceholderText("Поиск шаблонов...")
      expect(searchInput).toHaveValue("")
    })
  })

  describe("template selection", () => {
    it("should select template in single mode", () => {
      const onSelect = vi.fn()

      render(<TemplatePicker mode="single" onSelect={onSelect} />)

      const templateCard = screen.getByText("YouTube стандарт").closest(".cursor-pointer")
      if (templateCard) {
        fireEvent.click(templateCard)
      }

      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "youtube-1",
        }),
      )
    })

    it("should close after selection in single mode with onClose", () => {
      const onClose = vi.fn()

      render(<TemplatePicker mode="single" onClose={onClose} />)

      const templateCard = screen.getByText("YouTube стандарт").closest(".cursor-pointer")
      if (templateCard) {
        fireEvent.click(templateCard)
      }

      expect(onClose).toHaveBeenCalled()
    })

    it("should toggle selection in multiple mode", () => {
      render(<TemplatePicker mode="multiple" />)

      const templateCard = screen.getByText("YouTube стандарт").closest(".cursor-pointer")
      if (templateCard) {
        fireEvent.click(templateCard)
      }

      // Should show selection count in footer
      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("шаблон выбран")).toBeInTheDocument()
    })

    it("should show multiple selection footer", () => {
      render(<TemplatePicker mode="multiple" />)

      // Select a template
      const templateCard = screen.getByText("YouTube стандарт").closest(".cursor-pointer")
      if (templateCard) {
        fireEvent.click(templateCard)
      }

      expect(screen.getByText("Очистить")).toBeInTheDocument()
      expect(screen.getByText("Продолжить")).toBeInTheDocument()
    })

    it("should clear selection", () => {
      render(<TemplatePicker mode="multiple" />)

      // Select a template
      const templateCard = screen.getByText("YouTube стандарт").closest(".cursor-pointer")
      if (templateCard) {
        fireEvent.click(templateCard)
      }

      expect(screen.getByText("1")).toBeInTheDocument()

      // Clear
      const clearButton = screen.getByText("Очистить")
      fireEvent.click(clearButton)

      expect(screen.queryByText("1")).not.toBeInTheDocument()
    })
  })

  describe("template card rendering", () => {
    it("should display template name", () => {
      render(<TemplatePicker />)

      expect(screen.getByText("YouTube стандарт")).toBeInTheDocument()
    })

    it("should display template description", () => {
      render(<TemplatePicker />)

      expect(screen.getByText("Стандартное видео для YouTube")).toBeInTheDocument()
    })

    it("should display template category", () => {
      render(<TemplatePicker />)

      const categories = screen.getAllByText("youtube")
      expect(categories.length).toBeGreaterThan(0)
    })

    it("should display template platform badge", () => {
      render(<TemplatePicker />)

      const badges = screen.getAllByText("youtube")
      expect(badges.length).toBeGreaterThan(0)
    })

    it("should display template duration", () => {
      render(<TemplatePicker />)

      // 600 seconds = 10:00
      expect(screen.getByText(/10:\s*0+\s*мин/)).toBeInTheDocument()
    })

    it("should display template resolution", () => {
      render(<TemplatePicker />)

      expect(screen.getByText("1920x1080")).toBeInTheDocument()
    })
  })

  describe("accessibility", () => {
    it("should have proper role for search input", () => {
      render(<TemplatePicker />)

      const searchInput = screen.getByPlaceholderText("Поиск шаблонов...")
      expect(searchInput).toBeInTheDocument()
    })

    it("should have clickable template cards", () => {
      render(<TemplatePicker />)

      // Templates should be displayed
      expect(screen.getByText("YouTube стандарт")).toBeInTheDocument()
      expect(screen.getByText("Instagram Reel")).toBeInTheDocument()
    })
  })

  describe("callbacks", () => {
    it("should call onSelectionChange", () => {
      const onSelectionChange = vi.fn()

      render(<TemplatePicker mode="multiple" onSelectionChange={onSelectionChange} />)

      const templateCard = screen.getByText("YouTube стандарт").closest(".cursor-pointer")
      if (templateCard) {
        fireEvent.click(templateCard)
      }

      expect(onSelectionChange).toHaveBeenCalledWith([expect.objectContaining({ id: "youtube-1" })])
    })

    it("should call onClose when close button clicked", () => {
      const onClose = vi.fn()

      render(<TemplatePicker onClose={onClose} />)

      const closeButtons = screen.getAllByRole("button")
      const closeButton = closeButtons.find((b) => {
        const svg = b.querySelector("svg")
        return svg !== null
      })

      if (closeButton) {
        fireEvent.click(closeButton)
      }

      expect(onClose).toHaveBeenCalled()
    })
  })
})

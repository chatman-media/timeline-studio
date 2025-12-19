/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { TemplatePreview } from "../../components/template-preview"
import type { ProjectTemplate } from "../../types/project-template"

describe("TemplatePreview", () => {
  const mockTemplate: ProjectTemplate = {
    id: "test-template",
    name: { en: "Test Template", ru: "Тестовый шаблон" },
    description: { en: "Test description", ru: "Тестовое описание" },
    category: "youtube",
    aspectRatio: "16:9",
    estimatedDuration: 600, // 10 minutes
    settings: {
      resolution: "1920x1080",
      frameRate: "30",
      aspectRatio: {
        label: "16:9",
        textLabel: "Широкоэкнранный",
        description: "YouTube",
        value: {
          width: 1920,
          height: 1080,
          name: "16:9",
        },
      },
      colorSpace: "sdr",
    },
    structure: {
      sections: [
        {
          id: "section-1",
          type: "intro",
          name: { en: "Intro", ru: "Интро" },
          duration: 5,
          position: 0,
        },
        {
          id: "section-2",
          type: "content",
          name: { en: "Main Content", ru: "Основной контент" },
          duration: 590,
          position: 5,
        },
        {
          id: "section-3",
          type: "outro",
          name: { en: "Outro", ru: "Аутро" },
          duration: 5,
          position: 595,
        },
      ],

      tracks: [
        { id: "track-1", type: "video", name: "Video Track 1", locked: false },
        { id: "track-2", type: "audio", name: "Audio Track 1", locked: false },
        {
          id: "track-3",
          type: "graphics",
          name: "Graphics Track",
          locked: true,
        },
      ],
    },
    placeholders: {
      intro: { duration: 5, templateId: "intro-1", required: true },
      outro: { duration: 5, templateId: "outro-1", required: false },
      mainContent: { minDuration: 30, maxDuration: 600 },
    },
  } as unknown as ProjectTemplate

  describe("rendering", () => {
    it("should render template preview", () => {
      render(<TemplatePreview template={mockTemplate} data-oid="rdpemw2" />)

      expect(screen.getByText("Тестовый шаблон")).toBeInTheDocument()
      expect(screen.getByText("Тестовое описание")).toBeInTheDocument()
    })

    it("should render template category badge", () => {
      render(<TemplatePreview template={mockTemplate} data-oid="-xwbpbt" />)

      expect(screen.getByText("youtube")).toBeInTheDocument()
    })

    it("should fall back to English name if Russian is missing", () => {
      const template = {
        ...mockTemplate,
        name: { en: "English Name", ru: "" },
      }

      render(<TemplatePreview template={template} data-oid="mpgmwl8" />)

      expect(screen.getByText("English Name")).toBeInTheDocument()
    })
  })

  describe("quick stats", () => {
    it("should display duration", () => {
      render(<TemplatePreview template={mockTemplate} data-oid="9mm7naz" />)

      expect(screen.getByText("10:00")).toBeInTheDocument()
      expect(screen.getByText("Длительность")).toBeInTheDocument()
    })

    it("should display track count", () => {
      render(<TemplatePreview template={mockTemplate} data-oid="gm-v0fx" />)

      expect(screen.getByText("Треков")).toBeInTheDocument()
      // Track count should be 3
      const trackCountElements = screen.getAllByText("3")
      expect(trackCountElements.length).toBeGreaterThan(0)
    })

    it("should display section count", () => {
      render(<TemplatePreview template={mockTemplate} data-oid="crfse.p" />)

      expect(screen.getByText("Секций")).toBeInTheDocument()
      // Section count should be 3
      const sectionCountElements = screen.getAllByText("3")
      expect(sectionCountElements.length).toBeGreaterThan(0)
    })
  })

  describe("project settings", () => {
    it("should show settings when showDetails is true", () => {
      render(<TemplatePreview template={mockTemplate} showDetails={true} data-oid="4m18toz" />)

      expect(screen.getByText("Настройки проекта")).toBeInTheDocument()
      expect(screen.getByText("1920x1080")).toBeInTheDocument()
      expect(screen.getByText("30")).toBeInTheDocument()
      expect(screen.getAllByText("16:9").length).toBeGreaterThan(0) // aspectRatio label
      expect(screen.getByText("sdr")).toBeInTheDocument() // colorSpace
    })

    it("should hide settings when showDetails is false", () => {
      render(<TemplatePreview template={mockTemplate} showDetails={false} data-oid="7l0:hff" />)

      expect(screen.queryByText("Настройки проекта")).not.toBeInTheDocument()
    })
  })

  describe("sections timeline", () => {
    it("should render all sections", () => {
      render(<TemplatePreview template={mockTemplate} data-oid="qfvm7f5" />)

      // Sections should be visible
      const sections = screen.getAllByText(/Интро|Основной контент|Аутро/)
      expect(sections.length).toBeGreaterThan(0)
    })

    it("should display section types", () => {
      render(<TemplatePreview template={mockTemplate} data-oid="9j2koc8" />)

      // Section type badges should be visible
      const types = screen.getAllByText(/Intro|Content|Outro/)
      expect(types.length).toBeGreaterThan(0)
    })

    it("should display section times", () => {
      render(<TemplatePreview template={mockTemplate} data-oid="o1:t8x-" />)

      // Section 1: 00:00.000 → 00:05.000
      expect(screen.getByText("00:00.000 → 00:05.000")).toBeInTheDocument()

      // Section 2: 00:05.000 → 09:55.000
      expect(screen.getByText("00:05.000 → 09:55.000")).toBeInTheDocument()

      // Section 3: 09:55.000 → 10:00.000
      expect(screen.getByText("09:55.000 → 10:00.000")).toBeInTheDocument()
    })

    it("should format section durations correctly", () => {
      render(<TemplatePreview template={mockTemplate} data-oid="eh1lx7w" />)

      // 5 seconds
      const fiveSecondDurations = screen.getAllByText("0:05")
      expect(fiveSecondDurations.length).toBeGreaterThan(0)

      // 590 seconds = 9:50
      expect(screen.getByText("9:50")).toBeInTheDocument()
    })
  })

  describe("tracks", () => {
    it("should render all tracks", () => {
      render(<TemplatePreview template={mockTemplate} data-oid="6o7-o:e" />)

      expect(screen.getByText("Video Track 1")).toBeInTheDocument()
      expect(screen.getByText("Audio Track 1")).toBeInTheDocument()
      expect(screen.getByText("Graphics Track")).toBeInTheDocument()
    })

    it("should display track types", () => {
      render(<TemplatePreview template={mockTemplate} data-oid="f7qt4:i" />)

      expect(screen.getByText("video")).toBeInTheDocument()
      expect(screen.getByText("audio")).toBeInTheDocument()
      expect(screen.getByText("graphics")).toBeInTheDocument()
    })

    it("should show locked badge for locked tracks", () => {
      render(<TemplatePreview template={mockTemplate} data-oid="n30q2cf" />)

      const lockedBadges = screen.getAllByText("Locked")
      expect(lockedBadges.length).toBe(1)
    })
  })

  describe("placeholders", () => {
    it("should show placeholders when present and showDetails is true", () => {
      render(<TemplatePreview template={mockTemplate} showDetails={true} data-oid="0p_lh_5" />)

      expect(screen.getByText("Плейсхолдеры")).toBeInTheDocument()
      // Placeholders section should contain various elements
      const placeholdersText = screen.getAllByText(/Intro|Outro|Основной контент/)
      expect(placeholdersText.length).toBeGreaterThan(0)
    })

    it("should hide placeholders when showDetails is false", () => {
      render(<TemplatePreview template={mockTemplate} showDetails={false} data-oid="q2e1dp." />)

      expect(screen.queryByText("Плейсхолдеры")).not.toBeInTheDocument()
    })

    it("should show required badge for required placeholders", () => {
      render(<TemplatePreview template={mockTemplate} showDetails={true} data-oid="m96dt3p" />)

      const requiredBadges = screen.getAllByText("Обязательно")
      expect(requiredBadges.length).toBeGreaterThan(0)
    })

    it("should show optional badge for non-required placeholders", () => {
      render(<TemplatePreview template={mockTemplate} showDetails={true} data-oid="vqlztjn" />)

      const optionalBadges = screen.getAllByText("Опционально")
      expect(optionalBadges.length).toBeGreaterThan(0)
    })

    it("should display intro duration", () => {
      render(<TemplatePreview template={mockTemplate} showDetails={true} data-oid="o717qn0" />)

      // Placeholders section should show intro duration
      expect(screen.getByText("Плейсхолдеры")).toBeInTheDocument()
      // Duration 0:05 should be visible
      const durations = screen.getAllByText(/0:05/)
      expect(durations.length).toBeGreaterThan(0)
    })

    it("should display main content min/max duration", () => {
      render(<TemplatePreview template={mockTemplate} showDetails={true} data-oid="znphcim" />)

      expect(screen.getByText(/Минимум: 0:30/)).toBeInTheDocument()
      expect(screen.getByText(/Максимум: 10:00/)).toBeInTheDocument()
    })

    it("should not show placeholders section if no placeholders", () => {
      const template = {
        ...mockTemplate,
        placeholders: {},
      }

      render(<TemplatePreview template={template} showDetails={true} data-oid="q_f_a7q" />)

      expect(screen.queryByText("Плейсхолдеры")).not.toBeInTheDocument()
    })
  })

  describe("time formatting", () => {
    it("should format seconds to MM:SS", () => {
      const template = {
        ...mockTemplate,
        estimatedDuration: 125, // 2:05
      }

      render(<TemplatePreview template={template} data-oid="4axw-va" />)

      expect(screen.getByText("2:05")).toBeInTheDocument()
    })

    it("should pad single digit seconds", () => {
      const template = {
        ...mockTemplate,
        estimatedDuration: 65, // 1:05
      }

      render(<TemplatePreview template={template} data-oid="rs8rclv" />)

      expect(screen.getByText("1:05")).toBeInTheDocument()
    })

    it("should format subseconds correctly", () => {
      render(<TemplatePreview template={mockTemplate} data-oid="r0x4siq" />)

      // Check that milliseconds are displayed
      const timeWithMs = screen.getAllByText(/\d{2}:\d{2}\.\d{3}/)
      expect(timeWithMs.length).toBeGreaterThan(0)
    })
  })

  describe("custom height", () => {
    it("should apply custom height", () => {
      const { container } = render(<TemplatePreview template={mockTemplate} height="500px" data-oid="dujw7rp" />)

      const mainDiv = container.querySelector(".flex.h-full.flex-col")
      expect(mainDiv).toHaveStyle({ height: "500px" })
    })

    it("should use 100% height by default", () => {
      const { container } = render(<TemplatePreview template={mockTemplate} data-oid="g6862-3" />)

      const mainDiv = container.querySelector(".flex.h-full.flex-col")
      expect(mainDiv).toHaveStyle({ height: "100%" })
    })
  })
})

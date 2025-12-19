/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { TemplateCustomizer } from "../../components/template-customizer"
import type { ApplyTemplateOptions } from "../../services/template-applier"
import type { ProjectTemplate } from "../../types/project-template"

describe("TemplateCustomizer", () => {
  const mockTemplate: ProjectTemplate = {
    id: "test-template",
    name: { en: "Test Template", ru: "Тестовый шаблон" },
    category: "youtube",
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
    structure: {
      sections: [
        {
          id: "section-1",
          type: "intro",
          name: { en: "Intro", ru: "Интро" },
          duration: 5,
          position: 0,
        },
      ],

      tracks: [
        { id: "track-1", type: "video", name: "Video Track" },
        { id: "track-2", type: "audio", name: "Audio Track" },
      ],
    },
    placeholders: {},
  } as unknown as ProjectTemplate

  describe("rendering", () => {
    it("should render customizer", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="a06291i" />)

      expect(screen.getByText("Настройка шаблона")).toBeInTheDocument()
      expect(screen.getByText("Настройте параметры перед применением шаблона")).toBeInTheDocument()
    })

    it("should render all sections", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="-m1_7fs" />)

      expect(screen.getByText("Основные настройки")).toBeInTheDocument()
      expect(screen.getByText("Настройки проекта")).toBeInTheDocument()
      expect(screen.getByText("Структура")).toBeInTheDocument()
      expect(screen.getByText("Информация о шаблоне")).toBeInTheDocument()
    })

    it("should render action buttons", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="nrmg34d" />)

      expect(screen.getByText("Отмена")).toBeInTheDocument()
      expect(screen.getByText("Применить шаблон")).toBeInTheDocument()
    })
  })

  describe("initial options", () => {
    it("should use template name by default", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="yemmq4m" />)

      const nameInput = screen.getByLabelText("Название секвенции") as HTMLInputElement
      expect(nameInput.value).toBe("Тестовый шаблон")
    })

    it("should use custom initial sequence name", () => {
      const initialOptions: Partial<ApplyTemplateOptions> = {
        sequenceName: "Custom Name",
      }

      render(<TemplateCustomizer template={mockTemplate} initialOptions={initialOptions} data-oid="d9g1n_t" />)

      const nameInput = screen.getByLabelText("Название секвенции") as HTMLInputElement
      expect(nameInput.value).toBe("Custom Name")
    })

    it("should use default mode as 'new'", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="ouj8y4o" />)

      const modeSelect = screen.getByLabelText("Режим создания")
      expect(modeSelect).toHaveTextContent("Создать новую секвенцию")
    })

    it("should use custom initial mode", () => {
      const initialOptions: Partial<ApplyTemplateOptions> = {
        mode: "replace",
      }

      render(<TemplateCustomizer template={mockTemplate} initialOptions={initialOptions} data-oid="s1pm6j-" />)

      const modeSelect = screen.getByLabelText("Режим создания")
      expect(modeSelect).toHaveTextContent("Заменить активную секвенцию")
    })
  })

  describe("sequence name input", () => {
    it("should update sequence name", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="do:rgv0" />)

      const nameInput = screen.getByLabelText("Название секвенции")
      fireEvent.change(nameInput, { target: { value: "New Name" } })

      expect(nameInput).toHaveValue("New Name")
    })

    it("should call onChange when sequence name changes", () => {
      const onChange = vi.fn()

      render(<TemplateCustomizer template={mockTemplate} onChange={onChange} data-oid="qhmqm4w" />)

      const nameInput = screen.getByLabelText("Название секвенции")
      fireEvent.change(nameInput, { target: { value: "New Name" } })

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          sequenceName: "New Name",
        }),
      )
    })

    it("should show placeholder", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="nw:9kzn" />)

      const nameInput = screen.getByPlaceholderText("Введите название...")
      expect(nameInput).toBeInTheDocument()
    })
  })

  describe("mode selection", () => {
    it("should change mode to replace", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="t2ll-vn" />)

      const modeSelect = screen.getByLabelText("Режим создания")
      fireEvent.click(modeSelect)

      const replaceOption = screen.getByText("Заменить активную секвенцию")
      fireEvent.click(replaceOption)

      expect(modeSelect).toHaveTextContent("Заменить активную секвенцию")
    })

    it("should update hint text based on mode", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="u6fun--" />)

      // Initially shows "new" hint
      expect(screen.getByText("Добавит новую секвенцию в проект")).toBeInTheDocument()

      // Change to replace mode
      const modeSelect = screen.getByLabelText("Режим создания")
      fireEvent.click(modeSelect)

      const replaceOption = screen.getByText("Заменить активную секвенцию")
      fireEvent.click(replaceOption)

      expect(screen.getByText("Заменит содержимое текущей секвенции")).toBeInTheDocument()
    })
  })

  describe("project settings switch", () => {
    it("should toggle apply project settings", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="z18quk4" />)

      const settingsSwitch = screen.getByLabelText("Применить настройки проекта")
      expect(settingsSwitch).toBeChecked()

      fireEvent.click(settingsSwitch)
      expect(settingsSwitch).not.toBeChecked()
    })

    it("should show settings preview when enabled", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="gzp7gt4" />)

      expect(screen.getByText("1920x1080")).toBeInTheDocument()
      expect(screen.getByText("30")).toBeInTheDocument()
      expect(screen.getByText("16:9")).toBeInTheDocument()
    })

    it("should hide settings preview when disabled", () => {
      const initialOptions: Partial<ApplyTemplateOptions> = {
        applyProjectSettings: false,
      }

      render(<TemplateCustomizer template={mockTemplate} initialOptions={initialOptions} data-oid="n9ata15" />)

      expect(screen.queryByText("1920x1080")).not.toBeInTheDocument()
    })
  })

  describe("structure options", () => {
    it("should toggle create tracks", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="8.a-gu6" />)

      const tracksSwitch = screen.getByLabelText("Создать треки")
      expect(tracksSwitch).toBeChecked()

      fireEvent.click(tracksSwitch)
      expect(tracksSwitch).not.toBeChecked()
    })

    it("should toggle create markers", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="ddhkxgc" />)

      const markersSwitch = screen.getByLabelText("Создать маркеры")
      expect(markersSwitch).toBeChecked()

      fireEvent.click(markersSwitch)
      expect(markersSwitch).not.toBeChecked()
    })

    it("should display track count in hint", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="9t.d:i9" />)

      expect(screen.getByText(/2 шт\./)).toBeInTheDocument()
    })

    it("should display section count in hint", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="v6txzx9" />)

      expect(screen.getByText(/1 шт\./)).toBeInTheDocument()
    })
  })

  describe("template info", () => {
    it("should display template category", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="nxne2ed" />)

      const categoryElement = screen.getByText("youtube")
      expect(categoryElement).toBeInTheDocument()
    })

    it("should display template duration", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="7m.rqeh" />)

      // 600 seconds = 10:00
      expect(screen.getByText(/10:\s*0+\s*мин/)).toBeInTheDocument()
    })

    it("should display template platform if present", () => {
      const templateWithPlatform = {
        ...mockTemplate,
        targetPlatform: "youtube" as const,
      }

      render(<TemplateCustomizer template={templateWithPlatform} data-oid=":_7gxuq" />)

      const platformElements = screen.getAllByText("youtube")
      expect(platformElements.length).toBeGreaterThan(0)
    })

    it("should display section count", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="ixm.34a" />)

      expect(screen.getByText("1")).toBeInTheDocument()
    })
  })

  describe("callbacks", () => {
    it("should call onChange when options change", () => {
      const onChange = vi.fn()

      render(<TemplateCustomizer template={mockTemplate} onChange={onChange} data-oid="ryds7:u" />)

      const tracksSwitch = screen.getByLabelText("Создать треки")
      fireEvent.click(tracksSwitch)

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          createTracks: false,
        }),
      )
    })

    it("should call onApply with current options", () => {
      const onApply = vi.fn()

      render(<TemplateCustomizer template={mockTemplate} onApply={onApply} data-oid="ursn9bc" />)

      const applyButton = screen.getByText("Применить шаблон")
      fireEvent.click(applyButton)

      expect(onApply).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "new",
          sequenceName: "Тестовый шаблон",
          applyProjectSettings: true,
          createMarkers: true,
          createTracks: true,
        }),
      )
    })

    it("should call onCancel when cancel button clicked", () => {
      const onCancel = vi.fn()

      render(<TemplateCustomizer template={mockTemplate} onCancel={onCancel} data-oid="q09txmv" />)

      const cancelButton = screen.getByText("Отмена")
      fireEvent.click(cancelButton)

      expect(onCancel).toHaveBeenCalled()
    })

    it("should apply with modified options", () => {
      const onApply = vi.fn()

      render(<TemplateCustomizer template={mockTemplate} onApply={onApply} data-oid="_38befm" />)

      // Modify some options
      const nameInput = screen.getByLabelText("Название секвенции")
      fireEvent.change(nameInput, { target: { value: "Modified Name" } })

      const tracksSwitch = screen.getByLabelText("Создать треки")
      fireEvent.click(tracksSwitch)

      const applyButton = screen.getByText("Применить шаблон")
      fireEvent.click(applyButton)

      expect(onApply).toHaveBeenCalledWith(
        expect.objectContaining({
          sequenceName: "Modified Name",
          createTracks: false,
        }),
      )
    })
  })

  describe("custom height", () => {
    it("should apply custom height", () => {
      const { container } = render(<TemplateCustomizer template={mockTemplate} height="500px" data-oid="2--w6k0" />)

      const mainDiv = container.querySelector(".flex.h-full.flex-col")
      expect(mainDiv).toHaveStyle({ height: "500px" })
    })

    it("should use 600px height by default", () => {
      const { container } = render(<TemplateCustomizer template={mockTemplate} data-oid="bhj.p2h" />)

      const mainDiv = container.querySelector(".flex.h-full.flex-col")
      expect(mainDiv).toHaveStyle({ height: "600px" })
    })
  })

  describe("option combinations", () => {
    it("should allow all options to be disabled", () => {
      render(<TemplateCustomizer template={mockTemplate} data-oid="s_ls9-e" />)

      const settingsSwitch = screen.getByLabelText("Применить настройки проекта")
      const tracksSwitch = screen.getByLabelText("Создать треки")
      const markersSwitch = screen.getByLabelText("Создать маркеры")

      fireEvent.click(settingsSwitch)
      fireEvent.click(tracksSwitch)
      fireEvent.click(markersSwitch)

      expect(settingsSwitch).not.toBeChecked()
      expect(tracksSwitch).not.toBeChecked()
      expect(markersSwitch).not.toBeChecked()
    })

    it("should maintain independent state for each option", () => {
      const onChange = vi.fn()

      render(<TemplateCustomizer template={mockTemplate} onChange={onChange} data-oid="jucf92." />)

      const tracksSwitch = screen.getByLabelText("Создать треки")
      fireEvent.click(tracksSwitch)

      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
      expect(lastCall).toEqual(
        expect.objectContaining({
          createTracks: false,
          createMarkers: true, // Should remain true
          applyProjectSettings: true, // Should remain true
        }),
      )
    })
  })
})

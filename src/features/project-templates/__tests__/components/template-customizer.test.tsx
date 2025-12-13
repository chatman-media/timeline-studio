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
      render(<TemplateCustomizer template={mockTemplate} />)

      expect(screen.getByText("Настройка шаблона")).toBeInTheDocument()
      expect(screen.getByText("Настройте параметры перед применением шаблона")).toBeInTheDocument()
    })

    it("should render all sections", () => {
      render(<TemplateCustomizer template={mockTemplate} />)

      expect(screen.getByText("Основные настройки")).toBeInTheDocument()
      expect(screen.getByText("Настройки проекта")).toBeInTheDocument()
      expect(screen.getByText("Структура")).toBeInTheDocument()
      expect(screen.getByText("Информация о шаблоне")).toBeInTheDocument()
    })

    it("should render action buttons", () => {
      render(<TemplateCustomizer template={mockTemplate} />)

      expect(screen.getByText("Отмена")).toBeInTheDocument()
      expect(screen.getByText("Применить шаблон")).toBeInTheDocument()
    })
  })

  describe("initial options", () => {
    it("should use template name by default", () => {
      render(<TemplateCustomizer template={mockTemplate} />)

      const nameInput = screen.getByLabelText("Название секвенции") as HTMLInputElement
      expect(nameInput.value).toBe("Тестовый шаблон")
    })

    it("should use custom initial sequence name", () => {
      const initialOptions: Partial<ApplyTemplateOptions> = {
        sequenceName: "Custom Name",
      }

      render(<TemplateCustomizer template={mockTemplate} initialOptions={initialOptions} />)

      const nameInput = screen.getByLabelText("Название секвенции") as HTMLInputElement
      expect(nameInput.value).toBe("Custom Name")
    })

    it("should use default mode as 'new'", () => {
      render(<TemplateCustomizer template={mockTemplate} />)

      const modeSelect = screen.getByLabelText("Режим создания")
      expect(modeSelect).toHaveTextContent("Создать новую секвенцию")
    })

    it("should use custom initial mode", () => {
      const initialOptions: Partial<ApplyTemplateOptions> = {
        mode: "replace",
      }

      render(<TemplateCustomizer template={mockTemplate} initialOptions={initialOptions} />)

      const modeSelect = screen.getByLabelText("Режим создания")
      expect(modeSelect).toHaveTextContent("Заменить активную секвенцию")
    })
  })

  describe("sequence name input", () => {
    it("should update sequence name", () => {
      render(<TemplateCustomizer template={mockTemplate} />)

      const nameInput = screen.getByLabelText("Название секвенции")
      fireEvent.change(nameInput, { target: { value: "New Name" } })

      expect(nameInput).toHaveValue("New Name")
    })

    it("should call onChange when sequence name changes", () => {
      const onChange = vi.fn()

      render(<TemplateCustomizer template={mockTemplate} onChange={onChange} />)

      const nameInput = screen.getByLabelText("Название секвенции")
      fireEvent.change(nameInput, { target: { value: "New Name" } })

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          sequenceName: "New Name",
        }),
      )
    })

    it("should show placeholder", () => {
      render(<TemplateCustomizer template={mockTemplate} />)

      const nameInput = screen.getByPlaceholderText("Введите название...")
      expect(nameInput).toBeInTheDocument()
    })
  })

  describe("mode selection", () => {
    it("should change mode to replace", () => {
      render(<TemplateCustomizer template={mockTemplate} />)

      const modeSelect = screen.getByLabelText("Режим создания")
      fireEvent.click(modeSelect)

      const replaceOption = screen.getByText("Заменить активную секвенцию")
      fireEvent.click(replaceOption)

      expect(modeSelect).toHaveTextContent("Заменить активную секвенцию")
    })

    it("should update hint text based on mode", () => {
      render(<TemplateCustomizer template={mockTemplate} />)

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
      render(<TemplateCustomizer template={mockTemplate} />)

      const settingsSwitch = screen.getByLabelText("Применить настройки проекта")
      expect(settingsSwitch).toBeChecked()

      fireEvent.click(settingsSwitch)
      expect(settingsSwitch).not.toBeChecked()
    })

    it("should show settings preview when enabled", () => {
      render(<TemplateCustomizer template={mockTemplate} />)

      expect(screen.getByText("1920x1080")).toBeInTheDocument()
      expect(screen.getByText("30")).toBeInTheDocument()
      expect(screen.getByText("16:9")).toBeInTheDocument()
    })

    it("should hide settings preview when disabled", () => {
      const initialOptions: Partial<ApplyTemplateOptions> = {
        applyProjectSettings: false,
      }

      render(<TemplateCustomizer template={mockTemplate} initialOptions={initialOptions} />)

      expect(screen.queryByText("1920x1080")).not.toBeInTheDocument()
    })
  })

  describe("structure options", () => {
    it("should toggle create tracks", () => {
      render(<TemplateCustomizer template={mockTemplate} />)

      const tracksSwitch = screen.getByLabelText("Создать треки")
      expect(tracksSwitch).toBeChecked()

      fireEvent.click(tracksSwitch)
      expect(tracksSwitch).not.toBeChecked()
    })

    it("should toggle create markers", () => {
      render(<TemplateCustomizer template={mockTemplate} />)

      const markersSwitch = screen.getByLabelText("Создать маркеры")
      expect(markersSwitch).toBeChecked()

      fireEvent.click(markersSwitch)
      expect(markersSwitch).not.toBeChecked()
    })

    it("should display track count in hint", () => {
      render(<TemplateCustomizer template={mockTemplate} />)

      expect(screen.getByText(/2 шт\./)).toBeInTheDocument()
    })

    it("should display section count in hint", () => {
      render(<TemplateCustomizer template={mockTemplate} />)

      expect(screen.getByText(/1 шт\./)).toBeInTheDocument()
    })
  })

  describe("template info", () => {
    it("should display template category", () => {
      render(<TemplateCustomizer template={mockTemplate} />)

      const categoryElement = screen.getByText("youtube")
      expect(categoryElement).toBeInTheDocument()
    })

    it("should display template duration", () => {
      render(<TemplateCustomizer template={mockTemplate} />)

      // 600 seconds = 10:00
      expect(screen.getByText(/10:\s*0+\s*мин/)).toBeInTheDocument()
    })

    it("should display template platform if present", () => {
      const templateWithPlatform = {
        ...mockTemplate,
        targetPlatform: "youtube" as const,
      }

      render(<TemplateCustomizer template={templateWithPlatform} />)

      const platformElements = screen.getAllByText("youtube")
      expect(platformElements.length).toBeGreaterThan(0)
    })

    it("should display section count", () => {
      render(<TemplateCustomizer template={mockTemplate} />)

      expect(screen.getByText("1")).toBeInTheDocument()
    })
  })

  describe("callbacks", () => {
    it("should call onChange when options change", () => {
      const onChange = vi.fn()

      render(<TemplateCustomizer template={mockTemplate} onChange={onChange} />)

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

      render(<TemplateCustomizer template={mockTemplate} onApply={onApply} />)

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

      render(<TemplateCustomizer template={mockTemplate} onCancel={onCancel} />)

      const cancelButton = screen.getByText("Отмена")
      fireEvent.click(cancelButton)

      expect(onCancel).toHaveBeenCalled()
    })

    it("should apply with modified options", () => {
      const onApply = vi.fn()

      render(<TemplateCustomizer template={mockTemplate} onApply={onApply} />)

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
      const { container } = render(<TemplateCustomizer template={mockTemplate} height="500px" />)

      const mainDiv = container.querySelector(".flex.h-full.flex-col")
      expect(mainDiv).toHaveStyle({ height: "500px" })
    })

    it("should use 600px height by default", () => {
      const { container } = render(<TemplateCustomizer template={mockTemplate} />)

      const mainDiv = container.querySelector(".flex.h-full.flex-col")
      expect(mainDiv).toHaveStyle({ height: "600px" })
    })
  })

  describe("option combinations", () => {
    it("should allow all options to be disabled", () => {
      render(<TemplateCustomizer template={mockTemplate} />)

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

      render(<TemplateCustomizer template={mockTemplate} onChange={onChange} />)

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

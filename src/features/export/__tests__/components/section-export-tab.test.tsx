import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { OutputFormat } from "@/features/video-compiler/types/render"

import { SectionExportTab } from "../../components/section-export-tab"

import type { ExportSettings } from "../../types/export-types"

// Мокаем зависимости
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (params) {
        return `${key} ${JSON.stringify(params)}`
      }
      return key
    },
    i18n: { language: "ru" },
  }),
}))

// Мокаем lucide-react иконки
vi.mock("lucide-react", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, any>
  return {
    ...actual,
    Clock: () => <div data-testid="clock-icon">Clock</div>,
    Flag: () => <div data-testid="flag-icon">Flag</div>,
    Play: () => <div data-testid="play-icon">Play</div>,
    Scissors: () => <div data-testid="scissors-icon">Scissors</div>,
    Video: () => <div data-testid="video-icon">Video</div>,
  }
})

// Мокаем useTimeline хук
const mockSeek = vi.fn()
const mockProject = {
  sections: [
    {
      id: "section-1",
      name: "Section 1",
      startTime: 0,
      endTime: 60,
      tracks: [
        {
          id: "track-1",
          name: "Track 1",
          clips: [
            {
              id: "clip-1",
              name: "Clip 1",
              startTime: 10,
              duration: 20,
            },
            {
              id: "clip-2",
              name: "Clip 2",
              startTime: 40,
              duration: 15,
            },
          ],
        },
      ],
    },
    {
      id: "section-2",
      name: "Section 2",
      startTime: 60,
      endTime: 120,
      tracks: [
        {
          id: "track-2",
          name: "Track 2",
          clips: [
            {
              id: "clip-3",
              name: "Clip 3",
              startTime: 5,
              duration: 30,
            },
          ],
        },
      ],
    },
  ],
  markers: [
    { id: "marker-1", name: "Marker 1", time: 15 },
    { id: "marker-2", name: "Marker 2", time: 45 },
    { id: "marker-3", name: "Marker 3", time: 90 },
  ],
  duration: 180,
}

vi.mock("@/features/timeline/hooks/state/use-timeline", () => ({
  useTimeline: () => ({
    project: mockProject,
    seek: mockSeek,
  }),
}))

describe("SectionExportTab", () => {
  const defaultSettings: ExportSettings = {
    format: OutputFormat.Mp4,
    quality: "good" as const,
    resolution: "1080" as const,
    frameRate: "30",
    enableGPU: false,
    fileName: "export",
    savePath: "/test/path",
  }

  const mockOnExport = vi.fn()
  const mockOnPreviewSection = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Рендеринг", () => {
    it("должен рендерить основные элементы", () => {
      render(<SectionExportTab defaultSettings={defaultSettings} onExport={mockOnExport} />)

      expect(screen.getByText("export.sections.exportMode")).toBeInTheDocument()
      expect(screen.getByText("export.sections.qualityPreset")).toBeInTheDocument()
      expect(screen.getByText("export.sections.byMarkers")).toBeInTheDocument()
      expect(screen.getByText("export.sections.byClips")).toBeInTheDocument()
      expect(screen.getByText("export.sections.manual")).toBeInTheDocument()
    })

    it("должен показывать поля ввода времени в ручном режиме", () => {
      render(<SectionExportTab defaultSettings={defaultSettings} onExport={mockOnExport} />)

      const manualRadio = screen.getByRole("radio", { name: /export.sections.manual/ })
      fireEvent.click(manualRadio)

      expect(screen.getByText("export.sections.startTime")).toBeInTheDocument()
      expect(screen.getByText("export.sections.endTime")).toBeInTheDocument()
      expect(screen.getByText("export.sections.createSection")).toBeInTheDocument()
    })
  })

  describe("Режим маркеров", () => {
    it("должен создавать секции из маркеров", async () => {
      render(<SectionExportTab defaultSettings={defaultSettings} onExport={mockOnExport} />)

      // По умолчанию выбран режим маркеров
      await waitFor(() => {
        expect(screen.getByText("export.sections.sectionsTitle")).toBeInTheDocument()
      })

      // Проверяем что созданы секции из маркеров
      expect(screen.getByDisplayValue("Marker 1")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Marker 2")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Marker 3")).toBeInTheDocument()
    })

    it("должен использовать секции проекта если нет маркеров", async () => {
      // Временно удаляем маркеры
      const originalMarkers = mockProject.markers
      mockProject.markers = []

      render(<SectionExportTab defaultSettings={defaultSettings} onExport={mockOnExport} />)

      await waitFor(() => {
        expect(screen.getByText("export.sections.sectionsTitle")).toBeInTheDocument()
      })

      // Проверяем что используются секции проекта
      expect(screen.getByDisplayValue("Section 1")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Section 2")).toBeInTheDocument()

      // Восстанавливаем маркеры
      mockProject.markers = originalMarkers
    })
  })

  describe("Режим клипов", () => {
    it("должен создавать секции из клипов", async () => {
      render(<SectionExportTab defaultSettings={defaultSettings} onExport={mockOnExport} />)

      const clipsRadio = screen.getByRole("radio", { name: /export.sections.byClips/ })
      fireEvent.click(clipsRadio)

      await waitFor(() => {
        expect(screen.getByText("export.sections.sectionsTitle")).toBeInTheDocument()
      })

      // Проверяем что созданы секции из клипов
      expect(screen.getByDisplayValue("Clip 1")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Clip 2")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Clip 3")).toBeInTheDocument()
    })
  })

  describe("Ручной режим", () => {
    it("должен создавать секцию с указанным временем", async () => {
      render(<SectionExportTab defaultSettings={defaultSettings} onExport={mockOnExport} />)

      const manualRadio = screen.getByRole("radio", { name: /export.sections.manual/ })
      fireEvent.click(manualRadio)

      const startInput = screen.getByPlaceholderText("00:00:00")
      const endInput = screen.getByPlaceholderText("00:00:10")

      fireEvent.change(startInput, { target: { value: "00:01:00" } })
      fireEvent.change(endInput, { target: { value: "00:02:30" } })

      const createButton = screen.getByText("export.sections.createSection")
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByDisplayValue("Manual Section")).toBeInTheDocument()
      })
    })

    it("не должен создавать секцию если время начала больше времени конца", () => {
      render(<SectionExportTab defaultSettings={defaultSettings} onExport={mockOnExport} />)

      const manualRadio = screen.getByRole("radio", { name: /export.sections.manual/ })
      fireEvent.click(manualRadio)

      const startInput = screen.getByPlaceholderText("00:00:00")
      const endInput = screen.getByPlaceholderText("00:00:10")

      fireEvent.change(startInput, { target: { value: "00:02:00" } })
      fireEvent.change(endInput, { target: { value: "00:01:00" } })

      const createButton = screen.getByText("export.sections.createSection")
      fireEvent.click(createButton)

      // Секция не должна быть создана
      expect(screen.queryByDisplayValue("Manual Section")).not.toBeInTheDocument()
    })
  })

  describe("Управление секциями", () => {
    it("должен переключать выбор секции", async () => {
      render(<SectionExportTab defaultSettings={defaultSettings} onExport={mockOnExport} />)

      await waitFor(() => {
        expect(screen.getByText("export.sections.sectionsTitle")).toBeInTheDocument()
      })

      const checkboxes = screen.getAllByRole("checkbox")
      expect(checkboxes[0]).toBeChecked()

      fireEvent.click(checkboxes[0])
      expect(checkboxes[0]).not.toBeChecked()

      fireEvent.click(checkboxes[0])
      expect(checkboxes[0]).toBeChecked()
    })

    it("должен выбирать/снимать выбор со всех секций", async () => {
      render(<SectionExportTab defaultSettings={defaultSettings} onExport={mockOnExport} />)

      await waitFor(() => {
        expect(screen.getByText("export.sections.sectionsTitle")).toBeInTheDocument()
      })

      const selectAllButton = screen.getByText("export.sections.deselectAll")
      fireEvent.click(selectAllButton)

      const checkboxes = screen.getAllByRole("checkbox")
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked()
      })

      fireEvent.click(screen.getByText("export.sections.selectAll"))
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked()
      })
    })

    it("должен обновлять имя файла секции", async () => {
      render(<SectionExportTab defaultSettings={defaultSettings} onExport={mockOnExport} />)

      await waitFor(() => {
        expect(screen.getByText("export.sections.sectionsTitle")).toBeInTheDocument()
      })

      const nameInput = screen.getByDisplayValue("Marker 1")
      fireEvent.change(nameInput, { target: { value: "Custom Name" } })

      expect(screen.getByDisplayValue("Custom Name")).toBeInTheDocument()
    })

    it("должен вызывать предпросмотр секции", async () => {
      render(
        <SectionExportTab
          defaultSettings={defaultSettings}
          onExport={mockOnExport}
          onPreviewSection={mockOnPreviewSection}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText("export.sections.sectionsTitle")).toBeInTheDocument()
      })

      const previewButtons = screen.getAllByTitle("export.sections.preview")
      fireEvent.click(previewButtons[0])

      expect(mockOnPreviewSection).toHaveBeenCalledWith(15)
    })

    it("должен использовать seek если не передан onPreviewSection", async () => {
      render(<SectionExportTab defaultSettings={defaultSettings} onExport={mockOnExport} />)

      await waitFor(() => {
        expect(screen.getByText("export.sections.sectionsTitle")).toBeInTheDocument()
      })

      const previewButtons = screen.getAllByTitle("export.sections.preview")
      fireEvent.click(previewButtons[0])

      expect(mockSeek).toHaveBeenCalledWith(15)
    })
  })

  describe("Настройки качества", () => {
    it("должен менять настройки качества", () => {
      render(<SectionExportTab defaultSettings={defaultSettings} onExport={mockOnExport} />)

      const qualitySelect = screen.getByRole("combobox")
      fireEvent.click(qualitySelect)

      const previewOption = screen.getByText("export.sections.preview")
      fireEvent.click(previewOption)

      // Проверяем что выбран preview
      expect(screen.getByText("export.sections.preview")).toBeInTheDocument()
    })
  })

  describe("Экспорт", () => {
    it("должен вызывать onExport с выбранными секциями", async () => {
      render(<SectionExportTab defaultSettings={defaultSettings} onExport={mockOnExport} />)

      await waitFor(() => {
        expect(screen.getByText("export.sections.sectionsTitle")).toBeInTheDocument()
      })

      const exportButton = screen.getByText(/export.sections.exportSections/)
      fireEvent.click(exportButton)

      expect(mockOnExport).toHaveBeenCalledWith(
        expect.objectContaining({
          sections: expect.arrayContaining([
            expect.objectContaining({
              name: "Marker 1",
              includeInExport: true,
            }),
          ]),
        }),
      )
    })

    it("должен отключать кнопку экспорта если не выбрано секций", async () => {
      render(<SectionExportTab defaultSettings={defaultSettings} onExport={mockOnExport} />)

      await waitFor(() => {
        expect(screen.getByText("export.sections.sectionsTitle")).toBeInTheDocument()
      })

      // Снимаем выбор со всех
      const selectAllButton = screen.getByText("export.sections.deselectAll")
      fireEvent.click(selectAllButton)

      const exportButton = screen.getByText(/export.sections.exportSections/)
      expect(exportButton).toBeDisabled()
    })

    it("должен применять настройки качества preview", async () => {
      render(<SectionExportTab defaultSettings={defaultSettings} onExport={mockOnExport} />)

      await waitFor(() => {
        expect(screen.getByText("export.sections.sectionsTitle")).toBeInTheDocument()
      })

      // Меняем качество на preview
      const qualitySelect = screen.getByRole("combobox")
      fireEvent.click(qualitySelect)
      const previewOption = screen.getByText("export.sections.preview")
      fireEvent.click(previewOption)

      const exportButton = screen.getByText(/export.sections.exportSections/)
      fireEvent.click(exportButton)

      expect(mockOnExport).toHaveBeenCalledWith(
        expect.objectContaining({
          resolution: "720",
          bitrate: 2000,
          bitrateMode: "vbr",
          quality: "normal",
        }),
      )
    })

    it("должен применять настройки качества draft", async () => {
      render(<SectionExportTab defaultSettings={defaultSettings} onExport={mockOnExport} />)

      await waitFor(() => {
        expect(screen.getByText("export.sections.sectionsTitle")).toBeInTheDocument()
      })

      // Меняем качество на draft
      const qualitySelect = screen.getByRole("combobox")
      fireEvent.click(qualitySelect)
      const draftOption = screen.getByText("export.sections.draft")
      fireEvent.click(draftOption)

      const exportButton = screen.getByText(/export.sections.exportSections/)
      fireEvent.click(exportButton)

      expect(mockOnExport).toHaveBeenCalledWith(
        expect.objectContaining({
          resolution: "1080",
          bitrate: 5000,
          bitrateMode: "vbr",
          quality: "good",
        }),
      )
    })
  })

  describe("Форматирование времени", () => {
    it("должен правильно отображать время секций", async () => {
      render(<SectionExportTab defaultSettings={defaultSettings} onExport={mockOnExport} />)

      await waitFor(() => {
        expect(screen.getByText("export.sections.sectionsTitle")).toBeInTheDocument()
      })

      // Проверяем форматирование времени
      expect(screen.getByText(/0:15 - 0:45/)).toBeInTheDocument() // Marker 1
      expect(screen.getByText(/0:45 - 1:30/)).toBeInTheDocument() // Marker 2
    })
  })
})

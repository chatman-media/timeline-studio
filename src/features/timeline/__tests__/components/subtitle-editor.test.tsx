/**
 * Тесты для SubtitleEditor компонента
 */

import { describe, expect, it, vi } from "vitest"

import { fireEvent, render, screen, waitFor } from "@/test/test-utils"

import { SubtitleEditor } from "../../components/subtitle-editor"
import type { SubtitleClip } from "@/features/subtitles/types"

// Мокаем данные субтитра
const mockSubtitle: SubtitleClip = {
  id: "subtitle-1",
  name: "Test Subtitle",
  type: "subtitle",
  mediaId: "subtitle-media-1",
  trackId: "track-1",
  text: "Test subtitle text",
  startTime: 5,
  duration: 3,
  mediaStartTime: 5,
  mediaEndTime: 8,
  offset: 0,
  volume: 1,
  speed: 1,
  isReversed: false,
  opacity: 1,
  effects: [],
  filters: [],
  transitions: [],
  isSelected: false,
  isLocked: false,
  subtitleStyleId: "style-1",
  animationIn: { type: "fade", duration: 0.5 },
  animationOut: { type: "slide", duration: 0.3 },
  subtitlePosition: { alignment: "bottom-center", marginX: 20, marginY: 20 },
  wordWrap: true,
  maxWidth: 80,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockStyles = [
  { id: "style-1", name: "Default Style" },
  { id: "style-2", name: "Custom Style" },
]

describe("SubtitleEditor Component", () => {
  describe("Component Initialization", () => {
    it("should render when open", () => {
      render(<SubtitleEditor open={true} onOpenChange={() => {}} onSave={() => {}} />)

      expect(screen.getByRole("dialog")).toBeInTheDocument()
      expect(screen.getByText("Добавить субтитр")).toBeInTheDocument()
    })

    it("should not render when closed", () => {
      render(<SubtitleEditor open={false} onOpenChange={() => {}} onSave={() => {}} />)

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("should show edit title when subtitle provided", () => {
      render(<SubtitleEditor open={true} onOpenChange={() => {}} onSave={() => {}} subtitle={mockSubtitle} />)

      expect(screen.getByText("Редактировать субтитр")).toBeInTheDocument()
    })
  })

  describe("Form Fields", () => {
    it("should populate fields with subtitle data", () => {
      render(
        <SubtitleEditor
          open={true}
          onOpenChange={() => {}}
          onSave={() => {}}
          subtitle={mockSubtitle}
          availableStyles={mockStyles}
        />,
      )

      // Проверяем текст
      const textArea = screen.getByPlaceholderText("Введите текст субтитра...")
      expect(textArea).toHaveValue("Test subtitle text")

      // Проверяем время начала
      const startTimeInput = screen.getByLabelText("Время начала (сек)")
      expect(startTimeInput).toHaveValue(5)

      // Проверяем длительность
      const durationInput = screen.getByLabelText("Длительность (сек)")
      expect(durationInput).toHaveValue(3)
    })

    it("should show empty fields for new subtitle", () => {
      render(<SubtitleEditor open={true} onOpenChange={() => {}} onSave={() => {}} />)

      const textArea = screen.getByPlaceholderText("Введите текст субтитра...")
      expect(textArea).toHaveValue("")

      const startTimeInput = screen.getByLabelText("Время начала (сек)")
      expect(startTimeInput).toHaveValue(0)

      const durationInput = screen.getByLabelText("Длительность (сек)")
      expect(durationInput).toHaveValue(2)
    })
  })

  describe("User Interactions", () => {
    it("should update text when typing", () => {
      render(<SubtitleEditor open={true} onOpenChange={() => {}} onSave={() => {}} />)

      const textArea = screen.getByPlaceholderText("Введите текст субтитра...")
      fireEvent.change(textArea, { target: { value: "New subtitle text" } })

      expect(textArea).toHaveValue("New subtitle text")
    })

    it("should update time values", () => {
      render(<SubtitleEditor open={true} onOpenChange={() => {}} onSave={() => {}} />)

      const startTimeInput = screen.getByLabelText("Время начала (сек)")
      fireEvent.change(startTimeInput, { target: { value: "10.5" } })
      expect(startTimeInput).toHaveValue(10.5)

      const durationInput = screen.getByLabelText("Длительность (сек)")
      fireEvent.change(durationInput, { target: { value: "5.5" } })
      expect(durationInput).toHaveValue(5.5)
    })

    it("should disable save button when text is empty", () => {
      render(<SubtitleEditor open={true} onOpenChange={() => {}} onSave={() => {}} />)

      const saveButton = screen.getByText("Добавить")
      expect(saveButton).toBeDisabled()

      const textArea = screen.getByPlaceholderText("Введите текст субтитра...")
      fireEvent.change(textArea, { target: { value: "Some text" } })

      expect(saveButton).toBeEnabled()
    })
  })

  describe("Save Functionality", () => {
    it("should call onSave with correct data", () => {
      const onSave = vi.fn()
      render(<SubtitleEditor open={true} onOpenChange={() => {}} onSave={onSave} />)

      // Заполняем поля
      const textArea = screen.getByPlaceholderText("Введите текст субтитра...")
      fireEvent.change(textArea, { target: { value: "Test subtitle" } })

      const startTimeInput = screen.getByLabelText("Время начала (сек)")
      fireEvent.change(startTimeInput, { target: { value: "5" } })

      const durationInput = screen.getByLabelText("Длительность (сек)")
      fireEvent.change(durationInput, { target: { value: "3" } })

      // Сохраняем
      const saveButton = screen.getByText("Добавить")
      fireEvent.click(saveButton)

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "Test subtitle",
          startTime: 5,
          duration: 3,
        }),
      )
    })

    it("should close dialog after save", () => {
      const onOpenChange = vi.fn()
      render(<SubtitleEditor open={true} onOpenChange={onOpenChange} onSave={() => {}} />)

      const textArea = screen.getByPlaceholderText("Введите текст субтитра...")
      fireEvent.change(textArea, { target: { value: "Test" } })

      const saveButton = screen.getByText("Добавить")
      fireEvent.click(saveButton)

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe("Cancel Functionality", () => {
    it("should close dialog on cancel", () => {
      const onOpenChange = vi.fn()
      render(<SubtitleEditor open={true} onOpenChange={onOpenChange} onSave={() => {}} />)

      const cancelButton = screen.getByText("Отмена")
      fireEvent.click(cancelButton)

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe("Animation Controls", () => {
    it("should show duration input when animation selected", async () => {
      render(<SubtitleEditor open={true} onOpenChange={() => {}} onSave={() => {}} />)

      // Изначально поля длительности анимации не видны
      expect(screen.queryByPlaceholderText("Длительность")).not.toBeInTheDocument()

      // Выбираем анимацию появления
      const animationInSelect = screen.getByLabelText("Анимация появления")
      fireEvent.click(animationInSelect)

      await waitFor(() => {
        const fadeOption = screen.getByText("Затухание")
        fireEvent.click(fadeOption)
      })

      // Теперь поле длительности должно появиться
      await waitFor(() => {
        expect(screen.getAllByPlaceholderText("Длительность")[0]).toBeInTheDocument()
      })
    })
  })

  describe("Style Selection", () => {
    it("should show style selector when styles available", () => {
      render(<SubtitleEditor open={true} onOpenChange={() => {}} onSave={() => {}} availableStyles={mockStyles} />)

      expect(screen.getByLabelText("Стиль субтитра")).toBeInTheDocument()
    })

    it("should not show style selector when no styles", () => {
      render(<SubtitleEditor open={true} onOpenChange={() => {}} onSave={() => {}} availableStyles={[]} />)

      expect(screen.queryByLabelText("Стиль субтитра")).not.toBeInTheDocument()
    })
  })
})

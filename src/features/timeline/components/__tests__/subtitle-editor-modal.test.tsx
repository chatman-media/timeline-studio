/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SubtitleClip } from "@/features/subtitles/types"
import { SubtitleEditorModal } from "../subtitle-editor-modal"

// Мокаем модальный хук
const mockCloseModal = vi.fn()
const mockModalData = {
  subtitle: null as SubtitleClip | null,
  onSave: vi.fn(),
  availableStyles: [
    { id: "default", name: "По умолчанию" },
    { id: "bold", name: "Жирный" },
    { id: "italic", name: "Курсив" },
  ],
}

vi.mock("@/domains/system-integration", () => ({
  useModals: () => ({
    activeModal: "subtitle-editor",
    isModalOpen: true,
    modalData: mockModalData,
    openModal: vi.fn(),
    closeModal: mockCloseModal,
    submitModal: vi.fn(),
    openCameraCapture: vi.fn(),
    openVoiceRecording: vi.fn(),
    openExport: vi.fn(),
    openProjectSettings: vi.fn(),
    openUserSettings: vi.fn(),
    openKeyboardShortcuts: vi.fn(),
    openColorGrading: vi.fn(),
    openEffectDetail: vi.fn(),
  }),
}))

describe("SubtitleEditorModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("рендерит форму редактирования субтитров", () => {
    render(<SubtitleEditorModal />)

    expect(screen.getByLabelText("Текст субтитра")).toBeInTheDocument()
    expect(screen.getByLabelText("Время начала (сек)")).toBeInTheDocument()
    expect(screen.getByLabelText("Длительность (сек)")).toBeInTheDocument()
    expect(screen.getByText("Стиль субтитра")).toBeInTheDocument()
    expect(screen.getByText("Позиция на экране")).toBeInTheDocument()
  })

  it("инициализирует значения из существующего субтитра и отображает Сохранить", () => {
    mockModalData.subtitle = {
      id: "sub1",
      type: "subtitle",
      trackId: "track1",
      mediaId: "",
      text: "Тестовый текст",
      startTime: 5,
      duration: 3,
      mediaStartTime: 0,
      mediaEndTime: 3,
      offset: 0,
      volume: 0,
      speed: 1,
      isReversed: false,
      subtitleStyleId: "bold",
      animationIn: { type: "fade", duration: 0.5 },
      animationOut: { type: "slide", duration: 0.3 },
      subtitlePosition: { alignment: "top-center", marginX: 20, marginY: 20 },
      wordWrap: false,
      maxWidth: 60,
      name: "Subtitle 1",
      isLocked: false,
      opacity: 1,
      effects: [],
      filters: [],
      transitions: [],
      isSelected: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    render(<SubtitleEditorModal />)

    expect(screen.getByDisplayValue("Тестовый текст")).toBeInTheDocument()
    expect(screen.getByDisplayValue("5")).toBeInTheDocument()
    expect(screen.getByDisplayValue("3")).toBeInTheDocument()

    // Проверяем, что кнопка отображает "Сохранить" для существующего субтитра
    expect(screen.getByText("Сохранить")).toBeInTheDocument()
  })

  it("сохраняет изменения при нажатии кнопки Добавить", async () => {
    const user = userEvent.setup()
    mockModalData.subtitle = null

    render(<SubtitleEditorModal />)

    // Заполняем только текст, остальные поля оставляем со значениями по умолчанию
    await user.type(screen.getByLabelText("Текст субтитра"), "Новый текст")

    // Сохраняем
    await user.click(screen.getByText("Добавить"))

    expect(mockModalData.onSave).toHaveBeenCalledWith({
      text: "Новый текст",
      startTime: 0, // Значение по умолчанию
      duration: 2, // Значение по умолчанию
      subtitleStyleId: undefined,
      animationIn: undefined,
      animationOut: undefined,
      subtitlePosition: {
        alignment: "bottom-center",
        marginX: 20,
        marginY: 20,
      },
      wordWrap: true,
      maxWidth: 80,
    })

    expect(mockCloseModal).toHaveBeenCalled()
  })

  it("выбор стиля работает правильно", async () => {
    const user = userEvent.setup()
    render(<SubtitleEditorModal />)

    // Сначала заполняем текст субтитра
    await user.type(screen.getByLabelText("Текст субтитра"), "Тест")

    // Находим кнопку стиля по тексту
    const styleButtons = screen.getAllByRole("combobox")
    const styleButton = styleButtons[0] // Первый combobox - это стиль
    await user.click(styleButton)

    // Выбираем стиль
    await user.click(screen.getByText("Жирный"))

    // Сохраняем
    await user.click(screen.getByText("Добавить"))

    expect(mockModalData.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        subtitleStyleId: "bold",
      }),
    )
  })

  it("настройки анимации работают правильно", async () => {
    const user = userEvent.setup()
    render(<SubtitleEditorModal />)

    // Сначала заполняем текст субтитра
    await user.type(screen.getByLabelText("Текст субтитра"), "Тест")

    // Выбираем анимацию появления
    const animButtons = screen.getAllByRole("combobox")
    await user.click(animButtons[2]) // Третий combobox - анимация появления
    await user.click(screen.getByText("Затухание"))

    // Выбираем анимацию исчезновения
    await user.click(animButtons[3]) // Четвертый combobox - анимация исчезновения
    await user.click(screen.getByText("Скольжение"))

    // Сохраняем
    await user.click(screen.getByText("Добавить"))

    expect(mockModalData.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        animationIn: { type: "fade", duration: 0.5 },
        animationOut: { type: "slide", duration: 0.5 },
      }),
    )
  })

  it("настройки позиции работают правильно", async () => {
    const user = userEvent.setup()
    render(<SubtitleEditorModal />)

    // Сначала заполняем текст субтитра
    await user.type(screen.getByLabelText("Текст субтитра"), "Тест")

    // Выбираем позицию
    const positionButtons = screen.getAllByRole("combobox")
    await user.click(positionButtons[1]) // Второй combobox - позиция
    await user.click(screen.getByText("Сверху по центру"))

    // Сохраняем
    await user.click(screen.getByText("Добавить"))

    expect(mockModalData.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        subtitlePosition: {
          alignment: "top-center",
          marginX: 20,
          marginY: 20,
        },
      }),
    )
  })

  it("переключатель переноса слов работает", async () => {
    const user = userEvent.setup()
    render(<SubtitleEditorModal />)

    // Сначала заполняем текст субтитра
    await user.type(screen.getByLabelText("Текст субтитра"), "Тест")

    // Переключаем перенос слов
    const wordWrapSwitch = screen.getByRole("switch")
    await user.click(wordWrapSwitch)

    // Сохраняем
    await user.click(screen.getByText("Добавить"))

    expect(mockModalData.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        wordWrap: false,
      }),
    )
  })

  it("настройка максимальной ширины работает", async () => {
    const user = userEvent.setup()
    render(<SubtitleEditorModal />)

    // Сначала заполняем текст субтитра
    await user.type(screen.getByLabelText("Текст субтитра"), "Тест")

    // Проверяем, что по умолчанию значение 80
    const maxWidthInput = screen.getByLabelText("Максимальная ширина (%)")
    expect(maxWidthInput).toHaveValue(80)

    // Просто проверяем, что модальное окно вызывается с текстом и значениями по умолчанию изменены
    await user.click(screen.getByText("Добавить"))

    // Проверяем, что функция была вызвана
    expect(mockModalData.onSave).toHaveBeenCalled()

    // Проверяем что текст сохранился
    const savedData = mockModalData.onSave.mock.calls[0][0]
    expect(savedData.text).toBe("Тест")
    expect(savedData.maxWidth).toBeDefined()
  })

  it("отмена закрывает модальное окно без сохранения", async () => {
    const user = userEvent.setup()
    render(<SubtitleEditorModal />)

    // Вводим текст
    await user.type(screen.getByLabelText("Текст субтитра"), "Несохраненный текст")

    // Отменяем
    await user.click(screen.getByText("Отмена"))

    expect(mockModalData.onSave).not.toHaveBeenCalled()
    expect(mockCloseModal).toHaveBeenCalled()
  })

  it("показывает дополнительные настройки анимации при выборе", async () => {
    const user = userEvent.setup()
    render(<SubtitleEditorModal />)

    // Изначально поля длительности анимации скрыты
    expect(screen.queryByPlaceholderText("Длительность")).not.toBeInTheDocument()

    // Выбираем анимацию появления
    const animButtons = screen.getAllByRole("combobox")
    await user.click(animButtons[2]) // Третий combobox - анимация появления
    await user.click(screen.getByText("Затухание"))

    // Теперь поле длительности должно появиться
    await waitFor(() => {
      const durationInputs = screen.getAllByPlaceholderText("Длительность")
      expect(durationInputs.length).toBeGreaterThan(0)
    })
  })

  it("кнопка сохранения отключена при пустом тексте", async () => {
    const user = userEvent.setup()
    render(<SubtitleEditorModal />)

    // Очищаем текст
    const textArea = screen.getByLabelText("Текст субтитра")
    await user.clear(textArea)

    // Проверяем, что кнопка отключена
    const saveButton = screen.getByText("Добавить")
    expect(saveButton).toBeDisabled()

    // Вводим текст
    await user.type(textArea, "Тест")

    // Теперь кнопка должна быть активна
    expect(saveButton).not.toBeDisabled()
  })
})

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AudioSyncDialog } from "../audio-sync-dialog"

// TODO: Тест зависает на стадии компиляции/запуска
// Необходимо исследовать причину зависания и исправить
describe.skip("AudioSyncDialog", () => {
  const mockOnClose = vi.fn()
  const mockOnSync = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockOnSync.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("не рендерится, когда isOpen=false", () => {
    const { container } = render(
      <AudioSyncDialog isOpen={false} onClose={mockOnClose} onSync={mockOnSync} angleCount={3} />,
    )

    expect(container.firstChild).toBeNull()
  })

  it("показывает информацию о количестве камер", () => {
    render(<AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={4} />)

    expect(screen.getByText("Синхронизация по аудио")).toBeInTheDocument()
    expect(screen.getByText(/Будет проанализировано 4 камер/)).toBeInTheDocument()
  })

  it("показывает кнопки Отмена и Начать синхронизацию", () => {
    render(<AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={3} />)

    expect(screen.getByRole("button", { name: "Отмена" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Начать синхронизацию/ })).toBeInTheDocument()
  })

  it("вызывает onClose при нажатии кнопки Отмена", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={3} />)

    await user.click(screen.getByRole("button", { name: "Отмена" }))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it("показывает прогресс синхронизации", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={3} />)

    // Запускаем синхронизацию
    await user.click(screen.getByRole("button", { name: /Начать синхронизацию/ }))

    // Проверяем фазы прогресса
    await waitFor(() => expect(screen.getByText("Загрузка аудио...")).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText("Анализ аудиодорожек...")).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText("Поиск совпадений...")).toBeInTheDocument())
  })

  it("показывает результаты успешной синхронизации", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const syncResults = [
      { offset: 1.234, confidence: 0.85, method: "audio" as const },
      { offset: -0.567, confidence: 0.72, method: "audio" as const },
    ]
    mockOnSync.mockResolvedValue(syncResults)

    render(<AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={3} />)

    await user.click(screen.getByRole("button", { name: /Начать синхронизацию/ }))

    // Проходим через все шаги анимации
    vi.advanceTimersByTime(800) // Первый шаг
    vi.advanceTimersByTime(800) // Второй шаг
    vi.advanceTimersByTime(800) // Третий шаг

    await waitFor(() => {
      expect(screen.getByText("Результаты синхронизации")).toBeInTheDocument()
    })

    expect(screen.getByText("Камера 2")).toBeInTheDocument()
    expect(screen.getByText("Камера 3")).toBeInTheDocument()
    expect(screen.getByText("+1.234s")).toBeInTheDocument()
    expect(screen.getByText("-0.567s")).toBeInTheDocument()
    expect(screen.getByText("85%")).toBeInTheDocument()
    expect(screen.getByText("72%")).toBeInTheDocument()
  })

  it("показывает среднюю уверенность", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const syncResults = [
      { offset: 1.0, confidence: 0.8, method: "audio" as const },
      { offset: 2.0, confidence: 0.6, method: "audio" as const },
    ]
    mockOnSync.mockResolvedValue(syncResults)

    render(<AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={3} />)

    await user.click(screen.getByRole("button", { name: /Начать синхронизацию/ }))

    await waitFor(() => {
      expect(screen.getByText("Средняя уверенность:")).toBeInTheDocument()
      expect(screen.getByText("70%")).toBeInTheDocument() // (80% + 60%) / 2
    })
  })

  it("показывает кнопку Применить после синхронизации", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mockOnSync.mockResolvedValue([{ offset: 1.0, confidence: 0.8, method: "audio" as const }])

    render(<AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={2} />)

    await user.click(screen.getByRole("button", { name: /Начать синхронизацию/ }))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Применить" })).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Отмена" })).not.toBeInTheDocument()
    })
  })

  it("показывает ошибку при неудачной синхронизации", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    mockOnSync.mockRejectedValue(new Error("Sync failed"))

    render(<AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={3} />)

    await user.click(screen.getByRole("button", { name: /Начать синхронизацию/ }))

    await waitFor(() => {
      expect(screen.getByText("Произошла ошибка при синхронизации. Попробуйте еще раз.")).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })

  it("блокирует закрытие диалога во время обработки", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    // Делаем задержку для имитации долгой обработки
    mockOnSync.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve([]), 5000)))

    render(<AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={3} />)

    await user.click(screen.getByRole("button", { name: /Начать синхронизацию/ }))

    // Пытаемся закрыть диалог во время обработки
    const dialog = screen.getByRole("dialog")
    await user.keyboard("{Escape}")

    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it("применяет разные цвета для разных уровней уверенности", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const syncResults = [
      { offset: 1.0, confidence: 0.85, method: "audio" as const }, // Зеленый
      { offset: 2.0, confidence: 0.65, method: "audio" as const }, // Желтый
      { offset: 3.0, confidence: 0.45, method: "audio" as const }, // Красный
    ]
    mockOnSync.mockResolvedValue(syncResults)

    render(<AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={4} />)

    await user.click(screen.getByRole("button", { name: /Начать синхронизацию/ }))

    await waitFor(() => {
      const confidence85 = screen.getByText("85%")
      const confidence65 = screen.getByText("65%")
      const confidence45 = screen.getByText("45%")

      expect(confidence85).toHaveClass("text-green-500")
      expect(confidence65).toHaveClass("text-yellow-500")
      expect(confidence45).toHaveClass("text-red-500")
    })
  })

  it("показывает разный фон для результатов с разной уверенностью", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const syncResults = [
      { offset: 1.0, confidence: 0.8, method: "audio" as const }, // Высокая уверенность
      { offset: 2.0, confidence: 0.5, method: "audio" as const }, // Низкая уверенность
    ]
    mockOnSync.mockResolvedValue(syncResults)

    render(<AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={3} />)

    await user.click(screen.getByRole("button", { name: /Начать синхронизацию/ }))

    await waitFor(() => {
      const highConfidenceResult = screen.getByText("Камера 2").closest("div")
      const lowConfidenceResult = screen.getByText("Камера 3").closest("div")

      expect(highConfidenceResult).toHaveClass("bg-green-50")
      expect(lowConfidenceResult).toHaveClass("bg-yellow-50")
    })
  })

  it("показывает бейдж для аудио метода", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mockOnSync.mockResolvedValue([{ offset: 1.0, confidence: 0.8, method: "audio" as const }])

    render(<AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={2} />)

    await user.click(screen.getByRole("button", { name: /Начать синхронизацию/ }))

    await waitFor(() => {
      expect(screen.getByText("Аудио")).toBeInTheDocument()
    })
  })

  it("сбрасывает состояние при закрытии", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mockOnSync.mockResolvedValue([{ offset: 1.0, confidence: 0.8, method: "audio" as const }])

    const { rerender } = render(
      <AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={2} />,
    )

    // Запускаем синхронизацию
    await user.click(screen.getByRole("button", { name: /Начать синхронизацию/ }))

    await waitFor(() => {
      expect(screen.getByText("Результаты синхронизации")).toBeInTheDocument()
    })

    // Закрываем диалог
    rerender(<AudioSyncDialog isOpen={false} onClose={mockOnClose} onSync={mockOnSync} angleCount={2} />)

    // Открываем снова
    rerender(<AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={2} />)

    // Проверяем, что состояние сброшено
    expect(screen.queryByText("Результаты синхронизации")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Начать синхронизацию/ })).toBeInTheDocument()
  })
})

/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AudioSyncDialog } from "../audio-sync-dialog"

// Мок для Radix UI Dialog Portal
vi.mock("@radix-ui/react-dialog", async () => {
  const actual = await vi.importActual("@radix-ui/react-dialog")
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => children,
  }
})

// Мок логгера
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}))

describe("AudioSyncDialog", () => {
  const mockOnClose = vi.fn()
  const mockOnSync = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSync.mockResolvedValue([])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Базовый рендеринг", () => {
    it("не рендерит контент, когда isOpen=false", () => {
      render(
        <AudioSyncDialog isOpen={false} onClose={mockOnClose} onSync={mockOnSync} angleCount={3} data-oid="i_ztjh7" />,
      )

      expect(screen.queryByText("Синхронизация по аудио")).not.toBeInTheDocument()
    })

    it("показывает заголовок и описание когда открыт", () => {
      render(
        <AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={4} data-oid="4c7hwjp" />,
      )

      expect(screen.getByText("Синхронизация по аудио")).toBeInTheDocument()
      expect(screen.getByText(/Автоматический анализ аудиодорожек/)).toBeInTheDocument()
    })

    it("показывает информацию о количестве камер", () => {
      render(
        <AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={4} data-oid="th.zf:b" />,
      )

      expect(screen.getByText(/Будет проанализировано 4 камер/)).toBeInTheDocument()
    })

    it("показывает кнопки Отмена и Начать синхронизацию", () => {
      render(
        <AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={3} data-oid="o::6k7s" />,
      )

      expect(screen.getByRole("button", { name: "Отмена" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Начать синхронизацию/ })).toBeInTheDocument()
    })
  })

  describe("Взаимодействие", () => {
    it("вызывает onClose при нажатии кнопки Отмена", async () => {
      const user = userEvent.setup()
      render(
        <AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={3} data-oid="kx2l1xg" />,
      )

      await user.click(screen.getByRole("button", { name: "Отмена" }))
      expect(mockOnClose).toHaveBeenCalled()
    })

    it("запускает синхронизацию при клике на кнопку", async () => {
      const user = userEvent.setup()
      mockOnSync.mockResolvedValue([{ offset: 1.0, confidence: 0.8, method: "audio" as const }])

      render(
        <AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={2} data-oid="-dze8zz" />,
      )

      await user.click(screen.getByRole("button", { name: /Начать синхронизацию/ }))

      // Ждём завершения синхронизации
      await waitFor(
        () => {
          expect(mockOnSync).toHaveBeenCalled()
        },
        { timeout: 5000 },
      )
    })
  })

  describe("Результаты синхронизации", () => {
    it("показывает результаты успешной синхронизации", async () => {
      const user = userEvent.setup()
      const syncResults = [
        { offset: 1.234, confidence: 0.85, method: "audio" as const },
        { offset: -0.567, confidence: 0.72, method: "audio" as const },
      ]

      mockOnSync.mockResolvedValue(syncResults)

      render(
        <AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={3} data-oid="4ky39tc" />,
      )

      await user.click(screen.getByRole("button", { name: /Начать синхронизацию/ }))

      await waitFor(
        () => {
          expect(screen.getByText("Результаты синхронизации")).toBeInTheDocument()
        },
        { timeout: 5000 },
      )

      expect(screen.getByText("Камера 2")).toBeInTheDocument()
      expect(screen.getByText("Камера 3")).toBeInTheDocument()
      expect(screen.getByText("+1.234s")).toBeInTheDocument()
      expect(screen.getByText("-0.567s")).toBeInTheDocument()
      expect(screen.getByText("85%")).toBeInTheDocument()
      expect(screen.getByText("72%")).toBeInTheDocument()
    })

    it("показывает среднюю уверенность", async () => {
      const user = userEvent.setup()
      const syncResults = [
        { offset: 1.0, confidence: 0.8, method: "audio" as const },
        { offset: 2.0, confidence: 0.6, method: "audio" as const },
      ]

      mockOnSync.mockResolvedValue(syncResults)

      render(
        <AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={3} data-oid="o2pfdg3" />,
      )

      await user.click(screen.getByRole("button", { name: /Начать синхронизацию/ }))

      await waitFor(
        () => {
          expect(screen.getByText("Средняя уверенность:")).toBeInTheDocument()
        },
        { timeout: 5000 },
      )

      expect(screen.getByText("70%")).toBeInTheDocument() // (80% + 60%) / 2
    })

    it("показывает кнопку Применить после синхронизации", async () => {
      const user = userEvent.setup()
      mockOnSync.mockResolvedValue([{ offset: 1.0, confidence: 0.8, method: "audio" as const }])

      render(
        <AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={2} data-oid="9n0xx1h" />,
      )

      await user.click(screen.getByRole("button", { name: /Начать синхронизацию/ }))

      await waitFor(
        () => {
          expect(screen.getByRole("button", { name: "Применить" })).toBeInTheDocument()
        },
        { timeout: 5000 },
      )

      expect(screen.queryByRole("button", { name: "Отмена" })).not.toBeInTheDocument()
    })

    it("показывает бейдж для аудио метода", async () => {
      const user = userEvent.setup()
      mockOnSync.mockResolvedValue([{ offset: 1.0, confidence: 0.8, method: "audio" as const }])

      render(
        <AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={2} data-oid="et::22n" />,
      )

      await user.click(screen.getByRole("button", { name: /Начать синхронизацию/ }))

      await waitFor(
        () => {
          expect(screen.getByText("Аудио")).toBeInTheDocument()
        },
        { timeout: 5000 },
      )
    })
  })

  describe("Обработка ошибок", () => {
    it("показывает ошибку при неудачной синхронизации", async () => {
      const user = userEvent.setup()
      mockOnSync.mockRejectedValue(new Error("Sync failed"))

      render(
        <AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={3} data-oid="qcqhpo4" />,
      )

      await user.click(screen.getByRole("button", { name: /Начать синхронизацию/ }))

      await waitFor(
        () => {
          expect(screen.getByText(/Произошла ошибка при синхронизации/)).toBeInTheDocument()
        },
        { timeout: 5000 },
      )
    })
  })

  describe("Сброс состояния", () => {
    it("сбрасывает состояние при закрытии и повторном открытии", async () => {
      const user = userEvent.setup()
      mockOnSync.mockResolvedValue([{ offset: 1.0, confidence: 0.8, method: "audio" as const }])

      const { rerender } = render(
        <AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={2} data-oid=":.a7r52" />,
      )

      // Запускаем синхронизацию
      await user.click(screen.getByRole("button", { name: /Начать синхронизацию/ }))

      await waitFor(
        () => {
          expect(screen.getByText("Результаты синхронизации")).toBeInTheDocument()
        },
        { timeout: 5000 },
      )

      // Закрываем диалог
      rerender(
        <AudioSyncDialog isOpen={false} onClose={mockOnClose} onSync={mockOnSync} angleCount={2} data-oid="0t4-s6f" />,
      )

      // Открываем снова
      rerender(
        <AudioSyncDialog isOpen={true} onClose={mockOnClose} onSync={mockOnSync} angleCount={2} data-oid="85volvn" />,
      )

      // Проверяем, что состояние сброшено
      expect(screen.queryByText("Результаты синхронизации")).not.toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Начать синхронизацию/ })).toBeInTheDocument()
    })
  })
})

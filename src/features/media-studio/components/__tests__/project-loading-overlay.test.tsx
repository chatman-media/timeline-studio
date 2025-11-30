import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ProjectLoadingOverlay } from "../project-loading-overlay"

const mockUseApp = vi.hoisted(() => vi.fn())

vi.mock("@/domains/project-management/providers/app-provider", () => ({
  useApp: mockUseApp,
}))

describe("ProjectLoadingOverlay", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("отображение состояния подключения", () => {
    it("не должен рендерить ничего когда нет подключения и нет ошибки", () => {
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: null,
      })

      const { container } = render(<ProjectLoadingOverlay />)

      expect(container.firstChild).toBeNull()
    })

    it("должен показывать индикатор загрузки при isConnecting=true", () => {
      mockUseApp.mockReturnValue({
        isConnecting: true,
        connectionError: null,
      })

      render(<ProjectLoadingOverlay />)

      expect(screen.getByText("Загрузка проекта...")).toBeInTheDocument()
      const spinner = document.querySelector(".animate-spin")
      expect(spinner).toBeInTheDocument()
    })

    it("должен показывать ошибку подключения", () => {
      const errorMessage = "Не удалось подключиться к проекту"
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: errorMessage,
      })

      render(<ProjectLoadingOverlay />)

      expect(screen.getByText("Ошибка подключения")).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it("должен показывать ошибку даже когда isConnecting=true", () => {
      const errorMessage = "Ошибка соединения"
      mockUseApp.mockReturnValue({
        isConnecting: true,
        connectionError: errorMessage,
      })

      render(<ProjectLoadingOverlay />)

      // Должен показать и индикатор загрузки и ошибку
      expect(screen.getByText("Загрузка проекта...")).toBeInTheDocument()
      expect(screen.getByText("Ошибка подключения")).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  describe("структура и стили", () => {
    it("должен иметь правильную структуру DOM для загрузки", () => {
      mockUseApp.mockReturnValue({
        isConnecting: true,
        connectionError: null,
      })

      const { container } = render(<ProjectLoadingOverlay />)

      // Проверяем overlay
      const overlay = container.querySelector(
        ".fixed.inset-0.z-50.flex.items-center.justify-center.bg-background\\/80.backdrop-blur-sm",
      )
      expect(overlay).toBeInTheDocument()

      // Проверяем контейнер с gap
      const contentContainer = container.querySelector(".flex.flex-col.items-center.gap-4")
      expect(contentContainer).toBeInTheDocument()

      // Проверяем spinner
      const spinner = container.querySelector(".h-8.w-8.animate-spin.rounded-full")
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass("border-4", "border-primary", "border-t-transparent")
    })

    it("должен иметь правильную структуру DOM для ошибки", () => {
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: "Test error",
      })

      const { container } = render(<ProjectLoadingOverlay />)

      // Проверяем контейнер ошибки
      const errorContainer = container.querySelector(".rounded-lg.bg-destructive\\/10.p-4.text-destructive")
      expect(errorContainer).toBeInTheDocument()

      // Проверяем текст ошибки
      const errorTitle = errorContainer?.querySelector(".font-medium")
      expect(errorTitle).toBeInTheDocument()
      expect(errorTitle).toHaveTextContent("Ошибка подключения")

      const errorMessage = errorContainer?.querySelector(".text-sm")
      expect(errorMessage).toBeInTheDocument()
      expect(errorMessage).toHaveTextContent("Test error")
    })

    it("должен иметь правильный z-index для overlay", () => {
      mockUseApp.mockReturnValue({
        isConnecting: true,
        connectionError: null,
      })

      const { container } = render(<ProjectLoadingOverlay />)

      const overlay = container.querySelector(".z-50")
      expect(overlay).toBeInTheDocument()
    })
  })

  describe("edge cases", () => {
    it("должен обрабатывать пустую строку ошибки", () => {
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: "",
      })

      const { container } = render(<ProjectLoadingOverlay />)

      // Пустая строка не считается ошибкой
      expect(container.firstChild).toBeNull()
    })

    it("должен обрабатывать длинные сообщения об ошибках", () => {
      const longError = "Это очень длинное сообщение об ошибке ".repeat(10)
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: longError,
      })

      render(<ProjectLoadingOverlay />)

      // Проверяем через partial match, так как текст может быть разбит на части
      expect(screen.getByText(/Это очень длинное сообщение об ошибке/)).toBeInTheDocument()
    })

    it("должен обрабатывать специальные символы в сообщении об ошибке", () => {
      const specialError = "Ошибка: <script>alert('test')</script> & symbols"
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: specialError,
      })

      render(<ProjectLoadingOverlay />)

      // React автоматически экранирует HTML
      expect(screen.getByText(specialError)).toBeInTheDocument()
    })
  })

  describe("переходы состояний", () => {
    it("должен корректно обновляться при изменении состояния", () => {
      const { rerender } = render(<ProjectLoadingOverlay />)

      // Начальное состояние - ничего не показывать
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: null,
      })
      rerender(<ProjectLoadingOverlay />)

      // Переход к состоянию загрузки
      mockUseApp.mockReturnValue({
        isConnecting: true,
        connectionError: null,
      })
      rerender(<ProjectLoadingOverlay />)
      expect(screen.getByText("Загрузка проекта...")).toBeInTheDocument()

      // Переход к ошибке
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: "Ошибка загрузки",
      })
      rerender(<ProjectLoadingOverlay />)
      expect(screen.getByText("Ошибка подключения")).toBeInTheDocument()

      // Возврат к нормальному состоянию
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: null,
      })
      rerender(<ProjectLoadingOverlay />)
      expect(screen.queryByText("Загрузка проекта...")).not.toBeInTheDocument()
    })
  })

  describe("accessibility", () => {
    it("должен иметь читаемый текст для загрузки", () => {
      mockUseApp.mockReturnValue({
        isConnecting: true,
        connectionError: null,
      })

      render(<ProjectLoadingOverlay />)

      const loadingText = screen.getByText("Загрузка проекта...")
      expect(loadingText).toHaveClass("text-lg", "font-medium")
    })

    it("должен иметь читаемый текст для ошибки", () => {
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: "Test error",
      })

      render(<ProjectLoadingOverlay />)

      const errorTitle = screen.getByText("Ошибка подключения")
      expect(errorTitle).toHaveClass("font-medium")

      const errorMessage = screen.getByText("Test error")
      expect(errorMessage).toHaveClass("text-sm")
    })
  })
})

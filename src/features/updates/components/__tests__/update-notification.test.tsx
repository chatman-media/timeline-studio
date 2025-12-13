/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для компонента UpdateNotification
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { UpdateNotification } from "../update-notification"

// Мокаем хук
const mockUseUpdateManager = vi.fn()
vi.mock("../../hooks/use-update-manager", () => ({
  useUpdateManager: () => mockUseUpdateManager(),
}))

describe("UpdateNotification", () => {
  const defaultMockReturn = {
    isUpdateAvailable: true,
    isDownloading: false,
    isReadyToInstall: false,
    isInstalling: false,
    isInstalled: false,
    isError: false,
    availableUpdate: {
      version: "1.2.0",
      notes: "Новые функции",
      pub_date: "2024-01-01",
    },
    error: null,
    progress: null,
    downloadUpdate: vi.fn(),
    installUpdate: vi.fn(),
    dismiss: vi.fn(),
    retry: vi.fn(),
  }

  beforeEach(() => {
    mockUseUpdateManager.mockReturnValue(defaultMockReturn)
  })

  it("не рендерится когда нет активного состояния", () => {
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isUpdateAvailable: false,
    })

    const { container } = render(<UpdateNotification />)
    expect(container.firstChild).toBeNull()
  })

  it("показывает информацию о доступном обновлении", () => {
    render(<UpdateNotification />)

    expect(screen.getByText("Доступно обновление")).toBeInTheDocument()
    expect(screen.getByText("Версия 1.2.0 готова к загрузке")).toBeInTheDocument()
    expect(screen.getByText("Новое")).toBeInTheDocument()
  })

  it("показывает кнопки действий для загрузки", () => {
    render(<UpdateNotification />)

    expect(screen.getByRole("button", { name: "Скачать" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Пропустить" })).toBeInTheDocument()
  })

  it("вызывает downloadUpdate при клике на кнопку Скачать", async () => {
    const user = userEvent.setup()
    const downloadUpdate = vi.fn()
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      downloadUpdate,
    })

    render(<UpdateNotification />)

    await user.click(screen.getByRole("button", { name: "Скачать" }))
    expect(downloadUpdate).toHaveBeenCalled()
  })

  it("показывает прогресс загрузки", () => {
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isUpdateAvailable: false,
      isDownloading: true,
      progress: {
        downloaded: 50000,
        total: 100000,
        percentage: 50,
      },
    })

    render(<UpdateNotification showProgress />)

    expect(screen.getByText("Загрузка обновления...")).toBeInTheDocument()
    expect(screen.getByText("50%")).toBeInTheDocument()
    expect(screen.getByText("48.8 KB / 97.7 KB")).toBeInTheDocument()
  })

  it("показывает состояние готовности к установке", () => {
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isUpdateAvailable: false,
      isReadyToInstall: true,
    })

    render(<UpdateNotification />)

    expect(screen.getByText("Готово к установке")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Установить" })).toBeInTheDocument()
  })

  it("показывает состояние ошибки", () => {
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isUpdateAvailable: false,
      isError: true,
      error: "Ошибка сети",
    })

    render(<UpdateNotification />)

    expect(screen.getByText("Ошибка обновления")).toBeInTheDocument()
    expect(screen.getByText("Ошибка сети")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Повторить" })).toBeInTheDocument()
  })

  it("вызывает onClose при закрытии", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const dismiss = vi.fn()
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      dismiss,
    })

    render(<UpdateNotification onClose={onClose} />)

    const closeButton = screen.getByRole("button", { name: "X" }) // Кнопка с иконкой X
    await user.click(closeButton)

    expect(dismiss).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it("применяет переданные классы", () => {
    render(<UpdateNotification className="custom-class" />)

    const card = screen.getByText("Доступно обновление").closest(".custom-class")
    expect(card).toBeInTheDocument()
  })

  it("форматирует байты корректно", () => {
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isUpdateAvailable: false,
      isDownloading: true,
      progress: {
        downloaded: 1024,
        total: 1048576,
        percentage: 0,
      },
    })

    render(<UpdateNotification showProgress />)

    expect(screen.getByText("1 KB / 1 MB")).toBeInTheDocument()
  })

  it("показывает информацию о версии при загрузке", () => {
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isUpdateAvailable: false,
      isDownloading: true,
      availableUpdate: {
        version: "2.0.0",
        notes: "Большое обновление",
        pub_date: "2024-12-01",
      },
    })

    render(<UpdateNotification />)

    expect(screen.getByText("Версия 2.0.0")).toBeInTheDocument()
    expect(screen.getByText("Большое обновление")).toBeInTheDocument()
  })
})

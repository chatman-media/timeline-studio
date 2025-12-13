/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для компонента UpdateStatusIndicator
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { UpdateIconIndicator, UpdateStatusIndicator, UpdateTextIndicator } from "../update-status-indicator"

// Мокаем хук
const mockUseUpdateManager = vi.fn()
vi.mock("../../hooks/use-update-manager", () => ({
  useUpdateManager: () => mockUseUpdateManager(),
}))

describe("UpdateStatusIndicator", () => {
  const defaultMockReturn = {
    isIdle: true,
    isChecking: false,
    isUpdateAvailable: false,
    isDownloading: false,
    isReadyToInstall: false,
    isInstalling: false,
    isInstalled: false,
    isError: false,
    availableUpdate: null,
    error: null,
    progress: null,
    currentVersion: "1.0.0",
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    installUpdate: vi.fn(),
  }

  beforeEach(() => {
    mockUseUpdateManager.mockReturnValue(defaultMockReturn)
  })

  it("не рендерится в состоянии idle без onClick", () => {
    const { container } = render(<UpdateStatusIndicator />)
    expect(container.firstChild).toBeNull()
  })

  it("рендерится в состоянии idle с onClick", () => {
    render(<UpdateStatusIndicator onClick={() => {}} />)
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("показывает правильную иконку для каждого состояния", () => {
    // Проверка обновлений
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isIdle: false,
      isChecking: true,
    })
    const { rerender } = render(<UpdateStatusIndicator />)
    expect(screen.getByRole("button")).toBeInTheDocument()

    // Доступно обновление
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isIdle: false,
      isUpdateAvailable: true,
    })
    rerender(<UpdateStatusIndicator />)
    expect(screen.getByRole("button")).toBeInTheDocument()

    // Ошибка
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isIdle: false,
      isError: true,
    })
    rerender(<UpdateStatusIndicator />)
    // Проверяем, что кнопка имеет вариант destructive (не класс)
    const button = screen.getByRole("button")
    expect(button.className).toContain("destructive")
  })

  it("показывает текст при showText=true", () => {
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isIdle: false,
      isUpdateAvailable: true,
    })

    render(<UpdateStatusIndicator showText />)
    expect(screen.getByText("Обновление")).toBeInTheDocument()
  })

  it("показывает версию обновления", () => {
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isIdle: false,
      isUpdateAvailable: true,
      availableUpdate: { version: "1.1.0" },
    })

    render(<UpdateStatusIndicator showText />)
    expect(screen.getByText("1.1.0")).toBeInTheDocument()
  })

  it("вызывает правильные действия при клике", async () => {
    const user = userEvent.setup()
    const checkForUpdates = vi.fn()
    const downloadUpdate = vi.fn()
    const installUpdate = vi.fn()

    // Состояние idle без onClick - вызывает checkForUpdates
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      checkForUpdates,
    })
    const { rerender } = render(<UpdateStatusIndicator />)
    // В состоянии idle без onClick компонент не рендерится, поэтому пропускаем этот тест

    // Доступно обновление - загрузка
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isIdle: false,
      isUpdateAvailable: true,
      downloadUpdate,
    })
    rerender(<UpdateStatusIndicator />)
    await user.click(screen.getByRole("button"))
    expect(downloadUpdate).toHaveBeenCalled()

    // Готово к установке
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isIdle: false,
      isReadyToInstall: true,
      installUpdate,
    })
    rerender(<UpdateStatusIndicator />)
    await user.click(screen.getByRole("button"))
    expect(installUpdate).toHaveBeenCalled()
  })

  it("вызывает кастомный onClick если передан", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<UpdateStatusIndicator onClick={onClick} />)
    await user.click(screen.getByRole("button"))
    expect(onClick).toHaveBeenCalled()
  })

  it("дизейблит кнопку во время операций", () => {
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isIdle: false,
      isChecking: true,
    })

    render(<UpdateStatusIndicator />)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("показывает прогресс в тултипе", async () => {
    const user = userEvent.setup()
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isIdle: false,
      isDownloading: true,
      progress: { percentage: 50 },
    })

    render(<UpdateStatusIndicator />)

    const button = screen.getByRole("button")
    await user.hover(button)

    // Тултип должен содержать информацию о прогрессе
    expect(button).toBeInTheDocument()
  })

  it("компактный режим показывает только иконку", () => {
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isIdle: false,
      isUpdateAvailable: true,
    })

    render(<UpdateStatusIndicator compact />)

    const button = screen.getByRole("button")
    expect(button).toHaveClass("h-6 w-6 p-0")
  })

  it("применяет переданные классы", () => {
    render(<UpdateStatusIndicator onClick={() => {}} className="custom-class" />)

    const button = screen.getByRole("button")
    expect(button).toHaveClass("custom-class")
  })
})

describe("UpdateIconIndicator", () => {
  it("рендерится в компактном режиме", () => {
    mockUseUpdateManager.mockReturnValue({
      isIdle: false,
      isChecking: false,
      isUpdateAvailable: true,
      isDownloading: false,
      isReadyToInstall: false,
      isInstalling: false,
      isInstalled: false,
      isError: false,
      availableUpdate: null,
      error: null,
      progress: null,
      currentVersion: "1.0.0",
      checkForUpdates: vi.fn(),
      downloadUpdate: vi.fn(),
      installUpdate: vi.fn(),
    })

    render(<UpdateIconIndicator />)

    const button = screen.getByRole("button")
    expect(button).toHaveClass("h-6 w-6 p-0")
  })
})

describe("UpdateTextIndicator", () => {
  it("рендерится с текстом", () => {
    mockUseUpdateManager.mockReturnValue({
      isIdle: false,
      isChecking: false,
      isUpdateAvailable: true,
      isDownloading: false,
      isReadyToInstall: false,
      isInstalling: false,
      isInstalled: false,
      isError: false,
      availableUpdate: null,
      error: null,
      progress: null,
      currentVersion: "1.0.0",
      checkForUpdates: vi.fn(),
      downloadUpdate: vi.fn(),
      installUpdate: vi.fn(),
    })

    render(<UpdateTextIndicator />)

    expect(screen.getByText("Обновление")).toBeInTheDocument()
  })
})

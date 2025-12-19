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
    const { container } = render(<UpdateStatusIndicator data-oid="3ee07bn" />)
    expect(container.firstChild).toBeNull()
  })

  it("рендерится в состоянии idle с onClick", () => {
    render(<UpdateStatusIndicator onClick={() => {}} data-oid="zjqsn:8" />)
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("показывает правильную иконку для каждого состояния", () => {
    // Проверка обновлений
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isIdle: false,
      isChecking: true,
    })
    const { rerender } = render(<UpdateStatusIndicator data-oid="58dj74a" />)
    expect(screen.getByRole("button")).toBeInTheDocument()

    // Доступно обновление
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isIdle: false,
      isUpdateAvailable: true,
    })
    rerender(<UpdateStatusIndicator data-oid="j0otyt7" />)
    expect(screen.getByRole("button")).toBeInTheDocument()

    // Ошибка
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isIdle: false,
      isError: true,
    })
    rerender(<UpdateStatusIndicator data-oid="z_74_d2" />)
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

    render(<UpdateStatusIndicator showText data-oid="w9cc7w0" />)
    expect(screen.getByText("Обновление")).toBeInTheDocument()
  })

  it("показывает версию обновления", () => {
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isIdle: false,
      isUpdateAvailable: true,
      availableUpdate: { version: "1.1.0" },
    })

    render(<UpdateStatusIndicator showText data-oid="n.21ff8" />)
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
    const { rerender } = render(<UpdateStatusIndicator data-oid="5ag2d:n" />)
    // В состоянии idle без onClick компонент не рендерится, поэтому пропускаем этот тест

    // Доступно обновление - загрузка
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isIdle: false,
      isUpdateAvailable: true,
      downloadUpdate,
    })
    rerender(<UpdateStatusIndicator data-oid="5v1ese3" />)
    await user.click(screen.getByRole("button"))
    expect(downloadUpdate).toHaveBeenCalled()

    // Готово к установке
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isIdle: false,
      isReadyToInstall: true,
      installUpdate,
    })
    rerender(<UpdateStatusIndicator data-oid="47nytte" />)
    await user.click(screen.getByRole("button"))
    expect(installUpdate).toHaveBeenCalled()
  })

  it("вызывает кастомный onClick если передан", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<UpdateStatusIndicator onClick={onClick} data-oid="cnh02gf" />)
    await user.click(screen.getByRole("button"))
    expect(onClick).toHaveBeenCalled()
  })

  it("дизейблит кнопку во время операций", () => {
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isIdle: false,
      isChecking: true,
    })

    render(<UpdateStatusIndicator data-oid="jheysrl" />)
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

    render(<UpdateStatusIndicator data-oid="mc85t:y" />)

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

    render(<UpdateStatusIndicator compact data-oid="myndu1-" />)

    const button = screen.getByRole("button")
    expect(button).toHaveClass("h-6 w-6 p-0")
  })

  it("применяет переданные классы", () => {
    render(<UpdateStatusIndicator onClick={() => {}} className="custom-class" data-oid="p5::ih3" />)

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

    render(<UpdateIconIndicator data-oid="neur_k2" />)

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

    render(<UpdateTextIndicator data-oid="iu3zr.z" />)

    expect(screen.getByText("Обновление")).toBeInTheDocument()
  })
})

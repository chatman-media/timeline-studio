/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для компонента UpdateSettings
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { CompactUpdateSettings, UpdateSettings } from "../update-settings"

// Мокаем хук
const mockUseUpdateManager = vi.fn()
vi.mock("../../hooks/use-update-manager", () => ({
  useUpdateManager: () => mockUseUpdateManager(),
}))

describe("UpdateSettings", () => {
  const defaultMockReturn = {
    currentVersion: "1.0.0",
    availableUpdate: null,
    isChecking: false,
    isUpdateAvailable: false,
    autoCheckSettings: {
      enabled: false,
      intervalMinutes: 60,
    },
    checkForUpdates: vi.fn(),
    enableAutoCheck: vi.fn(),
    disableAutoCheck: vi.fn(),
  }

  beforeEach(() => {
    mockUseUpdateManager.mockReturnValue(defaultMockReturn)
  })

  it("рендерится без ошибок", () => {
    render(<UpdateSettings data-oid=":r2k9in" />)

    expect(screen.getByText("Настройки обновлений")).toBeInTheDocument()
    expect(screen.getByText("Информация о версии")).toBeInTheDocument()
    expect(screen.getByText("Автоматическая проверка")).toBeInTheDocument()
  })

  it("показывает текущую версию", () => {
    render(<UpdateSettings data-oid="nirb.oh" />)

    expect(screen.getByText("1.0.0")).toBeInTheDocument()
  })

  it("вызывает checkForUpdates при клике на кнопку проверки", async () => {
    const user = userEvent.setup()
    const checkForUpdates = vi.fn()
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      checkForUpdates,
    })

    render(<UpdateSettings data-oid="06go5se" />)

    await user.click(screen.getByText("Проверить обновления"))
    expect(checkForUpdates).toHaveBeenCalled()
  })

  it("показывает индикатор загрузки при проверке", () => {
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isChecking: true,
    })

    render(<UpdateSettings data-oid="h7z2op_" />)

    const button = screen.getByText("Проверить обновления")
    expect(button).toBeDisabled()
  })

  it("показывает информацию о доступном обновлении", () => {
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      isUpdateAvailable: true,
      availableUpdate: {
        version: "1.1.0",
        notes: "Исправления багов",
        pub_date: "2024-01-15",
      },
    })

    render(<UpdateSettings data-oid="yfxcnt8" />)

    expect(screen.getByText("Доступна 1.1.0")).toBeInTheDocument()
    expect(screen.getByText("Версия 1.1.0")).toBeInTheDocument()
    expect(screen.getByText("Исправления багов")).toBeInTheDocument()
  })

  it("переключает автоматическую проверку", async () => {
    const user = userEvent.setup()
    const enableAutoCheck = vi.fn()
    const disableAutoCheck = vi.fn()

    // Сначала рендерим с выключенной автопроверкой
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      enableAutoCheck,
      disableAutoCheck,
    })

    const { rerender } = render(<UpdateSettings data-oid="8rmqbh:" />)

    // Находим первый switch на странице (для автоматической проверки)
    const switches = screen.getAllByRole("switch")
    const switchElement = switches[0]

    // Включаем
    await user.click(switchElement)
    expect(enableAutoCheck).toHaveBeenCalledWith(60)

    // Теперь обновляем мок для состояния с включенной автопроверкой
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      autoCheckSettings: { enabled: true, intervalMinutes: 60 },
      enableAutoCheck,
      disableAutoCheck,
    })

    // Ререндерим с новым состоянием
    rerender(<UpdateSettings data-oid="78g4q2u" />)

    // Находим switch снова
    const switchesUpdated = screen.getAllByRole("switch")
    const switchElementUpdated = switchesUpdated[0]

    // Выключаем
    await user.click(switchElementUpdated)
    expect(disableAutoCheck).toHaveBeenCalled()
  })

  it("изменяет интервал проверки", async () => {
    const user = userEvent.setup()
    const enableAutoCheck = vi.fn()
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      autoCheckSettings: { enabled: true, intervalMinutes: 60 },
      enableAutoCheck,
    })

    render(<UpdateSettings data-oid="_qwbhcs" />)

    const select = screen.getByRole("combobox")
    await user.click(select)
    await user.click(screen.getByText("Каждые 3 часа"))

    expect(enableAutoCheck).toHaveBeenCalledWith(180)
  })

  it("применяет переданные классы", () => {
    const { container } = render(<UpdateSettings className="custom-class" data-oid="74994:g" />)

    const settings = container.querySelector(".custom-class")
    expect(settings).toBeInTheDocument()
  })

  it("показывает дополнительные настройки", () => {
    render(<UpdateSettings data-oid=":6f4ixv" />)

    expect(screen.getByText("Дополнительные настройки")).toBeInTheDocument()
    expect(screen.getByText("Уведомления")).toBeInTheDocument()
    expect(screen.getByText("Автоматическая загрузка")).toBeInTheDocument()
    expect(screen.getByText("Проверять бета-версии")).toBeInTheDocument()
  })
})

describe("CompactUpdateSettings", () => {
  const defaultMockReturn = {
    autoCheckSettings: {
      enabled: false,
      intervalMinutes: 60,
    },
    enableAutoCheck: vi.fn(),
    disableAutoCheck: vi.fn(),
  }

  beforeEach(() => {
    mockUseUpdateManager.mockReturnValue(defaultMockReturn)
  })

  it("рендерится в компактном виде", () => {
    render(<CompactUpdateSettings data-oid="t8htfkz" />)

    expect(screen.getByText("Автоматическая проверка обновлений")).toBeInTheDocument()
    expect(screen.getByText("Проверять обновления в фоновом режиме")).toBeInTheDocument()
  })

  it("показывает селектор интервала при включенной автопроверке", () => {
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      autoCheckSettings: { enabled: true, intervalMinutes: 60 },
    })

    render(<CompactUpdateSettings data-oid="846d::_" />)

    expect(screen.getByText("Интервал проверки")).toBeInTheDocument()
    expect(screen.getByRole("combobox")).toBeInTheDocument()
  })

  it("скрывает селектор интервала при выключенной автопроверке", () => {
    render(<CompactUpdateSettings data-oid="teq8-7." />)

    expect(screen.queryByText("Интервал проверки")).not.toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("переключает автопроверку", async () => {
    const user = userEvent.setup()
    const enableAutoCheck = vi.fn()
    const disableAutoCheck = vi.fn()
    mockUseUpdateManager.mockReturnValue({
      ...defaultMockReturn,
      enableAutoCheck,
      disableAutoCheck,
    })

    render(<CompactUpdateSettings data-oid="4w1d-3b" />)

    const switchElement = screen.getByRole("switch")
    await user.click(switchElement)

    expect(enableAutoCheck).toHaveBeenCalledWith(60)
  })
})

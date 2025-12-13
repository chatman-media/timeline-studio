/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для компонента UpdateManager
 */

import { act, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { InlineUpdateManager, UpdateManager } from "../update-manager"

// Мокаем хук
vi.mock("../../hooks/use-update-manager", () => ({
  useUpdateManager: vi.fn(() => ({
    isUpdateAvailable: false,
    isDownloading: false,
    isReadyToInstall: false,
    isInstalling: false,
    isInstalled: false,
    isError: false,
    enableAutoCheck: vi.fn(),
  })),
}))

// Мокаем framer-motion для упрощения тестов
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: any) => children,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Мокаем UpdateNotification
vi.mock("../update-notification", () => ({
  UpdateNotification: ({ onClose, showProgress }: any) => (
    <div data-testid="update-notification">
      <button onClick={onClose}>Закрыть</button>
      {showProgress && <div>Прогресс</div>}
    </div>
  ),
}))

describe("UpdateManager", () => {
  it("рендерится без ошибок", () => {
    render(<UpdateManager />)
    // Компонент должен отрендериться, но не показывать уведомление
    expect(screen.queryByTestId("update-notification")).not.toBeInTheDocument()
  })

  it("показывает уведомление при наличии обновления", async () => {
    const { useUpdateManager } = await import("../../hooks/use-update-manager")
    vi.mocked(useUpdateManager).mockReturnValue({
      isUpdateAvailable: true,
      isDownloading: false,
      isReadyToInstall: false,
      isInstalling: false,
      isInstalled: false,
      isError: false,
      enableAutoCheck: vi.fn(),
    } as any)

    render(<UpdateManager />)

    await waitFor(() => {
      expect(screen.getByTestId("update-notification")).toBeInTheDocument()
    })
  })

  it("применяет правильные классы позиционирования", () => {
    const { container } = render(<UpdateManager position="bottom-left" />)
    const positionDiv = container.firstChild as HTMLElement
    expect(positionDiv.className).toContain("bottom-4 left-4")
  })

  it("автоматически скрывает уведомление после установки", async () => {
    vi.useFakeTimers()

    const { useUpdateManager } = await import("../../hooks/use-update-manager")
    vi.mocked(useUpdateManager).mockReturnValue({
      isUpdateAvailable: false,
      isDownloading: false,
      isReadyToInstall: false,
      isInstalling: false,
      isInstalled: true,
      isError: false,
      enableAutoCheck: vi.fn(),
    } as any)

    const { rerender } = render(<UpdateManager autoHideDelay={1000} />)

    expect(screen.getByTestId("update-notification")).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(1100)
    })

    rerender(<UpdateManager autoHideDelay={1000} />)

    expect(screen.queryByTestId("update-notification")).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it("передает showProgress prop в UpdateNotification", async () => {
    const { useUpdateManager } = await import("../../hooks/use-update-manager")
    vi.mocked(useUpdateManager).mockReturnValue({
      isUpdateAvailable: true,
      isDownloading: false,
      isReadyToInstall: false,
      isInstalling: false,
      isInstalled: false,
      isError: false,
      enableAutoCheck: vi.fn(),
    } as any)

    render(<UpdateManager showProgress={true} />)

    await waitFor(() => {
      expect(screen.getByText("Прогресс")).toBeInTheDocument()
    })
  })

  it("включает автопроверку при монтировании", async () => {
    const enableAutoCheck = vi.fn()
    const { useUpdateManager } = await import("../../hooks/use-update-manager")
    vi.mocked(useUpdateManager).mockReturnValue({
      isUpdateAvailable: false,
      isDownloading: false,
      isReadyToInstall: false,
      isInstalling: false,
      isInstalled: false,
      isError: false,
      enableAutoCheck,
    } as any)

    render(<UpdateManager />)

    expect(enableAutoCheck).toHaveBeenCalledWith(60)
  })
})

describe("InlineUpdateManager", () => {
  it("не показывается когда нет обновлений", () => {
    const { container } = render(<InlineUpdateManager />)
    expect(container.firstChild).toBeNull()
  })

  it("показывается при наличии обновления", async () => {
    const { useUpdateManager } = await import("../../hooks/use-update-manager")
    vi.mocked(useUpdateManager).mockReturnValue({
      isUpdateAvailable: true,
      isDownloading: false,
      isReadyToInstall: false,
      isInstalling: false,
      isInstalled: false,
      isError: false,
    } as any)

    render(<InlineUpdateManager />)

    expect(screen.getByTestId("update-notification")).toBeInTheDocument()
  })

  it("применяет переданные классы", async () => {
    const { useUpdateManager } = await import("../../hooks/use-update-manager")
    vi.mocked(useUpdateManager).mockReturnValue({
      isUpdateAvailable: true,
      isDownloading: false,
      isReadyToInstall: false,
      isInstalling: false,
      isInstalled: false,
      isError: false,
    } as any)

    const { container } = render(<InlineUpdateManager className="custom-class" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain("custom-class")
  })
})

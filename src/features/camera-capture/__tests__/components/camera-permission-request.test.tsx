/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { CameraPermissionRequest } from "../../components/camera-permission-request"

// Определяем типы для пропсов компонента
type PermissionStatus = "pending" | "granted" | "denied" | "error"

// Мокируем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe("CameraPermissionRequest", () => {
  it("renders pending state", () => {
    render(<CameraPermissionRequest permissionStatus="pending" errorMessage="" onRequestPermissions={vi.fn()} />)

    // Проверяем, что отображается текст о запросе разрешений
    expect(screen.getByText("dialogs.cameraCapture.requestingPermissions")).toBeInTheDocument()
  })

  it("renders denied state with retry button", () => {
    const mockOnRequestPermissions = vi.fn()
    const errorMessage = "Access denied"

    render(
      <CameraPermissionRequest
        permissionStatus="denied"
        errorMessage={errorMessage}
        onRequestPermissions={mockOnRequestPermissions}
      />,
    )

    // Проверяем, что отображается сообщение об ошибке
    expect(screen.getByText(errorMessage)).toBeInTheDocument()

    // Проверяем, что есть кнопка для повторного запроса разрешений
    const button = screen.getByText("dialogs.cameraCapture.retryRequest")
    expect(button).toBeInTheDocument()

    // Проверяем, что при клике на кнопку вызывается функция onRequestPermissions
    act(() => {
      act(() => {
        fireEvent.click(button)
      })
    })
    expect(mockOnRequestPermissions).toHaveBeenCalledTimes(1)
  })

  it("renders denied state with empty error message", () => {
    render(<CameraPermissionRequest permissionStatus="denied" errorMessage="" onRequestPermissions={vi.fn()} />)

    // Проверяем, что есть кнопка для повторного запроса разрешений
    expect(screen.getByText("dialogs.cameraCapture.retryRequest")).toBeInTheDocument()
  })

  it("renders error state with custom error message", () => {
    const mockOnRequestPermissions = vi.fn()
    const errorMessage = "Custom error message"

    render(
      <CameraPermissionRequest
        permissionStatus="error"
        errorMessage={errorMessage}
        onRequestPermissions={mockOnRequestPermissions}
      />,
    )

    // Проверяем, что отображается сообщение об ошибке
    expect(screen.getByText(errorMessage)).toBeInTheDocument()

    // Проверяем, что есть кнопка для повторного запроса разрешений
    const button = screen.getByText("dialogs.cameraCapture.retry")
    expect(button).toBeInTheDocument()

    // Проверяем, что при клике на кнопку вызывается функция onRequestPermissions
    act(() => {
      act(() => {
        fireEvent.click(button)
      })
    })
    expect(mockOnRequestPermissions).toHaveBeenCalledTimes(1)
  })

  it("renders granted state", () => {
    render(<CameraPermissionRequest permissionStatus="granted" errorMessage="" onRequestPermissions={vi.fn()} />)

    // Проверяем, что компонент не отображает никакого содержимого при предоставленных разрешениях
    expect(screen.queryByText("dialogs.cameraCapture.permissionsNeeded")).not.toBeInTheDocument()
    expect(screen.queryByText("dialogs.cameraCapture.permissionsDenied")).not.toBeInTheDocument()
    expect(screen.queryByText("dialogs.cameraCapture.requestingPermissions")).not.toBeInTheDocument()
  })

  it("handles unknown permission status", () => {
    render(
      <CameraPermissionRequest
        // @ts-expect-error: Тестируем неизвестный статус разрешений
        permissionStatus="unknown"
        errorMessage=""
        onRequestPermissions={vi.fn()}
      />,
    )

    // Проверяем, что компонент не отображает никакого содержимого при неизвестном статусе
    expect(screen.queryByText("dialogs.cameraCapture.permissionsNeeded")).not.toBeInTheDocument()
    expect(screen.queryByText("dialogs.cameraCapture.permissionsDenied")).not.toBeInTheDocument()
    expect(screen.queryByText("dialogs.cameraCapture.requestingPermissions")).not.toBeInTheDocument()
  })
})

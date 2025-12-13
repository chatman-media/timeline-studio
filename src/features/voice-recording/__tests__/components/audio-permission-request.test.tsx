/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AudioPermissionRequest } from "../../components/audio-permission-request"

describe("AudioPermissionRequest", () => {
  it("renders nothing when permission is granted", () => {
    const renderResult = render(
      <AudioPermissionRequest permissionStatus="granted" errorMessage="" onRequestPermissions={() => {}} />,
    )

    expect(renderResult.container.firstChild).toBeNull()
  })

  it("renders pending state correctly", () => {
    render(<AudioPermissionRequest permissionStatus="pending" errorMessage="" onRequestPermissions={() => {}} />)

    expect(screen.getByText("Запрашиваем разрешения...")).toBeInTheDocument()
  })

  it("renders denied state with error message", () => {
    const errorMessage = "Доступ к микрофону запрещен"
    render(
      <AudioPermissionRequest permissionStatus="denied" errorMessage={errorMessage} onRequestPermissions={() => {}} />,
    )

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Повторить запрос" })).toBeInTheDocument()
  })

  it("renders error state with error message", () => {
    const errorMessage = "Произошла ошибка при запросе разрешений"
    render(
      <AudioPermissionRequest permissionStatus="error" errorMessage={errorMessage} onRequestPermissions={() => {}} />,
    )

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Повторить" })).toBeInTheDocument()
  })

  it("calls onRequestPermissions when retry button is clicked", () => {
    const onRequestPermissionsMock = vi.fn()
    render(
      <AudioPermissionRequest
        permissionStatus="denied"
        errorMessage="Доступ запрещен"
        onRequestPermissions={onRequestPermissionsMock}
      />,
    )

    const retryButton = screen.getByRole("button", { name: "Повторить запрос" })
    fireEvent.click(retryButton)

    expect(onRequestPermissionsMock).toHaveBeenCalledTimes(1)
  })
})

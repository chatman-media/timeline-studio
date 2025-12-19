/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AudioPermissionRequest } from "../../components/audio-permission-request"

describe("AudioPermissionRequest", () => {
  it("renders nothing when permission is granted", () => {
    const renderResult = render(
      <AudioPermissionRequest
        permissionStatus="granted"
        errorMessage=""
        onRequestPermissions={() => {}}
        data-oid="i-4z6q8"
      />,
    )

    expect(renderResult.container.firstChild).toBeNull()
  })

  it("renders pending state correctly", () => {
    render(
      <AudioPermissionRequest
        permissionStatus="pending"
        errorMessage=""
        onRequestPermissions={() => {}}
        data-oid="ywj93qu"
      />,
    )

    expect(screen.getByText("Запрашиваем разрешения...")).toBeInTheDocument()
  })

  it("renders denied state with error message", () => {
    const errorMessage = "Доступ к микрофону запрещен"
    render(
      <AudioPermissionRequest
        permissionStatus="denied"
        errorMessage={errorMessage}
        onRequestPermissions={() => {}}
        data-oid="8fda654"
      />,
    )

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Повторить запрос" })).toBeInTheDocument()
  })

  it("renders error state with error message", () => {
    const errorMessage = "Произошла ошибка при запросе разрешений"
    render(
      <AudioPermissionRequest
        permissionStatus="error"
        errorMessage={errorMessage}
        onRequestPermissions={() => {}}
        data-oid="k4y:1b:"
      />,
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
        data-oid="q.ks1v7"
      />,
    )

    const retryButton = screen.getByRole("button", {
      name: "Повторить запрос",
    })
    fireEvent.click(retryButton)

    expect(onRequestPermissionsMock).toHaveBeenCalledTimes(1)
  })
})

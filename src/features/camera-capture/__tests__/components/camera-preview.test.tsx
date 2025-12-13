/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CameraPreview } from "../../components/camera-preview"

// Мокируем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe("CameraPreview", () => {
  // Создаем ref для видео элемента
  const videoRef = { current: document.createElement("video") }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders loading state when device is not ready", () => {
    render(<CameraPreview videoRef={videoRef} isDeviceReady={false} showCountdown={false} countdown={0} />)

    // Проверяем, что отображается сообщение о загрузке
    expect(screen.getByText("dialogs.cameraCapture.initializingCamera")).toBeInTheDocument()

    // Проверяем, что видео элемент имеет класс opacity-0
    const videoElement = screen.getByTestId("video-element")
    expect(videoElement).toHaveClass("opacity-0")
  })

  it("renders video element when device is ready", () => {
    render(<CameraPreview videoRef={videoRef} isDeviceReady showCountdown={false} countdown={0} />)

    // Проверяем, что видео элемент имеет класс opacity-100
    const videoElement = screen.getByTestId("video-element")
    expect(videoElement).toHaveClass("opacity-100")

    // Проверяем, что сообщение о загрузке не отображается
    expect(screen.queryByText("dialogs.cameraCapture.initializingCamera")).not.toBeInTheDocument()
  })

  it("shows countdown when showCountdown is true and countdown > 0", () => {
    render(<CameraPreview videoRef={videoRef} isDeviceReady showCountdown countdown={3} />)

    // Проверяем, что отображается обратный отсчет
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("does not show countdown when showCountdown is false", () => {
    render(<CameraPreview videoRef={videoRef} isDeviceReady showCountdown={false} countdown={3} />)

    // Проверяем, что обратный отсчет не отображается
    expect(screen.queryByText("3")).not.toBeInTheDocument()
  })

  it("does not show countdown when countdown is 0", () => {
    render(<CameraPreview videoRef={videoRef} isDeviceReady showCountdown countdown={0} />)

    // Проверяем, что обратный отсчет не отображается
    expect(screen.queryByText("0")).not.toBeInTheDocument()
  })

  it("sets correct video attributes", () => {
    render(<CameraPreview videoRef={videoRef} isDeviceReady showCountdown={false} countdown={0} />)

    // Проверяем атрибуты видео элемента
    const videoElement = screen.getByTestId("video-element")
    expect(videoElement).toHaveAttribute("autoplay")
    expect(videoElement).toHaveAttribute("playsinline")
    // В React атрибут muted преобразуется в свойство, а не в атрибут
    expect(videoElement).toHaveProperty("muted", true)

    // Проверяем стили видео элемента
    expect(videoElement).toHaveStyle({
      display: "block",
      width: "100%",
      height: "100%",
      objectFit: "contain",
    })
  })
})

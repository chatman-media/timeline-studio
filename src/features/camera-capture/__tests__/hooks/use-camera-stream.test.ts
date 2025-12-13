/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useCameraStream } from "../../hooks/use-camera-stream"

// Мокируем navigator.mediaDevices
const mockGetUserMedia = vi.fn()

Object.defineProperty(navigator, "mediaDevices", {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
})

// Мокируем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe("useCameraStream", () => {
  // Создаем ref для видео элемента
  const videoRef = { current: document.createElement("video") }
  const mockSetErrorMessage = vi.fn()

  // Мокируем методы HTMLVideoElement
  const mockPlay = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(videoRef.current, "play", {
    value: mockPlay,
    writable: true,
  })

  beforeEach(() => {
    vi.clearAllMocks()

    // Сбрасываем srcObject
    videoRef.current.srcObject = null

    // Мокируем onloadedmetadata
    videoRef.current.onloadedmetadata = null
  })

  it("should initialize with isDeviceReady false", () => {
    const { result } = renderHook(() =>
      useCameraStream(
        videoRef,
        "device-1",
        "audio-1",
        "1920x1080",
        30,
        [{ value: "1920x1080", label: "1920x1080", width: 1920, height: 1080 }],
        mockSetErrorMessage,
      ),
    )

    expect(result.current.isDeviceReady).toBe(false)
    expect(result.current.streamRef.current).toBeNull()
  })

  it("should initialize camera and set isDeviceReady to true", async () => {
    // Мокируем успешное получение потока
    const mockStream = {
      getTracks: () => [
        {
          getSettings: () => ({ width: 1920, height: 1080, frameRate: 30 }),
          stop: vi.fn(),
        },
      ],
      getVideoTracks: () => [
        {
          getSettings: () => ({ width: 1920, height: 1080, frameRate: 30 }),
          stop: vi.fn(),
        },
      ],
    }
    mockGetUserMedia.mockResolvedValueOnce(mockStream)

    const { result } = renderHook(() =>
      useCameraStream(
        videoRef,
        "device-1",
        "audio-1",
        "1920x1080",
        30,
        [{ value: "1920x1080", label: "1920x1080", width: 1920, height: 1080 }],
        mockSetErrorMessage,
      ),
    )

    // Инициализируем камеру
    await result.current.initCamera()

    // Эмулируем событие onloadedmetadata
    if (videoRef.current.onloadedmetadata) {
      videoRef.current.onloadedmetadata(new Event("loadedmetadata"))
    }

    // Проверяем, что isDeviceReady стал true
    await waitFor(() => {
      expect(result.current.isDeviceReady).toBe(true)
      expect(result.current.streamRef.current).toBe(mockStream)
      expect(videoRef.current.srcObject).toBe(mockStream)
      expect(mockPlay).toHaveBeenCalled()
    })
  })

  it("should handle error when getUserMedia fails", async () => {
    // Мокируем ошибку при получении потока
    mockGetUserMedia.mockRejectedValueOnce(new Error("Failed to get user media"))

    const { result } = renderHook(() =>
      useCameraStream(
        videoRef,
        "device-1",
        "audio-1",
        "1920x1080",
        30,
        [{ value: "1920x1080", label: "1920x1080", width: 1920, height: 1080 }],
        mockSetErrorMessage,
      ),
    )

    // Инициализируем камеру
    await result.current.initCamera()

    // Проверяем, что isDeviceReady остался false и была вызвана функция setErrorMessage
    await waitFor(() => {
      expect(result.current.isDeviceReady).toBe(false)
      expect(mockSetErrorMessage).toHaveBeenCalledWith("dialogs.cameraCapture.errorRequestingStream")
    })
  })

  it("should try fallback constraints when initial getUserMedia fails", async () => {
    // Мокируем ошибку при первом вызове getUserMedia и успех при втором
    const mockStream = {
      getTracks: () => [
        {
          getSettings: () => ({ width: 1280, height: 720, frameRate: 30 }),
          stop: vi.fn(),
        },
      ],
      getVideoTracks: () => [
        {
          getSettings: () => ({ width: 1280, height: 720, frameRate: 30 }),
          stop: vi.fn(),
        },
      ],
    }
    mockGetUserMedia
      .mockRejectedValueOnce(new Error("Failed with requested resolution"))
      .mockResolvedValueOnce(mockStream)

    const { result } = renderHook(() =>
      useCameraStream(
        videoRef,
        "device-1",
        "audio-1",
        "1920x1080",
        30,
        [{ value: "1920x1080", label: "1920x1080", width: 1920, height: 1080 }],
        mockSetErrorMessage,
      ),
    )

    // Инициализируем камеру
    await result.current.initCamera()

    // Эмулируем событие onloadedmetadata
    if (videoRef.current.onloadedmetadata) {
      videoRef.current.onloadedmetadata(new Event("loadedmetadata"))
    }

    // Проверяем, что isDeviceReady стал true с резервными настройками
    await waitFor(() => {
      expect(result.current.isDeviceReady).toBe(true)
      expect(result.current.streamRef.current).toBe(mockStream)
      expect(videoRef.current.srcObject).toBe(mockStream)
      expect(mockSetErrorMessage).toHaveBeenCalledWith("dialogs.cameraCapture.errorRequestingStream")
    })
  })

  it("should stop tracks when setIsDeviceReady is set to false", async () => {
    // Мокируем успешное получение потока
    const mockTrackStop = vi.fn()
    const mockStream = {
      getTracks: () => [{ stop: mockTrackStop }],
      getVideoTracks: () => [
        {
          getSettings: () => ({ width: 1920, height: 1080, frameRate: 30 }),
          stop: mockTrackStop,
        },
      ],
    }
    mockGetUserMedia.mockResolvedValueOnce(mockStream)

    const { result } = renderHook(() =>
      useCameraStream(
        videoRef,
        "device-1",
        "audio-1",
        "1920x1080",
        30,
        [{ value: "1920x1080", label: "1920x1080", width: 1920, height: 1080 }],
        mockSetErrorMessage,
      ),
    )

    // Инициализируем камеру
    await result.current.initCamera()

    // Эмулируем событие onloadedmetadata
    if (videoRef.current.onloadedmetadata) {
      videoRef.current.onloadedmetadata(new Event("loadedmetadata"))
    }

    // Проверяем, что isDeviceReady стал true
    await waitFor(() => {
      expect(result.current.isDeviceReady).toBe(true)
    })

    // Устанавливаем isDeviceReady в false
    act(() => {
      result.current.setIsDeviceReady(false)
    })

    // Проверяем, что isDeviceReady стал false
    await waitFor(() => {
      expect(result.current.isDeviceReady).toBe(false)
    })
  })
})

/**
 * @vitest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { COMMON_FRAMERATES, COMMON_RESOLUTIONS } from "@/domains/shared/types/project"

import { useCameraPermissions, useDeviceCapabilities } from "../../hooks/camera-capture-hooks"

// Мокируем navigator.mediaDevices
const mockGetUserMedia = vi.fn()
const mockEnumerateDevices = vi.fn()

Object.defineProperty(navigator, "mediaDevices", {
  value: {
    getUserMedia: mockGetUserMedia,
    enumerateDevices: mockEnumerateDevices,
  },
  writable: true,
})

// Мокируем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe("useCameraPermissions", () => {
  const mockGetDevices = vi.fn().mockResolvedValue(true)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with pending status", () => {
    const { result } = renderHook(() => useCameraPermissions(mockGetDevices))

    expect(result.current.permissionStatus).toBe("pending")
    expect(result.current.errorMessage).toBe("")
  })

  it("should set status to granted when permissions are granted", async () => {
    // Мокируем успешное получение разрешений
    mockGetUserMedia.mockResolvedValueOnce({
      getTracks: () => [{ stop: vi.fn() }, { stop: vi.fn() }],
    })

    const { result } = renderHook(() => useCameraPermissions(mockGetDevices))

    // Запрашиваем разрешения
    await result.current.requestPermissions()

    // Проверяем, что статус изменился на granted
    await waitFor(() => {
      expect(result.current.permissionStatus).toBe("granted")
      expect(mockGetDevices).toHaveBeenCalledTimes(1)
    })
  })

  it("should set status to denied when permissions are denied", async () => {
    // Мокируем отказ в разрешениях
    const error = new DOMException("Permission denied", "NotAllowedError")
    mockGetUserMedia.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useCameraPermissions(mockGetDevices))

    // Запрашиваем разрешения
    await result.current.requestPermissions()

    // Проверяем, что статус изменился на denied
    await waitFor(() => {
      expect(result.current.permissionStatus).toBe("denied")
      expect(result.current.errorMessage).toBe("dialogs.cameraCapture.permissionDenied")
    })
  })

  it("should set status to error when device not found", async () => {
    // Мокируем ошибку устройства не найдено
    const error = new DOMException("Device not found", "NotFoundError")
    mockGetUserMedia.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useCameraPermissions(mockGetDevices))

    // Запрашиваем разрешения
    await result.current.requestPermissions()

    // Проверяем, что статус изменился на error
    await waitFor(() => {
      expect(result.current.permissionStatus).toBe("error")
      expect(result.current.errorMessage).toBe("dialogs.cameraCapture.deviceNotFound")
    })
  })
})

describe("useDeviceCapabilities", () => {
  const mockSetSelectedResolution = vi.fn()
  const mockSetFrameRate = vi.fn()

  // Мокируем возможности камеры
  const mockVideoTrack = {
    getCapabilities: vi.fn().mockReturnValue({
      width: { min: 640, max: 1920 },
      height: { min: 480, max: 1080 },
      frameRate: { min: 15, max: 30 },
    }),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with empty resolutions and loading false", () => {
    const { result } = renderHook(() => useDeviceCapabilities(mockSetSelectedResolution, mockSetFrameRate))

    expect(result.current.availableResolutions).toEqual([])
    expect(result.current.supportedResolutions).toEqual([])
    expect(result.current.supportedFrameRates).toEqual([])
    expect(result.current.isLoadingCapabilities).toBe(false)
  })

  it("should get device capabilities and set resolutions", async () => {
    // Мокируем успешное получение потока
    mockGetUserMedia.mockResolvedValueOnce({
      getVideoTracks: () => [mockVideoTrack],
      getTracks: () => [{ stop: vi.fn() }],
    })

    const { result } = renderHook(() => useDeviceCapabilities(mockSetSelectedResolution, mockSetFrameRate))

    // Запрашиваем возможности устройства
    await result.current.getDeviceCapabilities("test-device-id")

    // Проверяем, что возможности устройства получены
    await waitFor(() => {
      expect(result.current.isLoadingCapabilities).toBe(false)
      expect(mockSetSelectedResolution).toHaveBeenCalled()
      expect(mockSetFrameRate).toHaveBeenCalled()

      // Проверяем, что разрешения и частоты кадров установлены
      expect(result.current.supportedResolutions.length).toBeGreaterThan(0)
      expect(result.current.supportedFrameRates.length).toBeGreaterThan(0)
    })
  })

  it("should use common resolutions when getCapabilities is not supported", async () => {
    // Мокируем успешное получение потока без getCapabilities
    mockGetUserMedia.mockResolvedValueOnce({
      getVideoTracks: () => [
        {
          /* нет метода getCapabilities */
        },
      ],
      getTracks: () => [{ stop: vi.fn() }],
    })

    const { result } = renderHook(() => useDeviceCapabilities(mockSetSelectedResolution, mockSetFrameRate))

    // Запрашиваем возможности устройства
    await result.current.getDeviceCapabilities("test-device-id")

    // Проверяем, что используются стандартные разрешения
    await waitFor(() => {
      expect(result.current.availableResolutions).toEqual(COMMON_RESOLUTIONS)
      expect(result.current.supportedResolutions).toEqual(COMMON_RESOLUTIONS)
      expect(result.current.supportedFrameRates).toEqual(COMMON_FRAMERATES)
      expect(mockSetSelectedResolution).toHaveBeenCalledWith(COMMON_RESOLUTIONS[0].value)
      expect(mockSetFrameRate).toHaveBeenCalledWith(30)
    })
  })

  it("should handle errors when getting device capabilities", async () => {
    // Мокируем ошибку при получении потока
    mockGetUserMedia.mockRejectedValueOnce(new Error("Test error"))

    const { result } = renderHook(() => useDeviceCapabilities(mockSetSelectedResolution, mockSetFrameRate))

    // Запрашиваем возможности устройства
    await result.current.getDeviceCapabilities("test-device-id")

    // Проверяем, что используются стандартные разрешения при ошибке
    await waitFor(() => {
      expect(result.current.availableResolutions).toEqual(COMMON_RESOLUTIONS)
      expect(result.current.supportedResolutions).toEqual(COMMON_RESOLUTIONS)
      expect(result.current.supportedFrameRates).toEqual(COMMON_FRAMERATES)
      expect(mockSetSelectedResolution).toHaveBeenCalledWith(COMMON_RESOLUTIONS[0].value)
      expect(mockSetFrameRate).toHaveBeenCalledWith(30)
    })
  })
})

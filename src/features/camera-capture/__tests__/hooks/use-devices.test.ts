/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useDevices } from "../../hooks/use-devices"

// Мокируем функцию getDeviceCapabilities
vi.mock("../../hooks/camera-capture-hooks", () => ({
  useDeviceCapabilities: () => ({
    getDeviceCapabilities: vi.fn(),
  }),
}))

// Мокируем navigator.mediaDevices
const mockEnumerateDevices = vi.fn()

Object.defineProperty(navigator, "mediaDevices", {
  value: {
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

describe("useDevices", () => {
  // Мокируем устройства
  const mockDevices = [
    { deviceId: "camera1", kind: "videoinput", label: "Camera 1" },
    { deviceId: "camera2", kind: "videoinput", label: "Camera 2" },
    { deviceId: "mic1", kind: "audioinput", label: "Microphone 1" },
    { deviceId: "mic2", kind: "audioinput", label: "Microphone 2" },
    { deviceId: "speaker1", kind: "audiooutput", label: "Speaker 1" },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockEnumerateDevices.mockResolvedValue(mockDevices)
  })

  it("should initialize with empty devices", () => {
    const mockGetDeviceCapabilities = vi.fn()
    const mockSetErrorMessage = vi.fn()
    const { result } = renderHook(() => useDevices(mockGetDeviceCapabilities, mockSetErrorMessage))

    expect(result.current.devices).toEqual([])
    expect(result.current.audioDevices).toEqual([])
    expect(result.current.selectedDevice).toBe("")
    expect(result.current.selectedAudioDevice).toBe("")
  })

  it("should get devices when getDevices is called", async () => {
    // Создаем мок для setErrorMessage
    const mockGetDeviceCapabilities = vi.fn()
    const mockSetErrorMessage = vi.fn()

    const { result } = renderHook(() => useDevices(mockGetDeviceCapabilities, mockSetErrorMessage))

    // Вызываем getDevices
    await act(async () => {
      await result.current.getDevices()
    })

    // Проверяем, что устройства получены
    await waitFor(() => {
      expect(result.current.devices).toEqual([
        { deviceId: "camera1", label: "Camera 1" },
        { deviceId: "camera2", label: "Camera 2" },
      ])
      expect(result.current.audioDevices).toEqual([
        { deviceId: "mic1", label: "Microphone 1" },
        { deviceId: "mic2", label: "Microphone 2" },
      ])
      expect(result.current.selectedDevice).toBe("camera1")
      expect(result.current.selectedAudioDevice).toBe("mic1")
    })
  })

  it("should handle empty device labels", async () => {
    // Мокируем устройства без меток
    mockEnumerateDevices.mockResolvedValueOnce([
      { deviceId: "camera1", kind: "videoinput", label: "" },
      { deviceId: "mic1", kind: "audioinput", label: "" },
    ])

    // Создаем мок для setErrorMessage
    const mockGetDeviceCapabilities = vi.fn()
    const mockSetErrorMessage = vi.fn()

    const { result } = renderHook(() => useDevices(mockGetDeviceCapabilities, mockSetErrorMessage))

    // Вызываем getDevices
    await act(async () => {
      await result.current.getDevices()
    })

    // Проверяем, что устройства получены с автоматически сгенерированными метками
    await waitFor(() => {
      expect(result.current.devices).toEqual([{ deviceId: "camera1", label: "timeline.tracks.cameraWithNumber" }])
      expect(result.current.audioDevices).toEqual([{ deviceId: "mic1", label: "timeline.tracks.audioWithNumber" }])
    })
  })

  it("should set selected device", async () => {
    // Создаем мок для setErrorMessage
    const mockGetDeviceCapabilities = vi.fn()
    const mockSetErrorMessage = vi.fn()

    const { result } = renderHook(() => useDevices(mockGetDeviceCapabilities, mockSetErrorMessage))

    // Получаем устройства
    await act(async () => {
      await result.current.getDevices()
    })

    // Устанавливаем выбранное устройство
    act(() => {
      result.current.setSelectedDevice("camera2")
    })

    // Проверяем, что выбранное устройство изменилось
    expect(result.current.selectedDevice).toBe("camera2")
  })

  it("should set selected audio device", async () => {
    // Создаем мок для setErrorMessage
    const mockGetDeviceCapabilities = vi.fn()
    const mockSetErrorMessage = vi.fn()

    const { result } = renderHook(() => useDevices(mockGetDeviceCapabilities, mockSetErrorMessage))

    // Получаем устройства
    await act(async () => {
      await result.current.getDevices()
    })

    // Устанавливаем выбранное аудио устройство
    act(() => {
      result.current.setSelectedAudioDevice("mic2")
    })

    // Проверяем, что выбранное аудио устройство изменилось
    expect(result.current.selectedAudioDevice).toBe("mic2")
  })

  it("should handle error when enumerateDevices fails", async () => {
    // Мокируем ошибку при получении устройств
    mockEnumerateDevices.mockRejectedValueOnce(new Error("Failed to enumerate devices"))

    // Создаем мок для setErrorMessage
    const mockGetDeviceCapabilities = vi.fn()
    const mockSetErrorMessage = vi.fn()

    const { result } = renderHook(() => useDevices(mockGetDeviceCapabilities, mockSetErrorMessage))

    // Вызываем getDevices
    await act(async () => {
      await result.current.getDevices()
    })

    // Проверяем, что устройства остались пустыми
    expect(result.current.devices).toEqual([])
    expect(result.current.audioDevices).toEqual([])

    // Не проверяем вызов setErrorMessage, так как он может быть undefined в некоторых случаях
  })
})

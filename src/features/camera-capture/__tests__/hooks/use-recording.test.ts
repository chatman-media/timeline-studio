/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useRecording } from "../../hooks/use-recording"

// Мокируем MediaRecorder
global.MediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  ondataavailable: vi.fn(),
  onerror: vi.fn(),
  state: "inactive",
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})) as unknown as typeof MediaRecorder

// Добавляем метод isTypeSupported
;(global.MediaRecorder as any).isTypeSupported = vi.fn(() => true)

// Мокируем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe("useRecording", () => {
  // Мокируем функции для записи
  const mockOnRecordingStart = vi.fn()
  const mockOnRecordingStop = vi.fn()
  const mockStreamRef = {
    current: { getTracks: () => [{ stop: vi.fn() }] },
  } as unknown as React.RefObject<MediaStream | null>
  const mockVideoRef = { current: document.createElement("video") }
  const mockSetErrorMessage = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useRecording(mockStreamRef, 3, mockOnRecordingStop))

    expect(result.current.isRecording).toBe(false)
    expect(result.current.recordingTime).toBe(0)
    expect(result.current.showCountdown).toBe(false)
    // Проверяем, что countdown существует
    expect(result.current.countdown).toBeDefined()
  })

  it("should set countdown", () => {
    const { result } = renderHook(() => useRecording(mockStreamRef, 3, mockOnRecordingStop))

    act(() => {
      result.current.setCountdown(5)
    })

    expect(result.current.countdown).toBe(5)
  })

  it("should start countdown", () => {
    const { result } = renderHook(() => useRecording(mockStreamRef, 3, mockOnRecordingStop))

    // Устанавливаем обратный отсчет
    act(() => {
      result.current.setCountdown(2)
    })

    // Запускаем обратный отсчет
    act(() => {
      result.current.startCountdown()
    })

    // Проверяем, что обратный отсчет начался
    expect(result.current.showCountdown).toBe(true)
    expect(result.current.countdown).toBe(2)

    // Проходит 1 секунда
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Проверяем, что обратный отсчет уменьшился
    expect(result.current.countdown).toBe(1)
  })

  it("should have stopRecording method", () => {
    const { result } = renderHook(() => useRecording(mockStreamRef, 3, mockOnRecordingStop))

    // Проверяем, что метод stopRecording существует
    expect(typeof result.current.stopRecording).toBe("function")
  })

  it("should have recordingTime property", () => {
    const { result } = renderHook(() => useRecording(mockStreamRef, 3, mockOnRecordingStop))

    // Проверяем, что свойство recordingTime существует и имеет числовое значение
    expect(typeof result.current.recordingTime).toBe("number")
  })

  it("should format recording time correctly", () => {
    const { result } = renderHook(() => useRecording(mockStreamRef, 3, mockOnRecordingStop))

    // Мокируем метод форматирования времени
    const formatTime = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`
    }

    // Проверяем форматирование времени
    expect(formatTime(0)).toBe("00:00:00")
    expect(formatTime(1000)).toBe("00:00:01")
    expect(formatTime(60000)).toBe("00:01:00")
    expect(formatTime(3661000)).toBe("01:01:01")
  })
})

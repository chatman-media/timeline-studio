/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { mockUseTranslation, setTranslations } from "@/test/mocks/libraries/i18n"

import { useAudioDevices } from "../../hooks/use-audio-devices"

// Мокаем navigator.mediaDevices
const mockEnumerateDevices = vi.fn()

beforeEach(() => {
  vi.resetAllMocks()

  // Настраиваем переводы с поддержкой интерполяции
  setTranslations({
    "dialogs.voiceRecord.microphoneWithNumber": "Микрофон {{number}}",
    "dialogs.voiceRecord.errorGettingDevices": "Не удалось получить список устройств",
  })

  // Обновляем мок useTranslation для поддержки интерполяции
  mockUseTranslation.mockReturnValue({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        "dialogs.voiceRecord.microphoneWithNumber": "Микрофон {{number}}",
        "dialogs.voiceRecord.errorGettingDevices": "Не удалось получить список устройств",
      }

      let result = translations[key] || key

      if (options && typeof options === "object") {
        // Простая интерполяция для тестов
        Object.keys(options).forEach((optionKey) => {
          if (optionKey !== "defaultValue") {
            result = result.replace(`{{${optionKey}}}`, options[optionKey])
          }
        })
      }

      // Если есть defaultValue и ключ не найден в переводах
      if (options?.defaultValue && !translations[key]) {
        result = options.defaultValue
      }

      return result
    },
    i18n: {
      use: vi.fn(),
      init: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      t: vi.fn((key: string) => key),
      changeLanguage: vi.fn(),
      language: "ru",
      languages: ["ru", "en"],
      services: {
        resourceStore: {
          on: vi.fn(),
          off: vi.fn(),
        },
      },
    } as any,
    ready: true,
  })

  // Мокаем navigator.mediaDevices.enumerateDevices
  Object.defineProperty(global.navigator, "mediaDevices", {
    value: {
      enumerateDevices: mockEnumerateDevices,
    },
    writable: true,
  })
})

describe("useAudioDevices", () => {
  it("initializes with empty devices list", () => {
    const setErrorMessage = vi.fn()

    const { result } = renderHook(() =>
      useAudioDevices({
        setErrorMessage,
      }),
    )

    expect(result.current.audioDevices).toEqual([])
    expect(result.current.selectedAudioDevice).toBe("")
    expect(typeof result.current.setSelectedAudioDevice).toBe("function")
    expect(typeof result.current.getDevices).toBe("function")
  })

  it("gets devices successfully", async () => {
    const setErrorMessage = vi.fn()

    // Мокаем успешный запрос enumerateDevices
    const mockDevices = [
      { kind: "audioinput", deviceId: "device-1", label: "Microphone 1" },
      { kind: "audioinput", deviceId: "device-2", label: "Microphone 2" },
      { kind: "videoinput", deviceId: "device-3", label: "Camera 1" },
    ]
    mockEnumerateDevices.mockResolvedValue(mockDevices)

    const { result } = renderHook(() =>
      useAudioDevices({
        setErrorMessage,
      }),
    )

    let success = false
    await act(async () => {
      success = await result.current.getDevices()
    })

    expect(success).toBe(true)
    expect(result.current.audioDevices).toHaveLength(2)
    expect(result.current.audioDevices[0].deviceId).toBe("device-1")
    expect(result.current.audioDevices[1].deviceId).toBe("device-2")
    expect(result.current.selectedAudioDevice).toBe("device-1")
  })

  it("handles errors when getting devices", async () => {
    const setErrorMessage = vi.fn()

    // Мокаем ошибку при запросе enumerateDevices
    mockEnumerateDevices.mockRejectedValue(new Error("Enumeration error"))

    const { result } = renderHook(() =>
      useAudioDevices({
        setErrorMessage,
      }),
    )

    let success = false
    await act(async () => {
      success = await result.current.getDevices()
    })

    expect(success).toBe(false)
    expect(setErrorMessage).toHaveBeenCalled()
    expect(result.current.audioDevices).toEqual([])
  })

  it("sets selected device", () => {
    const setErrorMessage = vi.fn()

    const { result } = renderHook(() =>
      useAudioDevices({
        setErrorMessage,
      }),
    )

    act(() => {
      result.current.setSelectedAudioDevice("device-2")
    })

    expect(result.current.selectedAudioDevice).toBe("device-2")
  })

  describe("Обработка различных типов устройств", () => {
    it("должен фильтровать только аудиовходы", async () => {
      const setErrorMessage = vi.fn()

      // Мокаем устройства разных типов
      const mockDevices = [
        { kind: "audioinput", deviceId: "audio-1", label: "Microphone 1" },
        { kind: "videoinput", deviceId: "video-1", label: "Camera 1" },
        { kind: "audiooutput", deviceId: "audio-out-1", label: "Speaker 1" },
        { kind: "audioinput", deviceId: "audio-2", label: "Microphone 2" },
      ]
      mockEnumerateDevices.mockResolvedValue(mockDevices)

      const { result } = renderHook(() =>
        useAudioDevices({
          setErrorMessage,
        }),
      )

      let success = false
      await act(async () => {
        success = await result.current.getDevices()
      })

      expect(success).toBe(true)
      expect(result.current.audioDevices).toHaveLength(2)
      expect(result.current.audioDevices[0].deviceId).toBe("audio-1")
      expect(result.current.audioDevices[1].deviceId).toBe("audio-2")
    })

    it("должен обрабатывать устройства без названий", async () => {
      const setErrorMessage = vi.fn()

      // Мокаем устройства без label
      const mockDevices = [
        { kind: "audioinput", deviceId: "device-1", label: "" },
        { kind: "audioinput", deviceId: "device-2", label: "" },
        { kind: "audioinput", deviceId: "", label: "Named Device" },
      ]
      mockEnumerateDevices.mockResolvedValue(mockDevices)

      const { result } = renderHook(() =>
        useAudioDevices({
          setErrorMessage,
        }),
      )

      let success = false
      await act(async () => {
        success = await result.current.getDevices()
      })

      expect(success).toBe(true)
      expect(result.current.audioDevices).toHaveLength(3)

      // Первые два должны получить автоматические названия
      expect(result.current.audioDevices[0].label).toBe("Микрофон 1")
      expect(result.current.audioDevices[1].label).toBe("Микрофон 2")
      expect(result.current.audioDevices[2].label).toBe("Named Device")

      // Устройство без deviceId должно получить автоматический ID
      expect(result.current.audioDevices[2].deviceId).toBe("microphone-2")
    })

    it("должен очищать названия устройств от текста в скобках", async () => {
      const setErrorMessage = vi.fn()

      // Мокаем устройства с текстом в скобках
      const mockDevices = [
        { kind: "audioinput", deviceId: "device-1", label: "Microphone 1 (USB Audio)" },
        { kind: "audioinput", deviceId: "device-2", label: "Built-in Microphone (Internal)" },
        { kind: "audioinput", deviceId: "device-3", label: "Clean Microphone" },
      ]
      mockEnumerateDevices.mockResolvedValue(mockDevices)

      const { result } = renderHook(() =>
        useAudioDevices({
          setErrorMessage,
        }),
      )

      let success = false
      await act(async () => {
        success = await result.current.getDevices()
      })

      expect(success).toBe(true)
      expect(result.current.audioDevices).toHaveLength(3)

      // Проверяем что текст в скобках удален
      expect(result.current.audioDevices[0].label).toBe("Microphone 1")
      expect(result.current.audioDevices[1].label).toBe("Built-in Microphone")
      expect(result.current.audioDevices[2].label).toBe("Clean Microphone")
    })

    it("должен выбирать первое устройство автоматически", async () => {
      const setErrorMessage = vi.fn()

      const mockDevices = [
        { kind: "audioinput", deviceId: "first-device", label: "First Microphone" },
        { kind: "audioinput", deviceId: "second-device", label: "Second Microphone" },
      ]
      mockEnumerateDevices.mockResolvedValue(mockDevices)

      const { result } = renderHook(() =>
        useAudioDevices({
          setErrorMessage,
        }),
      )

      // Убеждаемся что нет выбранного устройства
      expect(result.current.selectedAudioDevice).toBe("")

      let success = false
      await act(async () => {
        success = await result.current.getDevices()
      })

      expect(success).toBe(true)
      expect(result.current.selectedAudioDevice).toBe("first-device")
    })

    it("не должен менять выбранное устройство, если оно уже выбрано", async () => {
      const setErrorMessage = vi.fn()

      const mockDevices = [
        { kind: "audioinput", deviceId: "device-1", label: "Microphone 1" },
        { kind: "audioinput", deviceId: "device-2", label: "Microphone 2" },
      ]
      mockEnumerateDevices.mockResolvedValue(mockDevices)

      const { result } = renderHook(() =>
        useAudioDevices({
          setErrorMessage,
        }),
      )

      // Предварительно выбираем устройство
      act(() => {
        result.current.setSelectedAudioDevice("device-2")
      })

      expect(result.current.selectedAudioDevice).toBe("device-2")

      let success = false
      await act(async () => {
        success = await result.current.getDevices()
      })

      expect(success).toBe(true)
      // Выбранное устройство не должно измениться
      expect(result.current.selectedAudioDevice).toBe("device-2")
    })
  })

  describe("Обработка крайних случаев", () => {
    it("должен обрабатывать пустой список устройств", async () => {
      const setErrorMessage = vi.fn()

      // Мокаем пустой список устройств
      mockEnumerateDevices.mockResolvedValue([])

      const { result } = renderHook(() =>
        useAudioDevices({
          setErrorMessage,
        }),
      )

      let success = false
      await act(async () => {
        success = await result.current.getDevices()
      })

      expect(success).toBe(true)
      expect(result.current.audioDevices).toEqual([])
      expect(result.current.selectedAudioDevice).toBe("")
    })

    it("должен обрабатывать только не-аудио устройства", async () => {
      const setErrorMessage = vi.fn()

      // Мокаем только видеоустройства
      const mockDevices = [
        { kind: "videoinput", deviceId: "video-1", label: "Camera 1" },
        { kind: "audiooutput", deviceId: "speaker-1", label: "Speaker 1" },
      ]
      mockEnumerateDevices.mockResolvedValue(mockDevices)

      const { result } = renderHook(() =>
        useAudioDevices({
          setErrorMessage,
        }),
      )

      let success = false
      await act(async () => {
        success = await result.current.getDevices()
      })

      expect(success).toBe(true)
      expect(result.current.audioDevices).toEqual([])
      expect(result.current.selectedAudioDevice).toBe("")
    })

    it("должен обрабатывать устройства с очень длинными названиями", async () => {
      const setErrorMessage = vi.fn()

      const longName =
        "Very Long Microphone Name That Contains Many Words And Characters (USB Audio Device Model XYZ-123)"
      const mockDevices = [{ kind: "audioinput", deviceId: "long-device", label: longName }]
      mockEnumerateDevices.mockResolvedValue(mockDevices)

      const { result } = renderHook(() =>
        useAudioDevices({
          setErrorMessage,
        }),
      )

      let success = false
      await act(async () => {
        success = await result.current.getDevices()
      })

      expect(success).toBe(true)
      expect(result.current.audioDevices).toHaveLength(1)

      // Проверяем что текст в скобках удален
      const expectedName = "Very Long Microphone Name That Contains Many Words And Characters"
      expect(result.current.audioDevices[0].label).toBe(expectedName)
    })
  })

  describe("Управление состоянием", () => {
    it("должен позволять устанавливать и изменять выбранное устройство", () => {
      const setErrorMessage = vi.fn()

      const { result } = renderHook(() =>
        useAudioDevices({
          setErrorMessage,
        }),
      )

      // Проверяем начальное состояние
      expect(result.current.selectedAudioDevice).toBe("")

      // Устанавливаем устройство
      act(() => {
        result.current.setSelectedAudioDevice("test-device-1")
      })

      expect(result.current.selectedAudioDevice).toBe("test-device-1")

      // Меняем устройство
      act(() => {
        result.current.setSelectedAudioDevice("test-device-2")
      })

      expect(result.current.selectedAudioDevice).toBe("test-device-2")

      // Очищаем выбор
      act(() => {
        result.current.setSelectedAudioDevice("")
      })

      expect(result.current.selectedAudioDevice).toBe("")
    })

    it("должен сохранять список устройств между вызовами", async () => {
      const setErrorMessage = vi.fn()

      const mockDevices1 = [{ kind: "audioinput", deviceId: "device-1", label: "Microphone 1" }]
      const mockDevices2 = [
        { kind: "audioinput", deviceId: "device-1", label: "Microphone 1" },
        { kind: "audioinput", deviceId: "device-2", label: "Microphone 2" },
      ]

      mockEnumerateDevices.mockResolvedValueOnce(mockDevices1).mockResolvedValueOnce(mockDevices2)

      const { result } = renderHook(() =>
        useAudioDevices({
          setErrorMessage,
        }),
      )

      // Первый вызов
      await act(async () => {
        await result.current.getDevices()
      })

      expect(result.current.audioDevices).toHaveLength(1)

      // Второй вызов
      await act(async () => {
        await result.current.getDevices()
      })

      expect(result.current.audioDevices).toHaveLength(2)
    })
  })

  describe("Интеграция с setErrorMessage", () => {
    it("должен вызывать setErrorMessage при ошибках", async () => {
      const setErrorMessage = vi.fn()

      // Мокаем ошибку при запросе enumerateDevices
      mockEnumerateDevices.mockRejectedValue(new Error("Device enumeration failed"))

      const { result } = renderHook(() =>
        useAudioDevices({
          setErrorMessage,
        }),
      )

      let success = false
      await act(async () => {
        success = await result.current.getDevices()
      })

      expect(success).toBe(false)
      expect(setErrorMessage).toHaveBeenCalledWith("Не удалось получить список устройств")
      expect(result.current.audioDevices).toEqual([])
    })

    it("не должен вызывать setErrorMessage при успешном получении устройств", async () => {
      const setErrorMessage = vi.fn()

      const mockDevices = [{ kind: "audioinput", deviceId: "device-1", label: "Microphone 1" }]
      mockEnumerateDevices.mockResolvedValue(mockDevices)

      const { result } = renderHook(() =>
        useAudioDevices({
          setErrorMessage,
        }),
      )

      let success = false
      await act(async () => {
        success = await result.current.getDevices()
      })

      expect(success).toBe(true)
      expect(setErrorMessage).not.toHaveBeenCalled()
    })
  })
})

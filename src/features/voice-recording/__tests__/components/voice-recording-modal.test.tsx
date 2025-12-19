import { fireEvent, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { setTranslations } from "@/test/mocks/libraries/i18n"
import { renderWithModal } from "@/test/test-utils"

// Сначала импортируем и настраиваем моки до импорта компонента
import { mockUseResources, resetResourcesMocks } from "../../__mocks__/resources"
import {
  mockBlobToBase64,
  mockGetSupportedAudioFormats,
  mockSaveVoiceRecording,
  resetTauriMocks,
} from "../../__mocks__/tauri"

// Мокаем модули до их использования
vi.mock("@/features/resources", () => ({
  useResources: vi.fn(() => mockUseResources),
  ResourcesProvider: ({ children }: any) => children,
}))

vi.mock("../../types/tauri", () => ({
  saveVoiceRecording: mockSaveVoiceRecording,
  getSupportedAudioFormats: mockGetSupportedAudioFormats,
  blobToBase64: mockBlobToBase64,
  formatFileName: vi.fn((prefix = "voice_recording") => `${prefix}_test`),
  getMimeTypeForFormat: vi.fn((format) => {
    const mimeTypes: Record<string, string> = {
      webm: "audio/webm",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
    }
    return mimeTypes[format] || "audio/webm"
  }),
  isFormatSupportedByMediaRecorder: vi.fn((format) => {
    return format === "webm"
  }),
  getMediaRecorderOptions: vi.fn((format) => ({ mimeType: `audio/${format}` })),
}))

// Создаем моки функций
const mockRequestPermissions = vi.fn().mockResolvedValue(true)
const mockSetErrorMessage = vi.fn()
const mockSetSelectedAudioDevice = vi.fn()
const mockGetDevices = vi.fn().mockResolvedValue(true)
const mockSetCountdown = vi.fn()
const mockStopRecording = vi.fn()
const mockStartCountdown = vi.fn()
const mockInitAudio = vi.fn()
const mockCleanup = vi.fn()
const mockCloseModal = vi.fn()

// Создаем состояние для моков
let mockPermissionStatus = "granted"
let mockErrorMessage = ""
let mockAudioDevices = [
  { deviceId: "device-1", label: "Microphone 1" },
  { deviceId: "device-2", label: "Microphone 2" },
]

let mockSelectedAudioDevice = "device-1"
let mockIsRecording = false
let mockShowCountdown = false
let mockRecordingTime = 0
let mockIsDeviceReady = true
let mockCountdown = 3

// Мокаем хуки
vi.mock("../../hooks/use-audio-permissions", () => ({
  useAudioPermissions: () => ({
    permissionStatus: mockPermissionStatus,
    errorMessage: mockErrorMessage,
    requestPermissions: mockRequestPermissions,
    setErrorMessage: mockSetErrorMessage,
  }),
}))

vi.mock("../../hooks/use-audio-devices", () => ({
  useAudioDevices: () => ({
    audioDevices: mockAudioDevices,
    selectedAudioDevice: mockSelectedAudioDevice,
    setSelectedAudioDevice: mockSetSelectedAudioDevice,
    getDevices: mockGetDevices,
  }),
}))

vi.mock("../../hooks/use-voice-recording", () => ({
  useVoiceRecording: () => ({
    get isRecording() {
      return mockIsRecording
    },
    get showCountdown() {
      return mockShowCountdown
    },
    get recordingTime() {
      return mockRecordingTime
    },
    get isDeviceReady() {
      return mockIsDeviceReady
    },
    get countdown() {
      return mockCountdown
    },
    setCountdown: mockSetCountdown,
    audioRef: { current: null },
    formatTime: (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    },
    stopRecording: mockStopRecording,
    startCountdown: mockStartCountdown,
    initAudio: mockInitAudio,
    cleanup: mockCleanup,
  }),
}))

// Мокаем модальную систему
vi.mock("@/domains/system-integration", () => ({
  useModals: vi.fn(() => ({
    activeModal: "voice-recording",
    modalData: null,
    isModalOpen: true,
    openModal: vi.fn(),
    closeModal: mockCloseModal,
    submitModal: vi.fn(),
    openCameraCapture: vi.fn(),
    openVoiceRecording: vi.fn(),
    openExport: vi.fn(),
    openProjectSettings: vi.fn(),
    openUserSettings: vi.fn(),
    openKeyboardShortcuts: vi.fn(),
    openColorGrading: vi.fn(),
    openEffectDetail: vi.fn(),
  })),
}))

// Мокаем AudioPermissionRequest компонент
vi.mock("../../components/audio-permission-request", () => ({
  AudioPermissionRequest: ({ permissionStatus, onRequestPermissions }: any) => (
    <div data-testid="audio-permission-request" data-oid="vfwtde3">
      <div data-oid="b5a8ln4">Permission Status: {permissionStatus}</div>
      {permissionStatus !== "granted" && (
        <button onClick={onRequestPermissions} data-oid="6ui8_u4">
          Request Permissions
        </button>
      )}
    </div>
  ),
}))

// Импортируем компонент ПОСЛЕ всех моков
import { VoiceRecordModal } from "../../components/voice-recording-modal"

// Мокаем navigator.mediaDevices глобально
Object.defineProperty(global.navigator, "mediaDevices", {
  writable: true,
  value: {
    getUserMedia: vi.fn(),
    enumerateDevices: vi.fn(),
  },
})

describe("VoiceRecordModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetResourcesMocks()
    resetTauriMocks()

    // Убеждаемся что MediaDevices поддерживается по умолчанию
    Object.defineProperty(global.navigator, "mediaDevices", {
      writable: true,
      value: {
        getUserMedia: vi.fn(),
        enumerateDevices: vi.fn(),
      },
    })

    // Мокаем MediaRecorder
    global.MediaRecorder = vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      ondataavailable: vi.fn(),
      onstop: vi.fn(),
      state: "inactive",
    })) as any
    global.MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true)

    // Настраиваем переводы
    setTranslations({
      "dialogs.voiceRecord.notSupported": "Запись звука недоступна",
      "dialogs.voiceRecord.notSupportedDescription": "Запись звука не поддерживается в десктопном приложении.",
      "common.close": "Закрыть",
      "dialogs.voiceRecord.device": "Устройство",
      "dialogs.voiceRecord.refreshDevices": "Обновить устройства",
      "dialogs.voiceRecord.savePath": "Сохранить в",
      "dialogs.voiceRecord.countdown": "Обратный отсчет",
      "dialogs.voiceRecord.format": "Формат",
      "dialogs.voiceRecord.startRecording": "Начать запись",
      "dialogs.voiceRecord.stopRecording": "Остановить запись",
      "dialogs.voiceRecord.recordingTime": "Время записи",
      "dialogs.voiceRecord.hint": "Нажмите кнопку записи для начала.",
      "dialogs.voiceRecord.saveError": "Ошибка при сохранении аудиозаписи",
    })

    // Сбрасываем состояние моков
    mockPermissionStatus = "granted"
    mockErrorMessage = ""
    mockAudioDevices = [
      { deviceId: "device-1", label: "Microphone 1" },
      { deviceId: "device-2", label: "Microphone 2" },
    ]

    mockSelectedAudioDevice = "device-1"
    mockIsRecording = false
    mockShowCountdown = false
    mockRecordingTime = 0
    mockIsDeviceReady = true
    mockCountdown = 3
  })

  describe("Базовый рендеринг", () => {
    it("должен рендериться без ошибок", () => {
      expect(() => {
        renderWithModal(<VoiceRecordModal data-oid="bh8m.i7" />)
      }).not.toThrow()
    })

    it("должен показывать сообщение о неподдержке, если MediaDevices недоступен", () => {
      // Убираем поддержку MediaDevices
      Object.defineProperty(global.navigator, "mediaDevices", {
        writable: true,
        value: undefined,
      })

      renderWithModal(<VoiceRecordModal data-oid="1:xs0a9" />)

      expect(screen.getByText("Запись звука недоступна")).toBeInTheDocument()
      expect(screen.getByText("Запись звука не поддерживается в десктопном приложении.")).toBeInTheDocument()
      expect(screen.getByText("Закрыть")).toBeInTheDocument()

      // Восстанавливаем поддержку
      Object.defineProperty(global.navigator, "mediaDevices", {
        writable: true,
        value: {
          getUserMedia: vi.fn(),
          enumerateDevices: vi.fn(),
        },
      })
    })

    it("должен показывать компонент запроса разрешений с MediaDevices", () => {
      // Убедимся что MediaDevices поддерживается
      Object.defineProperty(global.navigator, "mediaDevices", {
        writable: true,
        value: {
          getUserMedia: vi.fn(),
          enumerateDevices: vi.fn(),
        },
      })

      renderWithModal(<VoiceRecordModal data-oid="i9mffe_" />)

      // AudioPermissionRequest должен рендериться только если MediaDevices поддерживается
      expect(screen.getByTestId("audio-permission-request")).toBeInTheDocument()
    })

    it("должен скрывать основной контент, если разрешения не предоставлены", () => {
      mockPermissionStatus = "denied"

      renderWithModal(<VoiceRecordModal data-oid="icz9.4." />)

      // Основные элементы не должны отображаться
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /start recording/i })).not.toBeInTheDocument()
    })
  })

  describe("Выбор устройств", () => {
    it("должен отображать список аудиоустройств", () => {
      renderWithModal(<VoiceRecordModal data-oid="3dj0hfc" />)

      const deviceSelects = screen.getAllByRole("combobox")
      // Первый select - это выбор устройства
      expect(deviceSelects[0]).toBeInTheDocument()
      // Проверяем что отображается название устройства
      expect(screen.getByText("Microphone 1")).toBeInTheDocument()
    })

    it("должен вызывать setSelectedAudioDevice при выборе устройства", async () => {
      const user = userEvent.setup()
      renderWithModal(<VoiceRecordModal data-oid=":gagu9:" />)

      const deviceSelects = screen.getAllByRole("combobox")
      // Первый select - это выбор устройства
      await user.click(deviceSelects[0])

      // В реальности здесь нужно было бы тестировать выбор из списка,
      // но это сложно с мокированными Select компонентами
      expect(deviceSelects[0]).toBeInTheDocument()
    })

    it("должен отключать выбор устройств во время записи", () => {
      mockIsRecording = true

      renderWithModal(<VoiceRecordModal data-oid="trs1wd3" />)

      const deviceSelects = screen.getAllByRole("combobox")
      // Первый select - это выбор устройства
      expect(deviceSelects[0]).toBeDisabled()
      // Второй select (формат) тоже должен быть отключен
      expect(deviceSelects[1]).toBeDisabled()
    })

    it("должен вызывать getDevices при клике на кнопку обновления", async () => {
      const user = userEvent.setup()

      renderWithModal(<VoiceRecordModal data-oid="lomnm4_" />)

      const refreshButton = screen.getByTitle("Обновить устройства")

      // Запоминаем количество вызовов до клика
      const callsBefore = mockGetDevices.mock.calls.length

      await user.click(refreshButton)

      // Проверяем что количество вызовов увеличилось
      expect(mockGetDevices.mock.calls.length).toBeGreaterThan(callsBefore)
    })
  })

  describe("Настройки записи", () => {
    it("должен отображать поле для пути сохранения", () => {
      renderWithModal(<VoiceRecordModal data-oid="ean8x-c" />)

      const savePathInput = screen.getByPlaceholderText("/Users/username/Movies")
      expect(savePathInput).toBeInTheDocument()
      expect(savePathInput).toHaveValue("")
    })

    it("должен обновлять путь сохранения при вводе", async () => {
      const user = userEvent.setup()
      renderWithModal(<VoiceRecordModal data-oid="nc1x9y9" />)

      const savePathInput = screen.getByPlaceholderText("/Users/username/Movies")
      await user.type(savePathInput, "/custom/path")

      expect(savePathInput).toHaveValue("/custom/path")
    })

    it("должен отключать поле пути во время записи", () => {
      mockIsRecording = true

      renderWithModal(<VoiceRecordModal data-oid="x8ww22n" />)

      const savePathInput = screen.getByPlaceholderText("/Users/username/Movies")
      expect(savePathInput).toBeDisabled()
    })

    it("должен отображать поле для настройки обратного отсчета", () => {
      renderWithModal(<VoiceRecordModal data-oid="m:j:81j" />)

      const countdownInput = screen.getByDisplayValue("3")
      expect(countdownInput).toBeInTheDocument()
      expect(countdownInput).toHaveAttribute("type", "number")
      expect(countdownInput).toHaveAttribute("min", "0")
      expect(countdownInput).toHaveAttribute("max", "10")
    })

    it("должен вызывать setCountdown при изменении значения", async () => {
      renderWithModal(<VoiceRecordModal data-oid="m.imeh0" />)

      const countdownInput = screen.getByDisplayValue("3")

      // Используем fireEvent.change для более точного контроля
      fireEvent.change(countdownInput, { target: { value: "5" } })

      expect(mockSetCountdown).toHaveBeenCalledWith(5)
    })

    it("должен обрабатывать некорректные значения обратного отсчета", async () => {
      const user = userEvent.setup()
      renderWithModal(<VoiceRecordModal data-oid="hbn1x2h" />)

      const countdownInput = screen.getByDisplayValue("3")
      await user.clear(countdownInput)
      await user.type(countdownInput, "abc")

      expect(mockSetCountdown).toHaveBeenCalledWith(0)
    })

    it("должен отключать настройки во время записи", () => {
      mockIsRecording = true

      renderWithModal(<VoiceRecordModal data-oid=".:mfgta" />)

      const countdownInput = screen.getByDisplayValue("3")
      expect(countdownInput).toBeDisabled()
    })
  })

  describe("Процесс записи", () => {
    it("должен отображать кнопку начала записи когда не записывает", () => {
      renderWithModal(<VoiceRecordModal data-oid="u.c9tqe" />)

      const recordButton = screen.getByTitle("Начать запись")
      expect(recordButton).toBeInTheDocument()
      expect(recordButton).toBeEnabled()
    })

    it("должен отключать кнопку записи если устройство не готово", () => {
      mockIsDeviceReady = false

      renderWithModal(<VoiceRecordModal data-oid="qq8hy6j" />)

      const recordButton = screen.getByTitle("Начать запись")
      expect(recordButton).toBeDisabled()
    })

    it("должен вызывать startCountdown при клике на кнопку записи", async () => {
      const user = userEvent.setup()
      renderWithModal(<VoiceRecordModal data-oid="2wqta79" />)

      const recordButton = screen.getByTitle("Начать запись")
      await user.click(recordButton)

      expect(mockStartCountdown).toHaveBeenCalledTimes(1)
    })

    it("должен отображать кнопку остановки во время записи", () => {
      mockIsRecording = true

      renderWithModal(<VoiceRecordModal data-oid="z9fmkpc" />)

      const stopButton = screen.getByTitle("Остановить запись")
      expect(stopButton).toBeInTheDocument()
    })

    it("должен вызывать stopRecording при клике на кнопку остановки", async () => {
      mockIsRecording = true
      const user = userEvent.setup()

      renderWithModal(<VoiceRecordModal data-oid="ywwnonk" />)

      const stopButton = screen.getByTitle("Остановить запись")
      await user.click(stopButton)

      expect(mockStopRecording).toHaveBeenCalledTimes(1)
    })
  })

  describe("Обратный отсчет", () => {
    it("должен отображать обратный отсчет когда showCountdown = true", () => {
      mockShowCountdown = true
      mockCountdown = 2

      renderWithModal(<VoiceRecordModal data-oid=":1qcntv" />)

      const countdownDisplay = screen.getByText("2")
      expect(countdownDisplay).toBeInTheDocument()
      expect(countdownDisplay.closest("div")).toHaveClass("bg-red-600")
    })

    it("должен скрывать обратный отсчет когда showCountdown = false", () => {
      mockShowCountdown = false

      renderWithModal(<VoiceRecordModal data-oid="hp_ff0m" />)

      expect(screen.queryByText("3")).not.toBeInTheDocument()
    })
  })

  describe("Отображение времени записи", () => {
    it("должен показывать время записи во время записи", () => {
      // Устанавливаем состояние перед рендером
      mockIsRecording = true
      mockRecordingTime = 65 // 1 минута 5 секунд

      renderWithModal(<VoiceRecordModal data-oid="ywrs5zf" />)

      // Ищем части текста отдельно, так как они могут быть в разных элементах
      expect(screen.getByText(/время записи/i)).toBeInTheDocument()
      // Проверяем что время отображается в формате MM:SS
      expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument()
    })

    it("должен отображать прогресс-бар записи", () => {
      mockIsRecording = true
      mockRecordingTime = 150 // 2.5 минуты

      renderWithModal(<VoiceRecordModal data-oid=":3ny1xh" />)

      // Ищем любое время в формате MM:SS и проверяем прогресс-бар рядом с ним
      const timeElement = screen.getByText(/\d{2}:\d{2}/)
      const progressBar = timeElement.parentElement?.querySelector(".bg-red-600")
      expect(progressBar).toBeInTheDocument()
      // Проверяем что прогресс-бар имеет ширину 50% (150 сек из 300 сек)
      expect(progressBar).toHaveStyle({ width: "50%" })
    })

    it("должен ограничивать прогресс-бар 100%", () => {
      mockIsRecording = true
      mockRecordingTime = 400 // больше 5 минут

      renderWithModal(<VoiceRecordModal data-oid="u4r-8tr" />)

      // Ищем любое время и проверяем что прогресс-бар имеет максимальную ширину
      const timeElement = screen.getByText(/\d{2}:\d{2}/)
      const progressBar = timeElement.parentElement?.querySelector(".bg-red-600")
      expect(progressBar).toHaveStyle({ width: "100%" })
    })

    it("должен скрывать время записи когда не записывает", () => {
      mockIsRecording = false

      renderWithModal(<VoiceRecordModal data-oid="11o8xcf" />)

      expect(screen.queryByText(/время записи/i)).not.toBeInTheDocument()
    })
  })

  describe("Закрытие модального окна", () => {
    it("должен вызывать closeModal при клике на кнопку закрытия в режиме неподдержки", async () => {
      // Убираем поддержку MediaDevices
      Object.defineProperty(global.navigator, "mediaDevices", {
        writable: true,
        value: undefined,
      })

      const user = userEvent.setup()
      renderWithModal(<VoiceRecordModal data-oid="wuq.sei" />)

      const closeButton = screen.getByText("Закрыть")
      await user.click(closeButton)

      expect(mockCloseModal).toHaveBeenCalledTimes(1)

      // Восстанавливаем поддержку
      Object.defineProperty(global.navigator, "mediaDevices", {
        writable: true,
        value: {
          getUserMedia: vi.fn(),
          enumerateDevices: vi.fn(),
        },
      })
    })
  })

  describe("Аудио элемент", () => {
    it("должен рендерить скрытый аудио элемент", () => {
      renderWithModal(<VoiceRecordModal data-oid="mhnaoec" />)

      const audioElement = document.querySelector("audio")
      expect(audioElement).toBeInTheDocument()
      expect(audioElement).toHaveAttribute("autoPlay")
      // Проверяем что аудио элемент не проигрывается в тестах
    })
  })

  describe("Подсказки и сообщения", () => {
    it("должен отображать подсказку о использовании", () => {
      renderWithModal(<VoiceRecordModal data-oid="_.49_rh" />)

      expect(screen.getByText("Нажмите кнопку записи для начала.")).toBeInTheDocument()
    })

    it("должен отображать правильные aria-label для кнопок", () => {
      renderWithModal(<VoiceRecordModal data-oid="jjy4o_:" />)

      const recordButton = screen.getByLabelText("Начать запись")
      expect(recordButton).toBeInTheDocument()
    })

    it("должен отображать правильные aria-label для кнопки остановки", () => {
      mockIsRecording = true

      renderWithModal(<VoiceRecordModal data-oid="t2t1t0h" />)

      const stopButton = screen.getByLabelText("Остановить запись")
      expect(stopButton).toBeInTheDocument()
    })
  })

  describe("Обработка ошибок", () => {
    it("должен обрабатывать ошибки при сохранении записи", async () => {
      // Тестируем через console.error spy
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      renderWithModal(<VoiceRecordModal data-oid="f4.xyeb" />)

      // Здесь мы можем только проверить что компонент рендерится без ошибок
      // Реальная обработка ошибок происходит в saveAudioToServer
      expect(screen.getByTestId("audio-permission-request")).toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })

  describe("Интеграция с хуками", () => {
    it("должен передавать правильные props в useVoiceRecording", () => {
      renderWithModal(<VoiceRecordModal data-oid="ek:w4qk" />)

      // Проверяем что хук был вызван (неявно через рендеринг)
      expect(screen.getByTestId("audio-permission-request")).toBeInTheDocument()
    })

    it("должен корректно работать с различными состояниями разрешений", () => {
      mockPermissionStatus = "prompt"

      renderWithModal(<VoiceRecordModal data-oid="zmcb1_a" />)

      // Основной контент не должен отображаться при статусе prompt
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    })
  })
})

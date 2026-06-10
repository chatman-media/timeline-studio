/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from "@testing-library/react"
import type { ResolutionOption } from "@timeline-studio/domains/shared/types/project"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CameraSettings } from "../../components/camera-settings"

// Мокируем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Мокируем компоненты Select из @timeline-studio/ui/components/select
vi.mock("@timeline-studio/ui/components/select", () => ({
  Select: ({ children, value, onValueChange, disabled }: any) => (
    <div data-testid="select" data-value={value} data-disabled={disabled} data-oid="-r9_2k4">
      <button
        onClick={() => !disabled && onValueChange?.("test-value")}
        data-testid="select-trigger"
        data-oid="rwzvkl7"
      >
        Select
      </button>
      {children}
    </div>
  ),

  SelectContent: ({ children, ...props }: any) => (
    <div data-testid="select-content" {...props} data-oid="e6-4251">
      {children}
    </div>
  ),

  SelectItem: ({ children, value, ...props }: any) => (
    <div data-testid="select-item" data-value={value} {...props} data-oid="9s8.1yy">
      {children}
    </div>
  ),

  SelectTrigger: ({ children, ...props }: any) => (
    <div data-testid="select-trigger-component" {...props} data-oid="st0jht4">
      {children}
    </div>
  ),

  SelectValue: (props: any) => <div data-testid="select-value" {...props} data-oid="ot6ve-3" />,
}))

// Мокируем компонент Input из @timeline-studio/ui/components/input
vi.mock("@timeline-studio/ui/components/input", () => ({
  Input: ({ value, onChange, ...props }: any) => (
    <input data-testid="input" value={value} onChange={onChange} {...props} data-oid="kr11pl0" />
  ),
}))

describe("CameraSettings", () => {
  // Тестовые данные
  const devices = [
    { deviceId: "device-1", label: "Camera 1" },
    { deviceId: "device-2", label: "Camera 2" },
  ]

  const audioDevices = [
    { deviceId: "audio-1", label: "Microphone 1" },
    { deviceId: "audio-2", label: "Microphone 2" },
  ]

  const resolutions: ResolutionOption[] = [
    { value: "1280x720", label: "1280x720 (HD)", width: 1280, height: 720 },
    {
      value: "1920x1080",
      label: "1920x1080 (Full HD)",
      width: 1920,
      height: 1080,
    },
  ]

  const frameRates = [24, 25, 30]

  // Моки для обработчиков событий
  const mockOnDeviceChange = vi.fn()
  const mockOnAudioDeviceChange = vi.fn()
  const mockOnResolutionChange = vi.fn()
  const mockOnFrameRateChange = vi.fn()
  const mockOnCountdownChange = vi.fn()

  // Пропсы по умолчанию
  const defaultProps = {
    devices,
    selectedDevice: "device-1",
    onDeviceChange: mockOnDeviceChange,
    audioDevices,
    selectedAudioDevice: "audio-1",
    onAudioDeviceChange: mockOnAudioDeviceChange,
    availableResolutions: resolutions,
    selectedResolution: "1920x1080",
    onResolutionChange: mockOnResolutionChange,
    supportedResolutions: resolutions,
    frameRate: 30,
    onFrameRateChange: mockOnFrameRateChange,
    supportedFrameRates: frameRates,
    countdown: 3,
    onCountdownChange: mockOnCountdownChange,
    isRecording: false,
    isLoadingCapabilities: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders all settings correctly", () => {
    render(<CameraSettings {...defaultProps} data-oid="lhc1kaw" />)

    // Проверяем, что все селекты отображаются
    expect(screen.getAllByTestId("select")).toHaveLength(4)

    // Проверяем, что отображается поле ввода для обратного отсчета
    const countdownInput = screen.getByTestId("input")
    expect(countdownInput).toBeInTheDocument()
    expect(countdownInput).toHaveValue(3)
  })

  it("calls onDeviceChange when device select changes", () => {
    render(<CameraSettings {...defaultProps} data-oid="v:.05ou" />)

    // Находим селект устройств и кликаем по нему
    const selects = screen.getAllByTestId("select-trigger")
    act(() => {
      act(() => {
        fireEvent.click(selects[0])
      })
    })

    // Проверяем, что обработчик был вызван
    expect(mockOnDeviceChange).toHaveBeenCalledWith("test-value")
  })

  it("calls onAudioDeviceChange when audio device select changes", () => {
    render(<CameraSettings {...defaultProps} data-oid="vke.izo" />)

    // Находим селект аудио устройств и кликаем по нему
    const selects = screen.getAllByTestId("select-trigger")
    act(() => {
      act(() => {
        fireEvent.click(selects[1])
      })
    })

    // Проверяем, что обработчик был вызван
    expect(mockOnAudioDeviceChange).toHaveBeenCalledWith("test-value")
  })

  it("calls onResolutionChange when resolution select changes", () => {
    render(<CameraSettings {...defaultProps} data-oid="efnm3zr" />)

    // Находим селект разрешений и кликаем по нему
    const selects = screen.getAllByTestId("select-trigger")
    act(() => {
      act(() => {
        fireEvent.click(selects[2])
      })
    })

    // Проверяем, что обработчик был вызван
    expect(mockOnResolutionChange).toHaveBeenCalledWith("test-value")
  })

  it("calls onFrameRateChange when frame rate select changes", () => {
    render(<CameraSettings {...defaultProps} data-oid="1vp3zs." />)

    // Находим селект частоты кадров и кликаем по нему
    const selects = screen.getAllByTestId("select-trigger")
    act(() => {
      act(() => {
        fireEvent.click(selects[3])
      })
    })

    // Проверяем, что обработчик был вызван с числовым значением
    expect(mockOnFrameRateChange).toHaveBeenCalledWith(Number.NaN) // В тесте мы передаем "test-value", которое не преобразуется в число
  })

  it("calls onCountdownChange when countdown input changes", () => {
    render(<CameraSettings {...defaultProps} data-oid="dhn4186" />)

    // Находим поле ввода обратного отсчета и изменяем его значение
    const countdownInput = screen.getByTestId("input")
    act(() => {
      act(() => {
        fireEvent.change(countdownInput, { target: { value: "5" } })
      })
    })

    // Проверяем, что обработчик был вызван
    expect(mockOnCountdownChange).toHaveBeenCalledWith(5)
  })

  it("disables controls when isRecording is true", () => {
    render(<CameraSettings {...defaultProps} isRecording data-oid="_jp-6-z" />)

    // Проверяем, что все селекты отключены
    const selects = screen.getAllByTestId("select")
    selects.forEach((select) => {
      expect(select).toHaveAttribute("data-disabled", "true")
    })

    // Проверяем, что поле ввода обратного отсчета отключено
    const countdownInput = screen.getByTestId("input")
    expect(countdownInput).toHaveAttribute("disabled")
  })

  it("shows loading state when isLoadingCapabilities is true", () => {
    render(<CameraSettings {...defaultProps} isLoadingCapabilities data-oid="zu4hm72" />)

    // Проверяем, что отображаются элементы загрузки
    const loadingElements = screen.getAllByText("dialogs.cameraCapture.determiningCapabilities")
    expect(loadingElements.length).toBeGreaterThan(0)
  })
})
